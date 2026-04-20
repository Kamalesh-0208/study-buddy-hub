import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

interface Props {
  doc: string;          // full HTML doc string
  title: string;
}

// Renders the reference HTML/CSS to a static image so students see a "design mockup".
const ReferenceImage = ({ doc, title }: Props) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      setLoading(true);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "-99999px";
      iframe.style.top = "0";
      iframe.style.width = "1024px";
      iframe.style.height = "720px";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      try {
        const d = iframe.contentDocument!;
        d.open(); d.write(doc); d.close();
        await new Promise((r) => setTimeout(r, 400));
        if ((d as any).fonts?.ready) {
          try { await (d as any).fonts.ready; } catch { /* ignore */ }
        }
        const canvas = await html2canvas(d.body, {
          width: 1024, height: 720, windowWidth: 1024, windowHeight: 720,
          backgroundColor: "#ffffff", logging: false, useCORS: true, scale: 1,
        });
        if (!cancelled) setImgUrl(canvas.toDataURL("image/png"));
      } catch (e) {
        console.error("Reference render failed", e);
      } finally {
        document.body.removeChild(iframe);
        if (!cancelled) setLoading(false);
      }
    };
    render();
    return () => { cancelled = true; };
  }, [doc]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Reference UI Design
        </CardTitle>
        <CardDescription className="text-xs">Recreate this design exactly using HTML and CSS.</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="rounded-lg overflow-hidden border bg-white">
          {loading || !imgUrl ? (
            <div className="aspect-[1024/720] flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="h-5 w-5 animate-spin" />
                Rendering design mockup…
              </div>
            </div>
          ) : (
            <img src={imgUrl} alt={`Reference design: ${title}`} className="w-full h-auto block" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferenceImage;
