import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type LeaderboardFilter = "global" | "weekly" | "monthly";

export const useLeaderboard = (filter: LeaderboardFilter = "global") => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["leaderboard", filter],
    queryFn: async () => {
      if (filter === "global") {
        // Use profiles with computed score
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("total_xp", { ascending: false })
          .limit(50);
        if (error) throw error;
        return (data ?? []).map((p, i) => ({
          ...p,
          rank: i + 1,
          score: (p.total_xp ?? 0) * 0.6 + (p.current_streak ?? 0) * 10,
        }));
      }

      // For weekly/monthly, use leaderboard_snapshots
      const daysAgo = filter === "weekly" ? 7 : 30;
      const since = new Date(Date.now() - daysAgo * 86400000).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("leaderboard_snapshots")
        .select("*")
        .gte("snapshot_date", since)
        .order("score", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Deduplicate by user_id, keeping highest score
      const userMap = new Map<string, any>();
      (data ?? []).forEach((row) => {
        const existing = userMap.get(row.user_id);
        if (!existing || (row.score ?? 0) > (existing.score ?? 0)) {
          userMap.set(row.user_id, row);
        }
      });

      const ranked = Array.from(userMap.values())
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .map((r, i) => ({ ...r, rank: i + 1 }));

      // Fetch display names
      const userIds = ranked.map((r) => r.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, level, current_streak")
          .in("user_id", userIds);

        const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
        ranked.forEach((r) => {
          const p = profileMap.get(r.user_id);
          if (p) {
            r.display_name = p.display_name;
            r.level = p.level;
            r.current_streak = p.current_streak;
          }
        });
      }

      return ranked;
    },
    enabled: !!user,
  });

  return {
    leaderboard: query.data ?? [],
    isLoading: query.isLoading,
    currentUserId: user?.id,
  };
};
