import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Zap, Volume2, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { useSubjects } from "@/hooks/useSubjects";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 * 60 },
  { label: "25 min", value: 25 * 60 },
  { label: "30 min", value: 30 * 60 },
  { label: "50 min", value: 50 * 60 },
  { label: "90 min", value: 90 * 60 },
];

const BREAK_TIME = 5 * 60;

const SmartFocus = () => {
  const { user } = useAuth();
  const { addSession, sessions } = useSessions();
  const { subjects } = useSubjects();

  const [studyDuration, setStudyDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  const avgFocusScore = sessions.length > 0
    ? Math.round(sessions.slice(0, 5).reduce((a, s) => a + (s.focus_score ?? 80), 0) / Math.min(sessions.length, 5))
    : 80;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          if (!isBreak) {
            const focusScore = Math.min(100, Math.floor(Math.random() * 20) + 75);
            const xpEarned = Math.round(studyDuration / 60);
            const endTime = new Date().toISOString();

            addSession.mutate({
              subject_id: selectedSubject,
              duration_seconds: studyDuration,
              start_time: startTime!,
              end_time: endTime,
              focus_score: focusScore,
              xp_earned: xpEarned,
            });
            setShowComplete(true);
          }
          setIsBreak((b) => !b);
          return isBreak ? studyDuration : BREAK_TIME;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isBreak, studyDuration, startTime, selectedSubject]);

  const handleStart = () => {
    if (!isRunning) {
      setStartTime(new Date().toISOString());
    }
    setIsRunning(!isRunning);
  };

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(studyDuration);
    setStartTime(null);
  }, [studyDuration]);

  const handleDurationChange = (val: number) => {
    if (isRunning) return;
    setStudyDuration(val);
    setTimeLeft(val);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const total = isBreak ? BREAK_TIME : studyDuration;
  const progress = ((total - timeLeft) / total) * 100;
  const circumference = 2 * Math.PI * 52;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl glass-strong p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="icon-bg h-8 w-8">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            Smart Focus
          </h3>
          <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary">
              Focus: {avgFocusScore > 85 ? "Excellent" : avgFocusScore > 70 ? "Good" : "Building"}
            </span>
          </div>
        </div>

        {/* Subject selector */}
        <div className="mb-4">
          <select
            value={selectedSubject ?? ""}
            onChange={(e) => setSelectedSubject(e.target.value || null)}
            disabled={isRunning}
            className="w-full rounded-xl bg-secondary/50 border border-border/40 px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="">Select subject (optional)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Duration selector */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => handleDurationChange(d.value)}
              disabled={isRunning}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                studyDuration === d.value
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center">
            {isRunning && (
              <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-[-8px] rounded-full"
                style={{ background: `radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)` }}
              />
            )}
            <svg className="h-44 w-44 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" strokeWidth="4" className="stroke-secondary" />
              <motion.circle
                cx="60" cy="60" r="52" fill="none" strokeWidth="4.5"
                stroke="url(#focusGradient2)" strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="focusGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(252, 72%, 58%)" />
                  <stop offset="100%" stopColor="hsl(280, 68%, 56%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1">
                {isBreak ? <Coffee className="h-3.5 w-3.5 text-accent" /> : <Zap className="h-3.5 w-3.5 text-primary" />}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isBreak ? "Break" : "Focus"}
                </span>
              </div>
              <span className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={reset} className="rounded-xl h-9 px-4 text-xs border-border/50">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
            </Button>
            <Button size="sm" onClick={handleStart}
              className="rounded-xl h-9 px-5 text-xs gradient-bg text-primary-foreground border-0 shadow-glow hover:opacity-90">
              {isRunning ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
              {isRunning ? "Pause" : "Start Focus"}
            </Button>
          </div>
        </div>
      </motion.div>

      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-study-success" />
              Session Complete! 🎉
            </DialogTitle>
            <DialogDescription>
              Great focus session! You earned <span className="font-bold text-primary">+{Math.round(studyDuration / 60)} XP</span>.
              Take a short break before your next session.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowComplete(false)} className="gradient-bg text-primary-foreground border-0 rounded-xl">
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SmartFocus;
