import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Tool } from "../config";

const CHECKSUM_FILES = ["checksums.txt", "sha256.sum"];

const run = (cmd: string[], cwd?: string) => {
  const p = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  if (p.exitCode !== 0) throw new Error(`${cmd.join(" ")}: ${p.stderr.toString()}`);
  return p.stdout.toString();
};

const findFile = (dir: string, name: string): string | undefined => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      const found = findFile(p, name);
      if (found) return found;
    } else if (entry === name) return p;
  }
};

/** Fails unless the archive is listed in the release's checksum file with a matching sha256. */
export const verifyChecksum = (dir: string, archive: string): void => {
  const sums = CHECKSUM_FILES.find((f) => existsSync(join(dir, f)));
  if (!sums) throw new Error(`no checksum file (${CHECKSUM_FILES.join(" or ")}) in the release, refusing to run ${archive}`);
  const line = readFileSync(join(dir, sums), "utf8")
    .split("\n")
    .find((l) => l.trim().split(/\s+/)[1]?.replace(/^\*/, "") === archive);
  const expected = line?.trim().split(/\s+/)[0]?.toLowerCase();
  if (!expected) throw new Error(`${archive} is not listed in ${sums}`);
  const actual = new Bun.CryptoHasher("sha256").update(readFileSync(join(dir, archive))).digest("hex");
  if (actual !== expected) throw new Error(`sha256 mismatch for ${archive}`);
};

/**
 * Downloads the latest release of each tool, pinned to the tag it just read,
 * verifies it against the release's checksum file, and puts the binary in
 * `binDir`. Returns the tag per binary.
 */
export const installTools = (tools: Tool[], owner: string, binDir: string, workDir: string): Record<string, string> => {
  mkdirSync(binDir, { recursive: true });
  const tags: Record<string, string> = {};
  for (const tool of tools) {
    const dir = join(workDir, tool.repo);
    mkdirSync(dir, { recursive: true });
    const repo = `${owner}/${tool.repo}`;
    const tag = run(["gh", "release", "view", "-R", repo, "--json", "tagName", "-q", ".tagName"]).trim();
    tags[tool.bin] = tag;
    const patterns = [tool.asset, ...CHECKSUM_FILES].flatMap((p) => ["-p", p]);
    run(["gh", "release", "download", tag, "-R", repo, "-D", dir, "--clobber", ...patterns]);

    const archive = readdirSync(dir).find((f) => /\.tar\.(gz|xz)$/.test(f));
    if (!archive) throw new Error(`no archive matching ${tool.asset} in ${repo} ${tag}`);
    verifyChecksum(dir, archive);
    run(["tar", "-xf", archive], dir);
    const bin = findFile(dir, tool.bin);
    if (!bin) throw new Error(`${tool.bin} not found in ${archive}`);
    // `kw` may ship as a symlink to `kiwa`: copy the real file.
    copyFileSync(realpathSync(bin), join(binDir, tool.bin));
    chmodSync(join(binDir, tool.bin), 0o755);
  }
  return tags;
};
