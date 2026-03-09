import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { useTasks } from "@/hooks/useTasks";
import { motion } from "framer-motion";
import { Clock, Zap, Target, Flame, TrendingUp, BookOpen } from "lucide-react";
const StatsGrid = () => {
  const { profile } = useAuth();
  const { sessions } = useSessions();
  const { tasks } = useTasks();
  const totalHours = Math.round((sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 3600) * 10) / 10;
  const avgFocus = sessions.length ? Math.round(sessions.reduce((sum, s) => sum + (s.focus_score ?? 80), 0) / sessions.length) : 0;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const stats = [
    { icon: Clock, label: "Study Hours", value: `${totalHours}h`, color: "text-study-info" },
    { icon: Zap, label: "Total XP", value: (profile?.total_xp ?? 0).toLocaleString(), color: "text-primary" },
    { icon: Target, label: "Focus Score", value: avgFocus.toString(), color: "text-study-timer" },
    { icon: Flame, label: "Day Streak", value: (profile?.current_streak ?? 0).toString(), color: "text-study-warning" },
    { icon: TrendingUp, label: "Level", value: (profile?.level ?? 1).toString(), color: "text-study-success" },
    { icon: BookOpen, label: "Tasks Done", value: completedTasks.toString(), color: "text-primary" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, i) => (<motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl glass-strong p-4 card-hover"><div className="flex items-center gap-2 mb-2"><div className="icon-bg h-7 w-7"><stat.icon className={`h-3.5 w-3.5 ${stat.color}`} /></div></div><p className="text-xl font-extrabold text-foreground">{stat.value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p></motion.div>))}
    </div>
  );
};
export default StatsGrid;