import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type XPSource = "session" | "task" | "daily_bonus" | "streak_bonus" | "goal";

const LEVEL_FORMULA = (xp: number) => Math.max(1, Math.floor(Math.sqrt(xp / 50)));

export const useXPLog = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const awardXP = useMutation({
    mutationFn: async (input: { amount: number; source: XPSource; sourceId?: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Log XP event
      await supabase.from("xp_log").insert({
        user_id: user.id,
        xp_amount: input.amount,
        source: input.source,
        source_id: input.sourceId ?? null,
      });

      // Update profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("user_id", user.id)
        .single();

      const newXP = (profile?.total_xp ?? 0) + input.amount;
      const newLevel = LEVEL_FORMULA(newXP);

      await supabase.from("profiles").update({
        total_xp: newXP,
        level: newLevel,
      }).eq("user_id", user.id);

      return { newXP, newLevel };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["xp_log"] });
    },
  });

  const updateLeaderboardSnapshot = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Weekly study minutes
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: weekSessions } = await supabase
        .from("study_sessions")
        .select("duration_seconds")
        .eq("user_id", user.id)
        .gte("start_time", weekAgo);

      const weeklyMinutes = Math.round(
        (weekSessions ?? []).reduce((s, ss) => s + ss.duration_seconds, 0) / 60
      );

      // Tasks completed
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);

      const xpTotal = profile?.total_xp ?? 0;
      const streak = profile?.current_streak ?? 0;
      const tasksCompleted = count ?? 0;

      // Leaderboard score formula
      const score =
        xpTotal * 0.6 +
        weeklyMinutes * 0.2 +
        streak * 10 +
        tasksCompleted * 5;

      const today = new Date().toISOString().split("T")[0];

      // Upsert today's snapshot
      const { data: existing } = await supabase
        .from("leaderboard_snapshots")
        .select("id")
        .eq("user_id", user.id)
        .eq("snapshot_date", today)
        .maybeSingle();

      if (existing) {
        await supabase.from("leaderboard_snapshots").update({
          xp_total: xpTotal,
          weekly_study_minutes: weeklyMinutes,
          tasks_completed: tasksCompleted,
          current_streak: streak,
          score,
        }).eq("id", existing.id);
      } else {
        await supabase.from("leaderboard_snapshots").insert({
          user_id: user.id,
          xp_total: xpTotal,
          weekly_study_minutes: weeklyMinutes,
          tasks_completed: tasksCompleted,
          current_streak: streak,
          score,
          snapshot_date: today,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  return { awardXP, updateLeaderboardSnapshot, LEVEL_FORMULA };
};
