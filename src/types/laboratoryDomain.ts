export type LaboratoryResultStatus =
  | "Draft"
  | "Incomplete"
  | "Invalid"
  | "Calculated"
  | "Under Review"
  | "Passed"
  | "Failed"
  | "Warning"
  | "Approved"
  | "Rejected"
  | "Superseded";

export type LaboratorySampleStatus =
  | "Received"
  | "Under Preparation"
  | "Ready for Test"
  | "Testing"
  | "Completed"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Archived";

export type LaboratoryEquipmentStatus =
  | "Active"
  | "Calibration Due"
  | "Expired"
  | "Out of Service"
  | "Under Maintenance";

export type ValidationLevel = "data" | "physical" | "mathematical" | "engineering";
export type ValidationSeverity = "error" | "warning" | "info";

export interface LaboratoryStandardReference {
  organization: "ASTM" | "EN" | "ISO" | "AASHTO" | "NF" | "Internal" | "Other";
  code: string;
  version?: string;
  status: "Active" | "Superseded" | "Withdrawn" | "Draft";
  source?: string;
}

export interface LaboratorySample {
  id: string;
  sampleId: string;
  internalId: string;
  materialId: string;
  materialCategory: string;
  projectId?: string;
  source?: string;
  supplier?: string;
  location?: string;
  receivedAt?: string;
  sampledAt?: string;
  operator?: string;
  batchLotNumber?: string;
  quantity?: { value: number; unit: string };
  physicalCondition?: string;
  storageCondition?: string;
  status: LaboratorySampleStatus;
  notes?: string;
  attachmentIds?: string[];
  qrCode?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LaboratoryEquipment {
  id: string;
  equipmentId: string;
  name: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  calibrationDate?: string;
  nextCalibrationDate?: string;
  accuracy?: string;
  range?: string;
  status: LaboratoryEquipmentStatus;
  location?: string;
  responsiblePerson?: string;
  certificateAttachmentId?: string;
  notes?: string;
}

export interface TestInputDefinition {
  key: string;
  label: string;
  unit?: string;
  required: boolean;
  numeric?: boolean;
  min?: number;
  max?: number;
  dimension?: string;
}

export interface CalculationTraceStep {
  stepNumber: number;
  label: string;
  formula: string;
  substitution: string;
  result: number | string;
  unit?: string;
  inputs: Record<string, number | string>;
}

export interface ValidationIssue {
  level: ValidationLevel;
  severity: ValidationSeverity;
  code: string;
  field?: string;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface LaboratoryTestDefinition<TData extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  names: { ar: string; fr: string; en: string };
  category: string;
  applicableMaterialTypes: string[];
  description: string;
  standard?: LaboratoryStandardReference;
  requiredEquipmentIds?: string[];
  inputs: TestInputDefinition[];
  resultUnit?: string;
  revision: number;
  active: boolean;
  validateEngineering?: (data: TData) => ValidationIssue[];
  calculate: (data: TData) => {
    result: number | string;
    unit?: string;
    trace: CalculationTraceStep[];
  };
}

export interface LaboratoryTestRun<TData extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  projectId?: string;
  materialId: string;
  sampleId: string;
  testDefinitionId: string;
  testDefinitionRevision: number;
  standard?: LaboratoryStandardReference;
  equipmentIds?: string[];
  operator: string;
  reviewer?: string;
  rawData: TData;
  calculationTrace: CalculationTraceStep[];
  result?: { value: number | string; unit?: string };
  validation: ValidationReport;
  status: LaboratoryResultStatus;
  approval?: ApprovalRecord;
  createdAt: string;
  updatedAt: string;
  supersedesRunId?: string;
}

export interface ApprovalRecord {
  approvedBy: string;
  approvedAt: string;
  decision: "Approved" | "Rejected";
  reason?: string;
  auditEntryId: string;
}

export interface MaterialUpdateProposal {
  id: string;
  materialId: string;
  testRunId: string;
  propertyKey: string;
  oldValue?: number | string;
  newValue: number | string;
  unit?: string;
  status: "Pending" | "Accepted" | "Rejected";
  proposedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
}

export interface LaboratoryAuditEntry {
  id: string;
  entityType: "sample" | "test" | "result" | "material_update" | "equipment" | "standard";
  entityId: string;
  action: string;
  actor: string;
  timestamp: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  testDefinitionRevision?: number;
  standardVersion?: string;
}
