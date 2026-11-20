import { compact, numbers } from "../data/model";
import { esc, svg } from "../svg/core";
import type { Card } from "./types";

const W = 880;
const H = 104;

export const stats: Card = (t, { data }) => {
  const n = numbers(data);
  const cells: [string, string][] = [
    [compact(n.contributions), "contributions, last 12 months"],
    [`${n.streak}d`, "current streak"],
    [compact(n.pullRequests), "pull requests, 12 months"],
    [compact(n.releases), "releases shipped"],
    [compact(n.followers), "followers"],
  ];
  const cw = (W - 32) / cells.length;
  const body = cells
    .map(([value, caption], i) => {
      const cx = 16 + cw * i + cw / 2;
      return `<g class="fade" style="animation-delay:${(i * 0.07).toFixed(2)}s">
  <text x="${cx}" y="54" text-anchor="middle" class="mono b text" font-size="28">${esc(value)}</text>
  <text x="${cx}" y="78" text-anchor="middle" class="sans faint" font-size="11.5">${esc(caption)}</text>
</g>${i ? `<line x1="${16 + cw * i}" y1="30" x2="${16 + cw * i}" y2="${H - 26}" stroke="${t.border}"/>` : ""}`;
    })
    .join("\n");
  return svg(
    t,
    {
      width: W,
      height: H,
      grid: true,
      glows: [{ x: 440, y: 0, r: 260, color: t.accent }],
      title: "GitHub numbers",
      desc: cells.map(([v, c]) => `${v} ${c}`).join(", "),
    },
    body,
  );
};
