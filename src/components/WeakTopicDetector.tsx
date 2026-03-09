import { motion } from "framer-motion";
import { useWeakTopics } from "@/hooks/useWeakTopics";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, RefreshCw, AlertTriangle } from "lucide-react";

const WeakTopicDetector = () => {
  const { weakTopics, detectWeakTopics } = useWeakTopics();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass-strong p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="icon-bg h-8 w-8"><Target className="h-4 w-4 text-primary" /></div>
          Weak Topic Detector
        </h3>
        <Button size="sm" variant="outline" onClick={() => detectWeakTopics.mutate()} disabled={detectWeakTopics.isPending} className="text-xs">
          <RefreshCw className={`h-3 w-3 mr-1 ${detectWeakTopics.isPending ? "animate-spin" : ""}`} />
          Analyze
        </Button>
      </div>

      {detectWeakTopics.isPending && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground ml-2">Detecting weak areas...</span>
        </div>
      )}

      {weakTopics.length === 0 && !detectWeakTopics.isPending && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Click "Analyze" to detect weak topics based on your study data.
        </p>
      )}

      {weakTopics.length > 0 && (
        <div className="space-y-3">
          {weakTopics.map((wt: any, i: number) => (
            <motion.div
              key={wt.id ?? i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-secondary/20 rounded-xl p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-3.5 w-3.5 ${wt.weakness_score >= 70 ? "text-destructive" : "text-yellow-500"}`} />
                  <span className="text-xs font-bold">{wt.topic_name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{wt.subjects?.name ?? wt.subject_name ?? ""}</span>
              </div>
              <Progress value={wt.weakness_score} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">{wt.reason}</p>
              <p className="text-[10px] text-primary font-medium">💡 {wt.recommendation}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WeakTopicDetector;
