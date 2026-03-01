import { BookOpen, Brain, Clock, Target, TrendingUp, Zap } from "lucide-react";

const stats = [
  { icon: Clock, label: "Study Hours", value: "12.5", sub: "This week", change: "+2.3h", color: "252 72% 58%" },
  { icon: Brain, label: "Cards Reviewed", value: "87", sub: "Today", change: "+12", color: "280 68% 56%" },
  { icon: BookOpen, label: "Notes Created", value: "24", sub: "Total", change: "+3", color: "210 70% 55%" },
  { icon: Target, label: "Focus Score", value: "92%", sub: "Average", change: "+5%", color: "152 58% 42%" },
];

const StatsGrid = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((stat) => (
      <div key={stat.label} className="rounded-2xl glass-strong p-5 card-hover group">
        <div className="flex items-center justify-between mb-3">
          <div
            className="icon-bg h-10 w-10"
            style={{ background: `linear-gradient(135deg, hsl(${stat.color} / 0.12), hsl(${stat.color} / 0.04))` }}
          >
            <stat.icon className="h-5 w-5" style={{ color: `hsl(${stat.color})` }} />
          </div>
          <span className="text-[10px] font-semibold text-study-success flex items-center gap-0.5">
            <TrendingUp className="h-2.5 w-2.5" />
            {stat.change}
          </span>
        </div>
        <p className="text-2xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">{stat.sub}</p>
      </div>
    ))}
  </div>
);

export default StatsGrid;
