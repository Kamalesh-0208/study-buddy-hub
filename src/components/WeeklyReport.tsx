import { useAnalytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { FileText, Clock, Target, Flame, TrendingUp, BookOpen, Zap } from "lucide-react";

const WeeklyReport = () => {
  const { weeklyHours, weeklyFocusAvg, weeklyTasksDone, topWeekSubject, momentumScore, consistencyScore } = useAnalytics();
  const { profile } = useAuth();

  const stats = [
    { icon: Clock, label: "Study Hours", value: `${weeklyHours}h`, color: "text-study-info" },
    { icon: Target, label: "Avg Focus", value: `${weeklyFocusAvg}%`, color: "text-study-timer" },
    { icon: BookOpen, label: "Tasks Done", value: weeklyTasksDone.toString(), color: "text-study-success" },
    { icon: Flame, label: "Streak", value: `${profile?.current_streak ?? 0}d`, color: "text-study-warning" },
    { icon: Zap, label: "Momentum", value: `${Math.round(momentumScore)}`, color: "text-primary" },
    { icon: TrendingUp, label: "Consistency", value: `${consistencyScore}%`, color: "text-study-success" },
  ];

  const suggestions: string[] = [];
  if (weeklyHours < 5) suggestions.push("Try to increase your weekly study time to at least 5 hours for better results.");
  if (weeklyFocusAvg < 70 && weeklyFocusAvg > 0) suggestions.push("Your focus scores could improve. Try shorter sessions with fewer distractions.");
  if (consistencyScore < 50) suggestions.push("Study more consistently throughout the week rather than cramming.");
  if (momentumScore > 80) suggestions.push("Excellent momentum! You're on track to reach your goals.");
  if (!topWeekSubject && weeklyHours > 0) suggestions.push("Try studying different subjects to diversify your knowledge.");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="rounded-2xl glass-strong p-6">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
        <div className="icon-bg h-8 w-8"><FileText className="h-4 w-4 text-primary" /></div>
        Weekly Report
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-secondary/40 p-3 text-center">
            <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-lg font-extrabold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {topWeekSubject && (
        <p className="text-xs text-muted-foreground mb-3">
          Most studied: <span className="font-semibold text-foreground">{topWeekSubject}</span>
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Suggestions</p>
          {suggestions.map((s, i) => (
            <p key={i} className="text-xs text-muted-foreground leading-relaxed">• {s}</p>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WeeklyReport;
