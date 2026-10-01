import reshaper from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";
import type { jsPDF } from "jspdf";
import { PDF_FONT_FAMILY } from "./pdfFonts";

const bidi = bidiFactory();
const ARABIC_RE = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;

export function containsArabic(value: unknown): boolean {
  return typeof value === "string" && ARABIC_RE.test(value);
}

/**
 * jsPDF does not perform Arabic shaping or bidi reordering by itself. The
 * embedded Noto font contains the glyphs, while this function supplies the
 * presentation forms and visual order expected by jsPDF's text renderer.
 */
export function preparePdfText(value: unknown, direction: "rtl" | "ltr" = "ltr"): string {
  const text = String(value ?? "");
  if (!containsArabic(text)) return text;
  const shaped = reshaper.ArabicShaper.convertArabic(text);
  if (direction !== "rtl") return shaped;
  const embedding = bidi.getEmbeddingLevels(shaped, "rtl");
  const characters = [...shaped];
  const flips = bidi.getReorderSegments(shaped, embedding);
  flips.forEach(([start, end]) => {
    const section = characters.slice(start, end + 1).reverse();
    section.forEach((character, offset) => { characters[start + offset] = character; });
  });
  return characters.join("");
}

export function setPdfFont(doc: jsPDF, style: "normal" | "bold" = "normal"): void {
  doc.setFont(PDF_FONT_FAMILY, style);
}

export function drawPdfText(
  doc: jsPDF,
  value: unknown,
  x: number,
  y: number,
  options: { direction?: "rtl" | "ltr"; align?: "left" | "center" | "right"; maxWidth?: number } = {},
): void {
  const direction = options.direction || "ltr";
  const text = preparePdfText(value, direction);
  const align = options.align || (direction === "rtl" ? "right" : "left");
  doc.text(text, x, y, { align, ...(options.maxWidth ? { maxWidth: options.maxWidth } : {}) });
}

export function preparePdfTableRows(rows: string[][], direction: "rtl" | "ltr" = "ltr"): string[][] {
  return rows.map((row) => row.map((cell) => preparePdfText(cell, direction)));
}
