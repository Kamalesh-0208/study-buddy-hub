import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Helpers ---

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
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
    cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, (c) => c === '\n' || c === '\t' ? c : "");
    return JSON.parse(cleaned);
  }
}

function getSupabaseAdmin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// --- Duplicate Detection ---
// Simple trigram-based similarity for lightweight dedup
function trigrams(s: string): Set<string> {
  const t = s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const set = new Set<string>();
  for (let i = 0; i <= t.length - 3; i++) set.add(t.substring(i, i + 3));
  return set;
}

function similarity(a: string, b: string): number {
  const ta = trigrams(a), tb = trigrams(b);
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// --- Answer Validation ---
// For MCQ: verify correct_answer is one of the option keys
function validateMCQ(q: any): boolean {
  if (!q.question_text || !q.options || !q.correct_answer) return false;
  const validKeys = ["A", "B", "C", "D"];
  if (!validKeys.includes(q.correct_answer)) return false;
  if (!q.options[q.correct_answer]) return false;
  // Must have all 4 options
  if (validKeys.some(k => !q.options[k])) return false;
  return true;
}

// For programming: verify required fields exist
function validateProgramming(p: any): boolean {
  return !!(p.title && p.description && p.input_format && p.output_format &&
    p.sample_tests?.length >= 1 && p.hidden_tests?.length >= 1 && p.solution_code);
}

// --- Cache Layer ---

async function fetchCachedQuestions(skill: string, topic: string, difficulty: string, count: number) {
  try {
    const sb = getSupabaseAdmin();
    let query = sb.from("question_bank").select("*").eq("skill", skill).eq("topic", topic).eq("question_type", "mcq");
    if (difficulty !== "mixed") query = query.eq("difficulty", difficulty);
    const { data, error } = await query.limit(count * 2);
    if (error || !data || data.length < count) return null;
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

// Store with duplicate detection + validation
async function storeValidatedQuestions(skill: string, topic: string, difficulty: string, questions: any[]) {
  try {
    const sb = getSupabaseAdmin();

    // Fetch existing questions for dedup
    const { data: existing } = await sb.from("question_bank").select("question_text")
      .eq("skill", skill).eq("topic", topic).limit(500);
    const existingTexts = (existing ?? []).map((r: any) => r.question_text as string);

    const uniqueValidated: any[] = [];
    for (const q of questions) {
      // Validate
      if (!validateMCQ(q)) {
        console.log("Rejected invalid question:", q.question_text?.substring(0, 50));
        continue;
      }
      // Dedup: reject if >85% similar to any existing
      const isDuplicate = existingTexts.some(et => similarity(q.question_text, et) > 0.85);
      if (isDuplicate) {
        console.log("Rejected duplicate question:", q.question_text?.substring(0, 50));
        continue;
      }
      uniqueValidated.push({
        skill, topic,
        difficulty: q.difficulty_label || difficulty,
        question_type: "mcq",
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || "",
        validated: true,
      });
      // Also add to existingTexts so we dedup within the batch
      existingTexts.push(q.question_text);
    }

    if (uniqueValidated.length > 0) {
      const { error } = await sb.from("question_bank").insert(uniqueValidated);
      if (error) console.error("Store error:", error);
      else console.log(`Stored ${uniqueValidated.length}/${questions.length} validated unique questions`);
    }
  } catch (e) {
    console.error("Background store error:", e);
  }
}

// --- Prompt Builders ---

function buildMCQPrompt(skill: string, topic: string, difficulty: string, mode: string, count: number, timerMinutes: number, passMark: number): { systemPrompt: string; toolName: string; toolSchema: any } {
  const difficultyInstruction = difficulty === "mixed"
    ? "Generate exactly 15 Easy, 15 Medium, and 10 Hard questions."
    : `All questions should be ${difficulty} difficulty.`;

  const isAptitude = ["math", "aptitude", "reasoning", "quantitative"].some(k => skill.toLowerCase().includes(k) || topic.toLowerCase().includes(k));

  const explanationInstruction = isAptitude
    ? "Each explanation MUST include step-by-step mathematical working with formulas, intermediate calculations, and the final answer derivation."
    : "Each explanation should clearly explain why the correct answer is right and why others are wrong.";

  const systemPrompt = `You are an expert MCQ generator. Generate exactly ${count} multiple choice questions for "${skill}" on "${topic}".
${difficultyInstruction}
Each question must have: question_text, 4 options object with keys A/B/C/D, correct_answer (single letter A/B/C/D), explanation, difficulty_label.
${explanationInstruction}
${mode === "exam" ? `EXAM mode: +1 correct, -0.25 wrong. Pass mark ${passMark}/${count}. Timer ${timerMinutes} min.` : `PRACTICE mode: instant feedback, explanations shown. Timer ${timerMinutes} min.`}
IMPORTANT: Every correct_answer MUST be exactly one of A, B, C, or D. Verify each answer is correct before returning.
Set timer_minutes=${timerMinutes}, total_questions=${count}, pass_mark=${passMark}.`;

  const toolName = "generate_mcq_assessment";
  const toolSchema = {
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

  return { systemPrompt, toolName, toolSchema };
}

function buildProgrammingPrompt(skill: string, topic: string, difficulty: string, mode: string, timerMinutes: number): { systemPrompt: string; toolName: string; toolSchema: any } {
  const systemPrompt = `You are an expert programming assessment generator. Generate exactly 2 coding problems for "${skill}" on topic "${topic}" at "${difficulty}" difficulty.
Each problem needs: title, description (detailed problem statement), input_format, output_format, constraints, 2 sample_tests (with input and expected_output), 2 hidden_tests, solution_code in ${skill}, solution_explanation, common_mistakes array, difficulty_label.
${mode === "exam" ? "EXAM mode - solutions revealed after submission." : "PRACTICE mode - include solutions."}
IMPORTANT: Verify that solution_code correctly solves all sample and hidden test cases.
Set timer_minutes to ${timerMinutes}.`;

  const toolName = "generate_programming_assessment";
  const toolSchema = {
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

  return { systemPrompt, toolName, toolSchema };
}

function buildHTMLCSSPrompt(topic: string, difficulty: string, mode: string, timerMinutes: number): { systemPrompt: string; toolName: string; toolSchema: any } {
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

  const systemPrompt = `You are an expert HTML/CSS assessment generator. Generate a webpage recreation challenge.
Topic: "${webpageTopic}" webpage. Difficulty: "${difficulty}". Mode: ${mode === "exam" ? `Exam (${timerMinutes} minutes, no hints)` : "Practice (with hints and solution)"}.
REQUIRED RULES:\n${selectedReqs.map((r, i) => `${i + 1}. ${r}`).join("\n")}
Generate: design description, specs, requirements, reference HTML, reference CSS, layout explanation, ${mode === "exam" ? "no hints" : "5 hints"}, evaluation criteria.
Set timer_minutes to ${timerMinutes}.`;

  const toolName = "generate_htmlcss_assessment";
  const toolSchema = {
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

  return { systemPrompt, toolName, toolSchema };
}

// --- AI Call ---

async function callAI(systemPrompt: string, skill: string, topic: string, difficulty: string, mode: string, toolName: string, toolSchema: any, apiKey: string) {
  const makeRequest = async (useToolChoice: boolean) => {
    const body: any = {
      model: "google/gemini-3-flash-preview",
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
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
    if (status === 429) throw { status: 429, message: "Rate limit exceeded. Please try again in a moment." };
    if (status === 402) throw { status: 402, message: "AI credits exhausted." };
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
  return assessment;
}

// --- Main Handler ---

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
            questions: cached, timer_minutes: timerMinutes, total_questions: mcqCount,
            pass_mark: mcqPassMark, scoring_rules: "+1 correct, -0.25 wrong",
            instructions: `${isExam ? "Exam" : "Practice"} mode. ${mcqCount} questions, ${timerMinutes} minutes.`,
          },
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // --- Build prompt & call AI ---
    let promptData: { systemPrompt: string; toolName: string; toolSchema: any };

    if (isHTMLCSS) {
      promptData = buildHTMLCSSPrompt(topic, difficulty, mode, timerMinutes);
    } else if (isProgramming) {
      promptData = buildProgrammingPrompt(skill, topic, difficulty, mode, timerMinutes);
    } else {
      promptData = buildMCQPrompt(skill, topic, difficulty, mode, mcqCount, timerMinutes, mcqPassMark);
    }

    const assessment = await callAI(promptData.systemPrompt, skill, topic, difficulty, mode, promptData.toolName, promptData.toolSchema, LOVABLE_API_KEY);

    // Enforce values
    assessment.timer_minutes = timerMinutes;

    if (!isProgramming && !isHTMLCSS) {
      assessment.pass_mark = mcqPassMark;
      assessment.total_questions = mcqCount;

      // Validate each MCQ answer before returning
      if (assessment.questions?.length) {
        assessment.questions = assessment.questions.filter((q: any) => validateMCQ(q));
        // Re-number
        assessment.questions.forEach((q: any, i: number) => { q.question_number = i + 1; });
        assessment.total_questions = assessment.questions.length;

        // Store validated + deduplicated questions in background
        storeValidatedQuestions(skill, topic, difficulty, assessment.questions);
      }
    }

    if (isProgramming && assessment.problems?.length) {
      assessment.problems = assessment.problems.filter((p: any) => validateProgramming(p));
    }

    return new Response(JSON.stringify({
      type: isHTMLCSS ? "htmlcss" : isProgramming ? "programming" : "mcq",
      mode, skill, topic, difficulty, assessment,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("Assessment error:", e);
    const status = e?.status || 500;
    const message = e?.message || (e instanceof Error ? e.message : "Unknown error");
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
