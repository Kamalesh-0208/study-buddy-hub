import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink, AlertTriangle, BookOpen, Layers, Rocket, Target,
  Clock, Wrench, Lightbulb, GitBranch,
} from "lucide-react";

interface SkillAnalysisProps {
  analysis: any;
  skillName: string;
}

const DifficultyBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-muted-foreground w-36 shrink-0">{label}</span>
    <Progress value={value * 10} className="h-2 flex-1" />
    <span className="text-[11px] font-bold text-foreground w-6 text-right">{value}</span>
  </div>
);

const ProjectCard = ({ project, level }: { project: any; level: string }) => (
  <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
    <div className="flex items-center gap-2 mb-1">
      <Badge variant="outline" className="text-[9px]">{level}</Badge>
      <span className="text-xs font-semibold text-foreground">{project.name}</span>
    </div>
    <p className="text-[11px] text-muted-foreground">{project.description}</p>
    <p className="text-[10px] text-primary mt-1">💡 {project.teaches}</p>
  </div>
);

const SkillAnalysisView = ({ analysis, skillName }: SkillAnalysisProps) => {
  if (!analysis) return null;

  const d = analysis.difficulty;

  return (
    <Tabs defaultValue="overview" className="mt-3">
      <TabsList className="h-8 w-full flex-wrap justify-start gap-0.5">
        <TabsTrigger value="overview" className="text-[10px] px-2 py-1 h-6">Overview</TabsTrigger>
        <TabsTrigger value="difficulty" className="text-[10px] px-2 py-1 h-6">Difficulty</TabsTrigger>
        <TabsTrigger value="stages" className="text-[10px] px-2 py-1 h-6">Roadmap</TabsTrigger>
        <TabsTrigger value="skill-tree" className="text-[10px] px-2 py-1 h-6">Skill Tree</TabsTrigger>
        <TabsTrigger value="projects" className="text-[10px] px-2 py-1 h-6">Projects</TabsTrigger>
        <TabsTrigger value="tools" className="text-[10px] px-2 py-1 h-6">Tools</TabsTrigger>
        <TabsTrigger value="resources" className="text-[10px] px-2 py-1 h-6">Resources</TabsTrigger>
        <TabsTrigger value="mistakes" className="text-[10px] px-2 py-1 h-6">Mistakes</TabsTrigger>
        <TabsTrigger value="tips" className="text-[10px] px-2 py-1 h-6">Study Tips</TabsTrigger>
      </TabsList>

      {/* Overview */}
      <TabsContent value="overview" className="space-y-3">
        {analysis.overview && (
          <div className="space-y-2 text-xs">
            <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-primary" /> What is {skillName}?</h4>
              <p className="text-muted-foreground text-[11px]">{analysis.overview.what_it_is}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-1"><Rocket className="h-3.5 w-3.5 text-primary" /> Why Learn It?</h4>
              <p className="text-muted-foreground text-[11px]">{analysis.overview.why_useful || analysis.overview.why_valuable}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-1"><Target className="h-3.5 w-3.5 text-primary" /> Where Used</h4>
              <p className="text-muted-foreground text-[11px]">{analysis.overview.where_used}</p>
            </div>
            {analysis.overview.build_examples?.length > 0 && (
              <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
                <h4 className="font-semibold text-foreground mb-1 flex items-center gap-1">🛠️ What You Can Build</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.overview.build_examples.map((ex: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{ex}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {analysis.prerequisites && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Prerequisites</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
                <span className="text-[10px] font-bold text-destructive">Core (Required)</span>
                <ul className="mt-1 space-y-1">
                  {(analysis.prerequisites.core || analysis.prerequisites.absolute)?.map((p: any, i: number) => (
                    <li key={i} className="text-[11px] text-muted-foreground">
                      • <span className="font-medium text-foreground">{typeof p === "string" ? p : p.name}</span>
                      {typeof p !== "string" && p.reason && <span className="block pl-3 text-[10px]">{p.reason}</span>}
                    </li>
                  ))}
                  {!(analysis.prerequisites.core || analysis.prerequisites.absolute)?.length && (
                    <li className="text-[11px] text-muted-foreground italic">None required</li>
                  )}
                </ul>
              </div>
              <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
                <span className="text-[10px] font-bold text-primary">Helpful</span>
                <ul className="mt-1 space-y-1">
                  {analysis.prerequisites.helpful?.map((p: any, i: number) => (
                    <li key={i} className="text-[11px] text-muted-foreground">
                      • <span className="font-medium text-foreground">{typeof p === "string" ? p : p.name}</span>
                      {typeof p !== "string" && p.reason && <span className="block pl-3 text-[10px]">{p.reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        {analysis.timeline && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" /> Learning Timeline</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { label: "30 Days", value: analysis.timeline.thirty_days },
                { label: "90 Days", value: analysis.timeline.ninety_days },
                { label: "6 Months", value: analysis.timeline.six_months },
              ].map((t) => (
                <div key={t.label} className="rounded-lg border border-border/40 p-3 bg-secondary/10">
                  <span className="text-[10px] font-bold text-primary">{t.label}</span>
                  <p className="text-[11px] text-muted-foreground mt-1">{t.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      {/* Difficulty */}
      <TabsContent value="difficulty" className="space-y-3">
        {d && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl border border-border/40 px-4 py-3 bg-secondary/10 text-center">
                <span className="text-2xl font-extrabold text-primary">{d.overall_score}</span>
                <span className="text-[10px] text-muted-foreground block">/10</span>
              </div>
              <div>
                <Badge className="text-xs">{d.classification}</Badge>
                <p className="text-[11px] text-muted-foreground mt-1">~{d.estimated_weeks} weeks to learn</p>
              </div>
            </div>
            <div className="space-y-2">
              <DifficultyBar label="Concept Difficulty" value={d.concept_difficulty ?? d.conceptual_difficulty} />
              <DifficultyBar label="Technical Difficulty" value={d.technical_difficulty ?? d.technical_complexity} />
              <DifficultyBar label="Learning Curve" value={d.learning_curve} />
              <DifficultyBar label="Time to Learn" value={d.time_to_learn ?? d.time_to_master} />
            </div>
          </>
        )}
      </TabsContent>

      {/* Stages / Roadmap */}
      <TabsContent value="stages" className="space-y-2">
        {analysis.stages?.map((stage: any, i: number) => (
          <div key={i} className="rounded-lg border border-border/40 p-3 bg-secondary/10">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-primary" /> Stage {i + 1}: {stage.name}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 mt-2">
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground">Topics</span>
                <ul className="mt-0.5">{stage.topics?.map((t: string, j: number) => <li key={j} className="text-[11px] text-foreground">• {t}</li>)}</ul>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground">Key Concepts</span>
                <ul className="mt-0.5">{stage.key_concepts?.map((c: string, j: number) => <li key={j} className="text-[11px] text-foreground">• {c}</li>)}</ul>
              </div>
            </div>
            {(stage.practice_exercises || stage.exercises)?.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] font-semibold text-muted-foreground">Practice Exercises</span>
                <ul className="mt-0.5">{(stage.practice_exercises || stage.exercises).map((e: string, j: number) => <li key={j} className="text-[11px] text-muted-foreground">• {e}</li>)}</ul>
              </div>
            )}
            {stage.tools?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {stage.tools.map((t: string, j: number) => <Badge key={j} variant="outline" className="text-[9px]">{t}</Badge>)}
              </div>
            )}
          </div>
        ))}
      </TabsContent>

      {/* Skill Tree */}
      <TabsContent value="skill-tree" className="space-y-2">
        {analysis.skill_tree ? (
          <div className="rounded-lg border border-border/40 p-4 bg-secondary/10">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1 mb-3">
              <GitBranch className="h-3.5 w-3.5 text-primary" /> Skill Tree: {skillName}
            </h4>
            <pre className="text-[11px] text-foreground font-mono whitespace-pre-wrap leading-relaxed">
              {analysis.skill_tree}
            </pre>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No skill tree available.</p>
        )}
      </TabsContent>

      {/* Projects */}
      <TabsContent value="projects" className="space-y-2">
        {analysis.projects && (
          <>
            {analysis.projects.beginner?.map((p: any, i: number) => <ProjectCard key={`b${i}`} project={p} level="Beginner" />)}
            {analysis.projects.intermediate?.map((p: any, i: number) => <ProjectCard key={`i${i}`} project={p} level="Intermediate" />)}
            {analysis.projects.advanced?.map((p: any, i: number) => <ProjectCard key={`a${i}`} project={p} level="Advanced" />)}
          </>
        )}
      </TabsContent>

      {/* Tools */}
      <TabsContent value="tools" className="space-y-3">
        {analysis.tools ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
              <h4 className="text-[10px] font-bold text-foreground flex items-center gap-1 mb-2">
                <Wrench className="h-3 w-3 text-primary" /> Beginner Tools
              </h4>
              <ul className="space-y-1.5">
                {analysis.tools.beginner?.map((t: any, i: number) => (
                  <li key={i} className="text-[11px]">
                    <span className="font-medium text-foreground">{t.name}</span>
                    <span className="text-muted-foreground block text-[10px]">{t.used_for}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
              <h4 className="text-[10px] font-bold text-foreground flex items-center gap-1 mb-2">
                <Wrench className="h-3 w-3 text-primary" /> Advanced Tools
              </h4>
              <ul className="space-y-1.5">
                {analysis.tools.advanced?.map((t: any, i: number) => (
                  <li key={i} className="text-[11px]">
                    <span className="font-medium text-foreground">{t.name}</span>
                    <span className="text-muted-foreground block text-[10px]">{t.used_for}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No tools data available.</p>
        )}
      </TabsContent>

      {/* Resources */}
      <TabsContent value="resources" className="space-y-3">
        {analysis.resources && (
          <>
            {[
              { label: "Courses", items: analysis.resources.courses },
              { label: "YouTube Channels", items: analysis.resources.youtube_channels },
              { label: "Websites", items: analysis.resources.websites },
              { label: "Practice Platforms", items: analysis.resources.practice_platforms },
            ].map(({ label, items }) => items?.length > 0 && (
              <div key={label}>
                <h4 className="text-xs font-semibold text-foreground mb-1">{label}</h4>
                <div className="space-y-1">
                  {items.map((item: any, i: number) => (
                    <a key={i} href={item.url || "#"} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      {typeof item === "string" ? item : item.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            {analysis.resources.books?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-1">📚 Books</h4>
                <ul>{analysis.resources.books.map((b: string, i: number) => <li key={i} className="text-[11px] text-muted-foreground">• {b}</li>)}</ul>
              </div>
            )}
          </>
        )}
      </TabsContent>

      {/* Mistakes */}
      <TabsContent value="mistakes" className="space-y-2">
        {analysis.common_mistakes?.map((m: any, i: number) => (
          <div key={i} className="rounded-lg border border-border/40 p-3 bg-secondary/10">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-foreground">{m.mistake}</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">✅ {m.how_to_avoid}</p>
              </div>
            </div>
          </div>
        ))}
      </TabsContent>

      {/* Study Tips */}
      <TabsContent value="tips" className="space-y-2">
        {analysis.study_tips?.length > 0 ? (
          analysis.study_tips.map((t: any, i: number) => (
            <div key={i} className="rounded-lg border border-border/40 p-3 bg-secondary/10">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-foreground">{t.tip}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.explanation}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic">No study tips available.</p>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default SkillAnalysisView;
