export type SampleStatus = "received" | "in-testing" | "accepted" | "rejected" | "archived";
export type TestApprovalStatus = "draft" | "submitted" | "approved" | "rejected";
export type DeviceCalibrationStatus = "valid" | "due" | "expired" | "unknown";
export type NcrStatus = "open" | "containment" | "corrective-action" | "verification" | "closed";

export interface SampleRecord {
  id: string;
  materialId?: string;
  batchId?: string;
  projectId?: string;
  sampleNumber: string;
  receivedAt: string;
  sampledAt?: string;
  sampledBy?: string;
  laboratory?: string;
  quantity?: number;
  unit?: string;
  status: SampleStatus;
  chainOfCustody?: string[];
}

export interface MaterialTestRecord {
  id: string;
  sampleId: string;
  testType: string;
  reportNumber?: string;
  standard: string;
  standardVersion?: string;
  testedAt: string;
  laboratory?: string;
  deviceId?: string;
  calibrationStatus?: DeviceCalibrationStatus;
  results: Record<string, number | string | boolean | null>;
  acceptance?: { passed: boolean; limit?: string; reviewer?: string; reviewedAt?: string };
  approvalStatus: TestApprovalStatus;
}

export interface TestDeviceRecord {
  id: string;
  name: string;
  serialNumber?: string;
  deviceType: string;
  calibrationStatus: DeviceCalibrationStatus;
  calibrationDueAt?: string;
  calibrationCertificate?: string;
}

export interface CalibrationRecord {
  id: string;
  deviceId: string;
  certificateNumber: string;
  calibratedAt: string;
  dueAt: string;
  laboratory?: string;
  result: "pass" | "fail";
  documentReference?: string;
}

export interface NcrRecord {
  id: string;
  projectId?: string;
  source: "material" | "trial-mix" | "production" | "laboratory" | "document";
  severity: "minor" | "major" | "critical";
  title: string;
  description: string;
  containmentAction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  owner?: string;
  openedAt: string;
  dueAt?: string;
  closedAt?: string;
  status: NcrStatus;
  verificationEvidence?: string;
}
