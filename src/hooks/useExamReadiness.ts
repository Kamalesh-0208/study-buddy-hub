import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ExamSchedule {
  id: string;
  user_id: string;
  subject_id: string | null;
  exam_date: string;
  exam_name: string | null;
  created_at: string;
}

export interface ReadinessResult {
  subject_id: string;
  subject_name: string;
  readiness_score: number;
  study_hours_component: number;
  revision_component: number;
  task_component: number;
  focus_component: number;
  consistency_component: number;
  exam_date: string | null;
  exam_name: string | null;
  days_remaining: number | null;
  level: "poor" | "moderate" | "good" | "ready";
  recommended_hours: number | null;
}

export const useExamReadiness = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const examsQuery = useQuery({
    queryKey: ["exam_schedule", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_schedule")
        .select("*, subjects(name, color)")
        .order("exam_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addExam = useMutation({
    mutationFn: async (input: { subject_id: string; exam_date: string; exam_name?: string }) => {
      const { data, error } = await supabase
        .from("exam_schedule")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam_schedule"] });
      toast.success("Exam added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteExam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam_schedule"] });
      toast.success("Exam removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const calculateReadiness = useMutation({
    mutationFn: async (): Promise<ReadinessResult[]> => {
      const { data, error } = await supabase.functions.invoke("ai-study-intelligence", {
        body: { action: "calculate_readiness" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.readiness;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["readiness_scores"] });
      toast.success("Readiness scores updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const readinessQuery = useQuery({
    queryKey: ["readiness_scores", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("readiness_scores")
        .select("*, subjects(name, color)")
        .eq("user_id", user!.id)
        .order("calculated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    exams: examsQuery.data ?? [],
    readinessScores: readinessQuery.data ?? [],
    isLoading: examsQuery.isLoading,
    addExam,
    deleteExam,
    calculateReadiness,
  };
};
