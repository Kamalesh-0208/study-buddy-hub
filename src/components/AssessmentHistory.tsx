import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, History, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface HistoryEntry {
  id: string;
  skill: string;
  topic: string;
  difficulty: string;
  mode: string;
  score_percentage: number;
  correct: number;
  total_questions: number;
  time_taken_seconds: number;
  passed: boolean;
  created_at: string;
}

interface Props {
  history: HistoryEntry[];
  onNewTest: () => void;
  onDelete: (id: string) => void;
}

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const AssessmentHistory = ({ history, onNewTest, onDelete }: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Attempt History</h2>
        <Button size="sm" onClick={onNewTest}>
          <Plus className="h-4 w-4 mr-1" /> New Test
        </Button>
      </div>
      {history.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No assessment history yet. Start your first practice!</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {history.map(h => (
              <Card key={h.id} className={`${h.passed ? "border-green-500/20" : "border-destructive/20"}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {h.passed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                        <span className="font-semibold text-sm">{h.skill}</span>
                        <Badge variant="secondary" className="text-xs capitalize">{h.difficulty}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{h.mode}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{h.topic}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Score: {h.score_percentage?.toFixed(0) ?? 0}%</span>
                        <span>{h.correct}/{h.total_questions} correct</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(h.time_taken_seconds || 0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{format(new Date(h.created_at), "MMM d, HH:mm")}</span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(h.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AssessmentHistory;
