import { useState } from "react";
import { useSkillPlanner } from "@/hooks/useSkillPlanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, Loader2, Trash2, Check, ChevronDown, ChevronRight,
  ExternalLink, Clock, GraduationCap, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const resourceTypeIcon: Record<string, string> = {
  article: "📄",
  video: "🎬",
  documentation: "📚",
  exercise: "💻",
  tutorial: "📝",
};

const SkillPlanTopics = ({ planId, planSkillName }: { planId: string; planSkillName: string }) => {
  const { topicsQuery, toggleTopicComplete } = useSkillPlanner();
  const { data: topics = [], isLoading } = topicsQuery(planId);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading topics...</p>;

  // Group by scheduled_date
  const grouped = topics.reduce<Record<string, any[]>>((acc, t: any) => {
    const date = t.scheduled_date || "unscheduled";
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-3 mt-3">
      {sortedDates.map((date, dayIdx) => {
        const dayTopics = grouped[date];
        const totalMin = dayTopics.reduce((s: number, t: any) => s + t.estimated_minutes, 0);
        const completedCount = dayTopics.filter((t: any) => t.completed).length;

        return (
          <div key={date} className="rounded-lg border border-border/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">
                Day {dayIdx + 1} — {date !== "unscheduled" ? new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Unscheduled"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-0.5" />{totalMin}m · {completedCount}/{dayTopics.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {dayTopics.map((topic: any) => (
                <div key={topic.id}>
                  <div
                    className={`flex items-center gap-2 rounded-md p-2 cursor-pointer transition-colors ${
                      topic.completed ? "bg-primary/5 opacity-60" : "bg-secondary/20 hover:bg-secondary/30"
                    }`}
                    onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTopicComplete.mutate({ id: topic.id, completed: !!topic.completed, planId });
                      }}
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        topic.completed ? "bg-primary border-primary" : "border-border/60 hover:border-primary"
                      }`}
                    >
                      {topic.completed && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium ${topic.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {topic.topic_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{topic.estimated_minutes}m</span>
                    {expandedTopic === topic.id ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  </div>

                  <AnimatePresence>
                    {expandedTopic === topic.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-8 pr-2 py-2 space-y-2">
                          {topic.description && (
                            <p className="text-[11px] text-muted-foreground">{topic.description}</p>
                          )}
                          {topic.skill_resources?.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-foreground">Resources:</span>
                              {topic.skill_resources.map((res: any) => (
                                <a
                                  key={res.id}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                                >
                                  <span>{resourceTypeIcon[res.resource_type] || "🔗"}</span>
                                  <span className="truncate">{res.title}</span>
                                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SkillLearningPlanner = () => {
  const { plans, isLoading, generateSkillPlan, deleteSkillPlan } = useSkillPlanner();
  const [skillName, setSkillName] = useState("");
  const [specificTopic, setSpecificTopic] = useState("");
  const [dailyHours, setDailyHours] = useState(2);
  const [targetDays, setTargetDays] = useState(7);
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!skillName.trim()) return;
    generateSkillPlan.mutate({
      skill_name: skillName.trim(),
      specific_topic: specificTopic.trim() || undefined,
      daily_hours: dailyHours,
      target_days: targetDays,
      experience_level: experienceLevel,
    });
    setSkillName("");
    setSpecificTopic("");
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold">AI Skill Learning Planner</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">Enter a skill to generate a complete learning roadmap with resources and daily schedule</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Form */}
        <div className="rounded-xl border border-border/40 p-4 space-y-3 bg-secondary/10">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Skill name (e.g., C Programming)"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Specific topic (optional, e.g., Strings)"
              value={specificTopic}
              onChange={(e) => setSpecificTopic(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[10px] font-semibold text-foreground mb-1 block">Daily hours: {dailyHours}h</label>
              <Slider value={[dailyHours]} onValueChange={([v]) => setDailyHours(v)} min={0.5} max={6} step={0.5} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-foreground mb-1 block">Duration: {targetDays} days</label>
              <Slider value={[targetDays]} onValueChange={([v]) => setTargetDays(v)} min={3} max={30} step={1} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-foreground mb-1 block">Level</label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateSkillPlan.isPending || !skillName.trim()}
            className="gap-1.5 w-full sm:w-auto"
          >
            {generateSkillPlan.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generateSkillPlan.isPending ? "Generating Plan..." : "Generate Learning Plan"}
          </Button>
        </div>

        {/* Plans list */}
        {isLoading && <p className="text-sm text-muted-foreground">Loading skill plans...</p>}

        {!isLoading && plans.length === 0 && (
          <div className="text-center py-6">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No skill plans yet. Enter a skill above to get started!</p>
          </div>
        )}

        <div className="space-y-3">
          {plans.map((plan: any) => (
            <div key={plan.id} className="rounded-xl border border-border/40 p-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2 cursor-pointer flex-1"
                  onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                >
                  {expandedPlan === plan.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <span className="text-sm font-bold text-foreground">{plan.skill_name}</span>
                    {plan.specific_topic && <span className="text-xs text-muted-foreground ml-1">· {plan.specific_topic}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{plan.experience_level}</Badge>
                  <Badge variant={plan.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                    {plan.progress_percentage}%
                  </Badge>
                  <button onClick={() => deleteSkillPlan.mutate(plan.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>📚 {plan.total_estimated_hours}h total</span>
                <span>⏱ {plan.daily_hours}h/day</span>
                <span>📅 {plan.target_days} days</span>
              </div>
              <Progress value={plan.progress_percentage} className="h-1.5 mt-2" />

              <AnimatePresence>
                {expandedPlan === plan.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <SkillPlanTopics planId={plan.id} planSkillName={plan.skill_name} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillLearningPlanner;
