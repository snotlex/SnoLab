import type { LaboratorySession } from "../types/laboratorySessionTypes";

export interface LaboratorySessionGovernanceCheck {
  id: "standard" | "equipment" | "rawData" | "trace" | "custody" | "reviewer" | "separation";
  ready: boolean;
  code: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
}

export interface LaboratorySessionGovernanceResult {
  official: boolean;
  releaseEligibility: "diagnostic_only" | "official_review_ready";
  checks: LaboratorySessionGovernanceCheck[];
  blockingReasons: string[];
}

/**
 * Evaluates the official-laboratory prerequisites without mutating the session.
 * Legacy/local-first sessions remain usable for diagnostics, but cannot be
 * presented as officially approved results until every check is traceable.
 */
export function evaluateLaboratorySessionGovernance(session: LaboratorySession): LaboratorySessionGovernanceResult {
  const tests = session.tests;
  const samples = session.samples;
  const standardReady = tests.length > 0 && tests.every(test => {
    const value = test.standard.trim().toLowerCase();
    return value.length > 0 && !value.includes("configured by laboratory") && !value.includes("draft");
  });
  const equipmentReady = tests.length > 0 && tests.every(test => Boolean((test as any).equipmentIds?.length && (test as any).equipmentCalibrationSnapshot?.length));
  const rawDataReady = tests.length > 0 && tests.every(test => test.replicates.length > 0 && test.replicates.every(replicate => Object.keys(replicate.rawInputs || {}).length > 0));
  const traceReady = tests.length > 0 && tests.every(test => Boolean(test.result && test.auditEntryIds.length > 0));
  const custodyReady = samples.length > 0 && samples.every(sample => Boolean(sample.receivedAt && sample.custodyEvents?.length));
  const reviewerReady = Boolean(session.review?.reviewerIdentity?.userId);
  const separationReady = Boolean(
    session.createdByIdentity?.userId &&
    session.review?.reviewerIdentity?.userId &&
    session.createdByIdentity.userId !== session.review.reviewerIdentity.userId
  );

  const checks: LaboratorySessionGovernanceCheck[] = [
    { id: "standard", ready: standardReady, code: standardReady ? "STANDARD_READY" : "STANDARD_REGISTRY_SNAPSHOT_REQUIRED", labelAr: "معيار فعال وإصدار موثق", labelFr: "Norme active et versionnée", labelEn: "Active, versioned standard" },
    { id: "equipment", ready: equipmentReady, code: equipmentReady ? "EQUIPMENT_READY" : "EQUIPMENT_CALIBRATION_SNAPSHOT_REQUIRED", labelAr: "جهاز ومعايرة محفوظان كلقطة قياس", labelFr: "Appareil et étalonnage figés", labelEn: "Equipment calibration snapshot" },
    { id: "rawData", ready: rawDataReady, code: rawDataReady ? "RAW_DATA_COMPLETE" : "RAW_DATA_INCOMPLETE", labelAr: "بيانات خام كاملة", labelFr: "Données brutes complètes", labelEn: "Complete raw data" },
    { id: "trace", ready: traceReady, code: traceReady ? "TRACE_PRESENT" : "TRACE_REQUIRED", labelAr: "أثر حساب وتدقيق محفوظ", labelFr: "Trace de calcul et audit", labelEn: "Calculation and audit trace" },
    { id: "custody", ready: custodyReady, code: custodyReady ? "CUSTODY_COMPLETE" : "CUSTODY_INCOMPLETE", labelAr: "سلسلة حيازة العينة مكتملة", labelFr: "Chaîne de garde complète", labelEn: "Complete chain of custody" },
    { id: "reviewer", ready: reviewerReady, code: reviewerReady ? "REVIEWER_PRESENT" : "REVIEWER_IDENTITY_REQUIRED", labelAr: "هوية مراجع محفوظة", labelFr: "Identité du réviseur", labelEn: "Reviewer identity" },
    { id: "separation", ready: separationReady, code: "SEPARATION_OF_DUTIES_REQUIRED", labelAr: "فصل المنشئ عن المراجع", labelFr: "Séparation créateur/réviseur", labelEn: "Creator/reviewer separation" },
  ];

  const blockingReasons = checks.filter(check => !check.ready).map(check => check.code);
  const official = blockingReasons.length === 0 && !session.legacyDiagnosticOnly;
  return {
    official,
    releaseEligibility: official ? "official_review_ready" : "diagnostic_only",
    checks,
    blockingReasons,
  };
}
