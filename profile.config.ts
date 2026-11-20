import { defineProfile } from "./src/config";

// Everything on the profile comes from this file and the GitHub API.
// Edit, run `bun run build`, commit. CI does the rest.

export default defineProfile({
  login: "GregoireF",
  name: "Grégoire Favreau",
  role: "Developer and infrastructure engineer",
  location: "Valenciennes, France",

  intro: [
    "I write the code and I run what's under it: front end, API, CI, the cluster it lands on. I learned most of it by breaking things and fixing them.",
    "These days I build the developer tools I kept wishing I had. They're below, and you can run them from this page.",
  ],

  account: {
    bio: "Developer and infrastructure engineer. I build kiwa, ship-it and addlicense. Open to work.",
    blog: "https://www.linkedin.com/in/gr%C3%A9goire-favreau-36a43444a/",
    company: "@WebReadyProjects",
    hireable: true,
  },

  repository: {
    description: "My GitHub profile. Every card is drawn by a small TypeScript generator and refreshed by GitHub Actions.",
    homepage: "https://github.com/GregoireF",
    topics: ["profile-readme", "github-actions", "svg", "bun", "typescript", "automation"],
  },

  availability: {
    open: true,
    kinds: ["Full-time", "Freelance", "Contract"],
    note: "Lille, Valenciennes or remote.",
  },

  contact: {
    email: "gregoire.favreau@ik.me",
    linkedin: "https://www.linkedin.com/in/gr%C3%A9goire-favreau-36a43444a/",
    kofi: "gregoirefavreau",
  },

  showcase: {
    featured: ["kiwa", "ship-it", "addlicense", "iac"],
    topic: "showcase",
    max: 6,
    family: { addlicense: ["GitHub Action", "npm", "WinGet", "Homebrew"] },
  },

  // The trailer at the top. Every command below really runs in CI on the
  // latest release, and the hero shows what it printed and how long it took.
  hero: {
    scenes: [
      { tool: "kiwa", tagline: "Find any project. Run any task.", steps: ["kw list", "kw about billing"] },
      {
        tool: "ship-it",
        tagline: "You write the code. It ships the branch, commit and PR.",
        setup: "git-change",
        steps: ["ship plan", "ship status --offline"],
      },
      {
        tool: "addlicense",
        tagline: "License headers, checked and fixed in one pass.",
        steps: ["addlicense --check .", "addlicense --license MIT .", "addlicense --check ."],
      },
    ],
  },

  // Commands visitors can run from an issue. Anything else is refused.
  play: {
    tools: [
      { bin: "kw", repo: "kiwa", asset: "kiwa-x86_64-unknown-linux-musl.tar.xz" },
      { bin: "ship", repo: "ship-it", asset: "ship_*_linux_amd64.tar.gz" },
      { bin: "addlicense", repo: "addlicense", asset: "addlicense_linux_amd64.tar.gz" },
    ],
    commands: [
      { run: "kw list", hint: "every project in a demo dev folder" },
      { run: "kw about billing", hint: "what a project is and how to start it" },
      { run: "kw info storefront", hint: "the exact command behind each task" },
      { run: "ship check title", hint: "is your commit title conventional?", arg: { max: 100, example: "feat(cart): add vat rate" } },
      { run: "ship branch feat", hint: "the branch name ship would pick", arg: { max: 80, example: "add dark mode" } },
      { run: "addlicense --check .", hint: "which files lack a license header" },
    ],
  },
  wakatime: { enabled: true },
  stack: [
    { label: "Languages", items: ["typescript", "go", "rust", "gnubash"] },
    { label: "Front end", items: ["vuedotjs", "nuxt", "react", "nextdotjs", "astro"] },
    { label: "Back end & data", items: ["nodedotjs", "bun", "postgresql", "mysql"] },
    { label: "Infra", items: ["docker", "kubernetes", "helm", "opentofu", "terraform", "cloudflare", "hetzner", "traefikproxy"] },
    { label: "Ship & watch", items: ["githubactions", "grafana", "prometheus", "linux"] },
  ],
  motto: "Any step I repeat by hand is a bug in the architecture.",

  ignoredRepos: ["ship-it-sandbox", "github-issue-templates"],
  ignoredLanguages: ["HTML", "CSS", "Dockerfile", "Makefile", "Shell", "PowerShell", "Just"],
});
