import { useGoals } from "@/hooks/useGoals";
import { useSessions } from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { motion } from "framer-motion";
import { Target, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GOAL_TYPES = [
  { value: "study_hours", label: "Study Hours", unit: "hours" },
  { value: "sessions", label: "Focus Sessions", unit: "sessions" },
  { value: "streak", label: "Day Streak", unit: "days" },
  { value: "tasks", label: "Tasks Completed", unit: "tasks" },
  { value: "xp", label: "XP Milestone", unit: "XP" },
];

const COLORS = ["252 72% 58%", "280 68% 56%", "38 92% 50%", "152 58% 42%", "210 70% 55%"];

const GoalsPage = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();
  const { sessions } = useSessions();
  const { profile } = useAuth();
  const { tasks } = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState("study_hours");
  const [targetValue, setTargetValue] = useState(10);

  const getCurrentValue = (goal: typeof goals[0]) => {
    switch (goal.goal_type) {
      case "study_hours": {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        const weekSessions = sessions.filter((s) => new Date(s.start_time) >= weekAgo);
        return Math.round(weekSessions.reduce((s, ss) => s + ss.duration_seconds / 3600, 0) * 10) / 10;
      }
      case "sessions":
        return sessions.length;
      case "streak":
        return profile?.current_streak ?? 0;
      case "tasks":
        return tasks.filter((t) => t.completed).length;
      case "xp":
        return profile?.total_xp ?? 0;
      default:
        return goal.current_value ?? 0;
    }
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    addGoal.mutate({ title: title.trim(), goal_type: goalType, target_value: targetValue });
    setTitle("");
    setGoalType("study_hours");
    setTargetValue(10);
    setShowAdd(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Goals</h2>
          <p className="text-sm text-muted-foreground mt-1">Track your study targets and milestones</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="rounded-xl gradient-bg text-primary-foreground border-0">
          <Plus className="h-4 w-4 mr-1" /> Add Goal
        </Button>
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12 rounded-2xl glass-strong">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No goals yet. Create one to start tracking!</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal, i) => {
          const current = getCurrentValue(goal);
          const pct = Math.min(100, Math.round((current / goal.target_value) * 100));
          const done = pct >= 100;
          const typeInfo = GOAL_TYPES.find((t) => t.value === goal.goal_type);
          const color = COLORS[i % COLORS.length];

          if (done && !goal.completed) {
            updateGoal.mutate({ id: goal.id, completed: true, current_value: current });
          }

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2 }}
              className={`rounded-2xl glass-strong p-5 ${done ? "border border-study-success/30" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {done ? <CheckCircle2 className="h-5 w-5 text-study-success" /> : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                  <h4 className="text-sm font-semibold text-foreground">{goal.title}</h4>
                </div>
                <button onClick={() => deleteGoal.mutate(goal.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-extrabold text-foreground">{current}</span>
                <span className="text-xs text-muted-foreground">/ {goal.target_value} {typeInfo?.unit}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ background: `hsl(${color})` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">{pct}% complete</p>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Goal Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Study 20 hours this week" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Goal Type</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {GOAL_TYPES.map((t) => (
                  <button key={t.value} onClick={() => setGoalType(t.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${goalType === t.value ? "bg-primary/10 text-primary" : "bg-secondary/60 text-muted-foreground"}`}
                  >{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Target Value</Label>
              <Input type="number" value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))} className="rounded-xl" min={1} />
            </div>
            <Button onClick={handleAdd} disabled={addGoal.isPending} className="w-full gradient-bg text-primary-foreground border-0 rounded-xl">
              Create Goal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default GoalsPage;
