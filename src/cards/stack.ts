import * as icons from "simple-icons";
import { esc, label, svg, truncate } from "../svg/core";
import type { Theme } from "../svg/theme";
import type { Card } from "./types";

const W = 880;
const ROW = 74;
const LABEL_W = 150;
const TILE = 42;

interface Icon {
  title: string;
  slug: string;
  hex: string;
  path: string;
}

const bySlug = new Map<string, Icon>(
  (Object.values(icons) as unknown[])
    .filter((x): x is Icon => typeof x === "object" && x !== null && "slug" in x && "path" in x)
    .map((i) => [i.slug, i]),
);

export const iconFor = (slug: string): Icon => {
  const icon = bySlug.get(slug);
  if (!icon) throw new Error(`stack: unknown Simple Icons slug "${slug}" (see simpleicons.org)`);
  return icon;
};

const rgb = (hex: string) => [0, 2, 4].map((i) => Number.parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255);
const lum = (hex: string) => {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const mix = (hex: string, to: string, k: number) => {
  const a = rgb(hex);
  const b = rgb(to);
  return `#${a
    .map((c, i) =>
      Math.round((c + (b[i] - c) * k) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

/** The brand colour, nudged toward white or black until it reads on the tile. */
export const readable = (hex: string, t: Theme): string => {
  const bg = t.panel2;
  const target = t.name === "dark" ? "#ffffff" : "#000000";
  let c = `#${hex}`;
  for (let k = 0.15; contrast(c, bg) < 3 && k <= 1; k += 0.15) c = mix(`#${hex}`, target, k);
  return c;
};

export const stack: Card = (t, { config }) => {
  const rows = config.stack;
  const H = 62 + rows.length * ROW;
  const step = (W - 24 - LABEL_W - 24) / Math.max(...rows.map((r) => r.items.length), 6);
  let n = 0;
  const body = rows
    .map((row, ri) => {
      const y = 58 + ri * ROW;
      const tiles = row.items
        .map((slug, i) => {
          const icon = iconFor(slug);
          const x = 24 + LABEL_W + i * step;
          const color = readable(icon.hex, t);
          const delay = (n++ * 0.025).toFixed(3);
          return `<g class="fade" style="animation-delay:${delay}s">
  <rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="11" fill="${t.panel2}" stroke="${t.border}"/>
  <svg x="${x + 10}" y="${y + 10}" width="22" height="22" viewBox="0 0 24 24"><path fill="${color}" d="${icon.path}"/></svg>
  <text x="${x + TILE / 2}" y="${y + TILE + 15}" text-anchor="middle" class="sans" font-size="10.5" fill="${t.muted}">${esc(truncate(icon.title.replace(/\s*Proxy$/, ""), step - 6, 10.5))}</text>
</g>`;
        })
        .join("");
      return `${label(t, 24, y + TILE / 2 + 4, row.label)}${ri ? `<line x1="24" y1="${y - 10}" x2="${W - 24}" y2="${y - 10}" stroke="${t.border}" stroke-opacity=".6"/>` : ""}${tiles}`;
    })
    .join("\n");
  const names = rows.flatMap((r) => r.items.map((s) => iconFor(s).title));
  return svg(
    t,
    {
      width: W,
      height: H,
      title: "Stack",
      desc: rows.map((r) => `${r.label}: ${r.items.map((s) => iconFor(s).title).join(", ")}`).join(". "),
      grid: true,
      glows: [{ x: W - 60, y: H, r: 260, color: t.accent3 }],
    },
    `<text x="24" y="34" class="mono" font-size="11" letter-spacing="1.4" fill="${t.faint}">WHAT I WORK WITH</text>
<text x="${W - 24}" y="34" text-anchor="end" class="mono" font-size="11" fill="${t.faint}">${names.length} tools, day to day</text>
${body}`,
  );
};
