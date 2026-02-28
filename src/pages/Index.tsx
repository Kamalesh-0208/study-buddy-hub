import { BookOpen, Sparkles } from "lucide-react";
import PomodoroTimer from "@/components/PomodoroTimer";
import FlashcardDeck from "@/components/FlashcardDeck";
import StudyNotes from "@/components/StudyNotes";
import StatsGrid from "@/components/StatsGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">StudyFlow</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Keep going, you're doing great!</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column — Timer + Stats */}
          <div className="flex flex-col gap-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Pomodoro Timer
              </h2>
              <PomodoroTimer />
            </section>
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your Stats
              </h2>
              <StatsGrid />
            </section>
          </div>

          {/* Center Column — Flashcards */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Flashcards
            </h2>
            <FlashcardDeck />
          </div>

          {/* Right Column — Notes */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Study Notes
            </h2>
            <StudyNotes />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
