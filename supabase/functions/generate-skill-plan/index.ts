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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase configuration");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { skill_name, specific_topic, daily_hours = 2, target_days = 7, experience_level = "beginner" } = await req.json();
    if (!skill_name) throw new Error("Skill name is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const topicContext = specific_topic ? `Focus specifically on: ${specific_topic}` : "Cover all essential topics";
    const totalHours = daily_hours * target_days;

    // Call 1: Generate learning topics & resources
    const topicsPrompt = `You are a curriculum designer. Create a complete learning plan for the skill "${skill_name}".
${topicContext}

STUDENT CONTEXT:
- Experience level: ${experience_level}
- Available daily study time: ${daily_hours} hours
- Target duration: ${target_days} days
- Total available time: ${totalHours} hours

REQUIREMENTS:
1. Break the skill into logical learning topics in order from fundamentals to advanced
2. Estimate realistic study time for each topic (in minutes)
3. Total time must not exceed ${totalHours} hours
4. For each topic, provide 2-3 real learning resources (URLs to tutorials, documentation, videos)
5. Assign each topic to a specific day based on the daily hours constraint
6. Adjust depth based on experience level (${experience_level})

Provide real, working URLs for resources (use well-known sites like MDN, W3Schools, GeeksforGeeks, tutorialspoint, youtube.com, docs.python.org, cprogramming.com, etc.)`;

    // Call 2: Generate comprehensive student-focused skill analysis
    const analysisPrompt = `You are an AI Learning Architect and Student Skill Mastery Guide. Analyze the skill "${skill_name}"${specific_topic ? ` (focus: ${specific_topic})` : ""} for a ${experience_level} student.

Focus ONLY on learning, understanding, and mastering the skill. This is for students, not professionals.

Produce a comprehensive student-focused analysis covering ALL sections:

1. SKILL OVERVIEW: What the skill is (simple explanation), why useful to learn, where used in real life, examples of things that can be built
2. DIFFICULTY ANALYSIS: Rate 1-10 for concept_difficulty, technical_difficulty, learning_curve, time_to_learn. Provide overall_score, classification (Beginner/Intermediate/Advanced), estimated_weeks
3. PREREQUISITES: core prerequisites (must know before starting, with reasons) and helpful supporting knowledge (with reasons)
4. LEARNING ROADMAP: 5 stages (Foundations, Core Concepts, Practical Practice, Advanced Understanding, Mastery) - each with topics, key_concepts, practice_exercises
5. SKILL TREE: A text-based tree showing how the skill grows from beginner to advanced (use ├── and └── formatting)
6. PRACTICE PROJECTS: 3 beginner, 3 intermediate, 2 advanced projects - each with name, description, what_it_teaches
7. LEARNING TIMELINE (assuming 1-2 hours/day): 30-day plan, 90-day plan, 6-month mastery plan with milestones
8. TOOLS NEEDED: beginner tools and advanced tools, each with name and what it's used for
9. BEST LEARNING RESOURCES: beginner-friendly courses, youtube channels, books, websites, practice platforms (name + url)
10. COMMON BEGINNER MISTAKES: mistakes students make and how to avoid them
11. STUDY TIPS: strategies for faster learning and better retention`;

    const aiHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    // Run both AI calls in parallel
    const [topicsResponse, analysisResponse] = await Promise.all([
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a curriculum design AI. Always respond with the requested tool call." },
            { role: "user", content: topicsPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_skill_plan",
              description: "Create a structured skill learning plan with topics, resources, and schedule",
              parameters: {
                type: "object",
                properties: {
                  topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic_name: { type: "string" },
                        description: { type: "string" },
                        estimated_minutes: { type: "integer", minimum: 10, maximum: 180 },
                        scheduled_day: { type: "integer", minimum: 1 },
                        resources: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              url: { type: "string" },
                              resource_type: { type: "string", enum: ["article", "video", "documentation", "exercise", "tutorial"] },
                            },
                            required: ["title", "url", "resource_type"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["topic_name", "description", "estimated_minutes", "scheduled_day", "resources"],
                      additionalProperties: false,
                    },
                  },
                  total_estimated_hours: { type: "number" },
                },
                required: ["topics", "total_estimated_hours"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_skill_plan" } },
        }),
      }),
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a career architect and skill analyst. Always respond with the requested tool call." },
            { role: "user", content: analysisPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "skill_analysis",
              description: "Comprehensive skill analysis with difficulty, prerequisites, projects, career paths",
              parameters: {
                type: "object",
                properties: {
                  overview: {
                    type: "object",
                    properties: {
                      what_it_is: { type: "string" },
                      where_used: { type: "string" },
                      why_valuable: { type: "string" },
                      career_opportunities: { type: "array", items: { type: "string" } },
                    },
                    required: ["what_it_is", "where_used", "why_valuable", "career_opportunities"],
                    additionalProperties: false,
                  },
                  difficulty: {
                    type: "object",
                    properties: {
                      conceptual_difficulty: { type: "integer", minimum: 1, maximum: 10 },
                      technical_complexity: { type: "integer", minimum: 1, maximum: 10 },
                      learning_curve: { type: "integer", minimum: 1, maximum: 10 },
                      time_to_master: { type: "integer", minimum: 1, maximum: 10 },
                      job_market_competition: { type: "integer", minimum: 1, maximum: 10 },
                      overall_score: { type: "number" },
                      classification: { type: "string" },
                      estimated_weeks: { type: "integer" },
                    },
                    required: ["conceptual_difficulty", "technical_complexity", "learning_curve", "time_to_master", "job_market_competition", "overall_score", "classification", "estimated_weeks"],
                    additionalProperties: false,
                  },
                  prerequisites: {
                    type: "object",
                    properties: {
                      absolute: { type: "array", items: { type: "string" } },
                      helpful: { type: "array", items: { type: "string" } },
                    },
                    required: ["absolute", "helpful"],
                    additionalProperties: false,
                  },
                  stages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        topics: { type: "array", items: { type: "string" } },
                        key_concepts: { type: "array", items: { type: "string" } },
                        tools: { type: "array", items: { type: "string" } },
                        exercises: { type: "array", items: { type: "string" } },
                      },
                      required: ["name", "topics", "key_concepts", "tools", "exercises"],
                      additionalProperties: false,
                    },
                  },
                  projects: {
                    type: "object",
                    properties: {
                      beginner: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, teaches: { type: "string" } }, required: ["name", "description", "teaches"], additionalProperties: false } },
                      intermediate: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, teaches: { type: "string" } }, required: ["name", "description", "teaches"], additionalProperties: false } },
                      advanced: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, teaches: { type: "string" } }, required: ["name", "description", "teaches"], additionalProperties: false } },
                      portfolio: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, teaches: { type: "string" } }, required: ["name", "description", "teaches"], additionalProperties: false },
                    },
                    required: ["beginner", "intermediate", "advanced", "portfolio"],
                    additionalProperties: false,
                  },
                  timeline: {
                    type: "object",
                    properties: {
                      thirty_days: { type: "string" },
                      ninety_days: { type: "string" },
                      six_months: { type: "string" },
                    },
                    required: ["thirty_days", "ninety_days", "six_months"],
                    additionalProperties: false,
                  },
                  resources: {
                    type: "object",
                    properties: {
                      courses: { type: "array", items: { type: "object", properties: { name: { type: "string" }, url: { type: "string" } }, required: ["name", "url"], additionalProperties: false } },
                      books: { type: "array", items: { type: "string" } },
                      youtube_channels: { type: "array", items: { type: "object", properties: { name: { type: "string" }, url: { type: "string" } }, required: ["name", "url"], additionalProperties: false } },
                      websites: { type: "array", items: { type: "object", properties: { name: { type: "string" }, url: { type: "string" } }, required: ["name", "url"], additionalProperties: false } },
                      practice_platforms: { type: "array", items: { type: "object", properties: { name: { type: "string" }, url: { type: "string" } }, required: ["name", "url"], additionalProperties: false } },
                    },
                    required: ["courses", "books", "youtube_channels", "websites", "practice_platforms"],
                    additionalProperties: false,
                  },
                  common_mistakes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        mistake: { type: "string" },
                        how_to_avoid: { type: "string" },
                      },
                      required: ["mistake", "how_to_avoid"],
                      additionalProperties: false,
                    },
                  },
                  career_paths: {
                    type: "object",
                    properties: {
                      jobs: { type: "array", items: { type: "string" } },
                      freelance: { type: "array", items: { type: "string" } },
                      startup: { type: "array", items: { type: "string" } },
                      earn_online: { type: "array", items: { type: "string" } },
                    },
                    required: ["jobs", "freelance", "startup", "earn_online"],
                    additionalProperties: false,
                  },
                  skill_comparison: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill_name: { type: "string" },
                        easier: { type: "boolean" },
                        more_in_demand: { type: "boolean" },
                        pays_more: { type: "boolean" },
                        notes: { type: "string" },
                      },
                      required: ["skill_name", "easier", "more_in_demand", "pays_more", "notes"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["overview", "difficulty", "prerequisites", "stages", "projects", "timeline", "resources", "common_mistakes", "career_paths", "skill_comparison"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "skill_analysis" } },
        }),
      }),
    ]);

    // Handle errors
    for (const [resp, label] of [[topicsResponse, "topics"], [analysisResponse, "analysis"]] as const) {
      if (!resp.ok) {
        const status = resp.status;
        const text = await resp.text();
        console.error(`${label} AI error:`, status, text);
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`${label} AI generation failed`);
      }
    }

    const [topicsData, analysisData] = await Promise.all([topicsResponse.json(), analysisResponse.json()]);

    const topicsToolCall = topicsData.choices?.[0]?.message?.tool_calls?.[0];
    if (!topicsToolCall) throw new Error("No plan generated");
    const plan = JSON.parse(topicsToolCall.function.arguments);

    let analysisResult = null;
    const analysisToolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];
    if (analysisToolCall) {
      try {
        analysisResult = JSON.parse(analysisToolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse analysis:", e);
      }
    }

    const startDate = new Date();

    // Insert skill plan with analysis_data
    const { data: skillPlan, error: planError } = await supabase
      .from("skill_plans")
      .insert({
        user_id: user.id,
        skill_name,
        specific_topic: specific_topic || null,
        experience_level,
        daily_hours,
        target_days,
        total_estimated_hours: plan.total_estimated_hours,
        analysis_data: analysisResult,
      })
      .select()
      .single();

    if (planError) throw planError;

    // Insert topics
    for (let i = 0; i < plan.topics.length; i++) {
      const topic = plan.topics[i];
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + (topic.scheduled_day - 1));

      const { data: topicData, error: topicError } = await supabase
        .from("skill_topics")
        .insert({
          skill_plan_id: skillPlan.id,
          topic_name: topic.topic_name,
          description: topic.description,
          estimated_minutes: topic.estimated_minutes,
          sort_order: i,
          scheduled_date: scheduledDate.toISOString().split("T")[0],
        })
        .select()
        .single();

      if (topicError) { console.error("Topic insert error:", topicError); continue; }

      if (topic.resources?.length > 0) {
        const resourceRows = topic.resources.map((r: any) => ({
          skill_topic_id: topicData.id,
          title: r.title,
          url: r.url,
          resource_type: r.resource_type,
        }));
        const { error: resError } = await supabase.from("skill_resources").insert(resourceRows);
        if (resError) console.error("Resource insert error:", resError);
      }
    }

    return new Response(JSON.stringify({ success: true, skill_plan_id: skillPlan.id, plan, analysis: analysisResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-skill-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
