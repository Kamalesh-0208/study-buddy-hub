import { Sparkles, TrendingUp, AlertCircle, Lightbulb, Clock } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import { motion } from "framer-motion";
import { useMemo } from "react";

const AIInsights = () => {
  const { sessions, subjects, streak } = useStudyStore();

  const insights = useMemo(() => {
    const result: { icon: React.ElementType; color: string; title: string; desc: string }[] = [];

    // Peak performance analysis
    const hourBuckets: Record<number, number[]> = {};
    sessions.forEach((s) => {
      const h = new Date(s.date).getHours();
      if (!hourBuckets[h]) hourBuckets[h] = [];
      hourBuckets[h].push(s.focusScore);
    });
    let bestHour = 18;
    let bestScore = 0;
    Object.entries(hourBuckets).forEach(([h, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestScore) { bestScore = avg; bestHour = Number(h); }
    });
    result.push({
      icon: TrendingUp,
      color: "252 72% 58%",
      title: "Peak Performance Window",
      desc: `You focus best between ${bestHour}:00–${bestHour + 2}:00. Schedule important tasks here.`,
    });

    // Subject needing revision
    const sortedSubjects = [...subjects].sort((a, b) => new Date(a.lastStudied).getTime() - new Date(b.lastStudied).getTime());
    if (sortedSubjects.length > 0) {
      const oldest = sortedSubjects[0];
      const daysSince = Math.floor((Date.now() - new Date(oldest.lastStudied).getTime()) / 86400000);
      result.push({
        icon: AlertCircle,
        color: "38 92% 50%",
        title: "Needs Attention",
        desc: `${oldest.title} needs more revision — last studied ${daysSince} day${daysSince !== 1 ? "s" : ""} ago.`,
      });
    }

    // Productivity pattern
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayScores: Record<string, number[]> = {};
    sessions.forEach((s) => {
      const d = days[new Date(s.date).getDay()];
      if (!dayScores[d]) dayScores[d] = [];
      dayScores[d].push(s.focusScore);
    });
    const dayAvgs = Object.entries(dayScores).map(([d, scores]) => ({
      day: d,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));
    const worstDay = dayAvgs.sort((a, b) => a.avg - b.avg)[0];
    if (worstDay) {
      result.push({
        icon: Lightbulb,
        color: "152 58% 42%",
        title: "Study Tip",
        desc: `Your productivity dips on ${worstDay.day}s. Try lighter review sessions that day.`,
      });
    }

    // Streak encouragement
    if (streak > 5) {
      result.push({
        icon: Clock,
        color: "210 70% 55%",
        title: "Streak Power",
        desc: `${streak}-day streak! Consistency is your superpower. Keep it going!`,
      });
    }

    return result;
  }, [sessions, subjects, streak]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl glass-strong p-6 gradient-border"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
        <div className="icon-bg h-8 w-8"><Sparkles className="h-4 w-4 text-primary" /></div>
        AI Insights
        <span className="ml-auto text-[10px] font-semibold gradient-text px-2 py-0.5 rounded-full bg-primary/5">Powered by AI</span>
      </h3>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-3 rounded-xl p-3.5 bg-secondary/20 hover:bg-secondary/35 transition-colors"
          >
            <div className="icon-bg h-9 w-9 shrink-0"
              style={{ background: `linear-gradient(135deg, hsl(${insight.color} / 0.12), hsl(${insight.color} / 0.04))` }}
            >
              <insight.icon className="h-4 w-4" style={{ color: `hsl(${insight.color})` }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{insight.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AIInsights;
