import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveToken } from "../data/github";
import { rest } from "../data/rest";
import { parseTitle } from "../play/command";
import { type ExecResult, execPlay, fixtureDir } from "../play/exec";
import { installTools } from "../play/install";
import { type PlayState, parsePlayState } from "../play/state";
import { checkoutOutput, publishOutput, readDist, writeDist } from "../publish";
import { finalize, renderPlayCard } from "../render";
import { config, env, REPO } from "./env";

/** What the read-only "run" job hands to the "respond" job. */
export type PlayResult = { ok: false; reason: string } | ({ ok: true; shown: string; version: string } & ExecResult);

const MAX_RUNS_PER_HOUR = 6;
const BOT = "github-actions[bot]";

/**
 * Job 1, read-only token, no secrets: parse the title, install the latest
 * releases and run the allowlisted command. Writes a PlayResult to RESULT_FILE.
 */
export const playRun = async () => {
  const write = (r: PlayResult) => writeFileSync(env("RESULT_FILE"), JSON.stringify(r));
  const parsed = parseTitle(env("ISSUE_TITLE"), config);
  if (!parsed.ok) return write(parsed);

  const token = await resolveToken();
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const q = `repo:${REPO} label:play author:${env("ISSUE_AUTHOR")} created:>${since}`;
  const recent = await rest<{ total_count: number }>(token, "GET", `/search/issues?q=${encodeURIComponent(q)}`);
  if (recent.total_count > MAX_RUNS_PER_HOUR)
    return write({ ok: false, reason: "That's a lot of runs in one hour. Give it a bit and try again." });

  const work = mkdtempSync(join(tmpdir(), "tools-"));
  const binDir = join(work, "bin");
  const tags = installTools(config.play.tools, config.login, binDir, work);
  const result = await execPlay(parsed.argv, fixtureDir("dev"), binDir);
  write({ ok: true, shown: parsed.shown, version: tags[parsed.argv[0] ?? ""] ?? "", ...result });
};

/** Code fence long enough that no backtick run in the output can close it. */
const fence = (lines: string[]) => {
  const body = lines.join("\n") || "(no output)";
  const ticks = "`".repeat(Math.max(3, ...[...body.matchAll(/`+/g)].map((m) => m[0].length + 1)));
  return `${ticks}console\n${body}\n${ticks}`;
};

const reply = (r: PlayResult): string => {
  const profile = `https://github.com/${config.login}`;
  if (!r.ok) {
    const commands = config.play.commands.map((c) => `- \`${c.arg ? `${c.run} <your text>` : c.run}\``).join("\n");
    return `${r.reason}\n\nHere's what I can run:\n${commands}\n\nOpen a new issue from the links on the [profile](${profile}) and edit the title if the command takes text.`;
  }
  return [
    `\`${r.shown}\` · **${r.version}** · exit ${r.code}${r.timedOut ? " (timed out)" : ""} · ${r.ms} ms`,
    fence([`$ ${r.shown}`, ...r.output]),
    `Thanks for trying it. This ran the latest release on a [small demo folder](https://github.com/${REPO}/tree/main/play/fixtures/dev). Your run is now on the [profile](${profile}).`,
  ].join("\n\n");
};

/**
 * Job 2, never runs visitor input: answer in the issue, close and lock it, and
 * redraw the "last run" card. Safe to re-run: it won't answer twice.
 */
export const playRespond = async () => {
  const token = env("GH_TOKEN");
  const number = Number(env("ISSUE_NUMBER"));
  const author = env("ISSUE_AUTHOR");
  const r = JSON.parse(readFileSync(env("RESULT_FILE"), "utf8")) as PlayResult;
  const issue = `/repos/${REPO}/issues/${number}`;

  const comments = await rest<{ user: { login: string } }[]>(token, "GET", `${issue}/comments?per_page=100`);
  if (!comments.some((c) => c.user.login === BOT)) {
    await rest(token, "POST", `${issue}/comments`, { body: reply(r) });
    await rest(token, "PATCH", issue, { state: "closed", state_reason: r.ok ? "completed" : "not_planned" });
    await rest(token, "PUT", `${issue}/lock`, { lock_reason: "resolved" }).catch(() => {}); // already locked is fine
  }
  if (!r.ok) return;

  checkoutOutput(config.login, token);
  const previous = parsePlayState(readDist("play.json"));
  if (previous.last?.issue === number) return; // this run is already on the card
  const state: PlayState = {
    runs: previous.runs + 1,
    last: { user: author, command: r.shown, output: r.output, ok: r.code === 0, at: new Date().toISOString(), issue: number },
  };
  const files = await finalize(renderPlayCard({ play: state, now: new Date() }));
  files.set("play.json", `${JSON.stringify(state, null, 2)}\n`);
  writeDist(files);
  publishOutput(config.login, token, `play: @${author} ran ${r.shown}`);
};
