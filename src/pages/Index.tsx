import { useState } from "react";
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

const Index = () => {
  const [activeNav, setActiveNav] = useState("dashboard");

  return (
    <div className="flex min-h-screen">
      <AppSidebar active={activeNav} onNavigate={setActiveNav} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />

        <main className="flex-1 px-6 py-8 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1200px] mx-auto space-y-8">
            {/* Welcome */}
            <div className="animate-fade-in">
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                Good evening, Student 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                You've studied <span className="font-semibold text-primary">4.5 hours</span> today. Keep the momentum going!
              </p>
            </div>

            {/* Stats */}
            <StatsGrid />

            {/* Focus + Tasks */}
            <div className="grid gap-6 lg:grid-cols-2">
              <SmartFocus />
              <TaskPlanner />
            </div>

            {/* Materials + Gamification + AI */}
            <div className="grid gap-6 lg:grid-cols-3">
              <StudyMaterialsHub />
              <Gamification />
              <AIInsights />
            </div>

            {/* Analytics */}
            <PerformanceAnalytics />
          </div>
        </main>

        {/* FAB */}
        <button className="fixed bottom-6 right-6 h-12 w-12 rounded-2xl gradient-bg text-primary-foreground shadow-glow flex items-center justify-center hover:scale-105 transition-transform z-40">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Index;
