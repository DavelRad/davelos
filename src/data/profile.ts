import type {
  ContactLink,
  Project,
  QAEntry,
  StackGroup,
  Stat,
  WorkEntry,
} from "../types";

export const profile = {
  name: "Davel Radindra",
  role: "Software Engineer & Co-founder",
  location: "San Francisco, CA",
  timezone: "America/Los_Angeles",
  tagline: "I build AI developer tools.",
  intro:
    "Engineer and founder shipping agentic developer tools — retrieval systems, model routing, and the infrastructure that makes them reliable in production.",
  education: {
    school: "San José State University",
    degree: "B.S. Computer Science",
    detail: "Dec 2025 · GPA 3.9",
  },
  status: "Available for select work",
  github: "DavelRad",
} as const;

export const heroStats: Stat[] = [
  { value: 35000, suffix: "+", label: "VS Code installs" },
  { value: 90, suffix: "%", label: "Input-token cost cut" },
  { value: 25000, suffix: "+", label: "Users served" },
  { value: 3.9, label: "GPA", prefix: "" },
];

export const work: WorkEntry[] = [
  {
    id: "nogic",
    company: "Nogic",
    role: "Co-founder",
    period: "Sept 2025 — Present",
    location: "San Francisco",
    summary:
      "Dev-tools startup (Fetch.ai-backed, Founders Inc alum) building AI that reads codebases and explains changes.",
    highlights: [
      "Shipped a VS Code extension with 35,000+ installs plus a GitHub App that generates codebase and PR walkthroughs.",
      "Built a FastAPI / Cloud Run backend — 13 REST and SSE endpoints — with Claude model routing (Opus / Sonnet / Haiku by task) and prompt caching that cut repeated input-token cost ~90%.",
      "Designed a custom BM25 + LLM-rerank code-retrieval system feeding a 6-tool agent loop, with a hallucination-checking verification pass against sandboxed repo checkouts.",
      "Authored nogic-ci, a TypeScript / Probot GitHub App on a Cloud Tasks queue — idempotent workers, retries, dedup, and 18 test suites.",
    ],
    tags: ["Python", "FastAPI", "TypeScript", "GCP / Cloud Run", "Claude", "Docker"],
    url: "https://github.com/DavelRad",
    accent: true,
  },
  {
    id: "fetchai",
    company: "Fetch.ai",
    role: "Software Engineer Intern",
    period: "Feb 2025 — Aug 2025",
    location: "San Francisco",
    summary:
      "Multi-agent health platform for Moderna analyzing vaccine hesitancy with uAgents.",
    highlights: [
      "Built 4 uAgents communicating over REST and chat protocols to analyze vaccine-hesitancy signals.",
      "Integrated Supabase, Qdrant, and ASI1 into the agent pipeline for storage, retrieval, and reasoning.",
      "Contributed an MCP adapter to the open-source uAgents library.",
    ],
    tags: ["Python", "uAgents", "Qdrant", "Supabase"],
    url: "https://fetch.ai",
  },
  {
    id: "jonajo",
    company: "Jonajo Consulting",
    role: "Software Engineer Intern",
    period: "Dec 2023 — Oct 2024",
    location: "San Francisco",
    summary:
      "Full-stack widget serving 25k+ users with an emphasis on cost-efficient infrastructure.",
    highlights: [
      "Built and shipped a full-stack widget serving 25k+ users on Firebase and MongoDB.",
      "Cut infrastructure cost 80% by migrating to TensorDock with a hardened CI/CD pipeline.",
      "Reduced LLM compute cost 50% through batching and caching strategy changes.",
    ],
    tags: ["TypeScript", "Firebase", "MongoDB", "CI/CD"],
  },
];

export const projects: Project[] = [
  {
    id: "landdrop",
    name: "LandDrop",
    award: "Hack for Social Impact 2024 · Winner",
    description:
      "Land-degradation and socioeconomic analysis powered by uAgents with interactive mapping — surfacing where environmental and economic risk overlap.",
    tags: ["FastAPI", "Next.js", "uAgents", "Azure", "Mapbox"],
  },
  {
    id: "databae",
    name: "Databae",
    award: "CalHacks 2024 · Award Winner",
    description:
      "Natural-language-to-SQL built on uAgents and Groq LLaMA — ask a question, get a correct query and result against your schema.",
    tags: ["Next.js", "FastAPI", "Python", "Groq"],
  },
];

export const stack: StackGroup[] = [
  {
    label: "Languages",
    items: ["Python", "TypeScript", "JavaScript", "Go", "SQL", "Java", "C++"],
  },
  {
    label: "Frameworks",
    items: [
      "FastAPI",
      "Next.js",
      "React",
      "LangGraph",
      "uAgents",
      "Tauri",
      "Flask",
      "Express",
    ],
  },
  {
    label: "Infra / Tools",
    items: [
      "Docker",
      "Kubernetes",
      "Terraform",
      "GCP",
      "AWS",
      "Azure",
      "MongoDB",
      "Supabase",
      "CI/CD",
      "Nginx",
    ],
  },
];

export const about = {
  paragraphs: [
    "I'm a software engineer and founder building AI developer tools and agentic systems. Most of my time goes to Nogic, where we make AI that genuinely understands a codebase — retrieval, model routing, and the verification layers that keep it honest in production.",
    "Before Nogic I worked on multi-agent systems at Fetch.ai and shipped cost-efficient full-stack infrastructure at Jonajo. I care about the unglamorous parts: latency, cost, reliability, and the failure modes that separate a demo from a product.",
  ],
  beyond:
    "Beyond code: hiking, chess, live music, and far too much time on X.",
};

export const contactLinks: ContactLink[] = [
  {
    label: "Email",
    value: "davel.radindra2@gmail.com",
    href: "mailto:davel.radindra2@gmail.com",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/davelradindra",
    href: "https://linkedin.com/in/davelradindra",
  },
  {
    label: "GitHub",
    value: "github.com/DavelRad",
    href: "https://github.com/DavelRad",
  },
  {
    label: "X / Twitter",
    value: "@davelradindra",
    // TODO: real handle — placeholder until confirmed
    href: "https://x.com/",
  },
  {
    label: "Website",
    value: "davelradindra.com",
    href: "https://davelradindra.com",
  },
];

/**
 * MOCK Ask-Davel knowledge base.
 *
 * This is a deterministic keyword router used for the canned demo. It is meant
 * to be replaced by a real RAG backend — Davel has already built the retrieval
 * stack at Nogic (BM25 + LLM rerank feeding a 6-tool agent loop with a
 * verification pass). Wiring this UI to that backend is the intended next step.
 */
export const qa: QAEntry[] = [
  {
    keywords: ["nogic", "company", "startup", "founded", "found"],
    answer:
      "Nogic is the dev-tools startup I co-founded (Fetch.ai-backed, Founders Inc alum). We build AI that reads your codebase and explains it — a VS Code extension with 35,000+ installs and a GitHub App that generates codebase and PR walkthroughs. Under the hood: a FastAPI / Cloud Run backend with Claude model routing, prompt caching that cuts repeated input-token cost ~90%, and a custom BM25 + LLM-rerank retrieval system feeding a 6-tool agent loop.",
  },
  {
    keywords: ["stack", "tech", "technolog", "language", "tools", "use"],
    answer:
      "My core stack is Python and TypeScript. On the backend I lean on FastAPI, Cloud Run, Docker, and Claude; on the frontend, React and Next.js. For agentic systems I work with LangGraph and uAgents, and I'm comfortable across GCP, AWS, Azure, Kubernetes, and Terraform. Check the Stack section for the full grouped breakdown.",
  },
  {
    keywords: ["hire", "why you", "recruit", "candidate", "good fit", "join"],
    answer:
      "Three reasons: I ship — a VS Code extension with 35,000+ installs and a production backend serving real users. I optimize for what matters in production — I cut repeated input-token cost ~90% with prompt caching and dropped infra cost 80% at a previous role. And I go deep — custom retrieval, a 6-tool agent loop, and a hallucination-checking verification layer, not just API calls. I move fast without leaving reliability behind.",
  },
  {
    keywords: ["working", "building", "current", "now", "lately", "these days"],
    answer:
      "Right now I'm heads-down on Nogic — improving our code-retrieval quality (BM25 + LLM rerank), tightening the agent loop's tool use, and hardening nogic-ci, our TypeScript / Probot GitHub App that runs idempotent workers on a Cloud Tasks queue. The throughline is making AI reliable enough to trust on real codebases.",
  },
  {
    keywords: ["retrieval", "rag", "bm25", "rerank", "search", "agent", "loop"],
    answer:
      "The retrieval stack at Nogic is BM25 for lexical recall plus an LLM reranker for precision. The reranked context feeds a 6-tool agent loop that can navigate the repo, then a verification pass checks the output against sandboxed repo checkouts to catch hallucinations before anything reaches the user. Model routing sends each task to Opus, Sonnet, or Haiku based on difficulty and latency budget.",
  },
  {
    keywords: ["fetch", "moderna", "uagent", "intern", "experience"],
    answer:
      "At Fetch.ai I built a multi-agent health platform for Moderna — 4 uAgents communicating over REST and chat protocols to analyze vaccine hesitancy, integrated with Supabase, Qdrant, and ASI1. I also contributed an MCP adapter to the open-source uAgents library. Before that, at Jonajo, I shipped a full-stack widget serving 25k+ users and cut infra cost 80%.",
  },
  {
    keywords: ["project", "landdrop", "databae", "hackathon", "won", "win"],
    answer:
      "Two favorites: LandDrop won Hack for Social Impact 2024 — land-degradation and socioeconomic analysis with uAgents and interactive mapping. Databae won an award at CalHacks 2024 — natural-language-to-SQL on uAgents and Groq LLaMA. Both lean on agentic patterns I use day to day.",
  },
  {
    keywords: ["education", "school", "study", "degree", "sjsu", "gpa", "college"],
    answer:
      "I'm finishing a B.S. in Computer Science at San José State University (Dec 2025) with a 3.9 GPA, though most of my real learning has come from shipping production systems at Nogic, Fetch.ai, and Jonajo.",
  },
  {
    keywords: ["contact", "reach", "email", "linkedin", "talk", "connect"],
    answer:
      "Easiest is email — davel.radindra2@gmail.com. You can also find me on LinkedIn (/in/davelradindra) and GitHub (@DavelRad). Head to the Contact section, or hit ⌘K and choose Email to start a message.",
  },
];

export const fallbackAnswer =
  "Good question — I don't have a canned answer for that yet. This assistant is a demo router; the production version is wired to Nogic's retrieval stack. In the meantime, try asking about Nogic, my tech stack, what I'm building, or why you should hire me. Or reach out directly via the Contact section.";

export const suggestedQuestions = [
  "What is Nogic?",
  "What's your tech stack?",
  "Why should we hire you?",
  "What are you working on?",
];
