import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface QuestionBankItem {
  id: string;
  skill: string;
  topic: string;
  difficulty: string;
  question_type: string;
  question_text: string;
  options: Record<string, string> | null;
  correct_answer: string;
  explanation: string | null;
  created_at: string;
  validated: boolean;
}

interface FetchParams {
  skill: string;
  topic: string;
  difficulty?: string;
  question_type?: string;
  limit?: number;
}

// In-memory cache for hot questions
const questionCache = new Map<string, { data: QuestionBankItem[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(p: FetchParams) {
  return `${p.skill}::${p.topic}::${p.difficulty ?? "all"}::${p.question_type ?? "all"}`;
}

export const useQuestionBank = (params?: FetchParams) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["question_bank", params?.skill, params?.topic, params?.difficulty, params?.question_type],
    queryFn: async () => {
      if (!params) return [];

      // Check in-memory cache first
      const key = cacheKey(params);
      const cached = questionCache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.data;
      }

      let query = supabase
        .from("question_bank" as any)
        .select("*")
        .eq("skill", params.skill)
        .eq("topic", params.topic);

      if (params.difficulty && params.difficulty !== "mixed") {
        query = query.eq("difficulty", params.difficulty);
      }
      if (params.question_type) {
        query = query.eq("question_type", params.question_type);
      }

      query = query.limit(params.limit ?? 50);

      const { data, error } = await query;
      if (error) {
        console.error("Question bank fetch error:", error);
        return [];
      }

      const items = (data ?? []) as unknown as QuestionBankItem[];
      questionCache.set(key, { data: items, ts: Date.now() });
      return items;
    },
    enabled: !!user && !!params?.skill && !!params?.topic,
    staleTime: CACHE_TTL,
  });
};

export const useStoreQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questions: Omit<QuestionBankItem, "id" | "created_at">[]) => {
      if (!questions.length) return;

      const { error } = await supabase
        .from("question_bank" as any)
        .insert(questions as any);

      if (error) {
        console.error("Failed to store questions:", error);
        throw error;
      }
    },
    onSuccess: () => {
      questionCache.clear();
      queryClient.invalidateQueries({ queryKey: ["question_bank"] });
    },
  });
};

export const clearQuestionCache = () => questionCache.clear();
