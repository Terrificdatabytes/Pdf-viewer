import { useMemo, useState } from "react";
import type { RnFile } from "../lib/rnFiles";
import { downloadTextFile } from "../lib/rnFiles";

const COMMENT_PREFIX: Record<string, string[]> = {
  javascript: ["//"],
  typescript: ["//"],
  tsx: ["//"],
  json: [],
  xml: ["<!--"],
  properties: ["#"],
  markdown: [],
  text: ["#"],
};

function isCommentLine(lang: string, line: string): boolean {
  const markers = COMMENT_PREFIX[lang] ?? [];
  const trimmed = line.trimStart();
  return markers.some((m) => trimmed.startsWith(m));
}

export default function CodeViewer({ file }: { file: RnFile }) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => file.code.split("\n"), [file.code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/70 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileIcon lang={file.language} />
          <div className="min-w-0">
            <p className="truncate font-mono text-[13px] font-semibold text-slate-100">{file.path}</p>
            <p className="truncate text-[11px] text-slate-500">{file.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-700"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => downloadTextFile(file.path.split("/").pop() ?? "file.txt", file.code)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-700"
          >
            <DownloadIcon />
            File
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[#0b1120]">
        <pre className="min-w-full font-mono text-[12.5px] leading-[1.55]">
          <code className="block">
            {lines.map((line, i) => {
              const comment = isCommentLine(file.language, line);
              return (
                <div key={i} className="flex hover:bg-white/[0.03]">
                  <span className="sticky left-0 w-12 shrink-0 select-none border-r border-slate-800/70 bg-[#0b1120] pr-3 text-right text-slate-600">
                    {i + 1}
                  </span>
                  <span
                    className={"whitespace-pre px-4 " + (comment ? "text-emerald-400/70 italic" : "text-slate-200")}
                  >
                    {line || " "}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}

function FileIcon({ lang }: { lang: string }) {
  const map: Record<string, string> = {
    tsx: "⚛️",
    typescript: "🟦",
    javascript: "🟨",
    json: "🔧",
    xml: "🤖",
    properties: "⚙️",
    markdown: "📘",
    text: "📄",
  };
  return <span className="text-sm">{map[lang] ?? "📄"}</span>;
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
