import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Clock, CheckCircle, XCircle, Code, Send, RotateCcw, Eye, EyeOff, Lock, Home, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import CodeRunner, { CodeLanguage, RunSummary } from "@/components/CodeRunner";

interface TestCase { input: string; expected_output: string; }

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
  assessment: { problems: Problem[]; timer_minutes: number; instructions: string; };
  mode: "practice" | "exam";
  skill: string;
  onReset: () => void;
  onRetry?: () => void;
  onSaveResult?: (result: any) => void;
}

const ProgrammingAssessment = ({ assessment, mode, skill, onReset, onRetry, onSaveResult }: Props) => {
  const { problems, timer_minutes } = assessment;
  const [currentProblem, setCurrentProblem] = useState(0);
  const [code, setCode] = useState<Record<number, string>>({});
  const [language, setLanguage] = useState<CodeLanguage>("python");
  const [hiddenResults, setHiddenResults] = useState<Record<number, RunSummary>>({});
  const [submitted, setSubmitted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showSolution, setShowSolution] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(timer_minutes * 60);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (mode !== "exam" || submitted) return;
    if (timeLeft <= 0) { setAutoSubmitted(true); handleFinish(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [mode, submitted, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleFinish = () => { setLocked(true); setSubmitted(true); };

  useEffect(() => {
    if (submitted && !resultSaved && onSaveResult) {
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      // Score by hidden test pass-rate when available, fallback to "submitted any code"
      const evaluated = problems.map((_, i) => hiddenResults[i]);
      const hasAnyEval = evaluated.some(Boolean);
      let correct = 0;
      let totalTestCases = 0;
      let passedTestCases = 0;
      problems.forEach((p, i) => {
        const r = hiddenResults[i];
        if (r) {
          totalTestCases += r.total;
          passedTestCases += r.passed;
          if (r.all_passed) correct++;
        }
      });
      const submitted_count = problems.filter((_, i) => code[i]?.trim()).length;
      const finalCorrect = hasAnyEval ? correct : submitted_count;
      const scorePct = hasAnyEval
        ? (totalTestCases > 0 ? (passedTestCases / totalTestCases) * 100 : 0)
        : (submitted_count / problems.length) * 100;
      onSaveResult({
        totalQuestions: problems.length,
        attempted: submitted_count,
        correct: finalCorrect,
        wrong: submitted_count - finalCorrect,
        unanswered: problems.length - submitted_count,
        scorePercentage: scorePct,
        finalScore: finalCorrect,
        passed: scorePct >= 50,
        timeTakenSeconds: timeTaken,
      });
      setResultSaved(true);
    }
  }, [submitted]);

  const p = problems[currentProblem];
  const finishLabel = mode === "exam" ? "Finish Test" : "Finish Practice";
  const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

  if (submitted) {
    const submittedCount = problems.filter((_, i) => code[i]?.trim()).length;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {autoSubmitted && (
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardContent className="pt-4 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" /><span>Time expired — code was automatically submitted.</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">📝 Assessment Complete</CardTitle>
            <CardDescription>Review your solutions below</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div><div className="text-2xl font-bold">{problems.length}</div><div className="text-xs text-muted-foreground">Total Problems</div></div>
              <div><div className="text-2xl font-bold text-green-600">{submittedCount}</div><div className="text-xs text-muted-foreground">Submitted</div></div>
              <div><div className="text-2xl font-bold text-muted-foreground">{problems.length - submittedCount}</div><div className="text-xs text-muted-foreground">Unanswered</div></div>
              <div><div className="text-2xl font-bold flex items-center justify-center gap-1"><Clock className="h-5 w-5" />{formatTime(timeTaken)}</div><div className="text-xs text-muted-foreground">Time Taken</div></div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button onClick={onRetry} variant="default"><RotateCcw className="h-4 w-4 mr-2" /> Retry Practice</Button>
          <Button onClick={onReset} variant="outline"><BookOpen className="h-4 w-4 mr-2" /> Continue Learning</Button>
          <Button onClick={onReset} variant="secondary"><Home className="h-4 w-4 mr-2" /> Skill Dashboard</Button>
        </div>

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
              <div className="bg-muted/50 p-3 rounded-lg text-sm"><strong>Explanation:</strong> {prob.solution_explanation}</div>
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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {problems.map((_, i) => (
            <Button key={i} variant={i === currentProblem ? "default" : "outline"} size="sm" onClick={() => setCurrentProblem(i)}>Problem {i + 1}</Button>
          ))}
          {locked && <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {mode === "exam" && (
            <Badge variant={timeLeft < 600 ? "destructive" : "outline"} className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatTime(timeLeft)}
            </Badge>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm"><Send className="h-4 w-4 mr-1" /> {finishLabel}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to finish?</AlertDialogTitle>
                <AlertDialogDescription>
                  {problems.some((_, i) => !code[i]?.trim()) && (
                    <span className="block mb-2 text-orange-500 font-medium">⚠ Some problems have no code submitted yet.</span>
                  )}
                  This will submit all your code and end the assessment.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel — Continue Test</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinish}>Yes — Finish Now</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:max-h-[600px] overflow-auto">
          <CardHeader>
            <div className="flex items-center gap-2"><Badge variant="outline" className="capitalize">{p.difficulty_label}</Badge></div>
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

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Code className="h-4 w-4" /> Your Solution</CardTitle>
            <CardDescription className="text-xs">Sandboxed: 2s CPU · 256 MB · no network/FS</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <Textarea
              value={code[currentProblem] || ""}
              onChange={e => !locked && setCode(prev => ({ ...prev, [currentProblem]: e.target.value }))}
              placeholder={`Write your code here...`}
              className={`flex-1 min-h-[280px] font-mono text-xs resize-none ${locked ? "opacity-70 cursor-not-allowed" : ""}`}
              disabled={locked}
            />
            <CodeRunner
              language={language}
              onLanguageChange={setLanguage}
              showLanguageSelector
              sourceCode={code[currentProblem] || ""}
              testCases={p.sample_tests}
              buttonLabel="Run Sample Tests"
              variant="run"
            />
            <CodeRunner
              language={language}
              sourceCode={code[currentProblem] || ""}
              testCases={p.hidden_tests}
              buttonLabel="Submit (Hidden Tests)"
              variant="submit"
              onComplete={(summary) =>
                setHiddenResults(prev => ({ ...prev, [currentProblem]: summary }))
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgrammingAssessment;
