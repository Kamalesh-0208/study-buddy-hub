import { useSessions } from "@/hooks/useSessions";
import { useSubjects } from "@/hooks/useSubjects";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, BookOpen, Clock } from "lucide-react";
const AIInsights = () => {
  const { sessions } = useSessions();
  const { subjects } = useSubjects();
  const insights = (() => {
    const result: { icon: any; text: string }[] = [];
    if (sessions.length === 0) return [{ icon: Sparkles, text: "Complete your first study session to get AI insights!" }];
    const hourCounts: Record<number, { total: number; count: number }> = {};
    sessions.forEach((s) => { const hour = new Date(s.start_time).getHours(); if (!hourCounts[hour]) hourCounts[hour] = { total: 0, count: 0 }; hourCounts[hour].total += s.focus_score ?? 80; hourCounts[hour].count += 1; });
    const bestHour = Object.entries(hourCounts).sort(([, a], [, b]) => b.total / b.count - a.total / a.count)[0];
    if (bestHour) { const h = parseInt(bestHour[0]); const period = h >= 12 ? "PM" : "AM"; const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h; result.push({ icon: Clock, text: `You focus best around ${displayH}–${displayH + 2} ${period}` }); }
    if (subjects.length > 0) { const leastStudied = [...subjects].sort((a, b) => (Number(a.total_study_hours) || 0) - (Number(b.total_study_hours) || 0))[0]; if (leastStudied) result.push({ icon: BookOpen, text: `${leastStudied.name} needs more attention` }); }
    const recentScores = sessions.slice(0, 5).map((s) => s.focus_score ?? 80); const olderScores = sessions.slice(5, 10).map((s) => s.focus_score ?? 80);
    if (recentScores.length > 0 && olderScores.length > 0) { const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length; const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length; if (recentAvg > olderAvg + 5) result.push({ icon: TrendingUp, text: "Your focus is improving! Keep it up 🚀" }); }
    return result.slice(0, 4);
  })();
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="rounded-2xl glass-strong p-6">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5"><div className="icon-bg h-8 w-8"><Sparkles className="h-4 w-4 text-primary" /></div>AI Insights</h3>
      <div className="space-y-3">{insights.map((insight, i) => (<motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 rounded-xl bg-secondary/40 p-3"><insight.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" /><p className="text-xs text-foreground leading-relaxed">{insight.text}</p></motion.div>))}</div>
    </motion.div>
  );
};
export default AIInsights;