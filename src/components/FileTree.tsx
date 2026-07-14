import { useMemo, useState } from "react";
import { RN_FILES, RN_GROUPS, downloadProjectZip, type RnFile } from "../utils/rnFiles";

export default function FileTree({
  active,
  onSelect,
}: {
  active: RnFile;
  onSelect: (file: RnFile) => void;
}) {
  const [query, setQuery] = useState("");
  const [zipping, setZipping] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RN_FILES;
    return RN_FILES.filter(
      (f) => f.path.toLowerCase().includes(q) || f.description.toLowerCase().includes(q),
    );
  }, [query]);

  const handleZip = async () => {
    setZipping(true);
    try {
      await downloadProjectZip();
    } finally {
      setTimeout(() => setZipping(false), 600);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-slate-800 p-3">
        <button
          onClick={handleZip}
          disabled={zipping}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-violet-500 disabled:opacity-60"
        >
          {zipping ? (
            <SpinnerIcon />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
          )}
          {zipping ? "Preparing…" : "Download project (.zip)"}
        </button>
        <div className="relative mt-3">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter files…"
            className="w-full rounded-md border border-slate-700 bg-slate-900 py-1.5 pl-8 pr-2 text-[13px] text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-2">
        {RN_GROUPS.map((group) => {
          const files = filtered.filter((f) => f.group === group);
          if (files.length === 0) return null;
          return (
            <div key={group} className="mb-1">
              <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group}
              </p>
              {files.map((file) => {
                const isActive = file.path === active.path;
                const name = file.path.split("/").pop();
                return (
                  <button
                    key={file.path}
                    onClick={() => onSelect(file)}
                    className={
                      "flex w-full items-center gap-2 px-4 py-1.5 text-left text-[13px] transition " +
                      (isActive
                        ? "bg-indigo-500/15 text-indigo-300"
                        : "text-slate-300 hover:bg-slate-800/70")
                    }
                  >
                    <span className="font-mono text-[11px]">{name}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                  </button>
                );
              })}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-slate-500">No files match “{query}”.</p>
        )}
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
