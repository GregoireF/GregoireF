#!/usr/bin/env bun
import { build, cards, readme } from "./commands/build";
import { config, log, REPO, summary } from "./commands/env";
import { heal } from "./commands/heal";
import { playRespond, playRun } from "./commands/play";
import { resolveToken } from "./data/github";
import { syncLabels, syncProfile } from "./sync";

const [command, ...args] = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);

const USAGE = `usage: bun src/cli.ts <command>
  build [--open]                     README, every card, and local preview pages in dist/
  readme [--check]                   write README.md, or exit 2 if it's out of date
  cards [--publish] [--film] [--drift]   render cards (CI publishes them to the output branch)
  sync                               push account, repo settings and labels to GitHub
  play run | play respond            the two jobs of the Play workflow
  heal                               the Auto-heal workflow`;

const sync = async () => {
  const token = await resolveToken();
  const report = [...(await syncProfile(config, token)), await syncLabels(REPO, process.env.LABELS_TOKEN ?? token)];
  for (const r of report) log(`${r.ok ? "✓" : "✗"} ${r.step}: ${r.detail}`);
  summary(`### Profile sync\n${report.map((r) => `- ${r.ok ? "✓" : "✗"} **${r.step}**: ${r.detail}`).join("\n")}`);
  if (report.some((r) => !r.ok)) process.exit(1);
};

switch (command) {
  case "build":
    await build({ open: flag("open") });
    break;
  case "readme":
    if (!(await readme(await resolveToken(), flag("check"))) && flag("check")) {
      console.error("README.md is out of date. Run `bun run build` and commit.");
      process.exit(2);
    }
    break;
  case "cards":
    await cards({ publish: flag("publish"), film: flag("film"), drift: flag("drift") });
    break;
  case "sync":
    await sync();
    break;
  case "play":
    if (args[0] === "run") await playRun();
    else if (args[0] === "respond") await playRespond();
    else throw new Error("usage: play run|respond");
    break;
  case "heal":
    await heal();
    break;
  default:
    console.error(USAGE);
    process.exit(1);
}
