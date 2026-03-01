import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Zap, Volume2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const STUDY_TIME = 30 * 60;
const BREAK_TIME = 5 * 60;

const sounds = ["Rain", "White Noise", "Library", "None"];

const SmartFocus = () => {
  const [timeLeft, setTimeLeft] = useState(STUDY_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [activeSound, setActiveSound] = useState("Rain");
  const [blockerOn, setBlockerOn] = useState(true);

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
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="rounded-2xl glass-strong p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="icon-bg h-8 w-8">
            <Target className="h-4 w-4 text-primary" />
          </div>
          Smart Focus
        </h3>
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold text-primary">AI Recommended: 30 min</span>
        </div>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          {isRunning && (
            <div className="absolute inset-[-8px] rounded-full animate-pulse-glow opacity-60"
              style={{ background: `radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)` }}
            />
          )}
          <svg className="h-44 w-44 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" strokeWidth="4" className="stroke-secondary" />
            <circle
              cx="60" cy="60" r="52" fill="none" strokeWidth="4.5"
              stroke="url(#focusGradient)" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
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
          <Button size="sm" variant="outline" onClick={reset}
            className="rounded-xl h-9 px-4 text-xs border-border/50">
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
        {/* Sound selector */}
        <div className="flex items-center gap-2">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="flex gap-1.5 flex-wrap">
            {sounds.map((s) => (
              <button key={s} onClick={() => setActiveSound(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeSound === s
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Blocker toggle */}
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

        {/* Focus prediction */}
        <div className="rounded-xl bg-secondary/40 p-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Focus Quality: High</span> — Your peak focus window is active
          </p>
        </div>
      </div>
    </div>
  );
};

// Required icon imported inline
const Target = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

export default SmartFocus;
