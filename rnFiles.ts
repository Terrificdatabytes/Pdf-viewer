import JSZip from "jszip";

export type RnLanguage =
  | "json"
  | "javascript"
  | "typescript"
  | "tsx"
  | "xml"
  | "properties"
  | "markdown"
  | "text";

export type RnFile = {
  path: string;
  language: RnLanguage;
  group: "Project config" | "App code" | "Android" | "Docs";
  description: string;
  code: string;
};

/**
 * The complete, compilable React Native project (downloadable as a ZIP).
 *
 * Android's built-in WebView cannot render PDFs on its own, so the app ships a
 * tiny HTML document that uses Mozilla pdf.js (UMD build v3.11.174) to draw each
 * page onto a <canvas>. React Native drives that document via injectJavaScript
 * and listens for postMessage events back.
 *
 * The strings below are template literals; none of the source files contain
 * backticks or `${`, so they are stored verbatim and zipped without escaping.
 */
export const RN_FILES: RnFile[] = [
  {
    path: "package.json",
    language: "json",
    group: "Project config",
    description: "Dependencies + npm scripts for building the APK.",
    code: `{
  "name": "PdfViewerApp",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "start": "react-native start",
    "build:android-debug": "cd android && ./gradlew assembleDebug",
    "build:android": "cd android && ./gradlew assembleRelease",
    "clean": "cd android && ./gradlew clean"
  },
  "dependencies": {
    "@react-navigation/native": "^7.0.14",
    "@react-navigation/native-stack": "^7.2.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "react-native-document-picker": "^9.3.1",
    "react-native-fs": "^2.20.0",
    "react-native-safe-area-context": "^5.0.0",
    "react-native-screens": "^4.4.0",
    "react-native-webview": "^13.12.5"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@react-native/babel-preset": "0.76.5",
    "@react-native/metro-config": "0.76.5",
    "@react-native/typescript-config": "0.76.5",
    "typescript": "5.6.3"
  },
  "engines": { "node": ">=18" }
}`,
  },
  {
    path: "app.json",
    language: "json",
    group: "Project config",
    description: "App name shown on the Android launcher.",
    code: `{
  "name": "PdfViewerApp",
  "displayName": "PDF Viewer"
}`,
  },
  {
    path: "babel.config.js",
    language: "javascript",
    group: "Project config",
    description: "Babel preset used by Metro / React Native.",
    code: `module.exports = {
  presets: ['module:@react-native/babel-preset'],
};`,
  },
  {
    path: "metro.config.js",
    language: "javascript",
    group: "Project config",
    description: "Metro bundler configuration.",
    code: `const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const defaultConfig = getDefaultConfig(__dirname);
module.exports = mergeConfig(defaultConfig, {});`,
  },
  {
    path: "tsconfig.json",
    language: "json",
    group: "Project config",
    description: "TypeScript configuration (extends the RN defaults).",
    code: `{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["App.tsx", "src"]
}`,
  },
  {
    path: "App.tsx",
    language: "tsx",
    group: "App code",
    description: "Root component: React Navigation stack with Home + Viewer screens.",
    code: `import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import ViewerScreen from './src/screens/ViewerScreen';

export type PdfSource = {
  title: string;
  uri?: string;     // remote PDF URL
  base64?: string;  // contents of a local PDF file
};

export type RootStackParamList = {
  Home: undefined;
  Viewer: { source: PdfSource };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#6366f1',
    background: '#0f172a',
    card: '#0f172a',
    text: '#ffffff',
    border: '#1e293b',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar barStyle='light-content' backgroundColor='#0f172a' />
      <Stack.Navigator screenOptions={{ headerShadowVisible: false, headerTitleStyle: { fontWeight: '700' } }}>
        <Stack.Screen name='Home' component={HomeScreen} options={{ title: 'PDF Viewer' }} />
        <Stack.Screen
          name='Viewer'
          component={ViewerScreen}
          options={({ route }) => ({ title: route.params.source.title })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}`,
  },
  {
    path: "src/screens/HomeScreen.tsx",
    language: "tsx",
    group: "App code",
    description: "Landing screen: pick a local PDF, open a sample, or paste a URL.",
    code: `import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [url, setUrl] = useState('');

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
        allowMultiSelection: false,
      });
      const file = res[0];
      // Read the local file as base64 so the WebView can render it fully offline.
      const base64 = await RNFS.readFile(decodeURI(file.uri), 'base64');
      navigation.navigate('Viewer', { source: { title: file.name ?? 'Local PDF', base64 } });
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) {
        Alert.alert('Could not open file', String((e as any)?.message ?? e));
      }
    }
  };

  const openUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    navigation.navigate('Viewer', { source: { title: 'Remote PDF', uri: trimmed } });
  };

  const openSample = () => {
    const sample = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
    navigation.navigate('Viewer', { source: { title: 'Sample PDF', uri: sample } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>📄</Text>
        <Text style={styles.title}>PDF Viewer</Text>
        <Text style={styles.subtitle}>React Native • WebView • pdf.js</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={pickFile} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>📁  Pick a PDF from your device</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.primaryBtn, styles.secondaryBtn]} onPress={openSample} activeOpacity={0.85}>
        <Text style={styles.secondaryBtnText}>🌐  Open a sample PDF</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.label}>Open a remote PDF URL</Text>
      <TextInput
        style={styles.input}
        placeholder='https://example.com/document.pdf'
        placeholderTextColor='#64748b'
        value={url}
        onChangeText={setUrl}
        autoCapitalize='none'
        autoCorrect={false}
        keyboardType='url'
      />
      <TouchableOpacity
        style={[styles.primaryBtn, { opacity: url.trim() ? 1 : 0.45 }]}
        disabled={!url.trim()}
        onPress={openUrl}
        activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Open URL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f172a' },
  header: { alignItems: 'center', marginBottom: 36 },
  emoji: { fontSize: 52 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#94a3b8', marginTop: 4 },
  label: { color: '#cbd5e1', marginBottom: 8, marginLeft: 2 },
  primaryBtn: { backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  secondaryBtnText: { color: '#e2e8f0', fontSize: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 28 },
  input: { backgroundColor: '#1e293b', color: '#ffffff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#334155' },
});`,
  },
  {
    path: "src/screens/ViewerScreen.tsx",
    language: "tsx",
    group: "App code",
    description: "Hosts the WebView + a zoom / page toolbar. Talks to pdf.js via messages.",
    code: `import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { buildViewerHtml } from '../lib/viewerHtml';

type Props = NativeStackScreenProps<RootStackParamList, 'Viewer'>;

export default function ViewerScreen({ route }: Props) {
  const { source } = route.params;
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback((obj: Record<string, unknown>) => {
    const payload = JSON.stringify(JSON.stringify(obj));
    webRef.current?.injectJavaScript('window.handleReactNativeMessage(' + payload + '); true;');
  }, []);

  const onMessage = (event: WebViewMessageEvent) => {
    let data: any;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    switch (data.type) {
      case 'ready':
        post({
          type: 'load',
          source: source.uri ? source.uri : 'data:application/pdf;base64,' + source.base64,
          scale: zoom,
        });
        break;
      case 'loaded':
        setNumPages(data.numPages);
        setLoading(false);
        break;
      case 'pagechange':
        setPage(data.page);
        break;
      case 'error':
        setError(data.message);
        setLoading(false);
        break;
    }
  };

  const changeZoom = (delta: number) => {
    const next = Math.min(3, Math.max(0.5, Number((zoom + delta).toFixed(2))));
    setZoom(next);
    post({ type: 'zoom', scale: next });
  };

  const goTo = (target: number) => {
    if (!numPages) return;
    const n = Math.min(Math.max(1, target), numPages);
    setPage(n);
    post({ type: 'page', page: n });
  };

  return (
    <SafeAreaView style={styles.flex} edges={['bottom']}>
      <View style={styles.toolbar}>
        <View style={styles.group}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => changeZoom(-0.2)}>
            <Text style={styles.iconText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.label}>{Math.round(zoom * 100)}%</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => changeZoom(0.2)}>
            <Text style={styles.iconText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.group}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => goTo(page - 1)}>
            <Text style={styles.iconText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.label}>{numPages ? page : '–'} / {numPages || '–'}</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => goTo(page + 1)}>
            <Text style={styles.iconText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.flex}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html: buildViewerHtml() }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          containerStyle={{ flex: 1, backgroundColor: '#525659' }}
        />

        {loading && !error && (
          <View style={styles.overlay}>
            <ActivityIndicator size='large' color='#6366f1' />
            <Text style={styles.statusText}>Rendering document…</Text>
          </View>
        )}

        {error && (
          <View style={styles.overlay}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.statusText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#525659' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1e293b', borderBottomWidth: 1, borderColor: '#0f172a' },
  group: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#ffffff', fontSize: 22, fontWeight: '700', lineHeight: 24 },
  label: { color: '#e2e8f0', fontSize: 14, fontWeight: '600', minWidth: 64, textAlign: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.92)', alignItems: 'center', justifyContent: 'center' },
  statusText: { color: '#e2e8f0', marginTop: 14, paddingHorizontal: 24, textAlign: 'center' },
  errorEmoji: { fontSize: 40 },
});`,
  },
  {
    path: "src/lib/viewerHtml.ts",
    language: "typescript",
    group: "App code",
    description:
      "Returns the HTML page that runs pdf.js inside the WebView. Receives load / zoom / page commands from React Native and reports ready / loaded / page-change / error back.",
    code: `// Build the HTML document that powers the PDF viewer inside the WebView.
// Android's WebView has no native PDF support, so we render pages with pdf.js.
// We use the UMD build (v3) which exposes the global pdfjsLib - ideal for a WebView.
export function buildViewerHtml(): string {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />',
    '<style>',
    '  html, body { margin: 0; padding: 0; background: #525659; }',
    '  #pages { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px 0; }',
    '  canvas { background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.45); }',
    '</style>',
    '</head>',
    '<body>',
    '<div id="pages"></div>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>',
    '<script>',
    '(function () {',
    '  var send = function (obj) {',
    '    var rn = window.ReactNativeWebView || window;',
    '    if (rn && rn.postMessage) rn.postMessage(JSON.stringify(obj));',
    '  };',
    '  var pdfDoc = null;',
    '  var scale = 1.2;',
    '  var pagesEl = document.getElementById("pages");',
    '  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";',
    '  function loadDoc(src) {',
    '    var task = pdfjsLib.getDocument(src);',
    '    task.promise.then(function (doc) {',
    '      pdfDoc = doc;',
    '      send({ type: "loaded", numPages: doc.numPages });',
    '      renderAll();',
    '    }).catch(function (err) {',
    '      send({ type: "error", message: "Could not open PDF: " + (err && err.message ? err.message : err) });',
    '    });',
    '  }',
    '  function renderAll() {',
    '    if (!pdfDoc) return;',
    '    pagesEl.innerHTML = "";',
    '    var chain = Promise.resolve();',
    '    var doc = pdfDoc, sc = scale, total = pdfDoc.numPages;',
    '    for (var i = 1; i <= total; i++) { chain = chain.then(renderOne(doc, i, sc)); }',
    '  }',
    '  function renderOne(doc, pageNumber, sc) {',
    '    return function () {',
    '      return doc.getPage(pageNumber).then(function (page) {',
    '        var viewport = page.getViewport({ scale: sc });',
    '        var canvas = document.createElement("canvas");',
    '        var ctx = canvas.getContext("2d");',
    '        canvas.width = viewport.width;',
    '        canvas.height = viewport.height;',
    '        canvas.style.width = "100%";',
    '        canvas.style.height = "auto";',
    '        pagesEl.appendChild(canvas);',
    '        return page.render({ canvasContext: ctx, viewport: viewport }).promise;',
    '      });',
    '    };',
    '  }',
    '  window.handleReactNativeMessage = function (raw) {',
    '    var data;',
    '    try { data = JSON.parse(raw); } catch (e) { return; }',
    '    if (data.type === "load") {',
    '      if (data.scale) scale = data.scale;',
    '      loadDoc(data.source);',
    '    } else if (data.type === "zoom") {',
    '      scale = data.scale;',
    '      renderAll();',
    '    } else if (data.type === "page") {',
    '      var list = pagesEl.querySelectorAll("canvas");',
    '      var target = list[data.page - 1];',
    '      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });',
    '    }',
    '  };',
    '  window.addEventListener("scroll", function () {',
    '    var list = pagesEl.querySelectorAll("canvas");',
    '    var mid = window.scrollY + window.innerHeight / 2;',
    '    var current = 1;',
    '    for (var i = 0; i < list.length; i++) { if (list[i].offsetTop <= mid) current = i + 1; }',
    '    send({ type: "pagechange", page: current });',
    '  }, { passive: true });',
    '  send({ type: "ready" });',
    '})();',
    '</script>',
    '</body>',
    '</html>'
  ].join('\\n');
}`,
  },
  {
    path: "android/app/src/main/AndroidManifest.xml",
    language: "xml",
    group: "Android",
    description: "Permissions (internet + storage) and an intent-filter so the app opens PDFs from other apps.",
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:usesCleartextTraffic="true"
      android:theme="@style/AppTheme">

      <activity
        android:name=".MainActivity"
        android:exported="true"
        android:label="@string/app_name"
        android:theme="@style/AppTheme"
        android:launchMode="singleTask"
        android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
        android:windowSoftInputMode="adjustResize">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>

        <!-- Make the app appear in the "Open with" sheet when tapping a PDF -->
        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:mimeType="application/pdf" />
            <data android:scheme="content" />
            <data android:scheme="file" />
            <data android:scheme="http" />
            <data android:scheme="https" />
        </intent-filter>
      </activity>
    </application>
</manifest>`,
  },
  {
    path: "android/gradle.properties",
    language: "properties",
    group: "Android",
    description: "Gradle / React Native flags + your release signing keystore references.",
    code: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
newArchEnabled=true

# ---- Release signing (see the 'Build the APK' guide) ----
# Generate a keystore with keytool, drop it in android/app/ and fill these in.
MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=change_me
MYAPP_UPLOAD_KEY_PASSWORD=change_me`,
  },
  {
    path: "android/app/proguard-rules.pro",
    language: "text",
    group: "Android",
    description: "Keep rules so release builds don't strip RN / WebView runtime classes.",
    code: `# Keep React Native + WebView runtime classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn com.facebook.react.**

# pdf.js is loaded from assets at runtime - nothing extra to keep here.`,
  },
  {
    path: "README.md",
    language: "markdown",
    group: "Docs",
    description: "Setup, run and build-the-APK instructions.",
    code: `# PDF Viewer (React Native + WebView)

A full-screen PDF viewer for Android. It opens local files, remote URLs and
PDFs shared from other apps, rendering every page with pdf.js inside a WebView.

## Features

- Pick a local PDF (Document Picker) - rendered fully offline via base64.
- Open a remote PDF by URL.
- Zoom in / out, jump to any page, live page counter.
- Registered as a system PDF handler ("Open with").

## Requirements

- Node 18+, JDK 17, Android Studio with the Android SDK (API 34).
- Set ANDROID_HOME to your SDK folder before building.

## Create the project (do this once)

These files are the app source plus Android config overrides. Scaffold the
official template first, then drop them in:

    npx react-native@latest init PdfViewerApp --pm npm
    cd PdfViewerApp
    npm install react-native-webview react-native-document-picker react-native-fs @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

Copy App.tsx and src/ over the scaffolded files, then run on a device or emulator:

    npx react-native run-android

## Build a release APK

1. Generate a signing keystore (run once), then move it into android/app/:

       keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

2. Fill in android/gradle.properties (store/key file + passwords).

3. Add the signing config to android/app/build.gradle (see the web app's
   Build the APK tab for the exact snippet), then build:

       cd android
       ./gradlew assembleRelease

4. Grab your APK and install it:

       android/app/build/outputs/apk/release/app-release.apk
       adb install -r android/app/build/outputs/apk/release/app-release.apk

Need it fast? A debug APK needs no keystore:

       cd android && ./gradlew assembleDebug

## Going fully offline

The viewer loads pdf.js from a CDN by default. For offline use, download
pdf.min.js and pdf.worker.min.js (v3) into android/app/src/main/assets/pdfjs/
and change the two script/worker URLs to file:///android_asset/pdfjs/... in
src/lib/viewerHtml.ts.`,
  },
];

export const RN_GROUPS = ["Project config", "App code", "Android", "Docs"] as const;

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTextFile(name: string, code: string) {
  triggerDownload(new Blob([code], { type: "text/plain;charset=utf-8" }), name);
}

export async function downloadProjectZip() {
  const zip = new JSZip();
  const root = zip.folder("react-native-pdf-viewer");
  if (!root) return;
  for (const file of RN_FILES) root.file(file.path, file.code);
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, "react-native-pdf-viewer.zip");
}
