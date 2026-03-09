import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ProgressPrediction {
  subject_id: string;
  subject_name: string;
  subject_color: string | null;
  current_readiness: number;
  predicted_readiness: number;
  predicted_study_hours: number;
  learning_speed: number;
  days_remaining: number | null;
  exam_date: string | null;
  probability_ready: number;
  recommended_additional_hours: number;
  alert_message: string;
}

export const useProgressPredictor = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["progress_predictions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_progress_predictions")
        .select("*, subjects(name, color)")
        .eq("user_id", user!.id)
        .order("calculated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const predictProgress = useMutation({
    mutationFn: async (): Promise<ProgressPrediction[]> => {
      const { data, error } = await supabase.functions.invoke("ai-study-intelligence", {
        body: { action: "predict_progress" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.predictions;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress_predictions"] });
      toast.success("Progress predictions updated! 📈");
    },
    onError: (e: any) => toast.error(e.message || "Failed to predict progress"),
  });

  return {
    predictions: query.data ?? [],
    isLoading: query.isLoading,
    predictProgress,
  };
};
