import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type StudySession = Tables<"study_sessions">;

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
    }) => {
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Update profile XP and streak
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
        }

        const newXP = (profile.total_xp ?? 0) + input.xp_earned;
        const newLevel = Math.floor(newXP / 250) + 1;

        await supabase.from("profiles").update({
          total_xp: newXP,
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
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Session saved! XP earned 🎉");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { sessions: query.data ?? [], isLoading: query.isLoading, addSession };
};
