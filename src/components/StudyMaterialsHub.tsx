import { useState } from "react";
import { ChevronLeft, Video, FileText, ExternalLink, BookOpen, Code, Shield, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Resource {
  label: string;
  url: string;
  type: "video" | "pdf" | "link";
}

interface SubSection {
  title: string;
  resources: Resource[];
}

interface Section {
  title: string;
  icon: React.ElementType;
  color: string;
  progress: number;
  lastStudied: string;
  subSections?: SubSection[];
  resources?: Resource[];
}

const SECTIONS: Section[] = [
  {
    title: "IPR",
    icon: Shield,
    color: "252 72% 58%",
    progress: 45,
    lastStudied: "2 hours ago",
    subSections: [
      {
        title: "IPR Level-1 Study Material",
        resources: [
          { label: "Google Patents", url: "https://drive.google.com/file/d/1KopRomEnUyRa2JqenC8Wo172DHoHLcFC/view?usp=drivesdk", type: "video" },
          { label: "Wipo/Patentoscope", url: "https://drive.google.com/file/d/1qh6n6PHx06WQ9no28aX7HUteEwrAL_cL/view?usp=drivesdk", type: "video" },
          { label: "Espacenet", url: "https://drive.google.com/file/d/1rWn5WiUH3ZTuK1cQyJeaZe_HH-_x4E8J/view?usp=drivesdk", type: "video" },
        ],
      },
    ],
  },
  {
    title: "HTML & CSS",
    icon: Code,
    color: "210 70% 55%",
    progress: 72,
    lastStudied: "Yesterday",
    resources: [
      { label: "HTML & CSS Question Reference", url: "https://drive.google.com/file/d/10I6-fj8cZIBM-yBkyQIvVhNWQLrnnsAb/view?usp=drivesdk", type: "link" },
    ],
  },
  {
    title: "C-Programming",
    icon: BookOpen,
    color: "152 58% 42%",
    progress: 30,
    lastStudied: "3 days ago",
    subSections: [
      {
        title: "C-2 Practice Questions",
        resources: [
          { label: "C-2 Question Paper", url: "https://drive.google.com/file/d/1thNTSibrkdELt2XYQO2NpRuTeK0MSV7U/view?usp=drivesdk", type: "pdf" },
          { label: "C-2 Question Bank", url: "https://docs.google.com/document/d/17z91YarGn8F8S36uu_mNtEUHJ4MhE7Px_CVObrf4eew/edit?tab=t.0", type: "link" },
        ],
      },
      {
        title: "C-3 Practice Questions",
        resources: [
          { label: "C-3 Question Paper", url: "https://drive.google.com/file/d/1tbvqg1grCtDmuypyhHdqDXndnMgfZQOE/view?usp=drivesdk", type: "pdf" },
          { label: "QB - C Level 3 Final", url: "https://docs.google.com/document/d/QB-C-Level-3-final", type: "link" },
        ],
      },
    ],
  },
];

const ResourceIcon = ({ type }: { type: Resource["type"] }) => {
  if (type === "video") return <Video className="h-4 w-4 text-primary" />;
  if (type === "pdf") return <FileText className="h-4 w-4 text-accent" />;
  return <ExternalLink className="h-4 w-4 text-primary" />;
};

// Mini progress ring
const ProgressRing = ({ progress, color, size = 40 }: { progress: number; color: string; size?: number }) => {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="3" className="stroke-secondary" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="3"
        stroke={`hsl(${color})`} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - progress / 100)}
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
    </svg>
  );
};

const StudyMaterialsHub = () => {
  const [activeSection, setActiveSection] = useState<Section | null>(null);

  if (activeSection) {
    return (
      <div className="rounded-2xl glass-strong p-6 animate-fade-in">
        <Button size="sm" variant="ghost" onClick={() => setActiveSection(null)}
          className="mb-4 rounded-xl text-muted-foreground hover:text-foreground text-xs">
          <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back
        </Button>

        <div className="flex items-center gap-3 mb-5">
          <div className="icon-bg h-10 w-10" style={{ background: `linear-gradient(135deg, hsl(${activeSection.color} / 0.12), hsl(${activeSection.color} / 0.04))` }}>
            <activeSection.icon className="h-5 w-5" style={{ color: `hsl(${activeSection.color})` }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{activeSection.title}</h3>
            <p className="text-[11px] text-muted-foreground">{activeSection.progress}% complete</p>
          </div>
        </div>

        {activeSection.resources && (
          <div className="flex flex-col gap-2">
            {activeSection.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl p-3.5 bg-secondary/30 border border-border/30 card-hover hover:bg-secondary/60">
                <div className="icon-bg h-9 w-9 shrink-0"><ResourceIcon type={r.type} /></div>
                <span className="text-sm font-medium text-foreground">{r.label}</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />
              </a>
            ))}
          </div>
        )}

        {activeSection.subSections?.map((sub, si) => (
          <div key={si} className="mt-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">{sub.title}</h4>
            <div className="flex flex-col gap-2">
              {sub.resources.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl p-3.5 bg-secondary/30 border border-border/30 card-hover hover:bg-secondary/60">
                  <div className="icon-bg h-9 w-9 shrink-0"><ResourceIcon type={r.type} /></div>
                  <span className="text-sm font-medium text-foreground">{r.label}</span>
                  <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-strong p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="icon-bg h-8 w-8"><BookOpen className="h-4 w-4 text-primary" /></div>
          Study Materials
        </h3>
        <Button size="sm" variant="outline" className="rounded-xl h-8 px-3 text-xs border-border/40">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <div className="grid gap-3">
        {SECTIONS.map((section) => {
          const count = (section.resources?.length || 0) + (section.subSections?.reduce((a, s) => a + s.resources.length, 0) || 0);
          return (
            <button key={section.title} onClick={() => setActiveSection(section)}
              className="flex items-center gap-4 rounded-xl p-4 bg-secondary/20 border border-border/20 card-hover hover:bg-secondary/40 text-left w-full">
              <div className="relative shrink-0">
                <ProgressRing progress={section.progress} color={section.color} size={48} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-foreground">{section.progress}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">{count} resources</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{section.lastStudied}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudyMaterialsHub;
