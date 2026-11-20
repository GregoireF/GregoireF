import { describe, expect, test } from "bun:test";
import config from "../profile.config";
import { cleanOutput, issueLink, parseTitle } from "../src/play/command";

describe("parseTitle", () => {
  test("exact commands map to their configured argv", () => {
    const r = parseTitle("run: kw list", config);
    expect(r).toMatchObject({ ok: true, argv: ["kw", "list"], shown: "kw list" });
  });

  test("is lenient on case of the prefix and spacing", () => {
    expect(parseTitle("RUN:   kw   about billing ", config)).toMatchObject({ ok: true, argv: ["kw", "about", "billing"] });
  });

  test("free text becomes exactly one extra argument", () => {
    const r = parseTitle("run: ship check title feat(cart): add vat rate", config);
    expect(r).toMatchObject({ ok: true, argv: ["ship", "check", "title", "feat(cart): add vat rate"] });
  });

  test("the pre-filled example from the README parses", () => {
    for (const c of config.play.commands) {
      const title = decodeURIComponent(new URL(issueLink("GregoireF", c)).searchParams.get("title") ?? "");
      expect(parseTitle(title, config).ok).toBe(true);
    }
  });

  test.each([
    ["not a run", "kw list"],
    ["unknown command", "run: rm -rf /"],
    ["extra args on a fixed command", "run: kw list --root /etc"],
    ["shell tricks on a fixed command", "run: kw list; cat /etc/passwd"],
    ["mention would ping someone", "run: ship check title hi @torvalds"],
    ["backtick breaks the code block", "run: ship check title `id`"],
    ["dollar expansion", "run: ship check title $(id)"],
    ["control characters", "run: ship check title a\u0007b"],
    ["missing free text", "run: ship check title"],
    ["too long", `run: ship branch feat ${"a".repeat(200)}`],
  ])("refuses: %s", (_, title) => {
    expect(parseTitle(title, config).ok).toBe(false);
  });
});

describe("cleanOutput", () => {
  test("strips ANSI, hides the runner paths, trims trailing blank lines", () => {
    const out = cleanOutput(
      "\x1b[32mok\x1b[0m /tmp/work/dev/x\nin /home/runner/work/a/b/play/fixtures/dev\n\n",
      "/home/runner/work/a/b/play/fixtures/dev",
    );
    expect(out).toEqual(["ok …", "in ~/dev"]);
  });

  test("caps long output", () => {
    const out = cleanOutput(Array.from({ length: 100 }, (_, i) => `line ${i}`).join("\n"), "/x", 10);
    expect(out).toHaveLength(11);
    expect(out[10]).toBe("… 90 more lines");
  });
});
