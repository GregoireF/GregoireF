import type { Button } from "./cards/button";
import type { Section } from "./cards/section";
import type { ProfileConfig } from "./config";

/** The page structure, shared by the card renderer and the README writer. */

export const sections = (config: ProfileConfig): Section[] => [
  { id: "tools", title: "Tools I build", note: `${config.showcase.featured.length} open source projects` },
  { id: "play", title: "Try them from here", note: "real releases, run from an issue" },
  { id: "radar", title: "Release radar", note: "every repo, newest first" },
  { id: "activity", title: "Activity", note: "the last 12 months" },
  { id: "stack", title: "Stack", note: "what I reach for" },
  { id: "work", title: "Work with me", note: config.availability.open ? "open to work" : "not looking right now" },
];

export const buttons = (config: ProfileConfig): (Button & { href: string })[] => [
  { id: "email", label: "Email me", icon: "mail", color: "#818cf8", primary: true, href: `mailto:${config.contact.email}` },
  { id: "linkedin", label: "LinkedIn", icon: "linkedin", color: "#0a66c2", href: config.contact.linkedin },
  ...(config.contact.kofi
    ? [{ id: "kofi", label: "Ko-fi", icon: "kofi" as const, color: "#ff5e5b", href: `https://ko-fi.com/${config.contact.kofi}` }]
    : []),
];
