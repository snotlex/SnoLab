import { EngineeringMaterial } from "../types";

export type LabCategory = 
  | "aggregates"
  | "cement"
  | "water"
  | "admixtures"
  | "additives"
  | "fibers"
  | "fresh_hardened";

export type TestStatus = "PASS" | "WARNING" | "FAIL";

export type TestApprovalStatus = "Draft" | "Pending Review" | "Validated" | "Rejected";

export interface ComplianceDetail {
  parameter: string;
  measured: number | string;
  unit?: string;
  limit: string;
  status: TestStatus;
  note: string;
}

export interface SieveStepResult {
  sieve: number; // sieve aperture in mm (e.g. 5, 4, 2, 1, 0.5, 0.25, 0.125, 0.063)
  retainedWeight: number; // Mass retained in grams
  percentRetained: number; // % retained on sieve
  cumulativePercentRetained: number; // Cumulative % retained
  percentPassing: number; // Cumulative % passing
}

export interface GranulometricCurveData {
  sieves: SieveStepResult[];
  finenessModulus?: number;
  dMax?: number;
  dMin?: number;
  finesContent?: number; // % passing 0.063 mm
  sandRatio?: number; // % between 0 and 2 mm
  uniformityCoefficientCu?: number; // D60 / D10
  curvatureCoefficientCc?: number; // (D30)^2 / (D10 * D60)
  classification?: string;
}

export type MaterialSourceType = "system_demo" | "user_created" | "imported" | "lab_result";

export interface MaterialPropertySource {
  propertyName: string; // e.g. "absorption", "moisture", "density", "finenessModulus", "gradationData", "sandEquivalent", "losAngelesAbrasion", "microDeval", "foisonnement", etc.
  propertyLabelAr: string;
  propertyLabelFr?: string;
  propertyLabelEn?: string;
  value: any;
  unit?: string;
  testId: string;
  testType: string;
  testTitle: string;
  sampleId?: string;
  testDate: string;
  operator: string;
  projectName?: string;
  standard?: string;
  approvalStatus: TestApprovalStatus;
  isValidated: boolean;
  isDemo?: boolean;
  sourceType?: MaterialSourceType;
  sourceLabel?: string;
  score?: number;
  notes?: string;
  timestamp: string;
}

export interface MaterialPropertyHistoryEntry {
  id: string;
  propertyName: string;
  propertyLabelAr: string;
  oldValue?: any;
  newValue: any;
  unit?: string;
  testId: string;
  testType: string;
  testTitle: string;
  sampleId?: string;
  testDate: string;
  operator: string;
  projectName?: string;
  standard?: string;
  approvalStatus: TestApprovalStatus;
  isDemo?: boolean;
  timestamp: string;
}

export interface MaterialTestRecord {
  id: string; // e.g. "TEST-AGG-2026-001"
  testType: string; // e.g. "AGG_SIEVE", "AGG_SAND_EQUIVALENT", "CEM_SETTING_TIME", etc.
  testTitleAr: string;
  testTitleFr: string;
  testTitleEn: string;
  category: LabCategory;
  materialId: string;
  materialName: string;
  materialCategory: string;
  sampleId: string;
  sampleDescription?: string;
  projectId?: string;
  projectName?: string;
  operator: string;
  laboratoryName: string;
  date: string;
  standard: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  status: TestStatus; // Compliance verdict ("PASS" | "WARNING" | "FAIL")
  approvalStatus?: TestApprovalStatus; // Workflow Status ("Draft" | "Pending Review" | "Validated" | "Rejected")
  isDemo?: boolean; // True if this record is a demo/sample test created by the system
  sourceType?: MaterialSourceType; // "system_demo" | "user_created" | "imported" | "lab_result"
  sourceLabel?: string; // Human-readable label (e.g. "Demo Data", "User Test")
  score: number; // 0-100%
  interpretation: string;
  complianceDetails: ComplianceDetail[];
  chartData?: any;
  granulometricCurve?: GranulometricCurveData;
  notes?: string;
  syncedToMaterial?: boolean;
  syncedProperties?: Record<string, any>;
  historyTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialTestHistoryEntry {
  testId: string;
  testType: string;
  date: string;
  sampleId: string;
  propertyName: string;
  oldValue?: number | string;
  newValue: number | string;
  unit: string;
  operator: string;
  status: TestStatus;
}

