import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type StudySession = Tables<"study_sessions">;

const LEVEL_FORMULA = (xp: number) => Math.max(1, Math.floor(Math.sqrt(xp / 50)));

export const useSessions = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*, subjects(name, color)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addSession = useMutation({
    mutationFn: async (input: {
      subject_id: string | null;
      duration_seconds: number;
      start_time: string;
      end_time: string;
      focus_score: number;
      xp_earned: number;
      session_type?: string;
    }) => {
      // Calculate productivity score
      const durationMinutes = input.duration_seconds / 60;
      const productivityScore = Math.min(100, Math.round(
        durationMinutes * 0.5 + input.focus_score * 0.3 + 20
      ));

      const { data, error } = await supabase
        .from("study_sessions")
        .insert({
          ...input,
          user_id: user!.id,
          focus_score: productivityScore,
          session_type: input.session_type ?? "focus",
        })
        .select()
        .single();
      if (error) throw error;

      // XP calculation: 1 XP per minute
      const sessionXP = Math.round(durationMinutes);

      // Log XP
      await supabase.from("xp_log").insert({
        user_id: user!.id,
        xp_amount: sessionXP,
        source: "session",
        source_id: data.id,
      });

      // Update profile XP, streak, level
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (profile) {
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        let newStreak = profile.current_streak ?? 0;
        let longestStreak = profile.longest_streak ?? 0;

        if (profile.last_study_date !== today) {
          if (profile.last_study_date === yesterday) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          longestStreak = Math.max(newStreak, longestStreak);

          // Daily study bonus (100 XP) if >= 30 min today
          const { data: todaySessions } = await supabase
            .from("study_sessions")
            .select("duration_seconds")
            .eq("user_id", user!.id)
            .gte("start_time", `${today}T00:00:00`);

          const todayMinutes = (todaySessions ?? []).reduce((s, ss) => s + ss.duration_seconds / 60, 0) + durationMinutes;
          if (todayMinutes >= 30) {
            await supabase.from("xp_log").insert({
              user_id: user!.id, xp_amount: 100, source: "daily_bonus",
            });
          }

          // 7-day streak bonus
          if (newStreak > 0 && newStreak % 7 === 0) {
            await supabase.from("xp_log").insert({
              user_id: user!.id, xp_amount: 200, source: "streak_bonus",
            });
          }
        }

        // Recalculate total XP from log
        const { data: xpLogs } = await supabase
          .from("xp_log")
          .select("xp_amount")
          .eq("user_id", user!.id);
        const totalXP = (xpLogs ?? []).reduce((s, l) => s + l.xp_amount, 0);
        const newLevel = LEVEL_FORMULA(totalXP);

        await supabase.from("profiles").update({
          total_xp: totalXP,
          level: newLevel,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_study_date: today,
        }).eq("user_id", user!.id);

        // Update subject study hours
        if (input.subject_id) {
          const hours = input.duration_seconds / 3600;
          const { data: subject } = await supabase
            .from("subjects")
            .select("total_study_hours")
            .eq("id", input.subject_id)
            .single();
          if (subject) {
            await supabase.from("subjects").update({
              total_study_hours: (Number(subject.total_study_hours) || 0) + hours,
              last_studied_at: new Date().toISOString(),
            }).eq("id", input.subject_id);
          }
        }

        // Update leaderboard snapshot
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: weekSessions } = await supabase
          .from("study_sessions")
          .select("duration_seconds")
          .eq("user_id", user!.id)
          .gte("start_time", weekAgo);
        const weeklyMinutes = Math.round((weekSessions ?? []).reduce((s, ss) => s + ss.duration_seconds, 0) / 60);
        const { count } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("completed", true);

        const score = totalXP * 0.6 + weeklyMinutes * 0.2 + newStreak * 10 + (count ?? 0) * 5;

        const { data: existingSnap } = await supabase
          .from("leaderboard_snapshots")
          .select("id")
          .eq("user_id", user!.id)
          .eq("snapshot_date", today)
          .maybeSingle();

        const snapData = {
          xp_total: totalXP,
          weekly_study_minutes: weeklyMinutes,
          tasks_completed: count ?? 0,
          current_streak: newStreak,
          score,
        };

        if (existingSnap) {
          await supabase.from("leaderboard_snapshots").update(snapData).eq("id", existingSnap.id);
        } else {
          await supabase.from("leaderboard_snapshots").insert({
            ...snapData, user_id: user!.id, snapshot_date: today,
          });
        }
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["xp_log"] });
      toast.success("Session saved! XP earned 🎉");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { sessions: query.data ?? [], isLoading: query.isLoading, addSession };
};
