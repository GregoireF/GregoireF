import { button } from "./cards/button";
import { footer } from "./cards/footer";
import { hero } from "./cards/hero";
import { languages } from "./cards/languages";
import { now } from "./cards/now";
import { stats } from "./cards/numbers";
import { play } from "./cards/play";
import { project } from "./cards/project";
import { radar } from "./cards/radar";
import { section } from "./cards/section";
import { skyline } from "./cards/skyline";
import { stack } from "./cards/stack";
import type { Card, Ctx } from "./cards/types";
import { wakatime } from "./cards/wakatime";
import { showcase } from "./data/model";
import { buttons, sections } from "./layout";
import { projectCardName } from "./readme";
import { embedFonts } from "./svg/fonts";
import { themes } from "./svg/theme";

const cards: Record<string, Card> = { hero, now, radar, stats, skyline, languages, wakatime, play, stack, footer };

/** Just the "last run" card, from what it needs (used after each visitor run). */
export const renderPlayCard = (ctx: Pick<Ctx, "play" | "now">): Map<string, string> =>
  new Map(Object.values(themes).map((theme) => [`play-${theme.name}.svg`, play(theme, ctx)]));

/**
 * Every file of the output branch: `<card>-<theme>.svg`. `only` limits the
 * work to some groups ("play", "projects", "sections", "buttons", or a card name).
 */
export const renderAll = (ctx: Ctx, only?: string[]): Map<string, string> => {
  const want = (k: string) => !only || only.includes(k);
  const files = new Map<string, string>();
  for (const theme of Object.values(themes)) {
    const suffix = `-${theme.name}.svg`;
    for (const [name, card] of Object.entries(cards)) if (want(name)) files.set(name + suffix, card(theme, ctx));
    if (want("projects")) {
      for (const repo of showcase(ctx.data, ctx.config)) {
        files.set(projectCardName(repo.name) + suffix, project(theme, repo, ctx.config, ctx.now));
      }
    }
    if (want("sections")) {
      for (const [i, s] of sections(ctx.config).entries()) files.set(`section-${s.id}${suffix}`, section(theme, s, i));
    }
    if (want("buttons")) for (const b of buttons(ctx.config)) files.set(`button-${b.id}${suffix}`, button(theme, b));
  }
  return files;
};

/** Cards that sit inside a link in the README. */
const isLinked = (name: string) => /^(project-.+|button-.+|footer)$/.test(name);

/**
 * One file holding both themes, switched by prefers-color-scheme inside the
 * SVG. Used for linked cards: GitHub breaks <picture> inside a link and no
 * longer honours the #gh-dark-mode-only fragments, so this is the only way to
 * get a single clickable image that follows the theme. Each theme is embedded
 * as its own image, so their styles, ids and fonts never clash.
 */
const adaptive = (dark: string, light: string): string => {
  const size = /width="([\d.]+)" height="([\d.]+)"/.exec(dark);
  const [w, h] = [size?.[1] ?? "0", size?.[2] ?? "0"];
  const title = /<title[^>]*>([\s\S]*?)<\/title>/.exec(dark)?.[1] ?? "";
  const uri = (s: string) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
<title>${title}</title>
<style>.light{display:none}@media (prefers-color-scheme: light){.dark{display:none}.light{display:inline}}</style>
<image class="dark" width="${w}" height="${h}" href="${uri(dark)}"/>
<image class="light" width="${w}" height="${h}" href="${uri(light)}"/>
</svg>
`;
};

/** Embeds the font subsets, then builds the adaptive file of each linked card. */
export const finalize = async (files: Map<string, string>): Promise<Map<string, string>> => {
  const out = new Map<string, string>();
  for (const [name, content] of files) out.set(name, name.endsWith(".svg") ? await embedFonts(content) : content);
  for (const name of [...out.keys()]) {
    const base = name.replace(/-dark\.svg$/, "");
    if (base === name || !isLinked(base)) continue;
    const light = out.get(`${base}-light.svg`);
    if (light) out.set(`${base}.svg`, adaptive(out.get(name) ?? "", light));
  }
  return out;
};
