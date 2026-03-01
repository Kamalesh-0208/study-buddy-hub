import { useState } from "react";
import { ChevronLeft, Video, FileText, ExternalLink, BookOpen, Code, Shield } from "lucide-react";
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
  subSections?: SubSection[];
  resources?: Resource[];
}

const SECTIONS: Section[] = [
  {
    title: "IPR",
    icon: Shield,
    color: "250 70% 56%",
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
    color: "200 70% 50%",
    resources: [
      { label: "HTML & CSS Question Reference", url: "https://drive.google.com/file/d/10I6-fj8cZIBM-yBkyQIvVhNWQLrnnsAb/view?usp=drivesdk", type: "link" },
    ],
  },
  {
    title: "C-Programming",
    icon: BookOpen,
    color: "152 55% 45%",
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

const StudyMaterials = () => {
  const [activeSection, setActiveSection] = useState<Section | null>(null);

  if (activeSection) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <Button
          size="sm"
          variant="ghost"
          className="self-start rounded-xl text-muted-foreground hover:text-foreground"
          onClick={() => setActiveSection(null)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        <div className="flex items-center gap-3">
          <div
            className="icon-circle h-10 w-10"
            style={{
              background: `linear-gradient(135deg, hsl(${activeSection.color} / 0.15), hsl(${activeSection.color} / 0.05))`,
            }}
          >
            <activeSection.icon className="h-5 w-5" style={{ color: `hsl(${activeSection.color})` }} />
          </div>
          <h3 className="text-xl font-bold text-foreground">{activeSection.title}</h3>
        </div>

        {activeSection.resources && (
          <div className="flex flex-col gap-2">
            {activeSection.resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl card-glass p-4"
              >
                <div className="icon-circle h-9 w-9 shrink-0">
                  <ResourceIcon type={r.type} />
                </div>
                <span className="font-medium text-foreground text-sm">{r.label}</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
              </a>
            ))}
          </div>
        )}

        {activeSection.subSections?.map((sub, si) => (
          <div key={si} className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2 px-1">
              {sub.title}
            </h4>
            {sub.resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl card-glass p-4"
              >
                <div className="icon-circle h-9 w-9 shrink-0">
                  <ResourceIcon type={r.type} />
                </div>
                <span className="font-medium text-foreground text-sm">{r.label}</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
              </a>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3 animate-fade-in">
      {SECTIONS.map((section) => {
        const count =
          (section.resources?.length || 0) +
          (section.subSections?.reduce((a, s) => a + s.resources.length, 0) || 0);

        return (
          <button
            key={section.title}
            onClick={() => setActiveSection(section)}
            className="rounded-2xl card-glass card-hover-lift p-6 text-left group"
          >
            <div
              className="icon-circle h-12 w-12 mb-4"
              style={{
                background: `linear-gradient(135deg, hsl(${section.color} / 0.15), hsl(${section.color} / 0.05))`,
              }}
            >
              <section.icon className="h-6 w-6" style={{ color: `hsl(${section.color})` }} />
            </div>
            <h3 className="text-base font-bold text-foreground">{section.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {count} resource{count !== 1 ? "s" : ""}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default StudyMaterials;
