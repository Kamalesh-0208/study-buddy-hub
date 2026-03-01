import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const weeklyData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 4.2 },
  { day: "Wed", hours: 3.1 },
  { day: "Thu", hours: 5.0 },
  { day: "Fri", hours: 3.8 },
  { day: "Sat", hours: 6.2 },
  { day: "Sun", hours: 4.5 },
];

const focusData = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 85 },
  { day: "Wed", score: 68 },
  { day: "Thu", score: 91 },
  { day: "Fri", score: 78 },
  { day: "Sat", score: 95 },
  { day: "Sun", score: 88 },
];

const subjectBreakdown = [
  { subject: "IPR", hours: 8, color: "hsl(252, 72%, 58%)" },
  { subject: "HTML", hours: 5, color: "hsl(210, 70%, 55%)" },
  { subject: "C-Prog", hours: 12, color: "hsl(152, 58%, 42%)" },
];

// Heatmap data: last 28 days
const heatmapData = Array.from({ length: 28 }, (_, i) => ({
  day: i,
  intensity: Math.random() > 0.2 ? Math.floor(Math.random() * 4) + 1 : 0,
}));

const heatColors = ["hsl(var(--secondary))", "hsl(252, 72%, 58%, 0.2)", "hsl(252, 72%, 58%, 0.4)", "hsl(252, 72%, 58%, 0.6)", "hsl(252, 72%, 58%, 0.85)"];

const PerformanceAnalytics = () => (
  <div className="rounded-2xl glass-strong p-6 animate-fade-in">
    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-6">
      <div className="icon-bg h-8 w-8">
        <ChartIcon className="h-4 w-4 text-primary" />
      </div>
      Performance Analytics
    </h3>

    <div className="grid gap-6 md:grid-cols-2">
      {/* Weekly Focus Chart */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3">Weekly Study Hours</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              cursor={{ fill: "hsl(var(--primary) / 0.05)" }}
            />
            <Bar dataKey="hours" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(252, 72%, 58%)" />
                <stop offset="100%" stopColor="hsl(280, 68%, 56%)" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Focus Score Trend */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3">Focus Score Trend</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={focusData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} domain={[50, 100]} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
            />
            <Line type="monotone" dataKey="score" stroke="hsl(252, 72%, 58%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(252, 72%, 58%)" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Study Heatmap */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3">Study Heatmap (Last 4 Weeks)</p>
        <div className="grid grid-cols-7 gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="text-[9px] text-muted-foreground/60 text-center font-medium">{d}</span>
          ))}
          {heatmapData.map((d) => (
            <div
              key={d.day}
              className="aspect-square rounded-[4px] transition-colors"
              style={{ background: heatColors[d.intensity] }}
              title={`Day ${d.day + 1}: Level ${d.intensity}`}
            />
          ))}
        </div>
      </div>

      {/* Subject Breakdown */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3">Hours by Subject</p>
        <div className="space-y-3">
          {subjectBreakdown.map((s) => (
            <div key={s.subject}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-foreground">{s.subject}</span>
                <span className="text-muted-foreground">{s.hours}h</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(s.hours / 15) * 100}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

export default PerformanceAnalytics;
