import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import config from "../profile.config";
import { argvOf, defineProfile } from "../src/config";
import { verifyChecksum } from "../src/play/install";

const sha = (s: string) => new Bun.CryptoHasher("sha256").update(s).digest("hex");

const release = (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), "release-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
};

describe("verifyChecksum", () => {
  test("accepts an archive listed with the right sha256 (GoReleaser and sha256sum formats)", () => {
    expect(() => verifyChecksum(release({ "a.tar.gz": "bin", "checksums.txt": `${sha("bin")}  a.tar.gz\n` }), "a.tar.gz")).not.toThrow();
    expect(() => verifyChecksum(release({ "a.tar.xz": "bin", "sha256.sum": `${sha("bin")} *a.tar.xz\n` }), "a.tar.xz")).not.toThrow();
  });

  test("refuses a tampered archive", () => {
    expect(() => verifyChecksum(release({ "a.tar.gz": "evil", "checksums.txt": `${sha("bin")}  a.tar.gz\n` }), "a.tar.gz")).toThrow(
      /mismatch/,
    );
  });

  test("refuses an archive missing from the checksum file", () => {
    expect(() => verifyChecksum(release({ "a.tar.gz": "bin", "checksums.txt": `${sha("bin")}  other.tar.gz\n` }), "a.tar.gz")).toThrow(
      /not listed/,
    );
  });

  test("refuses a release without any checksum file", () => {
    expect(() => verifyChecksum(release({ "a.tar.gz": "bin" }), "a.tar.gz")).toThrow(/no checksum file/);
  });
});

describe("config", () => {
  test("commands are split on spaces, never handed to a shell", () => {
    expect(argvOf("  addlicense   --check . ")).toEqual(["addlicense", "--check", "."]);
  });

  test("a command using a tool that isn't installed is rejected", () => {
    const bad = structuredClone(config);
    bad.play.commands.push({ run: "rm -rf /", hint: "no" });
    expect(() => defineProfile(bad)).toThrow(/rm/);
  });
});
