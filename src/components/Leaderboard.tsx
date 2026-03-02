import { useStudyStore } from "@/store/useStudyStore";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Clock, Flame, Zap, Medal } from "lucide-react";

const rankColors = ["gradient-bg text-primary-foreground", "bg-study-warning/20 text-study-warning", "bg-accent/20 text-accent"];

const Leaderboard = () => {
  const { leaderboard, xp, streak } = useStudyStore();

  const sorted = [...leaderboard].sort((a, b) => b.xp - a.xp);
  const yourRank = sorted.findIndex((u) => u.id === "you") + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Leaderboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You're ranked <span className="font-bold text-primary">#{yourRank}</span> this week
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4 py-4">
        {[sorted[1], sorted[0], sorted[2]].filter(Boolean).map((user, idx) => {
          const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
          const height = idx === 1 ? "h-28" : "h-20";
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold ${rankColors[rank - 1] || "bg-secondary text-foreground"}`}>
                {user.avatar}
              </div>
              <p className="text-xs font-semibold text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">{user.xp.toLocaleString()} XP</p>
              <div className={`${height} w-20 rounded-t-xl ${rank === 1 ? "gradient-bg" : "bg-secondary/40"} flex items-end justify-center pb-2`}>
                <span className={`text-lg font-extrabold ${rank === 1 ? "text-primary-foreground" : "text-muted-foreground"}`}>#{rank}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full Rankings */}
      <div className="rounded-2xl glass-strong p-4">
        <div className="space-y-2">
          {sorted.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 rounded-xl p-3 transition-all ${
                user.id === "you" ? "bg-primary/5 border border-primary/20" : "hover:bg-secondary/40"
              }`}
            >
              <span className="text-sm font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                i < 3 ? rankColors[i] : "bg-secondary text-foreground"
              }`}>
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{user.name} {user.id === "you" && "(You)"}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{user.studyHours}h</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Flame className="h-2.5 w-2.5" />{user.streak}d</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold gradient-text">{user.xp.toLocaleString()} XP</p>
                <p className="text-[10px] text-muted-foreground">Score: {user.focusScore}%</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Leaderboard;
