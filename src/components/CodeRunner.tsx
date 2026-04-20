import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play, CheckCircle2, XCircle, Clock, Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type CodeLanguage = "python" | "cpp" | "c" | "java";

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface RunResult {
  test_case_index: number;
  input: string;
  expected_output: string;
  actual_output: string;
  stderr: string;
  compile_output: string;
  status: string;
  verdict: string;
  passed: boolean;
  time_seconds: number | null;
  memory_kb: number | null;
}

export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  all_passed: boolean;
  avg_time_seconds: number;
  max_memory_kb: number;
}

interface Props {
  language: CodeLanguage;
  onLanguageChange?: (l: CodeLanguage) => void;
  showLanguageSelector?: boolean;
  sourceCode: string;
  testCases: TestCase[];
  buttonLabel?: string;
  variant?: "run" | "submit";
  onComplete?: (summary: RunSummary, results: RunResult[]) => void;
}

const LANG_LABELS: Record<CodeLanguage, string> = {
  python: "Python 3",
  cpp: "C++",
  c: "C",
  java: "Java",
};

const CodeRunner = ({
  language,
  onLanguageChange,
  showLanguageSelector,
  sourceCode,
  testCases,
  buttonLabel,
  variant = "run",
  onComplete,
}: Props) => {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [results, setResults] = useState<RunResult[]>([]);

  const handleRun = async () => {
    if (!sourceCode.trim()) {
      toast({ title: "No code", description: "Write some code first.", variant: "destructive" });
      return;
    }
    if (!testCases?.length) {
      toast({ title: "No test cases", description: "Nothing to evaluate.", variant: "destructive" });
      return;
    }
    setRunning(true);
    setSummary(null);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("execute-code", {
        body: {
          language,
          source_code: sourceCode,
          test_cases: testCases,
          cpu_time_limit: 2,
          memory_limit: 262_144,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummary(data.summary);
      setResults(data.results);
      onComplete?.(data.summary, data.results);
      toast({
        title: data.summary.all_passed ? "All tests passed 🎉" : `${data.summary.passed}/${data.summary.total} passed`,
        description: `Avg time ${data.summary.avg_time_seconds.toFixed(3)}s · Max mem ${(data.summary.max_memory_kb / 1024).toFixed(1)} MB`,
      });
    } catch (e: any) {
      toast({ title: "Execution failed", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {showLanguageSelector && onLanguageChange && (
          <Select value={language} onValueChange={(v) => onLanguageChange(v as CodeLanguage)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANG_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button onClick={handleRun} disabled={running} variant={variant === "submit" ? "default" : "secondary"} size="sm">
          {running ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
          {buttonLabel ?? (variant === "submit" ? "Submit" : "Run Code")}
        </Button>
        {summary && (
          <>
            <Badge variant={summary.all_passed ? "default" : "destructive"}>
              {summary.passed}/{summary.total} passed
            </Badge>
            <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{summary.avg_time_seconds.toFixed(3)}s avg</Badge>
            <Badge variant="outline" className="gap-1"><Cpu className="h-3 w-3" />{(summary.max_memory_kb / 1024).toFixed(1)} MB</Badge>
          </>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <Card key={r.test_case_index} className={r.passed ? "border-green-500/30" : "border-destructive/30"}>
              <CardContent className="p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    {r.passed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    Test {r.test_case_index + 1} — {r.status}
                  </div>
                  <div className="flex gap-2 text-muted-foreground">
                    {r.time_seconds !== null && <span>{r.time_seconds.toFixed(3)}s</span>}
                    {r.memory_kb !== null && <span>{(r.memory_kb / 1024).toFixed(1)} MB</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Block title="Input" body={r.input} />
                  <Block title="Expected" body={r.expected_output} />
                  <Block title="Your Output" body={r.actual_output || "(empty)"} highlight={!r.passed} />
                </div>
                {(r.stderr || r.compile_output) && (
                  <pre className="bg-destructive/10 text-destructive p-2 rounded font-mono whitespace-pre-wrap text-[11px]">
                    {r.compile_output || r.stderr}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const Block = ({ title, body, highlight }: { title: string; body: string; highlight?: boolean }) => (
  <div>
    <div className="text-muted-foreground mb-1">{title}</div>
    <pre className={`p-2 rounded font-mono whitespace-pre-wrap break-words ${highlight ? "bg-destructive/10" : "bg-muted"}`}>
      {body}
    </pre>
  </div>
);

export default CodeRunner;
