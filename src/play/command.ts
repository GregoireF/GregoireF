import { argvOf, type PlayCommand, type ProfileConfig } from "../config";

export type Parsed = { ok: true; argv: string[]; shown: string } | { ok: false; reason: string };

/** How a command is shown on the profile: free text is marked `<…>`. */
export const display = (c: PlayCommand): string => (c.arg ? `${c.run} <…>` : c.run);

/**
 * Printable, single line. No "@" (would ping people in the reply) and no
 * backtick (would break the code block). Anything else is refused, not cleaned.
 */
const SAFE_ARG = /^[\p{L}\p{N}\p{Emoji_Presentation} _\-.,:;!?'"()[\]{}#/+=*&%~|^]+$/u;

/**
 * Turns an issue title into an argv. The argv always comes from the config;
 * the only part a visitor controls is one free-text argument, passed as a
 * single element to spawn (no shell), for commands that declare `arg`.
 */
export const parseTitle = (title: string, config: ProfileConfig): Parsed => {
  const m = /^\s*run:\s*(.+?)\s*$/i.exec(title);
  if (!m?.[1]) return { ok: false, reason: 'The title should start with "run:".' };
  const asked = m[1].replace(/\s+/g, " ");

  for (const c of config.play.commands) {
    if (!c.arg) {
      if (asked === c.run) return { ok: true, argv: argvOf(c.run), shown: c.run };
      continue;
    }
    if (asked !== c.run && !asked.startsWith(`${c.run} `)) continue;
    const free = asked.slice(c.run.length).trim().replace(/^<|>$/g, "");
    if (!free || free === "…")
      return { ok: false, reason: `\`${c.run}\` needs some text after it, for example \`${c.run} ${c.arg.example}\`.` };
    if ([...free].length > c.arg.max) return { ok: false, reason: `Keep the text under ${c.arg.max} characters.` };
    if (!SAFE_ARG.test(free)) return { ok: false, reason: "The text has characters I don't accept here. Plain text only." };
    return { ok: true, argv: [...argvOf(c.run), free], shown: `${c.run} ${free}` };
  }
  return { ok: false, reason: `\`${asked}\` isn't one of the commands I can run here.` };
};

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI escapes is the point
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;

/** Strips colours and machine paths, caps the size. */
export const cleanOutput = (raw: string, cwd: string, maxLines = 40): string[] => {
  const lines = raw
    .replace(ANSI, "")
    .replaceAll(cwd, "~/dev")
    .replace(/\/(home|tmp|opt)\/[^\s)]*/g, "…")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""));
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines.length > maxLines ? [...lines.slice(0, maxLines), `… ${lines.length - maxLines} more lines`] : lines;
};

export const issueLink = (login: string, c: PlayCommand): string => {
  const title = c.arg ? `run: ${c.run} ${c.arg.example}` : `run: ${c.run}`;
  return `https://github.com/${login}/${login}/issues/new?template=play.yml&title=${encodeURIComponent(title)}`;
};
