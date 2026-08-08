import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_task",
  title: "Create task",
  description: "Create a new study task for the signed-in student.",
  inputSchema: {
    title: z.string().trim().min(1).max(200).describe("Short task title."),
    description: z.string().trim().max(2000).optional().describe("Optional task details."),
    priority: z.enum(["low", "medium", "high"]).default("medium").describe("Task priority."),
    deadline: z.string().optional().describe("Optional ISO 8601 deadline, e.g. 2026-09-01T18:00:00Z."),
    estimated_minutes: z.number().int().min(5).max(600).optional().describe("Estimated effort in minutes."),
    subject_id: z.string().uuid().optional().describe("Optional subject id to attach the task to."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: ctx.getUserId(),
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "medium",
        deadline: input.deadline ?? null,
        estimated_minutes: input.estimated_minutes ?? null,
        subject_id: input.subject_id ?? null,
        completed: false,
      })
      .select()
      .single();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { task: data } };
  },
});
