import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { useAnalytics } from "@/hooks/useAnalytics";
import SmartFocus from "@/components/SmartFocus";
import TaskPlanner from "@/components/TaskPlanner";
import StudyMaterialsHub from "@/components/StudyMaterialsHub";
import Gamification from "@/components/Gamification";
import AIInsights from "@/components/AIInsights";
import StatsGrid from "@/components/StatsGrid";
import StudyHeatmap from "@/components/StudyHeatmap";
import SkillProgressAnalyzer from "@/components/SkillProgressAnalyzer";

const Index = () => {
  const { profile } = useAuth();
  const { sessions } = useSessions();
  const { momentumScore } = useAnalytics();
  const totalHours = Math.round((sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 3600) * 10) / 10;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
          {greeting}, {profile?.display_name?.split(" ")[0] ?? "Student"} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          You've studied <span className="font-semibold text-primary">{totalHours} hours</span> total
          {momentumScore > 0 && <> · Momentum: <span className="font-semibold text-primary">{Math.round(momentumScore)}</span></>}
        </p>
      </motion.div>

      <StatsGrid />

      <div className="grid gap-6 lg:grid-cols-2">
        <SmartFocus />
        <TaskPlanner />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StudyMaterialsHub />
        <Gamification />
        <AIInsights />
      </div>

      <StudyHeatmap />
    </div>
  );
};

export default Index;
