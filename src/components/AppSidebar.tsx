import { useState } from "react";
import {
  LayoutDashboard, Target, ListTodo, BookOpen, BarChart3,
  Trophy, Medal, Settings, ChevronLeft, ChevronRight, Zap, Brain, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Target, label: "Focus Mode", path: "/focus" },
  { icon: ListTodo, label: "Tasks", path: "/tasks" },
  { icon: BookOpen, label: "Study Materials", path: "/materials" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Trophy, label: "Goals", path: "/goals" },
  { icon: Medal, label: "Leaderboard", path: "/leaderboard" },
  { icon: Brain, label: "AI Planner", path: "/planner" },
  { icon: ClipboardCheck, label: "Assessment", path: "/assessment" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col border-r border-border/40 glass-strong transition-all duration-300 z-20",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/30">
        <motion.div whileHover={{ rotate: 15 }} className="gradient-bg rounded-xl p-2 shadow-glow shrink-0">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </motion.div>
        {!collapsed && (
          <span className="text-lg font-extrabold gradient-text tracking-tight whitespace-nowrap">StudyFlow Pro Max</span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </motion.button>
          );
        })}
      </nav>

      <div className="py-3 px-2 border-t border-border/30 flex flex-col gap-1">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
        <button onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
          {collapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
