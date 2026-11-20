import type { Day, GithubData, Repo } from "../src/data/github";

export const NOW = new Date("2026-11-20T12:00:00Z");

const repo = (name: string, extra: Partial<Repo> = {}): Repo => ({
  name,
  description: `${name} does a useful thing for developers, with a description long enough to wrap over a few lines.`,
  url: `https://github.com/GregoireF/${name}`,
  stars: 2,
  forks: 0,
  archived: false,
  pushedAt: "2026-11-10T10:00:00Z",
  topics: [],
  language: { name: "Go", color: "#00ADD8" },
  languages: [{ name: "Go", color: "#00ADD8", size: 1000 }],
  releases: [],
  releaseCount: 0,
  ...extra,
});

const weeks = (): Day[][] =>
  Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => ({
      date: new Date(Date.UTC(2025, 10, 16 + w * 7 + d)).toISOString().slice(0, 10),
      count: (w * 7 + d) % 5 === 0 ? 0 : ((w + d) % 9) + 1,
    })),
  );

export const data: GithubData = {
  login: "GregoireF",
  followers: 54,
  repos: [
    repo("kiwa", {
      stars: 12,
      language: { name: "Rust", color: "#dea584" },
      languages: [{ name: "Rust", color: "#dea584", size: 5000 }],
      releases: [{ repo: "kiwa", tag: "v0.1.0", url: "#", publishedAt: "2026-11-15T18:15:39Z" }],
      releaseCount: 1,
    }),
    repo("ship-it", {
      releases: [{ repo: "ship-it", tag: "v0.1.2", url: "#", publishedAt: "2026-11-12T23:23:55Z" }],
      releaseCount: 3,
    }),
    repo("addlicense"),
    repo("tagged-tool", { topics: ["showcase"], stars: 5 }),
    repo("old-tagged", { topics: ["showcase"], archived: true }),
    repo("utils", {
      language: { name: "TypeScript", color: "#3178c6" },
      languages: [
        { name: "TypeScript", color: "#3178c6", size: 3000 },
        { name: "HTML", color: "#e34c26", size: 9000 },
      ],
      releases: [{ repo: "utils", tag: "@gregoiref/result@1.1.0", url: "#", publishedAt: "2026-05-16T13:19:47Z" }],
      releaseCount: 1,
    }),
  ],
  calendar: { total: 1234, weeks: weeks() },
  totals: { commits: 900, pullRequests: 80, reviews: 10, issues: 20 },
};
