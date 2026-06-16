/**
 * The "GitHub repo" content layer for davelOS.
 *
 * Davel's portfolio is presented as a well-crafted GitHub profile repo. Each
 * entry below is a GitHub-flavored-markdown document rendered inside the
 * GitHub-browser app (react-markdown + remark-gfm + rehype-highlight). Content
 * is derived from the typed profile data so there is a single source of truth.
 */

export interface RepoFile {
  /** filename shown in the sidebar / URL bar, e.g. "README.md". */
  name: string;
  /** path used by spotlight + routing, e.g. "README.md" or "projects/landdrop.md". */
  path: string;
  /** rough line count for the GitHub-style file header (illustrative). */
  lines: number;
  /** the GitHub-flavored markdown body. */
  body: string;
}

export const repoMeta = {
  owner: "DavelRad",
  name: "davel",
  branch: "main",
  description:
    "Software Engineer & Co-founder building AI developer tools. This repo is my portfolio — read it like docs.",
  topics: [
    "ai-developer-tools",
    "agentic-systems",
    "retrieval",
    "fastapi",
    "typescript",
    "claude",
  ],
  /** illustrative language split for the languages bar. */
  languages: [
    { name: "Python", pct: 44, color: "#3572A5" },
    { name: "TypeScript", pct: 33, color: "#3178c6" },
    { name: "Go", pct: 9, color: "#00ADD8" },
    { name: "Shell", pct: 7, color: "#89e051" },
    { name: "Other", pct: 7, color: "#8b8b8b" },
  ],
} as const;

/** Profile-level info for the GitHub profile header (about-me sidebar etc.). */
export const profileMeta = {
  login: "DavelRad",
  name: "Davel Radindra",
  bio: "Software Engineer & Co-founder. Building AI developer tools @ Nogic.",
  company: "@nogic",
  location: "San Francisco, CA",
  website: "davelradindra.com",
  websiteUrl: "https://davelradindra.com",
  orgs: ["nogic", "fetchai"],
} as const;

/** A row in the profile repo's "file list" table (name · last commit · time). */
export interface RepoTreeRow {
  path: string;
  commit: string;
  age: string;
}

export const repoTree: RepoTreeRow[] = [
  { path: "README.md", commit: "profile: refresh currently-building section", age: "2 hours ago" },
  { path: "about.md", commit: "about: tighten bio + how-i-work", age: "4 days ago" },
  { path: "experience.md", commit: "experience: add nogic-ci metrics", age: "6 days ago" },
  { path: "projects.md", commit: "projects: link CalHacks demo", age: "2 weeks ago" },
  { path: "stack.md", commit: "stack: add LangGraph + Tauri", age: "3 weeks ago" },
  { path: "contact.md", commit: "contact: update links", age: "last month" },
];

const README = `# Davel Radindra

> **Software Engineer & Co-founder** — building AI developer tools.

![Location](https://img.shields.io/badge/San_Francisco-CA-3fb950?style=flat-square)
![Building](https://img.shields.io/badge/building-Nogic-4ade80?style=flat-square)
![Status](https://img.shields.io/badge/status-available-2ea043?style=flat-square)
![Focus](https://img.shields.io/badge/focus-agentic_systems-3178c6?style=flat-square)

I design and ship **agentic developer tools** — retrieval systems, model
routing, and the unglamorous infrastructure that makes AI reliable in
production. Co-founder of **Nogic**; previously multi-agent systems at
**Fetch.ai** and cost-efficient full-stack at **Jonajo**.

## Currently

Heads-down on **Nogic** — a VS Code extension (**35,000+ installs**) and a
GitHub App that read your codebase and explain changes, backed by a custom
BM25 + LLM-rerank retrieval stack feeding a 6-tool agent loop.

## Quick links

| File | What's inside |
| --- | --- |
| [\`about.md\`](about.md) | Who I am, in one page |
| [\`experience.md\`](experience.md) | Roles, shipped work, metrics |
| [\`projects.md\`](projects.md) | Hackathon-winning builds |
| [\`stack.md\`](stack.md) | Languages, frameworks, infra |
| [\`contact.md\`](contact.md) | How to reach me |

## Contributions

A year of commits — building in public, shipping in private.

<!-- contribution-graph -->

---

\`\`\`ts
const davel = {
  role: "Software Engineer & Co-founder",
  building: "AI developer tools @ Nogic",
  location: "San Francisco, CA",
  open_to: "select work",
} as const;
\`\`\`
`;

const ABOUT = `# about

I'm a **software engineer and founder** building AI developer tools and
agentic systems. Most of my time goes to **Nogic**, where we make AI that
genuinely understands a codebase — retrieval, model routing, and the
verification layers that keep it honest in production.

I care about the parts that don't demo well: latency, cost, reliability, and
the failure modes that separate a prototype from a product. I like owning a
system end to end — from the prompt all the way down to the Cloud Tasks queue.

## Background

- **B.S. Computer Science** — San José State University (Dec 2025), GPA **3.9**
- Based in **San Francisco, CA**
- Deep in **AI + startups**: multi-agent systems, RAG, LLM infrastructure

## How I work

- Ship first, then harden. A thing in production teaches you more than a doc.
- Optimize for the metric that matters — token cost, p95 latency, reliability.
- Go a layer deeper than the API call: retrieval, routing, verification.

> Beyond code: hiking, chess, live music, and far too much time on X.
`;

const EXPERIENCE = `# experience

## Nogic — Co-founder

\`Sept 2025 — Present\` · San Francisco · Fetch.ai-backed · Founders Inc alum

Dev-tools startup building AI that reads codebases and explains changes.

- Shipped a **VS Code extension** with **35,000+ installs** plus a **GitHub
  App** that generates codebase and PR walkthroughs.
- Built a **FastAPI / Cloud Run** backend — **13 REST + SSE endpoints** — with
  **Claude model routing** (Opus / Sonnet / Haiku by task) and **prompt
  caching** that cut repeated input-token cost **~90%**.
- Designed a custom **BM25 + LLM-rerank** code-retrieval system feeding a
  **6-tool agent loop**, with a **hallucination-checking verification pass**
  against sandboxed repo checkouts.
- Authored **nogic-ci**, a **TypeScript / Probot** GitHub App on a **Cloud
  Tasks** queue — idempotent workers, retries, dedup, **18 test suites**.

| | |
| --- | --- |
| **Stack** | Python · FastAPI · TypeScript · GCP / Cloud Run · Claude · Docker · Probot |

---

## Fetch.ai — Software Engineer Intern

\`Feb 2025 — Aug 2025\` · San Francisco

Multi-agent health platform for **Moderna** analyzing vaccine hesitancy.

- Built **4 uAgents** communicating over **REST + chat protocols** to analyze
  vaccine-hesitancy signals.
- Integrated **Supabase, Qdrant, and ASI1** into the agent pipeline for
  storage, retrieval, and reasoning.
- Contributed an **MCP adapter** to the open-source **uAgents** library.

| | |
| --- | --- |
| **Stack** | Python · uAgents · Qdrant · Supabase · ASI1 |

---

## Jonajo Consulting — Software Engineer Intern

\`Dec 2023 — Oct 2024\` · San Francisco

Full-stack widget serving **25k+ users**, built for cost efficiency.

- Built and shipped a full-stack widget serving **25k+ users** on Firebase and
  MongoDB.
- Cut infrastructure cost **80%** by migrating to TensorDock with a hardened
  CI/CD pipeline.
- Reduced LLM compute cost **50%** through batching and caching strategy changes.

| | |
| --- | --- |
| **Stack** | TypeScript · Firebase · MongoDB · CI/CD · TensorDock |
`;

const PROJECTS = `# projects

## LandDrop

> 🏆 **Hack for Social Impact 2024 — Winner**

Land-degradation and socioeconomic analysis powered by **uAgents** with
interactive mapping — surfacing where environmental and economic risk overlap.

\`\`\`text
FastAPI · Next.js · uAgents · Azure · Mapbox
\`\`\`

---

## Databae

> 🏆 **CalHacks 2024 — Award Winner**

Natural-language-to-SQL built on **uAgents** and **Groq LLaMA** — ask a
question, get a correct query and result against your schema.

\`\`\`text
Next.js · FastAPI · Python · Groq
\`\`\`
`;

const STACK = `# stack

### Languages

![Python](https://img.shields.io/badge/Python-3572A5?style=flat-square&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-f1e05a?style=flat-square&logo=javascript&logoColor=black)
![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white)
![SQL](https://img.shields.io/badge/SQL-336791?style=flat-square&logo=postgresql&logoColor=white)
![Java](https://img.shields.io/badge/Java-b07219?style=flat-square&logo=openjdk&logoColor=white)
![C++](https://img.shields.io/badge/C++-f34b7d?style=flat-square&logo=cplusplus&logoColor=white)

### Frameworks

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61dafb?style=flat-square&logo=react&logoColor=black)
![LangGraph](https://img.shields.io/badge/LangGraph-1c3c3c?style=flat-square)
![uAgents](https://img.shields.io/badge/uAgents-4ade80?style=flat-square)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=flat-square&logo=tauri&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)

### Infra / Tools

| Category | Tools |
| --- | --- |
| **Cloud** | GCP · AWS · Azure |
| **Containers** | Docker · Kubernetes |
| **IaC / Ops** | Terraform · CI/CD · Nginx |
| **Data** | MongoDB · Supabase |
`;

const CONTACT = `# contact

The fastest way to reach me is **email**.

| | |
| --- | --- |
| 📧 **Email** | [davel.radindra2@gmail.com](mailto:davel.radindra2@gmail.com) |
| 💼 **LinkedIn** | [linkedin.com/in/davelradindra](https://linkedin.com/in/davelradindra) |
| 🐙 **GitHub** | [github.com/DavelRad](https://github.com/DavelRad) |
| 🐦 **X / Twitter** | [@davelradindra](https://x.com/) <!-- TODO: real handle --> |
| 🌐 **Website** | [davelradindra.com](https://davelradindra.com) |

> Currently open to **select work**. If you're building something hard in AI
> dev tools or agentic systems, let's talk.
`;

export const repoFiles: RepoFile[] = [
  { name: "README.md", path: "README.md", lines: README.split("\n").length, body: README },
  { name: "about.md", path: "about.md", lines: ABOUT.split("\n").length, body: ABOUT },
  {
    name: "experience.md",
    path: "experience.md",
    lines: EXPERIENCE.split("\n").length,
    body: EXPERIENCE,
  },
  {
    name: "projects.md",
    path: "projects.md",
    lines: PROJECTS.split("\n").length,
    body: PROJECTS,
  },
  { name: "stack.md", path: "stack.md", lines: STACK.split("\n").length, body: STACK },
  { name: "contact.md", path: "contact.md", lines: CONTACT.split("\n").length, body: CONTACT },
];

export function getRepoFile(path: string): RepoFile | undefined {
  return repoFiles.find((f) => f.path === path);
}

/* ------------------------------------------------------------------ *
 * Contribution graph
 * A deterministic, procedurally-generated heatmap (53 weeks × 7 days).
 * Labelled honestly in the UI as illustrative — not pulled from the live
 * GitHub events API (which is unauthenticated/rate-limited here).
 * ------------------------------------------------------------------ */

export interface ContribDay {
  /** 0–4 intensity bucket. */
  level: 0 | 1 | 2 | 3 | 4;
  count: number;
}

/** Tiny seeded PRNG (mulberry32) for stable output across renders. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateContributions(weeks = 53, seed = 20251214): ContribDay[][] {
  const rand = mulberry32(seed);
  const grid: ContribDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: ContribDay[] = [];
    // a gentle "ramp up" over the year so recent weeks look busier
    const recency = w / weeks;
    for (let d = 0; d < 7; d++) {
      const weekend = d === 0 || d === 6;
      const base = (rand() + recency * 0.5) * (weekend ? 0.55 : 1);
      let level: ContribDay["level"] = 0;
      if (base > 0.85) level = 4;
      else if (base > 0.62) level = 3;
      else if (base > 0.4) level = 2;
      else if (base > 0.2) level = 1;
      const count = level === 0 ? 0 : level * 3 + Math.floor(rand() * 4);
      col.push({ level, count });
    }
    grid.push(col);
  }
  return grid;
}

export function totalContributions(grid: ContribDay[][]): number {
  return grid.reduce(
    (sum, col) => sum + col.reduce((s, day) => s + day.count, 0),
    0,
  );
}
