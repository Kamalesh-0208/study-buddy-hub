import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useStudyStore } from "@/store/useStudyStore";
import { motion } from "framer-motion";

const PerformanceAnalytics = () => {
  const { weeklyStudyData, focusScoreTrend, subjectBreakdown, sessions } = useStudyStore();
  const weekData = weeklyStudyData();
  const focusData = focusScoreTrend();
  const subjectData = subjectBreakdown();

  // Heatmap from real sessions
  const heatmapData = Array.from({ length: 28 }, (_, i) => {
    const date = new Date(Date.now() - (27 - i) * 86400000);
    const dayStr = date.toISOString().split("T")[0];
    const daySessions = sessions.filter((s) => s.date.split("T")[0] === dayStr);
    const totalMinutes = daySessions.reduce((a, s) => a + s.duration / 60, 0);
    return {
      day: i,
      intensity: totalMinutes > 90 ? 4 : totalMinutes > 60 ? 3 : totalMinutes > 30 ? 2 : totalMinutes > 0 ? 1 : 0,
    };
  });

  const heatColors = [
    "hsl(var(--secondary))",
    "hsl(252, 72%, 58%, 0.2)",
    "hsl(252, 72%, 58%, 0.4)",
    "hsl(252, 72%, 58%, 0.6)",
    "hsl(252, 72%, 58%, 0.85)",
  ];

  const maxHours = Math.max(...subjectData.map((s) => s.hours), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl glass-strong p-6"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-6">
        <div className="icon-bg h-8 w-8">
          <ChartIcon className="h-4 w-4 text-primary" />
        </div>
        Performance Analytics
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">Weekly Study Hours</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="hours" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(252, 72%, 58%)" />
                  <stop offset="100%" stopColor="hsl(280, 68%, 56%)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">Focus Score Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={focusData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="hsl(252, 72%, 58%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(252, 72%, 58%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">Study Heatmap (Last 4 Weeks)</p>
          <div className="grid grid-cols-7 gap-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[9px] text-muted-foreground/60 text-center font-medium">{d}</span>
            ))}
            {heatmapData.map((d) => (
              <motion.div
                key={d.day}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: d.day * 0.02 }}
                className="aspect-square rounded-[4px]"
                style={{ background: heatColors[d.intensity] }}
                title={`Level ${d.intensity}`}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">Hours by Subject</p>
          <div className="space-y-3">
            {subjectData.map((s) => (
              <div key={s.subject}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{s.subject}</span>
                  <span className="text-muted-foreground">{s.hours}h</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.hours / maxHours) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

export default PerformanceAnalytics;
