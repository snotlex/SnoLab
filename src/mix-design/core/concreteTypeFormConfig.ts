import { getMixDesignContract } from "./mixDesignContracts";

export type Stage3SectionId = "requirements" | "type" | "materials" | "properties" | "water-cement" | "aggregates" | "admixtures" | "review";

export interface ConcreteTypeFormConfig {
  code: string;
  sections: Stage3SectionId[];
  requiredFields: string[];
  optionalFields: string[];
  specialMaterialRoles: string[];
}

const COMMON_FIELDS = new Set(["fck28", "dMax", "cementType", "cementClassStrength", "cementDensity", "moistureSand", "moistureGravel", "airContent", "slump", "aggregateType"]);

const ROLE_BY_FIELD: Array<[string, string]> = [
  ["fiber", "fiber"], ["lightweight", "lightweight aggregate"], ["heavyweight", "heavyweight aggregate"],
  ["gpc", "special binder and activator"], ["scm", "supplementary cementitious material"], ["dosage", "admixture"]
];

export function getConcreteTypeFormConfig(concreteType: unknown): ConcreteTypeFormConfig {
  const code = String(concreteType || "NSC").toUpperCase();
  const contract = getMixDesignContract(code);
  const requiredFields = (contract?.requiredInputs || []).map(String);
  const specialFields = requiredFields.filter(field => !COMMON_FIELDS.has(field));
  const specialMaterialRoles = ROLE_BY_FIELD.filter(([needle]) => specialFields.some(field => field.toLowerCase().includes(needle))).map(([, role]) => role);
  const sections: Stage3SectionId[] = ["requirements", "type", "materials", "properties", "water-cement", "aggregates", "admixtures", "review"];
  if (code === "NSC") return { code, sections: ["requirements", "type", "materials", "properties", "water-cement", "aggregates", "review"], requiredFields, optionalFields: ["admixtureDosage"], specialMaterialRoles };
  return { code, sections, requiredFields, optionalFields: ["trialMix", "manualOverride"], specialMaterialRoles };
}

export function isFieldRequiredForConcreteType(concreteType: unknown, field: string): boolean {
  return getConcreteTypeFormConfig(concreteType).requiredFields.includes(field);
}
