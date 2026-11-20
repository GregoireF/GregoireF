/**
 * Design tokens. Every card is drawn twice, once per theme, and the README
 * picks the right file the way GitHub does (<picture> or #gh-*-mode-only).
 */

export type ThemeName = "dark" | "light";

export interface Theme {
  name: ThemeName;
  bg: string;
  panel: string;
  panel2: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accent2: string;
  accent3: string;
  ok: string;
  warn: string;
  bad: string;
  grid: string;
  /** Contribution levels, from none to the busiest days. */
  heat: [string, string, string, string, string];
}

export const themes: Record<ThemeName, Theme> = {
  dark: {
    name: "dark",
    bg: "#0d1117",
    panel: "#0f1420",
    panel2: "#161d2c",
    border: "#232b3d",
    text: "#e8ebf4",
    muted: "#9aa3b8",
    faint: "#5f6984",
    accent: "#818cf8",
    accent2: "#c084fc",
    accent3: "#22d3ee",
    ok: "#4ade80",
    warn: "#fbbf24",
    bad: "#f87171",
    grid: "#ffffff",
    heat: ["#161d2e", "#2e3470", "#4f56c9", "#818cf8", "#c7d2fe"],
  },
  light: {
    name: "light",
    bg: "#ffffff",
    panel: "#fafbfe",
    panel2: "#f1f3fa",
    border: "#e2e5f0",
    text: "#141824",
    muted: "#525a6e",
    faint: "#959cae",
    accent: "#4f46e5",
    accent2: "#9333ea",
    accent3: "#0891b2",
    ok: "#15803d",
    warn: "#b45309",
    bad: "#dc2626",
    grid: "#1e2440",
    heat: ["#eef0f7", "#c7cbf6", "#9198ef", "#5b54e0", "#3730a3"],
  },
};

/** Each tool has its own colour. Anything else uses the brand accent. */
const TOOL_COLORS: Record<string, Record<ThemeName, string>> = {
  kiwa: { dark: "#a3e635", light: "#4d7c0f" },
  "ship-it": { dark: "#60a5fa", light: "#1d4ed8" },
  addlicense: { dark: "#fbbf24", light: "#b45309" },
  iac: { dark: "#c084fc", light: "#7e22ce" },
};

export const toolColor = (repo: string, t: Theme): string => TOOL_COLORS[repo]?.[t.name] ?? t.accent;

export const fallbackFont = {
  sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif`,
  mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`,
};
