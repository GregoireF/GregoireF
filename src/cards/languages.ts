import { languageShares } from "../data/model";
import { esc, label, round, svg } from "../svg/core";
import type { Card } from "./types";

export const HALF_W = 436;
const H = 210;

export const languages: Card = (t, { data, config }) => {
  const shares = languageShares(data, config.ignoredLanguages, 7);
  const barW = HALF_W - 48;
  let x = 24;
  const segments = shares.map((s) => {
    const w = round((s.percent / 100) * barW);
    const seg = `<rect x="${round(x)}" y="56" width="${Math.max(0, w - 2)}" height="10" fill="${s.color}"/>`;
    x += w;
    return seg;
  });
  const legend = shares.map((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = 24 + col * (barW / 2 + 8);
    const ly = 98 + row * 26;
    return `<g class="fade" style="animation-delay:${(i * 0.05).toFixed(2)}s"><circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${s.color}"/><text x="${lx + 16}" y="${ly}" class="sans text" font-size="13">${esc(s.name)}</text><text x="${lx + barW / 2 - 12}" y="${ly}" text-anchor="end" class="mono faint" font-size="12">${s.percent.toFixed(1)}%</text></g>`;
  });
  const body = `
${label(t, 24, 34, "Languages")}
<clipPath id="bar"><rect x="24" y="56" width="${barW}" height="10" rx="5"/></clipPath>
<g clip-path="url(#bar)">${segments.join("")}</g>
${legend.join("\n")}`;
  return svg(
    t,
    {
      width: HALF_W,
      height: H,
      title: "Languages across my public repos",
      desc: shares.map((s) => `${s.name} ${s.percent.toFixed(1)}%`).join(", "),
    },
    body,
  );
};
