import { BookOpen, GraduationCap } from "lucide-react";
import PomodoroTimer from "@/components/PomodoroTimer";
import StudyMaterials from "@/components/StudyMaterials";
import StatsGrid from "@/components/StatsGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2 shadow-lg shadow-primary/25">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">StudyFlow</h1>
              <p className="text-xs text-muted-foreground">Your personal study hub</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <BookOpen className="h-4 w-4" />
            <span>Keep learning!</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column — Timer + Stats */}
          <div className="flex flex-col gap-6">
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                ⏱ Pomodoro Timer
              </h2>
              <PomodoroTimer />
            </section>
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                📊 Your Stats
              </h2>
              <StatsGrid />
            </section>
          </div>

          {/* Center + Right — PS Study Materials */}
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
              📚 PS Study Materials
            </h2>
            <StudyMaterials />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
