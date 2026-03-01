import { GraduationCap, Sparkles } from "lucide-react";
import PomodoroTimer from "@/components/PomodoroTimer";
import StudyMaterials from "@/components/StudyMaterials";
import StatsGrid from "@/components/StatsGrid";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 card-glass-static border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="gradient-bg rounded-2xl p-2.5 shadow-glow">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold gradient-text tracking-tight">StudyFlow</h1>
              <p className="text-[11px] text-muted-foreground font-medium">Your personal study hub</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary/80 px-4 py-2 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Keep learning!</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
          {/* Left Column — Timer */}
          <div className="flex flex-col gap-8">
            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                ⏱ Pomodoro Timer
              </h2>
              <PomodoroTimer />
            </section>
          </div>

          {/* Right Column — Study Materials */}
          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              📚 PS Study Materials
            </h2>
            <StudyMaterials />
          </section>
        </div>

        {/* Bottom — Stats */}
        <section className="mt-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            📊 Your Stats
          </h2>
          <StatsGrid />
        </section>
      </main>
    </div>
  );
};

export default Index;
