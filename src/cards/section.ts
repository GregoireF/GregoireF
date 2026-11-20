import { esc, gradientId, svg, textWidth } from "../svg/core";
import type { Theme } from "../svg/theme";

const SECTION_W = 880;
const H = 70;

export interface Section {
  id: string;
  title: string;
  note: string;
}

/** A drawn section title: number, title, a line that draws itself once, a short note. */
export const section = (t: Theme, s: Section, index: number): string => {
  const num = String(index + 1).padStart(2, "0");
  const numW = textWidth(num, 13, "mono", 600);
  const titleX = 4 + numW + 14;
  const titleW = textWidth(s.title, 25, "sans", 600);
  const lineX = titleX + titleW + 20;
  const noteW = textWidth(s.note, 12, "mono");
  const lineEnd = SECTION_W - noteW - 24;
  const len = Math.max(0, lineEnd - lineX);
  return svg(
    t,
    {
      width: SECTION_W,
      height: H,
      title: s.title,
      desc: s.note,
      frame: false,
      style: `@keyframes draw { from { stroke-dashoffset: ${len}; } }
  .draw { stroke-dasharray: ${len}; animation: draw 1.4s cubic-bezier(.2,.8,.2,1) .2s both; }`,
    },
    `<text x="4" y="44" class="mono b" font-size="13" fill="url(#${gradientId})">${num}</text>
<text x="${titleX}" y="46" class="sans b fade" font-size="25" fill="${t.text}">${esc(s.title)}</text>
${len > 0 ? `<line class="draw" x1="${lineX}" y1="40" x2="${lineEnd}" y2="40" stroke="url(#${gradientId})" stroke-width="1.5" stroke-linecap="round" stroke-opacity=".7"/>` : ""}
<text x="${SECTION_W - 4}" y="44" text-anchor="end" class="mono fade" font-size="12" fill="${t.faint}" style="animation-delay:.5s">${esc(s.note)}</text>`,
  );
};
