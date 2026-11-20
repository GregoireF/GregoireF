import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ProfileConfig } from "./config";
import { graphql } from "./data/github";
import { esc } from "./svg/core";

/**
 * A local copy of the profile page: the sidebar from `account` in the config
 * (so profile-as-code is previewed too), the README as GitHub renders it
 * (through GitHub's own markdown API) in its 830px column, and the pinned repos.
 * Cards come from dist/ instead of the output branch. Theme toggle included.
 */

/** Every card, dark next to light, for design work. Returns the page path. */
export const writeCardsPreview = (dist: string): string => {
  const dark = readdirSync(dist).filter((n) => n.endsWith("-dark.svg"));
  const cell = (n: string, bg: string) => `<div style="background:${bg};padding:24px"><img src="${n}" style="max-width:100%"></div>`;
  const html = `<!doctype html><meta charset="utf-8"><title>Profile cards</title>
<style>body{margin:0;font:14px system-ui;background:#888}.row{display:grid;grid-template-columns:1fr 1fr}h2{margin:0;padding:8px 24px;background:#222;color:#eee;font-size:13px}</style>
${dark.map((d) => `<h2>${d.replace("-dark.svg", "")}</h2><div class="row">${cell(d, "#0d1117")}${cell(d.replace("-dark", "-light"), "#ffffff")}</div>`).join("\n")}`;
  const file = join(dist, "cards.html");
  writeFileSync(file, html);
  return file;
};

interface Pinned {
  name: string;
  description: string | null;
  stargazerCount: number;
  primaryLanguage: { name: string; color: string } | null;
}

const PROFILE_QUERY = `query($login: String!) { user(login: $login) {
  avatarUrl(size: 460) followers { totalCount } following { totalCount }
  pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name description stargazerCount primaryLanguage { name color } } } }
} }`;

export const writeProfilePreview = async (config: ProfileConfig, token: string, dist: string): Promise<string> => {
  const repo = `${config.login}/${config.login}`;
  const [res, { user }] = await Promise.all([
    fetch("https://api.github.com/markdown", {
      method: "POST",
      headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "profile-generator" },
      // "markdown" mode, like README files: "gfm" would turn every newline into <br>.
      body: JSON.stringify({ text: readFileSync("README.md", "utf8"), mode: "markdown", context: repo }),
    }),
    graphql<{
      user: { avatarUrl: string; followers: { totalCount: number }; following: { totalCount: number }; pinnedItems: { nodes: Pinned[] } };
    }>(PROFILE_QUERY, { login: config.login }, token),
  ]);
  if (!res.ok) throw new Error(`markdown API ${res.status}`);
  const readme = (await res.text()).replaceAll(`https://raw.githubusercontent.com/${repo}/output/`, "");
  const a = config.account;
  const pinned = user.pinnedItems.nodes
    .map(
      (p) => `<div class="pin"><a href="https://github.com/${config.login}/${p.name}">${esc(p.name)}</a><span class="badge">Public</span>
<p>${esc(p.description ?? "")}</p><small>${p.primaryLanguage ? `<i style="background:${p.primaryLanguage.color}"></i>${esc(p.primaryLanguage.name)} &nbsp; ` : ""}★ ${p.stargazerCount}</small></div>`,
    )
    .join("");

  const page = `<!doctype html><html data-theme="dark"><meta charset="utf-8"><title>${esc(config.login)} · profile preview</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown-dark.css" id="css">
<style>
  :root { --bg:#0d1117; --fg:#e6edf3; --muted:#9198a1; --border:#3d444d; --link:#4493f8; }
  html[data-theme=light] { --bg:#fff; --fg:#1f2328; --muted:#59636e; --border:#d1d9e0; --link:#0969da; }
  body { margin:0; background:var(--bg); color:var(--fg); font:14px -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif; }
  header { border-bottom:1px solid var(--border); padding:16px 32px; display:flex; justify-content:space-between; align-items:center; }
  header b { font-size:16px; }
  button { font:13px inherit; padding:5px 12px; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--fg); cursor:pointer; }
  .wrap { max-width:1280px; margin:24px auto; padding:0 32px; display:flex; gap:24px; }
  aside { width:296px; flex:none; }
  aside img { width:296px; height:296px; border-radius:50%; border:1px solid var(--border); }
  aside h1 { margin:16px 0 0; font-size:24px; line-height:1.25; } aside h2 { margin:0; font-size:20px; font-weight:300; color:var(--muted); }
  aside p { font-size:16px; } aside ul { list-style:none; padding:0; color:var(--fg); } aside li { margin:6px 0; } aside a { color:var(--link); }
  .muted { color:var(--muted); }
  main { flex:1; min-width:0; }
  .box { border:1px solid var(--border); border-radius:6px; padding:24px; }
  .box > .path { font-size:12px; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; margin-bottom:16px; }
  .markdown-body { background:transparent !important; }
  html[data-theme=dark] img[src$="#gh-light-mode-only"], html[data-theme=light] img[src$="#gh-dark-mode-only"] { display:none; }
  .pins { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:24px; }
  .pins h3 { grid-column:1/-1; margin:0; font-size:16px; font-weight:400; }
  .pin { border:1px solid var(--border); border-radius:6px; padding:16px; } .pin a { color:var(--link); font-weight:600; text-decoration:none; }
  .pin p { color:var(--muted); font-size:12px; } .pin small { color:var(--muted); font-size:12px; }
  .pin i { display:inline-block; width:12px; height:12px; border-radius:50%; vertical-align:-1px; margin-right:4px; }
  .badge { border:1px solid var(--border); border-radius:2em; padding:0 7px; font-size:12px; color:var(--muted); margin-left:8px; }
  @media (max-width: 1011px) { .wrap { flex-direction:column; } aside img { width:96px; height:96px; } }
</style>
<header><b>${esc(config.login)}</b><span class="muted">local preview · not published</span><button id="t">Light</button></header>
<div class="wrap">
  <aside>
    <img src="${user.avatarUrl}" alt="">
    <h1>${esc(config.name)}</h1><h2>${esc(config.login)}</h2>
    <p>${esc(a.bio)}</p>
    <div class="muted">${user.followers.totalCount} followers · ${user.following.totalCount} following</div>
    <ul><li>🏢 ${esc(a.company)}</li><li>📍 ${esc(config.location)}</li><li>🔗 <a href="${esc(a.blog)}">${esc(decodeURIComponent(a.blog).replace(/^https?:\/\/(www\.)?/, ""))}</a></li></ul>
  </aside>
  <main>
    <div class="box"><div class="path">${esc(config.login)} / README.md</div><article class="markdown-body">${readme}</article></div>
    <div class="pins"><h3>Pinned</h3>${pinned}</div>
  </main>
</div>
<script>
  const css = document.getElementById("css"), btn = document.getElementById("t");
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    css.href = "https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown-" + theme + ".css";
    btn.textContent = theme === "dark" ? "Light" : "Dark";
    // <picture> follows the OS; GitHub follows its own theme setting. Mimic GitHub.
    document.querySelectorAll("picture").forEach((p) => {
      const img = p.querySelector("img"), src = p.querySelector("source");
      if (!img) return;
      if (!img.dataset.light) img.dataset.light = img.getAttribute("src");
      if (src) { img.dataset.dark = src.getAttribute("srcset"); src.remove(); }
      img.src = theme === "dark" ? img.dataset.dark : img.dataset.light;
    });
  };
  btn.onclick = () => apply(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  apply(new URLSearchParams(location.search).get("theme") === "light" ? "light" : "dark");
</script></html>`;
  const file = join(dist, "profile.html");
  writeFileSync(file, page);
  return file;
};
