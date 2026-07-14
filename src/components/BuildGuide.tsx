import { useState } from "react";
import { downloadProjectZip } from "../utils/rnFiles";

function Command({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      {label && <div className="border-b border-slate-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>}
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-emerald-300">{children}</pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 rounded border border-slate-700 bg-slate-800/90 px-2 py-1 text-[11px] font-medium text-slate-200 opacity-0 transition group-hover:opacity-100 hover:bg-slate-700"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-12">
      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-900/40">
        {n}
      </div>
      <h3 className="mb-1 text-base font-semibold text-slate-100">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-slate-400">{children}</div>
    </div>
  );
}

export default function BuildGuide() {
  const [zipping, setZipping] = useState(false);
  const zip = async () => {
    setZipping(true);
    try {
      await downloadProjectZip();
    } finally {
      setTimeout(() => setZipping(false), 600);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-violet-600/10 p-5">
        <h2 className="text-lg font-bold text-white">Build the installable APK</h2>
        <p className="mt-1 text-sm text-slate-300">
          Follow these steps on your machine to compile the React Native project into a signed
          <code className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-indigo-300">app-release.apk</code>
          you can install on any Android device.
        </p>
        <button
          onClick={zip}
          disabled={zipping}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-violet-500 disabled:opacity-60"
        >
          {zipping ? "Preparing…" : "⬇  Download the project (.zip)"}
        </button>
      </div>

      <div className="space-y-9">
        <Step n={1} title="Install the prerequisites">
          <p>You need the React Native toolchain on your computer:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li><b className="text-slate-200">Node.js 18+</b> and a package manager (npm).</li>
            <li><b className="text-slate-200">JDK 17</b> (Java).</li>
            <li><b className="text-slate-200">Android Studio</b> with the Android SDK (Platform 34, Build-Tools 34) and an emulator or a physical device.</li>
          </ul>
          <Command label="Set the SDK location (add to your shell profile)">{`export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools"`}</Command>
        </Step>

        <Step n={2} title="Scaffold a project, then drop in the app source">
          <p>
            The download holds the app source (<code className="font-mono text-xs text-indigo-300">App.tsx</code>,{" "}
            <code className="font-mono text-xs text-indigo-300">src/</code>) plus Android config overrides. Start from the
            official template, then overlay these files.
          </p>
          <Command label="Create a fresh React Native project">{`npx react-native@latest init PdfViewerApp --pm npm
cd PdfViewerApp`}</Command>
          <Command label="Install the dependencies the viewer needs">{`npm install react-native-webview react-native-document-picker react-native-fs \\
  @react-navigation/native @react-navigation/native-stack \\
  react-native-screens react-native-safe-area-context`}</Command>
          <p>
            Copy the downloaded <code className="font-mono text-xs text-indigo-300">App.tsx</code> and{" "}
            <code className="font-mono text-xs text-indigo-300">src/</code> over the scaffolded files, then apply the small
            Android changes in step 5 (manifest permissions, the “Open with” intent-filter, Gradle signing and proguard rules).
          </p>
          <p className="text-slate-500">Tip: iOS is out of scope here — this project targets Android only.</p>
        </Step>

        <Step n={3} title="Try it on a device or emulator (optional)">
          <p>Plug in a device with USB debugging on (or start an emulator), then run the app live.</p>
          <Command>npx react-native run-android</Command>
        </Step>

        <Step n={4} title="Generate a release keystore">
          <p>A keystore signs your APK. Generate one once and keep it safe — updating the app later requires the same key.</p>
          <Command label="Run, then move the file into android/app/">{`keytool -genkeypair -v -storetype PKCS12 \\
  -keystore my-release-key.keystore -alias my-key-alias \\
  -keyalg RSA -keysize 2048 -validity 10000`}</Command>
        </Step>

        <Step n={5} title="Wire up signing in Gradle">
          <p>Open <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-indigo-300">android/gradle.properties</code> and set the values you just created:</p>
          <Command label="android/gradle.properties">{`MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=********
MYAPP_UPLOAD_KEY_PASSWORD=********`}</Command>
          <p>Then add the signing config to <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-indigo-300">android/app/build.gradle</code> (inside the existing <code className="font-mono text-xs">android {"{ }"}</code> block):</p>
          <Command label="android/app/build.gradle">{`signingConfigs {
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
    }
}`}</Command>
        </Step>

        <Step n={6} title="Compile the release APK">
          <p>Run the Gradle release task. The first build downloads Gradle and SDK components, so it can take a few minutes.</p>
          <Command>{`cd android
./gradlew assembleRelease`}</Command>
        </Step>

        <Step n={7} title="Install your APK">
          <p>Your finished APK is generated here:</p>
          <Command label="Output">android/app/build/outputs/apk/release/app-release.apk</Command>
          <p>Install it onto a connected device with ADB, or just copy the file onto your phone and tap it.</p>
          <Command>adb install -r android/app/build/outputs/apk/release/app-release.apk</Command>
        </Step>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-100">⚡ Fast path — unsigned debug APK</h3>
          <p className="mb-1 text-sm text-slate-400">
            Need an APK in a hurry and don't want to set up signing? A debug build needs no keystore and installs with the same command:
          </p>
          <Command>{`cd android && ./gradlew assembleDebug
# output: android/app/build/outputs/apk/debug/app-debug.apk`}</Command>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-100">📴 Going fully offline</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            The viewer loads <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-indigo-300">pdf.js</code> from a CDN by default
            (so it needs internet on first open). To bundle it inside the APK, download the v3 UMD files
            <code className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-indigo-300">pdf.min.js</code> and
            <code className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-indigo-300">pdf.worker.min.js</code>
            into <code className="font-mono text-xs">android/app/src/main/assets/pdfjs/</code>, then point the two URLs in
            <code className="mx-1 font-mono text-xs">src/lib/viewerHtml.ts</code> at
            <code className="mx-1 font-mono text-xs">file:///android_asset/pdfjs/...</code>
          </p>
        </div>
      </div>
    </div>
  );
}
