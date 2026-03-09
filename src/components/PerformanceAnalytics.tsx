import { useSessions } from "@/hooks/useSessions";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PerformanceAnalytics = () => {
  const { sessions } = useSessions();
  const weeklyData = (() => { const days: Record<string, number> = {}; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000); days[dayNames[d.getDay()]] = 0; } sessions.forEach((sess) => { const d = new Date(sess.start_time); const dayName = dayNames[d.getDay()]; if (dayName in days) days[dayName] += sess.duration_seconds / 3600; }); return Object.entries(days).map(([day, hours]) => ({ day, hours: Math.round(hours * 10) / 10 })); })();
  const focusTrend = (() => { const days: Record<string, number[]> = {}; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000); days[dayNames[d.getDay()]] = []; } sessions.forEach((sess) => { const d = new Date(sess.start_time); const dayName = dayNames[d.getDay()]; if (dayName in days) days[dayName].push(sess.focus_score ?? 80); }); return Object.entries(days).map(([day, scores]) => ({ day, score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0 })); })();
  const totalHours = sessions.reduce((s, ss) => s + ss.duration_seconds / 3600, 0);
  const avgFocus = sessions.length ? Math.round(sessions.reduce((s, ss) => s + (ss.focus_score ?? 80), 0) / sessions.length) : 0;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="rounded-2xl glass-strong p-6">
      <h3 className="text-sm font-bold text-foreground mb-6">Performance Analytics</h3>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-xl bg-secondary/40 p-3 text-center"><p className="text-2xl font-extrabold text-foreground">{totalHours.toFixed(1)}h</p><p className="text-[10px] text-muted-foreground">Total Study</p></div>
        <div className="rounded-xl bg-secondary/40 p-3 text-center"><p className="text-2xl font-extrabold text-foreground">{avgFocus}</p><p className="text-[10px] text-muted-foreground">Avg Focus Score</p></div>
        <div className="rounded-xl bg-secondary/40 p-3 text-center"><p className="text-2xl font-extrabold text-foreground">{sessions.length}</p><p className="text-[10px] text-muted-foreground">Total Sessions</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div><p className="text-xs font-semibold text-foreground mb-3">Weekly Study Hours</p><ResponsiveContainer width="100%" height={180}><BarChart data={weeklyData}><XAxis dataKey="day" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={30} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} /><Bar dataKey="hours" fill="hsl(252, 72%, 58%)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div><p className="text-xs font-semibold text-foreground mb-3">Focus Score Trend</p><ResponsiveContainer width="100%" height={180}><LineChart data={focusTrend}><CartesianGrid strokeDasharray="3 3" className="opacity-20" /><XAxis dataKey="day" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={30} domain={[0, 100]} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} /><Line type="monotone" dataKey="score" stroke="hsl(280, 68%, 56%)" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
      </div>
    </motion.div>
  );
};
export default PerformanceAnalytics;