import type { LaboratoryEquipment, LaboratoryEquipmentStatus, LaboratoryStandardReference } from "../types/laboratoryDomain";

export interface RegisteredStandard extends LaboratoryStandardReference {
  id: string;
  title?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  acceptanceRule?: string;
  units?: string[];
  coveredTestIds?: string[];
  acceptanceCriteriaConfigured: boolean;
}

export interface StandardPreflightResult {
  ready: boolean;
  errors: string[];
}

export interface RegisteredEquipment extends LaboratoryEquipment {
  calibrationCertificateId?: string;
}

export function standardKey(standard: Pick<LaboratoryStandardReference, "organization" | "code" | "version">): string {
  return `${standard.organization}:${standard.code}:${standard.version || "unversioned"}`;
}

export function registerStandard(standard: RegisteredStandard, registry: RegisteredStandard[] = []): RegisteredStandard[] {
  const key = standardKey(standard);
  return [...registry.filter(item => standardKey(item) !== key), { ...standard }];
}

export function findActiveStandard(registry: RegisteredStandard[], organization: LaboratoryStandardReference["organization"], code: string, version?: string): RegisteredStandard | undefined {
  return registry.find(item => item.organization === organization && item.code === code && (version === undefined || item.version === version) && item.status === "Active");
}

export function canUseStandard(standard: RegisteredStandard | undefined, at = new Date()): boolean {
  return preflightStandard(standard, at).ready;
}

export function preflightStandard(standard: (LaboratoryStandardReference & Partial<RegisteredStandard>) | undefined, at = new Date()): StandardPreflightResult {
  const errors: string[] = [];
  if (!standard) return { ready: false, errors: ["STANDARD_MISSING"] };
  if (!standard.version || standard.version.trim() === "" || standard.version === "configured by laboratory") errors.push("STANDARD_VERSION_UNKNOWN");
  if (standard.status !== "Active") errors.push(`STANDARD_STATUS_${standard.status.toUpperCase().replace(/\s+/g, "_")}`);
  if ("acceptanceCriteriaConfigured" in standard && standard.acceptanceCriteriaConfigured !== true) errors.push("ACCEPTANCE_CRITERIA_NOT_CONFIGURED");
  if ("acceptanceRule" in standard && !standard.acceptanceRule) errors.push("ACCEPTANCE_RULE_MISSING");
  const time = at.getTime();
  if (standard.effectiveFrom && time < new Date(standard.effectiveFrom).getTime()) errors.push("STANDARD_NOT_YET_EFFECTIVE");
  if (standard.effectiveTo && time > new Date(standard.effectiveTo).getTime()) errors.push("STANDARD_EXPIRED");
  return { ready: errors.length === 0, errors };
}

export function standardPreflightIssueMessages(preflight: StandardPreflightResult): string[] {
  return preflight.errors.map(code => `Official test blocked by standards preflight: ${code}.`);
}

export function deriveEquipmentStatus(equipment: Pick<LaboratoryEquipment, "status" | "nextCalibrationDate">, at = new Date()): LaboratoryEquipmentStatus {
  if (equipment.status === "Out of Service" || equipment.status === "Under Maintenance") return equipment.status;
  if (!equipment.nextCalibrationDate) return "Calibration Due";
  return new Date(equipment.nextCalibrationDate).getTime() < at.getTime() ? "Expired" : equipment.status === "Expired" ? "Active" : equipment.status;
}

export function registerEquipment(equipment: RegisteredEquipment, registry: RegisteredEquipment[] = [], at = new Date()): RegisteredEquipment[] {
  const next = { ...equipment, status: deriveEquipmentStatus(equipment, at) };
  return [...registry.filter(item => item.id !== equipment.id && item.equipmentId !== equipment.equipmentId), next];
}

export function equipmentReadyForTest(equipment: RegisteredEquipment | undefined, at = new Date()): boolean {
  return !!equipment && deriveEquipmentStatus(equipment, at) === "Active";
}

export function allRequiredEquipmentReady(equipmentIds: string[] = [], registry: RegisteredEquipment[] = [], at = new Date()): boolean {
  return equipmentIds.every(id => equipmentReadyForTest(registry.find(item => item.id === id || item.equipmentId === id), at));
}
