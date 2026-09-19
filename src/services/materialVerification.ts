import type { SupportedMaterialRole } from "./materialPropertySchema";
import type { MaterialAuditResult } from "./materialAuditEngine";

export interface MaterialVerificationRequirement {
  role: SupportedMaterialRole;
  propertyKey: string;
  testStandard: string;
  evidence: string;
  acceptance: string;
  calculationImpact: string;
}

export interface MaterialVerificationQueueItem {
  materialId: string;
  materialName: string;
  role: SupportedMaterialRole;
  propertyKey: string;
  testStandard: string;
  evidence: string;
  acceptance: string;
  calculationImpact: string;
}

/**
 * Requirements for closing a missing required property.
 *
 * These are deliberately instructions for obtaining evidence, not fallback
 * values. A material remains incomplete until the measured/certified value is
 * entered through the laboratory/material workflow.
 */
export const MATERIAL_VERIFICATION_REQUIREMENTS: MaterialVerificationRequirement[] = [
  {
    role: "scm",
    propertyKey: "pozzolanicIndex",
    testStandard: "ASTM C311/C311M (strength activity index); use EN 450-1 for fly ash or EN 13263-1 for silica fume where applicable",
    evidence: "Supplier certificate or laboratory report identifying the SCM type, test age, reference cement/mortar and measured activity index.",
    acceptance: "Numeric percentage within the schema range, with test age and standard recorded; do not substitute replacement percentage or a generic typical value.",
    calculationImpact: "Required for pozzolanic SCMs because it affects binder qualification and the engineering warning layer."
  },
  {
    role: "fiber",
    propertyKey: "tensileStrength",
    testStandard: "EN 14889-1 or ASTM A820/A820M, according to the declared steel-fiber product",
    evidence: "Current product data sheet or laboratory tensile test for the exact fiber grade and diameter.",
    acceptance: "Numeric tensile strength in MPa linked to the exact product/lot; do not infer it from steel density, grade name or dosage.",
    calculationImpact: "Required for FRC/BFUP suitability checks and post-cracking reinforcement warnings."
  },
  {
    role: "lightweightAggregate",
    propertyKey: "bulkDensity",
    testStandard: "EN 1097-3 or ASTM C29/C29M",
    evidence: "Bulk-density test report stating loose/rodded condition, moisture state and test temperature.",
    acceptance: "Numeric dry bulk density in kg/m³ with the test condition recorded; do not reuse particle density or specific gravity.",
    calculationImpact: "Required to distinguish particle density from batching/volume behavior in lightweight concrete."
  },
  {
    role: "heavyweightAggregate",
    propertyKey: "bulkDensity",
    testStandard: "EN 1097-3 or ASTM C29/C29M",
    evidence: "Bulk-density test report for the supplied heavyweight aggregate, including loose/rodded condition and moisture state.",
    acceptance: "Numeric dry bulk density in kg/m³ with the test condition recorded; do not derive it from specific gravity.",
    calculationImpact: "Required for mass-volume closure and batching estimates for heavyweight concrete."
  },
  {
    role: "heavyweightAggregate",
    propertyKey: "bariumSulfate",
    testStandard: "Chemical/XRF or wet-chemistry report for BaSO₄; classify the aggregate against ASTM C637 where radiation-shielding use applies",
    evidence: "Lot-specific chemical composition report identifying BaSO₄ content and the analytical method.",
    acceptance: "Numeric mass percentage with method, lot and reporting basis documented; do not equate baryte classification with a guaranteed BaSO₄ percentage.",
    calculationImpact: "Required for radiation-shielding suitability and material traceability; it must not silently affect ordinary concrete calculations."
  },
  {
    role: "recycledAggregate",
    propertyKey: "bulkDensity",
    testStandard: "EN 1097-3 or ASTM C29/C29M",
    evidence: "Bulk-density test report for the actual recycled aggregate fraction, with moisture and loose/rodded condition.",
    acceptance: "Numeric dry bulk density in kg/m³ with test condition recorded; do not use parent-concrete density as a proxy.",
    calculationImpact: "Required for volume closure and reliable moisture/batching corrections in recycled aggregate concrete."
  },
  {
    role: "recycledAggregate",
    propertyKey: "masonryContent",
    testStandard: "EN 933-11",
    evidence: "Constituent-composition report for the recycled coarse aggregate fraction, including masonry particles and test fraction.",
    acceptance: "Numeric mass percentage for masonry constituents, with fraction, sampling and test date recorded.",
    calculationImpact: "Required for recycled-aggregate quality classification and durability/use restrictions."
  }
];

export function getMaterialVerificationRequirement(
  role: SupportedMaterialRole,
  propertyKey: string
): MaterialVerificationRequirement | undefined {
  return MATERIAL_VERIFICATION_REQUIREMENTS.find(
    requirement => requirement.role === role && requirement.propertyKey === propertyKey
  );
}

export function buildMaterialVerificationQueue(
  results: MaterialAuditResult[]
): MaterialVerificationQueueItem[] {
  const queue: MaterialVerificationQueueItem[] = [];
  for (const result of results) {
    for (const property of result.missingRequiredProperties) {
      const requirement = getMaterialVerificationRequirement(result.role, property.key);
      if (!requirement) continue;
      queue.push({
        materialId: result.materialId,
        materialName: result.materialName,
        role: result.role,
        propertyKey: property.key,
        testStandard: requirement.testStandard,
        evidence: requirement.evidence,
        acceptance: requirement.acceptance,
        calculationImpact: requirement.calculationImpact
      });
    }
  }
  return queue;
}

export function hasCompleteVerificationPlan(result: MaterialAuditResult): boolean {
  return result.missingRequiredProperties.every(property =>
    Boolean(getMaterialVerificationRequirement(result.role, property.key))
  );
}

export function canUseMaterialForMixDesign(result: MaterialAuditResult): boolean {
  return result.readinessStatus === "ready" && result.missingRequiredCount === 0 && result.invalidRequiredCount === 0;
}

export function verificationQueueToMarkdown(queue: MaterialVerificationQueueItem[]): string {
  const lines = [
    "# SnoLab Material Verification Queue",
    "",
    "> This queue identifies evidence that must be obtained before a material can be treated as calculation-ready. It intentionally contains no invented engineering values.",
    "",
    "| Material | Role | Missing property | Required evidence / standard | Acceptance and calculation impact |",
    "|---|---|---|---|---|"
  ];
  for (const item of queue) {
    lines.push(`| ${item.materialName} (${item.materialId}) | ${item.role} | ${item.propertyKey} | ${item.evidence} **Standard:** ${item.testStandard} | ${item.acceptance} ${item.calculationImpact} |`);
  }
  return `${lines.join("\n")}\n`;
}

export const MATERIAL_VERIFICATION_REQUIREMENT_COUNT = MATERIAL_VERIFICATION_REQUIREMENTS.length;

export default MATERIAL_VERIFICATION_REQUIREMENTS;
