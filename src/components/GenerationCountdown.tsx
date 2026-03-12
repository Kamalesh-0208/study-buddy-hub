import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, CheckCircle2 } from "lucide-react";

const TIPS = [
  "Preparing intelligent questions for you...",
  "Analyzing difficulty levels...",
  "Crafting unique problems...",
  "Building assessment structure...",
  "Generating step-by-step explanations...",
  "Validating answer correctness...",
  "Checking for duplicate questions...",
  "Finalizing your test...",
];

interface GenerationCountdownProps {
  /** Estimated generation time in seconds */
  estimatedSeconds?: number;
  /** Set to true when generation completes — timer stops immediately */
  isComplete?: boolean;
  /** Label for what's being generated */
  label?: string;
}

const GenerationCountdown = ({
  estimatedSeconds = 120,
  isComplete = false,
  label = "Questions",
}: GenerationCountdownProps) => {
  const [remaining, setRemaining] = useState(estimatedSeconds);
  const [tipIndex, setTipIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tipRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when estimatedSeconds changes (new generation)
  useEffect(() => {
    setRemaining(estimatedSeconds);
    setFinished(false);
  }, [estimatedSeconds]);

  // Main countdown — ticks every second, stops at 0 or on completion
  useEffect(() => {
    if (finished) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [finished]);

  // Stop immediately when backend signals completion
  useEffect(() => {
    if (isComplete && !finished) {
      setFinished(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tipRef.current) clearInterval(tipRef.current);
    }
  }, [isComplete, finished]);

  // Rotate tips every 3 seconds
  useEffect(() => {
    if (finished) return;

    tipRef.current = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3000);

    return () => {
      if (tipRef.current) clearInterval(tipRef.current);
    };
  }, [finished]);

  const elapsed = estimatedSeconds - remaining;
  const progressPercent = estimatedSeconds > 0
    ? Math.min((elapsed / estimatedSeconds) * 100, remaining === 0 ? 95 : 100)
    : 0;

  const circumference = 2 * Math.PI * 54;
  const strokeOffset = circumference * (1 - (finished ? 1 : Math.min(progressPercent / 100, 0.95)));

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
          {/* Circular countdown */}
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
              />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {finished ? (
                  <motion.div
                    key="done"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </motion.div>
                ) : remaining > 0 ? (
                  <motion.span
                    key={remaining}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-3xl font-bold text-primary tabular-nums"
                  >
                    {remaining}
                  </motion.span>
                ) : (
                  <motion.div
                    key="spinner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Orbiting brain */}
            {!finished && (
              <motion.div
                className="absolute -top-1 -right-1 bg-primary rounded-full p-1.5 shadow-md"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="h-4 w-4 text-primary-foreground" />
              </motion.div>
            )}
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">
              {finished ? "Ready!" : `Generating ${label}`}
            </h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={finished ? "complete" : tipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-muted-foreground"
              >
                {finished
                  ? "Your assessment is ready. Loading now..."
                  : TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-1.5">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{
                  width: finished ? "100%" : `${Math.min(progressPercent, 95)}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center tabular-nums">
              {finished
                ? "Complete!"
                : remaining > 0
                ? `Estimated ~${remaining}s remaining`
                : "Almost there..."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerationCountdown;
