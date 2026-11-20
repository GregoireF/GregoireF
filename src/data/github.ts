/** Everything the cards need from GitHub, in one GraphQL round trip. */

export interface Release {
  repo: string;
  tag: string;
  url: string;
  publishedAt: string;
}

export interface Repo {
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  archived: boolean;
  pushedAt: string;
  topics: string[];
  language?: { name: string; color: string };
  languages: { name: string; color: string; size: number }[];
  releases: Release[];
  releaseCount: number;
  lastCommit?: { message: string; date: string };
}

export interface Day {
  date: string;
  count: number;
}

export interface GithubData {
  login: string;
  followers: number;
  repos: Repo[];
  calendar: { total: number; weeks: Day[][] };
  totals: { commits: number; pullRequests: number; reviews: number; issues: number };
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes {
        name description url stargazerCount forkCount isArchived pushedAt
        primaryLanguage { name color }
        defaultBranchRef { target { ... on Commit { messageHeadline committedDate } } }
        repositoryTopics(first: 20) { nodes { topic { name } } }
        languages(first: 12, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
        releases(first: 5, orderBy: { field: CREATED_AT, direction: DESC }) {
          totalCount
          nodes { tagName url publishedAt isDraft isPrerelease }
        }
      }
    }
  }
}`;

export const resolveToken = async (): Promise<string> => {
  const env = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (env) return env;
  const gh = Bun.spawnSync(["gh", "auth", "token"], { stdout: "pipe", stderr: "ignore" });
  const token = gh.stdout.toString().trim();
  if (!token) throw new Error("No token: set GH_TOKEN or run `gh auth login`.");
  return token;
};

export const graphql = async <T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> => {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "profile-generator" },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || json.errors?.length || !json.data) {
    throw new Error(`GitHub GraphQL ${res.status}: ${json.errors?.map((e) => e.message).join("; ") ?? res.statusText}`);
  }
  return json.data;
};

// biome-ignore lint/suspicious/noExplicitAny: raw GraphQL payload, narrowed right below
type Raw = any;

export const fetchGithub = async (login: string, token: string, ignored: string[] = []): Promise<GithubData> => {
  const { user } = await graphql<{ user: Raw }>(QUERY, { login }, token);
  const cc = user.contributionsCollection;
  const repos: Repo[] = user.repositories.nodes
    .filter((r: Raw) => !ignored.includes(r.name))
    .map((r: Raw) => ({
      name: r.name,
      description: r.description ?? "",
      url: r.url,
      stars: r.stargazerCount,
      forks: r.forkCount,
      archived: r.isArchived,
      pushedAt: r.pushedAt,
      topics: r.repositoryTopics.nodes.map((n: Raw) => n.topic.name),
      language: r.primaryLanguage ?? undefined,
      languages: r.languages.edges.map((e: Raw) => ({ name: e.node.name, color: e.node.color ?? "#888", size: e.size })),
      releaseCount: r.releases.totalCount,
      lastCommit: r.defaultBranchRef?.target?.messageHeadline
        ? { message: r.defaultBranchRef.target.messageHeadline, date: r.defaultBranchRef.target.committedDate }
        : undefined,
      releases: r.releases.nodes
        .filter((n: Raw) => !n.isDraft && n.publishedAt)
        .map((n: Raw) => ({ repo: r.name, tag: n.tagName, url: n.url, publishedAt: n.publishedAt })),
    }));
  return {
    login,
    followers: user.followers.totalCount,
    repos,
    calendar: {
      total: cc.contributionCalendar.totalContributions,
      weeks: cc.contributionCalendar.weeks.map((w: Raw) =>
        w.contributionDays.map((d: Raw) => ({ date: d.date, count: d.contributionCount })),
      ),
    },
    totals: {
      commits: cc.totalCommitContributions,
      pullRequests: cc.totalPullRequestContributions,
      reviews: cc.totalPullRequestReviewContributions,
      issues: cc.totalIssueContributions,
    },
  };
};
