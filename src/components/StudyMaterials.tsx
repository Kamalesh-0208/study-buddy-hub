import { useState } from "react";
import { ChevronLeft, Video, FileText, ExternalLink } from "lucide-react";
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
  subSections?: SubSection[];
  resources?: Resource[];
}

const SECTIONS: Section[] = [
  {
    title: "IPR",
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
    resources: [
      { label: "HTML & CSS Full Course (English)", url: "https://youtu.be/G3e-cpL7ofc?si=nvLl0yUvI3k75wUG", type: "video" },
      { label: "HTML & CSS Full Course (Tamil)", url: "https://youtu.be/HGTJBPNC-Gw?si=w2cUz-qGYDWuCVJS", type: "video" },
    ],
  },
  {
    title: "Git & GitHub",
    resources: [
      { label: "Git & GitHub Tutorial", url: "https://youtu.be/VIBWdLLq9kQ?si=e1rhMOFJ74-fcpT0", type: "video" },
      { label: "Git & GitHub PDF", url: "https://drive.google.com/file/d/1Qb8I3ovjTqKxLwYFFZsx1tI-8rxL3zkQ/view?usp=drivesdk", type: "pdf" },
    ],
  },
  {
    title: "JavaScript",
    resources: [
      { label: "JavaScript Full Course (English)", url: "https://youtu.be/lfmg-EJ8gm4?si=_hrKAKnvyG7XoxJe", type: "video" },
      { label: "JavaScript Full Course (For English)", url: "https://youtu.be/EerdGm-ehJQ?si=n7FqBVWvrEVba5hp", type: "video" },
    ],
  },
  {
    title: "C-Programming",
    subSections: [
      {
        title: "Video Tutorial",
        resources: [
          { label: "C Programming Full Course", url: "https://youtu.be/fmSnLiAv-zc?si=JvgC1x9fOQiuKY6L", type: "video" },
        ],
      },
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
  if (type === "pdf") return <FileText className="h-4 w-4 text-primary" />;
  return <ExternalLink className="h-4 w-4 text-primary" />;
};

const StudyMaterials = () => {
  const [activeSection, setActiveSection] = useState<Section | null>(null);

  if (activeSection) {
    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          onClick={() => setActiveSection(null)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to Subjects
        </Button>

        <h3 className="text-xl font-bold text-foreground">{activeSection.title}</h3>

        {/* Direct resources */}
        {activeSection.resources && (
          <div className="flex flex-col gap-2">
            {activeSection.resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:bg-accent/50 hover:shadow-md"
              >
                <ResourceIcon type={r.type} />
                <span className="font-medium text-foreground">{r.label}</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}

        {/* Sub-sections */}
        {activeSection.subSections?.map((sub, si) => (
          <div key={si} className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-2">
              {sub.title}
            </h4>
            {sub.resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:bg-accent/50 hover:shadow-md"
              >
                <ResourceIcon type={r.type} />
                <span className="font-medium text-foreground">{r.label}</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
      {SECTIONS.map((section) => (
        <button
          key={section.title}
          onClick={() => setActiveSection(section)}
          className="rounded-xl border bg-card p-6 text-left transition-all hover:bg-accent/50 hover:shadow-md card-shadow"
        >
          <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {(section.resources?.length || 0) +
              (section.subSections?.reduce((a, s) => a + s.resources.length, 0) || 0)}{" "}
            resources
          </p>
        </button>
      ))}
    </div>
  );
};

export default StudyMaterials;
