import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useSkillPlanner = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ["skill-plans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_plans" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const topicsQuery = (planId: string) => useQuery({
    queryKey: ["skill-topics", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_topics" as any)
        .select("*, skill_resources(*)")
        .eq("skill_plan_id", planId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!planId,
  });

  const generateSkillPlan = useMutation({
    mutationFn: async (params: {
      skill_name: string;
      specific_topic?: string;
      daily_hours: number;
      target_days: number;
      experience_level: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-skill-plan", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-plans"] });
      toast.success("Skill learning plan created! 🎯");
    },
    onError: (e: any) => toast.error(e.message || "Failed to generate skill plan"),
  });

  const toggleTopicComplete = useMutation({
    mutationFn: async ({ id, completed, planId }: { id: string; completed: boolean; planId: string }) => {
      const { error } = await supabase
        .from("skill_topics" as any)
        .update({
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;

      // Update plan progress
      const { data: topics } = await supabase
        .from("skill_topics" as any)
        .select("completed")
        .eq("skill_plan_id", planId);
      if (topics) {
        const total = topics.length;
        const done = topics.filter((t: any) => t.completed).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        await supabase
          .from("skill_plans" as any)
          .update({ progress_percentage: pct, status: pct === 100 ? "completed" : "active" })
          .eq("id", planId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-plans"] });
      qc.invalidateQueries({ queryKey: ["skill-topics"] });
    },
  });

  const deleteSkillPlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skill_plans" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill-plans"] });
      toast.success("Skill plan deleted");
    },
  });

  return {
    plans: plansQuery.data ?? [],
    isLoading: plansQuery.isLoading,
    topicsQuery,
    generateSkillPlan,
    toggleTopicComplete,
    deleteSkillPlan,
  };
};
