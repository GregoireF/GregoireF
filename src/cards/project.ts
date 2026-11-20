import type { ProfileConfig } from "../config";
import type { Repo } from "../data/github";
import { ago, compact } from "../data/model";
import { esc, svg, textWidth, truncate, wrap } from "../svg/core";
import { type Theme, toolColor } from "../svg/theme";

const PROJECT_W = 436;
const H = 196;

/** One card per showcased repo, in the repo's own colour. */
export const project = (t: Theme, repo: Repo, config: ProfileConfig, now: Date): string => {
  const pad = 24;
  const c = toolColor(repo.name, t);
  const latest = repo.releases[0];
  const tag = latest?.tag.replace(/^.*@/, "");
  const tagW = tag ? textWidth(tag, 12, "mono", 600) + 22 : 0;
  const name = truncate(repo.name, PROJECT_W - pad * 2 - tagW - 52, 20, "mono", 600);
  const desc = wrap(repo.description || "No description yet.", PROJECT_W - pad * 2, 13.5, 3);
  const family = config.showcase.family[repo.name];

  const footer: string[] = [];
  let fx = pad;
  if (repo.language) {
    footer.push(
      `<circle cx="${fx + 5}" cy="${H - 26}" r="5" fill="${repo.language.color}"/>`,
      `<text x="${fx + 16}" y="${H - 22}" class="sans muted" font-size="12">${esc(repo.language.name)}</text>`,
    );
    fx += 30 + textWidth(repo.language.name, 12);
  }
  footer.push(`<text x="${fx}" y="${H - 22}" class="sans muted" font-size="12">★ ${compact(repo.stars)}</text>`);
  const when = latest ? `released ${ago(latest.publishedAt, now)}` : `updated ${ago(repo.pushedAt, now)}`;
  footer.push(`<text x="${PROJECT_W - pad}" y="${H - 22}" text-anchor="end" class="sans faint" font-size="12">${esc(when)}</text>`);

  const body = `
<g clip-path="url(#card)"><rect width="${PROJECT_W}" height="3" fill="${c}"/></g>
<rect x="${pad}" y="26" width="30" height="30" rx="8" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-opacity=".4"/>
<text x="${pad + 15}" y="46" text-anchor="middle" class="mono b" font-size="15" fill="${c}">${esc(repo.name[0].toUpperCase())}</text>
<text x="${pad + 42}" y="47.5" class="mono b text" font-size="20">${esc(name)}</text>
${
  tag
    ? `<g transform="translate(${PROJECT_W - pad - tagW} 29)"><rect width="${tagW}" height="24" rx="12" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-opacity=".5"/><text x="${tagW / 2}" y="16.5" text-anchor="middle" class="mono b" font-size="12" fill="${c}">${esc(tag)}</text></g>`
    : ""
}
${desc.map((l, i) => `<text x="${pad}" y="${86 + i * 20}" class="sans text" font-size="13.5" fill-opacity=".88">${esc(l)}</text>`).join("\n")}
${
  family
    ? `<text x="${pad}" y="${H - 54}" class="sans faint" font-size="11.5">${esc(truncate(`also as ${family.join(" · ")}`, PROJECT_W - pad * 2, 11.5))}</text>`
    : ""
}
<line x1="${pad}" y1="${H - 44}" x2="${PROJECT_W - pad}" y2="${H - 44}" stroke="${t.border}"/>
${footer.join("\n")}`;

  return svg(
    t,
    {
      width: PROJECT_W,
      height: H,
      title: `${repo.name}${tag ? ` ${tag}` : ""}`,
      desc: `${repo.description} ${repo.stars} stars. ${when}.`,
      grid: true,
      glows: [{ x: PROJECT_W - 30, y: 10, r: 190, color: c }],
    },
    body,
  );
};
