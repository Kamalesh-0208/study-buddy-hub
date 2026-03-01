import { Search, Bell, Moon, Sun, Flame, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const TopNavbar = () => {
  const [dark, setDark] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 glass-strong border-b border-border/30">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 w-full transition-all duration-300 ${
            searchFocused
              ? "bg-card border border-primary/30 shadow-glow"
              : "bg-secondary/60 border border-transparent"
          }`}
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search anything… ⌘K"
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Streak */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground">
          <Flame className="h-4 w-4 text-study-warning" />
          <span>12-day streak</span>
        </div>

        {/* Dark toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleDark}
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button
          size="icon"
          variant="ghost"
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full gradient-bg" />
        </Button>

        {/* Profile */}
        <button className="flex items-center gap-2 rounded-xl hover:bg-secondary/60 px-2 py-1.5 transition-all">
          <div className="h-8 w-8 rounded-xl gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
            S
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
