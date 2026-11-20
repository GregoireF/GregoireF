import { esc, svg, textWidth } from "../svg/core";
import type { Theme } from "../svg/theme";

/** 24×24 icon paths. LinkedIn and Ko-fi from Simple Icons (CC0). */
const ICONS = {
  mail: `<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  linkedin: `<path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/>`,
  kofi: `<path fill="currentColor" d="M11.35 6.35c-3.43 0-7.3-.05-8.72-.02C1.7 6.36 1 7.08 1 8v8.4C1 18.4 2.6 20 4.6 20h7.8c2 0 3.6-1.6 3.6-3.6v-.65h1.2c2.6 0 4.8-2.1 4.8-4.7S19.9 6.35 17.3 6.35zm4.65 3h1.3a2.05 2.05 0 0 1 0 4.1H16zM8.5 10.1c.9-.9 2.4-.9 3.3 0 .9.9.9 2.4 0 3.3L8.5 16.6l-3.3-3.2c-.9-.9-.9-2.4 0-3.3.9-.9 2.4-.9 3.3 0z"/>`,
  arrow: `<path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
};

export interface Button {
  id: string;
  label: string;
  icon: keyof typeof ICONS;
  /** Brand colour of the icon. */
  color: string;
  primary?: boolean;
}

const H = 44;

/** Icon and padding on the left (46), gap, arrow and padding on the right (50). */
export const buttonWidth = (b: Button) => Math.round(textWidth(b.label, 14, "sans", 600) + 96);

/** A pill button drawn in the profile's style. The README wraps it in a link. */
export const button = (t: Theme, b: Button): string => {
  const w = buttonWidth(b);
  const fg = b.primary ? "#ffffff" : t.text;
  const fill = b.primary ? `url(#btn)` : t.panel;
  return svg(
    t,
    { width: w, height: H, title: b.label, frame: false },
    `<defs><linearGradient id="btn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent2}"/></linearGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${b.primary ? 0.22 : t.name === "dark" ? 0.06 : 0.6}"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect x=".5" y=".5" width="${w - 1}" height="${H - 1}" rx="${H / 2}" fill="${fill}" stroke="${b.primary ? "none" : t.border}"/>
<rect x="1" y="1" width="${w - 2}" height="${H / 2}" rx="${H / 2 - 1}" fill="url(#sheen)"/>
<g transform="translate(18 12) scale(.83)" style="color:${b.primary ? "#fff" : b.color}">${ICONS[b.icon]}</g>
<text x="46" y="27" class="sans b" font-size="14" fill="${fg}">${esc(b.label)}</text>
<g transform="translate(${w - 30} 15) scale(.58)" style="color:${b.primary ? "#fff" : t.faint}">${ICONS.arrow}</g>`,
  );
};
