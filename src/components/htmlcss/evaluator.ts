// Weighted scoring for HTML/CSS challenges
// Layout structure 40% | CSS correctness 30% | Visual similarity 30%

import html2canvas from "html2canvas";

export interface ScoreBreakdown {
  layout: number;       // 0..100
  css: number;          // 0..100
  visual: number;       // 0..100
  final: number;        // 0..100 weighted
  passed: boolean;      // final >= 80
}

// ---------- Layout (40%) ----------
// Compare DOM tag sequences via Jaccard on bigrams of tag names.

function getTagSequence(htmlString: string): string[] {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  const tags: string[] = [];
  doc.body?.querySelectorAll("*").forEach((el) => tags.push(el.tagName.toLowerCase()));
  return tags;
}

function bigrams(arr: string[]): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < arr.length - 1; i++) s.add(`${arr[i]}>${arr[i + 1]}`);
  return s;
}

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  a.forEach((x) => { if (b.has(x)) inter++; });
  return inter / (a.size + b.size - inter);
}

export function scoreLayout(studentHtml: string, referenceHtml: string): number {
  const sTags = getTagSequence(studentHtml);
  const rTags = getTagSequence(referenceHtml);
  if (rTags.length === 0) return 0;

  // Tag-set similarity (presence of right elements)
  const setSim = jaccard(new Set(sTags), new Set(rTags));
  // Order similarity via bigram overlap
  const orderSim = jaccard(bigrams(sTags), bigrams(rTags));
  // Density similarity (penalises wildly different element counts)
  const ratio = Math.min(sTags.length, rTags.length) / Math.max(sTags.length, rTags.length);

  return Math.round((setSim * 0.4 + orderSim * 0.4 + ratio * 0.2) * 100);
}

// ---------- CSS (30%) ----------
// Parse declarations into property:value pairs and compute overlap.

function extractDeclarations(cssText: string): Set<string> {
  const decls = new Set<string>();
  // Strip comments
  const clean = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  // Match every "prop: value;" pair anywhere
  const re = /([a-zA-Z\-]+)\s*:\s*([^;{}]+)\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const prop = m[1].toLowerCase().trim();
    const val = m[2].toLowerCase().replace(/\s+/g, " ").trim();
    decls.add(`${prop}:${val}`);
  }
  return decls;
}

function extractProperties(cssText: string): Set<string> {
  const props = new Set<string>();
  extractDeclarations(cssText).forEach((d) => props.add(d.split(":")[0]));
  return props;
}

export function scoreCSS(studentCss: string, referenceCss: string): number {
  const sDecls = extractDeclarations(studentCss);
  const rDecls = extractDeclarations(referenceCss);
  if (rDecls.size === 0) return 0;
  const sProps = extractProperties(studentCss);
  const rProps = extractProperties(referenceCss);

  const propOverlap = jaccard(sProps, rProps);          // properties used
  const declOverlap = jaccard(sDecls, rDecls);          // exact value match (rewarded extra)

  return Math.round((propOverlap * 0.6 + declOverlap * 0.4) * 100);
}

// ---------- Visual (30%) ----------
// Render both pages to canvas at the same size, downscale, compare pixels.

async function renderToCanvas(html: string, width = 800, height = 600): Promise<HTMLCanvasElement> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
    // Wait for fonts/images
    await new Promise((r) => setTimeout(r, 350));
    if ((doc as any).fonts?.ready) {
      try { await (doc as any).fonts.ready; } catch { /* ignore */ }
    }
    const canvas = await html2canvas(doc.body, {
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      scale: 1,
    });
    return canvas;
  } finally {
    document.body.removeChild(iframe);
  }
}

function downscale(src: HTMLCanvasElement, w: number, h: number): ImageData {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(src, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function pixelSimilarity(a: ImageData, b: ImageData): number {
  const len = a.data.length;
  let diff = 0;
  for (let i = 0; i < len; i += 4) {
    const dr = a.data[i] - b.data[i];
    const dg = a.data[i + 1] - b.data[i + 1];
    const db = a.data[i + 2] - b.data[i + 2];
    diff += (Math.abs(dr) + Math.abs(dg) + Math.abs(db)) / 3;
  }
  const pixels = len / 4;
  const avgDiff = diff / pixels; // 0..255
  return Math.max(0, 1 - avgDiff / 255);
}

export interface VisualResult {
  similarity: number;          // 0..100
  studentDataUrl: string;
  referenceDataUrl: string;
}

export async function scoreVisual(
  studentHtml: string,
  referenceHtml: string,
): Promise<VisualResult> {
  const [sCanvas, rCanvas] = await Promise.all([
    renderToCanvas(studentHtml),
    renderToCanvas(referenceHtml),
  ]);
  const sData = downscale(sCanvas, 80, 60);
  const rData = downscale(rCanvas, 80, 60);
  const sim = pixelSimilarity(sData, rData);
  return {
    similarity: Math.round(sim * 100),
    studentDataUrl: sCanvas.toDataURL("image/png"),
    referenceDataUrl: rCanvas.toDataURL("image/png"),
  };
}

// ---------- Combined ----------

export function combineScores(layout: number, css: number, visual: number): ScoreBreakdown {
  const final = Math.round(layout * 0.4 + css * 0.3 + visual * 0.3);
  return { layout, css, visual, final, passed: final >= 80 };
}

// Build a complete HTML doc from separate html + css strings (handles either
// a full document with <link rel="stylesheet" href="styles.css"> or a body
// fragment).
export function buildDoc(htmlCode: string, cssCode: string): string {
  const linkRe = /<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/?>/i;
  if (linkRe.test(htmlCode)) {
    return htmlCode.replace(linkRe, `<style>${cssCode}</style>`);
  }
  if (/<\/head>/i.test(htmlCode)) {
    return htmlCode.replace(/<\/head>/i, `<style>${cssCode}</style></head>`);
  }
  if (/<html/i.test(htmlCode)) {
    return htmlCode.replace(/<html[^>]*>/i, (m) => `${m}<head><style>${cssCode}</style></head>`);
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${cssCode}</style></head><body>${htmlCode}</body></html>`;
}
