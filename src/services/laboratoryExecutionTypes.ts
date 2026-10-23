import type { ComplianceDetail, GranulometricCurveData, TestStatus } from "../types/laboratoryTypes";

/** Stable result contract consumed by the legacy laboratory wizard and session flow. */
export interface TestExecutionResult {
  results: Record<string, any>;
  status: TestStatus;
  score: number;
  interpretation: string;
  complianceDetails: ComplianceDetail[];
  chartData?: any;
  granulometricCurve?: GranulometricCurveData;
  syncedProperties: Record<string, any>;
}
