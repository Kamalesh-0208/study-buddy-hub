import { useState } from "react";
import { Sparkles, Send, Loader2, CheckCircle2, XCircle, Layout, Server, Database, ArrowRight, Lightbulb, Layers, Code2, TestTube, Clock, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface FeaturePlan {
  feature_name: string;
  purpose: string;
  target_users: string;
  placement: string;
  estimated_complexity: string;
  ui_components: { name: string; type: string; description: string }[];
  user_workflow: string[];
  backend_logic: { name: string; description: string }[];
  database_tables: { table_name: string; fields: { name: string; type: string; description: string }[] }[];
  api_endpoints: { method: string; path: string; description: string }[];
  integration_points: string[];
  implementation_steps: { step: number; task: string; category: string }[];
}

const EXAMPLES = [
  "Add a leaderboard for top scorers",
  "Create a daily quiz feature",
  "Add coding contest mode",
  "Add AI hints for questions",
  "Create a student progress dashboard",
  "Add a reward or badge system",
  "Add a coding challenge mode",
];

const complexityColor: Record<string, string> = {
  low: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

const categoryIcon: Record<string, typeof Layout> = {
  frontend: Layout,
  backend: Server,
  database: Database,
  testing: TestTube,
};

const FeatureBuilderPage = () => {
  const { user } = useAuth();
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<FeaturePlan | null>(null);
  const [approved, setApproved] = useState(false);

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ["feature-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleGenerate = async () => {
    if (!request.trim() || !user) return;
    setLoading(true);
    setPlan(null);
    setApproved(false);

    try {
      const { data, error } = await supabase.functions.invoke("ai-feature-builder", {
        body: { request: request.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlan(data.plan);
      refetchHistory();
      toast({ title: "Feature plan generated! ✨", description: `"${data.plan.feature_name}" is ready for review.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate feature plan.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!plan) return;
    setApproved(true);
    toast({ title: "Feature Approved! 🎉", description: `"${plan.feature_name}" has been approved and logged for implementation.` });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="gradient-bg rounded-xl p-2.5 shadow-glow">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">AI Feature Builder</h1>
          <p className="text-sm text-muted-foreground">Describe a feature and let AI design it for you</p>
        </div>
      </div>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Builder</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> History ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6 mt-4">
          {/* Input */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder='Describe the feature you want... e.g. "Add a daily quiz that sends 5 random questions each morning"'
                className="min-h-[100px] resize-none text-base"
                maxLength={1000}
              />
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setRequest(ex)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{request.length}/1000</span>
                <Button onClick={handleGenerate} disabled={!request.trim() || loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? "Analyzing..." : "Generate Feature Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading state */}
          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-primary/20">
                  <CardContent className="py-12 flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">AI is analyzing your request and designing the feature...</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Plan output */}
          <AnimatePresence>
            {plan && !loading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Overview */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        {plan.feature_name}
                      </CardTitle>
                      <Badge className={complexityColor[plan.estimated_complexity] ?? ""}>
                        {plan.estimated_complexity} complexity
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div><span className="font-semibold text-foreground">Purpose:</span> <span className="text-muted-foreground">{plan.purpose}</span></div>
                    <div><span className="font-semibold text-foreground">Target Users:</span> <span className="text-muted-foreground">{plan.target_users}</span></div>
                    <div><span className="font-semibold text-foreground">Placement:</span> <span className="text-muted-foreground">{plan.placement}</span></div>
                  </CardContent>
                </Card>

                {/* UI Components */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Layout className="h-4 w-4 text-primary" /> UI Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {plan.ui_components.map((c, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30">
                          <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{c.type}</Badge>
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Workflow */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> User Workflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.user_workflow.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                          <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Backend + DB side by side */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4 text-primary" /> Backend Logic</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {plan.backend_logic.map((b, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-secondary/30">
                          <p className="text-sm font-medium">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Database Schema</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {plan.database_tables.map((t, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-secondary/30">
                          <p className="text-sm font-semibold font-mono">{t.table_name}</p>
                          <div className="mt-1 space-y-0.5">
                            {t.fields.map((f, j) => (
                              <div key={j} className="flex items-center gap-2 text-xs">
                                <span className="font-mono text-primary">{f.name}</span>
                                <span className="text-muted-foreground">({f.type})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* API Endpoints */}
                {plan.api_endpoints.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Code2 className="h-4 w-4 text-primary" /> API Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {plan.api_endpoints.map((ep, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30">
                            <Badge variant="outline" className="text-[10px] font-mono shrink-0">{ep.method}</Badge>
                            <span className="text-sm font-mono">{ep.path}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{ep.description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Integration */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Integration Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {plan.integration_points.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Implementation Steps */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Implementation Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.implementation_steps.map((s, i) => {
                        const Icon = categoryIcon[s.category] ?? Layout;
                        return (
                          <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30">
                            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm">{s.task}</p>
                              <Badge variant="outline" className="text-[10px] mt-1">{s.category}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Approval */}
                {!approved ? (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">Approve Feature Implementation?</p>
                        <p className="text-sm text-muted-foreground">This will log the feature for development</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setPlan(null); setApproved(false); }} className="gap-1.5">
                          <XCircle className="h-4 w-4" /> Cancel
                        </Button>
                        <Button onClick={handleApprove} className="gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> Approve Feature
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="py-6 flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="font-semibold text-foreground">Feature Approved & Logged!</p>
                        <p className="text-sm text-muted-foreground">"{plan.feature_name}" has been saved to your feature history.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature Request History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No feature requests yet. Start by describing a feature above!</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {history.map((h: any) => (
                      <div key={h.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary/30">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{h.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{h.description}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{h.status}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeatureBuilderPage;
