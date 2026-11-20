import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { cleanOutput } from "./command";

export interface ExecResult {
  code: number;
  output: string[];
  ms: number;
  timedOut: boolean;
}

/**
 * Runs an allowlisted argv with no shell, a throwaway HOME, no secrets in the
 * environment and a hard timeout. The caller job only holds a read-only token.
 */
export const fixtureDir = (fixture: string) => resolve("play/fixtures", fixture);

export const execPlay = async (argv: string[], cwd: string, binDir: string, timeoutMs = 15_000): Promise<ExecResult> => {
  const home = mkdtempSync(join(tmpdir(), "play-home-"));
  const started = performance.now();
  const proc = Bun.spawn(argv, {
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    env: {
      PATH: `${binDir}:/usr/bin:/bin`,
      HOME: home,
      XDG_CONFIG_HOME: home,
      XDG_DATA_HOME: home,
      XDG_STATE_HOME: home,
      NO_COLOR: "1",
      TERM: "dumb",
      COLUMNS: "100",
      LANG: "C.UTF-8",
    },
  });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGKILL");
  }, timeoutMs);
  const [out, err, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  clearTimeout(timer);
  const output = cleanOutput(
    [out, err]
      .map((s) => s.trimEnd())
      .filter(Boolean)
      .join("\n"),
    cwd,
  );
  return { code: timedOut ? 124 : code, output, ms: Math.round(performance.now() - started), timedOut };
};
