import type { CalibrationRecord, MaterialTestRecord, SampleRecord, TestDeviceRecord } from "../types/qualityDomain";

export type QualityAssetMetric = "valid" | "due" | "expired" | "unknown";

export interface QualityAssetSummary {
  samples: number;
  activeSamples: number;
  acceptedSamples: number;
  rejectedSamples: number;
  tests: number;
  approvedTests: number;
  pendingTests: number;
  rejectedTests: number;
  devices: number;
  validDevices: number;
  dueDevices: number;
  expiredDevices: number;
  unknownDevices: number;
  calibrations: number;
  calibrationPassRate: number;
  traceabilityRate: number;
}

export interface CalibrationAlert {
  device: TestDeviceRecord;
  state: QualityAssetMetric;
  dueAt?: string;
  daysToDue?: number;
}

export interface SampleTraceRow extends SampleRecord {
  linkedTestCount: number;
  traceabilityState: "complete" | "partial" | "missing";
}

const DAY = 24 * 60 * 60 * 1000;

export function calibrationState(device: TestDeviceRecord, now = new Date()): QualityAssetMetric {
  if (device.calibrationStatus === "expired") return "expired";
  if (device.calibrationStatus === "due") return "due";
  if (!device.calibrationDueAt) return device.calibrationStatus === "valid" ? "valid" : "unknown";
  const due = Date.parse(device.calibrationDueAt);
  if (Number.isNaN(due)) return "unknown";
  const days = Math.ceil((due - now.getTime()) / DAY);
  if (days < 0) return "expired";
  if (days <= 30) return "due";
  return "valid";
}

export function buildCalibrationAlerts(devices: TestDeviceRecord[], now = new Date()): CalibrationAlert[] {
  return devices.map(device => {
    const state = calibrationState(device, now);
    const due = device.calibrationDueAt ? Date.parse(device.calibrationDueAt) : NaN;
    return { device, state, dueAt: device.calibrationDueAt, daysToDue: Number.isNaN(due) ? undefined : Math.ceil((due - now.getTime()) / DAY) };
  }).sort((a, b) => {
    const priority: Record<QualityAssetMetric, number> = { expired: 0, due: 1, unknown: 2, valid: 3 };
    return priority[a.state] - priority[b.state] || (a.daysToDue ?? 9999) - (b.daysToDue ?? 9999);
  });
}

export function buildSampleTraceRows(samples: SampleRecord[], tests: MaterialTestRecord[]): SampleTraceRow[] {
  const testCount = new Map<string, number>();
  tests.forEach(test => testCount.set(test.sampleId, (testCount.get(test.sampleId) || 0) + 1));
  return samples.map(sample => {
    const linkedTestCount = testCount.get(sample.id) || 0;
    const complete = Boolean(sample.receivedAt && sample.chainOfCustody?.length && linkedTestCount > 0);
    const partial = Boolean(sample.receivedAt || sample.chainOfCustody?.length || linkedTestCount > 0);
    return { ...sample, linkedTestCount, traceabilityState: complete ? "complete" : partial ? "partial" : "missing" };
  });
}

export function summarizeQualityAssets(
  samples: SampleRecord[],
  tests: MaterialTestRecord[],
  devices: TestDeviceRecord[],
  calibrations: CalibrationRecord[],
  now = new Date()
): QualityAssetSummary {
  const alerts = buildCalibrationAlerts(devices, now);
  const approvedTests = tests.filter(test => test.approvalStatus === "approved").length;
  const pendingTests = tests.filter(test => test.approvalStatus === "draft" || test.approvalStatus === "submitted").length;
  const rejectedTests = tests.filter(test => test.approvalStatus === "rejected").length;
  const passedCalibrations = calibrations.filter(calibration => calibration.result === "pass").length;
  const traceRows = buildSampleTraceRows(samples, tests);
  return {
    samples: samples.length,
    activeSamples: samples.filter(sample => sample.status === "received" || sample.status === "in-testing").length,
    acceptedSamples: samples.filter(sample => sample.status === "accepted").length,
    rejectedSamples: samples.filter(sample => sample.status === "rejected").length,
    tests: tests.length,
    approvedTests,
    pendingTests,
    rejectedTests,
    devices: devices.length,
    validDevices: alerts.filter(alert => alert.state === "valid").length,
    dueDevices: alerts.filter(alert => alert.state === "due").length,
    expiredDevices: alerts.filter(alert => alert.state === "expired").length,
    unknownDevices: alerts.filter(alert => alert.state === "unknown").length,
    calibrations: calibrations.length,
    calibrationPassRate: calibrations.length ? Math.round((passedCalibrations / calibrations.length) * 100) : 0,
    traceabilityRate: samples.length ? Math.round((traceRows.filter(row => row.traceabilityState === "complete").length / samples.length) * 100) : 0
  };
}

export const LABORATORY_CAPABILITIES = [
  { id: "samples", ar: "إدارة العينات وسلسلة الحيازة", fr: "Échantillons et chaîne de garde", en: "Sample intake & chain of custody", standard: "ISO/IEC 17025 workflow" },
  { id: "aggregates", ar: "اختبارات الركام والتدرج", fr: "Granulats et granulométrie", en: "Aggregate & gradation testing", standard: "EN 933 / EN 1097" },
  { id: "cement", ar: "اختبارات الإسمنت والمواد الرابطة", fr: "Ciment et liants", en: "Cement & binder testing", standard: "EN 196" },
  { id: "water", ar: "اختبارات مياه الخلط", fr: "Eau de gâchage", en: "Mixing-water testing", standard: "EN 1008" },
  { id: "mix-design", ar: "تصميم الخلطات الخرسانية", fr: "Formulation du béton", en: "Concrete mix design", standard: "Dreux / ACI" },
  { id: "quality", ar: "ضبط الجودة وNCR/CAPA", fr: "Qualité et NCR/CAPA", en: "QA/QC & NCR/CAPA", standard: "Project release gates" }
] as const;
