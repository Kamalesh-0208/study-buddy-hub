import { motion } from "framer-motion";
import { useStudyStrategy } from "@/hooks/useStudyStrategy";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, Lightbulb, AlertTriangle, Sparkles, Clock } from "lucide-react";

const typeIcons: Record<string, any> = {
  tip: Lightbulb,
  warning: AlertTriangle,
  encouragement: Sparkles,
};

const typeStyles: Record<string, string> = {
  tip: "bg-secondary/40",
  warning: "bg-study-warning/5 border border-study-warning/20",
  encouragement: "bg-study-success/5 border border-study-success/20",
};

const StudyStrategyEngine = () => {
  const { strategy, generateStrategy } = useStudyStrategy();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass-strong p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="icon-bg h-8 w-8"><Brain className="h-4 w-4 text-primary" /></div>
          AI Study Strategy
        </h3>
        <Button size="sm" variant="outline" onClick={() => generateStrategy.mutate()} disabled={generateStrategy.isPending} className="text-xs">
          <RefreshCw className={`h-3 w-3 mr-1 ${generateStrategy.isPending ? "animate-spin" : ""}`} />
          Generate
        </Button>
      </div>

      {!strategy && !generateStrategy.isPending && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Click "Generate" to get AI-powered study strategies based on your activity.
        </p>
      )}

      {generateStrategy.isPending && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground ml-2">Analyzing your study patterns...</span>
        </div>
      )}

      {strategy && (
        <>
          {/* Primary Strategy */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-primary">{strategy.primary_strategy.name}</h4>
            <p className="text-xs text-foreground">{strategy.primary_strategy.description}</p>
            <p className="text-[10px] text-muted-foreground italic">{strategy.primary_strategy.reasoning}</p>
          </div>

          {/* Recommended session */}
          <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs">Recommended session: <strong>{strategy.recommended_session_length} min</strong></span>
          </div>

          {/* Insights */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">AI Insights</p>
            {strategy.insights.map((insight, i) => {
              const Icon = typeIcons[insight.type] ?? Sparkles;
              return (
                <div key={i} className={`flex items-start gap-2 rounded-xl p-3 ${typeStyles[insight.type] ?? typeStyles.tip}`}>
                  <Icon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">{insight.text}</p>
                </div>
              );
            })}
          </div>

          {/* Weekly Plan */}
          {strategy.weekly_plan.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">AI Weekly Plan</p>
              {strategy.weekly_plan.map((day, i) => (
                <div key={i} className="bg-secondary/20 rounded-xl p-3">
                  <p className="text-xs font-bold text-foreground mb-2">{day.day}</p>
                  <div className="space-y-1">
                    {day.sessions.map((s, j) => (
                      <div key={j} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{s.minutes} min — {s.subject}</span>
                        <span className="text-muted-foreground">{s.activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default StudyStrategyEngine;
