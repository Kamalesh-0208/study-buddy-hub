import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) throw new Error("No JSON found in response");
  const openChar = cleaned[jsonStart];
  const closeChar = openChar === '[' ? ']' : '}';
  const jsonEnd = cleaned.lastIndexOf(closeChar);
  if (jsonEnd === -1) throw new Error("No closing JSON bracket found");

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, (c) => c === '\n' || c === '\t' ? c : "");
    return JSON.parse(cleaned);
  }
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

// Try to fetch cached MCQ questions from question_bank
async function fetchCachedQuestions(skill: string, topic: string, difficulty: string, count: number) {
  try {
    const sb = getSupabaseAdmin();
    let query = sb.from("question_bank").select("*")
      .eq("skill", skill)
      .eq("topic", topic)
      .eq("question_type", "mcq");

    if (difficulty !== "mixed") {
      query = query.eq("difficulty", difficulty);
    }

    const { data, error } = await query.limit(count * 2); // fetch extra for randomization
    if (error || !data || data.length < count) return null;

    // Shuffle and pick
    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, count);
    return shuffled.map((q: any, i: number) => ({
      question_number: i + 1,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
      difficulty_label: q.difficulty,
    }));
  } catch (e) {
    console.error("Cache fetch error:", e);
    return null;
  }
}

// Store generated MCQ questions in question_bank (fire-and-forget)
async function storeQuestionsInBackground(skill: string, topic: string, difficulty: string, questions: any[]) {
  try {
    const sb = getSupabaseAdmin();
    const rows = questions.map((q: any) => ({
      skill,
      topic,
      difficulty: q.difficulty_label || difficulty,
      question_type: "mcq",
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
      validated: false,
    }));
    await sb.from("question_bank").insert(rows);
  } catch (e) {
    console.error("Background store error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skillCategory, skill, topic, mode, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isProgramming = skillCategory === "programming";
    const isHTMLCSS = skillCategory === "htmlcss";
    const isExam = mode === "exam";

    const timerMinutes = isHTMLCSS ? 90 : 60;
    const mcqCount = 40;
    const mcqPassMark = 24;

    // --- MCQ: Try cached questions first ---
    if (!isProgramming && !isHTMLCSS) {
      const cached = await fetchCachedQuestions(skill, topic, difficulty, mcqCount);
      if (cached) {
        console.log(`Returning ${cached.length} cached questions for ${skill}/${topic}`);
        return new Response(JSON.stringify({
          type: "mcq", mode, skill, topic, difficulty,
          assessment: {
            questions: cached,
            timer_minutes: timerMinutes,
            total_questions: mcqCount,
            pass_mark: mcqPassMark,
            scoring_rules: "+1 correct, -0.25 wrong",
            instructions: `${isExam ? "Exam" : "Practice"} mode. ${mcqCount} questions, ${timerMinutes} minutes.`,
          },
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // --- Build AI prompt ---
    let systemPrompt: string;
    let toolSchema: any;
    let toolName: string;

    if (isHTMLCSS) {
      const webpageTopic = topic.split("|")[0] || "Landing Page";
      const extraReqs = topic.split("|")[1] || "";
      const requirementPool = [
        "Use Flexbox Layout", "Use CSS Grid Layout", "Use hover effects on buttons/links",
        "Use responsive design with media queries", "Use custom Google Fonts",
        "Use CSS transitions or animations", "Use semantic HTML elements", "Use a color gradient",
      ];
      const shuffled = requirementPool.sort(() => Math.random() - 0.5);
      const numReqs = difficulty === "easy" ? 2 : difficulty === "hard" ? 4 : 3;
      const selectedReqs = shuffled.slice(0, numReqs);
      if (extraReqs) selectedReqs.push(extraReqs);

      systemPrompt = `You are an expert HTML/CSS assessment generator. Generate a webpage recreation challenge.
Topic: "${webpageTopic}" webpage. Difficulty: "${difficulty}". Mode: ${isExam ? `Exam (${timerMinutes} minutes, no hints)` : "Practice (with hints and solution)"}.
REQUIRED RULES:\n${selectedReqs.map((r, i) => `${i + 1}. ${r}`).join("\n")}
Generate: design description, specs, requirements, reference HTML, reference CSS, layout explanation, ${isExam ? "no hints" : "5 hints"}, evaluation criteria.
Set timer_minutes to ${timerMinutes}.`;

      toolName = "generate_htmlcss_assessment";
      toolSchema = {
        type: "function",
        function: {
          name: toolName,
          description: "Generate an HTML/CSS webpage recreation challenge",
          parameters: {
            type: "object",
            properties: {
              challenge: {
                type: "object",
                properties: {
                  title: { type: "string" }, design_description: { type: "string" },
                  design_spec: {
                    type: "object",
                    properties: {
                      layout_description: { type: "string" }, color_scheme: { type: "array", items: { type: "string" } },
                      typography: { type: "string" }, components: { type: "array", items: { type: "string" } },
                      spacing_notes: { type: "string" }, responsive_notes: { type: "string" },
                    },
                    required: ["layout_description", "color_scheme", "typography", "components", "spacing_notes", "responsive_notes"],
                  },
                  requirements: { type: "array", items: { type: "object", properties: { rule: { type: "string" }, description: { type: "string" } }, required: ["rule", "description"] } },
                  reference_html: { type: "string" }, reference_css: { type: "string" },
                  layout_explanation: { type: "string" },
                  hints: { type: "array", items: { type: "string" } },
                  evaluation_criteria: { type: "array", items: { type: "string" } },
                  difficulty_label: { type: "string" },
                },
                required: ["title", "design_description", "design_spec", "requirements", "reference_html", "reference_css", "layout_explanation", "hints", "evaluation_criteria", "difficulty_label"],
              },
              timer_minutes: { type: "number" }, instructions: { type: "string" },
            },
            required: ["challenge", "timer_minutes", "instructions"],
          },
        },
      };
    } else if (isProgramming) {
      systemPrompt = `You are an expert programming assessment generator. Generate exactly 2 coding problems for "${skill}" on topic "${topic}" at "${difficulty}" difficulty.
Each problem needs: title, description, input_format, output_format, constraints, 2 sample_tests, 2 hidden_tests, solution_code in ${skill}, solution_explanation, common_mistakes, difficulty_label.
${isExam ? "EXAM mode - solutions revealed after submission." : "PRACTICE mode - include solutions."}
Set timer_minutes to ${timerMinutes}.`;

      toolName = "generate_programming_assessment";
      toolSchema = {
        type: "function",
        function: {
          name: toolName,
          description: "Generate programming coding problems",
          parameters: {
            type: "object",
            properties: {
              problems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" }, description: { type: "string" },
                    input_format: { type: "string" }, output_format: { type: "string" },
                    constraints: { type: "string" },
                    sample_tests: { type: "array", items: { type: "object", properties: { input: { type: "string" }, expected_output: { type: "string" } }, required: ["input", "expected_output"] } },
                    hidden_tests: { type: "array", items: { type: "object", properties: { input: { type: "string" }, expected_output: { type: "string" } }, required: ["input", "expected_output"] } },
                    solution_code: { type: "string" }, solution_explanation: { type: "string" },
                    common_mistakes: { type: "array", items: { type: "string" } },
                    difficulty_label: { type: "string" },
                  },
                  required: ["title", "description", "input_format", "output_format", "constraints", "sample_tests", "hidden_tests", "solution_code", "solution_explanation", "common_mistakes", "difficulty_label"],
                },
              },
              timer_minutes: { type: "number" }, instructions: { type: "string" },
            },
            required: ["problems", "timer_minutes", "instructions"],
          },
        },
      };
    } else {
      let difficultyInstruction = difficulty === "mixed"
        ? "Generate exactly 15 Easy, 15 Medium, and 10 Hard questions."
        : `All questions should be ${difficulty} difficulty.`;

      systemPrompt = `You are an expert MCQ generator. Generate exactly ${mcqCount} multiple choice questions for "${skill}" on "${topic}".
${difficultyInstruction}
Each question: question_text, 4 options (A/B/C/D), correct_answer letter, explanation, difficulty_label.
${isExam ? `EXAM mode: +1 correct, -0.25 wrong. Pass mark ${mcqPassMark}/${mcqCount}. Timer ${timerMinutes} min.` : `PRACTICE mode: instant feedback, explanations shown. Timer ${timerMinutes} min.`}
Set timer_minutes=${timerMinutes}, total_questions=${mcqCount}, pass_mark=${mcqPassMark}.`;

      toolName = "generate_mcq_assessment";
      toolSchema = {
        type: "function",
        function: {
          name: toolName,
          description: "Generate MCQ assessment questions",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question_number: { type: "number" }, question_text: { type: "string" },
                    options: { type: "object", properties: { A: { type: "string" }, B: { type: "string" }, C: { type: "string" }, D: { type: "string" } }, required: ["A", "B", "C", "D"] },
                    correct_answer: { type: "string" }, explanation: { type: "string" }, difficulty_label: { type: "string" },
                  },
                  required: ["question_number", "question_text", "options", "correct_answer", "explanation", "difficulty_label"],
                },
              },
              timer_minutes: { type: "number" }, total_questions: { type: "number" },
              pass_mark: { type: "number" }, scoring_rules: { type: "string" }, instructions: { type: "string" },
            },
            required: ["questions", "timer_minutes", "total_questions", "pass_mark", "scoring_rules", "instructions"],
          },
        },
      };
    }

    // --- Call AI ---
    const makeRequest = async (useToolChoice: boolean) => {
      const body: any = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate the assessment now for: Skill="${skill}", Topic="${topic}", Difficulty="${difficulty}", Mode="${mode}". Call the provided tool function with the result.` },
        ],
        tools: [toolSchema],
        temperature: 0.7,
      };
      if (useToolChoice) body.tool_choice = { type: "function", function: { name: toolName } };
      return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    };

    const parseResponse = (data: any): any => {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try { return JSON.parse(toolCall.function.arguments); } catch { return extractJsonFromResponse(toolCall.function.arguments); }
      }
      const content = data.choices?.[0]?.message?.content;
      if (content) return extractJsonFromResponse(content);
      return null;
    };

    let response = await makeRequest(true);

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    let data = await response.json();
    let assessment = parseResponse(data);

    if (!assessment) {
      console.log("Attempt 1 failed, retrying without tool_choice...");
      response = await makeRequest(false);
      if (response.ok) { data = await response.json(); assessment = parseResponse(data); }
    }

    if (!assessment) throw new Error("Failed to generate assessment. Please try again.");

    // Enforce values
    assessment.timer_minutes = timerMinutes;
    if (!isProgramming && !isHTMLCSS) {
      assessment.pass_mark = mcqPassMark;
      assessment.total_questions = mcqCount;

      // Store generated MCQ questions in background
      if (assessment.questions?.length) {
        storeQuestionsInBackground(skill, topic, difficulty, assessment.questions);
      }
    }

    return new Response(JSON.stringify({
      type: isHTMLCSS ? "htmlcss" : isProgramming ? "programming" : "mcq",
      mode, skill, topic, difficulty, assessment,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Assessment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
