import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSubjects } from "@/hooks/useSubjects";
import { useTasks } from "@/hooks/useTasks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityOptions = [
  { value: "high", label: "High", className: "bg-destructive/10 text-destructive border-destructive/30" },
  { value: "medium", label: "Medium", className: "bg-study-warning/10 text-study-warning border-study-warning/30" },
  { value: "low", label: "Low", className: "bg-study-success/10 text-study-success border-study-success/30" },
];

const CreateTaskModal = ({ open, onOpenChange }: Props) => {
  const { subjects } = useSubjects();
  const { addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subjectId, setSubjectId] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [estimatedMinutes, setEstimatedMinutes] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    addTask.mutate({
      title: title.trim(),
      priority,
      deadline: deadline ? deadline.toISOString().split("T")[0] : undefined,
      subject_id: subjectId || undefined,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setSubjectId("");
    setDeadline(undefined);
    setEstimatedMinutes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Task Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to study?"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              className="min-h-[60px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Priority</Label>
            <div className="flex gap-2">
              {priorityOptions.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    priority === p.value ? p.className : "bg-secondary/40 text-muted-foreground border-transparent"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {subjects.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Subject</Label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-secondary/50 text-foreground border border-border/40 outline-none focus:border-primary/40"
              >
                <option value="">No subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm h-9",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                    {deadline ? format(deadline, "MMM d") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Est. Time (min)</Label>
              <Input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="30"
                min="1"
                className="h-9"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!title.trim() || addTask.isPending} className="gradient-bg text-primary-foreground border-0">
            Save Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
