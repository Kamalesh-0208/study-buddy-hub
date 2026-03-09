import { useAnalytics } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, BookOpen, Clock, AlertTriangle } from "lucide-react";

const iconMap: Record<string, any> = {
  sparkles: Sparkles,
  trending: TrendingUp,
  book: BookOpen,
  clock: Clock,
  alert: AlertTriangle,
};

const typeStyles: Record<string, string> = {
  info: "bg-secondary/40",
  warning: "bg-study-warning/5 border border-study-warning/20",
  success: "bg-study-success/5 border border-study-success/20",
};

const AIInsights = () => {
  const { insights } = useAnalytics();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="rounded-2xl glass-strong p-6">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
        <div className="icon-bg h-8 w-8"><Sparkles className="h-4 w-4 text-primary" /></div>
        AI Insights
      </h3>
      <div className="space-y-3">
        {insights.slice(0, 5).map((insight, i) => {
          const Icon = iconMap[insight.icon] ?? Sparkles;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-start gap-3 rounded-xl p-3 ${typeStyles[insight.type] ?? typeStyles.info}`}
            >
              <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">{insight.text}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AIInsights;
