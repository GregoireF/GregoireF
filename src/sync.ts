import type { ProfileConfig } from "./config";
import { GithubError, rest } from "./data/rest";

export interface SyncReport {
  step: string;
  ok: boolean;
  detail: string;
}

const HINT_403 =
  "The token can't do this. Add a fine-grained token with Account permissions → Profile: read and write (or a classic token with the `user` scope) as the PROFILE_TOKEN secret.";

/** Labels the automation relies on. Created or updated, never deleted. */
const LABELS = [
  { name: "play", color: "818cf8", description: "A command run from the profile page" },
  { name: "automation", color: "22d3ee", description: "Opened and closed by the profile's own workflows" },
  { name: "auto-heal", color: "f87171", description: "A workflow failed twice in a row" },
  { name: "dependencies", color: "a3e635", description: "Dependabot updates" },
];

/** Labels as code. Needs a token with issues write on the repo (the workflow token is enough). */
export const syncLabels = async (repo: string, token: string): Promise<SyncReport> => {
  try {
    const existing = await rest<{ name: string; color: string; description: string | null }[]>(
      token,
      "GET",
      `/repos/${repo}/labels?per_page=100`,
    );
    const changed: string[] = [];
    for (const l of LABELS) {
      const cur = existing.find((e) => e.name.toLowerCase() === l.name);
      if (!cur) {
        await rest(token, "POST", `/repos/${repo}/labels`, l);
        changed.push(`+${l.name}`);
      } else if (cur.color !== l.color || cur.description !== l.description) {
        await rest(token, "PATCH", `/repos/${repo}/labels/${encodeURIComponent(cur.name)}`, {
          new_name: l.name,
          color: l.color,
          description: l.description,
        });
        changed.push(`~${l.name}`);
      }
    }
    return { step: "labels", ok: true, detail: changed.length ? changed.join(" ") : "in sync" };
  } catch (e) {
    return { step: "labels", ok: false, detail: String(e) };
  }
};

/** Profile as code: pushes `account` and `repository` from the config to GitHub. */
export const syncProfile = async (config: ProfileConfig, token: string): Promise<SyncReport[]> => {
  const repo = `/repos/${config.login}/${config.login}`;
  const steps: [string, () => Promise<unknown>][] = [
    ["account", () => rest(token, "PATCH", "/user", { name: config.name, location: config.location, ...config.account })],
    [
      "repository",
      () =>
        rest(token, "PATCH", repo, {
          description: config.repository.description,
          homepage: config.repository.homepage,
          // Issues carry the playable terminal and the auto-heal reports.
          has_issues: true,
          has_wiki: false,
          has_projects: false,
          has_discussions: false,
        }),
    ],
    ["topics", () => rest(token, "PUT", `${repo}/topics`, { names: config.repository.topics })],
  ];
  const report: SyncReport[] = [];
  for (const [step, run] of steps) {
    try {
      await run();
      report.push({ step, ok: true, detail: "in sync" });
    } catch (e) {
      const status = e instanceof GithubError ? e.status : 0;
      report.push({ step, ok: false, detail: status === 403 || status === 404 ? HINT_403 : String(e) });
    }
  }
  return report;
};
