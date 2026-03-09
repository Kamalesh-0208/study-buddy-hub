import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Clock, RotateCcw, Send, Eye, EyeOff, FileCode, Palette,
  CheckCircle, XCircle, AlertTriangle, Lightbulb, Copy, Lock, Home, BookOpen
} from "lucide-react";
import { motion } from "framer-motion";

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
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [reqCheckPassed, setReqCheckPassed] = useState<boolean | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (mode !== "exam" || submitted) return;
    if (timeLeft <= 0) { setAutoSubmitted(true); handleFinish(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [mode, submitted, timeLeft]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 3600).toString().padStart(2, "0")}:${Math.floor((s % 3600) / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const previewDoc = useCallback(() => {
    const cssInjected = htmlCode.replace(/<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/?>/i, `<style>${cssCode}</style>`);
    if (!cssInjected.includes("<style>")) return htmlCode.replace("</head>", `<style>${cssCode}</style></head>`);
    return cssInjected;
  }, [htmlCode, cssCode]);

  useEffect(() => {
    if (!iframeRef.current || !showPreview) return;
    const doc = iframeRef.current.contentDocument;
    if (doc) { doc.open(); doc.write(previewDoc()); doc.close(); }
  }, [previewDoc, showPreview]);

  const evaluateSubmission = useCallback(() => {
    const htmlLower = htmlCode.toLowerCase();
    const cssLower = cssCode.toLowerCase();
    const totalCriteria = challenge.evaluation_criteria.length + challenge.requirements.length;
    let criteriaMatched = 0;
    let allReqsMet = true;

    challenge.requirements.forEach(req => {
      const ruleL = req.rule.toLowerCase();
      if (ruleL.includes("flexbox") && (cssLower.includes("display: flex") || cssLower.includes("display:flex"))) criteriaMatched++;
      else if (ruleL.includes("grid") && (cssLower.includes("display: grid") || cssLower.includes("display:grid"))) criteriaMatched++;
      else if (ruleL.includes("hover") && cssLower.includes(":hover")) criteriaMatched++;
      else if (ruleL.includes("responsive") && cssLower.includes("@media")) criteriaMatched++;
      else if (ruleL.includes("external css") || ruleL.includes("external stylesheet")) criteriaMatched++;
      else if (ruleL.includes("custom font") && (cssLower.includes("font-family") || htmlLower.includes("fonts.googleapis"))) criteriaMatched++;
      else {
        const keywords = ruleL.split(/\s+/).filter(w => w.length > 3);
        if (keywords.some(kw => htmlLower.includes(kw) || cssLower.includes(kw))) criteriaMatched++;
        else allReqsMet = false;
      }
    });

    challenge.evaluation_criteria.forEach(criterion => {
      const cl = criterion.toLowerCase();
      if (cl.includes("layout") && (cssLower.includes("flex") || cssLower.includes("grid"))) criteriaMatched++;
      else if (cl.includes("color") && cssLower.includes("color")) criteriaMatched++;
      else if (cl.includes("spacing") && (cssLower.includes("padding") || cssLower.includes("margin"))) criteriaMatched++;
      else if (cl.includes("responsive") && cssLower.includes("@media")) criteriaMatched++;
      else if (cl.includes("component") || cl.includes("structure")) {
        if ((htmlLower.match(/<[a-z]/g) || []).length > 5) criteriaMatched++;
      } else criteriaMatched += 0.5;
    });

    const htmlLines = htmlCode.split("\n").filter(l => l.trim()).length;
    const cssLines = cssCode.split("\n").filter(l => l.trim()).length;
    const contentBonus = Math.min(20, (htmlLines + cssLines) / 2);
    const score = Math.min(100, Math.round((criteriaMatched / Math.max(1, totalCriteria)) * 80 + contentBonus));

    setSimilarityScore(score);
    setReqCheckPassed(allReqsMet);
    return { score, allReqsMet };
  }, [htmlCode, cssCode, challenge]);

  const handleFinish = () => {
    setLocked(true);
    setSubmitted(true);
    evaluateSubmission();
  };

  useEffect(() => {
    if (submitted && similarityScore !== null && !resultSaved && onSaveResult) {
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      const passed = similarityScore >= 80 && reqCheckPassed;
      onSaveResult({
        totalQuestions: 1,
        attempted: 1,
        correct: passed ? 1 : 0,
        wrong: passed ? 0 : 1,
        unanswered: 0,
        scorePercentage: similarityScore,
        finalScore: similarityScore,
        passed,
        timeTakenSeconds: timeTaken,
        similarityScore,
        requirementsMet: reqCheckPassed,
      });
      setResultSaved(true);
    }
  }, [submitted, similarityScore]);

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);
  const finishLabel = mode === "exam" ? "Finish Test" : "Finish Practice";
  const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
  const formatTimeTaken = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  if (submitted && similarityScore !== null) {
    const passed = similarityScore >= 80 && reqCheckPassed;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {autoSubmitted && (
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardContent className="pt-4 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" /><span>Time expired — code was automatically submitted.</span>
            </CardContent>
          </Card>
        )}

        <Card className={passed ? "border-green-500/50" : "border-destructive/50"}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{passed ? "🎉 PASSED" : "❌ FAILED"}</CardTitle>
            <CardDescription>HTML/CSS Assessment Result</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className={`text-3xl font-bold ${similarityScore >= 80 ? "text-green-600" : "text-destructive"}`}>{similarityScore}%</div>
                <div className="text-xs text-muted-foreground">Similarity Score</div>
              </div>
              <div>
                <div className="flex justify-center">
                  {reqCheckPassed ? <CheckCircle className="h-8 w-8 text-green-500" /> : <XCircle className="h-8 w-8 text-destructive" />}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Requirements</div>
              </div>
              <div>
                <div className={`text-3xl font-bold ${passed ? "text-green-600" : "text-destructive"}`}>{passed ? "PASS" : "FAIL"}</div>
                <div className="text-xs text-muted-foreground">Result</div>
              </div>
              <div>
                <div className="text-2xl font-bold flex items-center justify-center gap-1"><Clock className="h-5 w-5" /></div>
                <div className="text-xs text-muted-foreground">{formatTimeTaken(timeTaken)}</div>
              </div>
            </div>
            {!passed && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                {similarityScore < 80 ? "Webpage needs ≥80% similarity to pass." : "Some implementation requirements were not followed."}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button onClick={onRetry} variant="default"><RotateCcw className="h-4 w-4 mr-2" /> Retry Practice</Button>
          <Button onClick={onReset} variant="outline"><BookOpen className="h-4 w-4 mr-2" /> Continue Learning</Button>
          <Button onClick={onReset} variant="secondary"><Home className="h-4 w-4 mr-2" /> Skill Dashboard</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Your Submission</CardTitle></CardHeader>
          <CardContent>
            <iframe ref={iframeRef} className="w-full h-[300px] border rounded-lg bg-background" title="Your Submission" sandbox="allow-scripts" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Reference Solution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><FileCode className="h-4 w-4" /> Reference HTML</h4>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(challenge.reference_html)}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">{challenge.reference_html}</pre>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Palette className="h-4 w-4" /> Reference CSS</h4>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(challenge.reference_css)}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">{challenge.reference_css}</pre>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-sm"><strong>Layout Explanation:</strong> {challenge.layout_explanation}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <AlertDialogTitle>Are you sure you want to finish?</AlertDialogTitle>
                <AlertDialogDescription>This will submit your code, lock the editor, and evaluate your webpage.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel — Continue Coding</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinish}>Yes — Finish Now</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-semibold text-xs mb-1">Spacing</h4>
              <p className="text-xs text-muted-foreground">{challenge.design_spec.spacing_notes}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-semibold text-xs mb-1">Responsive</h4>
              <p className="text-xs text-muted-foreground">{challenge.design_spec.responsive_notes}</p>
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
            {challenge.requirements.map((req, i) => (<Badge key={i} variant="outline" className="text-xs py-1">{req.rule}</Badge>))}
          </div>
          <p className="text-xs text-destructive mt-2">⚠ Not following these rules results in automatic FAIL</p>
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
                <li key={i} className="flex items-start gap-2"><Lightbulb className="h-3 w-3 mt-1 text-primary shrink-0" /><span>{h}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {showSolution && mode === "practice" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Reference HTML</CardTitle></CardHeader>
            <CardContent><pre className="bg-muted p-3 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">{challenge.reference_html}</pre></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Reference CSS</CardTitle></CardHeader>
            <CardContent><pre className="bg-muted p-3 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">{challenge.reference_css}</pre></CardContent>
          </Card>
        </motion.div>
      )}

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
                <Textarea value={htmlCode} onChange={e => !locked && setHtmlCode(e.target.value)}
                  className={`min-h-[400px] font-mono text-xs resize-none bg-[hsl(var(--muted))] border-0 ${locked ? "opacity-70 cursor-not-allowed" : ""}`}
                  spellCheck={false} disabled={locked} />
              </TabsContent>
              <TabsContent value="css" className="flex-1">
                <Textarea value={cssCode} onChange={e => !locked && setCssCode(e.target.value)}
                  className={`min-h-[400px] font-mono text-xs resize-none bg-[hsl(var(--muted))] border-0 ${locked ? "opacity-70 cursor-not-allowed" : ""}`}
                  spellCheck={false} disabled={locked} />
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
              <iframe ref={iframeRef} className="w-full min-h-[400px] border rounded-lg bg-background" title="Live Preview" sandbox="allow-scripts" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HTMLCSSAssessment;
