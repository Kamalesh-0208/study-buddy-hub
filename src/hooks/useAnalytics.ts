import { useMemo } from "react";
import { useSessions } from "./useSessions";
import { useSubjects } from "./useSubjects";
import { useTasks } from "./useTasks";
import { useAuth } from "./useAuth";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const useAnalytics = () => {
  const { sessions } = useSessions();
  const { subjects } = useSubjects();
  const { tasks } = useTasks();
  const { profile } = useAuth();

  return useMemo(() => {
    const now = new Date();

    // Study patterns - best hours
    const hourBuckets: Record<number, { totalFocus: number; totalMins: number; count: number }> = {};
    sessions.forEach((s) => {
      const hour = new Date(s.start_time).getHours();
      if (!hourBuckets[hour]) hourBuckets[hour] = { totalFocus: 0, totalMins: 0, count: 0 };
      hourBuckets[hour].totalFocus += s.focus_score ?? 80;
      hourBuckets[hour].totalMins += s.duration_seconds / 60;
      hourBuckets[hour].count += 1;
    });

    const bestHours = Object.entries(hourBuckets)
      .map(([h, d]) => ({ hour: Number(h), avgFocus: d.totalFocus / d.count, totalMins: d.totalMins }))
      .sort((a, b) => b.avgFocus - a.avgFocus);

    const peakHour = bestHours[0]?.hour ?? null;

    // Most productive days
    const dayBuckets: Record<number, number> = {};
    sessions.forEach((s) => {
      const day = new Date(s.start_time).getDay();
      dayBuckets[day] = (dayBuckets[day] ?? 0) + s.duration_seconds / 60;
    });
    const bestDay = Object.entries(dayBuckets)
      .sort(([, a], [, b]) => b - a)[0];
    const mostProductiveDay = bestDay ? dayNames[Number(bestDay[0])] : null;

    // Subject performance
    const subjectStudy: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.subject_id) {
        subjectStudy[s.subject_id] = (subjectStudy[s.subject_id] ?? 0) + s.duration_seconds / 3600;
      }
    });

    const strongestSubjectId = Object.entries(subjectStudy).sort(([, a], [, b]) => b - a)[0]?.[0];
    const weakestSubjectId = Object.entries(subjectStudy).sort(([, a], [, b]) => a - b)[0]?.[0];
    const strongestSubject = subjects.find((s) => s.id === strongestSubjectId)?.name ?? null;
    const weakestSubject = subjects.find((s) => s.id === weakestSubjectId)?.name ?? null;

    // Neglected subjects (not studied in 5+ days)
    const neglectedSubjects = subjects.filter((s) => {
      if (!s.last_studied_at) return true;
      const diff = (now.getTime() - new Date(s.last_studied_at).getTime()) / 86400000;
      return diff >= 5;
    });

    // Average session length
    const avgSessionMinutes = sessions.length
      ? Math.round(sessions.reduce((s, ss) => s + ss.duration_seconds, 0) / sessions.length / 60)
      : 0;

    // Consistency score (0-100): how many of the last 14 days had study activity
    const last14Days = new Set<string>();
    sessions.forEach((s) => {
      const d = new Date(s.start_time);
      if (now.getTime() - d.getTime() < 14 * 86400000) {
        last14Days.add(d.toISOString().split("T")[0]);
      }
    });
    const consistencyScore = Math.round((last14Days.size / 14) * 100);

    // Burnout detection: compare recent 3 days vs prior 7 days
    const recent3 = sessions.filter((s) => now.getTime() - new Date(s.start_time).getTime() < 3 * 86400000);
    const prior7 = sessions.filter((s) => {
      const diff = now.getTime() - new Date(s.start_time).getTime();
      return diff >= 3 * 86400000 && diff < 10 * 86400000;
    });
    const recent3Avg = recent3.length
      ? recent3.reduce((s, ss) => s + (ss.focus_score ?? 80), 0) / recent3.length
      : null;
    const prior7Avg = prior7.length
      ? prior7.reduce((s, ss) => s + (ss.focus_score ?? 80), 0) / prior7.length
      : null;
    const burnoutDetected = recent3Avg !== null && prior7Avg !== null && prior7Avg - recent3Avg > 15;

    // Study heatmap data (last 90 days)
    const heatmapData: Record<string, { minutes: number; score: number; subjects: Set<string> }> = {};
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0];
      heatmapData[d] = { minutes: 0, score: 0, subjects: new Set() };
    }
    sessions.forEach((s) => {
      const d = new Date(s.start_time).toISOString().split("T")[0];
      if (heatmapData[d]) {
        heatmapData[d].minutes += s.duration_seconds / 60;
        heatmapData[d].score = Math.max(heatmapData[d].score, s.focus_score ?? 80);
        if (s.subject_id) heatmapData[d].subjects.add(s.subject_id);
      }
    });

    const heatmap = Object.entries(heatmapData).map(([date, data]) => ({
      date,
      minutes: Math.round(data.minutes),
      score: data.score,
      subjectCount: data.subjects.size,
    }));

    // Weekly report
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const weekSessions = sessions.filter((s) => new Date(s.start_time) >= weekAgo);
    const weeklyHours = Math.round(weekSessions.reduce((s, ss) => s + ss.duration_seconds / 3600, 0) * 10) / 10;
    const weeklyFocusAvg = weekSessions.length
      ? Math.round(weekSessions.reduce((s, ss) => s + (ss.focus_score ?? 80), 0) / weekSessions.length)
      : 0;
    const weeklyTasksDone = tasks.filter((t) => t.completed && t.completed_at && new Date(t.completed_at) >= weekAgo).length;

    // Most studied subject this week
    const weekSubjectHours: Record<string, number> = {};
    weekSessions.forEach((s) => {
      if (s.subject_id) weekSubjectHours[s.subject_id] = (weekSubjectHours[s.subject_id] ?? 0) + s.duration_seconds / 3600;
    });
    const topWeekSubjectId = Object.entries(weekSubjectHours).sort(([, a], [, b]) => b - a)[0]?.[0];
    const topWeekSubject = subjects.find((s) => s.id === topWeekSubjectId)?.name ?? null;

    // Momentum score (0-100) based on rolling 7-day consistency + focus trend
    const streakBonus = Math.min(30, (profile?.current_streak ?? 0) * 3);
    const momentumScore = Math.min(100, consistencyScore * 0.5 + weeklyFocusAvg * 0.2 + streakBonus);

    // AI insights messages
    const insights: { icon: string; text: string; type: "info" | "warning" | "success" }[] = [];

    if (sessions.length === 0) {
      insights.push({ icon: "sparkles", text: "Complete your first study session to get AI insights!", type: "info" });
    } else {
      if (peakHour !== null) {
        const h = peakHour;
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
        insights.push({ icon: "clock", text: `You focus best around ${displayH}–${displayH + 2} ${period}. Schedule important subjects then.`, type: "info" });
      }

      if (mostProductiveDay) {
        insights.push({ icon: "trending", text: `${mostProductiveDay}s are your most productive days.`, type: "info" });
      }

      neglectedSubjects.slice(0, 2).forEach((s) => {
        const days = s.last_studied_at
          ? Math.round((now.getTime() - new Date(s.last_studied_at).getTime()) / 86400000)
          : null;
        insights.push({
          icon: "book",
          text: days ? `You haven't studied ${s.name} for ${days} days.` : `${s.name} needs attention — no sessions recorded.`,
          type: "warning",
        });
      });

      if (burnoutDetected) {
        insights.push({ icon: "alert", text: "Productivity drop detected. Consider taking a break to recharge.", type: "warning" });
      }

      if (consistencyScore >= 70) {
        insights.push({ icon: "trending", text: `Great consistency! You studied ${last14Days.size} of the last 14 days.`, type: "success" });
      }

      if (recent3Avg !== null && prior7Avg !== null && recent3Avg > prior7Avg + 5) {
        insights.push({ icon: "trending", text: "Your focus is improving! Keep the momentum going 🚀", type: "success" });
      }
    }

    // Subject distribution for pie/bar charts
    const subjectDistribution = subjects.map((s) => ({
      name: s.name,
      hours: Math.round((subjectStudy[s.id] ?? 0) * 10) / 10,
      color: s.color ?? "#6366f1",
    })).filter((s) => s.hours > 0).sort((a, b) => b.hours - a.hours);

    return {
      peakHour,
      mostProductiveDay,
      strongestSubject,
      weakestSubject,
      neglectedSubjects,
      avgSessionMinutes,
      consistencyScore,
      burnoutDetected,
      heatmap,
      weeklyHours,
      weeklyFocusAvg,
      weeklyTasksDone,
      topWeekSubject,
      momentumScore,
      insights,
      subjectDistribution,
      bestHours,
    };
  }, [sessions, subjects, tasks, profile]);
};
