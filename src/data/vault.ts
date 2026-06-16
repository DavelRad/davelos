/**
 * The Obsidian VAULT content layer for davelOS.
 *
 * Davel's portfolio is presented as an Obsidian vault — a set of interlinked
 * markdown notes — rather than a GitHub repo (no fabricated contribution
 * graph). Notes use Obsidian-style `[[wikilinks]]`; the Obsidian app resolves
 * them by note title. A small knowledge graph is derived from the wikilinks for
 * the Graph View.
 */

/** A single frontmatter-style property shown in the PROPERTIES panel. */
export interface VaultProp {
  key: string;
  value: string;
  /** "link" renders the value as a clickable pill (uses an http(s)/mailto url). */
  kind?: "text" | "link";
}

export interface VaultNote {
  /** Unique id == display title (used to resolve [[wikilinks]]). */
  title: string;
  /** Folder the note lives in (top-level notes use ""). */
  folder: string;
  /** The markdown body (supports [[wikilinks]], callouts, #tags, images). */
  body: string;
  /** Obsidian-style frontmatter properties (Role, Dates, Link, …). */
  props?: VaultProp[];
  /** tags shown as pills in the properties panel. */
  tags?: string[];
}

export interface VaultFolder {
  name: string;
  notes: string[]; // note titles, in display order
}

/* ----------------------------- note bodies ----------------------------- */

const HOME = `# Davel Radindra

> [!quote] Software Engineer & Co-founder
> Building **AI developer tools** in San Francisco. Open to select work.

Welcome to my vault. This is how I think about my work, written as notes — start
with [[About]], see what I'm shipping in [[Now]], or jump to [[Nogic]].

## Map of content

> [!abstract] Davel
> 🧑‍💻 [[About]] — who I am, how I work · 🚀 [[Now]] — what I'm building

> [!note] Work
> [[Nogic]] · [[Fetch.ai]] · [[Jonajo]] · [[Headstarter]]

> [!example] Projects
> [[LandDrop]] · [[Databae]] · [[htmlnote]] · [[Particle]] · [[HoloChat]] · [[More Projects]]

> [!tip] Reference
> 🧰 [[Stack]] — languages, frameworks, infra · 📬 [[Contact]]

#ai-dev-tools #agentic-systems #san-francisco`;

const ABOUT = `# About

I'm a **software engineer and founder** building AI developer tools and agentic
systems. Most of my time goes to [[Nogic]], where we make AI that genuinely
understands a codebase — retrieval, model routing, and the verification layers
that keep it honest in production.

> [!quote] My bias
> I care about the parts that don't demo well: latency, cost, reliability, and
> the failure modes that separate a prototype from a product. I like owning a
> system end to end — from the prompt down to the Cloud Tasks queue.

## Background

> [!info] Education
> **B.S. Computer Science** — San José State University (Dec 2025) · GPA **3.9**
> Software & Computer Engineering Society (Developer) · San Francisco, CA

Deep in **AI + startups**: multi-agent systems, RAG, and LLM infrastructure.

## How I work

> [!success] Principles
> - Ship first, then harden. Production teaches you more than a doc.
> - Optimize for the metric that matters — token cost, p95 latency, reliability.
> - Go a layer deeper than the API call: retrieval, routing, verification.

See my full toolkit in [[Stack]], or how to reach me in [[Contact]].

> [!hint] Beyond code
> Hiking, chess, live music, and far too much time on X.

#engineer #founder #ai`;

const NOW = `# Now

Heads-down on [[Nogic]] — a VS Code extension (**35,000+ installs**) and a
GitHub App that read your codebase and explain changes.

> [!todo] Current focus
> - Improving code-retrieval quality (**BM25 + LLM rerank**).
> - Tightening the agent loop's tool use + the hallucination-checking pass.
> - Hardening **nogic-ci** — idempotent workers on a Cloud Tasks queue.
> - Shipping **[[htmlnote]]** — an OSS Claude Code plugin for reviewing
>   AI-generated HTML.

> [!quote]
> The throughline: making AI reliable enough to trust on real codebases.

Built with the [[Stack]] · ran through [[Nogic]].

#now #shipping`;

const NOGIC = `# Nogic

> [!abstract] What it is
> A dev-tools startup I co-founded — AI that **reads codebases and explains
> changes**. A VS Code extension + a GitHub App that generate codebase and PR
> walkthroughs.

> [!success] 35,000+ installs
> VS Code extension shipped — plus a GitHub App generating codebase and PR
> walkthroughs.

> [!check] ~90% input-token cost cut
> A **FastAPI / Cloud Run** backend — **13 REST + SSE endpoints** — with
> **Claude model routing** (Opus / Sonnet / Haiku by task) and **prompt
> caching** on repeated input.

## How it works

![How a code change gets read and explained](/diagrams/nogic-pipeline.svg)

> [!info] Retrieval + agent loop
> A custom **BM25 + LLM-rerank** code-retrieval system feeds a **6-tool agent
> loop**, with a **hallucination-checking verification pass** against sandboxed
> repo checkouts.

> [!todo] nogic-ci
> A **TypeScript / Probot** GitHub App on a **Cloud Tasks** queue — idempotent
> workers, retries, dedup, **18 test suites**.

> [!quote] Stack
> Python · FastAPI · TypeScript · GCP / Cloud Run · Claude · Docker · Probot —
> see [[Stack]].

Related: [[Now]] · [[htmlnote]] · [[Fetch.ai]] · [[About]]`;

const FETCHAI = `# Fetch.ai

One internship, **two phases** — both deep in **multi-agent systems** built on
the **uAgents** framework.

## Phase 2 · Moderna health platform

> [!abstract] What it is
> A multi-agent platform for **Moderna** analyzing **vaccine hesitancy** across
> demographic, social-media, and voice data. \`May – Aug 2025\`

![Moderna multi-agent platform — four agents orchestrated into a Next.js dashboard](/diagrams/fetchai-agents.svg)

> [!success] 4-agent system
> **Insights · Resources · Voice · Social** — orchestrated over **REST + chat
> protocols**, with **Supabase** (19 datasets), **Qdrant** semantic search, and
> **ASI1** query routing.

- Built a **Next.js 14 dashboard** with maps, charts, and health boards.
- Containerized with **Docker / Nginx** — health checks, retries, logging.
- Contributed an **MCP adapter** to the open-source **uAgents** library.

## Phase 1 · AI e-commerce BI

> [!abstract] What it is
> An AI-powered **business-intelligence** tool on uAgents. \`Feb – May 2025\`

- Agents for **inventory queries, supplier tracking, dynamic pricing, and
  campaign planning**.
- Multi-agent workflows with **LangChain, LangGraph, and CrewAI**.
- A **MongoDB-backed** agent translating natural language into DB operations.

> [!quote] Stack
> Python · uAgents · LangChain · LangGraph · CrewAI · Qdrant · Supabase ·
> MongoDB · Next.js

The patterns here carried straight into [[Nogic]]. Around then: [[Headstarter]].
Before: [[Jonajo]].`;

const HEADSTARTER = `# Headstarter

> [!abstract] What it is
> A selective engineering fellowship — build and ship fast, with mentorship from
> engineers at **Meta** and other top companies.

> [!success] Built HoloChat to 1,000+ users
> A multi-model AI support chatbot — see **[[HoloChat]]** — dynamically routing
> between models for tailored **technical, general, and creative** responses.

> [!quote] Stack
> Next.js · Pinecone · Hugging Face · OpenRouter

See the project: [[HoloChat]] · the rest of my [[Stack]].`;

const JONAJO = `# Jonajo

> [!abstract] What it is
> A full-stack widget serving **25k+ users**, built for cost efficiency.

> [!check] 80% infra cost cut
> Migrated to **TensorDock** with a hardened **CI/CD** pipeline, and reduced
> **LLM compute cost 50%** via batching + caching changes.

- Built and shipped a full-stack widget serving **25k+ users** on Firebase and
  MongoDB.

> [!quote] Stack
> TypeScript · Firebase · MongoDB · CI/CD · TensorDock

Next: [[Fetch.ai]] → [[Nogic]].`;

const HTMLNOTE = `# htmlnote

> [!abstract] What it is
> **Visual review for AI-generated HTML.** When Claude writes or edits HTML,
> htmlnote opens a review tab — click any element, leave a note, then copy the
> notes back into chat. The tightest loop for fixing AI-built UIs.

![htmlnote — visual review for AI-generated HTML (demo)](https://youtu.be/88mcHRczZlU)

> [!success] Shipped OSS · a Claude Code plugin
> Distributed via \`/plugin install htmlnote\` with precompiled **binaries for
> macOS + Linux** and a one-line install script. Hooks into Claude Code so the
> review tab opens **automatically** after an HTML edit.

> [!info] Stack
> TypeScript · Claude Code plugin · cross-platform binaries

> [!example] Links
> [Watch the demo →](https://youtu.be/88mcHRczZlU) ·
> [github.com/DavelRad/htmlnote](https://github.com/DavelRad/htmlnote)

Same world as [[Nogic]] — tools that make AI reliable for real developers.`;

const HOLOCHAT = `# HoloChat

> [!abstract] What it is
> A multi-model AI support chatbot that **picks the right model per query**,
> each with a distinct personality. Built at [[Headstarter]].

![HoloChat — multi-model AI support chatbot (demo)](https://youtu.be/t6njzBo5tko)

> [!success] 1,000+ users
> Three routed assistants:
> - **Lani the Llama** (Llama-3.1-8B) — friendly general support.
> - **Byte the Tech Owl** (RWKV) — deep technical + coding help.
> - **Myra the Myth Weaver** (MythoMist) — creative + storytelling.

> [!info] Stack
> Next.js · Pinecone · Hugging Face · OpenRouter

> [!example] Links
> [Live demo →](https://holo-chat.vercel.app/) ·
> [demo video](https://youtu.be/t6njzBo5tko)`;

const PARTICLE = `# Particle

> [!abstract] What it is
> A scalable pipeline that **scrapes, analyzes, and generates real-time
> environmental news** — it also powered the live demo on my previous site.

- **FastAPI** services with scheduled jobs on **Docker + Kubernetes** for
  continuous content updates.
- **React** front end over a **MongoDB** store; Bash tooling to automate deploys.

> [!info] Stack
> Python · FastAPI · Docker · Kubernetes · React · MongoDB

Built on the [[Stack]].`;

const MORE_PROJECTS = `# More Projects

> [!example] A few more things I've built
> - **ScamShield / Scam-Detector** — Python tools for detecting scam content.
> - **Media Player** — a cross-platform **JavaFX** player with \`.srt\` subtitle
>   parsing + sync, speed control, and fullscreen.
> - **Expense Tracker** · **Inventory Tracker** — full-stack utilities.
> - **Process Simulator** (CS149) — an OS process-scheduling simulation in **C++**.

More at [github.com/DavelRad](https://github.com/DavelRad).

#projects`;

const STACK = `# Stack

> [!note] Languages
> Python · TypeScript · JavaScript · Go · SQL · Java · C++ · Bash

> [!tip] Frameworks
> FastAPI · Next.js · React · LangChain · LangGraph · CrewAI · uAgents ·
> NestJS · Express · Flask · Tauri

> [!abstract] AI / Data
> Claude · Groq · Hugging Face · OpenRouter · Pinecone · Qdrant · Supabase ·
> MongoDB · Redis · PostgreSQL

### Infra / Tools

| Category | Tools |
| --- | --- |
| **Cloud** | GCP · AWS · Azure |
| **Containers** | Docker · Kubernetes |
| **IaC / Ops** | Terraform · CI/CD · Nginx |

The toolkit behind [[Nogic]], [[htmlnote]], and projects like [[LandDrop]] and
[[Databae]].`;

const LANDDROP = `# LandDrop

> [!quote] From soil to society — visualize, analyze, understand
> The UN reports **40% of Earth's land is already degraded**, heading toward 90%
> by 2050. LandDrop analyzes soil + weather data for any location and surfaces
> where environmental and economic risk overlap.

> [!success] 🏆 Hack for Social Impact 2024 — Global Good Prize (Fetch.ai track)
> Earned a ⭐ on GitHub.

![Soil analysis for any location — density, temperature, moisture and drought risk, with a Fetch AI agent answering land-degradation questions](/projects/landdrop/01.png)

*Pick a location → get soil density, temperature, moisture and drought-risk, with a Fetch agent answering questions like crop viability.*

## How it works

> [!info] Three agents on uAgents
> - **Environmentalist** — retrieves the environmental + soil datasets.
> - **Socioeconomist** — gathers the social and economic data.
> - **Predictor** — forecasts degradation and drought trends.
>
> It all flows into interactive maps, correlation graphs, and summaries.

> [!info] Stack
> Next.js · FastAPI · uAgents · GPT-4 (Azure) · Mapbox

Same agentic toolkit as [[Databae]] and my work at [[Fetch.ai]].`;

const DATABAE = `# Databae

> [!quote] Simplify databases for everyone
> Not everyone wants to write SQL. **Databae** lets anyone ask a question in
> plain English and get the right query, the result, and an analysis back.

> [!success] 🏆 CalHacks 11.0 — Fetch.ai Agentic Track winner

![Ask in plain English — Databae writes and runs the SQL, then returns the result table](/projects/databae/02.png)

*Ask "give me a list of all the participants" → Databae writes the SQL, validates it, runs it, and returns the table.*

## How it works

A **4-agent pipeline** on the **uAgents** framework — each agent hands off to the next:

> [!info] The agents
> - **Query Generator** — turns your question into SQL with **Groq LLaMA**.
> - **Query Checker** — validates the SQL against your schema before it runs.
> - **Query Executor** — runs it and pulls the dataset.
> - **Query Analyzer** — analyzes the result and builds the visualizations.

![databae — Simplify Databases](/projects/databae/01.png)

> [!info] Stack
> Next.js · Shadcn · Framer Motion · FastAPI · Python · Groq LLaMA · uAgents · Pandas

Sibling project to [[LandDrop]]. Built on the [[Stack]].`;

const CONTACT = `# Contact

> [!tip] The fastest way to reach me is email
> [davel.radindra2@gmail.com](mailto:davel.radindra2@gmail.com)

> [!example] Elsewhere
> - 💼 [linkedin.com/in/davelradindra](https://linkedin.com/in/davelradindra)
> - 🐙 [github.com/DavelRad](https://github.com/DavelRad)
> - 🐦 [@davelradindra](https://x.com/)
> - 🌐 [davelradindra.com](https://davelradindra.com)

> [!quote]
> Currently open to **select work**. If you're building something hard in AI
> dev tools or agentic systems, let's talk.

Back to [[About]] · [[Home]].`;

/* ------------------------------ the vault ------------------------------ */

export const vaultNotes: VaultNote[] = [
  { title: "Home", folder: "", body: HOME, tags: ["map", "moc"] },
  {
    title: "About",
    folder: "Davel",
    body: ABOUT,
    props: [
      { key: "Role", value: "Software Engineer & Co-founder" },
      { key: "Location", value: "San Francisco, CA" },
      { key: "Status", value: "Open to select work" },
    ],
    tags: ["engineer", "founder", "ai"],
  },
  { title: "Now", folder: "Davel", body: NOW, tags: ["now", "nogic"] },
  {
    title: "Nogic",
    folder: "Work",
    body: NOGIC,
    props: [
      { key: "Role", value: "Co-founder" },
      { key: "Dates", value: "Sept 2025 — Present" },
      { key: "Location", value: "San Francisco" },
      { key: "Backing", value: "Fetch.ai · Founders Inc alum" },
      { key: "Link", value: "https://github.com/DavelRad", kind: "link" },
    ],
    tags: ["startup", "dev-tools", "claude", "fastapi"],
  },
  {
    title: "Fetch.ai",
    folder: "Work",
    body: FETCHAI,
    props: [
      { key: "Role", value: "Software Engineer Intern" },
      { key: "Dates", value: "Feb 2025 — Aug 2025" },
      { key: "Location", value: "San Francisco" },
      { key: "Client", value: "Moderna (Phase 2)" },
    ],
    tags: ["multi-agent", "uagents", "moderna"],
  },
  {
    title: "Headstarter",
    folder: "Work",
    body: HEADSTARTER,
    props: [
      { key: "Role", value: "Software Engineer Fellow" },
      { key: "Dates", value: "Jul — Aug 2024" },
      { key: "Location", value: "San Francisco" },
    ],
    tags: ["fellowship", "ai"],
  },
  {
    title: "Jonajo",
    folder: "Work",
    body: JONAJO,
    props: [
      { key: "Role", value: "Software Engineer Intern" },
      { key: "Dates", value: "Dec 2023 — Oct 2024" },
      { key: "Location", value: "San Francisco" },
    ],
    tags: ["full-stack", "infra"],
  },
  {
    title: "htmlnote",
    folder: "Projects",
    body: HTMLNOTE,
    props: [
      { key: "Type", value: "Open-source · Claude Code plugin" },
      { key: "Status", value: "Shipped" },
      { key: "Repo", value: "https://github.com/DavelRad/htmlnote", kind: "link" },
      { key: "Demo", value: "https://youtu.be/88mcHRczZlU", kind: "link" },
    ],
    tags: ["oss", "claude-code", "typescript"],
  },
  {
    title: "LandDrop",
    folder: "Projects",
    body: LANDDROP,
    props: [
      { key: "Award", value: "Hack for Social Impact 2024 — Grand Prize" },
      { key: "Track", value: "Fetch.ai" },
    ],
    tags: ["uagents", "hackathon", "mapping"],
  },
  {
    title: "Databae",
    folder: "Projects",
    body: DATABAE,
    props: [
      { key: "Award", value: "CalHacks 2024 — Award Winner" },
      { key: "Idea", value: "Natural language → SQL" },
    ],
    tags: ["uagents", "groq", "hackathon"],
  },
  {
    title: "HoloChat",
    folder: "Projects",
    body: HOLOCHAT,
    props: [
      { key: "Built at", value: "Headstarter" },
      { key: "Reach", value: "1,000+ users" },
      { key: "Demo", value: "https://holo-chat.vercel.app/", kind: "link" },
    ],
    tags: ["chatbot", "multi-model", "nextjs"],
  },
  {
    title: "Particle",
    folder: "Projects",
    body: PARTICLE,
    props: [{ key: "Idea", value: "Real-time environmental news pipeline" }],
    tags: ["fastapi", "kubernetes"],
  },
  { title: "More Projects", folder: "Projects", body: MORE_PROJECTS, tags: ["misc"] },
  { title: "Stack", folder: "", body: STACK, tags: ["reference", "toolkit"] },
  { title: "Contact", folder: "", body: CONTACT, tags: ["contact"] },
];

/** Folder tree for the file explorer (order matters). */
export const vaultTree: VaultFolder[] = [
  { name: "Davel", notes: ["About", "Now"] },
  { name: "Work", notes: ["Nogic", "Fetch.ai", "Jonajo", "Headstarter"] },
  {
    name: "Projects",
    notes: ["LandDrop", "Databae", "htmlnote", "Particle", "HoloChat", "More Projects"],
  },
  // top-level notes (folder === "")
  { name: "", notes: ["Home", "Stack", "Contact"] },
];

export const VAULT_NAME = "Davel's Vault";
export const DEFAULT_NOTE = "About";

export function getNote(title: string): VaultNote | undefined {
  return vaultNotes.find((n) => n.title === title);
}

/* ------------------------------ wikilinks ------------------------------ */

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

/** Extract the [[wikilink]] targets referenced by a note body. */
export function noteLinks(body: string): string[] {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = WIKILINK_RE.exec(body)) !== null) {
    // support [[Target|alias]] just in case
    const target = m[1].split("|")[0].trim();
    if (target) out.add(target);
  }
  return [...out];
}

/* ----------------------------- graph view ----------------------------- */

export interface GraphNode {
  id: string;
  /** layout position in 0..1 (radial-ish, precomputed & stable). */
  x: number;
  y: number;
  /** node radius weight (more links = bigger). */
  weight: number;
}
export interface GraphEdge {
  a: string;
  b: string;
}

/** Build the knowledge graph (nodes + undirected edges) from wikilinks. */
export function buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const titles = vaultNotes.map((n) => n.title);
  const titleSet = new Set(titles);
  const degree = new Map<string, number>();
  titles.forEach((t) => degree.set(t, 0));

  const edgeKey = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const note of vaultNotes) {
    for (const target of noteLinks(note.body)) {
      if (!titleSet.has(target) || target === note.title) continue;
      const key = [note.title, target].sort().join("|");
      if (edgeKey.has(key)) continue;
      edgeKey.add(key);
      edges.push({ a: note.title, b: target });
      degree.set(note.title, (degree.get(note.title) ?? 0) + 1);
      degree.set(target, (degree.get(target) ?? 0) + 1);
    }
  }

  // Stable radial layout: "Home"/"About"/"Nogic" near the center, others ring.
  const center = new Set(["About", "Nogic", "Home"]);
  const ring = titles.filter((t) => !center.has(t));
  const nodes: GraphNode[] = [];

  const centerArr = titles.filter((t) => center.has(t));
  centerArr.forEach((t, i) => {
    const a = (i / Math.max(1, centerArr.length)) * Math.PI * 2;
    nodes.push({
      id: t,
      x: 0.5 + Math.cos(a) * 0.12,
      y: 0.5 + Math.sin(a) * 0.12,
      weight: degree.get(t) ?? 0,
    });
  });
  ring.forEach((t, i) => {
    const a = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({
      id: t,
      x: 0.5 + Math.cos(a) * 0.4,
      y: 0.5 + Math.sin(a) * 0.4,
      weight: degree.get(t) ?? 0,
    });
  });

  return { nodes, edges };
}
