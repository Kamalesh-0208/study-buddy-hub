import { useState } from "react";
import { Plus, Clock, CheckCircle2, Circle, Trash2, Edit3, X, Save, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";
import { useSubjects } from "@/hooks/useSubjects";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import CreateTaskModal from "./CreateTaskModal";

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-study-warning/10 text-study-warning",
  low: "bg-study-success/10 text-study-success",
};

const TaskPlanner = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleTask, isLoading } = useTasks();
  const { subjects } = useSubjects();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Quick-add state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState("medium");
  const [quickSubject, setQuickSubject] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;
    addTask.mutate({
      title: quickTitle.trim(),
      priority: quickPriority,
      subject_id: quickSubject || undefined,
    });
    setQuickTitle("");
    setQuickPriority("medium");
    setQuickSubject("");
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) updateTask.mutate({ id, title: editTitle.trim() });
    setEditingId(null);
  };

  const handleToggle = async (id: string, completed: boolean) => {
    toggleTask.mutate({ id, completed });
    if (!completed && user) {
      await supabase.from("xp_log").insert({
        user_id: user.id, xp_amount: 50, source: "task", source_id: id,
      });
      const { data: xpLogs } = await supabase
        .from("xp_log")
        .select("xp_amount")
        .eq("user_id", user.id);
      const totalXP = (xpLogs ?? []).reduce((s, l) => s + l.xp_amount, 0);
      const newLevel = Math.max(1, Math.floor(Math.sqrt(totalXP / 50)));
      await supabase.from("profiles").update({
        total_xp: totalXP,
        level: newLevel,
      }).eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["xp_log"] });
    }
  };

  const doneCount = tasks.filter((t) => t.completed).length;
  const progressPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const formatDeadline = (d: string | null) => {
    if (!d) return "";
    const date = new Date(d);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return date.toLocaleDateString("en", { weekday: "short" });
    return date.toLocaleDateString("en", { month: "short", day: "numeric" });
  };

  return (
    <>
      <CreateTaskModal open={modalOpen} onOpenChange={setModalOpen} />

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
            Tasks
          </h3>
          <span className="text-xs text-muted-foreground font-medium">{doneCount}/{tasks.length} done</span>
        </div>

        <div className="h-1.5 rounded-full bg-secondary mb-5 overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-bg"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>

        <div className="space-y-2 mb-4 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className={`group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-secondary/50 ${
                  task.completed ? "opacity-50" : ""
                }`}
              >
                <button onClick={() => handleToggle(task.id, !!task.completed)} className="shrink-0">
                  {task.completed ? (
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
                      <p className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priorityColors[task.priority ?? "medium"]}`}>
                          {task.priority}
                        </span>
                        {task.deadline && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {formatDeadline(task.deadline)}
                          </span>
                        )}
                        {(task as any).subjects?.name && (
                          <span className="text-[10px] text-muted-foreground">{(task as any).subjects.name}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(task.id); setEditTitle(task.title); }}>
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button onClick={() => deleteTask.mutate(task.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Add Bar */}
        <AnimatePresence>
          {quickAddOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="space-y-2 p-3 rounded-xl bg-secondary/30 border border-border/40">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                  placeholder="Task name — press Enter to add"
                  className="w-full bg-card rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none border border-border/40 focus:border-primary/40"
                  autoFocus
                />
                <div className="flex gap-1.5 items-center flex-wrap">
                  {(["high", "medium", "low"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setQuickPriority(p)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                        quickPriority === p ? priorityColors[p] : "bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {subjects.length > 0 && (
                    <select
                      value={quickSubject}
                      onChange={(e) => setQuickSubject(e.target.value)}
                      className="ml-auto px-2 py-0.5 rounded-lg text-[10px] bg-secondary/40 text-muted-foreground border-none outline-none"
                    >
                      <option value="">No subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="flex-1 rounded-xl h-9 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Quick Add
          </Button>
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="flex-1 rounded-xl h-9 text-xs gradient-bg text-primary-foreground border-0"
          >
            <ListPlus className="h-3.5 w-3.5 mr-1" />
            Create Task
          </Button>
        </div>
      </motion.div>
    </>
  );
};

const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="6" height="6" rx="1" /><path d="m3 17 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" />
  </svg>
);

export default TaskPlanner;
