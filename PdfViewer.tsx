import { useCallback, useEffect, useRef, useState } from "react";
import { buildSamplePdf } from "../lib/samplePdf";

type Source = { url: string; name: string; isObjectUrl: boolean };

export default function PdfViewer() {
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [urlOpen, setUrlOpen] = useState(false);
  const [fs, setFs] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setObjectUrl = useCallback((url: string, name: string) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;
    setSource({ url, name, isObjectUrl: true });
    setLoading(true);
  }, []);

  // Generate a self-contained sample PDF on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bytes = await buildSamplePdf();
        if (cancelled) return;
        const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
        setObjectUrl(URL.createObjectURL(blob), "sample-document.pdf");
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setObjectUrl]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // Safety net: some PDF plugins delay or skip the iframe `load` event.
  useEffect(() => {
    if (!source) return;
    const t = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(t);
  }, [source]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setObjectUrl(URL.createObjectURL(file), file.name);
    e.target.value = "";
  };

  const openUrl = () => {
    const trimmed = urlInput.trim();
    if (!/^https?:\/\//i.test(trimmed)) return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSource({ url: trimmed, name: trimmed.split("/").pop() || "remote.pdf", isObjectUrl: false });
    setLoading(true);
    setUrlOpen(false);
  };

  const download = () => {
    if (!source) return;
    const a = document.createElement("a");
    a.href = source.url;
    a.download = source.name;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const print = () => {
    const iframe = stageRef.current?.querySelector("iframe");
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch {
      window.open(source?.url, "_blank", "noopener");
    }
  };

  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow shadow-indigo-900/40 transition hover:bg-indigo-400"
        >
          <FolderIcon /> Open file
        </button>
        <input ref={fileInputRef} type="file" accept="application/pdf" onChange={onPickFile} className="hidden" />

        <button
          onClick={() => setUrlOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-700"
        >
          <LinkIcon /> URL
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={download} disabled={!source} className="iconbtn" title="Download">
            <DownloadIcon />
          </button>
          <button onClick={print} disabled={!source} className="iconbtn" title="Print">
            <PrinterIcon />
          </button>
          <button onClick={toggleFullscreen} disabled={!source} className="iconbtn" title="Fullscreen">
            {fs ? <ExitFsIcon /> : <FsIcon />}
          </button>
        </div>
      </div>

      {urlOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 sm:flex-row">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openUrl()}
            placeholder="https://example.com/document.pdf"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={openUrl}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Open
          </button>
        </div>
      )}

      {/* Stage */}
      <div
        ref={stageRef}
        className="relative h-[68vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#3a3d40]"
      >
        {source && (
          <iframe
            key={source.url}
            title={source.name}
            src={source.url}
            className="h-full w-full"
            onLoad={() => setLoading(false)}
          />
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#3a3d40] text-slate-200">
            <Spinner />
            <p className="text-sm">Preparing document…</p>
          </div>
        )}

        {source && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-4 py-2 text-xs text-slate-200">
            <span className="max-w-[70%] truncate font-mono">{source.name}</span>
            <span className="rounded bg-black/40 px-2 py-0.5">
              {source.isObjectUrl ? "local" : "remote"} · use the in-viewer controls to zoom &amp; navigate
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-7 w-7 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
function PrinterIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  );
}
function FsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
function ExitFsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8V5a2 2 0 0 1 2-2h3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
    </svg>
  );
}
