import { useState } from "react";
import {
  Send,
  Copy,
  Check,
  Linkedin,
  Github,
  Twitter,
  Globe,
  Mail as MailIcon,
} from "lucide-react";
import { contactLinks } from "../data/profile";

const ICONS: Record<string, typeof MailIcon> = {
  Email: MailIcon,
  LinkedIn: Linkedin,
  GitHub: Github,
  "X / Twitter": Twitter,
  Website: Globe,
};

/**
 * A compose-style contact window. "Send" opens the user's mail client with the
 * (editable) subject + body prefilled; "Copy" copies the address with a
 * confirmation. The link list routes to each profile in a new tab.
 */
export function Mail() {
  const email =
    contactLinks.find((l) => l.label === "Email")?.value ??
    "davel.radindra2@gmail.com";

  const [subject, setSubject] = useState("Let's build something");
  const [body, setBody] = useState(
    "Hi Davel,\n\nI came across davelOS and wanted to reach out about ",
  );
  const [copied, setCopied] = useState(false);

  const mailto = `mailto:${email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // clipboard may be blocked; still show the confirmation as best-effort
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* compose header */}
      <div className="flex items-center border-b border-line px-4 py-3">
        <p className="text-sm font-medium text-ink">New Message</p>
        <button
          type="button"
          onClick={copyEmail}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-os-accent/50 hover:text-ink active:scale-95"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-os-accent" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy email
            </>
          )}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* fields */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-sm">
          <span className="w-14 shrink-0 text-ink-faint">To</span>
          <span className="truncate text-ink">{email}</span>
        </div>
        <label className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-sm">
          <span className="w-14 shrink-0 text-ink-faint">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 bg-transparent text-ink outline-none"
            aria-label="Subject"
          />
        </label>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Message body"
          className="min-h-32 flex-1 resize-none bg-transparent px-4 py-4 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint"
          placeholder="Write your message…"
        />

        {/* links */}
        <div className="border-t border-line px-4 py-3">
          <p className="mb-2 text-[0.65rem] uppercase tracking-wide text-ink-faint">
            Elsewhere
          </p>
          <div className="grid grid-cols-2 gap-2">
            {contactLinks.map((link) => {
              const Icon = ICONS[link.label] ?? Globe;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-ink-muted transition-colors hover:border-os-accent/50 hover:text-ink active:scale-[0.98]"
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{link.value}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* send */}
      <div className="flex items-center justify-end border-t border-line px-4 py-3">
        <a
          href={mailto}
          className="inline-flex items-center gap-2 rounded-full bg-os-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        >
          <Send className="size-4" />
          Send
        </a>
      </div>
    </div>
  );
}
