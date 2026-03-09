import { useState } from "react";
import { motion } from "framer-motion";
import { useExamReadiness } from "@/hooks/useExamReadiness";
import { useSubjects } from "@/hooks/useSubjects";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const levelColors: Record<string, string> = {
  poor: "text-destructive",
  moderate: "text-yellow-500",
  good: "text-blue-500",
  ready: "text-green-500",
};

const levelLabels: Record<string, string> = {
  poor: "Poor Preparation",
  moderate: "Moderate",
  good: "Good Preparation",
  ready: "Exam Ready ✓",
};

const ExamReadiness = () => {
  const { exams, readinessScores, addExam, deleteExam, calculateReadiness } = useExamReadiness();
  const { subjects } = useSubjects();
  const [subjectId, setSubjectId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examName, setExamName] = useState("");
  const [readinessResults, setReadinessResults] = useState<any[] | null>(null);

  const handleAddExam = () => {
    if (!subjectId || !examDate) return;
    addExam.mutate({ subject_id: subjectId, exam_date: examDate, exam_name: examName || undefined });
    setSubjectId("");
    setExamDate("");
    setExamName("");
  };

  const handleCalculate = async () => {
    const result = await calculateReadiness.mutateAsync();
    setReadinessResults(result);
  };

  const results = readinessResults ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass-strong p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="icon-bg h-8 w-8"><GraduationCap className="h-4 w-4 text-primary" /></div>
          Exam Readiness Predictor
        </h3>
        <Button size="sm" variant="outline" onClick={handleCalculate} disabled={calculateReadiness.isPending} className="text-xs">
          <RefreshCw className={`h-3 w-3 mr-1 ${calculateReadiness.isPending ? "animate-spin" : ""}`} />
          Calculate
        </Button>
      </div>

      {/* Add Exam Form */}
      <div className="flex gap-2 items-end flex-wrap">
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-[140px] h-9 text-xs" />
        <Input placeholder="Exam name" value={examName} onChange={e => setExamName(e.target.value)} className="w-[140px] h-9 text-xs" />
        <Button size="sm" onClick={handleAddExam} disabled={!subjectId || !examDate} className="h-9"><Plus className="h-3 w-3 mr-1" />Add</Button>
      </div>

      {/* Scheduled Exams */}
      {exams.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Scheduled Exams</p>
          {exams.map((exam: any) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(exam.exam_date).getTime() - Date.now()) / 86400000));
            return (
              <div key={exam.id} className="flex items-center justify-between bg-secondary/30 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{exam.subjects?.name ?? "Unknown"}</span>
                  {exam.exam_name && <span className="text-xs text-muted-foreground">— {exam.exam_name}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${daysLeft <= 7 ? "text-destructive" : "text-muted-foreground"}`}>
                    {daysLeft} days left
                  </span>
                  <button onClick={() => deleteExam.mutate(exam.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Readiness Scores */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">Readiness Scores</p>
          {results.map((r: any) => (
            <div key={r.subject_id} className="bg-secondary/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{r.subject_name}</span>
                <span className={`text-xs font-bold ${levelColors[r.level]}`}>{levelLabels[r.level]}</span>
              </div>
              <Progress value={r.readiness_score} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{r.readiness_score}%</span>
                {r.days_remaining !== null && (
                  <span className="flex items-center gap-1">
                    {r.days_remaining <= 7 ? <AlertTriangle className="h-3 w-3 text-destructive" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                    Exam in {r.days_remaining} days · +{r.recommended_hours}h recommended
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ExamReadiness;
