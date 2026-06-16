import { Download, ExternalLink } from "lucide-react";

/**
 * Preview — macOS Preview-style PDF viewer for Davel's real résumé. Embeds the
 * file from /public/resume.pdf via an <iframe>. Includes a small toolbar with
 * Open-in-new-tab and Download actions (both real).
 */
export function Preview() {
  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* slim toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-black/40 bg-[#2a2a2c] px-3 py-1.5 text-xs text-[#d4d4d4]">
        <span className="font-medium">resume.pdf</span>
        <div className="ml-auto flex items-center gap-1">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-white/10 active:scale-95"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
          <a
            href="/resume.pdf"
            download="Davel-Radindra-Resume.pdf"
            title="Download"
            className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-white/10 active:scale-95"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>

      {/* the PDF itself */}
      <iframe
        src="/resume.pdf#toolbar=0&navpanes=0&view=FitH"
        title="resume.pdf"
        className="size-full flex-1 border-0 bg-[#525659]"
      />
    </div>
  );
}
