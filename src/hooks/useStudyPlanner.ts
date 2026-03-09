import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type StudyPlan = {
  id: string;
  user_id: string;
  plan_date: string;
  subject_id: string | null;
  subject_name: string | null;
  recommended_minutes: number;
  priority: string | null;
  reason: string | null;
  completed: boolean | null;
  locked: boolean | null;
  created_at: string;
};

export const useStudyPlanner = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["study-plans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .order("plan_date", { ascending: true })
        .order("priority", { ascending: true });
      if (error) throw error;
      return data as StudyPlan[];
    },
    enabled: !!user,
  });

  const generatePlan = useMutation({
    mutationFn: async (params: { availableHoursPerDay?: number; daysToGenerate?: number }) => {
      const { data, error } = await supabase.functions.invoke("generate-study-plan", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("AI study plan generated! 🎯");
    },
    onError: (e: any) => toast.error(e.message || "Failed to generate plan"),
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("study_plans")
        .update({ completed: !completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-plans"] }),
  });

  const toggleLock = useMutation({
    mutationFn: async ({ id, locked }: { id: string; locked: boolean }) => {
      const { error } = await supabase
        .from("study_plans")
        .update({ locked: !locked })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-plans"] }),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-plans"] }),
  });

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    generatePlan,
    toggleComplete,
    toggleLock,
    deletePlan,
  };
};
