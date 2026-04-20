// Secure code execution proxy via Judge0 (RapidAPI)
// Languages: C, C++, Java, Python
// Limits: 2s CPU, 256MB memory; network & filesystem blocked by Judge0 sandbox.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";
const JUDGE0_URL = `https://${JUDGE0_HOST}`;

// Judge0 language IDs (CE)
const LANGUAGE_IDS: Record<string, number> = {
  c: 50,        // C (GCC 9.2.0)
  cpp: 54,      // C++ (GCC 9.2.0)
  java: 62,     // Java (OpenJDK 13.0.1)
  python: 71,   // Python (3.8.1)
};

// Judge0 status descriptions we care about
// 3 = Accepted, 4 = Wrong Answer, 5 = TLE, 6 = Compilation Error,
// 7-12 = Runtime errors, 13 = Internal, 14 = Exec Format Error
function statusToVerdict(id: number, description: string): string {
  if (id === 3) return "passed";
  if (id === 4) return "wrong_answer";
  if (id === 5) return "time_limit";
  if (id === 6) return "compile_error";
  if (id >= 7 && id <= 12) return "runtime_error";
  return description?.toLowerCase().replace(/\s+/g, "_") || "error";
}

interface TestCase {
  input: string;
  expected_output: string;
}

interface ExecuteRequest {
  language: string; // c | cpp | java | python
  source_code: string;
  test_cases: TestCase[];
  cpu_time_limit?: number; // seconds
  memory_limit?: number;   // KB
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("JUDGE0_RAPIDAPI_KEY");
    if (!apiKey) {
      return json({ error: "JUDGE0_RAPIDAPI_KEY not configured" }, 500);
    }

    const body = (await req.json()) as ExecuteRequest;

    if (!body || typeof body.language !== "string" || typeof body.source_code !== "string") {
      return json({ error: "language and source_code are required" }, 400);
    }
    if (!Array.isArray(body.test_cases) || body.test_cases.length === 0) {
      return json({ error: "test_cases array is required" }, 400);
    }
    if (body.test_cases.length > 25) {
      return json({ error: "Too many test cases (max 25)" }, 400);
    }
    if (body.source_code.length > 64_000) {
      return json({ error: "Source code too large (max 64KB)" }, 400);
    }

    const language_id = LANGUAGE_IDS[body.language.toLowerCase()];
    if (!language_id) {
      return json({ error: `Unsupported language: ${body.language}` }, 400);
    }

    const cpu_time_limit = clamp(body.cpu_time_limit ?? 2, 0.5, 5);
    const memory_limit = clamp(body.memory_limit ?? 262_144, 16_000, 512_000); // KB

    // Build batch submission
    const submissions = body.test_cases.map((tc) => ({
      language_id,
      source_code: body.source_code,
      stdin: tc.input ?? "",
      expected_output: (tc.expected_output ?? "").replace(/\r\n/g, "\n").trimEnd(),
      cpu_time_limit,
      memory_limit,
      enable_network: false,
    }));

    const headers = {
      "content-type": "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": JUDGE0_HOST,
    };

    // Submit batch (base64 disabled, wait=false)
    const submitRes = await fetch(
      `${JUDGE0_URL}/submissions/batch?base64_encoded=false`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ submissions }),
      },
    );

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error("Judge0 submit failed:", submitRes.status, errText);
      return json(
        { error: `Judge0 submit failed: ${submitRes.status}`, details: errText },
        502,
      );
    }

    const tokens = (await submitRes.json()) as { token: string }[];
    const tokenList = tokens.map((t) => t.token).join(",");

    // Poll until all tokens have finished (status_id > 2)
    const fields =
      "stdout,stderr,compile_output,status,time,memory,token,exit_code";
    let attempts = 0;
    const maxAttempts = 30; // ~30 * 700ms ≈ 21s
    let finalResults: any[] = [];

    while (attempts < maxAttempts) {
      attempts++;
      await sleep(700);
      const pollRes = await fetch(
        `${JUDGE0_URL}/submissions/batch?tokens=${tokenList}&base64_encoded=false&fields=${fields}`,
        { headers },
      );
      if (!pollRes.ok) {
        const t = await pollRes.text();
        console.error("Judge0 poll failed:", pollRes.status, t);
        continue;
      }
      const data = await pollRes.json();
      const subs = data.submissions ?? [];
      const allDone = subs.every((s: any) => s.status && s.status.id > 2);
      if (allDone) {
        finalResults = subs;
        break;
      }
    }

    if (finalResults.length === 0) {
      return json({ error: "Execution timed out waiting for Judge0" }, 504);
    }

    let passed = 0;
    const results = finalResults.map((s: any, i: number) => {
      const tc = body.test_cases[i];
      const verdict = statusToVerdict(s.status?.id ?? 0, s.status?.description ?? "");
      const ok = verdict === "passed";
      if (ok) passed++;
      return {
        test_case_index: i,
        input: tc.input,
        expected_output: tc.expected_output,
        actual_output: (s.stdout ?? "").replace(/\r\n/g, "\n").trimEnd(),
        stderr: s.stderr ?? "",
        compile_output: s.compile_output ?? "",
        status: s.status?.description ?? "Unknown",
        verdict,
        passed: ok,
        time_seconds: s.time ? parseFloat(s.time) : null,
        memory_kb: s.memory ?? null,
      };
    });

    const total = results.length;
    const summary = {
      total,
      passed,
      failed: total - passed,
      all_passed: passed === total,
      avg_time_seconds:
        results.reduce((sum, r) => sum + (r.time_seconds ?? 0), 0) / total,
      max_memory_kb: Math.max(...results.map((r) => r.memory_kb ?? 0)),
    };

    return json({ summary, results });
  } catch (err) {
    console.error("execute-code error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
