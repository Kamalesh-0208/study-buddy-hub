import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { availableHoursPerDay = 3, daysToGenerate = 7 } = await req.json();

    // Fetch user data in parallel
    const [subjectsRes, tasksRes, sessionsRes, goalsRes, focusRes] = await Promise.all([
      supabase.from("subjects").select("*").eq("user_id", user.id),
      supabase.from("tasks").select("*").eq("user_id", user.id).eq("completed", false).order("deadline", { ascending: true }),
      supabase.from("study_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("goals").select("*").eq("user_id", user.id).eq("completed", false),
      supabase.from("focus_activity").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    const subjects = subjectsRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const sessions = sessionsRes.data ?? [];
    const goals = goalsRes.data ?? [];
    const focusData = focusRes.data ?? [];

    // Build context for AI
    const avgSessionMinutes = sessions.length > 0
      ? Math.round(sessions.reduce((s, ss) => s + ss.duration_seconds, 0) / sessions.length / 60)
      : 25;

    const avgFocusScore = focusData.length > 0
      ? Math.round(focusData.reduce((s, f) => s + (f.focus_score ?? 80), 0) / focusData.length)
      : 80;

    const subjectContext = subjects.map(s => {
      const subjectSessions = sessions.filter(ss => ss.subject_id === s.id);
      const totalHours = Number(s.total_study_hours) || 0;
      const lastStudied = s.last_studied_at ? new Date(s.last_studied_at).toLocaleDateString() : "never";
      const subjectTasks = tasks.filter(t => t.subject_id === s.id);
      const urgentDeadlines = subjectTasks
        .filter(t => t.deadline)
        .map(t => ({ title: t.title, deadline: t.deadline, priority: t.priority }));
      return `- ${s.name} (color: ${s.color}, total hours: ${totalHours.toFixed(1)}, last studied: ${lastStudied}, pending tasks: ${subjectTasks.length}, urgent deadlines: ${JSON.stringify(urgentDeadlines)})`;
    }).join("\n");

    const goalContext = goals.map(g =>
      `- ${g.title} (type: ${g.goal_type}, target: ${g.target_value}, progress: ${g.current_value ?? 0}, deadline: ${g.end_date ?? "none"})`
    ).join("\n");

    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const prompt = `You are a study planning AI. Generate an optimized ${daysToGenerate}-day study plan.

USER CONTEXT:
- Available study hours per day: ${availableHoursPerDay}
- Average focus session length: ${avgSessionMinutes} minutes
- Average focus score: ${avgFocusScore}/100
- Today is ${dayNames[today.getDay()]}, ${today.toLocaleDateString()}

SUBJECTS:
${subjectContext || "No subjects yet"}

GOALS:
${goalContext || "No active goals"}

PENDING TASKS (${tasks.length} total):
${tasks.slice(0, 15).map(t => `- ${t.title} (priority: ${t.priority}, deadline: ${t.deadline ?? "none"}, subject: ${subjects.find(s => s.id === t.subject_id)?.name ?? "general"})`).join("\n") || "No tasks"}

RULES:
1. Prioritize subjects with upcoming deadlines
2. Balance difficult and easy subjects each day
3. Don't exceed ${availableHoursPerDay} hours per day
4. Session blocks should be ${Math.min(avgSessionMinutes + 5, 50)} minutes or less
5. Include variety - don't schedule the same subject for more than 2 consecutive blocks
6. If focus score is low (<70), prefer shorter sessions (20-25 min)
7. Provide a brief reason for each recommendation`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a study planning assistant. Always respond with the requested tool call." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_study_plan",
            description: "Create a multi-day study plan with session blocks",
            parameters: {
              type: "object",
              properties: {
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string", description: "YYYY-MM-DD format" },
                      sessions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            subject_name: { type: "string" },
                            recommended_minutes: { type: "integer", minimum: 10, maximum: 90 },
                            priority: { type: "string", enum: ["high", "medium", "low"] },
                            reason: { type: "string" },
                          },
                          required: ["subject_name", "recommended_minutes", "priority", "reason"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["date", "sessions"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["days"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_study_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      console.error("AI error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No plan generated");

    const plan = JSON.parse(toolCall.function.arguments);

    // Delete old unlocked plans for these dates, then insert new ones
    const dates = plan.days.map((d: any) => d.date);
    await supabase.from("study_plans")
      .delete()
      .eq("user_id", user.id)
      .eq("locked", false)
      .in("plan_date", dates);

    const planRows = plan.days.flatMap((day: any) =>
      day.sessions.map((session: any) => {
        const matchedSubject = subjects.find(s =>
          s.name.toLowerCase().includes(session.subject_name.toLowerCase()) ||
          session.subject_name.toLowerCase().includes(s.name.toLowerCase())
        );
        return {
          user_id: user.id,
          plan_date: day.date,
          subject_id: matchedSubject?.id ?? null,
          subject_name: session.subject_name,
          recommended_minutes: session.recommended_minutes,
          priority: session.priority,
          reason: session.reason,
        };
      })
    );

    if (planRows.length > 0) {
      const { error: insertError } = await supabase.from("study_plans").insert(planRows);
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true, plan: plan.days }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-study-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
