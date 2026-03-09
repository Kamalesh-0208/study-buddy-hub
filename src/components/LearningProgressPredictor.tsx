import { useProgressPredictor } from "@/hooks/useProgressPredictor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Brain, AlertTriangle, CheckCircle, Loader2, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const LearningProgressPredictor = () => {
  const { predictions, isLoading, predictProgress } = useProgressPredictor();

  const chartData = predictions
    .filter((p: any) => p.subjects)
    .map((p: any) => ({
      name: p.subjects?.name ?? "Unknown",
      current: p.current_readiness,
      predicted: p.predicted_readiness,
      color: p.subjects?.color ?? "#6366f1",
    }));

  const getStatusIcon = (predicted: number) => {
    if (predicted >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (predicted >= 60) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (predicted: number) => {
    if (predicted >= 80) return "bg-green-500/10 text-green-700 border-green-500/20";
    if (predicted >= 60) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    return "bg-red-500/10 text-red-700 border-red-500/20";
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold">AI Progress Predictor</CardTitle>
        </div>
        <Button
          size="sm"
          onClick={() => predictProgress.mutate()}
          disabled={predictProgress.isPending}
          className="gap-1.5"
        >
          {predictProgress.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5" />}
          Predict
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading predictions...</p>}

        {!isLoading && predictions.length === 0 && (
          <p className="text-sm text-muted-foreground">Click "Predict" to analyze your learning trajectory and forecast exam readiness.</p>
        )}

        {chartData.length > 0 && (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <ReferenceLine y={80} stroke="hsl(var(--primary))" strokeDasharray="5 5" label={{ value: "Ready", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Line type="monotone" dataKey="current" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Current" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2.5} name="Predicted" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-3">
          {predictions.filter((p: any) => p.subjects).map((pred: any) => (
            <div key={pred.id} className="rounded-lg border border-border/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pred.subjects?.color ?? "#6366f1" }} />
                  <span className="font-medium text-sm text-foreground">{pred.subjects?.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(pred.predicted_readiness)}
                  <Badge variant="outline" className={`text-xs ${getStatusColor(pred.predicted_readiness)}`}>
                    {pred.predicted_readiness}% predicted
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block">Current → Predicted</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Progress value={pred.current_readiness} className="h-1.5 flex-1" />
                    <span className="font-mono text-foreground">{pred.current_readiness}%</span>
                    <TrendingUp className="h-3 w-3" />
                    <span className="font-mono text-primary">{pred.predicted_readiness}%</span>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  {pred.days_remaining !== null && <p>📅 {pred.days_remaining} days left</p>}
                  <p>⚡ {pred.learning_speed} h/day</p>
                  <p>📚 +{pred.predicted_study_hours}h projected</p>
                </div>
              </div>

              {pred.alert_message && (
                <p className="text-xs bg-muted/50 rounded-md px-2 py-1.5 text-muted-foreground">
                  💡 {pred.alert_message}
                </p>
              )}

              {pred.recommended_additional_hours > 0 && (
                <p className="text-xs text-primary">
                  📌 Need {pred.recommended_additional_hours}h more to reach full readiness
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningProgressPredictor;
