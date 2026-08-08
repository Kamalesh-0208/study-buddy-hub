import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_study_progress",
  title: "Get study progress",
  description: "Get the signed-in student's XP, level, streaks and recent study session totals.",
  inputSchema: {
    recent_sessions: z.number().int().min(1).max(50).default(10).describe("How many recent study sessions to summarize."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ recent_sessions }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [profileRes, sessionsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name,total_xp,level,current_streak,longest_streak,last_study_date")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("study_sessions")
        .select("id,duration_seconds,focus_score,session_type,start_time,end_time,xp_earned,subject_id")
        .eq("user_id", userId)
        .order("start_time", { ascending: false })
        .limit(recent_sessions ?? 10),
    ]);

    if (profileRes.error) return { content: [{ type: "text", text: profileRes.error.message }], isError: true };
    if (sessionsRes.error) return { content: [{ type: "text", text: sessionsRes.error.message }], isError: true };

    const sessions = sessionsRes.data ?? [];
    const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / 60);
    const avgFocus = sessions.length
      ? Math.round(sessions.reduce((sum, s) => sum + (s.focus_score ?? 0), 0) / sessions.length)
      : null;

    const summary = {
      profile: profileRes.data ?? null,
      recent_sessions: sessions,
      recent_total_minutes: totalMinutes,
      recent_average_focus_score: avgFocus,
    };

    return { content: [{ type: "text", text: JSON.stringify(summary) }], structuredContent: summary };
  },
});
