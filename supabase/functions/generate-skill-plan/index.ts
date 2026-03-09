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

    const prompt = `You are a curriculum designer. Create a complete learning plan for the skill "${skill_name}".
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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a curriculum design AI. Always respond with the requested tool call." },
          { role: "user", content: prompt },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No plan generated");

    const plan = JSON.parse(toolCall.function.arguments);

    // Calculate start date
    const startDate = new Date();

    // Insert skill plan
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

      if (topicError) {
        console.error("Topic insert error:", topicError);
        continue;
      }

      // Insert resources
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

    return new Response(JSON.stringify({ success: true, skill_plan_id: skillPlan.id, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-skill-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
