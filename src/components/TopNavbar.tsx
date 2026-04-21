import { Search, Bell, Moon, Sun, Flame, ChevronDown, X, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useSubjects } from "@/hooks/useSubjects";
import { motion, AnimatePresence } from "framer-motion";
import FeatureRequestDialog from "@/components/FeatureRequestDialog";

interface TopNavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const TopNavbar = ({ darkMode, toggleDarkMode }: TopNavbarProps) => {
  const { profile, signOut } = useAuth();
  const { tasks } = useTasks();
  const { subjects } = useSubjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = debouncedQuery.length > 1 ? [
    ...tasks.filter((t) => t.title.toLowerCase().includes(debouncedQuery.toLowerCase())).map((t) => ({ type: "Task", label: t.title })),
    ...subjects.filter((s) => s.name.toLowerCase().includes(debouncedQuery.toLowerCase())).map((s) => ({ type: "Subject", label: s.name })),
  ] : [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        (searchRef.current?.querySelector("input") as HTMLInputElement)?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const initials = (profile?.display_name ?? "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 glass-strong border-b border-border/30">
  
  <div className="flex items-center gap-4 flex-1">
    
    {/* LOGO */}
    <img src="/SkillMav%20(2).png" alt="logo" className="h-8 w-auto" />

    {/* SEARCH BAR */}
    <div className="flex items-center gap-4 flex-1 max-w-xl relative" ref={searchRef}>
        <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 w-full transition-all duration-300 ${
          searchFocused ? "bg-card border border-primary/30 shadow-glow" : "bg-secondary/60 border border-transparent"
        }`}>
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything… ⌘K"
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
          )}
        </div>

        <AnimatePresence>
          {searchFocused && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl glass-strong border border-border/40 p-2 shadow-lg z-50"
            >
              {searchResults.slice(0, 6).map((r, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{r.type}</span>
                  <span className="text-sm text-foreground">{r.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  </div>
      <div className="flex items-center gap-3">
        <FeatureRequestDialog />
        <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground">
          <Flame className="h-4 w-4 text-study-warning" />
          <span>{profile?.current_streak ?? 0}-day streak</span>
        </div>

        <Button size="icon" variant="ghost" onClick={toggleDarkMode}
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-xl hover:bg-secondary/60 px-2 py-1.5 transition-all"
          >
            <div className="h-8 w-8 rounded-xl gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl glass-strong border border-border/40 p-3 shadow-lg z-50"
              >
                <p className="text-sm font-semibold text-foreground">{profile?.display_name}</p>
                <p className="text-xs text-muted-foreground mb-3">Level {profile?.level ?? 1} • {profile?.total_xp ?? 0} XP</p>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
