import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Flame, Star, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";
const iconMap: Record<string, any> = { zap: Zap, flame: Flame, trophy: Trophy, crown: Crown, book: Star, target: Trophy, clock: Star, medal: Trophy, "check-circle": Star };
const Gamification = () => {
  const { user, profile } = useAuth();
  const { data: achievements } = useQuery({ queryKey: ["achievements"], queryFn: async () => { const { data } = await supabase.from("achievements").select("*"); return data ?? []; } });
  const { data: userAchievements } = useQuery({ queryKey: ["user_achievements", user?.id], queryFn: async () => { const { data } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", user!.id); return data?.map((d) => d.achievement_id) ?? []; }, enabled: !!user });
  const xp = profile?.total_xp ?? 0; const level = profile?.level ?? 1; const streak = profile?.current_streak ?? 0; const longestStreak = profile?.longest_streak ?? 0;
  const xpProgress = ((xp % 250) / 250) * 100;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="rounded-2xl glass-strong p-6">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5"><div className="icon-bg h-8 w-8"><Trophy className="h-4 w-4 text-primary" /></div>Gamification</h3>
      <div className="rounded-xl bg-secondary/40 p-4 mb-4"><div className="flex justify-between items-center mb-2"><div><p className="text-xs text-muted-foreground">Level {level}</p><p className="text-2xl font-extrabold text-foreground">{xp.toLocaleString()} XP</p></div></div><div className="h-2 rounded-full bg-secondary overflow-hidden"><motion.div className="h-full rounded-full gradient-bg" animate={{ width: `${xpProgress}%` }} transition={{ duration: 0.7 }} /></div></div>
      <div className="flex gap-3 mb-4"><div className="flex-1 rounded-xl bg-secondary/40 p-3 text-center"><Flame className="h-5 w-5 text-study-warning mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{streak}</p><p className="text-[10px] text-muted-foreground">Current Streak</p></div><div className="flex-1 rounded-xl bg-secondary/40 p-3 text-center"><Crown className="h-5 w-5 text-primary mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{longestStreak}</p><p className="text-[10px] text-muted-foreground">Best Streak</p></div></div>
      <p className="text-xs font-semibold text-foreground mb-2">Achievements</p>
      <div className="grid grid-cols-3 gap-2">{(achievements ?? []).slice(0, 6).map((a) => { const unlocked = userAchievements?.includes(a.id); const Icon = iconMap[a.icon] ?? Star; return (<div key={a.id} className={`rounded-xl p-2 text-center transition-all ${unlocked ? "bg-primary/10" : "bg-secondary/30 opacity-50"}`} title={a.description}><Icon className={`h-5 w-5 mx-auto mb-1 ${unlocked ? "text-primary" : "text-muted-foreground"}`} /><p className="text-[9px] font-medium text-foreground truncate">{a.name}</p></div>); })}</div>
    </motion.div>
  );
};
export default Gamification;