import * as XLSX from "xlsx";
import { ParsedMaterialDraft, SourceTracking, MaterialDraftProperty } from "./types";
import { TableDetector } from "./TableDetector";
import { PropertyMapper } from "./PropertyMapper";
import { UnitNormalizer } from "./UnitNormalizer";
import { MaterialDetector } from "./MaterialDetector";
import { Validator } from "./Validator";

export class ExcelParser {
  /**
   * Filters out instruction, readme, and guide sheets.
   */
  public static shouldIgnoreSheet(sheetName: string): boolean {
    const norm = sheetName.trim().toLowerCase();
    return /readme|instruction|guide|help|note|about|info|تعليمات|ارشادات|دليل|ملاحظات/i.test(norm);
  }

  /**
   * Parses an Excel or CSV file buffer and returns parsed material drafts.
   */
  public static async parseWorkbook(
    fileBuffer: ArrayBuffer | Uint8Array,
    fileName: string
  ): Promise<{
    drafts: ParsedMaterialDraft[];
    sheetsProcessed: string[];
    unmappedColumns: Array<{ source: string; header: string; sampleValues: any[] }>;
  }> {
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const drafts: ParsedMaterialDraft[] = [];
    const sheetsProcessed: string[] = [];
    const unmappedColumnsMap = new Map<string, { source: string; header: string; sampleValues: any[] }>();

    for (const sheetName of workbook.SheetNames) {
      if (ExcelParser.shouldIgnoreSheet(sheetName)) {
        continue;
      }

      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      sheetsProcessed.push(sheetName);

      // Convert worksheet to 2D array of raw values
      const grid = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][];
      if (!grid || grid.length === 0) continue;

      // Detect tables within the grid
      const tables = TableDetector.detectTables(grid);
      if (tables.length === 0) continue;

      for (let tIdx = 0; tIdx < tables.length; tIdx++) {
        const table = tables[tIdx];
        const sampleRowObjects = table.rows.slice(0, 10).map(r => r.data);

        // Detect category for this sheet/table
        const detectedCategoryResult = MaterialDetector.detectCategory(sheetName, table.headers, sampleRowObjects);

        // Map headers using central PropertyMapper
        const mappings = PropertyMapper.mapHeaders(table.headers, sampleRowObjects, detectedCategoryResult.category);

        // Record unmapped headers for UI reporting
        table.headers.forEach(h => {
          const m = mappings[h];
          if (!m || m.isNeedsReview || m.canonicalKey === "ignore") {
            const key = `${sheetName}::${h}`;
            if (!unmappedColumnsMap.has(key)) {
              unmappedColumnsMap.set(key, {
                source: sheetName,
                header: h,
                sampleValues: sampleRowObjects.map(r => r[h]).filter(v => v !== undefined && v !== null).slice(0, 5)
              });
            }
          }
        });

        // Convert each row to a ParsedMaterialDraft
        for (let rIdx = 0; rIdx < table.rows.length; rIdx++) {
          const rowWrapper = table.rows[rIdx];
          const rawRow = rowWrapper.data;
          const origRowIndex = rowWrapper.originalRowIndex;

          const properties: Record<string, MaterialDraftProperty> = {};
          const extraProperties: Record<string, any> = {};

          let rawName: string = "";
          let rawEnglishName: string = "";
          let rawCategory: string = detectedCategoryResult.category;
          let rawOrigin: string = "";

          // Populate mapped properties and preserve unmapped in extraProperties (ZERO data loss)
          for (const header of table.headers) {
            const val = rawRow[header];
            const match = mappings[header];

            // Source tracking metadata
            const sourceTracking: SourceTracking = {
              fileName,
              fileType: fileName.endsWith(".csv") ? "csv" : "xlsx",
              sheet: sheetName,
              tableIndex: tIdx,
              row: origRowIndex + 1,
              column: header,
              rawHeader: header,
              extractionMethod: "EXCEL",
              confidence: (match?.confidenceScore || 50) / 100
            };

            if (val === null || val === undefined || String(val).trim() === "") {
              continue;
            }

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
              // Preserve unmapped column value with full fidelity
              extraProperties[header] = val;
            }
          }

          // If name was not explicitly in a "Name" column, try first non-numeric text column
          if (!rawName) {
            for (const h of table.headers) {
              const v = rawRow[h];
              if (typeof v === "string" && v.trim().length > 1 && isNaN(Number(v))) {
                rawName = v.trim();
                break;
              }
            }
          }

          // Fallback placeholder name if row is completely missing identifier
          if (!rawName) {
            rawName = `مادة مستوردة (${sheetName} - صف ${origRowIndex + 1})`;
          }

          // Refine category if row has specific text
          const rowCategoryDetection = MaterialDetector.detectCategory(
            `${rawName} ${rawEnglishName}`,
            undefined,
            [rawRow]
          );
          const finalCategory = rawCategory !== "أخرى" ? rawCategory : rowCategoryDetection.category;
          const finalMaterialType = MaterialDetector.getMaterialTypeForCategory(finalCategory);

          // Generate stable draft ID
          const draftId = `USR-MAT-${finalCategory.substring(0, 3)}-${Date.now().toString(36).substr(-4)}-${origRowIndex + 1}`.toUpperCase();

          // Validate draft
          const validation = Validator.validateDraft(rawName, finalCategory, properties);

          let status: "Complete" | "Incomplete" | "Needs Review" | "Invalid" = "Complete";
          if (validation.errors.length > 0) {
            status = "Invalid";
          } else if (detectedCategoryResult.needsReview || Object.values(properties).some(p => p.confidence === "NEEDS_REVIEW")) {
            status = "Needs Review";
          } else if (!validation.isComplete) {
            status = "Incomplete";
          }

          const draftSourceTracking: SourceTracking = {
            fileName,
            fileType: fileName.endsWith(".csv") ? "csv" : "xlsx",
            sheet: sheetName,
            tableIndex: tIdx,
            row: origRowIndex + 1,
            column: "ALL",
            extractionMethod: "EXCEL",
            confidence: 0.95
          };

          drafts.push({
            id: draftId,
            name: rawName,
            englishName: rawEnglishName || undefined,
            category: finalCategory,
            materialType: finalMaterialType,
            categoryConfidence: detectedCategoryResult.confidence,
            categoryNeedsReview: detectedCategoryResult.needsReview,
            source: rawOrigin || "مستورد من Excel",
            sourceTracking: draftSourceTracking,
            properties,
            extraProperties,
            validation,
            status,
            selectedForImport: status !== "Invalid"
          });
        }
      }
    }

    return {
      drafts,
      sheetsProcessed,
      unmappedColumns: Array.from(unmappedColumnsMap.values())
    };
  }
}
