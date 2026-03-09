import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AssessmentSetup from "@/components/AssessmentSetup";
import MCQAssessment from "@/components/MCQAssessment";
import ProgrammingAssessment from "@/components/ProgrammingAssessment";
import { ClipboardCheck } from "lucide-react";

const AssessmentPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);

  const handleStart = async (config: { skillCategory: string; skill: string; topic: string; difficulty: string; mode: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-assessment", {
        body: {
          skillCategory: config.skillCategory === "programming" ? "programming" : "theory",
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

  const handleReset = () => setAssessmentData(null);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="gradient-bg rounded-xl p-2.5 shadow-glow">
          <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Assessment System</h1>
          <p className="text-sm text-muted-foreground">Practice tests & exams powered by AI</p>
        </div>
      </div>

      {!assessmentData ? (
        <AssessmentSetup onStart={handleStart} loading={loading} />
      ) : assessmentData.type === "mcq" ? (
        <MCQAssessment assessment={assessmentData.assessment} mode={assessmentData.mode} onReset={handleReset} />
      ) : (
        <ProgrammingAssessment assessment={assessmentData.assessment} mode={assessmentData.mode} skill={assessmentData.skill} onReset={handleReset} />
      )}
    </div>
  );
};

export default AssessmentPage;
