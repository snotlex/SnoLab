import type { EngineeringMaterial } from "../types";
import type { MaterialTestRecord, TestStatus } from "./laboratoryTypes";
import type { LaboratoryIdentity } from "./laboratoryDomain";

export type LaboratoryRequestStatus =
  | "DRAFT"
  | "READY"
  | "IN_PROGRESS"
  | "PARTIALLY_COMPLETED"
  | "COMPLETED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CLOSED"
  | "CANCELLED";

export type LaboratorySessionTestStatus =
  | "DRAFT"
  | "READY"
  | "RUNNING"
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "BLOCKED"
  | "CANCELLED";

export type LaboratoryReplicateStatus = "EMPTY" | "IN_PROGRESS" | "VALID" | "INVALID" | "EXCLUDED";

export interface LaboratoryCustodyEvent {
  id: string;
  action: "COLLECTED" | "HANDED_OVER" | "RECEIVED" | "STORED" | "TRANSFERRED" | "SEALED" | "OPENED";
  actor: string;
  timestamp: string;
  location?: string;
  condition?: string;
  notes?: string;
  attachmentIds?: string[];
}

export interface LaboratorySessionSample {
  id: string;
  sampleNumber: string;
  materialId: string;
  materialName: string;
  materialCategory: string;
  sampleCode: string;
  description?: string;
  source?: string;
  collectedAt?: string;
  receivedAt?: string;
  collectedBy?: string;
  handedOverBy?: string;
  receivedBy?: string;
  transportCondition?: string;
  quantity?: { value: number; unit: string };
  conditionOnReceipt?: string;
  storageCondition?: string;
  attachmentIds?: string[];
  custodyEvents?: LaboratoryCustodyEvent[];
  notes?: string;
}

export interface LaboratoryReplicate {
  id: string;
  sequence: number;
  specimenCode?: string;
  sampleId: string;
  status: LaboratoryReplicateStatus;
  rawInputs: Record<string, unknown>;
  readings?: Array<{ id: string; label: string; value?: number | string; unit?: string; takenAt?: string }>;
  numericResult?: number;
  result?: Record<string, unknown>;
  notes?: string;
  excludedReason?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface LaboratorySessionTestItem {
  id: string;
  sequence: number;
  testType: string;
  testTitleAr: string;
  testTitleFr: string;
  testTitleEn: string;
  standard: string;
  materialId: string;
  sampleId: string;
  operator?: string;
  status: LaboratorySessionTestStatus;
  sourceRecordId?: string;
  requiredReplicates?: number;
  requiresWaiting?: boolean;
  hasChart?: boolean;
  startedAt?: string;
  completedAt?: string;
  completionPercent: number;
  replicates: LaboratoryReplicate[];
  result?: MaterialTestRecord["results"];
  resultSummary?: {
    individualValues: number[];
    validCount: number;
    excludedCount: number;
    mean?: number;
    standardDeviation?: number;
    range?: number;
    highVariance?: boolean;
  };
  sourceProperties?: string[];
  notes?: string;
  auditEntryIds: string[];
}

export interface LaboratorySessionAuditEntry {
  id: string;
  action: string;
  entityType: "session" | "sample" | "test" | "replicate" | "approval" | "sync";
  entityId: string;
  actor: string;
  timestamp: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
}

export interface LaboratorySessionReview {
  reviewer: string;
  reviewerIdentity?: LaboratoryIdentity;
  reviewedAt: string;
  decision: "APPROVED" | "REJECTED" | "PARTIAL";
  notes?: string;
}

export interface LaboratorySessionGovernanceConfig {
  standardId?: string;
  standardSnapshot?: {
    id: string;
    organization: string;
    code: string;
    version?: string;
    status: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    acceptanceRule?: string;
  };
  equipmentIds?: string[];
  equipmentCalibrationSnapshots?: Array<{
    id: string;
    equipmentId: string;
    serialNumber?: string;
    calibrationDate?: string;
    nextCalibrationDate?: string;
    status: string;
    location?: string;
  }>;
}

export interface LaboratorySessionSyncPlanItem {
  sessionId: string;
  requestNumber: string;
  testItemId: string;
  testType: string;
  materialId: string;
  propertyKey: string;
  value: number | string | boolean;
  measuredAt?: string;
}

export interface LaboratorySession {
  id: string;
  requestNumber: string;
  projectId?: string;
  projectName?: string;
  client?: string;
  site?: string;
  supplier?: string;
  requestOwner?: string;
  createdByIdentity?: LaboratoryIdentity;
  requestedAt: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  reason?: string;
  notes?: string;
  status: LaboratoryRequestStatus;
  governance?: LaboratorySessionGovernanceConfig;
  parentSampleIds: string[];
  samples: LaboratorySessionSample[];
  tests: LaboratorySessionTestItem[];
  review?: LaboratorySessionReview;
  auditLog: LaboratorySessionAuditEntry[];
  legacyRecordId?: string;
  legacyDiagnosticOnly?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LaboratorySessionCreateInput {
  id?: string;
  requestNumber?: string;
  projectId?: string;
  projectName?: string;
  client?: string;
  site?: string;
  supplier?: string;
  requestOwner?: string;
  createdByIdentity?: LaboratoryIdentity;
  requestedAt?: string;
  priority?: LaboratorySession["priority"];
  reason?: string;
  notes?: string;
  governance?: LaboratorySessionGovernanceConfig;
}

export interface LaboratorySessionValidationIssue {
  code: string;
  level: "error" | "warning";
  entityType: "session" | "sample" | "test" | "replicate";
  entityId?: string;
  message: string;
}

export interface LaboratorySessionValidationResult {
  valid: boolean;
  issues: LaboratorySessionValidationIssue[];
  readyTestCount: number;
  errorTestCount: number;
  inProgressTestCount: number;
}

export interface LaboratorySessionSummary {
  totalTests: number;
  completedTests: number;
  passedTests: number;
  warningTests: number;
  failedTests: number;
  blockedTests: number;
  readyTests: number;
  runningTests: number;
  incompleteTests: number;
  completionPercent: number;
  status: LaboratoryRequestStatus;
}

export type SessionRunResult = {
  testId: string;
  status: LaboratorySessionTestStatus;
  record?: MaterialTestRecord;
  error?: string;
};

export type SessionTestRunner = (
  item: LaboratorySessionTestItem,
  replicate: LaboratoryReplicate
) => Promise<SessionRunResult> | SessionRunResult;

export type SessionMaterialResolver = (materialId: string) => EngineeringMaterial | undefined;

export const TEST_STATUS_TO_SESSION_STATUS: Record<TestStatus, LaboratorySessionTestStatus> = {
  DRAFT: "DRAFT",
  READY: "READY",
  PASS: "PASS",
  WARNING: "WARNING",
  FAIL: "FAIL",
  BLOCKED: "BLOCKED"
};
