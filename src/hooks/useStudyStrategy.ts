import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StudyStrategy {
  primary_strategy: {
    name: string;
    description: string;
    reasoning: string;
  };
  insights: Array<{ text: string; type: "tip" | "warning" | "encouragement" }>;
  recommended_session_length: number;
  weekly_plan: Array<{
    day: string;
    sessions: Array<{ subject: string; minutes: number; activity: string }>;
  }>;
}

export const useStudyStrategy = () => {
  const [strategy, setStrategy] = useState<StudyStrategy | null>(null);

  const generateStrategy = useMutation({
    mutationFn: async (): Promise<StudyStrategy> => {
      const { data, error } = await supabase.functions.invoke("ai-study-intelligence", {
        body: { action: "generate_strategy" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.strategy;
    },
    onSuccess: (data) => {
      setStrategy(data);
      toast.success("Strategy generated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { strategy, generateStrategy };
};
