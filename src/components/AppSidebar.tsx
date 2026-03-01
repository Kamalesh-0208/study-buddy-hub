import { useState } from "react";
import {
  LayoutDashboard, Target, ListTodo, BookOpen, BarChart3,
  Trophy, Medal, Settings, ChevronLeft, ChevronRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Target, label: "Focus Mode", id: "focus" },
  { icon: ListTodo, label: "Tasks", id: "tasks" },
  { icon: BookOpen, label: "Study Materials", id: "materials" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Trophy, label: "Goals", id: "goals" },
  { icon: Medal, label: "Leaderboard", id: "leaderboard" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", id: "settings" },
];

interface Props {
  active: string;
  onNavigate: (id: string) => void;
}

const AppSidebar = ({ active, onNavigate }: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col border-r border-border/40 glass-strong transition-all duration-300 z-20",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/30">
        <div className="gradient-bg rounded-xl p-2 shadow-glow shrink-0">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-extrabold gradient-text tracking-tight">
            StudyFlow
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              active === item.id
                ? "bg-primary/10 text-primary shadow-glow"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-[18px] w-[18px] shrink-0", active === item.id && "text-primary")} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-2 border-t border-border/30 flex flex-col gap-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              active === item.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          {collapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
