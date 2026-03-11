import { motion } from "framer-motion";
import { useSkillProgress } from "@/hooks/useSkillProgress";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, AlertTriangle, Lightbulb, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SkillProgressAnalyzer = () => {
  const { data, isLoading } = useSkillProgress();

  if (isLoading) {
    return (
      <div className="rounded-2xl glass-strong p-6 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!data || data.totalTests === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass-strong p-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="icon-bg h-8 w-8"><BarChart3 className="h-4 w-4 text-primary" /></div>
          Skill Progress
        </h3>
        <p className="text-xs text-muted-foreground mt-3 text-center py-4">
          Complete assessments to see your skill progress here.
        </p>
      </motion.div>
    );
  }

  const { skills, weakTopics, recent } = data;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass-strong p-6 space-y-5">
      {/* Header */}
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <div className="icon-bg h-8 w-8"><BarChart3 className="h-4 w-4 text-primary" /></div>
        Skill Progress
      </h3>

      {/* Skill Accuracy Bars */}
      <div className="space-y-3">
        {skills.map((s, i) => (
          <motion.div key={s.skill} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">{s.skill}</span>
              <span className="text-[10px] text-muted-foreground">{s.accuracy}% · {s.totalAttempted} Qs</span>
            </div>
            <Progress value={s.accuracy} className="h-2" />
          </motion.div>
        ))}
      </div>

      {/* Weak Areas */}
      {weakTopics.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            Weak Areas
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {weakTopics.map((t) => (
              <Badge key={`${t.skill}-${t.topic}`} variant="destructive" className="text-[10px]">
                {t.topic} ({t.accuracy}%)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Practice */}
      {weakTopics.length > 0 && (
        <div className="bg-primary/5 rounded-xl p-3 space-y-1.5">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            Suggested Practice
          </h4>
          {weakTopics.slice(0, 3).map((t) => (
            <p key={`${t.skill}-${t.topic}`} className="text-[10px] text-muted-foreground">
              • Practice <span className="font-semibold text-foreground">{t.topic}</span> in {t.skill} — accuracy is only {t.accuracy}%
            </p>
          ))}
        </div>
      )}

      {/* Recent Results */}
      {recent.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Recent Tests
          </h4>
          <div className="space-y-1.5">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-[10px] bg-secondary/20 rounded-lg px-3 py-1.5">
                <span className="text-foreground font-medium truncate max-w-[50%]">{r.skill} · {r.topic}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={r.passed ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                    {Math.round(r.score_percentage)}%
                  </Badge>
                  <span className="text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SkillProgressAnalyzer;
