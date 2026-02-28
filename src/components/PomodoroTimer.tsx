import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

const STUDY_TIME = 25 * 60;
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
  const progress = isBreak
    ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100
    : ((STUDY_TIME - timeLeft) / STUDY_TIME) * 100;

  return (
    <div className="flex flex-col items-center gap-5 rounded-xl bg-card p-6 card-shadow animate-fade-in">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {isBreak ? <Coffee className="h-4 w-4" /> : null}
        {isBreak ? "Break Time" : "Focus Time"}
      </div>

      <div className="relative flex items-center justify-center">
        <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="6" className="stroke-muted" />
          <circle
            cx="60" cy="60" r="52" fill="none" strokeWidth="6"
            className={isBreak ? "stroke-accent" : "stroke-primary"}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <span className="absolute text-4xl font-bold tracking-tight text-foreground">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      <div className="flex gap-3">
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" /> Reset
        </Button>
        <Button size="sm" onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
          {isRunning ? "Pause" : "Start"}
        </Button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
