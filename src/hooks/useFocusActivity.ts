import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type FocusActivity = {
  id: string;
  user_id: string;
  session_id: string | null;
  tab_switch_count: number | null;
  idle_time_seconds: number | null;
  distraction_events: number | null;
  focus_score: number | null;
  pause_count: number | null;
  time_away_seconds: number | null;
  created_at: string;
};

export const useFocusActivity = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["focus-activity", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as FocusActivity[];
    },
    enabled: !!user,
  });

  const saveFocusActivity = useMutation({
    mutationFn: async (input: {
      session_id?: string;
      tab_switch_count: number;
      idle_time_seconds: number;
      distraction_events: number;
      focus_score: number;
      pause_count: number;
      time_away_seconds: number;
    }) => {
      const { error } = await supabase.from("focus_activity").insert({
        ...input,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["focus-activity"] }),
  });

  // Analytics computations
  const activities = query.data ?? [];

  const avgFocusScore = activities.length > 0
    ? Math.round(activities.reduce((s, a) => s + (a.focus_score ?? 80), 0) / activities.length)
    : 80;

  const avgDistractions = activities.length > 0
    ? Math.round(activities.reduce((s, a) => s + (a.distraction_events ?? 0), 0) / activities.length * 10) / 10
    : 0;

  const recommendedSessionMinutes = (() => {
    if (activities.length < 3) return 25;
    const recentScores = activities.slice(0, 10);
    const avgScore = recentScores.reduce((s, a) => s + (a.focus_score ?? 80), 0) / recentScores.length;
    if (avgScore >= 85) return 50;
    if (avgScore >= 70) return 35;
    if (avgScore >= 60) return 25;
    return 20;
  })();

  return {
    activities,
    isLoading: query.isLoading,
    saveFocusActivity,
    avgFocusScore,
    avgDistractions,
    recommendedSessionMinutes,
  };
};
