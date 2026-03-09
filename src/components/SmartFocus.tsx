import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Zap, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { useSubjects } from "@/hooks/useSubjects";
import { useFocusActivity } from "@/hooks/useFocusActivity";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
  const { saveFocusActivity, recommendedSessionMinutes, avgFocusScore } = useFocusActivity();

  const [studyDuration, setStudyDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  // Distraction tracking state
  const tabSwitchCount = useRef(0);
  const pauseCount = useRef(0);
  const timeAwaySeconds = useRef(0);
  const idleTimeSeconds = useRef(0);
  const lastActivityTime = useRef(Date.now());
  const hiddenStartTime = useRef<number | null>(null);
  const distractionAlerts = useRef<string[]>([]);
  const [liveDistractions, setLiveDistractions] = useState(0);

  // Reset distraction counters
  const resetTracking = useCallback(() => {
    tabSwitchCount.current = 0;
    pauseCount.current = 0;
    timeAwaySeconds.current = 0;
    idleTimeSeconds.current = 0;
    lastActivityTime.current = Date.now();
    hiddenStartTime.current = null;
    distractionAlerts.current = [];
    setLiveDistractions(0);
  }, []);

  // Tab visibility tracking
  useEffect(() => {
    if (!isRunning || isBreak) return;

    const handleVisibility = () => {
      if (document.hidden) {
        hiddenStartTime.current = Date.now();
        tabSwitchCount.current += 1;
        setLiveDistractions(d => d + 1);

        if (tabSwitchCount.current === 3) {
          toast.warning("You've switched tabs 3 times. Stay focused! 🎯");
        }
        if (tabSwitchCount.current === 5) {
          toast.warning("5 tab switches detected. Your focus score is dropping.");
        }
      } else if (hiddenStartTime.current) {
        const away = Math.round((Date.now() - hiddenStartTime.current) / 1000);
        timeAwaySeconds.current += away;
        hiddenStartTime.current = null;

        if (away > 30) {
          toast.info(`You were away for ${away}s. Try to stay on this page during focus time.`);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isRunning, isBreak]);

  // Idle detection
  useEffect(() => {
    if (!isRunning || isBreak) return;

    const resetIdle = () => { lastActivityTime.current = Date.now(); };
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));

    const idleCheck = setInterval(() => {
      const idleMs = Date.now() - lastActivityTime.current;
      if (idleMs > 60000) {
        idleTimeSeconds.current += 1;
      }
    }, 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      clearInterval(idleCheck);
    };
  }, [isRunning, isBreak]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          if (!isBreak) {
            const distractionEvents = tabSwitchCount.current + pauseCount.current;
            const focusScore = Math.max(0, Math.min(100, 100 - distractionEvents * 5));
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

            saveFocusActivity.mutate({
              tab_switch_count: tabSwitchCount.current,
              idle_time_seconds: idleTimeSeconds.current,
              distraction_events: distractionEvents,
              focus_score: focusScore,
              pause_count: pauseCount.current,
              time_away_seconds: timeAwaySeconds.current,
            });

            setShowComplete(true);

            if (focusScore < 60) {
              toast.warning("High distraction session. Try shorter sessions next time.");
            }
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
      if (!startTime) {
        resetTracking();
        setStartTime(new Date().toISOString());
      } else {
        pauseCount.current += 1;
        setLiveDistractions(d => d + 1);
      }
    } else {
      pauseCount.current += 1;
    }
    setIsRunning(!isRunning);
  };

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(studyDuration);
    setStartTime(null);
    resetTracking();
  }, [studyDuration, resetTracking]);

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

  const liveFocusScore = Math.max(0, 100 - liveDistractions * 5);

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
          <div className="flex items-center gap-2">
            {isRunning && !isBreak && (
              <div className={`flex items-center gap-1 rounded-lg px-2 py-1 ${
                liveFocusScore >= 80 ? "bg-primary/10" : liveFocusScore >= 60 ? "bg-accent/10" : "bg-destructive/10"
              }`}>
                {liveFocusScore < 60 && <AlertTriangle className="h-3 w-3 text-destructive" />}
                <span className={`text-[10px] font-semibold ${
                  liveFocusScore >= 80 ? "text-primary" : liveFocusScore >= 60 ? "text-accent-foreground" : "text-destructive"
                }`}>
                  Focus: {liveFocusScore}%
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary">
                Rec: {recommendedSessionMinutes}m
              </span>
            </div>
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
              {isRunning && !isBreak && liveDistractions > 0 && (
                <span className="text-[9px] text-muted-foreground mt-1">
                  {liveDistractions} distraction{liveDistractions > 1 ? "s" : ""}
                </span>
              )}
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
            <DialogDescription className="space-y-2">
              <p>
                Great focus session! You earned <span className="font-bold text-primary">+{Math.round(studyDuration / 60)} XP</span>.
              </p>
              <div className="text-xs space-y-1 bg-secondary/30 rounded-lg p-3 mt-2">
                <p>📊 Tab switches: {tabSwitchCount.current}</p>
                <p>⏸️ Pauses: {pauseCount.current}</p>
                <p>🎯 Focus score: {Math.max(0, 100 - (tabSwitchCount.current + pauseCount.current) * 5)}%</p>
                {timeAwaySeconds.current > 0 && <p>⏱️ Time away: {timeAwaySeconds.current}s</p>}
              </div>
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
