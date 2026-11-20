import { describe, expect, test } from "bun:test";
import config from "../profile.config";
import { iconFor, readable } from "../src/cards/stack";
import { ago, compact, currentStreak, languageShares, recentReleases, showcase } from "../src/data/model";
import type { HeroCapture } from "../src/hero/capture";
import heroJson from "../src/hero/sample.json";
import { renderReadme } from "../src/readme";
import { finalize, renderAll } from "../src/render";
import { wrap } from "../src/svg/core";
import { themes } from "../src/svg/theme";
import { data, NOW } from "./fixture";

const hero = heroJson as HeroCapture;

/** Cheap XML sanity check: every opened tag is closed in order. */
const balanced = (xml: string): boolean => {
  const stack: string[] = [];
  const body = xml.replace(/<style>[\s\S]*?<\/style>/g, "");
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][\w:-]*)[^>]*?(\/?)>/g)) {
    const [, closing, name, self] = m;
    if (self) continue;
    if (closing) {
      if (stack.pop() !== name) return false;
    } else stack.push(name);
  }
  return stack.length === 0;
};

describe("model", () => {
  test("showcase: featured first in config order, then tagged by stars, never archived", () => {
    expect(showcase(data, config).map((r) => r.name)).toEqual(["kiwa", "ship-it", "addlicense", "tagged-tool"]);
  });

  test("recent releases are sorted newest first", () => {
    expect(recentReleases(data, 2).map((r) => r.tag)).toEqual(["v0.1.0", "v0.1.2"]);
  });

  test("ignored languages are left out and shares add up to 100", () => {
    const shares = languageShares(data, ["HTML"]);
    expect(shares.some((s) => s.name === "HTML")).toBe(false);
    expect(shares.reduce((s, l) => s + l.percent, 0)).toBeCloseTo(100);
  });

  test("streak tolerates an empty today", () => {
    const d = structuredClone(data);
    const days = d.calendar.weeks.flat();
    for (const x of days) x.count = 1;
    days[days.length - 1].count = 0;
    expect(currentStreak(d)).toBe(days.length - 1);
  });

  test("formatting helpers", () => {
    expect(ago("2026-11-15T12:00:00Z", NOW)).toBe("5d ago");
    expect(ago("2026-11-20T11:59:30Z", NOW)).toBe("just now");
    expect(compact(1234)).toBe("1.2k");
    expect(compact(12_345)).toBe("12k");
    expect(wrap("a b c d e f g h", 20, 10, 2).at(-1)?.endsWith("…")).toBe(true);
  });
});

describe("cards", () => {
  const files = renderAll({ config, data, hero, play: { runs: 0 }, now: NOW });

  test("every card exists in both themes", () => {
    const names = [...files.keys()];
    for (const n of names.filter((x) => x.endsWith("-dark.svg"))) expect(names).toContain(n.replace("-dark", "-light"));
    expect(names).toContain("project-kiwa-dark.svg");
  });

  test.each([...files.entries()])("%s is well-formed and has no holes", (_, svg) => {
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).not.toMatch(/NaN|undefined|\[object/);
    expect(svg).toContain("<title");
    expect(svg).toContain("prefers-reduced-motion");
    expect(balanced(svg)).toBe(true);
  });

  test("fonts are embedded as small woff2 subsets", async () => {
    const out = await finalize(new Map([["hero-dark.svg", files.get("hero-dark.svg") ?? ""]]));
    const svg = out.get("hero-dark.svg") ?? "";
    expect(svg).not.toContain("/*@fonts*/");
    expect(svg.match(/@font-face/g)?.length).toBe(4);
    expect(svg.length).toBeLessThan(160_000);
  });

  test("the hero shows real footage and loops on one clock", () => {
    const svg = files.get("hero-dark.svg") ?? "";
    for (const s of hero.scenes) expect(svg).toContain(`>${s.tool}<`);
    expect(svg).toMatch(/--T:\d+(\.\d)?s/);
    expect(svg).toContain(hero.scenes[0].steps[0].output[1].split(/\s+/)[0]);
  });

  test("the hero poster (no animation) is the end card only", () => {
    const svg = files.get("hero-light.svg") ?? "";
    // Everything shown in a time window starts hidden; only end-card items don't.
    const windows = svg.match(/style="opacity:0;animation:k\d+/g)?.length ?? 0;
    expect(windows).toBeGreaterThan(20);
    expect(svg).toContain("Open to work");
  });

  test("stack icons stay readable: black brands lighten on dark, yellow ones darken on light", () => {
    expect(readable("000000", themes.dark)).not.toBe("#000000");
    expect(readable("FCC624", themes.light)).not.toBe("#FCC624");
    expect(readable("3178C6", themes.dark)).toBe("#3178C6");
    for (const row of config.stack) for (const slug of row.items) expect(() => iconFor(slug)).not.toThrow();
  });

  test("linked cards get one adaptive file holding both themes", async () => {
    const out = await finalize(renderAll({ config, data, hero, play: { runs: 0 }, now: NOW }, ["buttons", "footer"]));
    const svg = out.get("button-email.svg") ?? "";
    expect(svg).toContain("prefers-color-scheme: light");
    expect(svg.match(/<image /g)?.length).toBe(2);
    expect(out.has("footer.svg")).toBe(true);
  });

  test("visitor text is escaped", () => {
    const out = renderAll(
      {
        config,
        data,
        hero,
        now: NOW,
        play: {
          runs: 1,
          last: { user: "x", command: 'ship check title <script>"', output: ["<b>&"], ok: false, at: NOW.toISOString(), issue: 1 },
        },
      },
      ["play"],
    );
    const svg = out.get("play-dark.svg") ?? "";
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;b&gt;&amp;");
  });
});

describe("readme", () => {
  const md = renderReadme(config, showcase(data, config));

  test("links every showcased repo and every play command", () => {
    for (const r of showcase(data, config)) expect(md).toContain(r.url);
    expect(md.match(/issues\/new\?template=play\.yml/g)?.length).toBe(config.play.commands.length);
  });

  test("uses light/dark pictures from the output branch", () => {
    expect(md).toContain("/output/hero-dark.svg");
    expect(md).toContain('media="(prefers-color-scheme: dark)"');
  });

  test("never nests <picture> in a link (GitHub breaks it apart)", () => {
    expect(md).not.toMatch(/<a [^>]*><picture>/);
    expect(md).not.toContain("#gh-");
    expect(md).toContain("/output/project-kiwa.svg");
  });
});
