import { ago, compact } from "../data/model";
import { esc, label, svg, truncate } from "../svg/core";
import { toolColor } from "../svg/theme";
import type { Card } from "./types";

const W = 880;
const H = 132;

/**
 * What I'm doing right now, worked out from the data: the last thing I pushed,
 * the last thing I released, and where my time went this month.
 */
export const now: Card = (t, { data, waka, config, now: n }) => {
  const pushed = data.repos
    .filter((r) => r.name !== config.login && !r.archived && r.lastCommit)
    .sort((a, b) => (b.lastCommit?.date ?? "").localeCompare(a.lastCommit?.date ?? ""))[0];
  const release = data.repos.flatMap((r) => r.releases).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  const week = data.calendar.weeks
    .flat()
    .slice(-7)
    .reduce((s, d) => s + d.count, 0);

  const cols: { title: string; main: string; sub: string; color: string }[] = [];
  if (pushed?.lastCommit) {
    cols.push({
      title: "Last push",
      main: pushed.name,
      sub: `${pushed.lastCommit.message} · ${ago(pushed.lastCommit.date, n)}`,
      color: toolColor(pushed.name, t),
    });
  }
  if (release) {
    cols.push({
      title: "Last release",
      main: `${release.repo} ${release.tag.replace(/^.*@/, "")}`,
      sub: ago(release.publishedAt, n),
      color: toolColor(release.repo, t),
    });
  }
  cols.push(
    waka
      ? {
          title: "This month",
          main: `${Math.round(waka.totalSeconds / 3600)} h of code`,
          sub: `mostly ${waka.languages
            .slice(0, 2)
            .map((l) => l.name)
            .join(" and ")}`,
          color: t.accent3,
        }
      : { title: "This week", main: `${compact(week)} contributions`, sub: "on GitHub, last 7 days", color: t.accent3 },
  );

  const cw = (W - 48) / cols.length;
  const body = cols
    .map((c, i) => {
      const x = 24 + i * cw + (i ? 20 : 0);
      const w = cw - 32;
      return `<g class="fade" style="animation-delay:${(i * 0.1).toFixed(1)}s">
  ${label(t, x, 66, c.title)}
  <text x="${x}" y="92" class="mono b" font-size="15" fill="${c.color}">${esc(truncate(c.main, w, 15, "mono", 600))}</text>
  <text x="${x}" y="113" class="sans" font-size="12.5" fill="${t.muted}">${esc(truncate(c.sub, w, 12.5))}</text>
</g>${i ? `<line x1="${24 + i * cw}" y1="54" x2="${24 + i * cw}" y2="116" stroke="${t.border}"/>` : ""}`;
    })
    .join("\n");

  return svg(
    t,
    {
      width: W,
      height: H,
      title: "Now",
      desc: cols.map((c) => `${c.title}: ${c.main}, ${c.sub}`).join(". "),
      grid: true,
      glows: [{ x: 40, y: 20, r: 200, color: t.ok, opacity: t.name === "dark" ? 0.12 : 0.07 }],
      style: "@keyframes live { 50% { opacity: .25; } }",
    },
    `<circle cx="32" cy="31" r="4.5" fill="${t.ok}" style="animation:live 2s ease-in-out infinite"/>
<text x="44" y="35.5" class="mono b" font-size="12" letter-spacing="1.4" fill="${t.ok}">NOW</text>
<text x="${W - 24}" y="35.5" text-anchor="end" class="mono" font-size="11" fill="${t.faint}">worked out from GitHub${waka ? " and WakaTime" : ""}, every 30 minutes</text>
${body}`,
  );
};
