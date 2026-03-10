import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skillCategory, skill, topic, mode, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isProgramming = skillCategory === "programming";
    const isHTMLCSS = skillCategory === "htmlcss";
    const isExam = mode === "exam";

    // Fixed timer rules per category and mode
    const getTimer = () => {
      if (isHTMLCSS) return 90; // 1.5 hours for web dev
      if (isProgramming) return 60; // 1 hour for coding
      // Theory/MCQ
      if (isExam) return 60; // 1 hour for 40 questions
      return 30; // 30 min for practice (10 questions)
    };

    const timerMinutes = getTimer();

    let systemPrompt: string;
    let toolSchema: any;
    let toolName: string;

    if (isHTMLCSS) {
      const webpageTopic = topic.split("|")[0] || "Landing Page";
      const extraReqs = topic.split("|")[1] || "";

      const requirementPool = [
        "Use Flexbox Layout",
        "Use CSS Grid Layout",
        "Use hover effects on buttons/links",
        "Use responsive design with media queries",
        "Use custom Google Fonts",
        "Use CSS transitions or animations",
        "Use semantic HTML elements",
        "Use a color gradient",
      ];
      const shuffled = requirementPool.sort(() => Math.random() - 0.5);
      const numReqs = difficulty === "easy" ? 2 : difficulty === "hard" ? 4 : 3;
      const selectedReqs = shuffled.slice(0, numReqs);
      if (extraReqs) selectedReqs.push(extraReqs);

      systemPrompt = `You are an expert HTML/CSS assessment generator for students. Generate a webpage recreation challenge.

Topic: "${webpageTopic}" webpage
Difficulty: "${difficulty}"
Mode: ${isExam ? `Exam (${timerMinutes} minutes, no hints)` : "Practice (with hints and solution)"}

The student must recreate a webpage that matches your reference design.

REQUIRED IMPLEMENTATION RULES (student MUST follow these):
${selectedReqs.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Generate:
1. A detailed design description of the webpage to build
2. Design specifications (colors, typography, components, spacing)
3. The implementation requirements with descriptions
4. Complete reference HTML code (index.html)
5. Complete reference CSS code (styles.css)
6. Layout explanation
7. ${isExam ? "No hints" : "5 helpful hints for students"}
8. Evaluation criteria

The reference code should be a complete, working webpage that a student could open in a browser.
Difficulty "${difficulty}" means:
- Easy: Simple layout, few components, basic styling
- Medium: Moderate layout with multiple sections, some interactive elements
- Hard: Complex layout, animations, responsive design, advanced CSS
- Mixed: Combination of easy and complex elements

IMPORTANT: Set timer_minutes to exactly ${timerMinutes}.`;

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
                  title: { type: "string" },
                  design_description: { type: "string" },
                  design_spec: {
                    type: "object",
                    properties: {
                      layout_description: { type: "string" },
                      color_scheme: { type: "array", items: { type: "string" } },
                      typography: { type: "string" },
                      components: { type: "array", items: { type: "string" } },
                      spacing_notes: { type: "string" },
                      responsive_notes: { type: "string" },
                    },
                    required: ["layout_description", "color_scheme", "typography", "components", "spacing_notes", "responsive_notes"],
                    additionalProperties: false,
                  },
                  requirements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rule: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["rule", "description"],
                      additionalProperties: false,
                    },
                  },
                  reference_html: { type: "string" },
                  reference_css: { type: "string" },
                  layout_explanation: { type: "string" },
                  hints: { type: "array", items: { type: "string" } },
                  evaluation_criteria: { type: "array", items: { type: "string" } },
                  difficulty_label: { type: "string" },
                },
                required: ["title", "design_description", "design_spec", "requirements", "reference_html", "reference_css", "layout_explanation", "hints", "evaluation_criteria", "difficulty_label"],
                additionalProperties: false,
              },
              timer_minutes: { type: "number" },
              instructions: { type: "string" },
            },
            required: ["challenge", "timer_minutes", "instructions"],
            additionalProperties: false,
          },
        },
      };
    } else if (isProgramming) {
      const questionCount = 2;
      systemPrompt = `You are an expert programming assessment generator for students. Generate exactly ${questionCount} coding problems for the skill "${skill}" on the topic "${topic}" at "${difficulty}" difficulty.

Each problem must be a real coding challenge appropriate for the difficulty level. Include clear problem descriptions, constraints, and test cases.

For each problem provide:
- A clear title
- Problem description (detailed)
- Input format description
- Output format description
- Constraints
- 2 sample test cases (input + expected output)
- 2 hidden test cases (input + expected output) for validation
- A complete correct solution in ${skill}
- Explanation of the solution logic
- Common mistakes students make

${isExam ? "This is for EXAM mode - do NOT include solutions or hints in the questions themselves. Solutions will be revealed after submission." : "This is for PRACTICE mode - include solutions and explanations with each problem. Students can view hints and sample solutions while practicing."}

IMPORTANT: Set timer_minutes to exactly ${timerMinutes}.`;

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
                    title: { type: "string" },
                    description: { type: "string" },
                    input_format: { type: "string" },
                    output_format: { type: "string" },
                    constraints: { type: "string" },
                    sample_tests: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { input: { type: "string" }, expected_output: { type: "string" } },
                        required: ["input", "expected_output"],
                        additionalProperties: false,
                      },
                    },
                    hidden_tests: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { input: { type: "string" }, expected_output: { type: "string" } },
                        required: ["input", "expected_output"],
                        additionalProperties: false,
                      },
                    },
                    solution_code: { type: "string" },
                    solution_explanation: { type: "string" },
                    common_mistakes: { type: "array", items: { type: "string" } },
                    difficulty_label: { type: "string" },
                  },
                  required: ["title", "description", "input_format", "output_format", "constraints", "sample_tests", "hidden_tests", "solution_code", "solution_explanation", "common_mistakes", "difficulty_label"],
                  additionalProperties: false,
                },
              },
              timer_minutes: { type: "number" },
              instructions: { type: "string" },
            },
            required: ["problems", "timer_minutes", "instructions"],
            additionalProperties: false,
          },
        },
      };
    } else {
      // One-mark / theory questions
      const questionCount = isExam ? 40 : 10;
      const passMark = isExam ? 24 : 6;
      let difficultyInstruction = "";
      if (difficulty === "mixed" && isExam) {
        difficultyInstruction = "Generate exactly 15 Easy, 15 Medium, and 10 Hard questions.";
      } else {
        difficultyInstruction = `All questions should be ${difficulty} difficulty.`;
      }

      systemPrompt = `You are an expert assessment question generator for students. Generate exactly ${questionCount} multiple choice questions for the skill "${skill}" on the topic "${topic}".

${difficultyInstruction}

Each question must have exactly 4 options (A, B, C, D) with exactly one correct answer. Questions must follow standard competitive exam patterns and be educationally sound.

For each question provide:
- Question text
- 4 options
- Correct answer letter (A/B/C/D)
- Detailed explanation with step-by-step solving method
- Difficulty label (easy/medium/hard)

${isExam ? `This is EXAM mode with negative marking: +1 for correct, -0.25 for wrong. Pass mark is ${passMark}/${questionCount}. Timer is ${timerMinutes} minutes.` : "This is PRACTICE mode - show explanations after each question. Students get instant feedback and can learn from mistakes."}

IMPORTANT: Set timer_minutes to exactly ${timerMinutes}, total_questions to ${questionCount}, pass_mark to ${passMark}.`;

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
                    question_number: { type: "number" },
                    question_text: { type: "string" },
                    options: {
                      type: "object",
                      properties: { A: { type: "string" }, B: { type: "string" }, C: { type: "string" }, D: { type: "string" } },
                      required: ["A", "B", "C", "D"],
                      additionalProperties: false,
                    },
                    correct_answer: { type: "string" },
                    explanation: { type: "string" },
                    difficulty_label: { type: "string" },
                  },
                  required: ["question_number", "question_text", "options", "correct_answer", "explanation", "difficulty_label"],
                  additionalProperties: false,
                },
              },
              timer_minutes: { type: "number" },
              total_questions: { type: "number" },
              pass_mark: { type: "number" },
              scoring_rules: { type: "string" },
              instructions: { type: "string" },
            },
            required: ["questions", "timer_minutes", "total_questions", "pass_mark", "scoring_rules", "instructions"],
            additionalProperties: false,
          },
        },
      };
    }

    // Use gemini-2.5-flash for faster generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate the assessment now for: Skill="${skill}", Topic="${topic}", Difficulty="${difficulty}", Mode="${mode}".` },
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const assessment = JSON.parse(toolCall.function.arguments);

    // Override timer to enforce correct values regardless of AI output
    if (assessment.timer_minutes !== undefined) {
      assessment.timer_minutes = timerMinutes;
    }
    if (assessment.pass_mark !== undefined && !isProgramming && !isHTMLCSS) {
      assessment.pass_mark = isExam ? 24 : 6;
    }
    if (assessment.total_questions !== undefined && !isProgramming && !isHTMLCSS) {
      assessment.total_questions = isExam ? 40 : 10;
    }

    return new Response(JSON.stringify({
      type: isHTMLCSS ? "htmlcss" : isProgramming ? "programming" : "mcq",
      mode,
      skill,
      topic,
      difficulty,
      assessment,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Assessment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
