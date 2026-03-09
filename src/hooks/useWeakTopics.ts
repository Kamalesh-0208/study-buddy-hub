import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface WeakTopic {
  subject_name: string;
  topic_name: string;
  weakness_score: number;
  reason: string;
  recommendation: string;
}

export const useWeakTopics = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["weak_topics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weak_topics")
        .select("*, subjects(name, color)")
        .eq("user_id", user!.id)
        .order("weakness_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const detectWeakTopics = useMutation({
    mutationFn: async (): Promise<WeakTopic[]> => {
      const { data, error } = await supabase.functions.invoke("ai-study-intelligence", {
        body: { action: "detect_weak_topics" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.weak_topics;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weak_topics"] });
      toast.success("Weak topics analyzed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    weakTopics: query.data ?? [],
    isLoading: query.isLoading,
    detectWeakTopics,
  };
};
