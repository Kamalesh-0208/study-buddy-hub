import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Code, BookOpen, Zap, GraduationCap, Play, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

const PROGRAMMING_SKILLS = ["C", "C++", "Java", "JavaScript", "React"];
const THEORY_SKILLS = ["Aptitude", "Logical Reasoning", "Algebra", "Calculus", "Differential Equations", "Data Structures", "DBMS", "Communication Skills"];
const HTMLCSS_TOPICS = ["Landing Page", "Navbar Layout", "Profile Card", "Pricing Section", "Product Page", "Dashboard Layout", "Login Page", "Blog Layout"];

interface AssessmentConfig {
  skillCategory: "programming" | "theory";
  skill: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  mode: "practice" | "exam";
}

interface Props {
  onStart: (config: AssessmentConfig) => void;
  loading: boolean;
}

const AssessmentSetup = ({ onStart, loading }: Props) => {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<AssessmentConfig>({
    skillCategory: "programming",
    skill: "",
    topic: "",
    difficulty: "easy",
    mode: "practice",
  });

  const skills = config.skillCategory === "programming" ? PROGRAMMING_SKILLS : THEORY_SKILLS;

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return !!config.skill;
    if (step === 2) return !!config.topic.trim();
    if (step === 3) return true;
    if (step === 4) return true;
    return false;
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else onStart(config);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Select Skill Category</CardTitle>
              <CardDescription>Choose the type of assessment you want to take</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={config.skillCategory} onValueChange={(v) => setConfig({ ...config, skillCategory: v as any, skill: "" })}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Label htmlFor="cat-prog" className="cursor-pointer">
                    <Card className={`p-4 transition-all ${config.skillCategory === "programming" ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="programming" id="cat-prog" />
                        <div>
                          <div className="flex items-center gap-2 font-semibold"><Code className="h-4 w-4" /> Programming Skill</div>
                          <p className="text-xs text-muted-foreground mt-1">Coding problems with test cases</p>
                        </div>
                      </div>
                    </Card>
                  </Label>
                  <Label htmlFor="cat-theory" className="cursor-pointer">
                    <Card className={`p-4 transition-all ${config.skillCategory === "theory" ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="theory" id="cat-theory" />
                        <div>
                          <div className="flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4" /> One-Mark / Theory</div>
                          <p className="text-xs text-muted-foreground mt-1">MCQ questions with explanations</p>
                        </div>
                      </div>
                    </Card>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Choose Skill</CardTitle>
              <CardDescription>Select the specific skill to be assessed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <Badge key={s} variant={config.skill === s ? "default" : "outline"} className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => setConfig({ ...config, skill: s })}>
                    {s}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Topic</CardTitle>
              <CardDescription>Specify the topic within {config.skill} you want to practice</CardDescription>
            </CardHeader>
            <CardContent>
              <Input placeholder={config.skillCategory === "programming" ? "e.g. Loops, Arrays, Functions" : "e.g. Clocks, Number Series, SQL Queries"}
                value={config.topic} onChange={e => setConfig({ ...config, topic: e.target.value })} />
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={config.difficulty} onValueChange={v => setConfig({ ...config, difficulty: v as any })}>
                <div className="grid grid-cols-2 gap-3">
                  {(["easy", "medium", "hard", "mixed"] as const).map(d => (
                    <Label key={d} htmlFor={`diff-${d}`} className="cursor-pointer">
                      <Card className={`p-3 transition-all ${config.difficulty === d ? "border-primary bg-primary/5" : ""}`}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={d} id={`diff-${d}`} />
                          <span className="capitalize font-medium text-sm">{d}</span>
                        </div>
                      </Card>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={config.mode} onValueChange={v => setConfig({ ...config, mode: v as any })}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Label htmlFor="mode-practice" className="cursor-pointer">
                    <Card className={`p-4 transition-all ${config.mode === "practice" ? "border-primary bg-primary/5" : ""}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="practice" id="mode-practice" />
                        <div>
                          <div className="flex items-center gap-2 font-semibold"><Play className="h-4 w-4" /> Practice Mode</div>
                          <p className="text-xs text-muted-foreground mt-1">Learn with instant feedback & explanations</p>
                        </div>
                      </div>
                    </Card>
                  </Label>
                  <Label htmlFor="mode-exam" className="cursor-pointer">
                    <Card className={`p-4 transition-all ${config.mode === "exam" ? "border-primary bg-primary/5" : ""}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="exam" id="mode-exam" />
                        <div>
                          <div className="flex items-center gap-2 font-semibold"><FileCheck className="h-4 w-4" /> Exam Mode</div>
                          <p className="text-xs text-muted-foreground mt-1">Timed test with scoring & results</p>
                        </div>
                      </div>
                    </Card>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
        <Button onClick={handleNext} disabled={!canProceed() || loading}>
          {loading ? "Generating..." : step === 4 ? "Start Assessment" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default AssessmentSetup;
