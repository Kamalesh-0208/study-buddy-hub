import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AssessmentSetup from "@/components/AssessmentSetup";
import MCQAssessment from "@/components/MCQAssessment";
import ProgrammingAssessment from "@/components/ProgrammingAssessment";
import HTMLCSSAssessment from "@/components/HTMLCSSAssessment";
import AssessmentHistory from "@/components/AssessmentHistory";
import GenerationCountdown from "@/components/GenerationCountdown";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, History, Plus } from "lucide-react";

const AssessmentPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
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
    if (data) setHistory(data as any[]);
  };

  const handleStart = async (config: any) => {
    setLoading(true);
    try {
      let edgeCategory = config.skillCategory;
      if (config.skillCategory === "database" || config.skillCategory === "aptitude") {
        edgeCategory = "theory";
      }
      if (config.skillCategory === "other") {
        edgeCategory = config.questionType === "coding" ? "programming" : "theory";
      }
      if (config.skillCategory === "htmlcss" && config.skill === "HTML/CSS") {
        edgeCategory = "htmlcss";
      } else if (config.skillCategory === "htmlcss") {
        edgeCategory = "theory";
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

  const handleSaveResult = async (result: any) => {
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
    if (assessmentData?.config) handleStart(assessmentData.config);
  };

  const handleReset = () => setAssessmentData(null);

  const handleDeleteHistory = async (id: string) => {
    await supabase.from("assessment_history").delete().eq("id", id);
    setHistory(prev => prev.filter(h => h.id !== id));
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
              {showHistory ? <><Plus className="h-4 w-4 mr-1" /> New Test</> : <><History className="h-4 w-4 mr-1" /> History</>}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <GenerationCountdown />
      ) : !assessmentData && showHistory ? (
        <AssessmentHistory
          history={history}
          onNewTest={() => setShowHistory(false)}
          onDelete={handleDeleteHistory}
        />
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
