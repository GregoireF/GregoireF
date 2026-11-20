import { esc, label, round, svg } from "../svg/core";
import { HALF_W } from "./languages";
import type { Card } from "./types";

const H = 210;

const hours = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};

export const wakatime: Card = (t, { waka }) => {
  if (!waka) {
    return svg(
      t,
      { width: HALF_W, height: H, title: "Coding time", desc: "No WakaTime data right now." },
      `${label(t, 24, 34, "Coding time · 30 days")}<text x="24" y="${H / 2 + 6}" class="sans muted" font-size="13">No WakaTime data right now.</text>`,
    );
  }
  const barMax = HALF_W - 48 - 130;
  const rows = waka.languages.slice(0, 4).map((l, i) => {
    const y = 120 + i * 22;
    return `<g class="fade" style="animation-delay:${(i * 0.06).toFixed(2)}s">
  <text x="24" y="${y}" class="sans text" font-size="12.5">${esc(l.name)}</text>
  <rect x="120" y="${y - 9}" width="${barMax}" height="8" rx="4" fill="${t.border}"/>
  <rect x="120" y="${y - 9}" width="${round(Math.max(4, (l.percent / 100) * barMax))}" height="8" rx="4" fill="url(#g-accent)"/>
  <text x="${HALF_W - 24}" y="${y}" text-anchor="end" class="mono faint" font-size="12">${l.percent.toFixed(0)}%</text>
</g>`;
  });
  const body = `
${label(t, 24, 34, "Coding time · 30 days")}
<text x="24" y="76" class="mono b text" font-size="28">${esc(hours(waka.totalSeconds))}</text>
<text x="${HALF_W - 24}" y="76" text-anchor="end" class="sans muted" font-size="12">${esc(hours(waka.dailyAverage))} a day</text>
${rows.join("\n")}`;
  return svg(
    t,
    {
      width: HALF_W,
      height: H,
      title: "Coding time over the last 30 days",
      desc: `${hours(waka.totalSeconds)} in 30 days. ${waka.languages.map((l) => `${l.name} ${l.percent.toFixed(0)}%`).join(", ")}`,
    },
    body,
  );
};
