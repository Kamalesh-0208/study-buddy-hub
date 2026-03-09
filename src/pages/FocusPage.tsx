import SmartFocus from "@/components/SmartFocus";
import AIInsights from "@/components/AIInsights";
import { motion } from "framer-motion";
import { useSessions } from "@/hooks/useSessions";
import { useSubjects } from "@/hooks/useSubjects";
import { Clock, Zap } from "lucide-react";

const FocusPage = () => {
  const { sessions } = useSessions();
  const { subjects } = useSubjects();
  const recentSessions = sessions.slice(0, 5);

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return "General";
    const s = subjects.find((sub) => sub.id === subjectId);
    return s?.name ?? "Unknown";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Focus Mode</h2>
        <p className="text-sm text-muted-foreground mt-1">Deep work sessions with AI-powered optimization</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SmartFocus />
        <div className="space-y-6">
          <AIInsights />
          <div className="rounded-2xl glass-strong p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="icon-bg h-8 w-8"><Clock className="h-4 w-4 text-primary" /></div>
              Recent Sessions
            </h3>
            <div className="space-y-2">
              {recentSessions.length === 0 && (
                <p className="text-xs text-muted-foreground">No sessions yet. Start a focus session!</p>
              )}
              {recentSessions.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl p-3 bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <div className="icon-bg h-8 w-8 shrink-0"><Zap className="h-3.5 w-3.5 text-primary" /></div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{getSubjectName(s.subject_id)}</p>
                    <p className="text-[10px] text-muted-foreground">{Math.round(s.duration_seconds / 60)} min • Score: {s.focus_score ?? 80}%</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(s.start_time).toLocaleDateString()}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FocusPage;
