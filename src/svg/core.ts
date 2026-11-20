import { FAMILY_NAME, type Family, measure, type Weight } from "./fonts";
import { fallbackFont, type Theme } from "./theme";

export const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Rendered width in px, measured with the embedded font. */
export const textWidth = (s: string, size: number, family: Family = "sans", weight: Weight = 400): number =>
  measure(s, size, family, weight);

/** Word wrap on real widths. Adds an ellipsis when it runs out of lines. */
export const wrap = (s: string, width: number, size: number, maxLines = 3, family: Family = "sans", weight: Weight = 400): string[] => {
  const words = s.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  let used = 0;
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (textWidth(next, size, family, weight) <= width) {
      line = next;
      used++;
      continue;
    }
    if (lines.length === maxLines - 1) break;
    if (line) lines.push(line);
    line = w;
    used++;
  }
  if (line) lines.push(line);
  if (used < words.length && lines.length) {
    lines[lines.length - 1] = truncate(`${lines[lines.length - 1]}…`, width, size, family, weight);
  }
  return lines;
};

export const truncate = (s: string, width: number, size: number, family: Family = "sans", weight: Weight = 400): string => {
  if (textWidth(s, size, family, weight) <= width) return s;
  const chars = [...s];
  while (chars.length > 1 && textWidth(`${chars.join("")}…`, size, family, weight) > width) chars.pop();
  return `${chars.join("").trimEnd()}…`;
};

export const round = (n: number): number => Math.round(n * 10) / 10;

const baseStyle = (t: Theme, extra: string) => `/*@fonts*/
  .sans { font-family: "${FAMILY_NAME.sans}", ${fallbackFont.sans}; }
  .mono { font-family: "${FAMILY_NAME.mono}", ${fallbackFont.mono}; }
  .text { fill: ${t.text}; }
  .muted { fill: ${t.muted}; }
  .faint { fill: ${t.faint}; }
  .accent { fill: ${t.accent}; }
  .ok { fill: ${t.ok}; }
  .b { font-weight: 600; }
  @keyframes fade { from { opacity: 0; transform: translateY(4px); } }
  .fade { animation: fade .7s cubic-bezier(.2,.8,.2,1) both; }
  ${extra}
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`;

interface Glow {
  x: number;
  y: number;
  r: number;
  color: string;
  opacity?: number;
}

export interface SvgOptions {
  width: number;
  height: number;
  title: string;
  desc?: string;
  style?: string;
  /** Rounded card frame (default). Off for headers and buttons that sit on the page. */
  frame?: boolean;
  /** Faint grid behind the content. */
  grid?: boolean;
  /** Soft colour halos behind the content, clipped to the card. */
  glows?: Glow[];
  radius?: number;
}

export const gradientId = "g-accent";

/** The signature gradient, indigo to violet to cyan. */
const accentGradient = (t: Theme) =>
  `<linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.accent}"/><stop offset=".55" stop-color="${t.accent2}"/><stop offset="1" stop-color="${t.accent3}"/></linearGradient>`;

export const svg = (t: Theme, o: SvgOptions, body: string): string => {
  const frame = o.frame !== false;
  const r = o.radius ?? 14;
  const w = o.width;
  const h = o.height;
  const glows = (o.glows ?? [])
    .map(
      (g, i) =>
        `<radialGradient id="glow${i}"><stop offset="0" stop-color="${g.color}" stop-opacity="${g.opacity ?? (t.name === "dark" ? 0.22 : 0.12)}"/><stop offset="1" stop-color="${g.color}" stop-opacity="0"/></radialGradient>`,
    )
    .join("");
  const ambient = `${o.grid ? `<rect width="${w}" height="${h}" fill="url(#grid)"/>` : ""}${(o.glows ?? [])
    .map((g, i) => `<circle cx="${g.x}" cy="${g.y}" r="${g.r}" fill="url(#glow${i})"/>`)
    .join("")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(o.title)}</title>
<desc id="d">${esc(o.desc ?? o.title)}</desc>
<defs>
  ${accentGradient(t)}${glows}
  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${t.grid}" stroke-opacity="${t.name === "dark" ? 0.045 : 0.05}"/></pattern>
  <clipPath id="card"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${r}"/></clipPath>
</defs>
<style>${baseStyle(t, o.style ?? "")}</style>
${frame ? `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${r}" fill="${t.panel}"/>` : ""}
${ambient ? `<g clip-path="url(#card)">${ambient}</g>` : ""}
${frame ? `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${r}" fill="none" stroke="${t.border}"/>` : ""}
${body}
</svg>
`;
};

/** Small caps label used at the top-left of most cards. */
export const label = (t: Theme, x: number, y: number, text: string, color = t.faint): string =>
  `<text x="${x}" y="${y}" class="mono" font-size="11" letter-spacing="1.4" fill="${color}">${esc(text.toUpperCase())}</text>`;
