import TaskPlanner from "@/components/TaskPlanner";
import { motion } from "framer-motion";

const TasksPage = () => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div>
      <h2 className="text-2xl font-extrabold text-foreground">Task Manager</h2>
      <p className="text-sm text-muted-foreground mt-1">Organize, prioritize, and track your study tasks</p>
    </div>
    <div className="max-w-2xl">
      <TaskPlanner />
    </div>
  </motion.div>
);

export default TasksPage;
