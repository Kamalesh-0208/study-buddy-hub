import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

const StudyNotes = () => {
  const [notes, setNotes] = useState<Note[]>([
    { id: "1", title: "Biology Chapter 5", content: "Key concepts: cell division, mitosis vs meiosis, chromosome replication.", createdAt: new Date() },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const addNote = () => {
    if (!title.trim()) return;
    setNotes([{ id: Date.now().toString(), title, content, createdAt: new Date() }, ...notes]);
    setTitle("");
    setContent("");
    setShowAdd(false);
  };

  const deleteNote = (id: string) => setNotes(notes.filter((n) => n.id !== id));

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      <Button size="sm" variant="outline" className="self-start" onClick={() => setShowAdd(!showAdd)}>
        <Plus className="mr-1 h-4 w-4" /> New Note
      </Button>

      {showAdd && (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 animate-fade-in">
          <Input placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Write your notes..." value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
          <Button size="sm" onClick={addNote}>Save Note</Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {notes.map((note) => (
          <div key={note.id} className="group rounded-lg border bg-card p-4 card-shadow transition-all hover:card-shadow-hover">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-foreground">{note.title}</h4>
              <Button
                size="sm" variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                onClick={() => deleteNote(note.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyNotes;
