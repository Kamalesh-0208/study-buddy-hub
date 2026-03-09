import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, Send, RotateCcw, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  question_number: number;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  explanation: string;
  difficulty_label: string;
}

interface Props {
  assessment: {
    questions: Question[];
    timer_minutes: number;
    total_questions: number;
    pass_mark: number;
    scoring_rules: string;
    instructions: string;
  };
  mode: "practice" | "exam";
  onReset: () => void;
}

const MCQAssessment = ({ assessment, mode, onReset }: Props) => {
  const { questions, timer_minutes, pass_mark } = assessment;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timer_minutes * 60);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Timer for exam mode
  useEffect(() => {
    if (mode !== "exam" || submitted) return;
    if (timeLeft <= 0) {
      setAutoSubmitted(true);
      handleFinish();
      return;
    }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [mode, submitted, timeLeft]);

  const selectAnswer = (qIdx: number, option: string) => {
    if (submitted || locked) return;
    setAnswers(prev => ({ ...prev, [qIdx]: option }));
    if (mode === "practice") {
      setShowExplanation(prev => ({ ...prev, [qIdx]: true }));
    }
  };

  const calculateScore = useCallback(() => {
    let correct = 0, wrong = 0, unattempted = 0;
    questions.forEach((q, i) => {
      if (!answers[i]) unattempted++;
      else if (answers[i] === q.correct_answer) correct++;
      else wrong++;
    });
    const negativeMarks = wrong * 0.25;
    const finalScore = correct - negativeMarks;
    const attempted = questions.length - unattempted;
    return { correct, wrong, unattempted, attempted, negativeMarks, finalScore, total: questions.length, passed: finalScore >= pass_mark };
  }, [answers, questions, pass_mark]);

  const handleFinish = () => {
    setLocked(true);
    setSubmitted(true);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const q = questions[current];
  const result = submitted ? calculateScore() : null;
  const finishLabel = mode === "exam" ? "Finish Test" : "Finish Practice";

  if (submitted && result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Auto-submit notice */}
        {autoSubmitted && (
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardContent className="pt-4 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>Time expired — your answers were automatically submitted.</span>
            </CardContent>
          </Card>
        )}

        {/* Result Card */}
        <Card className={result.passed ? "border-green-500/50" : "border-destructive/50"}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{result.passed ? "🎉 PASSED" : "❌ FAILED"}</CardTitle>
            <CardDescription>Assessment Result</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div><div className="text-2xl font-bold">{result.total}</div><div className="text-xs text-muted-foreground">Total Questions</div></div>
              <div><div className="text-2xl font-bold">{result.attempted}</div><div className="text-xs text-muted-foreground">Attempted</div></div>
              <div><div className="text-2xl font-bold text-green-600">{result.correct}</div><div className="text-xs text-muted-foreground">Correct</div></div>
              <div><div className="text-2xl font-bold text-destructive">{result.wrong}</div><div className="text-xs text-muted-foreground">Wrong</div></div>
              <div><div className="text-2xl font-bold text-muted-foreground">{result.unattempted}</div><div className="text-xs text-muted-foreground">Unanswered</div></div>
              <div><div className="text-2xl font-bold text-orange-500">-{result.negativeMarks.toFixed(2)}</div><div className="text-xs text-muted-foreground">Negative Marks</div></div>
            </div>
            <div className="mt-4 pt-4 border-t text-center">
              <div className="text-3xl font-bold">{result.finalScore.toFixed(2)}<span className="text-lg text-muted-foreground">/{result.total}</span></div>
              <div className="text-sm text-muted-foreground">Final Score</div>
              <Badge className={`mt-2 ${result.passed ? "bg-green-600" : "bg-destructive"}`}>
                {result.passed ? "PASS" : "FAIL"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Review */}
        <Card>
          <CardHeader><CardTitle>Answer Review</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {questions.map((q, i) => {
                  const userAns = answers[i];
                  const isCorrect = userAns === q.correct_answer;
                  return (
                    <Card key={i} className={`p-4 ${!userAns ? "border-muted" : isCorrect ? "border-green-500/30" : "border-destructive/30"}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant="outline" className="shrink-0">Q{i + 1}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{q.difficulty_label}</Badge>
                        {userAns && (isCorrect ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />)}
                        {!userAns && <Badge variant="secondary" className="text-xs">Unanswered</Badge>}
                      </div>
                      <p className="text-sm font-medium mb-2">{q.question_text}</p>
                      <div className="grid gap-1.5 text-sm mb-3">
                        {(["A", "B", "C", "D"] as const).map(opt => (
                          <div key={opt} className={`px-3 py-1.5 rounded-md border ${opt === q.correct_answer ? "bg-green-500/10 border-green-500/30 font-medium" : opt === userAns && opt !== q.correct_answer ? "bg-destructive/10 border-destructive/30" : "border-transparent"}`}>
                            <span className="font-semibold mr-2">{opt}.</span>{q.options[opt]}
                          </div>
                        ))}
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Button onClick={onReset} className="w-full"><RotateCcw className="h-4 w-4 mr-2" /> Take Another Assessment</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Question {current + 1} / {questions.length}
          {locked && <Badge variant="secondary" className="ml-2 text-xs"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {mode === "exam" && (
            <Badge variant={timeLeft < 300 ? "destructive" : "outline"} className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatTime(timeLeft)}
            </Badge>
          )}
        </div>
      </div>
      <Progress value={((current + 1) / questions.length) * 100} className="h-1.5" />

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Q{current + 1}</Badge>
                <Badge variant="secondary" className="capitalize text-xs">{q.difficulty_label}</Badge>
              </div>
              <CardTitle className="text-base mt-2">{q.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["A", "B", "C", "D"] as const).map(opt => {
                const selected = answers[current] === opt;
                const showResult = mode === "practice" && showExplanation[current];
                const isCorrect = opt === q.correct_answer;
                return (
                  <button key={opt} onClick={() => selectAnswer(current, opt)}
                    disabled={locked || (mode === "practice" && showExplanation[current])}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                      locked ? "opacity-70 cursor-not-allowed" : ""
                    } ${
                      showResult
                        ? isCorrect ? "border-green-500 bg-green-500/10" : selected ? "border-destructive bg-destructive/10" : "border-border"
                        : selected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                    }`}>
                    <span className="font-semibold mr-3">{opt}.</span>{q.options[opt]}
                  </button>
                );
              })}

              {mode === "practice" && showExplanation[current] && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 rounded-lg bg-muted/50 border text-sm">
                  <div className="flex items-center gap-2 mb-1 font-semibold">
                    {answers[current] === q.correct_answer
                      ? <><CheckCircle className="h-4 w-4 text-green-500" /> Correct!</>
                      : <><XCircle className="h-4 w-4 text-destructive" /> Incorrect — Answer: {q.correct_answer}</>}
                  </div>
                  <p className="text-muted-foreground">{q.explanation}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Send className="h-4 w-4 mr-1" /> {finishLabel}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to finish?</AlertDialogTitle>
                <AlertDialogDescription>
                  {Object.keys(answers).length < questions.length && (
                    <span className="block mb-2 text-orange-500 font-medium">
                      ⚠ You have {questions.length - Object.keys(answers).length} unanswered question(s).
                    </span>
                  )}
                  This will submit all your answers and end the assessment. You cannot make changes after finishing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel — Continue Test</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinish}>Yes — Finish Now</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {current < questions.length - 1 && (
            <Button size="sm" onClick={() => setCurrent(current + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Question navigator grid */}
      {mode === "exam" && (
        <Card className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded text-xs font-medium border transition-colors ${
                  i === current ? "bg-primary text-primary-foreground" : answers[i] ? "bg-primary/10 border-primary/30" : "bg-muted"
                }`}>
                {i + 1}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MCQAssessment;
