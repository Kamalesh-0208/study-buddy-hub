import { Trophy, Star, Flame, Award, Zap, Target, BookOpen } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ElementType> = {
  Flame, Target, BookOpen, Star, Zap, Award,
};

const Gamification = () => {
  const { xp, level, streak, longestStreak, achievements } = useStudyStore();
  const nextLevelXP = level * 250;
  const xpInLevel = xp - (level - 1) * 250;
  const xpProgress = Math.min(100, (xpInLevel / 250) * 100);

  const levelTitle = level >= 20 ? "Study Legend" : level >= 15 ? "Knowledge Seeker" : level >= 10 ? "Dedicated Scholar" : "Rising Star";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-2xl glass-strong p-6"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
        <div className="icon-bg h-8 w-8"><Trophy className="h-4 w-4 text-primary" /></div>
        Achievements
      </h3>

      {/* XP & Level */}
      <div className="rounded-xl bg-secondary/30 p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="h-9 w-9 rounded-xl gradient-bg flex items-center justify-center shadow-glow"
            >
              <span className="text-sm font-extrabold text-primary-foreground">{level}</span>
            </motion.div>
            <div>
              <p className="text-xs font-bold text-foreground">Level {level}</p>
              <p className="text-[10px] text-muted-foreground">{levelTitle}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold gradient-text">{xp.toLocaleString()} XP</p>
            <p className="text-[10px] text-muted-foreground">{Math.max(0, 250 - xpInLevel)} to next level</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-bg"
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-3 rounded-xl bg-secondary/20 p-3 mb-5">
        <Flame className="h-5 w-5 text-study-warning" />
        <div>
          <p className="text-xs font-bold text-foreground">{streak}-Day Study Streak 🔥</p>
          <p className="text-[10px] text-muted-foreground">Your longest: {longestStreak} days</p>
        </div>
      </div>

      {/* Badges */}
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Badges</p>
      <div className="grid grid-cols-3 gap-2">
        {achievements.map((badge, i) => {
          const Icon = iconMap[badge.icon] || Star;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={badge.unlocked ? { scale: 1.05, y: -2 } : {}}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all ${
                badge.unlocked ? "bg-secondary/30" : "bg-secondary/10 opacity-40"
              }`}
            >
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: badge.unlocked ? `linear-gradient(135deg, hsl(${badge.color} / 0.15), hsl(${badge.color} / 0.05))` : "hsl(var(--secondary))" }}
              >
                <Icon className="h-4 w-4" style={{ color: badge.unlocked ? `hsl(${badge.color})` : "hsl(var(--muted-foreground))" }} />
              </div>
              <span className="text-[10px] font-medium text-center text-foreground leading-tight">{badge.label}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Gamification;
