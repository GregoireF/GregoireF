import type { ProfileConfig } from "../config";
import type { GithubData, Release, Repo } from "./github";

/** Pure derivations from raw data. No network, no clock: `now` is passed in. */

export const showcase = (data: GithubData, config: ProfileConfig): Repo[] => {
  const byName = new Map(data.repos.map((r) => [r.name, r]));
  const featured = config.showcase.featured.map((n) => byName.get(n)).filter((r): r is Repo => !!r);
  const tagged = data.repos
    .filter((r) => !r.archived && r.topics.includes(config.showcase.topic) && !config.showcase.featured.includes(r.name))
    .sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt));
  return [...featured, ...tagged].slice(0, config.showcase.max);
};

export const recentReleases = (data: GithubData, limit = 6): Release[] =>
  data.repos
    .flatMap((r) => r.releases)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);

export interface LanguageShare {
  name: string;
  color: string;
  percent: number;
}

export const languageShares = (data: GithubData, ignored: string[], limit = 7): LanguageShare[] => {
  const totals = new Map<string, { color: string; size: number }>();
  for (const repo of data.repos) {
    if (repo.archived) continue;
    for (const l of repo.languages) {
      if (ignored.includes(l.name)) continue;
      const cur = totals.get(l.name) ?? { color: l.color, size: 0 };
      cur.size += l.size;
      totals.set(l.name, cur);
    }
  }
  const sum = [...totals.values()].reduce((s, v) => s + v.size, 0) || 1;
  const sorted = [...totals.entries()]
    .map(([name, v]) => ({ name, color: v.color, percent: (v.size / sum) * 100 }))
    .sort((a, b) => b.percent - a.percent);
  const head = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((s, l) => s + l.percent, 0);
  return rest >= 0.5 ? [...head, { name: "Other", color: "#6e7681", percent: rest }] : head;
};

export interface Numbers {
  contributions: number;
  stars: number;
  releases: number;
  pullRequests: number;
  repos: number;
  streak: number;
  followers: number;
}

/** Current streak in days, ending today or yesterday (today may not have started yet). */
export const currentStreak = (data: GithubData): number => {
  const days = data.calendar.weeks.flat();
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let streak = 0;
  for (; i >= 0 && days[i].count > 0; i--) streak++;
  return streak;
};

export const numbers = (data: GithubData): Numbers => ({
  contributions: data.calendar.total,
  stars: data.repos.reduce((s, r) => s + r.stars, 0),
  releases: data.repos.reduce((s, r) => s + r.releaseCount, 0),
  pullRequests: data.totals.pullRequests,
  repos: data.repos.filter((r) => !r.archived).length,
  streak: currentStreak(data),
  followers: data.followers,
});

export const ago = (iso: string, now: Date): string => {
  const s = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [31_536_000, "y"],
    [2_592_000, "mo"],
    [604_800, "w"],
    [86_400, "d"],
    [3_600, "h"],
    [60, "min"],
  ];
  for (const [size, unit] of units) if (s >= size) return `${Math.floor(s / size)}${unit} ago`;
  return "just now";
};

export const compact = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n));
