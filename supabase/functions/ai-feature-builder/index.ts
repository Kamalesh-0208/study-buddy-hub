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

    const { request: featureRequest } = await req.json();
    if (!featureRequest || typeof featureRequest !== "string") {
      throw new Error("Feature request text is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an AI Feature Builder for a study/skill practice platform called StudyFlow Pro Max.

The platform currently has these features:
- Dashboard with stats, streaks, XP
- Focus Mode (Pomodoro timer)
- Task planner
- Study materials hub
- Analytics & performance tracking
- Goals tracking
- Leaderboard
- AI Study Planner
- Skill Assessment (MCQ, Programming, Web Dev, Database, Aptitude)
- Feature request system
- Gamification (XP, levels, streaks, achievements)

A user has requested the following feature:
"${featureRequest}"

Analyze this request and generate a complete feature design plan.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a senior product engineer and AI feature builder. Generate detailed, actionable feature plans. Respond only with the tool call." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_feature_plan",
            description: "Generate a complete feature design plan",
            parameters: {
              type: "object",
              properties: {
                feature_name: { type: "string", description: "Short feature name" },
                purpose: { type: "string", description: "What problem this solves" },
                target_users: { type: "string", description: "Who benefits from this feature" },
                placement: { type: "string", description: "Where it appears in the app" },
                ui_components: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", enum: ["page", "component", "modal", "button", "form", "widget"] },
                      description: { type: "string" },
                    },
                    required: ["name", "type", "description"],
                    additionalProperties: false,
                  },
                },
                user_workflow: {
                  type: "array",
                  items: { type: "string" },
                  description: "Step-by-step user interaction flow",
                },
                backend_logic: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["name", "description"],
                    additionalProperties: false,
                  },
                },
                database_tables: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      table_name: { type: "string" },
                      fields: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            type: { type: "string" },
                            description: { type: "string" },
                          },
                          required: ["name", "type", "description"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["table_name", "fields"],
                    additionalProperties: false,
                  },
                },
                api_endpoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] },
                      path: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["method", "path", "description"],
                    additionalProperties: false,
                  },
                },
                integration_points: {
                  type: "array",
                  items: { type: "string" },
                  description: "How this integrates with existing features",
                },
                implementation_steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      step: { type: "integer" },
                      task: { type: "string" },
                      category: { type: "string", enum: ["frontend", "backend", "database", "testing"] },
                    },
                    required: ["step", "task", "category"],
                    additionalProperties: false,
                  },
                },
                estimated_complexity: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["feature_name", "purpose", "target_users", "placement", "ui_components", "user_workflow", "backend_logic", "database_tables", "api_endpoints", "integration_points", "implementation_steps", "estimated_complexity"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_feature_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResponse.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No feature plan generated");

    const plan = JSON.parse(toolCall.function.arguments);

    // Save to feature_requests with the AI-generated plan
    await supabase.from("feature_requests").insert({
      user_id: user.id,
      title: plan.feature_name,
      description: featureRequest,
      status: "planned",
    });

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Feature builder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
