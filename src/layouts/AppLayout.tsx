import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopNavbar from "@/components/TopNavbar";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useStudyStore } from "@/store/useStudyStore";
import { useEffect } from "react";

const AppLayout = () => {
  const { darkMode, toggleDarkMode } = useStudyStore();

  // Keyboard shortcut: Ctrl+D for dark mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        toggleDarkMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleDarkMode]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 px-6 py-8 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>

        {/* FAB */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-2xl gradient-bg text-primary-foreground shadow-glow flex items-center justify-center z-40"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
};

export default AppLayout;
