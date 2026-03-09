import { useAnalytics } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const getIntensity = (minutes: number) => {
  if (minutes === 0) return "bg-secondary/30";
  if (minutes < 30) return "bg-primary/20";
  if (minutes < 60) return "bg-primary/40";
  if (minutes < 120) return "bg-primary/60";
  return "bg-primary/80";
};

const StudyHeatmap = () => {
  const { heatmap } = useAnalytics();

  // Group by week
  const weeks: typeof heatmap[] = [];
  let currentWeek: typeof heatmap = [];
  
  // Pad start to align with day of week
  const firstDate = heatmap[0]?.date ? new Date(heatmap[0].date) : new Date();
  const startDay = firstDate.getDay();
  for (let i = 0; i < startDay; i++) {
    currentWeek.push({ date: "", minutes: 0, score: 0, subjectCount: 0 });
  }

  heatmap.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl glass-strong p-6"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
        <div className="icon-bg h-8 w-8">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        Study Heatmap
      </h3>

      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((d, i) => (
            <span key={i} className="text-[9px] text-muted-foreground h-3 flex items-center">{d}</span>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                day.date ? (
                  <Tooltip key={di}>
                    <TooltipTrigger asChild>
                      <div className={`h-3 w-3 rounded-[2px] ${getIntensity(day.minutes)} transition-colors cursor-default`} />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{new Date(day.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</p>
                      <p>{day.minutes} min studied</p>
                      {day.score > 0 && <p>Focus: {day.score}%</p>}
                      {day.subjectCount > 0 && <p>{day.subjectCount} subject{day.subjectCount > 1 ? "s" : ""}</p>}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={di} className="h-3 w-3" />
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-[9px] text-muted-foreground">Less</span>
        {["bg-secondary/30", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80"].map((c, i) => (
          <div key={i} className={`h-3 w-3 rounded-[2px] ${c}`} />
        ))}
        <span className="text-[9px] text-muted-foreground">More</span>
      </div>
    </motion.div>
  );
};

export default StudyHeatmap;
