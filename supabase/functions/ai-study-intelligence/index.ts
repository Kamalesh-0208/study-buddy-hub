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
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { action } = await req.json();

    // Fetch all user data in parallel
    const [subjectsRes, tasksRes, sessionsRes, goalsRes, focusRes, examsRes] = await Promise.all([
      supabase.from("subjects").select("*").eq("user_id", user.id),
      supabase.from("tasks").select("*").eq("user_id", user.id),
      supabase.from("study_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
      supabase.from("goals").select("*").eq("user_id", user.id),
      supabase.from("focus_activity").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("exam_schedule").select("*").eq("user_id", user.id),
    ]);

    const subjects = subjectsRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const sessions = sessionsRes.data ?? [];
    const goals = goalsRes.data ?? [];
    const focusData = focusRes.data ?? [];
    const exams = examsRes.data ?? [];
    const now = new Date();

    if (action === "calculate_readiness") {
      // Calculate readiness scores per subject
      const readinessResults = [];
      
      for (const subject of subjects) {
        const subjectSessions = sessions.filter(s => s.subject_id === subject.id);
        const subjectTasks = tasks.filter(t => t.subject_id === subject.id);
        const subjectFocus = focusData.filter(f => f.session_id && subjectSessions.some(s => s.id === f.session_id));
        const exam = exams.find(e => e.subject_id === subject.id);

        // Study Hours component (0-40): normalize to max 50 hours
        const totalHours = Number(subject.total_study_hours) || 0;
        const studyHoursScore = Math.min(40, (totalHours / 50) * 40);

        // Revision Frequency component (0-20): sessions in last 14 days
        const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
        const recentSessions = subjectSessions.filter(s => new Date(s.start_time) >= twoWeeksAgo);
        const revisionScore = Math.min(20, (recentSessions.length / 10) * 20);

        // Task Completion Rate component (0-15)
        const completedTasks = subjectTasks.filter(t => t.completed).length;
        const taskRate = subjectTasks.length > 0 ? completedTasks / subjectTasks.length : 0;
        const taskScore = taskRate * 15;

        // Average Focus Score component (0-15)
        const avgFocus = subjectFocus.length > 0
          ? subjectFocus.reduce((s, f) => s + (f.focus_score ?? 80), 0) / subjectFocus.length
          : (subjectSessions.length > 0 ? subjectSessions.reduce((s, ss) => s + (ss.focus_score ?? 80), 0) / subjectSessions.length : 0);
        const focusScore = (avgFocus / 100) * 15;

        // Consistency component (0-10): unique study days in last 14 days
        const studyDays = new Set(recentSessions.map(s => new Date(s.start_time).toISOString().split("T")[0]));
        const consistencyScore = Math.min(10, (studyDays.size / 10) * 10);

        const readinessScore = Math.round(studyHoursScore + revisionScore + taskScore + focusScore + consistencyScore);

        readinessResults.push({
          subject_id: subject.id,
          subject_name: subject.name,
          readiness_score: Math.min(100, readinessScore),
          study_hours_component: Math.round(studyHoursScore * 10) / 10,
          revision_component: Math.round(revisionScore * 10) / 10,
          task_component: Math.round(taskScore * 10) / 10,
          focus_component: Math.round(focusScore * 10) / 10,
          consistency_component: Math.round(consistencyScore * 10) / 10,
          exam_date: exam?.exam_date ?? null,
          exam_name: exam?.exam_name ?? null,
          days_remaining: exam ? Math.max(0, Math.ceil((new Date(exam.exam_date).getTime() - now.getTime()) / 86400000)) : null,
          level: readinessScore <= 40 ? "poor" : readinessScore <= 60 ? "moderate" : readinessScore <= 80 ? "good" : "ready",
          recommended_hours: exam ? Math.max(0, Math.round((100 - readinessScore) * 0.5)) : null,
        });

        // Upsert readiness score
        const { data: existing } = await supabase
          .from("readiness_scores")
          .select("id")
          .eq("user_id", user.id)
          .eq("subject_id", subject.id)
          .order("calculated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const scoreData = {
          user_id: user.id,
          subject_id: subject.id,
          readiness_score: Math.min(100, readinessScore),
          study_hours_component: studyHoursScore,
          revision_component: revisionScore,
          task_component: taskScore,
          focus_component: focusScore,
          consistency_component: consistencyScore,
        };

        if (existing) {
          await supabase.from("readiness_scores").update({ ...scoreData, calculated_at: now.toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("readiness_scores").insert(scoreData);
        }
      }

      return new Response(JSON.stringify({ readiness: readinessResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_strategy") {
      // Build context for AI strategy generation
      const subjectContext = subjects.map(s => {
        const subSessions = sessions.filter(ss => ss.subject_id === s.id);
        const totalHours = Number(s.total_study_hours) || 0;
        const avgFocus = subSessions.length > 0 ? Math.round(subSessions.reduce((sum, ss) => sum + (ss.focus_score ?? 80), 0) / subSessions.length) : 0;
        const lastStudied = s.last_studied_at ? new Date(s.last_studied_at).toLocaleDateString() : "never";
        const exam = exams.find(e => e.subject_id === s.id);
        return `- ${s.name}: ${totalHours.toFixed(1)}h studied, avg focus ${avgFocus}, last studied ${lastStudied}${exam ? `, exam on ${exam.exam_date}` : ""}`;
      }).join("\n");

      const avgSessionLen = sessions.length > 0 ? Math.round(sessions.reduce((s, ss) => s + ss.duration_seconds, 0) / sessions.length / 60) : 25;
      const avgFocusAll = focusData.length > 0 ? Math.round(focusData.reduce((s, f) => s + (f.focus_score ?? 80), 0) / focusData.length) : 80;

      // Determine best study hours
      const hourBuckets: Record<number, { focus: number; count: number }> = {};
      sessions.forEach(s => {
        const h = new Date(s.start_time).getHours();
        if (!hourBuckets[h]) hourBuckets[h] = { focus: 0, count: 0 };
        hourBuckets[h].focus += s.focus_score ?? 80;
        hourBuckets[h].count += 1;
      });
      const bestHours = Object.entries(hourBuckets)
        .map(([h, d]) => ({ hour: Number(h), avg: d.focus / d.count }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 3);

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const prompt = `Analyze this student's data and generate personalized study strategies and a 7-day plan.

STUDENT DATA:
- Average session: ${avgSessionLen} min
- Average focus: ${avgFocusAll}/100
- Best study hours: ${bestHours.map(h => `${h.hour}:00 (focus: ${Math.round(h.avg)})`).join(", ") || "not enough data"}
- Pending tasks: ${tasks.filter(t => !t.completed).length}
- Active goals: ${goals.filter(g => !g.completed).length}

SUBJECTS:
${subjectContext || "No subjects yet"}

UPCOMING EXAMS:
${exams.map(e => `- ${subjects.find(s => s.id === e.subject_id)?.name ?? "Unknown"}: ${e.exam_date}`).join("\n") || "None scheduled"}`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a study strategy AI. Respond only with the requested tool call." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_strategy",
              description: "Generate study strategies and insights",
              parameters: {
                type: "object",
                properties: {
                  primary_strategy: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      reasoning: { type: "string" },
                    },
                    required: ["name", "description", "reasoning"],
                    additionalProperties: false,
                  },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        type: { type: "string", enum: ["tip", "warning", "encouragement"] },
                      },
                      required: ["text", "type"],
                      additionalProperties: false,
                    },
                  },
                  recommended_session_length: { type: "integer" },
                  weekly_plan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        sessions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              subject: { type: "string" },
                              minutes: { type: "integer" },
                              activity: { type: "string" },
                            },
                            required: ["subject", "minutes", "activity"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["day", "sessions"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["primary_strategy", "insights", "recommended_session_length", "weekly_plan"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_strategy" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI generation failed");
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No strategy generated");

      const strategy = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ strategy }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "detect_weak_topics") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const subjectContext = subjects.map(s => {
        const subSessions = sessions.filter(ss => ss.subject_id === s.id);
        const subTasks = tasks.filter(t => t.subject_id === s.id);
        const incompleteTasks = subTasks.filter(t => !t.completed);
        const lowFocusSessions = subSessions.filter(ss => (ss.focus_score ?? 80) < 60);
        const totalHours = Number(s.total_study_hours) || 0;
        return `- ${s.name}: ${totalHours.toFixed(1)}h total, ${subSessions.length} sessions, ${lowFocusSessions.length} low-focus sessions, ${incompleteTasks.length} incomplete tasks (${incompleteTasks.map(t => t.title).join(", ")})`;
      }).join("\n");

      const prompt = `Analyze this student's study data and detect weak topics within each subject.

SUBJECTS & PERFORMANCE:
${subjectContext || "No subjects"}

INCOMPLETE TASKS:
${tasks.filter(t => !t.completed).map(t => `- ${t.title} (${subjects.find(s => s.id === t.subject_id)?.name ?? "general"}, priority: ${t.priority})`).join("\n") || "None"}

Based on low study time, incomplete tasks, and low focus scores, identify specific weak topics within each subject.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a learning analytics AI. Respond only with the requested tool call." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_weak_topics",
              description: "Report detected weak topics per subject",
              parameters: {
                type: "object",
                properties: {
                  weak_topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        subject_name: { type: "string" },
                        topic_name: { type: "string" },
                        weakness_score: { type: "integer", minimum: 0, maximum: 100 },
                        reason: { type: "string" },
                        recommendation: { type: "string" },
                      },
                      required: ["subject_name", "topic_name", "weakness_score", "reason", "recommendation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["weak_topics"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report_weak_topics" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI generation failed");
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No weak topics detected");

      const result = JSON.parse(toolCall.function.arguments);

      // Clear old weak topics and insert new ones
      await supabase.from("weak_topics").delete().eq("user_id", user.id);

      const topicRows = result.weak_topics.map((wt: any) => {
        const matchedSubject = subjects.find(s =>
          s.name.toLowerCase().includes(wt.subject_name.toLowerCase()) ||
          wt.subject_name.toLowerCase().includes(s.name.toLowerCase())
        );
        return {
          user_id: user.id,
          subject_id: matchedSubject?.id ?? null,
          topic_name: wt.topic_name,
          weakness_score: wt.weakness_score,
          reason: wt.reason,
          recommendation: wt.recommendation,
        };
      });

      if (topicRows.length > 0) {
        await supabase.from("weak_topics").insert(topicRows);
      }

      return new Response(JSON.stringify({ weak_topics: result.weak_topics }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("ai-study-intelligence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
