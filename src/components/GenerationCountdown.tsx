import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2 } from "lucide-react";

const TIPS = [
  "Preparing intelligent questions for you...",
  "Analyzing difficulty levels...",
  "Crafting unique problems...",
  "Building assessment structure...",
  "Generating explanations...",
  "Finalizing your test...",
];

const GenerationCountdown = () => {
  const [countdown, setCountdown] = useState(10);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 2000);
    return () => clearInterval(tipTimer);
  }, []);

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card className="border-primary/20">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div
              className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center"
              animate={{ borderColor: countdown <= 3 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.2)" }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="text-3xl font-bold text-primary"
                >
                  {countdown > 0 ? countdown : <Loader2 className="h-8 w-8 animate-spin" />}
                </motion.span>
              </AnimatePresence>
            </motion.div>
            <motion.div
              className="absolute -top-1 -right-1 bg-primary rounded-full p-1.5"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="h-4 w-4 text-primary-foreground" />
            </motion.div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">Generating Questions</h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-muted-foreground"
              >
                {TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: countdown > 0 ? `${(10 - countdown) * 10}%` : "95%" }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerationCountdown;
