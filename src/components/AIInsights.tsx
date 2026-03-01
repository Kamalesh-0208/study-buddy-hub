import { Sparkles, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    color: "252 72% 58%",
    title: "Peak Performance Window",
    desc: "You focus best between 6–8 PM. Schedule important tasks here.",
  },
  {
    icon: AlertCircle,
    color: "38 92% 50%",
    title: "Needs Attention",
    desc: "C Programming needs more revision — last studied 3 days ago.",
  },
  {
    icon: Lightbulb,
    color: "152 58% 42%",
    title: "Study Tip",
    desc: "Try the Feynman technique for IPR concepts to improve retention by 40%.",
  },
];

const AIInsights = () => (
  <div className="rounded-2xl glass-strong p-6 animate-fade-in gradient-border">
    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
      <div className="icon-bg h-8 w-8">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      AI Insights
      <span className="ml-auto text-[10px] font-semibold gradient-text px-2 py-0.5 rounded-full bg-primary/5">Powered by AI</span>
    </h3>

    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div key={i} className="flex gap-3 rounded-xl p-3.5 bg-secondary/20 hover:bg-secondary/35 transition-colors">
          <div
            className="icon-bg h-9 w-9 shrink-0"
            style={{ background: `linear-gradient(135deg, hsl(${insight.color} / 0.12), hsl(${insight.color} / 0.04))` }}
          >
            <insight.icon className="h-4 w-4" style={{ color: `hsl(${insight.color})` }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{insight.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AIInsights;
