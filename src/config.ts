/** Shape of profile.config.ts, the single file that drives the whole profile. */

/**
 * One scene of the hero trailer. Its commands really run in CI on a copy of
 * play/fixtures/dev, and the hero shows their real output and timings.
 */
export interface HeroScene {
  /** Repo name: picks the colour and the version shown. */
  tool: string;
  /** Big line shown next to the terminal during the scene. */
  tagline: string;
  /** "git-change": the copy is a git repo with one new Go file, for ship. */
  setup?: "git-change";
  /** Commands, run one after the other. Split on spaces, never through a shell. */
  steps: string[];
}

export interface PlayCommand {
  /** The command, and what goes in the issue title after "run: ". */
  run: string;
  /** One line shown next to the link. */
  hint: string;
  /**
   * When set, the visitor's free text is appended as ONE extra argument
   * (no shell, so it can't inject anything). `example` pre-fills the issue.
   */
  arg?: { max: number; example: string };
}

export interface Tool {
  /** Binary name on PATH once installed. */
  bin: string;
  repo: string;
  /** Glob matching the linux x86_64 release asset (a .tar.gz or .tar.xz). */
  asset: string;
}

export interface ProfileConfig {
  login: string;
  name: string;
  role: string;
  location: string;
  /** Short paragraphs under the hero. Plain sentences, no marketing. */
  intro: string[];
  /** Synced to the GitHub account by `bun run sync` (with `name` and `location`). */
  account: { bio: string; blog: string; company: string; hireable: boolean };
  /** Synced to this repository's settings. */
  repository: { description: string; homepage: string; topics: string[] };
  availability: { open: boolean; kinds: string[]; note: string };
  contact: { email: string; linkedin: string; kofi?: string };
  showcase: {
    /** Always shown first, in this order. */
    featured: string[];
    /** Any other repo carrying this topic is added after the featured ones. */
    topic: string;
    max: number;
    /** "Also available as" line under a project card. */
    family: Record<string, string[]>;
  };
  hero: { scenes: HeroScene[] };
  play: { tools: Tool[]; commands: PlayCommand[] };
  wakatime: { enabled: boolean };
  /** Rows of the stack card. Items are Simple Icons slugs (simpleicons.org). */
  stack: { label: string; items: string[] }[];
  /** A line of yours for the footer. */
  motto: string;
  /** Languages left out of the language card. */
  ignoredLanguages: string[];
  /** Repos never shown anywhere (test sandboxes, forks of templates…). */
  ignoredRepos: string[];
}

/** "kw about billing" → ["kw", "about", "billing"]. Commands never go through a shell. */
export const argvOf = (command: string): string[] => command.trim().split(/\s+/);

export const defineProfile = (config: ProfileConfig): ProfileConfig => {
  if (config.account.bio.length > 160) throw new Error("account.bio is limited to 160 characters by GitHub");
  const bins = new Set(config.play.tools.map((t) => t.bin));
  const commands = [...config.hero.scenes.flatMap((s) => s.steps), ...config.play.commands.map((c) => c.run)];
  for (const command of commands) {
    const bin = argvOf(command)[0];
    if (!bins.has(bin)) throw new Error(`"${command}" uses ${bin}, which isn't in play.tools`);
  }
  return config;
};
