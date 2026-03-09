import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle, XCircle, Code, Play, Send, RotateCcw, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

interface TestCase {
  input: string;
  expected_output: string;
}

interface Problem {
  title: string;
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  sample_tests: TestCase[];
  hidden_tests: TestCase[];
  solution_code: string;
  solution_explanation: string;
  common_mistakes: string[];
  difficulty_label: string;
}

interface Props {
  assessment: {
    problems: Problem[];
    timer_minutes: number;
    instructions: string;
  };
  mode: "practice" | "exam";
  skill: string;
  onReset: () => void;
}

const ProgrammingAssessment = ({ assessment, mode, skill, onReset }: Props) => {
  const { problems, timer_minutes } = assessment;
  const [currentProblem, setCurrentProblem] = useState(0);
  const [code, setCode] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showSolution, setShowSolution] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(timer_minutes * 60);

  useEffect(() => {
    if (mode !== "exam" || submitted) return;
    if (timeLeft <= 0) { setSubmitted(true); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [mode, submitted, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const p = problems[currentProblem];

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">📝 Assessment Complete</CardTitle>
            <CardDescription>Review your solutions below</CardDescription>
          </CardHeader>
        </Card>

        {problems.map((prob, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Problem {i + 1}</Badge>
                <Badge variant="outline" className="capitalize">{prob.difficulty_label}</Badge>
              </div>
              <CardTitle className="text-lg">{prob.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">Your Code:</h4>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap">{code[i] || "(No code submitted)"}</pre>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Correct Solution ({skill}):
                </h4>
                <pre className="bg-green-500/5 border border-green-500/20 p-3 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap">{prob.solution_code}</pre>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <strong>Explanation:</strong> {prob.solution_explanation}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Common Mistakes:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {prob.common_mistakes.map((m, j) => <li key={j}>{m}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Hidden Test Cases:</h4>
                <div className="space-y-2">
                  {prob.hidden_tests.map((tc, j) => (
                    <div key={j} className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted p-2 rounded font-mono"><span className="text-muted-foreground">Input:</span><br />{tc.input}</div>
                      <div className="bg-muted p-2 rounded font-mono"><span className="text-muted-foreground">Expected:</span><br />{tc.expected_output}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={onReset} className="w-full"><RotateCcw className="h-4 w-4 mr-2" /> Take Another Assessment</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {problems.map((_, i) => (
            <Button key={i} variant={i === currentProblem ? "default" : "outline"} size="sm" onClick={() => setCurrentProblem(i)}>
              Problem {i + 1}
            </Button>
          ))}
        </div>
        {mode === "exam" && (
          <Badge variant={timeLeft < 600 ? "destructive" : "outline"} className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatTime(timeLeft)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Problem description */}
        <Card className="lg:max-h-[600px] overflow-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">{p.difficulty_label}</Badge>
            </div>
            <CardTitle className="text-lg">{p.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><p className="whitespace-pre-wrap">{p.description}</p></div>
            <div><h4 className="font-semibold">Input Format</h4><p className="text-muted-foreground">{p.input_format}</p></div>
            <div><h4 className="font-semibold">Output Format</h4><p className="text-muted-foreground">{p.output_format}</p></div>
            <div><h4 className="font-semibold">Constraints</h4><p className="text-muted-foreground font-mono text-xs">{p.constraints}</p></div>

            {p.sample_tests.map((tc, i) => (
              <div key={i} className="space-y-1">
                <h4 className="font-semibold">Sample {i + 1}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted p-2 rounded font-mono text-xs"><span className="text-muted-foreground">Input:</span><br />{tc.input}</div>
                  <div className="bg-muted p-2 rounded font-mono text-xs"><span className="text-muted-foreground">Output:</span><br />{tc.expected_output}</div>
                </div>
              </div>
            ))}

            {mode === "practice" && (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setShowSolution(prev => ({ ...prev, [currentProblem]: !prev[currentProblem] }))}>
                  {showSolution[currentProblem] ? <><EyeOff className="h-4 w-4 mr-1" /> Hide Solution</> : <><Eye className="h-4 w-4 mr-1" /> Show Solution</>}
                </Button>
                {showSolution[currentProblem] && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-3">
                    <pre className="bg-green-500/5 border border-green-500/20 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap">{p.solution_code}</pre>
                    <p className="text-muted-foreground text-sm">{p.solution_explanation}</p>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Code editor */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Code className="h-4 w-4" /> Your Solution ({skill})</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <Textarea
              value={code[currentProblem] || ""}
              onChange={e => setCode(prev => ({ ...prev, [currentProblem]: e.target.value }))}
              placeholder={`Write your ${skill} code here...`}
              className="flex-1 min-h-[350px] font-mono text-xs resize-none"
            />
            {mode === "exam" && (
              <Button variant="destructive" onClick={() => setSubmitted(true)}>
                <Send className="h-4 w-4 mr-2" /> Submit All Solutions
              </Button>
            )}
            {mode === "practice" && (
              <Button onClick={() => setSubmitted(true)}>
                <Send className="h-4 w-4 mr-2" /> View Results
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgrammingAssessment;
