import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Clock, RotateCcw, Send, Eye, EyeOff, FileCode, Palette, CheckCircle, XCircle,
  AlertTriangle, Lightbulb, Copy, Lock, Home, BookOpen, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import CodeEditor from "@/components/htmlcss/CodeEditor";
import ReferenceImage from "@/components/htmlcss/ReferenceImage";
import SubmissionUpload, { ScreenshotSubmission } from "@/components/htmlcss/SubmissionUpload";
import {
  scoreLayout, scoreCSS, scoreVisual, combineScores, buildDoc, type ScoreBreakdown,
} from "@/components/htmlcss/evaluator";
import { useToast } from "@/hooks/use-toast";

interface DesignSpec {
  layout_description: string;
  color_scheme: string[];
  typography: string;
  components: string[];
  spacing_notes: string;
  responsive_notes: string;
}
interface Requirement { rule: string; description: string; }
interface HTMLCSSChallenge {
  title: string;
  design_description: string;
  design_spec: DesignSpec;
  requirements: Requirement[];
  reference_html: string;
  reference_css: string;
  layout_explanation: string;
  hints: string[];
  evaluation_criteria: string[];
  difficulty_label: string;
}
interface Props {
  assessment: { challenge: HTMLCSSChallenge; timer_minutes: number; instructions: string; };
  mode: "practice" | "exam";
  onReset: () => void;
  onRetry?: () => void;
  onSaveResult?: (result: any) => void;
}

const HTMLCSSAssessment = ({ assessment, mode, onReset, onRetry, onSaveResult }: Props) => {
  const { challenge, timer_minutes } = assessment;
  const { toast } = useToast();

  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
  <title>${challenge.title}</title>
</head>
<body>
  
</body>
</html>`);
  const [cssCode, setCssCode] = useState(`/* styles.css */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: sans-serif; }
`);
  const [activeTab, setActiveTab] = useState("html");
  const [showPreview, setShowPreview] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timer_minutes * 60);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [renders, setRenders] = useState<{ student: string; reference: string } | null>(null);
  const [missingComponents, setMissingComponents] = useState(false);

  const [submission, setSubmission] = useState<ScreenshotSubmission>({
    studentName: "",
    registerNumber: "",
    taskName: challenge.title,
    file: null,
    fileDataUrl: null,
    hasHtml: false,
    hasCss: false,
    hasOutput: false,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef(Date.now());

  // Reference doc (HTML+CSS combined) — used for image render and evaluation
  const referenceDoc = useMemo(
    () => buildDoc(challenge.reference_html, challenge.reference_css),
    [challenge.reference_html, challenge.reference_css],
  );
  const studentDoc = useMemo(() => buildDoc(htmlCode, cssCode), [htmlCode, cssCode]);

  // Timer
  useEffect(() => {
    if (mode !== "exam" || submitted) return;
    if (timeLeft <= 0) { setAutoSubmitted(true); void handleFinish(); return; }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [mode, submitted, timeLeft]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 3600).toString().padStart(2, "0")}:${Math.floor((s % 3600) / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Live preview
  useEffect(() => {
    if (!iframeRef.current || !showPreview) return;
    const doc = iframeRef.current.contentDocument;
    if (doc) { doc.open(); doc.write(studentDoc); doc.close(); }
  }, [studentDoc, showPreview]);

  // Submission completeness check (form only — does not block visual scoring)
  const submissionComplete =
    submission.studentName.trim() !== "" &&
    submission.registerNumber.trim() !== "" &&
    submission.taskName.trim() !== "" &&
    !!submission.file &&
    submission.hasHtml && submission.hasCss && submission.hasOutput;

  const handleFinish = useCallback(async () => {
    // If submission components missing → automatic FAIL
    if (!submissionComplete && !autoSubmitted) {
      setMissingComponents(true);
      setLocked(true);
      setSubmitted(true);
      setBreakdown({ layout: 0, css: 0, visual: 0, final: 0, passed: false });
      return;
    }

    setLocked(true);
    setEvaluating(true);
    try {
      const layout = scoreLayout(htmlCode, challenge.reference_html);
      const css = scoreCSS(cssCode, challenge.reference_css);
      const visual = await scoreVisual(studentDoc, referenceDoc);
      const combined = combineScores(layout, css, visual.similarity);
      // If submission was missing → cap fail (already handled above), else use real score
      setBreakdown(combined);
      setRenders({ student: visual.studentDataUrl, reference: visual.referenceDataUrl });
    } catch (e) {
      console.error("Evaluation failed", e);
      toast({ title: "Evaluation error", description: "Could not render your page for visual scoring.", variant: "destructive" });
      // Fall back to layout+css only
      const layout = scoreLayout(htmlCode, challenge.reference_html);
      const css = scoreCSS(cssCode, challenge.reference_css);
      setBreakdown(combineScores(layout, css, 0));
    } finally {
      setEvaluating(false);
      setSubmitted(true);
    }
  }, [htmlCode, cssCode, challenge, studentDoc, referenceDoc, submissionComplete, autoSubmitted, toast]);

  // Save result once
  useEffect(() => {
    if (submitted && breakdown && !resultSaved && onSaveResult) {
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      onSaveResult({
        totalQuestions: 1,
        attempted: 1,
        correct: breakdown.passed ? 1 : 0,
        wrong: breakdown.passed ? 0 : 1,
        unanswered: 0,
        scorePercentage: breakdown.final,
        finalScore: breakdown.final,
        passed: breakdown.passed,
        timeTakenSeconds: timeTaken,
        similarityScore: breakdown.visual,
        requirementsMet: !missingComponents,
      });
      setResultSaved(true);
    }
  }, [submitted, breakdown, resultSaved, onSaveResult, missingComponents]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const finishLabel = mode === "exam" ? "Finish Test" : "Finish Practice";
  const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
  const formatTimeTaken = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  // ================ RESULT VIEW ================
  if (submitted && breakdown) {
    const passed = breakdown.passed && !missingComponents;
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {autoSubmitted && (
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardContent className="pt-4 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>Time expired — code was automatically submitted.</span>
            </CardContent>
          </Card>
        )}

        {missingComponents && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4 flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-destructive" />
              <span>
                Submission screenshot or required components missing — automatic FAIL.
              </span>
            </CardContent>
          </Card>
        )}

        <Card className={passed ? "border-green-500/50" : "border-destructive/50"}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{passed ? "🎉 PASSED" : "❌ FAILED"}</CardTitle>
            <CardDescription>HTML/CSS Recreation Result • Pass mark ≥ 80%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="text-center">
              <div className={`text-5xl font-bold ${passed ? "text-green-600" : "text-destructive"}`}>
                {breakdown.final}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Weighted final score</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ScoreBar label="Layout Structure" weight={40} score={breakdown.layout} />
              <ScoreBar label="CSS Correctness" weight={30} score={breakdown.css} />
              <ScoreBar label="Visual Similarity" weight={30} score={breakdown.visual} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center pt-2">
              <Stat label="Result" value={passed ? "PASS" : "FAIL"} ok={passed} />
              <Stat label="Components" value={missingComponents ? "Missing" : "Complete"} ok={!missingComponents} />
              <Stat label="Time Taken" value={formatTimeTaken(timeTaken)} />
              <Stat label="Pass Threshold" value="80%" />
            </div>
          </CardContent>
        </Card>

        {renders && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Reference</CardTitle></CardHeader>
              <CardContent><img src={renders.reference} alt="Reference render" className="w-full rounded border" /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Your Output</CardTitle></CardHeader>
              <CardContent><img src={renders.student} alt="Student render" className="w-full rounded border" /></CardContent>
            </Card>
          </div>
        )}

        {submission.fileDataUrl && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Submitted Screenshot</CardTitle></CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">
                {submission.studentName} · {submission.registerNumber} · {submission.taskName}
              </div>
              <img src={submission.fileDataUrl} alt="Submission" className="max-h-96 rounded border" />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button onClick={onRetry} variant="default"><RotateCcw className="h-4 w-4 mr-2" /> Retry</Button>
          <Button onClick={onReset} variant="outline"><BookOpen className="h-4 w-4 mr-2" /> Continue Learning</Button>
          <Button onClick={onReset} variant="secondary"><Home className="h-4 w-4 mr-2" /> Skill Dashboard</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Reference Solution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SolutionBlock title="Reference HTML" code={challenge.reference_html} icon={<FileCode className="h-4 w-4" />} onCopy={copyToClipboard} />
            <SolutionBlock title="Reference CSS" code={challenge.reference_css} icon={<Palette className="h-4 w-4" />} onCopy={copyToClipboard} />
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <strong>Layout Explanation:</strong> {challenge.layout_explanation}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ================ EVALUATING OVERLAY ================
  if (evaluating) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
        <h3 className="text-lg font-semibold">Evaluating your webpage…</h3>
        <p className="text-sm text-muted-foreground">Comparing layout, CSS, and visual similarity to the reference design.</p>
      </div>
    );
  }

  // ================ MAIN EDITOR VIEW ================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{challenge.difficulty_label}</Badge>
          <h2 className="font-semibold text-sm">{challenge.title}</h2>
          {locked && <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {mode === "exam" && (
            <Badge variant={timeLeft < 900 ? "destructive" : "outline"} className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" /> {formatTime(timeLeft)}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <><EyeOff className="h-3 w-3 mr-1" /> Hide Preview</> : <><Eye className="h-3 w-3 mr-1" /> Show Preview</>}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm"><Send className="h-3 w-3 mr-1" /> {finishLabel}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit and evaluate?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your code will be locked and scored on Layout (40%), CSS (30%), and Visual similarity (30%).
                  {!submissionComplete && (
                    <span className="block mt-2 text-destructive font-medium">
                      ⚠ Submission screenshot or required fields are incomplete — this will result in automatic FAIL.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinish}>Yes — Submit</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Reference Image (rendered from reference HTML/CSS) */}
      <ReferenceImage doc={referenceDoc} title={challenge.title} />

      {/* Design brief */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">📐 Design Brief</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{challenge.design_description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-semibold text-xs mb-1">Color Scheme</h4>
              <div className="flex gap-2 flex-wrap">
                {challenge.design_spec.color_scheme.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: c }} />
                    <span className="text-xs font-mono">{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-semibold text-xs mb-1">Typography</h4>
              <p className="text-xs text-muted-foreground">{challenge.design_spec.typography}</p>
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-semibold text-xs mb-1">Components to Build</h4>
            <div className="flex flex-wrap gap-1.5">
              {challenge.design_spec.components.map((comp, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{comp}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" /> Required Implementation Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {challenge.requirements.map((req, i) => (
              <Badge key={i} variant="outline" className="text-xs py-1">{req.rule}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {mode === "practice" && (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowHints(!showHints)}>
            <Lightbulb className="h-3 w-3 mr-1" /> {showHints ? "Hide" : "Show"} Hints
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSolution(!showSolution)}>
            <Eye className="h-3 w-3 mr-1" /> {showSolution ? "Hide" : "Show"} Solution
          </Button>
        </div>
      )}

      {showHints && mode === "practice" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <ul className="space-y-1 text-sm">
              {challenge.hints.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Lightbulb className="h-3 w-3 mt-1 text-primary shrink-0" /><span>{h}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {showSolution && mode === "practice" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <SolutionBlock title="Reference HTML" code={challenge.reference_html} icon={<FileCode className="h-4 w-4" />} onCopy={copyToClipboard} />
          <SolutionBlock title="Reference CSS" code={challenge.reference_css} icon={<Palette className="h-4 w-4" />} onCopy={copyToClipboard} />
        </motion.div>
      )}

      {/* Editor + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-orange-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">VS Code</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-2">
                <TabsTrigger value="html" className="text-xs gap-1"><FileCode className="h-3 w-3" /> index.html</TabsTrigger>
                <TabsTrigger value="css" className="text-xs gap-1"><Palette className="h-3 w-3" /> styles.css</TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="flex-1">
                <CodeEditor value={htmlCode} language="html" onChange={setHtmlCode} readOnly={locked} />
              </TabsContent>
              <TabsContent value="css" className="flex-1">
                <CodeEditor value={cssCode} language="css" onChange={setCssCode} readOnly={locked} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {showPreview && (
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" /> Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <iframe
                ref={iframeRef}
                className="w-full min-h-[440px] border rounded-lg bg-background"
                title="Live Preview"
                sandbox="allow-scripts"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submission upload */}
      <SubmissionUpload
        taskName={challenge.title}
        value={submission}
        onChange={setSubmission}
        disabled={locked}
      />
    </div>
  );
};

// ---- small helpers (kept in same file) ----
const ScoreBar = ({ label, weight, score }: { label: string; weight: number; score: number }) => (
  <div className="space-y-1.5">
    <div className="flex items-baseline justify-between">
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">Weight {weight}%</span>
    </div>
    <Progress value={score} className="h-2" />
    <div className="text-right text-xs font-mono">{score}%</div>
  </div>
);

const Stat = ({ label, value, ok }: { label: string; value: string; ok?: boolean }) => (
  <div>
    <div className={`text-lg font-bold ${ok === undefined ? "" : ok ? "text-green-600" : "text-destructive"}`}>
      {ok === true && <CheckCircle className="inline h-5 w-5 mr-1" />}
      {ok === false && <XCircle className="inline h-5 w-5 mr-1" />}
      {value}
    </div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

const SolutionBlock = ({
  title, code, icon, onCopy,
}: { title: string; code: string; icon: React.ReactNode; onCopy: (s: string) => void }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-semibold flex items-center gap-2">{icon} {title}</h4>
      <Button variant="ghost" size="sm" onClick={() => onCopy(code)}>
        <Copy className="h-3 w-3 mr-1" /> Copy
      </Button>
    </div>
    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">{code}</pre>
  </div>
);

export default HTMLCSSAssessment;
