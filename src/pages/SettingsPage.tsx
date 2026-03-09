import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { motion } from "framer-motion";
import { Moon, Sun, User, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SettingsPage = () => {
  const { profile, user, refreshProfile } = useAuth();
  const { sessions } = useSessions();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  const saveProfile = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); await refreshProfile(); }
    setSaving(false);
  };

  const resetPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent!");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Customize your StudyFlow Pro Max experience</p>
      </div>

      <div className="rounded-2xl glass-strong p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Profile
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={user?.email ?? ""} disabled className="rounded-xl mt-1 opacity-60" />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveProfile} disabled={saving} className="rounded-xl gradient-bg text-primary-foreground border-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save
            </Button>
            <Button onClick={resetPassword} variant="outline" className="rounded-xl">Reset Password</Button>
          </div>
        </div>
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
            <p className="text-lg font-bold text-foreground">{profile?.level ?? 1}</p>
          </div>
          <div className="rounded-xl bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Total XP</p>
            <p className="text-lg font-bold gradient-text">{(profile?.total_xp ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <p className="text-lg font-bold text-foreground">{profile?.current_streak ?? 0} days 🔥</p>
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
