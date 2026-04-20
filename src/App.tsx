import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "./layouts/AppLayout";
import Index from "./pages/Index";
import FocusPage from "./pages/FocusPage";
import TasksPage from "./pages/TasksPage";
import MaterialsPage from "./pages/MaterialsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import GoalsPage from "./pages/GoalsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PlannerPage from "./pages/PlannerPage";
import AssessmentPage from "./pages/AssessmentPage";
import FeatureBuilderPage from "./pages/FeatureBuilderPage";
import PlaygroundPage from "./pages/PlaygroundPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-bg)" }}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-bg)" }}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Index />} />
              <Route path="/focus" element={<FocusPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/feature-builder" element={<FeatureBuilderPage />} />
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
