/**
 * SnoLab Core Material and Property Domain Types
 * Unified Architecture: MATERIAL -> MATERIAL PROPERTIES -> LABORATORY TESTS -> TEST RESULTS -> VALIDATION -> MIX DESIGN
 */

export type PropertyDataType = 
  | "number"
  | "integer"
  | "decimal"
  | "percentage"
  | "boolean"
  | "text"
  | "date"
  | "enum"
  | "range"
  | "multi_value"
  | "granulometry";

export type PropertyCategoryGroup = 
  | "physical" 
  | "granulometric" 
  | "mechanical" 
  | "durability" 
  | "chemical" 
  | "hydration" 
  | "composition" 
  | "rheology"
  | "geotechnical";

export type PropertyRequirementLevel = "required" | "optional" | "conditional";

export type PropertySourceProvenance = 
  | "REFERENCE" 
  | "TYPICAL" 
  | "LABORATORY" 
  | "USER_ENTERED" 
  | "IMPORTED" 
  | "CALCULATED";

export type PropertyValidationStatus = 
  | "VALID" 
  | "WARNING"
  | "INCOMPLETE" 
  | "INVALID" 
  | "NOT_APPLICABLE" 
  | "PENDING_REVIEW" 
  | "APPROVED";

export type MaterialCategoryUnified = 
  | "CEMENT"
  | "AGGREGATES"
  | "SAND"
  | "GRAVEL"
  | "ADMIXTURES"
  | "MINERAL_ADDITIONS"
  | "FIBERS"
  | "WATER"
  | "SOILS"
  | "BITUMINOUS"
  | "MASONRY"
  | "OTHER";

export type MaterialSourceType = "SYSTEM" | "MY_MATERIAL";

export type MaterialLifecycleStatus = "ACTIVE" | "ARCHIVED" | "PENDING_REVIEW" | "SUSPENDED" | "DRAFT";

export interface PropertyOption {
  value: string;
  labelAr: string;
  labelEn: string;
  labelFr?: string;
}

export interface EngineeringValidationRule {
  min?: number;
  max?: number;
  warningMin?: number;
  warningMax?: number;
  pattern?: string;
  step?: number;
  customValidator?: (val: any, material?: any) => {
    isValid: boolean;
    isWarning?: boolean;
    messageAr: string;
    messageEn: string;
  };
}

export interface PropertyDefinition {
  id: string; // Unique, permanent property ID e.g. "PROP-SPECIFIC-GRAVITY"
  code: string; // Shorthand/symbol e.g. "ρ_s" or "SG"
  name: string; // English canonical name
  nameAr: string; // Arabic localized name
  nameFr: string; // French localized name
  dataType: PropertyDataType;
  canonicalUnit: string; // Canonical measurement unit e.g. "kg/m³", "%", "mm", "-"
  applicableCategories: MaterialCategoryUnified[];
  categoryGroup: PropertyCategoryGroup;
  defaultRequirementLevel: PropertyRequirementLevel;
  associatedStandard?: string; // e.g. "EN 1097-6", "ASTM C128", "NA 442"
  associatedLabTestId?: string; // e.g. "TEST-AGGR-SG-ABS"
  validation?: EngineeringValidationRule;
  options?: PropertyOption[]; // for enum properties
  descriptionAr?: string;
  descriptionEn?: string;
}

export interface MaterialPropertyValue {
  materialId: string;
  propertyId: string;
  value: any; // Can be number (including 0!), string, boolean, array
  unit: string;
  source: PropertySourceProvenance;
  status: PropertyValidationStatus;
  updatedAt: string;
  isExplicitNull?: boolean; // true if deliberately marked empty/null
  isNotApplicable?: boolean; // true if designated N/A
  testReferenceId?: string; // linked laboratory test run ID
  notes?: string;
  history?: Array<{
    value: any;
    unit: string;
    source: PropertySourceProvenance;
    updatedAt: string;
    author?: string;
    notes?: string;
  }>;
}

export interface GranulometrySieveEntry {
  sieve: number; // sieve size in mm (e.g. 0.063, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 31.5)
  massRetained?: number; // raw mass in grams
  percentRetained?: number; // %
  cumulativeRetained?: number; // %
  passing: number; // % passing (0 to 100)
}

export interface MaterialCoreRecord {
  id: string; // Unique permanent ID (e.g. "MAT-C-001", "MAT-S-002", "MAT-U-xxxx")
  name: string; // Primary Arabic Name
  englishName?: string;
  frenchName?: string;
  category: MaterialCategoryUnified;
  type: string; // Specific subtype e.g. "Portland Cement CEM I 42.5N" or "Crushed Sand 0/4"
  source: string; // Quarry / Manufacturer / Source
  region?: string; // Geographic region / Wilaya
  sourceType: MaterialSourceType; // SYSTEM vs MY_MATERIAL
  status: MaterialLifecycleStatus;
  createdAt: string;
  updatedAt: string;
  dataSource: PropertySourceProvenance;
  validationStatus: PropertyValidationStatus;
  properties: Record<string, MaterialPropertyValue>; // Key is propertyId e.g. "PROP-SPECIFIC-GRAVITY"
  granulometry?: GranulometrySieveEntry[];
  laboratoryTestIds?: string[];
  extraProperties?: Record<string, any>; // Preserves any unmapped/custom properties from Excel without data loss
  notes?: string;
  price?: number;
  rating?: number;
  image?: string;
  approvalSignoff?: {
    approvedBy?: string;
    approvedAt?: string;
    role?: string;
    certificateNumber?: string;
  };
}

export interface MaterialTypeSchema {
  typeKey: string;
  category: MaterialCategoryUnified;
  labelAr: string;
  labelEn: string;
  labelFr: string;
  requiredPropertyIds: string[];
  optionalPropertyIds: string[];
  conditionalPropertyIds: Array<{
    propertyId: string;
    conditionAr: string;
    conditionEn: string;
    predicate: (material: MaterialCoreRecord, context?: any) => boolean;
  }>;
  applicableTestIds: string[];
}

export interface LabTestMeasurement {
  paramKey: string;
  labelAr: string;
  labelEn: string;
  unit: string;
  value: number | string;
}

export interface LabTestRunRecord {
  id: string; // Unique test run ID e.g. "TEST-RUN-20260904-001"
  materialId: string;
  testDefinitionId: string;
  testName: string;
  standard: string;
  testDate: string;
  operator: string;
  laboratoryName: string;
  certificateNumber?: string;
  measurements: Record<string, any>; // Raw input values
  calculatedResults: Record<string, { value: any; unit: string; outputPropertyId?: string }>;
  status: "DRAFT" | "COMPLETED" | "VERIFIED" | "REJECTED";
  validationNotes?: string[];
  createdAt: string;
}

export interface ExcelImportErrorDetail {
  sheet: string;
  row: number;
  column: string;
  materialName?: string;
  materialId?: string;
  propertyId?: string;
  propertyName?: string;
  rawInputValue: any;
  error: string;
  suggestedFix: string;
  severity: "ERROR" | "WARNING";
}

export interface DuplicateResolutionOption {
  materialId: string;
  materialName: string;
  action: "UPDATE_EXISTING" | "CREATE_NEW_ID" | "SKIP" | "MERGE";
  newAssignedId?: string;
}

export interface ImportSummaryReport {
  fileName: string;
  fileSize: number;
  totalRowsProcessed: number;
  importedMaterialsCount: number;
  updatedMaterialsCount: number;
  skippedMaterialsCount: number;
  importedPropertiesCount: number;
  warningsCount: number;
  errorsCount: number;
  errors: ExcelImportErrorDetail[];
  importedMaterialIds: string[];
  timestamp: string;
}
