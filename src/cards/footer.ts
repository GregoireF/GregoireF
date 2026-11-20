import { readdirSync } from "node:fs";
import { esc, gradientId, svg, textWidth, truncate } from "../svg/core";
import { toolColor } from "../svg/theme";
import type { Card } from "./types";

const W = 880;
const H = 118;

const workflowCount = () => {
  try {
    return readdirSync(".github/workflows").filter((f) => /\.ya?ml$/.test(f)).length;
  } catch {
    return 0;
  }
};

/** Signature at the bottom: name, motto, and how this page was made. */
export const footer: Card = (t, { config, hero, now }) => {
  const filmed = new Date(hero.capturedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const versions = hero.scenes.map((s) => ({ tool: s.tool, v: hero.versions[s.tool] ?? "" }));
  let vx = W - 28;
  const chips = [...versions]
    .reverse()
    .map((x) => {
      const text = `${x.tool} ${x.v}`;
      const w = textWidth(`● ${text}`, 12, "mono");
      vx -= w;
      const out = `<text x="${vx}" y="76" class="mono" font-size="12" fill="${t.muted}"><tspan fill="${toolColor(x.tool, t)}">●</tspan> ${esc(text)}</text>`;
      vx -= 18;
      return out;
    })
    .join("");
  return svg(
    t,
    {
      width: W,
      height: H,
      title: `${config.name}. ${config.motto}`,
      desc: `Header filmed on ${filmed}. ${workflowCount()} workflows keep this page up to date.`,
      grid: true,
      glows: [
        { x: 0, y: H, r: 240, color: t.accent },
        { x: W, y: 0, r: 240, color: t.accent3, opacity: t.name === "dark" ? 0.1 : 0.06 },
      ],
    },
    `<rect x="28" y="30" width="48" height="3" rx="1.5" fill="url(#${gradientId})"/>
<text x="28" y="60" class="sans b" font-size="19" fill="${t.text}">${esc(config.name)}</text>
<text x="28" y="84" class="sans" font-size="13.5" fill="${t.muted}">${esc(truncate(config.motto, 420, 13.5))}</text>
<text x="${W - 28}" y="52" text-anchor="end" class="mono" font-size="11" letter-spacing="1.2" fill="${t.faint}">HEADER FILMED ${esc(filmed.toUpperCase())}</text>
${chips}
<text x="${W - 28}" y="98" text-anchor="end" class="mono" font-size="11.5" fill="${t.faint}">${workflowCount()} workflows · refreshed every 30 min · <tspan fill="${t.accent}">how it works ↗</tspan></text>
<text x="28" y="104" class="mono" font-size="10.5" fill="${t.faint}">updated ${esc(now.toISOString().slice(0, 10))}</text>`,
  );
};
