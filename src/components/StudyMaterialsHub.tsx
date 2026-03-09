import { useState } from "react";
import { Plus, BookOpen, Trash2, ExternalLink, FileText, Link, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubjects } from "@/hooks/useSubjects";
import { useMaterials } from "@/hooks/useMaterials";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const typeIcons: Record<string, any> = { note: FileText, link: Link, pdf: FileText, video: Video };

const StudyMaterialsHub = () => {
  const { subjects, addSubject, deleteSubject } = useSubjects();
  const { materials, addMaterial, deleteMaterial } = useMaterials();
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#6366f1");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialType, setNewMaterialType] = useState("note");
  const [newMaterialContent, setNewMaterialContent] = useState("");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    addSubject.mutate({ name: newSubjectName.trim(), color: newSubjectColor, icon: "book" });
    setNewSubjectName("");
    setShowAddSubject(false);
  };

  const handleAddMaterial = () => {
    if (!newMaterialTitle.trim() || !selectedSubject) return;
    addMaterial.mutate({ title: newMaterialTitle.trim(), subject_id: selectedSubject, type: newMaterialType, content: newMaterialContent || undefined, url: newMaterialUrl || undefined });
    setNewMaterialTitle(""); setNewMaterialContent(""); setNewMaterialUrl(""); setShowAddMaterial(false);
  };

  const subjectMaterials = selectedSubject ? materials.filter((m) => m.subject_id === selectedSubject) : [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="rounded-2xl glass-strong p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="icon-bg h-8 w-8"><BookOpen className="h-4 w-4 text-primary" /></div>Study Materials
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setShowAddSubject(true)} className="text-xs text-primary h-7"><Plus className="h-3 w-3 mr-1" /> Subject</Button>
      </div>
      {subjects.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">Add a subject to get started</p> : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
          {subjects.map((subject) => (
            <div key={subject.id} className="group flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/50 cursor-pointer transition-all" onClick={() => setSelectedSubject(subject.id)}>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${subject.color}20` }}><BookOpen className="h-4 w-4" style={{ color: subject.color ?? undefined }} /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{subject.name}</p><p className="text-[10px] text-muted-foreground">{Number(subject.total_study_hours ?? 0).toFixed(1)}h studied</p></div>
              <button onClick={(e) => { e.stopPropagation(); deleteSubject.mutate(subject.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent className="glass-strong border-border/50"><DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Subject Name</Label><Input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="e.g. Mathematics" className="rounded-xl" /></div>
            <div><Label className="text-xs">Color</Label><div className="flex gap-2 mt-1">{["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"].map((c) => (<button key={c} onClick={() => setNewSubjectColor(c)} className={`h-7 w-7 rounded-full transition-all ${newSubjectColor === c ? "ring-2 ring-primary ring-offset-2" : ""}`} style={{ backgroundColor: c }} />))}</div></div>
            <Button onClick={handleAddSubject} disabled={addSubject.isPending} className="w-full gradient-bg text-primary-foreground border-0 rounded-xl">Add Subject</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedSubject} onOpenChange={() => setSelectedSubject(null)}>
        <DialogContent className="glass-strong border-border/50 max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center justify-between"><span>{subjects.find((s) => s.id === selectedSubject)?.name} Materials</span><Button size="sm" variant="ghost" onClick={() => setShowAddMaterial(true)} className="text-xs text-primary h-7"><Plus className="h-3 w-3 mr-1" /> Add</Button></DialogTitle></DialogHeader>
          {showAddMaterial && (<div className="space-y-3 p-3 rounded-xl bg-secondary/30 mb-3"><Input value={newMaterialTitle} onChange={(e) => setNewMaterialTitle(e.target.value)} placeholder="Material title" className="rounded-xl" /><div className="flex gap-2">{["note", "link", "pdf", "video"].map((t) => (<button key={t} onClick={() => setNewMaterialType(t)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${newMaterialType === t ? "bg-primary/10 text-primary" : "bg-secondary/60 text-muted-foreground"}`}>{t}</button>))}</div>{(newMaterialType === "link" || newMaterialType === "video") && <Input value={newMaterialUrl} onChange={(e) => setNewMaterialUrl(e.target.value)} placeholder="URL" className="rounded-xl" />}{newMaterialType === "note" && <textarea value={newMaterialContent} onChange={(e) => setNewMaterialContent(e.target.value)} placeholder="Notes..." className="w-full rounded-xl bg-secondary/50 border border-border/40 px-3 py-2 text-sm outline-none min-h-[80px]" />}<div className="flex gap-2"><Button size="sm" onClick={handleAddMaterial} disabled={addMaterial.isPending} className="gradient-bg text-primary-foreground border-0 rounded-xl text-xs">Save</Button><Button size="sm" variant="ghost" onClick={() => setShowAddMaterial(false)} className="rounded-xl text-xs">Cancel</Button></div></div>)}
          {subjectMaterials.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">No materials yet</p> : (<div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">{subjectMaterials.map((m) => { const Icon = typeIcons[m.type ?? "note"] || FileText; return (<div key={m.id} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50"><Icon className="h-4 w-4 text-muted-foreground shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{m.title}</p><p className="text-[10px] text-muted-foreground">{m.type}</p></div>{m.url && <a href={m.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" /></a>}<button onClick={() => deleteMaterial.mutate(m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button></div>); })}</div>)}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
export default StudyMaterialsHub;