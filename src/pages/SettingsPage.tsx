import { useStudyStore } from "@/store/useStudyStore";
import { motion } from "framer-motion";
import { Moon, Sun, Bell, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SettingsPage = () => {
  const { darkMode, toggleDarkMode, streak, xp, level, sessions } = useStudyStore();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Customize your StudyFlow experience</p>
      </div>

      <div className="rounded-2xl glass-strong p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {darkMode ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            <span className="text-sm text-foreground">Dark Mode</span>
          </div>
          <button onClick={toggleDarkMode}
            className={`relative h-6 w-10 rounded-full transition-colors ${darkMode ? "gradient-bg" : "bg-secondary"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${darkMode ? "left-[18px]" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl glass-strong p-6 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Account Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Level</p>
            <p className="text-lg font-bold text-foreground">{level}</p>
          </div>
          <div className="rounded-xl bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Total XP</p>
            <p className="text-lg font-bold gradient-text">{xp.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <p className="text-lg font-bold text-foreground">{streak} days 🔥</p>
          </div>
          <div className="rounded-xl bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Total Sessions</p>
            <p className="text-lg font-bold text-foreground">{sessions.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass-strong p-6 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Keyboard Shortcuts</h3>
        <div className="space-y-2">
          {[
            { keys: "⌘K", desc: "Open search" },
            { keys: "⌘D", desc: "Toggle dark mode" },
          ].map((s) => (
            <div key={s.keys} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-mono text-foreground">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
