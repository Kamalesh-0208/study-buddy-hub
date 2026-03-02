import PerformanceAnalytics from "@/components/PerformanceAnalytics";
import { motion } from "framer-motion";

const AnalyticsPage = () => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div>
      <h2 className="text-2xl font-extrabold text-foreground">Analytics</h2>
      <p className="text-sm text-muted-foreground mt-1">Track your study performance and trends</p>
    </div>
    <PerformanceAnalytics />
  </motion.div>
);

export default AnalyticsPage;
