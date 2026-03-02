import { useStudyStore } from "@/store/useStudyStore";
import { motion } from "framer-motion";
import { Target, CheckCircle2, Circle, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  color: string;
}

const GoalsPage = () => {
  const { totalStudyHours, sessions, streak } = useStudyStore();

  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", title: "Study 20 hours this week", target: 20, current: totalStudyHours(), unit: "hours", color: "252 72% 58%" },
    { id: "2", title: "Complete 10 focus sessions", target: 10, current: sessions.length, unit: "sessions", color: "280 68% 56%" },
    { id: "3", title: "Maintain 14-day streak", target: 14, current: streak, unit: "days", color: "38 92% 50%" },
    { id: "4", title: "Achieve 90% average focus", target: 90, current: sessions.length ? Math.round(sessions.reduce((a, s) => a + s.focusScore, 0) / sessions.length) : 0, unit: "%", color: "152 58% 42%" },
  ]);

  const [newGoal, setNewGoal] = useState("");

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals((prev) => [...prev, {
      id: `g${Date.now()}`,
      title: newGoal,
      target: 10,
      current: 0,
      unit: "units",
      color: "210 70% 55%",
    }]);
    setNewGoal("");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Goals</h2>
        <p className="text-sm text-muted-foreground mt-1">Track your study targets and milestones</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal, i) => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const done = pct >= 100;
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2 }}
              className={`rounded-2xl glass-strong p-5 ${done ? "border border-study-success/30" : ""}`}
            >
              <div className="flex items-center gap-3 mb-3">
                {done ? <CheckCircle2 className="h-5 w-5 text-study-success" /> : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                <h4 className="text-sm font-semibold text-foreground">{goal.title}</h4>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-extrabold text-foreground">{goal.current}</span>
                <span className="text-xs text-muted-foreground">/ {goal.target} {goal.unit}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ background: `hsl(${goal.color})` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">{pct}% complete</p>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input type="text" value={newGoal} onChange={(e) => setNewGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
          placeholder="Add a new goal..."
          className="flex-1 rounded-xl bg-secondary/50 border border-border/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 transition-all"
        />
        <Button onClick={addGoal} className="rounded-xl gradient-bg text-primary-foreground border-0">
          <Plus className="h-4 w-4 mr-1" /> Add Goal
        </Button>
      </div>
    </motion.div>
  );
};

export default GoalsPage;
