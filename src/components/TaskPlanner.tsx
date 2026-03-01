import { useState } from "react";
import { Plus, GripVertical, Clock, Flag, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: number;
  title: string;
  priority: "high" | "medium" | "low";
  deadline: string;
  done: boolean;
  est: string;
}

const initialTasks: Task[] = [
  { id: 1, title: "Review IPR Patent Search Methods", priority: "high", deadline: "Today", done: false, est: "45 min" },
  { id: 2, title: "Complete C-2 Practice Questions", priority: "high", deadline: "Today", done: false, est: "1h 30m" },
  { id: 3, title: "Read HTML & CSS Reference Guide", priority: "medium", deadline: "Tomorrow", done: true, est: "30 min" },
  { id: 4, title: "Practice C-3 Question Bank", priority: "medium", deadline: "Wed", done: false, est: "1h" },
  { id: 5, title: "Watch Espacenet Tutorial Video", priority: "low", deadline: "Thu", done: false, est: "20 min" },
];

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-study-warning/10 text-study-warning",
  low: "bg-study-success/10 text-study-success",
};

const TaskPlanner = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTitle, setNewTitle] = useState("");

  const toggle = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), title: newTitle.trim(), priority: "medium", deadline: "Today", done: false, est: "30 min" },
    ]);
    setNewTitle("");
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const progressPct = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="rounded-2xl glass-strong p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="icon-bg h-8 w-8">
            <ListIcon className="h-4 w-4 text-primary" />
          </div>
          Daily Tasks
        </h3>
        <span className="text-xs text-muted-foreground font-medium">{doneCount}/{tasks.length} done</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-secondary mb-5 overflow-hidden">
        <div
          className="h-full rounded-full gradient-bg transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Tasks */}
      <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-secondary/50 ${
              task.done ? "opacity-50" : ""
            }`}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            <button onClick={() => toggle(task.id)} className="shrink-0">
              {task.done ? (
                <CheckCircle2 className="h-[18px] w-[18px] text-study-success" />
              ) : (
                <Circle className="h-[18px] w-[18px] text-muted-foreground/40" />
              )}
            </button>
            <div className="flex-1 min-w-0">
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
            </div>
          </div>
        ))}
      </div>

      {/* Add task */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a new task..."
          className="flex-1 rounded-xl bg-secondary/50 border border-border/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 focus:bg-card transition-all"
        />
        <Button size="sm" onClick={addTask} className="rounded-xl h-9 px-3 gradient-bg text-primary-foreground border-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="6" height="6" rx="1" /><path d="m3 17 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" />
  </svg>
);

export default TaskPlanner;
