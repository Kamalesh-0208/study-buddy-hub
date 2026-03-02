import { useState } from "react";
import { Plus, GripVertical, Clock, CheckCircle2, Circle, Trash2, Edit3, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/store/useStudyStore";
import { motion, AnimatePresence, Reorder } from "framer-motion";

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-study-warning/10 text-study-warning",
  low: "bg-study-success/10 text-study-success",
};

const TaskPlanner = () => {
  const { tasks, addTask, toggleTask, deleteTask, updateTask, reorderTasks } = useStudyStore();
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newDeadline, setNewDeadline] = useState("Today");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), priority: newPriority, deadline: newDeadline, done: false, est: "30 min" });
    setNewTitle("");
    setNewPriority("medium");
  };

  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) updateTask(id, { title: editTitle.trim() });
    setEditingId(null);
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const progressPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl glass-strong p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="icon-bg h-8 w-8">
            <ListIcon className="h-4 w-4 text-primary" />
          </div>
          Daily Tasks
        </h3>
        <span className="text-xs text-muted-foreground font-medium">{doneCount}/{tasks.length} done</span>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-secondary mb-5 overflow-hidden">
        <motion.div
          className="h-full rounded-full gradient-bg"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      {/* Task list */}
      <Reorder.Group axis="y" values={tasks} onReorder={reorderTasks} className="space-y-2 mb-4 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence>
          {tasks.map((task) => (
            <Reorder.Item key={task.id} value={task} className="list-none">
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className={`group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-secondary/50 ${
                  task.done ? "opacity-50" : ""
                }`}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                <button onClick={() => toggleTask(task.id)} className="shrink-0">
                  {task.done ? (
                    <CheckCircle2 className="h-[18px] w-[18px] text-study-success" />
                  ) : (
                    <Circle className="h-[18px] w-[18px] text-muted-foreground/40" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  {editingId === task.id ? (
                    <div className="flex gap-1">
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(task.id)}
                        className="flex-1 bg-secondary/50 rounded-lg px-2 py-1 text-sm text-foreground outline-none border border-primary/30"
                        autoFocus />
                      <button onClick={() => saveEdit(task.id)}><Save className="h-3.5 w-3.5 text-study-success" /></button>
                      <button onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm font-medium truncate ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" /> {task.deadline}
                        </span>
                        <span className="text-[10px] text-muted-foreground">~{task.est}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(task.id, task.title)}><Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></button>
                  <button onClick={() => deleteTask(task.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add task */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a new task..."
            className="flex-1 rounded-xl bg-secondary/50 border border-border/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 focus:bg-card transition-all"
          />
          <Button size="sm" onClick={handleAdd} className="rounded-xl h-9 px-3 gradient-bg text-primary-foreground border-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1.5">
          {(["high", "medium", "low"] as const).map((p) => (
            <button key={p} onClick={() => setNewPriority(p)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                newPriority === p ? priorityColors[p] : "bg-secondary/40 text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
          <select value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)}
            className="ml-auto px-2 py-0.5 rounded-lg text-[10px] bg-secondary/40 text-muted-foreground border-none outline-none">
            <option>Today</option>
            <option>Tomorrow</option>
            <option>This Week</option>
            <option>Next Week</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};

const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="6" height="6" rx="1" /><path d="m3 17 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" />
  </svg>
);

export default TaskPlanner;
