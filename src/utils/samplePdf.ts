import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const INK = rgb(0.06, 0.09, 0.16);
const SLATE = rgb(0.33, 0.4, 0.5);
const INDIGO = rgb(0.39, 0.4, 0.95);

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawParagraph(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number,
  lineHeight: number,
  color = SLATE,
): number {
  const lines = wrap(font, text, size, maxWidth);
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color });
    y -= lineHeight;
  }
  return y;
}

/** Builds a small, attractive multi-page sample PDF entirely in the browser. */
export async function buildSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const W = 595;
  const H = 842;

  // ---- Page 1: cover ----
  const p1 = doc.addPage([W, H]);
  p1.drawRectangle({ x: 0, y: H - 170, width: W, height: 170, color: INDIGO });
  p1.drawText("PDF", { x: 56, y: H - 120, size: 64, font: bold, color: rgb(1, 1, 1) });
  p1.drawText("VIEWER", { x: 56, y: H - 158, size: 28, font: bold, color: rgb(1, 1, 1) });
  let y = H - 240;
  p1.drawText("React Native + WebView sample document", { x: 56, y, size: 20, font: bold, color: INK });
  y -= 36;
  y = drawParagraph(
    p1, regular,
    "This file was generated on the fly to demonstrate the viewer. In the Android app you can open local files from storage, fetch a remote URL, or receive a PDF shared from another application.",
    56, y, 13, W - 112, 20,
  );
  y -= 24;
  p1.drawRectangle({ x: 56, y: y - 120, width: W - 112, height: 120, color: rgb(0.95, 0.96, 0.99) });
  p1.drawText("Highlights", { x: 76, y: y - 30, size: 13, font: bold, color: INK });
  drawParagraph(p1, regular, "Pinch / button zoom, page jump and live page counter  -  Offline rendering of local files via base64  -  Registered as a system PDF handler", 76, y - 54, 12, W - 152, 18);

  // ---- Page 2: features ----
  const p2 = doc.addPage([W, H]);
  p2.drawText("How it renders", { x: 56, y: H - 80, size: 24, font: bold, color: INK });
  p2.drawRectangle({ x: 56, y: H - 90, width: 120, height: 4, color: INDIGO });
  let y2 = H - 130;
  const blocks: [string, string][] = [
    ["1. Android WebView", "The native WebView control cannot render PDFs on its own, so it hosts an HTML page instead."],
    ["2. pdf.js engine", "Mozilla pdf.js (UMD build) draws each page onto a canvas, giving pixel-accurate rendering."],
    ["3. Two-way messages", "React Native pushes load / zoom / page commands; the page reports progress back via postMessage."],
    ["4. Local or remote", "Local files are read as base64 (fully offline); URLs are streamed straight into the viewer."],
  ];
  for (const [title, body] of blocks) {
    p2.drawText(title, { x: 56, y: y2, size: 14, font: bold, color: INK });
    y2 = drawParagraph(p2, regular, body, 56, y2 - 22, 12, W - 112, 18);
    y2 -= 26;
  }

  // ---- Page 3: text body ----
  const p3 = doc.addPage([W, H]);
  p3.drawText("Lorem ipsum", { x: 56, y: H - 80, size: 24, font: bold, color: INK });
  p3.drawRectangle({ x: 56, y: H - 90, width: 120, height: 4, color: INDIGO });
  const lorem =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  drawParagraph(p3, regular, lorem, 56, H - 120, 12.5, W - 112, 20);
  drawParagraph(p3, regular, lorem, 56, H - 360, 12.5, W - 112, 20);

  return doc.save();
}
