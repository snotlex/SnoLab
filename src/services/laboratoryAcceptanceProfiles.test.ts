import { describe, expect, it } from "vitest";
import { findAcceptanceProfile, registerAcceptanceProfile, reviewAcceptanceProfile, validateAcceptanceProfile, type LaboratoryAcceptanceContext, type RegisteredAcceptanceProfile } from "./laboratoryAcceptanceProfiles";
import { attachAcceptanceEvaluation } from "./laboratoryAcceptanceEngine";

const context: LaboratoryAcceptanceContext = { projectId: "P-044", domainId: "geotechnical", testDefinitionId: "GT_PROCTOR", soilLayer: "subbase", standardId: "SPEC-044-V3" };
const profile = (overrides: Partial<RegisteredAcceptanceProfile> = {}): RegisteredAcceptanceProfile => ({ id: "P-044-PROCTOR-SUBBASE", projectId: "P-044", domainId: "geotechnical", testDefinitionId: "GT_PROCTOR", standardId: "SPEC-044-V3", parameter: "maximumDryDensityGPerCm3", operator: "informational", unit: "g/cm³", appliesWhen: { soilLayer: "subbase" }, sourceDocumentId: "SPEC-044-3.2", status: "Active", createdAt: "2026-10-23T00:00:00Z", updatedAt: "2026-10-23T00:00:00Z", revision: 1, ...overrides });

describe("laboratory acceptance profiles", () => {
  it("selects the most specific matching project profile", () => {
    const broad = profile({ id: "BROAD", appliesWhen: {} });
    const specific = profile({ id: "SPECIFIC", appliesWhen: { soilLayer: "subbase" } });
    expect(findAcceptanceProfile([broad, specific], context)?.id).toBe("SPECIFIC");
  });
  it("does not match a profile across domains or test definitions", () => {
    expect(findAcceptanceProfile([profile({ domainId: "fresh_concrete" })], context)).toBeUndefined();
    expect(findAcceptanceProfile([profile({ testDefinitionId: "GT_CBR" })], context)).toBeUndefined();
  });
  it("requires a documented source and complete active limits", () => {
    expect(validateAcceptanceProfile(profile({ sourceDocumentId: "" }))).toContain("ACCEPTANCE_SOURCE_DOCUMENT_REQUIRED");
    expect(validateAcceptanceProfile(profile({ operator: "min", lowerLimit: undefined }))).toContain("ACCEPTANCE_MIN_LIMIT_REQUIRED");
  });
  it("registers by project and profile id without duplicating revisions", () => {
    const first = profile();
    const second = profile({ revision: 2, updatedAt: "2026-10-24T00:00:00Z" });
    expect(registerAcceptanceProfile(second, [first])).toHaveLength(1);
    expect(registerAcceptanceProfile(second, [first])[0].revision).toBe(2);
  });
  it("stores the acceptance snapshot on a laboratory run", () => {
    const run: any = { id: "RUN-1", rawData: {}, status: "Calculated" };
    const attached = attachAcceptanceEvaluation(run, 1.85, profile({ operator: "min", lowerLimit: 1.8 }), "2026-10-23T12:00:00Z");
    expect(attached.acceptanceProfileId).toBe("P-044-PROCTOR-SUBBASE");
    expect(attached.acceptanceEvaluation?.decision).toBe("PASS");
    expect(attached.acceptanceEvaluation?.evaluatedAt).toBe("2026-10-23T12:00:00Z");
  });
  it("activates a complete draft with reviewer identity and timestamp", () => {
    const reviewed = reviewAcceptanceProfile(profile({ status: "Draft", operator: "min", lowerLimit: 1.8 }), "user-7", "2026-10-23T15:00:00Z", "Reviewed against project specification.");
    expect(reviewed.status).toBe("Active");
    expect(reviewed.reviewedBy).toBe("user-7");
    expect(reviewed.reviewedAt).toBe("2026-10-23T15:00:00Z");
  });
  it("blocks review when the active limit is incomplete", () => {
    expect(() => reviewAcceptanceProfile(profile({ status: "Draft", operator: "between", lowerLimit: 1.8, upperLimit: undefined }), "user-7")).toThrow("ACCEPTANCE_BOUNDS_REQUIRED");
  });
});
