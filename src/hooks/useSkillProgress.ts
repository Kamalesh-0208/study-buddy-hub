import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SkillStat {
  skill: string;
  totalAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
}

export interface TopicStat {
  skill: string;
  topic: string;
  totalAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  isWeak: boolean;
}

export interface RecentResult {
  id: string;
  skill: string;
  topic: string;
  score_percentage: number;
  mode: string;
  created_at: string;
  passed: boolean | null;
}

export const useSkillProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["skill_progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_history")
        .select("id, skill, topic, attempted, correct, wrong, score_percentage, mode, passed, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = data ?? [];

      // Skill-level aggregation
      const skillMap = new Map<string, { attempted: number; correct: number; wrong: number }>();
      const topicMap = new Map<string, { skill: string; attempted: number; correct: number; wrong: number }>();

      for (const r of rows) {
        const sk = skillMap.get(r.skill) ?? { attempted: 0, correct: 0, wrong: 0 };
        sk.attempted += r.attempted;
        sk.correct += r.correct;
        sk.wrong += r.wrong;
        skillMap.set(r.skill, sk);

        const key = `${r.skill}::${r.topic}`;
        const tp = topicMap.get(key) ?? { skill: r.skill, attempted: 0, correct: 0, wrong: 0 };
        tp.attempted += r.attempted;
        tp.correct += r.correct;
        tp.wrong += r.wrong;
        topicMap.set(key, tp);
      }

      const skills: SkillStat[] = Array.from(skillMap.entries()).map(([skill, s]) => ({
        skill,
        totalAttempted: s.attempted,
        totalCorrect: s.correct,
        totalWrong: s.wrong,
        accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
      }));

      const topics: TopicStat[] = Array.from(topicMap.entries()).map(([key, t]) => {
        const accuracy = t.attempted > 0 ? Math.round((t.correct / t.attempted) * 100) : 0;
        return {
          skill: t.skill,
          topic: key.split("::")[1],
          totalAttempted: t.attempted,
          totalCorrect: t.correct,
          totalWrong: t.wrong,
          accuracy,
          isWeak: accuracy < 60,
        };
      });

      const weakTopics = topics.filter((t) => t.isWeak && t.totalAttempted > 0);

      const recent: RecentResult[] = rows.slice(0, 5).map((r) => ({
        id: r.id,
        skill: r.skill,
        topic: r.topic,
        score_percentage: r.score_percentage,
        mode: r.mode,
        created_at: r.created_at,
        passed: r.passed,
      }));

      return { skills, topics, weakTopics, recent, totalTests: rows.length };
    },
    enabled: !!user,
  });
};
