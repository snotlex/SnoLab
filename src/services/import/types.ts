import { EngineeringMaterial } from "../../types";
import { MaterialCoreRecord, GranulometrySieveEntry } from "../../types/materialCoreTypes";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "NEEDS_REVIEW";

export type ExtractionMethod = "EXCEL" | "PDF_TABLE" | "PDF_STRUCTURED_TEXT" | "OCR" | "JSON";

export type DuplicateResolutionStrategy = "SKIP" | "IMPORT_NEW" | "REPLACE" | "CREATE_VERSION";

export interface SourceTracking {
  fileName: string;
  fileType: "xlsx" | "xls" | "csv" | "json" | "pdf";
  sheet?: string;
  page?: number;
  tableIndex?: number;
  row: number;
  column: string | number;
  rawHeader?: string;
  extractionMethod: ExtractionMethod;
  confidence: number; // 0 to 1
}

export interface NormalizedValue {
  sourceValue: any;
  sourceUnit?: string;
  normalizedValue: number | string | boolean | null;
  normalizedUnit?: string;
  conversionFactor?: number;
  conversionNotes?: string;
}

export interface PropertyMappingMatch {
  canonicalPropertyId: string;
  canonicalKey: string; // e.g. "density", "specificGravity", "absorption", "finenessModulus"
  propertyLabelAr: string;
  propertyLabelEn: string;
  propertyLabelFr: string;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-100
  matchedVia: "EXACT_SYNONYM" | "FUZZY_ALIAS" | "UNIT_HEURISTIC" | "VALUE_RANGE" | "MANUAL";
  explanation: string;
  isNeedsReview: boolean;
  expectedUnit?: string;
}

export interface MaterialDraftProperty {
  canonicalId: string;
  key: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  value: any;
  unit?: string;
  originalValue: any;
  originalUnit?: string;
  normalizedValue: any;
  normalizedUnit?: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  sourceTracking: SourceTracking;
  status: "VALID" | "WARNING" | "INVALID" | "INCOMPLETE";
  warningMessage?: string;
}

export interface MaterialDraftValidation {
  isComplete: boolean;
  isEligibleForDreuxGorisse: boolean;
  missingRequiredForCategory: string[];
  missingRequiredForDreux: string[];
  errors: string[];
  warnings: string[];
}

export interface ParsedMaterialDraft {
  id: string;
  name: string;
  englishName?: string;
  category: string; // "إسمنت" | "رمال" | "حصى" | "إضافات كيميائية" | "إضافات معدنية" | "ألياف" | "ماء" | "أخرى"
  materialType: string;
  categoryConfidence: ConfidenceLevel;
  categoryNeedsReview: boolean;
  source: string;
  region?: string;
  sourceTracking: SourceTracking;
  properties: Record<string, MaterialDraftProperty>;
  extraProperties: Record<string, any>;
  granulometry?: GranulometrySieveEntry[];
  validation: MaterialDraftValidation;
  status: "Complete" | "Incomplete" | "Needs Review" | "Invalid";
  selectedForImport: boolean;
}

export interface DuplicateMatch {
  importedDraftId: string;
  importedName: string;
  existingId: string;
  existingName: string;
  matchReason: "EXACT_ID" | "EXACT_NAME" | "NORMALIZED_NAME" | "KEY_PROPERTIES";
  existingSourceType: "SYSTEM" | "USER";
  suggestedResolution: DuplicateResolutionStrategy;
  chosenResolution: DuplicateResolutionStrategy;
}

export interface UnmappedHeaderEntry {
  source: string;
  header: string;
  sampleValues: any[];
  userChosenMapping?: string;
}

export interface ImportPipelineReport {
  fileName: string;
  fileType: "EXCEL" | "PDF" | "CSV" | "JSON";
  totalDetected: number;
  completeCount: number;
  incompleteCount: number;
  needsReviewCount: number;
  invalidCount: number;
  duplicateCount: number;
  drafts: ParsedMaterialDraft[];
  duplicates: DuplicateMatch[];
  unmappedHeaders: UnmappedHeaderEntry[];
  sheetsOrPages: string[];
  processingTimeMs: number;
  hasOcrItems: boolean;
}
