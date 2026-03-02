import StudyMaterialsHub from "@/components/StudyMaterialsHub";
import { motion } from "framer-motion";

const MaterialsPage = () => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div>
      <h2 className="text-2xl font-extrabold text-foreground">Study Materials</h2>
      <p className="text-sm text-muted-foreground mt-1">Access your study resources organized by subject</p>
    </div>
    <div className="max-w-2xl">
      <StudyMaterialsHub />
    </div>
  </motion.div>
);

export default MaterialsPage;
