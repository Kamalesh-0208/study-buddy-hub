import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_tasks",
  title: "List tasks",
  description: "List the signed-in student's study tasks, optionally filtered by completion state.",
  inputSchema: {
    completed: z.boolean().optional().describe("Filter by completion state. Omit for all tasks."),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of tasks to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ completed, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("tasks")
      .select("id,title,description,priority,deadline,completed,estimated_minutes,subject_id")
      .eq("user_id", ctx.getUserId())
      .order("deadline", { ascending: true })
      .limit(limit ?? 25);
    if (typeof completed === "boolean") query = query.eq("completed", completed);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data ?? []) }],
          structuredContent: { tasks: data ?? [] },
        };
  },
});
