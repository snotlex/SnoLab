import * as pdfjsLib from "pdfjs-dist";
import { ParsedMaterialDraft, SourceTracking, MaterialDraftProperty } from "./types";
import { TableDetector } from "./TableDetector";
import { PropertyMapper } from "./PropertyMapper";
import { UnitNormalizer } from "./UnitNormalizer";
import { MaterialDetector } from "./MaterialDetector";
import { Validator } from "./Validator";
import { OCRVisionParser } from "./OCRVisionParser";

// Initialize worker source safely for browser environments
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
}

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PDFParser {
  /**
   * Main entry point to parse a PDF file.
   * Extracts tables, structured property lines, or delegates scanned pages to OCR.
   */
  public static async parsePdf(
    fileBuffer: ArrayBuffer | Uint8Array,
    fileName: string,
    onProgress?: (msg: string, progressPercent: number) => void
  ): Promise<{
    drafts: ParsedMaterialDraft[];
    pagesProcessed: number;
    hasOcrItems: boolean;
    unmappedColumns: Array<{ source: string; header: string; sampleValues: any[] }>;
  }> {
    if (onProgress) onProgress("جاري تحميل وثيقة PDF واستخراج النصوص والجداول...", 15);

    let doc: pdfjsLib.PDFDocumentProxy;
    try {
      doc = await pdfjsLib.getDocument({
        data: fileBuffer,
        useSystemFonts: true
      } as any).promise;
    } catch (err: any) {
      // Fallback: If pdfjs fails to load (e.g. encrypted or worker issue), try OCR / Vision directly
      if (onProgress) onProgress("تعذر استخراج النص العادي مباشرة، جاري تفعيل الرؤية الحاسوبية (OCR)...", 30);
      const base64 = PDFParser.arrayBufferToBase64(fileBuffer);
      const ocrResult = await OCRVisionParser.extractMaterialsFromPdfOrText({
        fileName,
        pdfBase64: base64
      });
      return {
        drafts: ocrResult.drafts,
        pagesProcessed: 1,
        hasOcrItems: true,
        unmappedColumns: []
      };
    }

    const numPages = doc.numPages;
    const drafts: ParsedMaterialDraft[] = [];
    const unmappedColumnsMap = new Map<string, { source: string; header: string; sampleValues: any[] }>();
    let totalTextItemsCount = 0;
    let fullExtractedText = "";

    // 1. Process each page to extract structured text items with (x, y) coordinates
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        onProgress(`جاري فحص الصفحة ${pageNum} من ${numPages}...`, Math.min(80, 20 + Math.round((pageNum / numPages) * 50)));
      }

      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items: PdfTextItem[] = [];

      for (const item of textContent.items) {
        if ("str" in item && typeof item.str === "string") {
          const str = item.str.trim();
          if (str !== "") {
            const transform = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
            items.push({
              str,
              x: transform[4],
              y: transform[5],
              width: item.width || 0,
              height: item.height || 0
            });
            fullExtractedText += `${str} `;
          }
        }
      }

      totalTextItemsCount += items.length;

      // Group items into rows by Y-coordinate proximity
      const rowThreshold = 4.0; // px
      items.sort((a, b) => b.y - a.y); // top to bottom

      const gridRows: Array<PdfTextItem[]> = [];
      let currentRow: PdfTextItem[] = [];
      let currentY: number | null = null;

      for (const it of items) {
        if (currentY === null || Math.abs(it.y - currentY) <= rowThreshold) {
          currentRow.push(it);
          currentY = it.y;
        } else {
          // Sort items in this row from left to right by X
          currentRow.sort((a, b) => a.x - b.x);
          gridRows.push(currentRow);
          currentRow = [it];
          currentY = it.y;
        }
      }
      if (currentRow.length > 0) {
        currentRow.sort((a, b) => a.x - b.x);
        gridRows.push(currentRow);
      }

      // Convert gridRows to 2D string array
      const textGrid: string[][] = gridRows.map(row => row.map(cell => cell.str));

      // Attempt to detect tables in this page
      if (textGrid.length >= 2) {
        const detectedTables = TableDetector.detectTables(textGrid);

        for (let tIdx = 0; tIdx < detectedTables.length; tIdx++) {
          const table = detectedTables[tIdx];
          if (table.rows.length === 0 || table.headers.length < 2) continue;

          const sampleRows = table.rows.slice(0, 10).map(r => r.data);
          const pageCategoryResult = MaterialDetector.detectCategory(`صفحة ${pageNum} من ${fileName}`, table.headers, sampleRows);
          const mappings = PropertyMapper.mapHeaders(table.headers, sampleRows, pageCategoryResult.category);

          // Track unmapped
          table.headers.forEach(h => {
            const m = mappings[h];
            if (!m || m.isNeedsReview || m.canonicalKey === "ignore") {
              const k = `Page_${pageNum}::${h}`;
              if (!unmappedColumnsMap.has(k)) {
                unmappedColumnsMap.set(k, {
                  source: `صفحة ${pageNum}`,
                  header: h,
                  sampleValues: sampleRows.map(r => r[h]).filter(v => v !== undefined && v !== null).slice(0, 5)
                });
              }
            }
          });

          for (let rIdx = 0; rIdx < table.rows.length; rIdx++) {
            const rowWrapper = table.rows[rIdx];
            const rawRow = rowWrapper.data;
            const origRowIdx = rowWrapper.originalRowIndex;

            let rawName: string = "";
            let rawEnglishName: string = "";
            let rawCategory = pageCategoryResult.category;
            let rawOrigin: string = "";
            const properties: Record<string, MaterialDraftProperty> = {};
            const extraProperties: Record<string, any> = {};

            for (const header of table.headers) {
              const val = rawRow[header];
              const match = mappings[header];

              const sourceTracking: SourceTracking = {
                fileName,
                fileType: "pdf",
                page: pageNum,
                tableIndex: tIdx,
                row: origRowIdx + 1,
                column: header,
                rawHeader: header,
                extractionMethod: "PDF_TABLE",
                confidence: (match?.confidenceScore || 60) / 100
              };

              if (val === null || val === undefined || String(val).trim() === "") continue;

              if (match && match.canonicalKey !== "ignore") {
                const normResult = UnitNormalizer.normalizePropertyValue(match.canonicalKey, val, match.expectedUnit);

                if (match.canonicalKey === "name") {
                  rawName = String(normResult.normalizedValue || val).trim();
                } else if (match.canonicalKey === "englishName") {
                  rawEnglishName = String(normResult.normalizedValue || val).trim();
                } else if (match.canonicalKey === "category") {
                  rawCategory = String(normResult.normalizedValue || val).trim();
                } else if (match.canonicalKey === "provenance") {
                  rawOrigin = String(normResult.normalizedValue || val).trim();
                }

                properties[match.canonicalKey] = {
                  canonicalId: match.canonicalPropertyId,
                  key: match.canonicalKey,
                  nameAr: match.propertyLabelAr,
                  nameEn: match.propertyLabelEn,
                  nameFr: match.propertyLabelFr,
                  value: normResult.normalizedValue,
                  unit: normResult.normalizedUnit,
                  originalValue: normResult.sourceValue,
                  originalUnit: normResult.sourceUnit,
                  normalizedValue: normResult.normalizedValue,
                  normalizedUnit: normResult.normalizedUnit,
                  confidence: match.confidence,
                  confidenceScore: match.confidenceScore,
                  sourceTracking,
                  status: "VALID"
                };
              } else {
                extraProperties[header] = val;
              }
            }

            if (!rawName) {
              for (const h of table.headers) {
                const v = rawRow[h];
                if (typeof v === "string" && v.trim().length > 1 && isNaN(Number(v))) {
                  rawName = v.trim();
                  break;
                }
              }
            }

            if (!rawName) {
              rawName = `مادة من PDF (صفحة ${pageNum} - صف ${origRowIdx + 1})`;
            }

            const catDetection = MaterialDetector.detectCategory(`${rawName} ${rawEnglishName}`, undefined, [rawRow]);
            const finalCategory = rawCategory !== "أخرى" ? rawCategory : catDetection.category;
            const finalMaterialType = MaterialDetector.getMaterialTypeForCategory(finalCategory);

            const draftId = `USR-PDF-${finalCategory.substring(0, 3)}-${Date.now().toString(36).substr(-4)}-P${pageNum}R${origRowIdx + 1}`.toUpperCase();
            const validation = Validator.validateDraft(rawName, finalCategory, properties);

            let status: "Complete" | "Incomplete" | "Needs Review" | "Invalid" = "Complete";
            if (validation.errors.length > 0) {
              status = "Invalid";
            } else if (pageCategoryResult.needsReview || Object.values(properties).some(p => p.confidence === "NEEDS_REVIEW")) {
              status = "Needs Review";
            } else if (!validation.isComplete) {
              status = "Incomplete";
            }

            drafts.push({
              id: draftId,
              name: rawName,
              englishName: rawEnglishName || undefined,
              category: finalCategory,
              materialType: finalMaterialType,
              categoryConfidence: pageCategoryResult.confidence,
              categoryNeedsReview: pageCategoryResult.needsReview,
              source: rawOrigin || `مستند PDF: ${fileName} (ص ${pageNum})`,
              sourceTracking: {
                fileName,
                fileType: "pdf",
                page: pageNum,
                tableIndex: tIdx,
                row: origRowIdx + 1,
                column: "ALL",
                extractionMethod: "PDF_TABLE",
                confidence: 0.9
              },
              properties,
              extraProperties,
              validation,
              status,
              selectedForImport: status !== "Invalid"
            });
          }
        }
      }
    }

    // 2. SCANNED / EMPTY PDF DETECTION:
    // If the PDF had virtually no text elements (scanned images) OR table extraction yielded 0 materials,
    // invoke OCR / Vision through the backend service
    let hasOcrItems = false;
    if (drafts.length === 0 || totalTextItemsCount < 20) {
      if (onProgress) onProgress("المستند يحتوي على صفحات ممسوحة ضوئياً (Scanned) أو نصوص غير قابلة للقراءة المباشرة، جاري تشغيل تقنية الرؤية بالذكاء الاصطناعي (AI Vision / OCR)...", 75);

      const base64 = PDFParser.arrayBufferToBase64(fileBuffer);
      const ocrResult = await OCRVisionParser.extractMaterialsFromPdfOrText({
        fileName,
        pdfBase64: base64,
        extractedText: fullExtractedText.length > 50 ? fullExtractedText : undefined
      });

      if (ocrResult.success && ocrResult.drafts.length > 0) {
        hasOcrItems = true;
        drafts.push(...ocrResult.drafts);
      }
    }

    if (onProgress) onProgress("اكتمل تحليل مستند PDF بنجاح!", 100);

    return {
      drafts,
      pagesProcessed: numPages,
      hasOcrItems,
      unmappedColumns: Array.from(unmappedColumnsMap.values())
    };
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
