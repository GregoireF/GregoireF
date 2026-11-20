import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { argvOf, type HeroScene, type ProfileConfig } from "../config";
import { execPlay, fixtureDir } from "../play/exec";
import { installTools } from "../play/install";

/** What the hero shows: real commands, real output, real timings. */
export interface CapturedStep {
  argv: string[];
  code: number;
  ms: number;
  output: string[];
}

export interface CapturedScene {
  tool: string;
  tagline: string;
  git: boolean;
  steps: CapturedStep[];
}

export interface HeroCapture {
  /** Hash of the scenes and tool versions. When it changes, the hero is filmed again. */
  fingerprint: string;
  capturedAt: string;
  /** Release tag per repo, e.g. { kiwa: "v0.1.0" }. */
  versions: Record<string, string>;
  scenes: CapturedScene[];
}

export const fingerprintOf = (config: ProfileConfig, versions: Record<string, string>): string =>
  Bun.hash(JSON.stringify([config.hero.scenes, versions])).toString(36);

const git = (cwd: string, ...args: string[]) => {
  const p = Bun.spawnSync(["git", "-c", "user.name=Demo", "-c", "user.email=demo@example.com", ...args], { cwd, stderr: "pipe" });
  if (p.exitCode !== 0) throw new Error(`git ${args[0]}: ${p.stderr.toString()}`);
};

/** A throwaway copy of the demo folder, so a scene can change files. */
const stage = (scene: HeroScene): string => {
  const dir = join(mkdtempSync(join(tmpdir(), "scene-")), "dev");
  cpSync(fixtureDir("dev"), dir, { recursive: true });
  if (scene.setup === "git-change") {
    git(dir, "init", "-q", "-b", "main");
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "chore: initial commit");
    mkdirSync(join(dir, "billing/vat"), { recursive: true });
    writeFileSync(
      join(dir, "billing/vat/rate.go"),
      "package vat\n\n// Rate returns the VAT rate for a country.\nfunc Rate(country string) float64 { return 0.2 }\n",
    );
  }
  return dir;
};

/** Installs the latest releases and runs every scene. Linux only: it's meant for CI. */
export const captureHero = async (config: ProfileConfig): Promise<HeroCapture> => {
  const work = mkdtempSync(join(tmpdir(), "hero-tools-"));
  const bin = join(work, "bin");
  const tags = installTools(config.play.tools, config.login, bin, work);
  const versions = Object.fromEntries(config.play.tools.map((t) => [t.repo, tags[t.bin] ?? ""]));
  const scenes: CapturedScene[] = [];
  for (const scene of config.hero.scenes) {
    const cwd = stage(scene);
    const steps: CapturedStep[] = [];
    for (const command of scene.steps) {
      const argv = argvOf(command);
      const r = await execPlay(argv, cwd, bin);
      steps.push({ argv, code: r.code, ms: r.ms, output: r.output });
    }
    scenes.push({ tool: scene.tool, tagline: scene.tagline, git: scene.setup === "git-change", steps });
  }
  return { fingerprint: fingerprintOf(config, versions), capturedAt: new Date().toISOString(), versions, scenes };
};
