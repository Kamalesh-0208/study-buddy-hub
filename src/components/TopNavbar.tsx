import { Search, Bell, Moon, Sun, Flame, ChevronDown, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/store/useStudyStore";
import { motion, AnimatePresence } from "framer-motion";

const TopNavbar = () => {
  const { darkMode, toggleDarkMode, streak, searchQuery, setSearchQuery, tasks, subjects, notifications, markNotificationRead } = useStudyStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search results
  const searchResults = debouncedQuery.length > 1 ? [
    ...tasks.filter((t) => t.title.toLowerCase().includes(debouncedQuery.toLowerCase())).map((t) => ({ type: "Task", label: t.title })),
    ...subjects.filter((s) => s.title.toLowerCase().includes(debouncedQuery.toLowerCase())).map((s) => ({ type: "Subject", label: s.title })),
  ] : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Keyboard shortcut
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

  // Initialize dark mode from store
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 glass-strong border-b border-border/30">
      {/* Search */}
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

        {/* Search Dropdown */}
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

      {/* Right section */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground">
          <Flame className="h-4 w-4 text-study-warning" />
          <span>{streak}-day streak</span>
        </div>

        <Button size="icon" variant="ghost" onClick={toggleDarkMode}
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button size="icon" variant="ghost" onClick={() => setShowNotifs(!showNotifs)}
            className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full gradient-bg" />}
          </Button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-72 rounded-xl glass-strong border border-border/40 p-3 shadow-lg z-50"
              >
                <p className="text-xs font-bold text-foreground mb-2">Notifications</p>
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <div key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        n.read ? "text-muted-foreground" : "text-foreground bg-primary/5"
                      } hover:bg-secondary/50`}
                    >
                      <p>{n.text}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="flex items-center gap-2 rounded-xl hover:bg-secondary/60 px-2 py-1.5 transition-all">
          <div className="h-8 w-8 rounded-xl gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">S</div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
