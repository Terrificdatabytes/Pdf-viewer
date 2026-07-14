import { useState } from "react";
import PdfViewer from "./components/PdfViewer";
import FileTree from "./components/FileTree";
import CodeViewer from "./components/CodeViewer";
import BuildGuide from "./components/BuildGuide";
import { RN_FILES, type RnFile } from "./utils/rnFiles";

type Tab = "demo" | "code" | "build";

const DEFAULT_FILE =
  RN_FILES.find((f) => f.path === "src/lib/viewerHtml.ts") ?? RN_FILES[0];

const TABS: { id: Tab; label: string }[] = [
  { id: "demo", label: "Live Demo" },
  { id: "code", label: "Android Project" },
  { id: "build", label: "Build APK" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("demo");
  const [file, setFile] = useState<RnFile>(DEFAULT_FILE);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[360px] w-[360px] rounded-full bg-violet-600/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* Header */}
        <header className="pt-12 sm:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            React Native 0.76 · WebView · pdf.js · Android APK
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Full PDF Viewer
            <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              for Android
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            A complete React Native app that renders PDFs inside a WebView using Mozilla pdf.js — with
            file picking, remote URLs, zoom and page navigation. Try the live in-browser viewer below,
            then grab the full project and compile it into an installable{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-indigo-300">.apk</code>.
          </p>

          {/* Quick stats */}
          <div className="mt-6 flex flex-wrap gap-2">
            {["📄 Local + remote PDFs", "🔍 Zoom & page nav", "📂 System PDF handler", "📴 Offline-ready"].map(
              (f) => (
                <span
                  key={f}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300"
                >
                  {f}
                </span>
              ),
            )}
          </div>
        </header>

        {/* Tabs */}
        <nav className="sticky top-0 z-20 mt-10 -mx-4 border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex gap-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={
                    "relative px-4 py-3 text-sm font-semibold transition " +
                    (active ? "text-white" : "text-slate-400 hover:text-slate-200")
                  }
                >
                  {t.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab content */}
        <main className="mt-8">
          {tab === "demo" && (
            <div className="space-y-8">
              <PdfViewer />

              {/* How it works */}
              <section>
                <h2 className="text-lg font-bold text-white">How the Android viewer works</h2>
                <p className="mt-1 text-sm text-slate-400">
                  The web demo above uses the browser's native engine. The Android app uses the same idea —
                  a WebView — but loads pdf.js to draw each page, since Android's WebView can't render PDFs natively.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["1 · WebView host", "A react-native-webview hosts a tiny HTML page bundled with the app."],
                    ["2 · pdf.js render", "Mozilla pdf.js draws every page onto a <canvas> at full fidelity."],
                    ["3 · Two-way bridge", "injectJavaScript + onMessage drive zoom/page and report progress."],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                      <p className="text-sm font-semibold text-indigo-300">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === "code" && (
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <div className="grid h-[72vh] min-h-[460px] grid-cols-1 md:grid-cols-[300px_1fr]">
                <aside className="min-h-0 overflow-hidden border-b border-slate-800 bg-slate-900/40 md:border-b-0 md:border-r">
                  <FileTree active={file} onSelect={setFile} />
                </aside>
                <section className="min-h-0">
                  <CodeViewer file={file} />
                </section>
              </div>
            </div>
          )}

          {tab === "build" && <BuildGuide />}
        </main>

        <footer className="mt-16 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          Built with React + Vite + Tailwind. The downloadable project targets React Native 0.76 on Android.
        </footer>
      </div>
    </div>
  );
}
