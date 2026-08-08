import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTasksTool from "./tools/list-tasks";
import createTaskTool from "./tools/create-task";
import completeTaskTool from "./tools/complete-task";
import listSubjectsTool from "./tools/list-subjects";
import getStudyProgressTool from "./tools/get-study-progress";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "study-buddy-hub",
  title: "Study Buddy Hub",
  version: "0.1.0",
  instructions:
    "Tools for Study Buddy Hub, a study planning and skill-practice app. Use `list_subjects` and `list_tasks` to read the signed-in student's study plan, `create_task` and `complete_task` to manage tasks, and `get_study_progress` for XP, level, streaks and recent study sessions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSubjectsTool, listTasksTool, createTaskTool, completeTaskTool, getStudyProgressTool],
});
