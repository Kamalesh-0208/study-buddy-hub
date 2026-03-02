import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Zap, Volume2, ShieldCheck, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/store/useStudyStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const SOUNDS = ["Rain", "White Noise", "Library", "None"];

const SmartFocus = () => {
  const { studyDuration, breakDuration, addSession, addXP, checkStreak, checkAchievements, addNotification, sessions } = useStudyStore();
  const [timeLeft, setTimeLeft] = useState(studyDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [activeSound, setActiveSound] = useState("Rain");
  const [blockerOn, setBlockerOn] = useState(true);
  const [showComplete, setShowComplete] = useState(false);

  // AI recommended time based on sessions
  const avgFocusScore = sessions.length > 0
    ? Math.round(sessions.slice(-5).reduce((a, s) => a + s.focusScore, 0) / Math.min(sessions.length, 5))
    : 80;
  const hour = new Date().getHours();
  const isPeakHour = hour >= 18 && hour <= 20;
  const recommendedMin = avgFocusScore > 85 ? 45 : avgFocusScore > 70 ? 30 : 25;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          if (!isBreak) {
            // Session complete
            const focusScore = Math.min(100, Math.floor(Math.random() * 20) + 75);
            addSession({
              subject: "General",
              duration: studyDuration,
              date: new Date().toISOString(),
              focusScore,
            });
            addXP(50);
            checkStreak();
            checkAchievements();
            addNotification(`Focus session complete! +50 XP earned 🎉`);
            setShowComplete(true);
          }
          setIsBreak((b) => !b);
          return isBreak ? studyDuration : breakDuration;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isBreak, studyDuration, breakDuration, addSession, addXP, checkStreak, checkAchievements, addNotification]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(studyDuration);
  }, [studyDuration]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const total = isBreak ? breakDuration : studyDuration;
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
              <TargetIcon className="h-4 w-4 text-primary" />
            </div>
            Smart Focus
          </h3>
          <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary">
              AI: {recommendedMin} min {isPeakHour ? "🔥 Peak" : ""}
            </span>
          </div>
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
                stroke="url(#focusGradient)" strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
            <Button size="sm" onClick={() => setIsRunning(!isRunning)}
              className="rounded-xl h-9 px-5 text-xs gradient-bg text-primary-foreground border-0 shadow-glow hover:opacity-90">
              {isRunning ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
              {isRunning ? "Pause" : "Start Focus"}
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {SOUNDS.map((s) => (
                <button key={s} onClick={() => setActiveSound(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    activeSound === s ? "bg-primary/10 text-primary" : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="font-medium">Distraction Blocker</span>
            </div>
            <button onClick={() => setBlockerOn(!blockerOn)}
              className={`relative h-6 w-10 rounded-full transition-colors ${blockerOn ? "gradient-bg" : "bg-secondary"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${blockerOn ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </div>

          <div className="rounded-xl bg-secondary/40 p-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                Focus Quality: {avgFocusScore > 85 ? "Excellent" : avgFocusScore > 70 ? "High" : "Moderate"}
              </span>
              {isPeakHour ? " — Peak focus window is active" : " — Build momentum with short sessions"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Completion Modal */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-study-success" />
              Session Complete! 🎉
            </DialogTitle>
            <DialogDescription>
              Great focus session! You earned <span className="font-bold text-primary">+50 XP</span>.
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

const TargetIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

export default SmartFocus;
