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

export interface BulkDensityProposalResult {
  looseDensityKgM3: number;
  compactedDensityKgM3: number;
  compactionIndex: number;
  validation: { valid: boolean };
}

export interface MoistureProposalResult {
  moisturePercent: number;
  validation: { valid: boolean };
}

export interface SandEquivalentProposalResult {
  sandEquivalentPercent: number;
  validation: { valid: boolean };
}

export interface SandBulkingProposalResult {
  sandBulkingCoefficient: number;
  maxExpansionPercent: number;
  validation: { valid: boolean };
}

export interface LosAngelesProposalResult {
  losAngelesAbrasionPercent: number;
  validation: { valid: boolean };
}

export interface MicroDevalProposalResult {
  microDevalPercent: number;
  validation: { valid: boolean };
}

export interface FlakinessProposalResult {
  flakinessIndexPercent: number;
  validation: { valid: boolean };
}

function toPendingProposals(
  material: EngineeringMaterial,
  testRunId: string,
  values: Array<{ propertyKey: string; newValue: number; unit: string }>,
  proposedAt: string
): MaterialUpdateProposal[] {
  return values.map(({ propertyKey, newValue, unit }) => {
    const oldValue = (material as unknown as Record<string, unknown>)[propertyKey];
    return {
      id: `MUP-${testRunId}-${propertyKey}`,
      materialId: material.id,
      testRunId,
      propertyKey,
      oldValue: typeof oldValue === "number" || typeof oldValue === "string" ? oldValue : undefined,
      newValue,
      unit,
      status: "Pending" as const,
      proposedAt
    };
  });
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
    return toPendingProposals(params.material, params.testRunId, [{ propertyKey, newValue: value, unit }], proposedAt);
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
  return toPendingProposals(params.material, params.testRunId, [
    { propertyKey: "specificGravity", newValue: params.result.absoluteDensityGPerCm3, unit: "-" },
    { propertyKey: "density", newValue: params.result.absoluteDensityKgM3, unit: "kg/m³" },
    { propertyKey: "ssdDensity", newValue: params.result.ssdDensityKgM3, unit: "kg/m³" },
    { propertyKey: "absorption", newValue: params.result.waterAbsorptionPercent, unit: "%" }
  ], proposedAt);
}

export function createBulkDensityMaterialUpdateProposals(params: {
  material: EngineeringMaterial;
  testRunId: string;
  result: BulkDensityProposalResult;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  if (!params.result.validation.valid) return [];
  const proposedAt = params.proposedAt || new Date().toISOString();
  return toPendingProposals(params.material, params.testRunId, [
    { propertyKey: "bulkDensity", newValue: params.result.looseDensityKgM3, unit: "kg/m³" },
    { propertyKey: "compactedBulkDensity", newValue: params.result.compactedDensityKgM3, unit: "kg/m³" },
    { propertyKey: "compactionIndex", newValue: params.result.compactionIndex, unit: "-" }
  ], proposedAt);
}

export function createMoistureMaterialUpdateProposals(params: {
  material: EngineeringMaterial;
  testRunId: string;
  result: MoistureProposalResult;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  if (!params.result.validation.valid || !Number.isFinite(params.result.moisturePercent)) return [];
  const proposedAt = params.proposedAt || new Date().toISOString();
  return toPendingProposals(params.material, params.testRunId, [
    { propertyKey: "moisture", newValue: params.result.moisturePercent, unit: "%" }
  ], proposedAt);
}

export function createSandEquivalentMaterialUpdateProposals(params: {
  material: EngineeringMaterial;
  testRunId: string;
  result: SandEquivalentProposalResult;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  if (!params.result.validation.valid || !Number.isFinite(params.result.sandEquivalentPercent)) return [];
  const proposedAt = params.proposedAt || new Date().toISOString();
  return toPendingProposals(params.material, params.testRunId, [
    { propertyKey: "sandEquivalent", newValue: params.result.sandEquivalentPercent, unit: "%" }
  ], proposedAt);
}

export function createSandBulkingMaterialUpdateProposals(params: {
  material: EngineeringMaterial;
  testRunId: string;
  result: SandBulkingProposalResult;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  if (!params.result.validation.valid || !Number.isFinite(params.result.sandBulkingCoefficient)) return [];
  const proposedAt = params.proposedAt || new Date().toISOString();
  return toPendingProposals(params.material, params.testRunId, [
    { propertyKey: "sandBulkingCoeff", newValue: params.result.sandBulkingCoefficient, unit: "-" }
  ], proposedAt);
}

export function createLosAngelesMaterialUpdateProposals(params: {
  material: EngineeringMaterial;
  testRunId: string;
  result: LosAngelesProposalResult;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  if (!params.result.validation.valid || !Number.isFinite(params.result.losAngelesAbrasionPercent)) return [];
  const proposedAt = params.proposedAt || new Date().toISOString();
  return toPendingProposals(params.material, params.testRunId, [
    { propertyKey: "losAngelesAbrasion", newValue: params.result.losAngelesAbrasionPercent, unit: "%" }
  ], proposedAt);
}

export function createMicroDevalMaterialUpdateProposals(params: {
  material: EngineeringMaterial;
  testRunId: string;
  result: MicroDevalProposalResult;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  if (!params.result.validation.valid || !Number.isFinite(params.result.microDevalPercent)) return [];
  const proposedAt = params.proposedAt || new Date().toISOString();
  return toPendingProposals(params.material, params.testRunId, [
    { propertyKey: "microDeval", newValue: params.result.microDevalPercent, unit: "%" }
  ], proposedAt);
}

export function createFlakinessMaterialUpdateProposals(params: {
  material: EngineeringMaterial;
  testRunId: string;
  result: FlakinessProposalResult;
  proposedAt?: string;
}): MaterialUpdateProposal[] {
  if (!params.result.validation.valid || !Number.isFinite(params.result.flakinessIndexPercent)) return [];
  const proposedAt = params.proposedAt || new Date().toISOString();
  return toPendingProposals(params.material, params.testRunId, [
    { propertyKey: "flakinessIndex", newValue: params.result.flakinessIndexPercent, unit: "%" }
  ], proposedAt);
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
