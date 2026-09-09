import * as XLSX from "xlsx";
import { 
  MaterialCoreRecord, 
  MaterialPropertyValue, 
  PropertyDefinition, 
  MaterialCategoryUnified, 
  GranulometrySieveEntry 
} from "../types/materialCoreTypes";
import { PropertyService } from "./PropertyService";
import { MaterialService } from "./MaterialService";
import { ValidationService } from "./ValidationService";
import { ImportManager } from "./import/ImportManager";
import { ImportPipelineReport, ParsedMaterialDraft, DuplicateMatch } from "./import/types";
import { EngineeringMaterial } from "../types";

export interface ImportErrorRecord {
  sheet: string;
  row: number;
  column: string;
  materialName: string;
  materialId?: string;
  propertyId?: string;
  propertyName?: string;
  error: string;
  suggestedFix: string;
  severity: "ERROR" | "WARNING" | "INFO";
}

export type DuplicateResolutionStrategy = "UPDATE_EXISTING" | "CREATE_NEW_ID" | "SKIP" | "MERGE";

export interface DuplicateDetectionResult {
  importedMaterialId: string;
  importedName: string;
  matchType: "EXACT_ID" | "SEMANTIC_MATCH" | "NONE";
  existingMaterial?: MaterialCoreRecord;
  suggestedResolution: DuplicateResolutionStrategy;
  resolvedResolution: DuplicateResolutionStrategy;
}

export interface ImportAnalysisReport {
  fileName: string;
  fileType?: "EXCEL" | "PDF" | "CSV" | "JSON";
  detectedFormat: "STANDARD_SNOLAB_WORKBOOK" | "FLAT_MASTER_TABLE" | "CUSTOM_LAB_TABLE" | "PDF_DOCUMENT";
  totalSheetsFound: string[];
  totalMaterialsDetected: number;
  materialsToImport: MaterialCoreRecord[];
  duplicates: DuplicateDetectionResult[];
  errors: ImportErrorRecord[];
  warnings: ImportErrorRecord[];
  unmappedColumns: Array<{ sheet: string; column: string }>;
  canProceed: boolean;
  pipelineReport?: ImportPipelineReport;
}

/**
 * SnoLab Multi-Step Engineering Import Engine
 * Implements full Excel, CSV, JSON, and PDF document parsing with Zero Data Loss.
 */
export class ImportService {
  /**
   * Universal file analyzer for Excel (.xlsx, .xls), CSV, JSON, and PDF documents.
   */
  public static async analyzeFile(
    file: File | { name: string; arrayBuffer: () => Promise<ArrayBuffer> },
    existingMaterials: EngineeringMaterial[],
    onProgress?: (message: string, percent: number) => void
  ): Promise<ImportAnalysisReport> {
    const pipelineReport = await ImportManager.analyzeFile(file, existingMaterials, onProgress);

    // Convert ParsedMaterialDrafts into MaterialCoreRecords for UI compatibility
    const materialsToImport: MaterialCoreRecord[] = pipelineReport.drafts.map(draft => {
      const coreProps: Record<string, MaterialPropertyValue> = {};
      Object.entries(draft.properties).forEach(([key, p]) => {
        coreProps[key] = {
          materialId: draft.id,
          propertyId: key,
          value: p.normalizedValue !== undefined ? p.normalizedValue : p.value,
          unit: p.normalizedUnit || p.unit || "",
          source: "IMPORTED",
          status: "VALID",
          updatedAt: new Date().toISOString()
        };
      });

      return {
        id: draft.id,
        name: draft.name,
        englishName: draft.englishName || "",
        category: (draft.category as MaterialCategoryUnified) || "OTHER",
        type: draft.category || "General",
        source: draft.sourceTracking.sheet || "Imported",
        sourceType: "MY_MATERIAL",
        status: "ACTIVE",
        dataSource: "IMPORTED",
        validationStatus: draft.validation.errors.length > 0 ? "INCOMPLETE" : "VALID",
        properties: coreProps,
        extraProperties: {
          ...draft.extraProperties,
          _sourceTracking: draft.sourceTracking,
          _validation: draft.validation,
          _categoryConfidence: draft.categoryConfidence,
          _categoryNeedsReview: draft.categoryNeedsReview,
          _draftStatus: draft.status
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const duplicates: DuplicateDetectionResult[] = pipelineReport.duplicates.map(d => ({
      importedMaterialId: d.importedDraftId,
      importedName: d.importedName,
      matchType: d.matchReason === "EXACT_ID" ? "EXACT_ID" : "SEMANTIC_MATCH",
      suggestedResolution: d.suggestedResolution === "IMPORT_NEW" ? "CREATE_NEW_ID" : "UPDATE_EXISTING",
      resolvedResolution: d.chosenResolution === "IMPORT_NEW" ? "CREATE_NEW_ID" : "UPDATE_EXISTING"
    }));

    const errors: ImportErrorRecord[] = [];
    const warnings: ImportErrorRecord[] = [];

    pipelineReport.drafts.forEach(d => {
      d.validation.errors.forEach(err => {
        errors.push({
          sheet: d.sourceTracking.sheet || `صفحة ${d.sourceTracking.page || 1}`,
          row: d.sourceTracking.row || 1,
          column: String(d.sourceTracking.column || "NAME"),
          materialName: d.name,
          materialId: d.id,
          error: err,
          suggestedFix: "يرجى تعديل القيمة أو إدخالها يدوياً قبل الاعتماد.",
          severity: "ERROR"
        });
      });

      d.validation.warnings.forEach(warn => {
        warnings.push({
          sheet: d.sourceTracking.sheet || `صفحة ${d.sourceTracking.page || 1}`,
          row: d.sourceTracking.row || 1,
          column: String(d.sourceTracking.column || "PROP"),
          materialName: d.name,
          materialId: d.id,
          error: warn,
          suggestedFix: "تحقق من النطاق الهندسي المعتاد للمادة.",
          severity: "WARNING"
        });
      });
    });

    return {
      fileName: pipelineReport.fileName,
      fileType: pipelineReport.fileType,
      detectedFormat: pipelineReport.fileType === "PDF" ? "PDF_DOCUMENT" : "CUSTOM_LAB_TABLE",
      totalSheetsFound: pipelineReport.sheetsOrPages,
      totalMaterialsDetected: pipelineReport.totalDetected,
      materialsToImport,
      duplicates,
      errors,
      warnings,
      unmappedColumns: pipelineReport.unmappedHeaders.map(u => ({ sheet: u.source, column: u.header })),
      canProceed: errors.length === 0 || materialsToImport.some(m => m.properties && Object.keys(m.properties).length > 0),
      pipelineReport
    };
  }

  /**
   * Backward-compatible analyzeWorkbook method.
   */
  public static async analyzeWorkbook(
    fileBuffer: ArrayBuffer | Uint8Array,
    fileName = "uploaded.xlsx"
  ): Promise<ImportAnalysisReport> {
    const existingMaterials = MaterialService.getAllMaterials().map(m => MaterialService.toEngineeringMaterial(m));
    const fakeFile = {
      name: fileName,
      arrayBuffer: async () => fileBuffer instanceof ArrayBuffer ? fileBuffer : fileBuffer.buffer
    };
    return ImportService.analyzeFile(fakeFile, existingMaterials);
  }

  /**
   * Executes the final import into "My Materials" according to selected duplicate strategies.
   */
  public static executeImport(
    materialsToImport: MaterialCoreRecord[],
    duplicateStrategies: Record<string, DuplicateResolutionStrategy>
  ): { importedCount: number; updatedCount: number; skippedCount: number } {
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const mat of materialsToImport) {
      const strategy = duplicateStrategies[mat.id] || "UPDATE_EXISTING";

      if (strategy === "SKIP") {
        skippedCount++;
        continue;
      }

      const existing = MaterialService.getMaterialById(mat.id);

      if (existing) {
        if (existing.sourceType === "SYSTEM" || strategy === "CREATE_NEW_ID") {
          // Cannot overwrite system materials, generate new ID
          const newId = MaterialService.generateMaterialId(mat.category, "MAT-USR");
          const newMat: MaterialCoreRecord = {
            ...mat,
            id: newId,
            name: `${mat.name} (نسخة جديدة)`,
            sourceType: "MY_MATERIAL"
          };
          MaterialService.saveMyMaterial(newMat);
          importedCount++;
        } else if (strategy === "UPDATE_EXISTING") {
          // Replace properties and update
          MaterialService.saveMyMaterial({
            ...mat,
            sourceType: "MY_MATERIAL"
          });
          updatedCount++;
        } else if (strategy === "MERGE") {
          // Merge properties without losing existing
          const mergedProps = { ...existing.properties };
          for (const [pId, pVal] of Object.entries(mat.properties)) {
            if (PropertyService.hasMeaningfulValue(pVal.value)) {
              mergedProps[pId] = pVal;
            }
          }
          MaterialService.saveMyMaterial({
            ...existing,
            properties: mergedProps,
            extraProperties: { ...existing.extraProperties, ...mat.extraProperties },
            granulometry: mat.granulometry || existing.granulometry,
            updatedAt: new Date().toISOString()
          });
          updatedCount++;
        }
      } else {
        // Brand new material
        MaterialService.saveMyMaterial(mat);
        importedCount++;
      }
    }

    return { importedCount, updatedCount, skippedCount };
  }
}
