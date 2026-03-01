import { Trophy, Star, Flame, Award, Zap, Target, BookOpen } from "lucide-react";

const xp = 2450;
const level = 12;
const nextLevelXP = 3000;
const xpProgress = (xp / nextLevelXP) * 100;

const badges = [
  { icon: Flame, label: "10-Day Streak", unlocked: true, color: "38 92% 50%" },
  { icon: Target, label: "Focus Master", unlocked: true, color: "252 72% 58%" },
  { icon: BookOpen, label: "100 Cards", unlocked: true, color: "152 58% 42%" },
  { icon: Star, label: "Night Owl", unlocked: false, color: "280 68% 56%" },
  { icon: Zap, label: "Speed Reader", unlocked: false, color: "210 70% 55%" },
  { icon: Award, label: "Perfect Week", unlocked: false, color: "0 72% 51%" },
];

const Gamification = () => (
  <div className="rounded-2xl glass-strong p-6 animate-fade-in">
    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
      <div className="icon-bg h-8 w-8">
        <Trophy className="h-4 w-4 text-primary" />
      </div>
      Achievements
    </h3>

    {/* XP & Level */}
    <div className="rounded-xl bg-secondary/30 p-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-bg flex items-center justify-center shadow-glow">
            <span className="text-sm font-extrabold text-primary-foreground">{level}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Level {level}</p>
            <p className="text-[10px] text-muted-foreground">Dedicated Scholar</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-extrabold gradient-text">{xp.toLocaleString()} XP</p>
          <p className="text-[10px] text-muted-foreground">{nextLevelXP - xp} to next level</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full gradient-bg transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
      </div>
    </div>

    {/* Streak */}
    <div className="flex items-center gap-3 rounded-xl bg-secondary/20 p-3 mb-5">
      <Flame className="h-5 w-5 text-study-warning" />
      <div>
        <p className="text-xs font-bold text-foreground">12-Day Study Streak 🔥</p>
        <p className="text-[10px] text-muted-foreground">Your longest: 18 days</p>
      </div>
    </div>

    {/* Badges */}
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Badges</p>
    <div className="grid grid-cols-3 gap-2">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all ${
            badge.unlocked ? "bg-secondary/30" : "bg-secondary/10 opacity-40"
          }`}
        >
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{
              background: badge.unlocked
                ? `linear-gradient(135deg, hsl(${badge.color} / 0.15), hsl(${badge.color} / 0.05))`
                : "hsl(var(--secondary))",
            }}
          >
            <badge.icon className="h-4 w-4" style={{ color: badge.unlocked ? `hsl(${badge.color})` : "hsl(var(--muted-foreground))" }} />
          </div>
          <span className="text-[10px] font-medium text-center text-foreground leading-tight">{badge.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default Gamification;
