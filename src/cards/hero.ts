import type { CapturedScene, CapturedStep, HeroCapture } from "../hero/capture";
import { esc, gradientId, round, svg, textWidth, truncate, wrap } from "../svg/core";
import { type Theme, themes, toolColor } from "../svg/theme";
import { Timeline } from "../svg/timeline";
import type { Card } from "./types";

/**
 * The trailer. One loop: a title intro, one scene per tool showing the real
 * output captured in CI, then an end card. Everything is CSS keyframes on a
 * shared clock, so it loops in sync. With reduced motion (or a renderer that
 * doesn't animate) you see the end card, which works as a poster.
 */

const W = 880;
const H = 376;
const T_INTRO = 3.4;
const T_END = 4.2;
const TYPE = 0.048;
const LH = 17;
const FS = 12;

// Terminal geometry. The terminal stays dark in both themes, like a real one.
const TX = 312;
const TY = 26;
const TW = W - TX - 26;
const TH = H - TY * 2;
const BODY_Y = TY + 44;
const BODY_H = TH - 44 - 14;
const CAP = Math.floor((BODY_H - 6) / LH);
const term = themes.dark;

/** Colours a line of real output with a few safe heuristics. */
const lineColor = (line: string, i: number, step: CapturedStep, tool: string): string => {
  const c = toolColor(tool, term);
  if (/^\s*(✓|Valid)/.test(line)) return term.ok;
  if (/missing header|SHIP-E|error|✗|failed/i.test(line)) return term.bad;
  if (/^[◆✨]/.test(line.trim())) return c;
  if (/^\s*→/.test(line)) return c;
  if (i === 0 && step.argv[1] === "list") return term.faint;
  if (/^\S/.test(line) && /^(start|needs|stack)\b/.test(line)) return term.muted;
  return line.startsWith("  ") ? term.muted : term.text;
};

/** The command, highlighted: binary in the tool colour, flags in cyan. */
const command = (argv: string[], tool: string, x: number, y: number): string => {
  let cx = x;
  return argv
    .map((arg, i) => {
      const shown = /\s/.test(arg) ? `"${arg}"` : arg;
      const color = i === 0 ? toolColor(tool, term) : arg.startsWith("-") ? term.accent3 : term.text;
      const out = `<text x="${round(cx)}" y="${y}" class="mono${i === 0 ? " b" : ""}" font-size="${FS}" fill="${color}">${esc(shown)}</text>`;
      cx += textWidth(`${shown} `, FS, "mono");
      return out;
    })
    .join("");
};

const branchIcon = (x: number, y: number, color: string) =>
  `<g fill="none" stroke="${color}" stroke-width="1.3"><circle cx="${x + 2.5}" cy="${y - 8}" r="1.6"/><circle cx="${x + 2.5}" cy="${y + 1}" r="1.6"/><circle cx="${x + 8}" cy="${y - 5}" r="1.6"/><path d="M${x + 2.5} ${y - 6.4}V${y - 0.6}M${x + 8} ${y - 3.4}c0 2-2 2.4-5.5 3.4"/></g>`;

/** Starship-style prompt: directory and git segments, then ❯ coloured by the last exit code. */
const prompt = (scene: CapturedScene, x: number, y: number, ok: boolean): { svg: string; end: number } => {
  const c = toolColor(scene.tool, term);
  const dirW = textWidth("~/dev", 11, "mono") + 18;
  const parts = [
    `<path d="M${x} ${y - 12}h${dirW}l7 7.5-7 7.5h-${dirW}a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3z" fill="${c}"/>`,
    `<text x="${x + 7}" y="${y}" class="mono b" font-size="11" fill="${term.bg}">~/dev</text>`,
  ];
  let end = x + dirW + 7;
  if (scene.git) {
    const gw = textWidth("main ?1", 11, "mono") + 30;
    parts.push(
      `<path d="M${end - 7} ${y - 12}h${gw}l7 7.5-7 7.5h-${gw}l7-7.5z" fill="${term.panel2}"/>`,
      branchIcon(end + 4, y - 0.5, term.muted),
      `<text x="${end + 18}" y="${y}" class="mono" font-size="11" fill="${term.text}">main <tspan fill="${term.warn}">?1</tspan></text>`,
    );
    end += gw;
  }
  parts.push(`<text x="${end + 8}" y="${y}" class="mono b" font-size="${FS}" fill="${ok ? term.ok : term.bad}">❯</text>`);
  return { svg: parts.join(""), end: end + 24 };
};

/** Wraps onto as few lines as greedy wrapping would, but with even lengths (no orphan word). */
const balance = (text: string, width: number, size: number, maxLines: number): string[] => {
  const lines = wrap(text, width, size, maxLines, "sans", 600);
  if (lines.length < 2) return lines;
  let lo = width / lines.length;
  let hi = width;
  while (hi - lo > 2) {
    const mid = (lo + hi) / 2;
    if (wrap(text, mid, size, maxLines + 1, "sans", 600).length > lines.length) lo = mid;
    else hi = mid;
  }
  return wrap(text, hi, size, maxLines, "sans", 600);
};

interface Built {
  css: string;
  body: string;
}

const build = (t: Theme, cap: HeroCapture, name: string, role: string, open: boolean): Built => {
  const clock = new Timeline();
  const out: string[] = [];
  const c0 = t.accent;

  // ── Intro: letterbox, the name assembling letter by letter, the role.
  const ink = t.name === "dark" ? "#000000" : "#0b0d14";
  const intro: string[] = [];
  intro.push(
    `<circle cx="${W / 2}" cy="${H / 2}" r="230" fill="url(#halo)" style="${clock.window(0, T_INTRO, 1.2, 0.5, "scale(.6)")};transform-box:fill-box;transform-origin:center"/>`,
  );
  const nameSize = 46;
  const nameW = textWidth(name, nameSize, "sans", 600);
  let nx = W / 2 - nameW / 2;
  [...name].forEach((ch, i) => {
    if (ch !== " ") {
      intro.push(
        `<text x="${round(nx)}" y="${H / 2 + 4}" class="sans b" font-size="${nameSize}" fill="${t.text}" style="${clock.window(0.35 + i * 0.045, T_INTRO, 0.5, 0.45, "translateY(14px)")}">${esc(ch)}</text>`,
      );
    }
    nx += textWidth(ch, nameSize, "sans", 600);
  });
  intro.push(
    `<rect x="${W / 2 - 40}" y="${H / 2 + 22}" width="80" height="3" rx="1.5" fill="url(#${gradientId})" style="${clock.window(1.4, T_INTRO, 0.5, 0.45, "scaleX(0)")};transform-box:fill-box;transform-origin:center"/>`,
    `<text x="${W / 2}" y="${H / 2 + 52}" text-anchor="middle" class="mono" font-size="13" letter-spacing="2" fill="${t.muted}" style="${clock.window(1.7, T_INTRO, 0.5, 0.45)}">${esc(role.toUpperCase())}</text>`,
  );
  const bar = (y: number, from: string) =>
    `<rect x="0" y="${y}" width="${W}" height="30" fill="${ink}" style="${clock.window(0, T_INTRO + 0.3, 0.5, 0.5, from)}"/>`;
  out.push(`<g>${intro.join("")}</g>`);

  // ── Scenes.
  let time = T_INTRO;
  const sceneTimes: [number, number][] = [];
  const stage: string[] = [];
  const rails: string[] = [];
  const glows: string[] = [];
  const tabs: string[] = [];
  const tabX: number[] = [];
  let tx = TX + 84;
  for (const s of cap.scenes) {
    tabX.push(tx);
    tx += textWidth(s.tool, 11, "mono") + 26;
  }

  cap.scenes.forEach((scene, si) => {
    const color = toolColor(scene.tool, term);
    const start = time;
    let t0 = start + 0.7;
    const lines: string[] = [];
    const scrolls: [number, number][] = [];
    let row = 0;
    let offset = 0;
    let lastOk = true;

    scene.steps.forEach((step, k) => {
      const isLast = k === scene.steps.length - 1;
      const outN = step.output.length;
      const blockEnd = row + 1 + outN + (isLast ? 1 : 0);
      if (blockEnd - offset > CAP) {
        offset = blockEnd - CAP;
        scrolls.push([t0 - 0.4, offset]);
      }
      const y = BODY_Y + 18 + row * LH;
      const p = prompt(scene, TX + 18, y, lastOk);
      const cmdText = step.argv.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" ");
      const cmdW = textWidth(cmdText, FS, "mono") + 4;
      const typeEnd = t0 + 0.25 + cmdText.length * TYPE;
      const showOut = typeEnd + 0.3;
      const outDur = Math.min(0.9, 0.07 * Math.max(1, outN));
      const hold = Math.min(2.4, 1.0 + 0.1 * outN);

      lines.push(
        `<g style="${clock.window(t0, start + 999, 0.2, 0.01, "none")}">${p.svg}${command(step.argv, scene.tool, p.end, y)}</g>`,
        `<rect x="${p.end - 2}" y="${y - 13}" width="${round(cmdW + 6)}" height="${LH}" fill="${term.bg}" style="${clock.slide(t0 + 0.25, typeEnd, cmdText.length, cmdW + 6, 0)}"/>`,
        `<g style="${clock.window(showOut, start + 999, 0.2, 0.01, "none")}"><text x="${TX + TW - 18}" y="${y}" text-anchor="end" class="mono" font-size="11" fill="${term.faint}">${step.ms < 1 ? "<1" : step.ms} ms <tspan fill="${step.code === 0 ? term.ok : term.bad}">${step.code === 0 ? "✓" : `✗ ${step.code}`}</tspan></text></g>`,
      );
      if (outN) {
        const oy = y + LH;
        lines.push(
          step.output
            .map(
              (l, i) =>
                `<text x="${TX + 18}" y="${oy + i * LH}" xml:space="preserve" class="mono" font-size="${FS}" fill="${lineColor(l, i, step, scene.tool)}">${esc(truncate(l, TW - 36, FS, "mono"))}</text>`,
            )
            .join(""),
          `<rect x="${TX + 10}" y="${oy - 13}" width="${TW - 20}" height="${outN * LH + 2}" fill="${term.bg}" style="${clock.slide(showOut, showOut + outDur, outN, 0, outN * LH + 2)}"/>`,
        );
      }
      lastOk = step.code === 0;
      row += 1 + outN;
      t0 = showOut + outDur + hold;
    });

    // Fresh prompt with a blinking cursor at the end of the scene.
    const y = BODY_Y + 18 + row * LH;
    const p = prompt(scene, TX + 18, y, lastOk);
    const end = t0 + 0.6;
    lines.push(
      `<g style="${clock.window(t0 - 0.6, start + 999, 0.2, 0.01, "none")}">${p.svg}</g>`,
      `<rect x="${p.end}" y="${y - 11}" width="7" height="14" fill="${color}" style="${clock.blink(t0 - 0.4, end)}"/>`,
    );
    time = end;
    sceneTimes.push([start, end]);

    const vis = clock.window(start, end, 0.35, 0.35, "none");
    stage.push(
      `<g style="${vis}"><g clip-path="url(#body)"><g style="${clock.scroll(scrolls, LH)}">${lines.join("")}</g></g>` +
        `<rect x="${TX + 1}" y="${TY + TH - 3}" width="${TW - 2}" height="2" fill="${color}" style="${clock.progress(start, end)};transform-box:fill-box;transform-origin:left"/></g>`,
    );

    // Tab highlight.
    const tw = textWidth(scene.tool, 11, "mono") + 18;
    tabs.push(
      `<g style="${clock.window(start, end, 0.3, 0.3, "none")}"><rect x="${tabX[si] - 9}" y="${TY + 9}" width="${tw}" height="22" rx="6" fill="${color}" fill-opacity=".14"/><rect x="${tabX[si] - 1}" y="${TY + 31}" width="${tw - 16}" height="2" rx="1" fill="${color}"/><text x="${tabX[si]}" y="${TY + 24}" class="mono b" font-size="11" fill="${color}">${esc(scene.tool)}</text></g>`,
    );

    // Left rail: number, tool, tagline, version.
    const tc = toolColor(scene.tool, t);
    const tag = balance(scene.tagline, TX - 70, 19, 3);
    const v = cap.versions[scene.tool] ?? "";
    const totalMs = scene.steps.reduce((s, st) => s + st.ms, 0);
    const statY = 150 + tag.length * 25 + 22;
    rails.push(
      `<g style="${clock.window(start + 0.1, end, 0.5, 0.35, "translateX(-10px)")}">
  <text x="36" y="74" class="mono" font-size="11" letter-spacing="1.6" fill="${t.faint}">${String(si + 1).padStart(2, "0")} / ${String(cap.scenes.length).padStart(2, "0")}</text>
  <rect x="36" y="88" width="3" height="${48 + tag.length * 25}" rx="1.5" fill="${tc}"/>
  <text x="52" y="116" class="mono b" font-size="28" fill="${tc}">${esc(scene.tool)}</text>
  ${tag.map((l, i) => `<text x="52" y="${150 + i * 25}" class="sans b" font-size="19" fill="${t.text}">${esc(l)}</text>`).join("")}
  <text x="52" y="${statY}" class="mono" font-size="12" fill="${t.muted}"><tspan class="b" fill="${tc}">${scene.steps.length} commands</tspan> in ${totalMs < 1 ? "<1" : totalMs} ms</text>
  ${v ? `<text x="52" y="${H - 66}" class="mono" font-size="11.5" fill="${t.muted}"><tspan fill="${tc}">●</tspan> ${esc(v)} · latest release</text>` : ""}
  <text x="52" y="${H - 46}" class="mono" font-size="11.5" fill="${t.faint}">real output, captured in CI</text>
</g>`,
    );
    glows.push(
      `<circle cx="${TX + TW * 0.55}" cy="${TY + TH * 0.45}" r="330" fill="url(#gl${si})" style="${clock.window(start, end, 0.8, 0.8, "none")}"/>`,
    );
  });

  // Terminal window, visible during the scenes.
  const stageStart = T_INTRO;
  const stageEnd = time;
  const frame = `<g style="${clock.window(stageStart - 0.1, stageEnd, 0.7, 0.5, "translateY(14px) scale(.985)")};transform-box:fill-box;transform-origin:center">
  <rect x="${TX + 6}" y="${TY + 14}" width="${TW - 12}" height="${TH}" rx="14" fill="#000" fill-opacity="${t.name === "dark" ? 0.5 : 0.18}" filter="url(#shadow)"/>
  <rect x="${TX}" y="${TY}" width="${TW}" height="${TH}" rx="12" fill="${term.bg}" stroke="${t.name === "dark" ? term.border : "#2a3142"}"/>
  <rect x="${TX}" y="${TY}" width="${TW}" height="40" rx="12" fill="${term.panel}"/><rect x="${TX}" y="${TY + 28}" width="${TW}" height="12" fill="${term.panel}"/>
  <line x1="${TX}" y1="${TY + 40}" x2="${TX + TW}" y2="${TY + 40}" stroke="${term.border}"/>
  <circle cx="${TX + 20}" cy="${TY + 20}" r="5.5" fill="#ff5f57"/><circle cx="${TX + 38}" cy="${TY + 20}" r="5.5" fill="#febc2e"/><circle cx="${TX + 56}" cy="${TY + 20}" r="5.5" fill="#28c840"/>
  ${cap.scenes.map((s, i) => `<text x="${tabX[i]}" y="${TY + 24}" class="mono" font-size="11" fill="${term.faint}">${esc(s.tool)}</text>`).join("")}
  ${tabs.join("")}
  ${stage.join("")}
</g>`;
  out.push(`<g>${glows.join("")}</g>`, `<g>${rails.join("")}</g>`, frame);

  // ── End card: the poster. Its base state is visible, so it's what a
  // static render shows.
  const endStart = stageEnd;
  clock.total = endStart + T_END;
  const chips = cap.scenes.map((s) => ({ tool: s.tool, v: cap.versions[s.tool] ?? "", w: 0 }));
  for (const ch of chips) ch.w = textWidth(`${ch.tool} ${ch.v}`, 12.5, "mono") + 40;
  const gap = 12;
  let cx = W / 2 - (chips.reduce((s, c) => s + c.w, 0) + gap * (chips.length - 1)) / 2;
  const chipSvg = chips
    .map((ch, i) => {
      const col = toolColor(ch.tool, t);
      const g = `<g style="${clock.from(endStart + 0.5 + i * 0.12)}"><rect x="${round(cx)}" y="196" width="${round(ch.w)}" height="32" rx="16" fill="${col}" fill-opacity=".1" stroke="${col}" stroke-opacity=".55"/><circle cx="${round(cx + 17)}" cy="212" r="4" fill="${col}"/><text x="${round(cx + 28)}" y="216.5" class="mono" font-size="12.5" fill="${t.text}"><tspan class="b" fill="${col}">${esc(ch.tool)}</tspan> ${esc(ch.v)}</text></g>`;
      cx += ch.w + gap;
      return g;
    })
    .join("");
  const openW = textWidth("Open to work", 12.5, "sans", 600) + 42;
  out.push(`<g>
  <text x="${W / 2}" y="118" text-anchor="middle" class="sans b" font-size="36" fill="${t.text}" style="${clock.from(endStart + 0.1)}">${esc(name)}</text>
  <text x="${W / 2}" y="148" text-anchor="middle" class="sans" font-size="15" fill="${t.muted}" style="${clock.from(endStart + 0.25)}">${esc(role)}</text>
  <rect x="${W / 2 - 32}" y="166" width="64" height="3" rx="1.5" fill="url(#${gradientId})" style="${clock.from(endStart + 0.35)}"/>
  ${chipSvg}
  <text x="${W / 2}" y="270" text-anchor="middle" class="mono" font-size="12" fill="${t.faint}" style="${clock.from(endStart + 1)}">every frame above is real output · run them yourself below ↓</text>
  ${
    open
      ? `<g style="${clock.from(endStart + 1.3)}"><rect x="${W / 2 - openW / 2}" y="292" width="${openW}" height="28" rx="14" fill="${t.ok}" fill-opacity=".1" stroke="${t.ok}" stroke-opacity=".5"/><circle cx="${W / 2 - openW / 2 + 17}" cy="306" r="4" fill="${t.ok}" style="animation:pulse 2.4s ease-in-out infinite"/><text x="${W / 2 - openW / 2 + 28}" y="310.5" class="sans b" font-size="12.5" fill="${t.ok}">Open to work</text></g>`
      : ""
  }
</g>`);
  // Bars last, on top of everything.
  out.push(bar(0, "translateY(-30px)"), bar(H - 30, "translateY(30px)"));

  const sceneGlowDefs = cap.scenes
    .map(
      (s, i) =>
        `<radialGradient id="gl${i}"><stop offset="0" stop-color="${toolColor(s.tool, t)}" stop-opacity="${t.name === "dark" ? 0.2 : 0.16}"/><stop offset="1" stop-color="${toolColor(s.tool, t)}" stop-opacity="0"/></radialGradient>`,
    )
    .join("");
  const defs = `<defs>${sceneGlowDefs}
  <radialGradient id="halo"><stop offset="0" stop-color="${c0}" stop-opacity="${t.name === "dark" ? 0.28 : 0.16}"/><stop offset=".6" stop-color="${t.accent2}" stop-opacity="${t.name === "dark" ? 0.08 : 0.05}"/><stop offset="1" stop-color="${t.accent2}" stop-opacity="0"/></radialGradient>
  <clipPath id="body"><rect x="${TX}" y="${BODY_Y + 5}" width="${TW}" height="${BODY_H - 5}"/></clipPath>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>`;

  return {
    css: `
  @keyframes pulse { 50% { opacity: .35; } }
  ${clock.css()}`,
    body: defs + out.join("\n"),
  };
};

export const hero: Card = (t, { config, hero: cap }) => {
  const { css, body } = build(t, cap, config.name, config.role, config.availability.open);
  const steps = cap.scenes.flatMap((s) => s.steps.map((st) => st.argv.join(" ")));
  return svg(
    t,
    {
      width: W,
      height: H,
      title: `${config.name}, ${config.role}`,
      desc: `A short loop showing real output of my tools: ${steps.join(", ")}.`,
      style: css,
      grid: true,
      glows: [
        { x: 80, y: 40, r: 300, color: t.accent },
        { x: W - 40, y: H, r: 320, color: t.accent3, opacity: t.name === "dark" ? 0.12 : 0.08 },
      ],
      radius: 16,
    },
    body,
  );
};
