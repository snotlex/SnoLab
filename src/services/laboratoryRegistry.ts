import type { LaboratoryEquipment, LaboratoryEquipmentStatus, LaboratoryStandardReference } from "../types/laboratoryDomain";

export interface RegisteredStandard extends LaboratoryStandardReference {
  id: string;
  title?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  acceptanceCriteriaConfigured: boolean;
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
  if (!standard || standard.status !== "Active" || !standard.acceptanceCriteriaConfigured) return false;
  const time = at.getTime();
  if (standard.effectiveFrom && time < new Date(standard.effectiveFrom).getTime()) return false;
  if (standard.effectiveTo && time > new Date(standard.effectiveTo).getTime()) return false;
  return true;
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
