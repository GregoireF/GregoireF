import { ago } from "../data/model";
import { esc, label, svg, truncate } from "../svg/core";
import type { Card } from "./types";

const W = 880;
const MAX_LINES = 7;

/** The last command a visitor ran from an issue, with its real output. */
export const play: Card<"play" | "now"> = (t, { play: state, now }) => {
  const last = state.last;
  const lines = last ? last.output.slice(0, MAX_LINES) : [];
  const more = last && last.output.length > MAX_LINES ? last.output.length - MAX_LINES : 0;
  const H = last ? 124 + Math.max(1, lines.length + (more ? 1 : 0)) * 20 + 30 : 128;

  if (!last) {
    return svg(
      t,
      { width: W, height: H, grid: true, title: "Last run", desc: "Nobody has run a command yet." },
      `${label(t, 32, 34, "Last run")}
<text x="32" y="76" class="sans text" font-size="15">Nobody has run anything yet.</text>
<text x="32" y="100" class="sans muted" font-size="13">Pick a command above. Yours will show up here.</text>`,
    );
  }

  const body = `
${label(t, 32, 34, "Last run")}
<text x="${W - 32}" y="34" text-anchor="end" class="sans faint" font-size="12">${state.runs.toLocaleString("en-US")} run${state.runs > 1 ? "s" : ""} so far</text>
<text x="32" y="68" class="sans text" font-size="14"><tspan class="b">@${esc(last.user)}</tspan><tspan class="muted"> ran it ${esc(ago(last.at, now))}</tspan></text>
<rect x="24" y="84" width="${W - 48}" height="${H - 84 - 18}" rx="8" fill="${t.bg}" stroke="${t.border}"/>
<text x="44" y="110" class="mono" font-size="13.5"><tspan fill="${t.accent}" class="b">❯ </tspan><tspan fill="${t.text}">${esc(truncate(last.command, W - 140, 13.5, "mono"))}</tspan></text>
<text x="${W - 44}" y="110" text-anchor="end" class="mono" font-size="12" fill="${last.ok ? t.ok : t.warn}">${last.ok ? "exit 0" : "exit ≠ 0"}</text>
${lines.map((l, i) => `<text x="44" y="${136 + i * 20}" xml:space="preserve" class="mono muted fade" font-size="12.5" style="animation-delay:${(i * 0.06).toFixed(2)}s">${esc(truncate(l, W - 100, 12.5, "mono"))}</text>`).join("\n")}
${more ? `<text x="44" y="${136 + lines.length * 20}" class="mono faint" font-size="12">… ${more} more lines in issue #${last.issue}</text>` : ""}`;

  return svg(
    t,
    { width: W, height: H, grid: true, title: "Last run", desc: `@${last.user} ran ${last.command}: ${lines.join(" / ")}` },
    body,
  );
};
