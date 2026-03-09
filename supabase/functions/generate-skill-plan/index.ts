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

    // Call 2: Generate core skill analysis
    const analysisPrompt = `You are an AI Student Skill Mastery Guide. Analyze "${skill_name}"${specific_topic ? ` (focus: ${specific_topic})` : ""} for a ${experience_level} student.
Focus ONLY on learning and mastery, not jobs or monetization.

Generate ALL sections:
1. OVERVIEW: what_it_is, why_useful, where_used, build_examples, connected_subjects
2. DIFFICULTY: concept_difficulty(1-10), technical_complexity(1-10), learning_curve(1-10), practice_requirement(1-10), time_to_learn(1-10), tool_complexity(1-10), overall_score, classification, estimated_weeks
3. PREREQUISITES: core(name+reason), helpful(name+reason)
4. SKILL DECOMPOSITION: components array with name+description showing fundamentals→core→practical→advanced→applications
5. SKILL TREE: text tree using ├── └── showing full hierarchy
6. LEARNING ROADMAP: 5 stages (Foundations, Core Concepts, Practical Practice, Advanced Understanding, Mastery) with topics, key_concepts, practice_exercises, study_method
7. ADAPTIVE PATHS: slow_learner, average_learner, fast_learner approaches
8. TIMELINE: 30-day, 60-day, 90-day, 180-day plans with weekly milestones
9. STUDY ROUTINE: daily routine items (concept_learning, practice, revision, project_work, testing)
10. EXERCISES: 5 beginner, 5 intermediate, 3 advanced
11. PROJECTS: 3 beginner, 3 intermediate, 2 advanced with name, description, skills_learned
12. QUIZ: 5 beginner, 3 intermediate, 2 advanced questions with options and correct_answer
13. TOOLS: beginner, professional, optional - each with name and used_for
14. RESOURCES: courses, youtube_channels, books, websites, practice_platforms (name+url)
15. COMMON MISTAKES: mistake + how_to_avoid
16. MEMORY TECHNIQUES: technique + how_to_apply for this skill
17. PROGRESS CHECKLIST: checkpoints from beginner to mastery
18. MASTERY INDICATORS: signs that show skill mastery
19. RELATED SKILLS: 5 skills to learn next with connection explanation
20. SKILL FUTURE: trends, why_stays_relevant, growth_areas
21. STUDENT ADVICE: practical tips for consistency, overcoming difficulty, effective practice`;

    // Call 3: Extended mastery content (exercises, quiz, routines, progress)
    const extendedPrompt = `You are an AI Student Learning Coach. For the skill "${skill_name}"${specific_topic ? ` (focus: ${specific_topic})` : ""}, generate extended learning content for a ${experience_level} student.

Generate ALL of the following:
1. ADAPTIVE LEARNING PATHS: Describe approaches for slow_learner, average_learner, fast_learner
2. EXTENDED TIMELINE: 30-day, 60-day, 90-day, 180-day plans with weekly milestones
3. DAILY STUDY ROUTINE: Items for concept_learning, practice, revision, project_work, testing with time allocations
4. PRACTICE EXERCISES: 5 beginner, 5 intermediate, 3 advanced exercises
5. KNOWLEDGE QUIZ: 5 beginner, 3 intermediate, 2 advanced questions with 4 options each and correct_answer index
6. MEMORY TECHNIQUES: Study strategies (active recall, spaced repetition, etc.) with how_to_apply for this skill
7. PROGRESS CHECKLIST: Checkpoint milestones from beginner to mastery
8. MASTERY INDICATORS: Clear signs of skill mastery
9. RELATED SKILLS: 5 skills to learn next with connection_to_current
10. SKILL FUTURE: emerging trends, why it stays relevant, growth areas
11. STUDENT ADVICE: Tips for consistency, overcoming difficulty, effective practice`;

    const aiHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    const coreAnalysisSchema = {
      type: "object",
      properties: {
        overview: {
          type: "object",
          properties: {
            what_it_is: { type: "string" },
            why_useful: { type: "string" },
            where_used: { type: "string" },
            build_examples: { type: "array", items: { type: "string" } },
            connected_subjects: { type: "array", items: { type: "string" } },
          },
          required: ["what_it_is", "why_useful", "where_used", "build_examples", "connected_subjects"],
          additionalProperties: false,
        },
        difficulty: {
          type: "object",
          properties: {
            concept_difficulty: { type: "integer", minimum: 1, maximum: 10 },
            technical_complexity: { type: "integer", minimum: 1, maximum: 10 },
            learning_curve: { type: "integer", minimum: 1, maximum: 10 },
            practice_requirement: { type: "integer", minimum: 1, maximum: 10 },
            time_to_learn: { type: "integer", minimum: 1, maximum: 10 },
            tool_complexity: { type: "integer", minimum: 1, maximum: 10 },
            overall_score: { type: "number" },
            classification: { type: "string" },
            estimated_weeks: { type: "integer" },
          },
          required: ["concept_difficulty", "technical_complexity", "learning_curve", "practice_requirement", "time_to_learn", "tool_complexity", "overall_score", "classification", "estimated_weeks"],
          additionalProperties: false,
        },
        prerequisites: {
          type: "object",
          properties: {
            core: { type: "array", items: { type: "object", properties: { name: { type: "string" }, reason: { type: "string" } }, required: ["name", "reason"], additionalProperties: false } },
            helpful: { type: "array", items: { type: "object", properties: { name: { type: "string" }, reason: { type: "string" } }, required: ["name", "reason"], additionalProperties: false } },
          },
          required: ["core", "helpful"],
          additionalProperties: false,
        },
        decomposition: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name", "description"], additionalProperties: false },
        },
        skill_tree: { type: "string" },
        stages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              topics: { type: "array", items: { type: "string" } },
              key_concepts: { type: "array", items: { type: "string" } },
              practice_exercises: { type: "array", items: { type: "string" } },
              study_method: { type: "string" },
            },
            required: ["name", "topics", "key_concepts", "practice_exercises", "study_method"],
            additionalProperties: false,
          },
        },
        projects: {
          type: "object",
          properties: {
            beginner: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, teaches: { type: "string" } }, required: ["name", "description", "teaches"], additionalProperties: false } },
            intermediate: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, teaches: { type: "string" } }, required: ["name", "description", "teaches"], additionalProperties: false } },
            advanced: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, teaches: { type: "string" } }, required: ["name", "description", "teaches"], additionalProperties: false } },
          },
          required: ["beginner", "intermediate", "advanced"],
          additionalProperties: false,
        },
        tools: {
          type: "object",
          properties: {
            beginner: { type: "array", items: { type: "object", properties: { name: { type: "string" }, used_for: { type: "string" } }, required: ["name", "used_for"], additionalProperties: false } },
            professional: { type: "array", items: { type: "object", properties: { name: { type: "string" }, used_for: { type: "string" } }, required: ["name", "used_for"], additionalProperties: false } },
            optional: { type: "array", items: { type: "object", properties: { name: { type: "string" }, used_for: { type: "string" } }, required: ["name", "used_for"], additionalProperties: false } },
          },
          required: ["beginner", "professional", "optional"],
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
        common_mistakes: { type: "array", items: { type: "object", properties: { mistake: { type: "string" }, how_to_avoid: { type: "string" } }, required: ["mistake", "how_to_avoid"], additionalProperties: false } },
        study_tips: { type: "array", items: { type: "object", properties: { tip: { type: "string" }, explanation: { type: "string" } }, required: ["tip", "explanation"], additionalProperties: false } },
      },
      required: ["overview", "difficulty", "prerequisites", "decomposition", "skill_tree", "stages", "projects", "tools", "resources", "common_mistakes", "study_tips"],
      additionalProperties: false,
    };

    const extendedSchema = {
      type: "object",
      properties: {
        adaptive_paths: {
          type: "object",
          properties: {
            slow_learner: { type: "string" },
            average_learner: { type: "string" },
            fast_learner: { type: "string" },
          },
          required: ["slow_learner", "average_learner", "fast_learner"],
          additionalProperties: false,
        },
        extended_timeline: {
          type: "object",
          properties: {
            thirty_days: { type: "string" },
            sixty_days: { type: "string" },
            ninety_days: { type: "string" },
            one_eighty_days: { type: "string" },
          },
          required: ["thirty_days", "sixty_days", "ninety_days", "one_eighty_days"],
          additionalProperties: false,
        },
        study_routine: {
          type: "array",
          items: { type: "object", properties: { activity: { type: "string" }, duration_minutes: { type: "integer" }, description: { type: "string" } }, required: ["activity", "duration_minutes", "description"], additionalProperties: false },
        },
        exercises: {
          type: "object",
          properties: {
            beginner: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"], additionalProperties: false } },
            intermediate: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"], additionalProperties: false } },
            advanced: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"], additionalProperties: false } },
          },
          required: ["beginner", "intermediate", "advanced"],
          additionalProperties: false,
        },
        quiz: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
              options: { type: "array", items: { type: "string" } },
              correct_answer: { type: "integer" },
            },
            required: ["question", "level", "options", "correct_answer"],
            additionalProperties: false,
          },
        },
        memory_techniques: {
          type: "array",
          items: { type: "object", properties: { technique: { type: "string" }, how_to_apply: { type: "string" } }, required: ["technique", "how_to_apply"], additionalProperties: false },
        },
        progress_checklist: {
          type: "array",
          items: { type: "object", properties: { checkpoint: { type: "string" }, level: { type: "string" } }, required: ["checkpoint", "level"], additionalProperties: false },
        },
        mastery_indicators: { type: "array", items: { type: "string" } },
        related_skills: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" }, connection: { type: "string" } }, required: ["name", "connection"], additionalProperties: false },
        },
        skill_future: {
          type: "object",
          properties: {
            trends: { type: "array", items: { type: "string" } },
            why_stays_relevant: { type: "string" },
            growth_areas: { type: "array", items: { type: "string" } },
          },
          required: ["trends", "why_stays_relevant", "growth_areas"],
          additionalProperties: false,
        },
        student_advice: {
          type: "array",
          items: { type: "object", properties: { advice: { type: "string" }, detail: { type: "string" } }, required: ["advice", "detail"], additionalProperties: false },
        },
      },
      required: ["adaptive_paths", "extended_timeline", "study_routine", "exercises", "quiz", "memory_techniques", "progress_checklist", "mastery_indicators", "related_skills", "skill_future", "student_advice"],
      additionalProperties: false,
    };

    // Run all 3 AI calls in parallel
    const [topicsResponse, analysisResponse, extendedResponse] = await Promise.all([
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
            { role: "system", content: "You are an AI student skill mastery guide. Always respond with the requested tool call." },
            { role: "user", content: analysisPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "skill_analysis",
              description: "Core skill analysis for students",
              parameters: coreAnalysisSchema,
            },
          }],
          tool_choice: { type: "function", function: { name: "skill_analysis" } },
        }),
      }),
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an AI student learning coach. Always respond with the requested tool call." },
            { role: "user", content: extendedPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "extended_mastery",
              description: "Extended mastery content with exercises, quiz, routines, progress tracking",
              parameters: extendedSchema,
            },
          }],
          tool_choice: { type: "function", function: { name: "extended_mastery" } },
        }),
      }),
    ]);

    // Handle errors
    for (const [resp, label] of [[topicsResponse, "topics"], [analysisResponse, "analysis"], [extendedResponse, "extended"]] as const) {
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
