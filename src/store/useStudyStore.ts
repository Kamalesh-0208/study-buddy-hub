import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ──────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  deadline: string;
  done: boolean;
  est: string;
  createdAt: number;
}

export interface StudySession {
  id: string;
  subject: string;
  duration: number; // seconds
  date: string; // ISO
  focusScore: number; // 0-100
}

export interface SubjectProgress {
  id: string;
  title: string;
  progress: number;
  lastStudied: string;
  totalMinutes: number;
}

export interface Achievement {
  id: string;
  icon: string;
  label: string;
  unlocked: boolean;
  unlockedAt?: string;
  color: string;
  requirement: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  studyHours: number;
  xp: number;
  focusScore: number;
  streak: number;
}

interface StudyState {
  // Timer
  timerSeconds: number;
  timerRunning: boolean;
  timerMode: "focus" | "break";
  studyDuration: number; // configurable
  breakDuration: number;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;

  // Sessions
  sessions: StudySession[];
  addSession: (session: Omit<StudySession, "id">) => void;

  // XP & Gamification
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  addXP: (amount: number) => void;
  checkStreak: () => void;

  // Achievements
  achievements: Achievement[];
  checkAchievements: () => void;

  // Subject progress
  subjects: SubjectProgress[];
  updateSubjectProgress: (id: string, minutes: number) => void;

  // Settings
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Notifications
  notifications: { id: string; text: string; time: string; read: boolean }[];
  addNotification: (text: string) => void;
  markNotificationRead: (id: string) => void;

  // Leaderboard
  leaderboard: LeaderboardUser[];

  // Computed helpers
  totalStudyHours: () => number;
  weeklyStudyData: () => { day: string; hours: number }[];
  focusScoreTrend: () => { day: string; score: number }[];
  subjectBreakdown: () => { subject: string; hours: number; color: string }[];
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "streak10", icon: "Flame", label: "10-Day Streak", unlocked: false, color: "38 92% 50%", requirement: "10 day streak" },
  { id: "focus_master", icon: "Target", label: "Focus Master", unlocked: false, color: "252 72% 58%", requirement: "5 focus sessions" },
  { id: "cards100", icon: "BookOpen", label: "100 Cards", unlocked: false, color: "152 58% 42%", requirement: "Review 100 cards" },
  { id: "night_owl", icon: "Star", label: "Night Owl", unlocked: false, color: "280 68% 56%", requirement: "Study after 10 PM" },
  { id: "speed_reader", icon: "Zap", label: "Speed Reader", unlocked: false, color: "210 70% 55%", requirement: "Complete 5 materials" },
  { id: "perfect_week", icon: "Award", label: "Perfect Week", unlocked: false, color: "0 72% 51%", requirement: "Study every day for a week" },
];

const INITIAL_SUBJECTS: SubjectProgress[] = [
  { id: "ipr", title: "IPR", progress: 45, lastStudied: new Date().toISOString(), totalMinutes: 480 },
  { id: "htmlcss", title: "HTML & CSS", progress: 72, lastStudied: new Date(Date.now() - 86400000).toISOString(), totalMinutes: 300 },
  { id: "cprog", title: "C-Programming", progress: 30, lastStudied: new Date(Date.now() - 259200000).toISOString(), totalMinutes: 720 },
];

const DUMMY_LEADERBOARD: LeaderboardUser[] = [
  { id: "1", name: "Alex Chen", avatar: "A", studyHours: 48.5, xp: 5200, focusScore: 94, streak: 21 },
  { id: "2", name: "Priya Sharma", avatar: "P", studyHours: 42.3, xp: 4800, focusScore: 91, streak: 18 },
  { id: "you", name: "You", avatar: "S", studyHours: 12.5, xp: 2450, focusScore: 88, streak: 12 },
  { id: "3", name: "James Wilson", avatar: "J", studyHours: 35.1, xp: 3900, focusScore: 85, streak: 14 },
  { id: "4", name: "Sarah Kim", avatar: "S", studyHours: 31.2, xp: 3400, focusScore: 82, streak: 9 },
  { id: "5", name: "Ravi Patel", avatar: "R", studyHours: 28.7, xp: 3100, focusScore: 79, streak: 7 },
  { id: "6", name: "Emma Davis", avatar: "E", studyHours: 25.0, xp: 2800, focusScore: 76, streak: 5 },
  { id: "7", name: "Liam Brown", avatar: "L", studyHours: 22.4, xp: 2500, focusScore: 73, streak: 4 },
];

const INITIAL_SESSIONS: StudySession[] = [
  { id: "s1", subject: "IPR", duration: 1800, date: new Date(Date.now() - 6 * 86400000).toISOString(), focusScore: 72 },
  { id: "s2", subject: "C-Programming", duration: 2700, date: new Date(Date.now() - 5 * 86400000).toISOString(), focusScore: 85 },
  { id: "s3", subject: "HTML & CSS", duration: 1200, date: new Date(Date.now() - 4 * 86400000).toISOString(), focusScore: 68 },
  { id: "s4", subject: "C-Programming", duration: 3600, date: new Date(Date.now() - 3 * 86400000).toISOString(), focusScore: 91 },
  { id: "s5", subject: "IPR", duration: 2100, date: new Date(Date.now() - 2 * 86400000).toISOString(), focusScore: 78 },
  { id: "s6", subject: "C-Programming", duration: 3000, date: new Date(Date.now() - 1 * 86400000).toISOString(), focusScore: 95 },
  { id: "s7", subject: "HTML & CSS", duration: 2400, date: new Date().toISOString(), focusScore: 88 },
];

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Review IPR Patent Search Methods", priority: "high", deadline: "Today", done: false, est: "45 min", createdAt: Date.now() - 100000 },
  { id: "t2", title: "Complete C-2 Practice Questions", priority: "high", deadline: "Today", done: false, est: "1h 30m", createdAt: Date.now() - 90000 },
  { id: "t3", title: "Read HTML & CSS Reference Guide", priority: "medium", deadline: "Tomorrow", done: true, est: "30 min", createdAt: Date.now() - 80000 },
  { id: "t4", title: "Practice C-3 Question Bank", priority: "medium", deadline: "Wed", done: false, est: "1h", createdAt: Date.now() - 70000 },
  { id: "t5", title: "Watch Espacenet Tutorial Video", priority: "low", deadline: "Thu", done: false, est: "20 min", createdAt: Date.now() - 60000 },
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      // Timer
      timerSeconds: 30 * 60,
      timerRunning: false,
      timerMode: "focus",
      studyDuration: 30 * 60,
      breakDuration: 5 * 60,

      // Tasks
      tasks: INITIAL_TASKS,
      addTask: (task) =>
        set((s) => ({
          tasks: [...s.tasks, { ...task, id: `t${Date.now()}`, createdAt: Date.now() }],
        })),
      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      reorderTasks: (tasks) => set({ tasks }),

      // Sessions
      sessions: INITIAL_SESSIONS,
      addSession: (session) =>
        set((s) => ({
          sessions: [...s.sessions, { ...session, id: `s${Date.now()}` }],
        })),

      // XP
      xp: 2450,
      level: 12,
      streak: 12,
      longestStreak: 18,
      lastStudyDate: new Date().toISOString().split("T")[0],
      addXP: (amount) =>
        set((s) => {
          const newXP = s.xp + amount;
          const newLevel = Math.floor(newXP / 250) + 1;
          return { xp: newXP, level: newLevel };
        }),
      checkStreak: () =>
        set((s) => {
          const today = new Date().toISOString().split("T")[0];
          if (s.lastStudyDate === today) return {};
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          if (s.lastStudyDate === yesterday) {
            const newStreak = s.streak + 1;
            return {
              streak: newStreak,
              longestStreak: Math.max(newStreak, s.longestStreak),
              lastStudyDate: today,
            };
          }
          return { streak: 1, lastStudyDate: today };
        }),

      // Achievements
      achievements: INITIAL_ACHIEVEMENTS,
      checkAchievements: () =>
        set((s) => {
          const updated = [...s.achievements];
          if (s.streak >= 10 && !updated.find((a) => a.id === "streak10")?.unlocked) {
            const idx = updated.findIndex((a) => a.id === "streak10");
            updated[idx] = { ...updated[idx], unlocked: true, unlockedAt: new Date().toISOString() };
          }
          if (s.sessions.length >= 5 && !updated.find((a) => a.id === "focus_master")?.unlocked) {
            const idx = updated.findIndex((a) => a.id === "focus_master");
            updated[idx] = { ...updated[idx], unlocked: true, unlockedAt: new Date().toISOString() };
          }
          const hour = new Date().getHours();
          if (hour >= 22 && !updated.find((a) => a.id === "night_owl")?.unlocked) {
            const idx = updated.findIndex((a) => a.id === "night_owl");
            updated[idx] = { ...updated[idx], unlocked: true, unlockedAt: new Date().toISOString() };
          }
          return { achievements: updated };
        }),

      // Subjects
      subjects: INITIAL_SUBJECTS,
      updateSubjectProgress: (id, minutes) =>
        set((s) => ({
          subjects: s.subjects.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  totalMinutes: sub.totalMinutes + minutes,
                  progress: Math.min(100, sub.progress + Math.round(minutes / 10)),
                  lastStudied: new Date().toISOString(),
                }
              : sub
          ),
        })),

      // Settings
      darkMode: false,
      toggleDarkMode: () =>
        set((s) => {
          const newDark = !s.darkMode;
          document.documentElement.classList.toggle("dark", newDark);
          return { darkMode: newDark };
        }),

      // Search
      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),

      // Notifications
      notifications: [
        { id: "n1", text: "Your study streak is 12 days! 🔥", time: "2m ago", read: false },
        { id: "n2", text: "New achievement unlocked: Focus Master", time: "1h ago", read: false },
        { id: "n3", text: "C-Programming needs revision", time: "3h ago", read: true },
      ],
      addNotification: (text) =>
        set((s) => ({
          notifications: [
            { id: `n${Date.now()}`, text, time: "Just now", read: false },
            ...s.notifications,
          ],
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      // Leaderboard
      leaderboard: DUMMY_LEADERBOARD,

      // Computed
      totalStudyHours: () => {
        const s = get();
        return Math.round((s.sessions.reduce((sum, sess) => sum + sess.duration, 0) / 3600) * 10) / 10;
      },
      weeklyStudyData: () => {
        const s = get();
        const days: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          days[dayNames[d.getDay()]] = 0;
        }
        s.sessions.forEach((sess) => {
          const d = new Date(sess.date);
          const dayName = dayNames[d.getDay()];
          if (dayName in days) {
            days[dayName] += sess.duration / 3600;
          }
        });
        return Object.entries(days).map(([day, hours]) => ({
          day,
          hours: Math.round(hours * 10) / 10,
        }));
      },
      focusScoreTrend: () => {
        const s = get();
        const days: Record<string, number[]> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          days[dayNames[d.getDay()]] = [];
        }
        s.sessions.forEach((sess) => {
          const d = new Date(sess.date);
          const dayName = dayNames[d.getDay()];
          if (dayName in days) {
            days[dayName].push(sess.focusScore);
          }
        });
        return Object.entries(days).map(([day, scores]) => ({
          day,
          score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        }));
      },
      subjectBreakdown: () => {
        const s = get();
        const colors: Record<string, string> = {
          IPR: "hsl(252, 72%, 58%)",
          "HTML & CSS": "hsl(210, 70%, 55%)",
          "C-Programming": "hsl(152, 58%, 42%)",
        };
        const map: Record<string, number> = {};
        s.sessions.forEach((sess) => {
          map[sess.subject] = (map[sess.subject] || 0) + sess.duration / 3600;
        });
        return Object.entries(map).map(([subject, hours]) => ({
          subject,
          hours: Math.round(hours * 10) / 10,
          color: colors[subject] || "hsl(var(--primary))",
        }));
      },
    }),
    {
      name: "studyflow-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        sessions: state.sessions,
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        longestStreak: state.longestStreak,
        lastStudyDate: state.lastStudyDate,
        achievements: state.achievements,
        subjects: state.subjects,
        darkMode: state.darkMode,
        notifications: state.notifications,
      }),
    }
  )
);
