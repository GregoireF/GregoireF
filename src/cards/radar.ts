import { ago, recentReleases } from "../data/model";
import { esc, label, svg, textWidth } from "../svg/core";
import { toolColor } from "../svg/theme";
import type { Card } from "./types";

const W = 880;
const ROW = 36;
const FRESH_DAYS = 14;

/** The latest releases across every public repo, newest first, on a timeline. */
export const radar: Card = (t, { data, now }) => {
  const releases = recentReleases(data, 6);
  const top = 70;
  const H = top + Math.max(1, releases.length) * ROW + 14;
  const lineX = 150;

  const rows = releases.map((r, i) => {
    const y = top + i * ROW;
    const date = new Date(r.publishedAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Europe/Paris",
    });
    const fresh = now.getTime() - new Date(r.publishedAt).getTime() < FRESH_DAYS * 86_400_000;
    const nameW = textWidth(r.repo, 14, "mono");
    const tag = r.tag.replace(/^.*@/, "");
    const tagW = textWidth(tag, 12, "mono") + 16;
    const c = toolColor(r.repo, t);
    return `<g class="fade" style="animation-delay:${(i * 0.08).toFixed(2)}s">
  <text x="32" y="${y + 5}" class="mono faint" font-size="12">${esc(date)}</text>
  <circle cx="${lineX}" cy="${y}" r="${fresh ? 6 : 4.5}" fill="${fresh ? c : t.panel}" stroke="${c}" stroke-width="1.5"/>
  ${fresh ? `<circle cx="${lineX}" cy="${y}" r="6" fill="none" stroke="${c}" style="animation:ping 2.2s ease-out infinite;transform-box:fill-box;transform-origin:center"/>` : ""}
  <text x="${lineX + 22}" y="${y + 5}" class="mono b text" font-size="14">${esc(r.repo)}</text>
  <rect x="${lineX + 32 + nameW}" y="${y - 11}" width="${tagW}" height="21" rx="10.5" fill="none" stroke="${fresh ? c : t.border}"/>
  <text x="${lineX + 32 + nameW + tagW / 2}" y="${y + 4}" text-anchor="middle" class="mono" font-size="12" fill="${fresh ? c : t.muted}">${esc(tag)}</text>
  <text x="${W - 32}" y="${y + 5}" text-anchor="end" class="sans ${fresh ? "accent" : "faint"}" font-size="12">${esc(ago(r.publishedAt, now))}</text>
</g>`;
  });

  const body = `
${label(t, 32, 34, "Release radar")}
<text x="${W - 32}" y="34" text-anchor="end" class="sans faint" font-size="12">latest releases across my repos</text>
${releases.length > 1 ? `<line x1="${lineX}" y1="${top}" x2="${lineX}" y2="${top + (releases.length - 1) * ROW}" stroke="${t.border}" stroke-width="2"/>` : ""}
${rows.join("\n") || `<text x="32" y="${top + 4}" class="sans muted" font-size="13">No release yet.</text>`}`;

  return svg(
    t,
    {
      width: W,
      height: H,
      title: "Release radar",
      desc: releases.map((r) => `${r.repo} ${r.tag}, ${ago(r.publishedAt, now)}`).join("; "),
      style: "@keyframes ping { from { opacity: .8; transform: scale(1); } to { opacity: 0; transform: scale(2.6); } }",
    },
    body,
  );
};
