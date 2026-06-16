import {
  Children,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
} from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Pencil,
  Info,
  Flame,
  Check,
  HelpCircle,
  AlertTriangle,
  Quote,
  ClipboardList,
  List,
  Zap,
  type LucideIcon,
} from "lucide-react";
// Curated language subset keeps the bundle small (vs. all of highlight.js).
import typescript from "highlight.js/lib/languages/typescript";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";

const HL_LANGUAGES = {
  typescript,
  ts: typescript,
  javascript: typescript,
  js: typescript,
  bash,
  sh: bash,
  shell: bash,
  json,
  python,
  py: python,
};

/**
 * Lazy ("lite") YouTube embed: shows the poster thumbnail until clicked, then
 * swaps in the real iframe — so the heavy YouTube player only loads on demand.
 * Authored in markdown as a fenced ```youtube block containing the video id.
 */
function YouTubeEmbed({ id }: { id: string }) {
  const [play, setPlay] = useState(false);
  return (
    <span className="ob-video">
      {play ? (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} aria-label="Play video">
          <img
            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
          />
          <span className="ob-video-play" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </span>
  );
}

interface MarkdownProps {
  source: string;
  /** called when an internal repo link (e.g. about.md) is clicked. */
  onNavigateFile?: (path: string) => void;
  /** called when an Obsidian-style [[wikilink]] is clicked (by note title). */
  onNavigateNote?: (title: string) => void;
  /** apply the Obsidian reading-view styling instead of GitHub markdown. */
  variant?: "github" | "obsidian";
}

function isInternal(href: string): boolean {
  return /^[a-z0-9_./-]+\.md$/i.test(href);
}

/** Internal scheme used to carry [[wikilinks]] through react-markdown. */
const WIKI_SCHEME = "wikilink:";

/* ----------------------------- callouts ----------------------------- */

interface CalloutSpec {
  /** css color token name (maps to a --co-* var in index.css). */
  color: string;
  icon: LucideIcon;
}

/** Obsidian callout types → color + icon. Aliases share a spec. */
const CALLOUTS: Record<string, CalloutSpec> = {
  note: { color: "blue", icon: Pencil },
  info: { color: "blue", icon: Info },
  todo: { color: "blue", icon: Info },
  tip: { color: "cyan", icon: Flame },
  hint: { color: "cyan", icon: Flame },
  important: { color: "cyan", icon: Flame },
  success: { color: "green", icon: Check },
  check: { color: "green", icon: Check },
  done: { color: "green", icon: Check },
  question: { color: "yellow", icon: HelpCircle },
  help: { color: "yellow", icon: HelpCircle },
  faq: { color: "yellow", icon: HelpCircle },
  warning: { color: "orange", icon: AlertTriangle },
  caution: { color: "orange", icon: AlertTriangle },
  attention: { color: "orange", icon: AlertTriangle },
  quote: { color: "gray", icon: Quote },
  cite: { color: "gray", icon: Quote },
  abstract: { color: "teal", icon: ClipboardList },
  summary: { color: "teal", icon: ClipboardList },
  tldr: { color: "teal", icon: ClipboardList },
  example: { color: "purple", icon: List },
  danger: { color: "red", icon: Zap },
  error: { color: "red", icon: Zap },
};

const CALLOUT_RE = /^\[!(\w+)\]\s*(.*)$/;

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Pull the leading plain text out of a react node tree (best-effort). */
function nodeText(node: ReactNode): string {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeText(node.props.children);
  }
  return "";
}

/* ------------------------------- tags ------------------------------- */

/** Split a string into text + inline `#tag` pills (Obsidian style). */
function withTags(text: string): ReactNode {
  const parts = text.split(/(#[A-Za-z][\w/-]*)/g);
  if (parts.length === 1) return text;
  return parts.map((p, i) =>
    /^#[A-Za-z][\w/-]*$/.test(p) ? (
      <span key={i} className="ob-tag">
        {p}
      </span>
    ) : (
      p
    ),
  );
}

/** Recursively map plain-string children to tag-aware nodes. */
function mapTags(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" ? withTags(child) : child,
  );
}

/**
 * Given a callout lead paragraph's children, drop the `[!type] title` marker
 * (the first line) and return the remaining nodes — preserving inline markdown
 * (bold, links) in the body. The marker always lives in the first string node;
 * the body begins after the first newline within that string.
 */
function stripMarkerPrefix(children: ReactNode): ReactNode {
  const arr = Children.toArray(children);
  const out: ReactNode[] = [];
  let stripped = false;
  for (let i = 0; i < arr.length; i++) {
    const node = arr[i];
    if (!stripped && typeof node === "string") {
      const nl = node.indexOf("\n");
      if (nl === -1) {
        // whole first text node is (part of) the marker line — drop it
        continue;
      }
      // keep everything after the first newline (the body's first text run)
      const rest = node.slice(nl + 1);
      stripped = true;
      if (rest) out.push(rest);
      continue;
    }
    out.push(node);
  }
  return mapTags(out);
}

/* --------------------------- wikilink prep -------------------------- */

/** Rewrite Obsidian `[[Note]]` / `[[Note|alias]]` into normal markdown links
 * with a custom scheme, so the existing pipeline parses them and our `a`
 * renderer can intercept the click. */
function preprocessWikilinks(src: string): string {
  return src.replace(/\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
    const [target, alias] = inner.split("|").map((s: string) => s.trim());
    const label = alias || target;
    return `[${label}](${WIKI_SCHEME}${encodeURIComponent(target)})`;
  });
}

/**
 * Markdown renderer. Two styles via `variant`:
 *  - "github"  → `.markdown-body` (GitHub flavored)
 *  - "obsidian"→ `.obsidian-body` (Obsidian reading view) + [[wikilink]] support,
 *               callouts, tag pills, and embedded-image styling.
 * Styling lives in index.css.
 */
export function Markdown({
  source,
  onNavigateFile,
  onNavigateNote,
  variant = "github",
}: MarkdownProps) {
  const isObsidian = variant === "obsidian";
  const body = isObsidian ? preprocessWikilinks(source) : source;

  const components: Components = {
    a({ href, children, ...props }) {
      const target = href ?? "";

      // Obsidian wikilink → resolve to a note
      if (target.startsWith(WIKI_SCHEME) && onNavigateNote) {
        const note = decodeURIComponent(target.slice(WIKI_SCHEME.length));
        return (
          <a
            href={`#${note}`}
            className="wikilink"
            onClick={(e) => {
              e.preventDefault();
              onNavigateNote(note);
            }}
            {...props}
          >
            {children}
          </a>
        );
      }

      // GitHub-style internal *.md link
      if (isInternal(target) && onNavigateFile) {
        return (
          <a
            href={`#${target}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigateFile(target);
            }}
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <a href={target} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    img({ src, alt }) {
      const url = typeof src === "string" ? src : "";
      if (isObsidian) {
        return (
          <img
            src={url}
            alt={alt ?? ""}
            loading="lazy"
            className="ob-embed"
            onError={(e) => {
              // a broken URL should never show a broken-image icon
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        );
      }
      return (
        <img src={url} alt={alt ?? ""} loading="lazy" className="inline-block align-middle" />
      );
    },
    pre({ children }) {
      // ```youtube blocks → lazy video embed (instead of a code block)
      const codeEl = Children.toArray(children).find((c) =>
        isValidElement(c),
      ) as ReactElement<{ className?: string; children?: ReactNode }> | undefined;
      const cls = codeEl?.props?.className ?? "";
      if (/language-youtube/.test(cls)) {
        const id = nodeText(codeEl?.props?.children).trim();
        if (id) return <YouTubeEmbed id={id} />;
      }
      return <pre>{children}</pre>;
    },
  };

  // Obsidian-only overrides: callouts (blockquote) + tag pills (p/li).
  if (isObsidian) {
    components.blockquote = ({ children }) => {
      // Find the first element child (the lead paragraph) and read its text.
      const kids = Children.toArray(children);
      const lead = kids.find((k) => isValidElement(k));
      const leadText = nodeText(lead).trim();
      // Match only the FIRST line for the `[!type] title` marker.
      const firstLine = leadText.split("\n")[0];
      const m = firstLine.match(CALLOUT_RE);

      if (m && isValidElement<{ children?: ReactNode }>(lead)) {
        const type = m[1].toLowerCase();
        const spec = CALLOUTS[type] ?? CALLOUTS.note;
        const title = m[2].trim() || titleCase(type);
        const Icon = spec.icon;
        // Strip the `[!type] title` marker line from the rendered lead paragraph,
        // keeping the body's inline markdown (bold, links) intact.
        const leadBody = stripMarkerPrefix(lead.props.children);
        const tailBlocks = kids.filter((k) => k !== lead);
        const hasLeadBody = nodeText(leadBody).trim().length > 0;

        return (
          <div className={`ob-callout ob-callout-${spec.color}`} data-callout={type}>
            <div className="ob-callout-title">
              <Icon className="ob-callout-icon" />
              <span>{mapTags(title)}</span>
            </div>
            {hasLeadBody || tailBlocks.length ? (
              <div className="ob-callout-body">
                {hasLeadBody ? <p>{leadBody}</p> : null}
                {tailBlocks}
              </div>
            ) : null}
          </div>
        );
      }

      // plain quote (no [!type]) — keep the styled blockquote
      return <blockquote>{children}</blockquote>;
    };

    components.p = ({ children }) => <p>{mapTags(children)}</p>;
    components.li = ({ children }) => <li>{mapTags(children)}</li>;
  }

  return (
    <div className={isObsidian ? "obsidian-body" : "markdown-body"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [
            rehypeHighlight,
            { languages: HL_LANGUAGES, detect: true, ignoreMissing: true },
          ],
        ]}
        // Preserve our internal wikilink: scheme (react-markdown's default
        // urlTransform would otherwise strip the unknown scheme to "").
        urlTransform={(url) =>
          url.startsWith(WIKI_SCHEME) ? url : defaultUrlTransform(url)
        }
        components={components}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
