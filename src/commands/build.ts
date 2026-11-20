import { readFileSync, writeFileSync } from "node:fs";
import type { Ctx } from "../cards/types";
import { fetchGithub, resolveToken } from "../data/github";
import { showcase } from "../data/model";
import { closeIssue, rest, upsertIssue } from "../data/rest";
import { fetchWakatime } from "../data/wakatime";
import { captureHero, fingerprintOf, type HeroCapture } from "../hero/capture";
import sample from "../hero/sample.json";
import { parsePlayState } from "../play/state";
import { writeCardsPreview, writeProfilePreview } from "../preview";
import { checkoutOutput, DIST, publishOutput, readDist, writeDist } from "../publish";
import { renderReadme } from "../readme";
import { finalize, renderAll } from "../render";
import { config, env, log, REPO, summary } from "./env";

/** Writes README.md, or with `check`, only says whether it's up to date. */
export const readme = async (token: string, check = false): Promise<boolean> => {
  const data = await fetchGithub(config.login, token, config.ignoredRepos);
  const next = renderReadme(config, showcase(data, config));
  const inSync = next === readFileSync("README.md", "utf8");
  if (!check && !inSync) writeFileSync("README.md", next);
  if (!check) log(inSync ? "README.md already up to date" : "README.md written");
  return inSync;
};

/**
 * The hero's footage. Reused from the output branch while the releases and the
 * scenes stay the same; filmed again (tools installed and run for real) when
 * one of them changes. Filming needs Linux, so locally the last footage is used.
 */
const footage = async (token: string, film: boolean): Promise<HeroCapture> => {
  const stored = readDist("hero.json");
  const previous = stored ? (JSON.parse(stored) as HeroCapture) : undefined;
  if (film) {
    const versions: Record<string, string> = {};
    for (const tool of config.play.tools) {
      versions[tool.repo] = (
        await rest<{ tag_name: string }>(token, "GET", `/repos/${config.login}/${tool.repo}/releases/latest`)
      ).tag_name;
    }
    if (previous?.fingerprint !== fingerprintOf(config, versions)) {
      log("hero: releases or scenes changed, filming again");
      return captureHero(config);
    }
  }
  if (previous) return previous;
  log("hero: no footage on the output branch yet, using the sample");
  return sample as HeroCapture;
};

/** Opens or closes the "README is out of date" issue. */
const checkDrift = async (token: string, next: string) => {
  const key = "readme-drift";
  if (next === readFileSync("README.md", "utf8")) {
    await closeIssue(token, REPO, key, ["automation"], "README is back in sync.");
    return;
  }
  await upsertIssue(
    token,
    REPO,
    key,
    "README is out of date",
    "The showcased repos changed (a `showcase` topic was added or removed, or a repo was renamed).\n\nRun `bun run build` locally and commit the README.",
    ["automation"],
  );
  log("README drift: issue opened");
};

export interface CardsOptions {
  /** Push dist/ to the output branch (CI). */
  publish?: boolean;
  /** Run the tools to film the hero if a release changed (CI, Linux). */
  film?: boolean;
  /** Open or close the README drift issue (CI). */
  drift?: boolean;
}

export const cards = async ({ publish = false, film = false, drift = false }: CardsOptions = {}) => {
  const token = await resolveToken();
  // Writes use the workflow token, so commits and issues come from the bot, not the account.
  const botToken = publish ? env("PUBLISH_TOKEN") : undefined;
  checkoutOutput(config.login, botToken);
  const [data, waka, hero] = await Promise.all([
    fetchGithub(config.login, token, config.ignoredRepos),
    config.wakatime.enabled ? fetchWakatime(process.env.WAKATIME_API_KEY) : undefined,
    footage(token, film),
  ]);
  const ctx: Ctx = { config, data, waka, hero, play: parsePlayState(readDist("play.json")), now: new Date() };
  const files = await finalize(renderAll(ctx));
  files.set("hero.json", `${JSON.stringify(hero, null, 2)}\n`);
  writeDist(files);
  log(`rendered ${files.size} files into ${DIST}/`);

  if (botToken) {
    const pushed = publishOutput(config.login, botToken, "cards: refresh");
    log(pushed ? "output branch updated" : "no change, nothing pushed");
    summary(`### Cards\n${files.size} files rendered, ${pushed ? "**pushed** to `output`" : "unchanged"}.`);
    if (drift) await checkDrift(botToken, renderReadme(config, showcase(data, config)));
  }
};

/** README + every card + the two local preview pages. */
export const build = async ({ open = false } = {}) => {
  const token = await resolveToken();
  await readme(token);
  await cards();
  log(`cards: ${writeCardsPreview(DIST)}`);
  const page = await writeProfilePreview(config, token, DIST);
  log(`profile: ${page}`);
  if (open) {
    const opener =
      process.platform === "win32" ? ["cmd", "/c", "start", "", page] : [process.platform === "darwin" ? "open" : "xdg-open", page];
    Bun.spawn(opener, { stdout: "ignore", stderr: "ignore" });
  }
};
