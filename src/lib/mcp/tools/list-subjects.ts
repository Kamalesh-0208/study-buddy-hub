import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_subjects",
  title: "List subjects",
  description: "List the signed-in student's subjects with study hours and completion progress.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(50).describe("Maximum number of subjects to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("subjects")
      .select("id,name,color,total_study_hours,completion_percentage,last_studied_at")
      .eq("user_id", ctx.getUserId())
      .order("name", { ascending: true })
      .limit(limit ?? 50);
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data ?? []) }], structuredContent: { subjects: data ?? [] } };
  },
});
