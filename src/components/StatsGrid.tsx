import { BookOpen, Brain, Clock, Target } from "lucide-react";

const stats = [
  { icon: Clock, label: "Study Hours", value: "12.5", sub: "This week", color: "250 70% 56%" },
  { icon: Brain, label: "Cards Reviewed", value: "87", sub: "Today", color: "280 65% 58%" },
  { icon: BookOpen, label: "Notes Created", value: "24", sub: "Total", color: "200 70% 50%" },
  { icon: Target, label: "Focus Score", value: "92%", sub: "Average", color: "152 55% 45%" },
];

const StatsGrid = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((stat) => (
      <div
        key={stat.label}
        className="rounded-2xl card-glass p-5 flex items-start gap-4 group cursor-default"
      >
        <div
          className="icon-circle h-10 w-10 shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${stat.color} / 0.15), hsl(${stat.color} / 0.05))`,
          }}
        >
          <stat.icon
            className="h-5 w-5"
            style={{ color: `hsl(${stat.color})` }}
          />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.label}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</p>
        </div>
      </div>
    ))}
  </div>
);

export default StatsGrid;
