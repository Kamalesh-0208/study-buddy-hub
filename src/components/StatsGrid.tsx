import { BookOpen, Brain, Clock, Target } from "lucide-react";

const stats = [
  { icon: Clock, label: "Study Hours", value: "12.5", sub: "This week" },
  { icon: Brain, label: "Cards Reviewed", value: "87", sub: "Today" },
  { icon: BookOpen, label: "Notes Created", value: "24", sub: "Total" },
  { icon: Target, label: "Focus Score", value: "92%", sub: "Average" },
];

const StatsGrid = () => (
  <div className="grid grid-cols-2 gap-3 animate-fade-in">
    {stats.map((stat) => (
      <div key={stat.label} className="rounded-xl bg-card p-4 card-shadow flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <stat.icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
        </div>
      </div>
    ))}
  </div>
);

export default StatsGrid;
