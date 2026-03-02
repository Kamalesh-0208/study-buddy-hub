import { Plus } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import TopNavbar from "@/components/TopNavbar";
import SmartFocus from "@/components/SmartFocus";
import TaskPlanner from "@/components/TaskPlanner";
import StudyMaterialsHub from "@/components/StudyMaterialsHub";
import PerformanceAnalytics from "@/components/PerformanceAnalytics";
import Gamification from "@/components/Gamification";
import AIInsights from "@/components/AIInsights";
import StatsGrid from "@/components/StatsGrid";
import { useStudyStore } from "@/store/useStudyStore";
import { motion } from "framer-motion";

const Index = () => {
  const { totalStudyHours } = useStudyStore();
  const hours = totalStudyHours();
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
          {greeting}, Student 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          You've studied <span className="font-semibold text-primary">{hours} hours</span> this week. Keep the momentum going!
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

      <PerformanceAnalytics />
    </div>
  );
};

export default Index;
