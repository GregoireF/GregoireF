import { buttonWidth } from "./cards/button";
import type { ProfileConfig } from "./config";
import type { Repo } from "./data/github";
import { buttons, sections } from "./layout";
import { display, issueLink } from "./play/command";

/**
 * The README only depends on the config and on which repos are showcased.
 * Everything that changes over time lives in the SVG cards on the `output`
 * branch, so main only ever holds commits made by a person.
 */

const raw = (login: string, file: string) => `https://raw.githubusercontent.com/${login}/${login}/output/${file}`;

const picture = (login: string, name: string, alt: string, width: string) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="${raw(login, `${name}-dark.svg`)}"><img alt="${alt}" src="${raw(login, `${name}-light.svg`)}" width="${width}"></picture>`;

/**
 * A clickable card. GitHub takes <picture> apart inside a link and ignores the
 * old #gh-*-mode-only fragments, so a linked card is one adaptive SVG that
 * holds both themes (see `adaptive` in render.ts).
 */
const linkedCard = (login: string, name: string, alt: string, width: string | number, href: string) =>
  `<a href="${href}"><img alt="${alt}" src="${raw(login, `${name}.svg`)}" width="${width}"></a>`;

export const projectCardName = (repo: string) => `project-${repo}`;

export const renderReadme = (config: ProfileConfig, showcase: Repo[]): string => {
  const { login, contact, availability } = config;
  const heading = Object.fromEntries(sections(config).map((s) => [s.id, picture(login, `section-${s.id}`, s.title, "100%")]));
  const out: string[] = [];
  const push = (...lines: string[]) => out.push(...lines);

  push(
    "<!-- Generated from profile.config.ts by `bun run build`. Edit that file, not this one. -->",
    "",
    '<div align="center">',
    "",
    picture(login, "hero", `${config.name}, ${config.role}. A short loop showing real output of kiwa, ship-it and addlicense.`, "100%"),
    "",
    // One line, so the buttons sit side by side.
    buttons(config)
      .map((b) => linkedCard(login, `button-${b.id}`, b.label, buttonWidth(b), b.href))
      .join(" "),
    "",
    "</div>",
    "",
    ...config.intro.flatMap((p) => [p, ""]),
    picture(login, "now", "Now: my last push, my last release and where my time went", "100%"),
    "",
    heading.tools,
    "",
    // One line, so the cards sit two by two whatever the renderer does with newlines.
    showcase.map((repo) => linkedCard(login, projectCardName(repo.name), `${repo.name}: ${repo.description}`, "49%", repo.url)).join(" "),
    "",
    heading.play,
    "",
    "Each link opens an issue with a command in its title. Submit it, and a workflow installs the latest release, runs the command on a small demo folder and answers in the issue, usually within a minute. Where you see `<…>`, put your own text in the title first.",
    "",
    "| Run | What you get |",
    "| :-- | :-- |",
    ...config.play.commands.map((c) => `| [\`${display(c)}\`](${issueLink(login, c)}) | ${c.hint} |`),
    "",
    picture(login, "play", "The last command someone ran from this page, and its output", "100%"),
    "",
    heading.radar,
    "",
    picture(login, "radar", "Latest releases across my repositories", "100%"),
    "",
    heading.activity,
    "",
    picture(login, "stats", "Contributions, streak, pull requests, releases and followers", "100%"),
    picture(login, "skyline", "A year of contributions drawn as a skyline, one building per week", "100%"),
    "",
    "<details>",
    "<summary>Languages and coding time</summary>",
    "<br>",
    "",
    `${picture(login, "languages", "Languages across my public repositories", "49%")} ${config.wakatime.enabled ? picture(login, "wakatime", "Coding time over the last 30 days", "49%") : ""}`.trim(),
    "",
    "</details>",
    "",
    heading.stack,
    "",
    picture(login, "stack", `My stack: ${config.stack.map((r) => r.label).join(", ")}`, "100%"),
    "",
    heading.work,
    "",
    availability.open
      ? `I'm open to ${listJoin(availability.kinds.map((k) => k.toLowerCase()))} work. ${availability.note} Email is the quickest way to reach me: [${contact.email}](mailto:${contact.email}). I'm also on [LinkedIn](${contact.linkedin}).`
      : `Not looking right now, but email works: [${contact.email}](mailto:${contact.email}).`,
    "",
    linkedCard(login, "footer", `${config.name}. ${config.motto} How this page is made.`, "100%", "docs/how-it-works.md"),
    "",
    `<p align="right"><img alt="Profile views" src="https://komarev.com/ghpvc/?username=${login}&style=flat-square&color=818cf8&label=profile%20views"></p>`,
    "",
  );
  return out.join("\n");
};

const listJoin = (items: string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
