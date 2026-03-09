import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, RefreshCw, Lock, Unlock, Check, Trash2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyPlanner } from "@/hooks/useStudyPlanner";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const PlannerPage = () => {
  const { plans, isLoading, generatePlan, toggleComplete, toggleLock, deletePlan } = useStudyPlanner();
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [days, setDays] = useState(7);

  const groupedPlans = plans.reduce<Record<string, typeof plans>>((acc, p) => {
    const date = p.plan_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(p);
    return acc;
  }, {});

  const today = new Date().toISOString().split("T")[0];
  const futureDates = Object.keys(groupedPlans)
    .filter(d => d >= today)
    .sort();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${dayName}, ${monthDay}`;
  };

  const priorityColor = (p: string | null) => {
    if (p === "high") return "text-destructive bg-destructive/10";
    if (p === "low") return "text-muted-foreground bg-secondary/40";
    return "text-primary bg-primary/10";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> AI Study Planner
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated study schedules based on your goals, deadlines, and focus patterns
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl glass-strong p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              Available hours per day: {hoursPerDay}h
            </label>
            <Slider
              value={[hoursPerDay]}
              onValueChange={([v]) => setHoursPerDay(v)}
              min={1} max={8} step={0.5}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              Days to plan: {days}
            </label>
            <Slider
              value={[days]}
              onValueChange={([v]) => setDays(v)}
              min={1} max={14} step={1}
              className="w-full"
            />
          </div>
        </div>
        <Button
          onClick={() => generatePlan.mutate({ availableHoursPerDay: hoursPerDay, daysToGenerate: days })}
          disabled={generatePlan.isPending}
          className="gradient-bg text-primary-foreground border-0 rounded-xl shadow-glow"
        >
          {generatePlan.isPending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Brain className="mr-2 h-4 w-4" />
          )}
          {generatePlan.isPending ? "Generating..." : "Generate AI Plan"}
        </Button>
      </div>

      {/* Plans */}
      {futureDates.length === 0 && !isLoading && (
        <div className="rounded-2xl glass-strong p-10 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No study plans yet. Click "Generate AI Plan" to get started!</p>
        </div>
      )}

      <div className="space-y-4">
        {futureDates.map((date) => {
          const dayPlans = groupedPlans[date];
          const totalMinutes = dayPlans.reduce((s, p) => s + p.recommended_minutes, 0);
          const completedCount = dayPlans.filter(p => p.completed).length;

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl glass-strong p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">{formatDate(date)}</h3>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {Math.round(totalMinutes / 60 * 10) / 10}h total · {completedCount}/{dayPlans.length} done
                </div>
              </div>
              <div className="space-y-2">
                {dayPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                      plan.completed ? "bg-primary/5 opacity-60" : "bg-secondary/20 hover:bg-secondary/30"
                    }`}
                  >
                    <button
                      onClick={() => toggleComplete.mutate({ id: plan.id, completed: !!plan.completed })}
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        plan.completed ? "bg-primary border-primary" : "border-border/60 hover:border-primary"
                      }`}
                    >
                      {plan.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${plan.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {plan.subject_name ?? "General"}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${priorityColor(plan.priority)}`}>
                          {plan.priority}
                        </span>
                      </div>
                      {plan.reason && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{plan.reason}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-primary shrink-0">{plan.recommended_minutes}m</span>
                    <button
                      onClick={() => toggleLock.mutate({ id: plan.id, locked: !!plan.locked })}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {plan.locked ? <Lock className="h-3.5 w-3.5 text-primary" /> : <Unlock className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => deletePlan.mutate(plan.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PlannerPage;
