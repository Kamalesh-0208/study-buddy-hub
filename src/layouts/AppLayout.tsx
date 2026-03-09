import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopNavbar from "@/components/TopNavbar";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const AppLayout = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const toggleDarkMode = () => {
    setDarkMode((d) => {
      const next = !d;
      localStorage.setItem("darkMode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        toggleDarkMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="flex-1 px-6 py-8 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>

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
