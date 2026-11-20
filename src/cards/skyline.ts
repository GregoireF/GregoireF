import { label, round, svg } from "../svg/core";
import type { Card } from "./types";

const W = 880;
const H = 250;

/**
 * The contribution calendar as a city: one building per week. Height follows
 * the week's total, lit windows are the days you contributed, colour is the
 * busiest day of the week.
 */
export const skyline: Card = (t, { data }) => {
  const weeks = data.calendar.weeks;
  const ground = H - 44;
  const maxH = 138;
  const left = 32;
  const step = (W - left * 2) / Math.max(weeks.length, 1);
  const bw = Math.max(4, step * 0.74);
  const totals = weeks.map((w) => w.reduce((s, d) => s + d.count, 0));
  const peak = Math.max(1, ...totals);
  const dayPeak = Math.max(1, ...weeks.flat().map((d) => d.count));
  const level = (c: number) => (c === 0 ? 0 : Math.min(4, 1 + Math.floor((c / dayPeak) * 3.999)));

  const buildings = weeks.map((week, i) => {
    const total = totals[i];
    const h = total === 0 ? 3 : round(8 + Math.sqrt(total / peak) * (maxH - 8));
    const x = round(left + i * step + (step - bw) / 2);
    const y = round(ground - h);
    const busiest = Math.max(0, ...week.map((d) => d.count));
    const fill = t.heat[level(busiest)];
    const windows = week
      .map((d, j) => {
        if (h < 22 || d.count === 0) return "";
        const wy = round(y + 6 + j * Math.min(7, (h - 10) / 7));
        return `<rect x="${round(x + bw / 2 - 1.25)}" y="${wy}" width="2.5" height="2.5" fill="${t.name === "dark" ? "#fde68a" : "#ffffff"}" fill-opacity="${0.5 + level(d.count) * 0.12}"/>`;
      })
      .join("");
    return `<g class="rise" style="animation-delay:${(i * 0.012).toFixed(3)}s"><rect x="${x}" y="${y}" width="${round(bw)}" height="${h}" rx="1.5" fill="${fill}"><title>Week of ${week[0]?.date}: ${total} contributions</title></rect>${windows}</g>`;
  });

  const months: string[] = [];
  let last = "";
  weeks.forEach((w, i) => {
    const m = w[0] ? new Date(`${w[0].date}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) : "";
    if (m && m !== last && i < weeks.length - 2) {
      months.push(`<text x="${round(left + i * step)}" y="${ground + 22}" class="mono faint" font-size="11">${m}</text>`);
      last = m;
    }
  });

  const body = `
${label(t, 32, 34, "A year of contributions")}
<text x="${W - 32}" y="34" text-anchor="end" class="sans muted" font-size="12"><tspan class="b text">${data.calendar.total.toLocaleString("en-US")}</tspan> contributions</text>
${buildings.join("\n")}
<rect x="${left - 8}" y="${ground}" width="${W - (left - 8) * 2}" height="2" rx="1" fill="url(#g-accent)"/>
${months.join("")}`;

  return svg(
    t,
    {
      width: W,
      height: H,
      title: "Contribution skyline",
      desc: `${data.calendar.total} contributions over the last year, one building per week.`,
      style: `@keyframes rise { from { transform: scaleY(0); } }
  .rise { transform-box: fill-box; transform-origin: 50% 100%; animation: rise .7s cubic-bezier(.2,.8,.2,1) both; }`,
    },
    body,
  );
};
