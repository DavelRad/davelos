import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  PanelLeft,
  Menu,
  Network,
  Hash,
  Link2,
  User,
  Calendar,
  MapPin,
  Tag as TagIcon,
  Link as LinkIcon,
  Type as TypeIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { useViewport } from "../lib/useViewport";
import {
  DEFAULT_NOTE,
  VAULT_NAME,
  buildGraph,
  getNote,
  noteLinks,
  vaultNotes,
  vaultTree,
  type VaultProp,
} from "../data/vault";
import { Markdown } from "./Markdown";

interface ObsidianProps {
  /** an externally requested note (Spotlight / menu); resolved by title. */
  requestedNote?: string | null;
  onRequestConsumed?: () => void;
}

/**
 * Obsidian app — an authentic Obsidian vault reader for Davel's notes.
 * Three panes: left file explorer, center reading view (reuses the Markdown
 * pipeline with [[wikilink]] support), right outline/backlinks. A ribbon
 * toggles the knowledge Graph View.
 */
export function Obsidian({ requestedNote, onRequestConsumed }: ObsidianProps) {
  const { isMobile } = useViewport();
  const [history, setHistory] = useState<string[]>([DEFAULT_NOTE]);
  const [cursor, setCursor] = useState(0);
  const [showGraph, setShowGraph] = useState(false);
  const [showExplorer, setShowExplorer] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile file drawer
  const paneRef = useRef<HTMLDivElement>(null);

  const current = history[cursor];
  const note = getNote(current);

  function openNote(title: string) {
    setShowGraph(false);
    if (title === current) return;
    setHistory((h) => [...h.slice(0, cursor + 1), title]);
    setCursor((c) => c + 1);
  }

  // honor external note requests (e.g. Spotlight "About")
  useEffect(() => {
    if (requestedNote && getNote(requestedNote)) {
      openNote(requestedNote);
      onRequestConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedNote]);

  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
  }, [current, showGraph]);

  // ---- mobile: the Obsidian mobile app — full-width reading, file drawer ----
  if (isMobile) {
    return (
      <div className="flex h-full flex-col bg-[#1e1e1e] text-[#dcddde]">
        {/* top bar */}
        <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-black/40 bg-[#1a1a1a] px-2.5">
          <button
            type="button"
            aria-label="Files"
            onClick={() => setDrawerOpen(true)}
            className="grid size-9 place-items-center rounded-md text-[#b9bbbe] transition-colors hover:bg-white/5 active:scale-90"
          >
            <Menu className="size-[19px]" />
          </button>
          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[0.9rem] font-medium">
            {showGraph ? (
              <>
                <Network className="size-4 shrink-0 text-[#a78bfa]" /> Graph view
              </>
            ) : (
              <>
                <FileText className="size-4 shrink-0 text-[#a78bfa]" />
                <span className="truncate">{current}</span>
              </>
            )}
          </span>
          <button
            type="button"
            aria-label="Graph view"
            aria-pressed={showGraph}
            onClick={() => setShowGraph((g) => !g)}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-md transition-colors active:scale-90",
              showGraph
                ? "bg-[#a78bfa26] text-[#c4b5fd]"
                : "text-[#8b8d92] hover:bg-white/5 hover:text-[#dcddde]",
            )}
          >
            <Network className="size-[19px]" />
          </button>
        </div>

        {/* content */}
        <div className="relative min-h-0 flex-1">
          {showGraph ? (
            <GraphView onOpen={openNote} active={current} />
          ) : (
            <div
              ref={paneRef}
              className="scroll-region h-full overflow-y-auto px-5 py-5"
            >
              {note ? (
                <>
                  <PropertiesBlock
                    props={note.props}
                    tags={note.tags}
                    onOpenNote={openNote}
                  />
                  <Markdown
                    source={note.body}
                    variant="obsidian"
                    onNavigateNote={openNote}
                  />
                </>
              ) : (
                <p className="text-sm text-[#72767d]">Note not found.</p>
              )}
            </div>
          )}

          {/* slide-in file drawer */}
          <AnimatePresence>
            {drawerOpen ? (
              <>
                <motion.div
                  className="absolute inset-0 z-20 bg-black/55"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setDrawerOpen(false)}
                />
                <motion.aside
                  className="absolute inset-y-0 left-0 z-30 flex w-[80%] max-w-[300px] flex-col border-r border-black/40 bg-[#202225] shadow-2xl"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 360, damping: 36 }}
                >
                  <div className="flex items-center gap-1.5 border-b border-black/30 px-3 py-3 text-sm font-semibold text-[#b9bbbe]">
                    <Folder className="size-4 text-[#a78bfa]" />
                    {VAULT_NAME}
                  </div>
                  <div className="scroll-region min-h-0 flex-1 overflow-y-auto py-1.5 text-[0.92rem]">
                    <FileTree
                      current={current}
                      onOpen={(t) => {
                        openNote(t);
                        setDrawerOpen(false);
                      }}
                    />
                  </div>
                </motion.aside>
              </>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#1e1e1e] text-[#dcddde]">
      {/* left ribbon (Obsidian's icon rail) */}
      <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-black/40 bg-[#1a1a1a] py-2">
        <RibbonBtn
          label="Toggle file explorer"
          active={showExplorer && !showGraph}
          onClick={() => setShowExplorer((s) => !s)}
        >
          <PanelLeft className="size-4" />
        </RibbonBtn>
        <RibbonBtn
          label="Open graph view"
          active={showGraph}
          onClick={() => setShowGraph((g) => !g)}
        >
          <Network className="size-4" />
        </RibbonBtn>
      </div>

      {/* file explorer */}
      {showExplorer ? (
        <aside className="flex w-52 shrink-0 flex-col border-r border-black/40 bg-[#202225]">
          <div className="flex items-center gap-1.5 border-b border-black/30 px-3 py-2 text-xs font-semibold text-[#b9bbbe]">
            <Folder className="size-3.5 text-[#a78bfa]" />
            {VAULT_NAME}
          </div>
          <div className="scroll-region min-h-0 flex-1 overflow-y-auto py-1">
            <FileTree current={current} onOpen={openNote} />
          </div>
        </aside>
      ) : null}

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* tab / breadcrumb bar */}
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-black/40 bg-[#1a1a1a] px-3 text-xs">
          {showGraph ? (
            <span className="flex items-center gap-1.5 rounded-md bg-[#2a2a2e] px-2.5 py-1 text-[#dcddde]">
              <Network className="size-3.5 text-[#a78bfa]" />
              Graph view
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-md bg-[#2a2a2e] px-2.5 py-1 text-[#dcddde]">
              <FileText className="size-3.5 text-[#a78bfa]" />
              {note?.folder ? `${note.folder} / ` : ""}
              {current}
            </span>
          )}
          <span className="ml-auto text-[0.7rem] text-[#72767d]">
            {vaultNotes.length} notes
          </span>
        </div>

        {showGraph ? (
          <GraphView onOpen={openNote} active={current} />
        ) : (
          <div className="flex min-h-0 flex-1">
            {/* reading view */}
            <div
              ref={paneRef}
              className="scroll-region min-w-0 flex-1 overflow-y-auto px-7 py-6"
            >
              {note ? (
                <div className="mx-auto max-w-[46rem]">
                  <PropertiesBlock
                    props={note.props}
                    tags={note.tags}
                    onOpenNote={openNote}
                  />
                  <Markdown
                    source={note.body}
                    variant="obsidian"
                    onNavigateNote={openNote}
                  />
                </div>
              ) : (
                <p className="text-sm text-[#72767d]">Note not found.</p>
              )}
            </div>

            {/* right panel: outline + backlinks */}
            <RightPanel note={current} onOpen={openNote} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ file tree ------------------------------ */

function FileTree({
  current,
  onOpen,
}: {
  current: string;
  onOpen: (title: string) => void;
}) {
  return (
    <ul className="px-1.5 text-[0.82rem]">
      {vaultTree.map((folder) =>
        folder.name === "" ? (
          // top-level notes
          folder.notes.map((title) => (
            <NoteRow
              key={title}
              title={title}
              depth={0}
              active={current === title}
              onOpen={onOpen}
            />
          ))
        ) : (
          <FolderRow
            key={folder.name}
            name={folder.name}
            notes={folder.notes}
            current={current}
            onOpen={onOpen}
          />
        ),
      )}
    </ul>
  );
}

function FolderRow({
  name,
  notes,
  current,
  onOpen,
}: {
  name: string;
  notes: string[];
  current: string;
  onOpen: (title: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[#b9bbbe] transition-colors hover:bg-white/5"
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-[#72767d]" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-[#72767d]" />
        )}
        {open ? (
          <FolderOpen className="size-3.5 shrink-0 text-[#a78bfa]" />
        ) : (
          <Folder className="size-3.5 shrink-0 text-[#a78bfa]" />
        )}
        <span className="truncate">{name}</span>
      </button>
      {open ? (
        <ul>
          {notes.map((title) => (
            <NoteRow
              key={title}
              title={title}
              depth={1}
              active={current === title}
              onOpen={onOpen}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function NoteRow({
  title,
  depth,
  active,
  onOpen,
}: {
  title: string;
  depth: number;
  active: boolean;
  onOpen: (title: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(title)}
        style={{ paddingLeft: 8 + depth * 18 }}
        className={cn(
          "flex w-full items-center gap-1.5 rounded py-1 pr-2 text-left transition-colors active:scale-[0.99]",
          active
            ? "bg-[#a78bfa1f] text-[#c4b5fd]"
            : "text-[#b9bbbe] hover:bg-white/5",
        )}
      >
        <FileText className="size-3.5 shrink-0 opacity-70" />
        <span className="truncate">{title}</span>
      </button>
    </li>
  );
}

/* --------------------------- properties block --------------------------- */

/** Pick a small icon for a property key (best-effort). */
function propIcon(key: string): LucideIcon {
  const k = key.toLowerCase();
  if (/(role|built|client|type)/.test(k)) return User;
  if (/(date|when)/.test(k)) return Calendar;
  if (/(location|where|place)/.test(k)) return MapPin;
  if (/(link|repo|demo|website|url)/.test(k)) return LinkIcon;
  return TypeIcon;
}

function PropertiesBlock({
  props,
  tags,
  onOpenNote,
}: {
  props?: VaultProp[];
  tags?: string[];
  onOpenNote: (title: string) => void;
}) {
  if ((!props || props.length === 0) && (!tags || tags.length === 0)) return null;

  return (
    <div className="mb-5 rounded-lg border border-[#393b40] bg-[#212126] px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-[#72767d]">
        <Hash className="size-3" /> Properties
      </div>
      <dl className="divide-y divide-[#34343a]">
        {props?.map((p) => {
          const Icon = propIcon(p.key);
          return (
            <div key={p.key} className="flex items-baseline gap-3 py-1.5 text-[0.82rem]">
              <dt className="flex w-28 shrink-0 items-center gap-1.5 font-mono text-[0.74rem] text-[#8b8d92]">
                <Icon className="size-3 shrink-0" />
                {p.key}
              </dt>
              <dd className="min-w-0 flex-1 text-[#d4d4d6]">
                {p.kind === "link" ? (
                  <a
                    href={p.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-[#a78bfa44] bg-[#a78bfa1a] px-2 py-0.5 text-[0.78rem] text-[#c4b5fd] transition-colors hover:bg-[#a78bfa2e]"
                  >
                    <LinkIcon className="size-3 shrink-0" />
                    <span className="truncate">{prettyUrl(p.value)}</span>
                  </a>
                ) : (
                  p.value
                )}
              </dd>
            </div>
          );
        })}
        {tags && tags.length ? (
          <div className="flex items-baseline gap-3 py-1.5 text-[0.82rem]">
            <dt className="flex w-28 shrink-0 items-center gap-1.5 font-mono text-[0.74rem] text-[#8b8d92]">
              <TagIcon className="size-3 shrink-0" />
              tags
            </dt>
            <dd className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onOpenNote("Home")}
                  title={`#${t}`}
                  className="rounded-full border border-[#a78bfa44] bg-[#a78bfa14] px-2 py-0.5 text-[0.72rem] font-medium text-[#c4b5fd] transition-colors hover:bg-[#a78bfa28]"
                >
                  #{t}
                </button>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function prettyUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^mailto:/, "")
    .replace(/\/$/, "");
}

/* ---------------------------- right panel ----------------------------- */

function RightPanel({
  note,
  onOpen,
}: {
  note: string;
  onOpen: (title: string) => void;
}) {
  const body = getNote(note)?.body ?? "";
  // outline = headings in this note
  const headings = useMemo(
    () =>
      body
        .split("\n")
        .map((l) => l.match(/^(#{1,4})\s+(.*)$/))
        .filter(Boolean)
        .map((m) => ({ level: (m as RegExpMatchArray)[1].length, text: (m as RegExpMatchArray)[2] })),
    [body],
  );
  // backlinks = notes that link to this note
  const backlinks = useMemo(
    () => vaultNotes.filter((n) => n.title !== note && noteLinks(n.body).includes(note)).map((n) => n.title),
    [note],
  );

  return (
    <aside className="hidden w-52 shrink-0 flex-col border-l border-black/40 bg-[#202225] lg:flex">
      <div className="scroll-region min-h-0 flex-1 overflow-y-auto p-3 text-xs">
        <p className="mb-2 flex items-center gap-1.5 font-semibold uppercase tracking-wide text-[#72767d]">
          <Hash className="size-3" /> Outline
        </p>
        {headings.length ? (
          <ul className="space-y-1">
            {headings.map((h, i) => (
              <li
                key={i}
                style={{ paddingLeft: (h.level - 1) * 10 }}
                className="truncate text-[#b9bbbe]"
              >
                {h.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#72767d]">No headings</p>
        )}

        <p className="mb-2 mt-5 flex items-center gap-1.5 font-semibold uppercase tracking-wide text-[#72767d]">
          <Link2 className="size-3" /> Backlinks
        </p>
        {backlinks.length ? (
          <ul className="space-y-1">
            {backlinks.map((b) => (
              <li key={b}>
                <button
                  type="button"
                  onClick={() => onOpen(b)}
                  className="truncate text-[#a78bfa] transition-colors hover:underline"
                >
                  {b}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#72767d]">No backlinks</p>
        )}
      </div>
    </aside>
  );
}

/* ----------------------------- graph view ----------------------------- */

function GraphView({
  onOpen,
  active,
}: {
  onOpen: (title: string) => void;
  active: string;
}) {
  const { nodes, edges } = useMemo(() => buildGraph(), []);
  const [hover, setHover] = useState<string | null>(null);
  // viewBox is 0..1000 square; map node 0..1 coords into it
  const P = (v: number) => v * 1000;
  const pos = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  return (
    <div className="relative min-h-0 flex-1 bg-[#1a1a1a]">
      <svg
        viewBox="0 0 1000 1000"
        className="size-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* edges */}
        {edges.map((e, i) => {
          const a = pos[e.a];
          const b = pos[e.b];
          if (!a || !b) return null;
          const lit = hover === e.a || hover === e.b || active === e.a || active === e.b;
          return (
            <line
              key={i}
              x1={P(a.x)}
              y1={P(a.y)}
              x2={P(b.x)}
              y2={P(b.y)}
              stroke={lit ? "#a78bfa" : "#3a3a40"}
              strokeWidth={lit ? 2.2 : 1.2}
              opacity={lit ? 0.9 : 0.55}
            />
          );
        })}
        {/* nodes */}
        {nodes.map((n) => {
          const r = 9 + n.weight * 2.4;
          const isActive = active === n.id;
          const isHover = hover === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${P(n.x)} ${P(n.y)})`}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onOpen(n.id)}
              style={{ cursor: "pointer" }}
            >
              <circle
                r={r}
                fill={isActive ? "#c4b5fd" : isHover ? "#a78bfa" : "#7c6ff0"}
                stroke={isActive ? "#fff" : "transparent"}
                strokeWidth={2}
              />
              <text
                x={0}
                y={r + 20}
                textAnchor="middle"
                fontSize={20}
                fill={isActive || isHover ? "#dcddde" : "#9a9aa2"}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[0.7rem] text-[#72767d]">
        Knowledge graph — click a node to open the note
      </p>
    </div>
  );
}

/* ------------------------------- atoms -------------------------------- */

function RibbonBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md transition-colors active:scale-90",
        active
          ? "bg-[#a78bfa26] text-[#c4b5fd]"
          : "text-[#8b8d92] hover:bg-white/5 hover:text-[#dcddde]",
      )}
    >
      {children}
    </button>
  );
}
