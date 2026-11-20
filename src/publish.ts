import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The `output` branch holds generated files only, always as ONE orphan commit
 * that gets replaced. Nothing generated ever lands on main.
 */

export const DIST = "dist";
const BRANCH = "output";

const git = (args: string[], cwd = DIST, quiet = false) => {
  const p = Bun.spawnSync(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  if (p.exitCode !== 0 && !quiet) throw new Error(`git ${args[0]} failed: ${p.stderr.toString()}`);
  return { ok: p.exitCode === 0, out: p.stdout.toString().trim() };
};

const remote = (login: string, token: string) => `https://x-access-token:${token}@github.com/${login}/${login}.git`;

/** Fresh dist/ holding the current output branch, or empty if there's none yet. */
export const checkoutOutput = (login: string, token?: string) => {
  rmSync(DIST, { recursive: true, force: true });
  const url = token ? remote(login, token) : `https://github.com/${login}/${login}.git`;
  const clone = Bun.spawnSync(["git", "clone", "--quiet", "--depth", "1", "--branch", BRANCH, url, DIST], { stderr: "pipe" });
  if (clone.exitCode !== 0) {
    mkdirSync(DIST, { recursive: true });
    git(["init", "--quiet", "-b", BRANCH]);
  }
};

export const readDist = (file: string): string | undefined => {
  const p = join(DIST, file);
  return existsSync(p) ? readFileSync(p, "utf8") : undefined;
};

export const writeDist = (files: Map<string, string>) => {
  mkdirSync(DIST, { recursive: true });
  for (const [name, content] of files) writeFileSync(join(DIST, name), content);
};

/** Commits dist/ as a new orphan commit and force-pushes it. Returns false when nothing changed. */
export const publishOutput = (login: string, token: string, message: string): boolean => {
  git(["add", "-A"]);
  const head = git(["rev-parse", "--verify", "HEAD"], DIST, true);
  const base = head.ok ? head.out : undefined;
  if (base && git(["diff", "--cached", "--quiet"], DIST, true).ok) return false;

  git(["checkout", "--quiet", "--orphan", "next"]);
  git([
    "-c",
    "user.name=github-actions[bot]",
    "-c",
    "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit",
    "--quiet",
    "--no-gpg-sign",
    "-m",
    message,
  ]);
  // Lease on what we cloned: if a concurrent run pushed in between, fail
  // instead of silently dropping its work (auto-heal re-runs the job).
  git(["push", "--quiet", `--force-with-lease=refs/heads/${BRANCH}:${base ?? ""}`, remote(login, token), `next:refs/heads/${BRANCH}`]);
  return true;
};
