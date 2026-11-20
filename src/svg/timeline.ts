import { round } from "./core";

/**
 * CSS keyframes on one shared clock, written in seconds.
 *
 * Every animated element gets its own @keyframes, all running for the same
 * duration (`--T`, the length of the whole loop), so they stay in sync and the
 * loop restarts cleanly. Times are given in seconds and turned into
 * percentages once the total length is known.
 */
export class Timeline {
  private frames: ((total: number) => string)[] = [];
  private count = 0;
  /** Length of the loop in seconds. Set it once every event is placed. */
  total = 0;

  private add(build: (pct: (s: number) => string) => string): string {
    const name = `k${this.count++}`;
    this.frames.push((total) => {
      const pct = (s: number) => `${Math.min(100, Math.max(0, (s / total) * 100)).toFixed(3)}%`;
      return `@keyframes ${name}{${build(pct)}}`;
    });
    return `animation:${name} var(--T) linear infinite`;
  }

  /**
   * Visible between a and b, with fades. Hidden for the rest of the loop, and
   * hidden when nothing animates (prefers-reduced-motion, static renders).
   */
  window(a: number, b: number, fadeIn = 0.35, fadeOut = 0.35, from = "translateY(6px)"): string {
    const anim = this.add(
      (p) =>
        `0%,${p(a)}{opacity:0;transform:${from}}${p(a + fadeIn)},${p(b - fadeOut)}{opacity:1;transform:none}${p(b)},100%{opacity:0;transform:none}`,
    );
    return `opacity:0;${anim}`;
  }

  /** Visible from a to the end of the loop. Visible when nothing animates. */
  from(a: number, fadeIn = 0.5): string {
    return this.add((p) => `0%,${p(a)}{opacity:0;transform:translateY(6px)}${p(a + fadeIn)},100%{opacity:1;transform:none}`);
  }

  /** A cover that slides off its text in `steps` jumps between a and b: the typing effect. */
  slide(a: number, b: number, steps: number, dx: number, dy: number): string {
    const to = `translate(${round(dx)}px,${round(dy)}px)`;
    return this.add(
      (p) => `0%,${p(a)}{transform:translate(0,0);animation-timing-function:steps(${Math.max(1, steps)},end)}${p(b)},100%{transform:${to}}`,
    );
  }

  /** Scrolls up by whole lines: each stop is [time, lines scrolled]. */
  scroll(stops: [number, number][], lineHeight: number): string {
    return this.add((p) => {
      const frames = ["0%{transform:translateY(0)}"];
      let prev = 0;
      for (const [t, lines] of stops) {
        if (lines === prev) continue;
        frames.push(
          `${p(t)}{transform:translateY(${-prev * lineHeight}px)}`,
          `${p(t + 0.35)}{transform:translateY(${-lines * lineHeight}px)}`,
        );
        prev = lines;
      }
      frames.push(`100%{transform:translateY(${-prev * lineHeight}px)}`);
      return frames.join("");
    });
  }

  /** A bar that fills from a to b. */
  progress(a: number, b: number): string {
    return this.add((p) => `0%,${p(a)}{transform:scaleX(0)}${p(b)}{transform:scaleX(1)}${p(b + 0.01)},100%{transform:scaleX(0)}`);
  }

  /** A cursor blinking once a second between a and b. */
  blink(a: number, b: number): string {
    return this.add((p) => {
      const out = [`0%,${p(a)}{opacity:0}`];
      for (let s = a; s < b - 0.5; s += 1) out.push(`${p(s + 0.01)}{opacity:1}`, `${p(s + 0.5)}{opacity:0}`);
      out.push(`${p(b)},100%{opacity:0}`);
      return out.join("");
    });
  }

  /** The @keyframes rules plus the --T variable every animation reads. */
  css(): string {
    return `svg{--T:${round(this.total)}s}\n${this.frames.map((f) => f(this.total)).join("\n")}`;
  }
}
