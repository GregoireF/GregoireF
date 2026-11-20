import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as fontkit from "fontkit";
import subsetFont from "subset-font";

/**
 * Geist and Geist Mono, embedded in each SVG as a woff2 subset holding only
 * the glyphs that SVG uses (a few KB). Same rendering on every OS, and text is
 * measured with the real font metrics, so nothing overflows.
 */

export type Family = "sans" | "mono";
export type Weight = 400 | 600;

const DIR = join(import.meta.dir, "../../node_modules/geist/dist/fonts");
const FILES: Record<Family, Record<Weight, string>> = {
  sans: { 400: "geist-sans/Geist-Regular.ttf", 600: "geist-sans/Geist-SemiBold.ttf" },
  mono: { 400: "geist-mono/GeistMono-Regular.ttf", 600: "geist-mono/GeistMono-SemiBold.ttf" },
};
export const FAMILY_NAME: Record<Family, string> = { sans: "Geist", mono: "Geist Mono" };

const buffers = new Map<string, Buffer>();
const fonts = new Map<string, fontkit.Font>();
const key = (f: Family, w: Weight) => `${f}-${w}`;

const buffer = (f: Family, w: Weight): Buffer => {
  const k = key(f, w);
  let b = buffers.get(k);
  if (!b) {
    b = readFileSync(join(DIR, FILES[f][w]));
    buffers.set(k, b);
  }
  return b;
};

const font = (f: Family, w: Weight): fontkit.Font => {
  const k = key(f, w);
  let ft = fonts.get(k);
  if (!ft) {
    ft = fontkit.create(buffer(f, w)) as fontkit.Font;
    fonts.set(k, ft);
  }
  return ft;
};

const widthCache = new Map<string, number>();

/** Rendered width in px of `text` at `size`, from the font's own advances and kerning. */
export const measure = (text: string, size: number, family: Family = "sans", weight: Weight = 400): number => {
  const k = `${family}${weight}|${text}`;
  let units = widthCache.get(k);
  if (units === undefined) {
    const ft = font(family, weight);
    units = ft.layout(text).advanceWidth / ft.unitsPerEm;
    widthCache.set(k, units);
  }
  return units * size;
};

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

/** Characters drawn by the SVG: text content only, not markup or CSS. */
const glyphs = (svg: string): string => {
  const body = svg.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<(title|desc)[^>]*>[\s\S]*?<\/\1>/g, "");
  const chars = new Set<string>(" ");
  for (const m of body.matchAll(/>([^<]+)</g)) for (const c of decode(m[1] ?? "")) chars.add(c);
  return [...chars].join("");
};

const subsetCache = new Map<string, string>();

/** Replaces the `/*@fonts*\/` marker with @font-face rules for the faces this SVG uses. */
export const embedFonts = async (svg: string): Promise<string> => {
  if (!svg.includes("/*@fonts*/")) return svg;
  const text = glyphs(svg);
  const usesMono = /class="[^"]*\bmono\b/.test(svg);
  const usesBold = /class="[^"]*\bb\b/.test(svg) || /font-weight="600"/.test(svg);
  const faces: [Family, Weight][] = [["sans", 400]];
  if (usesBold) faces.push(["sans", 600]);
  if (usesMono) faces.push(["mono", 400]);
  if (usesMono && usesBold) faces.push(["mono", 600]);

  const rules = await Promise.all(
    faces.map(async ([f, w]) => {
      const k = `${key(f, w)}|${text}`;
      let b64 = subsetCache.get(k);
      if (!b64) {
        b64 = (await subsetFont(buffer(f, w), text, { targetFormat: "woff2" })).toString("base64");
        subsetCache.set(k, b64);
      }
      return `@font-face{font-family:"${FAMILY_NAME[f]}";font-weight:${w};src:url(data:font/woff2;base64,${b64}) format("woff2");}`;
    }),
  );
  return svg.replace("/*@fonts*/", rules.join(""));
};
