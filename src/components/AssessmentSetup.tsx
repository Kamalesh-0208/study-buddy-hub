import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Code, BookOpen, Zap, GraduationCap, Play, FileCheck, Palette, Database, Brain, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

type SkillCategory = "programming" | "theory" | "htmlcss" | "database" | "aptitude" | "other";

const CATEGORY_CONFIG: Record<SkillCategory, {
  label: string;
  icon: any;
  description: string;
  skills: string[];
  topicPlaceholder: string;
}> = {
  theory: {
    label: "One Mark Questions",
    icon: BookOpen,
    description: "MCQ questions with explanations",
    skills: ["Aptitude", "Logical Reasoning", "Algebra", "Calculus", "Differential Equations", "Data Structures", "DBMS", "Communication Skills"],
    topicPlaceholder: "e.g. Clocks, Number Series, SQL Queries",
  },
  programming: {
    label: "Programming Language",
    icon: Code,
    description: "Coding problems with test cases",
    skills: ["C", "C++", "Java", "JavaScript", "Python"],
    topicPlaceholder: "e.g. Loops, Arrays, Functions, OOP",
  },
  htmlcss: {
    label: "Web Development",
    icon: Palette,
    description: "Recreate webpage designs & web MCQs",
    skills: ["HTML/CSS", "JavaScript", "React"],
    topicPlaceholder: "e.g. Landing Page, Navbar, Components",
  },
  database: {
    label: "Database",
    icon: Database,
    description: "SQL practice & database concepts",
    skills: ["MySQL", "PostgreSQL", "MongoDB"],
    topicPlaceholder: "e.g. Joins, Subqueries, Indexing, Normalization",
  },
  aptitude: {
    label: "Aptitude",
    icon: Brain,
    description: "Problem-solving & quantitative skills",
    skills: ["Probability", "Time & Work", "Percentages", "Profit & Loss", "Speed & Distance", "Averages", "Ratios", "Permutations"],
    topicPlaceholder: "e.g. Simple Interest, Age Problems, Mixtures",
  },
  other: {
    label: "Other",
    icon: MoreHorizontal,
    description: "Custom skill assessment",
    skills: [],
    topicPlaceholder: "e.g. Any topic you want to practice",
  },
};

const HTMLCSS_WEBPAGE_TOPICS = ["Landing Page", "Navbar Layout", "Profile Card", "Pricing Section", "Product Page", "Dashboard Layout", "Login Page", "Blog Layout"];

interface AssessmentConfig {
  skillCategory: SkillCategory;
  skill: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  mode: "practice" | "exam";
  questionType?: "mcq" | "coding" | "theory";
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
    questionType: "mcq",
  });
  const [customSkill, setCustomSkill] = useState("");

  const catConfig = CATEGORY_CONFIG[config.skillCategory];

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) {
      if (config.skillCategory === "other") return !!customSkill.trim();
      return !!config.skill;
    }
    if (step === 2) return !!config.topic.trim();
    if (step === 3) return true;
    if (step === 4) return true;
    return false;
  };

  const handleCategoryChange = (v: string) => {
    const cat = v as SkillCategory;
    setConfig({ ...config, skillCategory: cat, skill: "", topic: "", questionType: "mcq" });
    setCustomSkill("");
  };

  const handleNext = () => {
    if (step === 1 && config.skillCategory === "other") {
      setConfig(prev => ({ ...prev, skill: customSkill }));
    }
    if (step < 4) setStep(step + 1);
    else onStart(config);
  };

  const categories: SkillCategory[] = ["theory", "programming", "htmlcss", "database", "aptitude", "other"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        {/* Step 0: Category */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Select Skill Category</CardTitle>
              <CardDescription>Choose the type of assessment you want to take</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={config.skillCategory} onValueChange={handleCategoryChange}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const Icon = cfg.icon;
                    return (
                      <Label key={cat} htmlFor={`cat-${cat}`} className="cursor-pointer">
                        <Card className={`p-4 transition-all h-full ${config.skillCategory === cat ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}>
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={cat} id={`cat-${cat}`} />
                            <div>
                              <div className="flex items-center gap-2 font-semibold text-sm"><Icon className="h-4 w-4" /> {cfg.label}</div>
                              <p className="text-xs text-muted-foreground mt-1">{cfg.description}</p>
                            </div>
                          </div>
                        </Card>
                      </Label>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Skill / Subject selection */}
        {step === 1 && config.skillCategory !== "other" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Choose {config.skillCategory === "aptitude" ? "Topic Area" : "Skill"}</CardTitle>
              <CardDescription>Select the specific {catConfig.label.toLowerCase()} to be assessed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {catConfig.skills.map(s => (
                  <Badge key={s} variant={config.skill === s ? "default" : "outline"} className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => setConfig({ ...config, skill: s })}>
                    {s}
                  </Badge>
                ))}
              </div>
              {/* For HTML/CSS web dev, show webpage topics if HTML/CSS is selected */}
              {config.skillCategory === "htmlcss" && config.skill === "HTML/CSS" && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Choose Webpage Type:</p>
                  <div className="flex flex-wrap gap-2">
                    {HTMLCSS_WEBPAGE_TOPICS.map(t => (
                      <Badge key={t} variant={config.topic === t ? "default" : "outline"} className="cursor-pointer text-sm py-1.5 px-3"
                        onClick={() => setConfig({ ...config, topic: t })}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 1 && config.skillCategory === "other" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Enter Skill Name</CardTitle>
              <CardDescription>Type the custom skill you want to practice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="e.g. Machine Learning, Physics, Economics"
                value={customSkill} onChange={e => { setCustomSkill(e.target.value); setConfig(prev => ({ ...prev, skill: e.target.value })); }} />
              <div>
                <p className="text-sm font-medium mb-2">Question Type:</p>
                <RadioGroup value={config.questionType || "mcq"} onValueChange={v => setConfig({ ...config, questionType: v as any })}>
                  <div className="flex gap-3">
                    {([["mcq", "MCQ"], ["coding", "Coding"], ["theory", "Theory"]] as const).map(([val, label]) => (
                      <Label key={val} htmlFor={`qt-${val}`} className="cursor-pointer">
                        <Card className={`p-3 transition-all ${config.questionType === val ? "border-primary bg-primary/5" : ""}`}>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={val} id={`qt-${val}`} />
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                        </Card>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Topic */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Topic</CardTitle>
              <CardDescription>
                {config.skillCategory === "htmlcss" && config.skill === "HTML/CSS"
                  ? "Optionally add specific requirements (leave blank for random)"
                  : `Specify the topic within ${config.skill} you want to practice`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input placeholder={catConfig.topicPlaceholder}
                value={config.topic} onChange={e => setConfig({ ...config, topic: e.target.value })} />
            </CardContent>
          </Card>
        )}

        {/* Step 3: Difficulty */}
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

        {/* Step 4: Mode */}
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
