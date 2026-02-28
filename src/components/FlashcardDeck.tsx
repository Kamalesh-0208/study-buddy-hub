import { useState } from "react";
import { Plus, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

const SAMPLE_CARDS: Flashcard[] = [
  { id: "1", front: "What is photosynthesis?", back: "The process by which plants convert sunlight into energy using CO₂ and water." },
  { id: "2", front: "Newton's Second Law", back: "F = ma — Force equals mass times acceleration." },
  { id: "3", front: "Mitochondria", back: "The powerhouse of the cell — produces ATP through cellular respiration." },
];

const FlashcardDeck = () => {
  const [cards, setCards] = useState<Flashcard[]>(SAMPLE_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const currentCard = cards[currentIndex];

  const addCard = () => {
    if (!newFront.trim() || !newBack.trim()) return;
    setCards([...cards, { id: Date.now().toString(), front: newFront, back: newBack }]);
    setNewFront("");
    setNewBack("");
    setShowAdd(false);
  };

  const navigate = (dir: number) => {
    setIsFlipped(false);
    setCurrentIndex((i) => (i + dir + cards.length) % cards.length);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Card display */}
      <div
        className="group relative cursor-pointer rounded-xl bg-card p-8 card-shadow transition-all duration-300 hover:card-shadow-hover min-h-[200px] flex flex-col items-center justify-center"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <span className="absolute top-3 right-3 text-xs text-muted-foreground">
          {currentIndex + 1}/{cards.length}
        </span>
        <p className="text-center text-lg font-medium text-foreground leading-relaxed">
          {isFlipped ? currentCard?.back : currentCard?.front}
        </p>
        <span className="mt-4 text-xs text-muted-foreground">
          {isFlipped ? "Answer" : "Click to reveal"}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setIsFlipped(false); setCurrentIndex(0); }}>
            <RotateCcw className="mr-1 h-4 w-4" /> Restart
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Add card form */}
      {showAdd && (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 animate-fade-in">
          <Input placeholder="Question (front)" value={newFront} onChange={(e) => setNewFront(e.target.value)} />
          <Input placeholder="Answer (back)" value={newBack} onChange={(e) => setNewBack(e.target.value)} />
          <Button size="sm" onClick={addCard}>Add Card</Button>
        </div>
      )}
    </div>
  );
};

export default FlashcardDeck;
