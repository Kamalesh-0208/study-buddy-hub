import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink, AlertTriangle, Briefcase, BarChart3,
  BookOpen, Layers, Rocket, Target, Clock, Award,
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
        <TabsTrigger value="stages" className="text-[10px] px-2 py-1 h-6">Stages</TabsTrigger>
        <TabsTrigger value="projects" className="text-[10px] px-2 py-1 h-6">Projects</TabsTrigger>
        <TabsTrigger value="resources" className="text-[10px] px-2 py-1 h-6">Resources</TabsTrigger>
        <TabsTrigger value="career" className="text-[10px] px-2 py-1 h-6">Career</TabsTrigger>
        <TabsTrigger value="mistakes" className="text-[10px] px-2 py-1 h-6">Mistakes</TabsTrigger>
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
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-1"><Target className="h-3.5 w-3.5 text-primary" /> Where Used</h4>
              <p className="text-muted-foreground text-[11px]">{analysis.overview.where_used}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-1"><Rocket className="h-3.5 w-3.5 text-primary" /> Why Valuable</h4>
              <p className="text-muted-foreground text-[11px]">{analysis.overview.why_valuable}</p>
            </div>
            {analysis.overview.career_opportunities?.length > 0 && (
              <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
                <h4 className="font-semibold text-foreground mb-1 flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-primary" /> Career Opportunities</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.overview.career_opportunities.map((c: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>
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
                <span className="text-[10px] font-bold text-destructive">Required</span>
                <ul className="mt-1 space-y-0.5">
                  {analysis.prerequisites.absolute?.map((p: string, i: number) => (
                    <li key={i} className="text-[11px] text-muted-foreground">• {p}</li>
                  ))}
                  {(!analysis.prerequisites.absolute || analysis.prerequisites.absolute.length === 0) && (
                    <li className="text-[11px] text-muted-foreground italic">None required</li>
                  )}
                </ul>
              </div>
              <div className="rounded-lg border border-border/40 p-3 bg-secondary/10">
                <span className="text-[10px] font-bold text-primary">Helpful</span>
                <ul className="mt-1 space-y-0.5">
                  {analysis.prerequisites.helpful?.map((p: string, i: number) => (
                    <li key={i} className="text-[11px] text-muted-foreground">• {p}</li>
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
        {analysis.skill_comparison?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-primary" /> Skill Comparison</h4>
            <div className="overflow-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left p-1.5 text-muted-foreground font-medium">Skill</th>
                    <th className="text-center p-1.5 text-muted-foreground font-medium">Easier</th>
                    <th className="text-center p-1.5 text-muted-foreground font-medium">More Demand</th>
                    <th className="text-center p-1.5 text-muted-foreground font-medium">Pays More</th>
                    <th className="text-left p-1.5 text-muted-foreground font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.skill_comparison.map((s: any, i: number) => (
                    <tr key={i} className="border-b border-border/20">
                      <td className="p-1.5 font-medium text-foreground">{s.skill_name}</td>
                      <td className="p-1.5 text-center">{s.easier ? "✅" : "❌"}</td>
                      <td className="p-1.5 text-center">{s.more_in_demand ? "✅" : "❌"}</td>
                      <td className="p-1.5 text-center">{s.pays_more ? "✅" : "❌"}</td>
                      <td className="p-1.5 text-muted-foreground">{s.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <DifficultyBar label="Conceptual Difficulty" value={d.conceptual_difficulty} />
              <DifficultyBar label="Technical Complexity" value={d.technical_complexity} />
              <DifficultyBar label="Learning Curve" value={d.learning_curve} />
              <DifficultyBar label="Time to Master" value={d.time_to_master} />
              <DifficultyBar label="Job Market Competition" value={d.job_market_competition} />
            </div>
          </>
        )}
      </TabsContent>

      {/* Stages */}
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
            <div className="flex flex-wrap gap-1 mt-2">
              {stage.tools?.map((t: string, j: number) => <Badge key={j} variant="outline" className="text-[9px]">{t}</Badge>)}
            </div>
            {stage.exercises?.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] font-semibold text-muted-foreground">Exercises</span>
                <ul className="mt-0.5">{stage.exercises.map((e: string, j: number) => <li key={j} className="text-[11px] text-muted-foreground">• {e}</li>)}</ul>
              </div>
            )}
          </div>
        ))}
      </TabsContent>

      {/* Projects */}
      <TabsContent value="projects" className="space-y-2">
        {analysis.projects && (
          <>
            {analysis.projects.beginner?.map((p: any, i: number) => <ProjectCard key={`b${i}`} project={p} level="Beginner" />)}
            {analysis.projects.intermediate?.map((p: any, i: number) => <ProjectCard key={`i${i}`} project={p} level="Intermediate" />)}
            {analysis.projects.advanced?.map((p: any, i: number) => <ProjectCard key={`a${i}`} project={p} level="Advanced" />)}
            {analysis.projects.portfolio && (
              <div className="rounded-lg border-2 border-primary/30 p-3 bg-primary/5">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Portfolio Project: {analysis.projects.portfolio.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{analysis.projects.portfolio.description}</p>
                <p className="text-[10px] text-primary mt-1">💡 {analysis.projects.portfolio.teaches}</p>
              </div>
            )}
          </>
        )}
      </TabsContent>

      {/* Resources */}
      <TabsContent value="resources" className="space-y-3">
        {analysis.resources && (
          <>
            {[
              { label: "Courses", items: analysis.resources.courses, hasUrl: true },
              { label: "YouTube Channels", items: analysis.resources.youtube_channels, hasUrl: true },
              { label: "Websites", items: analysis.resources.websites, hasUrl: true },
              { label: "Practice Platforms", items: analysis.resources.practice_platforms, hasUrl: true },
            ].map(({ label, items, hasUrl }) => items?.length > 0 && (
              <div key={label}>
                <h4 className="text-xs font-semibold text-foreground mb-1">{label}</h4>
                <div className="space-y-1">
                  {items.map((item: any, i: number) => (
                    <a key={i} href={hasUrl ? item.url : "#"} target="_blank" rel="noopener noreferrer"
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

      {/* Career */}
      <TabsContent value="career" className="space-y-2">
        {analysis.career_paths && (
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "💼 Jobs", items: analysis.career_paths.jobs },
              { label: "🏠 Freelance", items: analysis.career_paths.freelance },
              { label: "🚀 Startup Ideas", items: analysis.career_paths.startup },
              { label: "💰 Earn Online", items: analysis.career_paths.earn_online },
            ].map(({ label, items }) => items?.length > 0 && (
              <div key={label} className="rounded-lg border border-border/40 p-3 bg-secondary/10">
                <span className="text-[10px] font-bold text-foreground">{label}</span>
                <ul className="mt-1">{items.map((item: string, i: number) => <li key={i} className="text-[11px] text-muted-foreground">• {item}</li>)}</ul>
              </div>
            ))}
          </div>
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
    </Tabs>
  );
};

export default SkillAnalysisView;
