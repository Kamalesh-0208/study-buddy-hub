import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import skillmavLogo from "@/assets/skillmav-logo.png";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email for the reset link!");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
      else { toast.success("Welcome back!"); navigate("/"); }
    } else {
      if (!displayName.trim()) { toast.error("Please enter your name"); setLoading(false); return; }
      const { error } = await signUp(email, password, displayName.trim());
      if (error) toast.error(error.message);
      else toast.success("Account created! Check your email to verify.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-bg)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src={skillmavLogo}
            alt="SkillMav logo"
            className="h-12 w-12 rounded-xl object-cover shadow-glow"
          />
          <span className="text-4xl font-extrabold gradient-text tracking-tight">SkillMav</span>
        </div>

        <div className="glass-strong rounded-2xl p-8">
          <h2 className="text-xl font-bold text-foreground text-center mb-1">
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {mode === "login" ? "Sign in to continue studying" : mode === "signup" ? "Start your productivity journey" : "Enter your email to receive a reset link"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe" className="pl-10 rounded-xl bg-secondary/50 border-border/40 h-11" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className="pl-10 rounded-xl bg-secondary/50 border-border/40 h-11" required />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" className="pl-10 rounded-xl bg-secondary/50 border-border/40 h-11" required minLength={6} />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl gradient-bg text-primary-foreground border-0 shadow-glow hover:opacity-90 font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {mode === "login" && (
              <button onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Forgot your password?
              </button>
            )}
            <div>
              <button onClick={() => setMode(mode === "signup" ? "login" : mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {mode === "login" ? "Don't have an account? " : mode === "signup" ? "Already have an account? " : "Back to "}
                <span className="font-semibold text-primary">{mode === "login" ? "Sign Up" : "Sign In"}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
