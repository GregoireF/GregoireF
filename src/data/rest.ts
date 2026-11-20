/** Minimal GitHub REST client for the few writes the workflows do. */

export class GithubError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const rest = async <T = unknown>(token: string, method: string, path: string, body?: unknown): Promise<T> => {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      authorization: `bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "profile-generator",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new GithubError(res.status, `${method} ${path} → ${res.status} ${await res.text()}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
};

interface Issue {
  number: number;
  title: string;
}

/**
 * Keeps exactly one open issue per `key` (stored as a hidden marker in the body).
 * Used for "README out of date" and failing workflows.
 */
export const upsertIssue = async (token: string, repo: string, key: string, title: string, body: string, labels: string[]) => {
  const marker = `<!-- profile-bot:${key} -->`;
  const open = await rest<(Issue & { body: string })[]>(
    token,
    "GET",
    `/repos/${repo}/issues?state=open&per_page=100&labels=${labels.join(",")}`,
  );
  const found = open.find((i) => i.body?.includes(marker));
  if (found) {
    await rest(token, "POST", `/repos/${repo}/issues/${found.number}/comments`, { body });
    return found.number;
  }
  const created = await rest<Issue>(token, "POST", `/repos/${repo}/issues`, { title, body: `${marker}\n${body}`, labels });
  return created.number;
};

export const closeIssue = async (token: string, repo: string, key: string, labels: string[], comment: string) => {
  const marker = `<!-- profile-bot:${key} -->`;
  const open = await rest<(Issue & { body: string })[]>(
    token,
    "GET",
    `/repos/${repo}/issues?state=open&per_page=100&labels=${labels.join(",")}`,
  );
  for (const i of open.filter((x) => x.body?.includes(marker))) {
    await rest(token, "POST", `/repos/${repo}/issues/${i.number}/comments`, { body: comment });
    await rest(token, "PATCH", `/repos/${repo}/issues/${i.number}`, { state: "closed", state_reason: "completed" });
  }
};
