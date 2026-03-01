import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const STUDY_TIME = 30 * 60;
const BREAK_TIME = 5 * 60;

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(STUDY_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsBreak((b) => !b);
          setIsRunning(false);
          return isBreak ? STUDY_TIME : BREAK_TIME;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isBreak]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(STUDY_TIME);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const total = isBreak ? BREAK_TIME : STUDY_TIME;
  const progress = ((total - timeLeft) / total) * 100;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl card-glass-static p-8">
      {/* Mode badge */}
      <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5">
        {isBreak ? (
          <Coffee className="h-3.5 w-3.5 text-accent" />
        ) : (
          <Zap className="h-3.5 w-3.5 text-primary" />
        )}
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {isBreak ? "Break Time" : "Focus Session"}
        </span>
      </div>

      {/* Timer ring */}
      <div className="relative flex items-center justify-center">
        {/* Glow behind ring */}
        {isRunning && (
          <div
            className="absolute inset-0 rounded-full animate-pulse-glow"
            style={{
              background: `radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)`,
            }}
          />
        )}
        <svg className="h-48 w-48 -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            strokeWidth="5"
            className="stroke-secondary"
          />
          {/* Progress */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            strokeWidth="5"
            stroke="url(#timerGradient)"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(250, 70%, 56%)" />
              <stop offset="100%" stopColor="hsl(280, 65%, 58%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-extrabold tracking-tight text-foreground tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs font-medium text-muted-foreground">
            {isBreak ? "Relax & recharge" : "Stay focused"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={reset}
          className="rounded-xl px-5 h-10 border-border/60 hover:bg-secondary"
        >
          <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
        </Button>
        <Button
          size="sm"
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-xl px-6 h-10 gradient-bg text-primary-foreground border-0 shadow-glow hover:opacity-90 transition-opacity"
        >
          {isRunning ? (
            <Pause className="mr-1.5 h-4 w-4" />
          ) : (
            <Play className="mr-1.5 h-4 w-4" />
          )}
          {isRunning ? "Pause" : "Start"}
        </Button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
