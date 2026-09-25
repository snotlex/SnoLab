import { describe, expect, it } from "vitest";
import { SEEDED_MATERIALS } from "../data/seededMaterials";
import { auditMaterialLibrary } from "../services/materialAuditEngine";
import {
  MATERIAL_VERIFICATION_REQUIREMENTS,
  buildMaterialVerificationQueue,
  canUseMaterialForMixDesign,
  getMaterialVerificationRequirement,
  hasCompleteVerificationPlan,
  verificationQueueToMarkdown
} from "../services/materialVerification";

describe("Material verification queue", () => {
  it("ships the seeded library without required missing properties", () => {
    const report = auditMaterialLibrary(SEEDED_MATERIALS, "dreux", "standard");
    const incomplete = report.results.filter(result => result.missingRequiredCount > 0);
    const queue = buildMaterialVerificationQueue(incomplete);

    expect(incomplete).toEqual([]);
    expect(queue).toEqual([]);
  });

  it("keeps any future incomplete material out of calculation readiness", () => {
    const report = auditMaterialLibrary(SEEDED_MATERIALS, "dreux", "standard");
    const incomplete = report.results.filter(result => result.missingRequiredCount > 0);

    expect(incomplete.every(result => !canUseMaterialForMixDesign(result))).toBe(true);
    expect(incomplete.every(result => result.readinessStatus === "incomplete")).toBe(true);
  });

  it("uses explicit role/property matching and never supplies a fallback value", () => {
    expect(getMaterialVerificationRequirement("scm", "pozzolanicIndex")?.testStandard).toContain("ASTM C311");
    expect(getMaterialVerificationRequirement("heavyweightAggregate", "bariumSulfate")?.acceptance).toContain("do not equate");
    expect(getMaterialVerificationRequirement("recycledAggregate", "masonryContent")?.testStandard).toContain("EN 933-11");
    expect(MATERIAL_VERIFICATION_REQUIREMENTS.every(requirement => !("defaultValue" in requirement))).toBe(true);
  });

  it("renders a human-readable queue without pretending that missing values are known", () => {
    const report = auditMaterialLibrary(SEEDED_MATERIALS, "dreux", "standard");
    const markdown = verificationQueueToMarkdown(buildMaterialVerificationQueue(report.results));

    expect(markdown).toContain("SnoLab Material Verification Queue");
    expect(markdown).toContain("no invented engineering values");
    expect(markdown).toContain("Required evidence / standard");
  });
});
