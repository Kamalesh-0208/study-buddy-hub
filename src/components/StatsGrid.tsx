import { BookOpen, Brain, Clock, Target, TrendingUp } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import { motion } from "framer-motion";

const StatsGrid = () => {
  const { totalStudyHours, sessions, tasks, streak } = useStudyStore();
  const hours = totalStudyHours();
  const avgFocus = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.focusScore, 0) / sessions.length)
    : 0;
  const doneCount = tasks.filter((t) => t.done).length;

  const stats = [
    { icon: Clock, label: "Study Hours", value: `${hours}`, sub: "This week", change: "+2.3h", color: "252 72% 58%" },
    { icon: Brain, label: "Sessions Done", value: `${sessions.length}`, sub: "Total", change: `+${Math.min(sessions.length, 3)}`, color: "280 68% 56%" },
    { icon: BookOpen, label: "Tasks Complete", value: `${doneCount}`, sub: `of ${tasks.length}`, change: `${Math.round((doneCount / Math.max(tasks.length, 1)) * 100)}%`, color: "210 70% 55%" },
    { icon: Target, label: "Focus Score", value: `${avgFocus}%`, sub: "Average", change: "+5%", color: "152 58% 42%" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08 }}
          whileHover={{ y: -2, boxShadow: "var(--shadow-lg)" }}
          className="rounded-2xl glass-strong p-5 cursor-default"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="icon-bg h-10 w-10"
              style={{ background: `linear-gradient(135deg, hsl(${stat.color} / 0.12), hsl(${stat.color} / 0.04))` }}
            >
              <stat.icon className="h-5 w-5" style={{ color: `hsl(${stat.color})` }} />
            </div>
            <span className="text-[10px] font-semibold text-study-success flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" />{stat.change}
            </span>
          </div>
          <p className="text-2xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">{stat.sub}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsGrid;
