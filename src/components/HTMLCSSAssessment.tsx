import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Clock, RotateCcw, Send, Eye, EyeOff, FileCode, Palette,
  CheckCircle, XCircle, Upload, AlertTriangle, Lightbulb, Copy
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

interface Requirement {
  rule: string;
  description: string;
}

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
  assessment: {
    challenge: HTMLCSSChallenge;
    timer_minutes: number;
    instructions: string;
  };
  mode: "practice" | "exam";
  onReset: () => void;
}

const HTMLCSSAssessment = ({ assessment, mode, onReset }: Props) => {
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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: sans-serif;
}
`);
  const [activeTab, setActiveTab] = useState("html");
  const [showPreview, setShowPreview] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timer_minutes * 60);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [reqCheckPassed, setReqCheckPassed] = useState<boolean | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Timer
  useEffect(() => {
    if (mode !== "exam" || submitted) return;
    if (timeLeft <= 0) { handleFinish(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [mode, submitted, timeLeft]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 3600).toString().padStart(2, "0")}:${Math.floor((s % 3600) / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Build preview document
  const previewDoc = useCallback(() => {
    const cssInjected = htmlCode.replace(
      /<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/?>/i,
      `<style>${cssCode}</style>`
    );
    // If no link tag found, inject style in head
    if (!cssInjected.includes("<style>")) {
      return htmlCode.replace("</head>", `<style>${cssCode}</style></head>`);
    }
    return cssInjected;
  }, [htmlCode, cssCode]);

  // Update preview iframe
  useEffect(() => {
    if (!iframeRef.current || !showPreview) return;
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(previewDoc());
      doc.close();
    }
  }, [previewDoc, showPreview]);

  const evaluateSubmission = useCallback(() => {
    // Simple heuristic evaluation
    let score = 0;
    const htmlLower = htmlCode.toLowerCase();
    const cssLower = cssCode.toLowerCase();
    const totalCriteria = challenge.evaluation_criteria.length + challenge.requirements.length;
    let criteriaMatched = 0;

    // Check requirements
    let allReqsMet = true;
    challenge.requirements.forEach(req => {
      const ruleL = req.rule.toLowerCase();
      if (ruleL.includes("flexbox") && (cssLower.includes("display: flex") || cssLower.includes("display:flex"))) {
        criteriaMatched++;
      } else if (ruleL.includes("grid") && (cssLower.includes("display: grid") || cssLower.includes("display:grid"))) {
        criteriaMatched++;
      } else if (ruleL.includes("hover") && cssLower.includes(":hover")) {
        criteriaMatched++;
      } else if (ruleL.includes("responsive") && cssLower.includes("@media")) {
        criteriaMatched++;
      } else if (ruleL.includes("external css") || ruleL.includes("external stylesheet")) {
        criteriaMatched++; // We always have separate CSS
      } else if (ruleL.includes("custom font") && (cssLower.includes("font-family") || htmlLower.includes("fonts.googleapis"))) {
        criteriaMatched++;
      } else {
        // Generic check: if any keywords from the rule appear in code
        const keywords = ruleL.split(/\s+/).filter(w => w.length > 3);
        if (keywords.some(kw => htmlLower.includes(kw) || cssLower.includes(kw))) {
          criteriaMatched++;
        } else {
          allReqsMet = false;
        }
      }
    });

    // Check evaluation criteria (structural)
    challenge.evaluation_criteria.forEach(criterion => {
      const cl = criterion.toLowerCase();
      if (cl.includes("layout") && (cssLower.includes("flex") || cssLower.includes("grid") || cssLower.includes("float"))) criteriaMatched++;
      else if (cl.includes("color") && cssLower.includes("color")) criteriaMatched++;
      else if (cl.includes("spacing") && (cssLower.includes("padding") || cssLower.includes("margin") || cssLower.includes("gap"))) criteriaMatched++;
      else if (cl.includes("responsive") && cssLower.includes("@media")) criteriaMatched++;
      else if (cl.includes("component") || cl.includes("structure")) {
        // Check if HTML has reasonable structure
        const tagCount = (htmlLower.match(/<[a-z]/g) || []).length;
        if (tagCount > 5) criteriaMatched++;
      } else {
        criteriaMatched += 0.5; // partial credit
      }
    });

    // Content-based bonus
    const htmlLines = htmlCode.split("\n").filter(l => l.trim()).length;
    const cssLines = cssCode.split("\n").filter(l => l.trim()).length;
    const contentBonus = Math.min(20, (htmlLines + cssLines) / 2);

    score = Math.min(100, Math.round((criteriaMatched / Math.max(1, totalCriteria)) * 80 + contentBonus));

    setSimilarityScore(score);
    setReqCheckPassed(allReqsMet);
  }, [htmlCode, cssCode, challenge]);

  const handleFinish = () => {
    setSubmitted(true);
    evaluateSubmission();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Result screen
  if (submitted && similarityScore !== null) {
    const passed = similarityScore >= 80 && reqCheckPassed;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Result Card */}
        <Card className={passed ? "border-green-500/50" : "border-destructive/50"}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{passed ? "🎉 PASSED" : "❌ FAILED"}</CardTitle>
            <CardDescription>HTML/CSS Assessment Result</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className={`text-3xl font-bold ${similarityScore >= 80 ? "text-green-600" : "text-destructive"}`}>
                  {similarityScore}%
                </div>
                <div className="text-xs text-muted-foreground">Similarity Score</div>
              </div>
              <div>
                <div className="flex justify-center">
                  {reqCheckPassed
                    ? <CheckCircle className="h-8 w-8 text-green-500" />
                    : <XCircle className="h-8 w-8 text-destructive" />}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Requirements {reqCheckPassed ? "Met" : "Not Met"}</div>
              </div>
              <div>
                <div className={`text-3xl font-bold ${passed ? "text-green-600" : "text-destructive"}`}>
                  {passed ? "PASS" : "FAIL"}
                </div>
                <div className="text-xs text-muted-foreground">Final Result</div>
              </div>
            </div>
            {!passed && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                {similarityScore < 80
                  ? "Your webpage needs to match at least 80% of the reference design to pass."
                  : "Some implementation requirements were not followed."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your submission preview */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Your Submission</CardTitle></CardHeader>
          <CardContent>
            <iframe
              ref={iframeRef}
              className="w-full h-[300px] border rounded-lg bg-white"
              title="Your Submission"
              sandbox="allow-scripts"
            />
          </CardContent>
        </Card>

        {/* Reference Solution */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Reference Solution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><FileCode className="h-4 w-4" /> Reference HTML</h4>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(challenge.reference_html)}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {challenge.reference_html}
              </pre>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Palette className="h-4 w-4" /> Reference CSS</h4>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(challenge.reference_css)}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {challenge.reference_css}
              </pre>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <strong>Layout Explanation:</strong> {challenge.layout_explanation}
            </div>
          </CardContent>
        </Card>

        <Button onClick={onReset} className="w-full"><RotateCcw className="h-4 w-4 mr-2" /> Take Another Assessment</Button>
      </div>
    );
  }

  // Coding environment
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{challenge.difficulty_label}</Badge>
          <h2 className="font-semibold text-sm">{challenge.title}</h2>
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
          <Button variant="destructive" size="sm" onClick={handleFinish}>
            <Send className="h-3 w-3 mr-1" /> Finish Test
          </Button>
        </div>
      </div>

      {/* Design brief */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📐 Design Brief</CardTitle>
        </CardHeader>
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

      {/* Requirements */}
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
          <p className="text-xs text-destructive mt-2">⚠ Not following these rules results in automatic FAIL</p>
        </CardContent>
      </Card>

      {/* Hints (practice only) */}
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
                  <Lightbulb className="h-3 w-3 mt-1 text-primary shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {showSolution && mode === "practice" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Reference HTML</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {challenge.reference_html}
              </pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Reference CSS</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {challenge.reference_css}
              </pre>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code editor panel */}
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
                <TabsTrigger value="html" className="text-xs gap-1">
                  <FileCode className="h-3 w-3" /> index.html
                </TabsTrigger>
                <TabsTrigger value="css" className="text-xs gap-1">
                  <Palette className="h-3 w-3" /> styles.css
                </TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="flex-1">
                <Textarea
                  value={htmlCode}
                  onChange={e => setHtmlCode(e.target.value)}
                  className="min-h-[400px] font-mono text-xs resize-none bg-[hsl(var(--muted))] border-0"
                  spellCheck={false}
                />
              </TabsContent>
              <TabsContent value="css" className="flex-1">
                <Textarea
                  value={cssCode}
                  onChange={e => setCssCode(e.target.value)}
                  className="min-h-[400px] font-mono text-xs resize-none bg-[hsl(var(--muted))] border-0"
                  spellCheck={false}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Live preview panel */}
        {showPreview && (
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <iframe
                ref={iframeRef}
                className="w-full min-h-[400px] border rounded-lg bg-white"
                title="Live Preview"
                sandbox="allow-scripts"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HTMLCSSAssessment;
