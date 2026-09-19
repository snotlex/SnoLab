import type { EngineeringMaterial } from "../types";
import type { MaterialUpdateProposal } from "../types/laboratoryDomain";
import type { SieveAnalysisOutput } from "./aggregateSieveAnalysis";

const SIEVE_PROPERTY_MAP: Array<{ resultKey: keyof SieveAnalysisOutput; propertyKey: string; unit: string }> = [
  { resultKey: "finenessModulus", propertyKey: "finenessModulus", unit: "-" },
  { resultKey: "finesContentPercent", propertyKey: "finesContent", unit: "%" },
  { resultKey: "dMaxMm", propertyKey: "dMax", unit: "mm" },
  { resultKey: "dMinMm", propertyKey: "dMin", unit: "mm" }
];

export interface SpecificGravityProposalResult {
  absoluteDensityGPerCm3: number;
  absoluteDensityKgM3: number;
  ssdDensityGPerCm3: number;
  ssdDensityKgM3: number;
  waterAbsorptionPercent: number;
  validation: { valid: boolean };
}

export function createSieveMaterialUpdateProposals(params: {
  material: EngineeringMaterial;
  testRunId: string;
  result: SieveAnalysisOutput;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  if (!params.result.validation.valid || !params.result.massBalanceValid) return [];
  const proposedAt = params.proposedAt || new Date().toISOString();
  return SIEVE_PROPERTY_MAP.flatMap(({ resultKey, propertyKey, unit }) => {
    const value = params.result[resultKey];
    if (typeof value !== "number" || !Number.isFinite(value)) return [];
    const oldValue = (params.material as unknown as Record<string, unknown>)[propertyKey];
    return [{
      id: `MUP-${params.testRunId}-${propertyKey}`,
      materialId: params.material.id,
      testRunId: params.testRunId,
      propertyKey,
      oldValue: typeof oldValue === "number" || typeof oldValue === "string" ? oldValue : undefined,
      newValue: value,
      unit,
      status: "Pending" as const,
      proposedAt
    }];
  });
}

export function createSpecificGravityMaterialUpdateProposals(params: {
  material: EngineeringMaterial;
  testRunId: string;
  result: SpecificGravityProposalResult;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  if (!params.result.validation.valid) return [];
  const proposedAt = params.proposedAt || new Date().toISOString();
  const values: Array<{ propertyKey: string; newValue: number; unit: string }> = [
    { propertyKey: "specificGravity", newValue: params.result.absoluteDensityGPerCm3, unit: "-" },
    { propertyKey: "density", newValue: params.result.absoluteDensityKgM3, unit: "kg/m³" },
    { propertyKey: "ssdDensity", newValue: params.result.ssdDensityKgM3, unit: "kg/m³" },
    { propertyKey: "absorption", newValue: params.result.waterAbsorptionPercent, unit: "%" }
  ];
  return values.map(({ propertyKey, newValue, unit }) => {
    const oldValue = (params.material as unknown as Record<string, unknown>)[propertyKey];
    return {
      id: `MUP-${params.testRunId}-${propertyKey}`,
      materialId: params.material.id,
      testRunId: params.testRunId,
      propertyKey,
      oldValue: typeof oldValue === "number" || typeof oldValue === "string" ? oldValue : undefined,
      newValue,
      unit,
      status: "Pending" as const,
      proposedAt
    };
  });
}

export function acceptMaterialUpdateProposal(
  material: EngineeringMaterial,
  proposal: MaterialUpdateProposal,
  decidedBy: string,
  reason?: string,
  decidedAt = new Date().toISOString()
): { material: EngineeringMaterial; proposal: MaterialUpdateProposal } {
  if (proposal.status !== "Pending") throw new Error(`Only pending proposals can be accepted; current status is ${proposal.status}.`);
  if (proposal.materialId !== material.id) throw new Error("The proposal does not belong to the supplied material.");
  const updatedMaterial = {
    ...material,
    [proposal.propertyKey]: proposal.newValue,
    updatedDate: decidedAt,
    updatedAt: new Date(decidedAt).getTime()
  } as EngineeringMaterial;
  return {
    material: updatedMaterial,
    proposal: { ...proposal, status: "Accepted", decidedAt, decidedBy, reason }
  };
}

export function rejectMaterialUpdateProposal(
  proposal: MaterialUpdateProposal,
  decidedBy: string,
  reason: string,
  decidedAt = new Date().toISOString()
): MaterialUpdateProposal {
  if (proposal.status !== "Pending") throw new Error(`Only pending proposals can be rejected; current status is ${proposal.status}.`);
  if (!reason.trim()) throw new Error("A rejection reason is required.");
  return { ...proposal, status: "Rejected", decidedAt, decidedBy, reason };
}
