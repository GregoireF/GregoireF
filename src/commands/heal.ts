import { closeIssue, rest, upsertIssue } from "../data/rest";
import { env, log, REPO } from "./env";

/**
 * Runs after any watched workflow ends. Green: close its failure issue if one
 * is open. Red the first time: re-run the failed jobs (most failures here are
 * network hiccups). Red again: open an issue, or comment on the open one.
 */
export const heal = async () => {
  const token = env("GH_TOKEN");
  const name = env("WF_NAME");
  const conclusion = env("WF_CONCLUSION");
  const attempt = Number(env("WF_ATTEMPT"));
  const url = env("WF_URL");
  const key = `workflow:${name}`;

  if (conclusion === "success") {
    await closeIssue(token, REPO, key, ["auto-heal"], `Back to green: ${url}`);
    return log(`${name}: green`);
  }
  if (conclusion !== "failure") return log(`${name}: ${conclusion}, ignored`);
  if (attempt === 1) {
    await rest(token, "POST", `/repos/${REPO}/actions/runs/${env("WF_RUN_ID")}/rerun-failed-jobs`);
    return log(`${name}: failed once, re-running the failed jobs`);
  }
  await upsertIssue(
    token,
    REPO,
    key,
    `Workflow failing: ${name}`,
    `**${name}** failed ${attempt} times in a row; the automatic retry didn't fix it.\n\nRun: ${url}\n\nThis issue closes by itself on the next green run.`,
    ["auto-heal"],
  );
  log(`${name}: issue opened`);
};
