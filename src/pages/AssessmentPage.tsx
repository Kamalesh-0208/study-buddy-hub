import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AssessmentSetup from "@/components/AssessmentSetup";
import MCQAssessment from "@/components/MCQAssessment";
import ProgrammingAssessment from "@/components/ProgrammingAssessment";
import HTMLCSSAssessment from "@/components/HTMLCSSAssessment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCheck, Plus, History, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface HistoryEntry {
  id: string;
  skill_category: string;
  skill: string;
  topic: string;
  difficulty: string;
  mode: string;
  assessment_type: string;
  total_questions: number;
  attempted: number;
  correct: number;
  wrong: number;
  score_percentage: number;
  passed: boolean;
  time_taken_seconds: number;
  created_at: string;
}

const AssessmentPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("assessment_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setHistory(data as unknown as HistoryEntry[]);
  };

  const handleStart = async (config: any) => {
    setLoading(true);
    try {
      // Determine the effective skill category for the edge function
      let edgeCategory = config.skillCategory;
      if (config.skillCategory === "database" || config.skillCategory === "aptitude") {
        edgeCategory = "theory"; // These use MCQ format
      }
      if (config.skillCategory === "other") {
        edgeCategory = config.questionType === "coding" ? "programming" : "theory";
      }
      if (config.skillCategory === "htmlcss" && config.skill === "HTML/CSS") {
        edgeCategory = "htmlcss";
      } else if (config.skillCategory === "htmlcss") {
        edgeCategory = "theory"; // JS/React web dev MCQs
      }

      const { data, error } = await supabase.functions.invoke("generate-assessment", {
        body: {
          skillCategory: edgeCategory,
          skill: config.skill,
          topic: config.topic,
          difficulty: config.difficulty,
          mode: config.mode,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAssessmentData({ ...data, config });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate assessment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async (result: {
    totalQuestions: number;
    attempted: number;
    correct: number;
    wrong: number;
    unanswered: number;
    scorePercentage: number;
    finalScore: number;
    negativeMarks?: number;
    passed: boolean;
    timeTakenSeconds: number;
    similarityScore?: number;
    requirementsMet?: boolean;
  }) => {
    if (!user || !assessmentData) return;
    const config = assessmentData.config;
    try {
      await supabase.from("assessment_history").insert({
        user_id: user.id,
        skill_category: config.skillCategory,
        skill: config.skill,
        topic: config.topic,
        difficulty: config.difficulty,
        mode: config.mode,
        assessment_type: assessmentData.type,
        total_questions: result.totalQuestions,
        attempted: result.attempted,
        correct: result.correct,
        wrong: result.wrong,
        unanswered: result.unanswered,
        score_percentage: result.scorePercentage,
        final_score: result.finalScore,
        negative_marks: result.negativeMarks || 0,
        time_taken_seconds: result.timeTakenSeconds,
        passed: result.passed,
        similarity_score: result.similarityScore ?? null,
        requirements_met: result.requirementsMet ?? null,
      } as any);
      fetchHistory();
    } catch (e) {
      console.error("Failed to save result:", e);
    }
  };

  const handleRetry = () => {
    if (assessmentData?.config) {
      handleStart(assessmentData.config);
    }
  };

  const handleReset = () => {
    setAssessmentData(null);
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from("assessment_history").delete().eq("id", id);
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="gradient-bg rounded-xl p-2.5 shadow-glow">
            <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Assessment System</h1>
            <p className="text-sm text-muted-foreground">Practice tests & exams powered by AI</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!assessmentData && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-1" /> {showHistory ? "New Test" : "History"}
            </Button>
          )}
        </div>
      </div>

      {!assessmentData && showHistory ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Attempt History</h2>
            <Button size="sm" onClick={() => setShowHistory(false)}>
              <Plus className="h-4 w-4 mr-1" /> Add New Skill
            </Button>
          </div>
          {history.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No assessment history yet. Start your first practice!</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {history.map(h => (
                  <Card key={h.id} className={`${h.passed ? "border-green-500/20" : "border-destructive/20"}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {h.passed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                            <span className="font-semibold text-sm">{h.skill}</span>
                            <Badge variant="secondary" className="text-xs capitalize">{h.difficulty}</Badge>
                            <Badge variant="outline" className="text-xs capitalize">{h.mode}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{h.topic}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>Score: {h.score_percentage.toFixed(0)}%</span>
                            <span>{h.correct}/{h.total_questions} correct</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(h.time_taken_seconds)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{format(new Date(h.created_at), "MMM d, HH:mm")}</span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeleteHistory(h.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      ) : !assessmentData ? (
        <AssessmentSetup onStart={handleStart} loading={loading} />
      ) : assessmentData.type === "mcq" ? (
        <MCQAssessment
          assessment={assessmentData.assessment}
          mode={assessmentData.mode}
          onReset={handleReset}
          onRetry={handleRetry}
          onSaveResult={handleSaveResult}
        />
      ) : assessmentData.type === "htmlcss" ? (
        <HTMLCSSAssessment
          assessment={assessmentData.assessment}
          mode={assessmentData.mode}
          onReset={handleReset}
          onRetry={handleRetry}
          onSaveResult={handleSaveResult}
        />
      ) : (
        <ProgrammingAssessment
          assessment={assessmentData.assessment}
          mode={assessmentData.mode}
          skill={assessmentData.skill}
          onReset={handleReset}
          onRetry={handleRetry}
          onSaveResult={handleSaveResult}
        />
      )}
    </div>
  );
};

export default AssessmentPage;
