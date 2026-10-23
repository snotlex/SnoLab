import { describe, expect, it } from "vitest";
import { MASTER_TEST_CATALOG } from "./materialsLabEngine";
import { LABORATORY_DOMAINS, LABORATORY_WORKSPACES, getLaboratoryWorkspaceId, inferLaboratoryDomain, inferLaboratorySessionDomain } from "./laboratoryDomains";

describe("laboratory workspace separation", () => {
  it("exposes exactly three user-facing laboratories and preserves all four internal domains", () => {
    expect(LABORATORY_WORKSPACES.map(workspace => workspace.id)).toEqual([
      "civil_materials",
      "geotechnical",
      "concrete"
    ]);
    const groupedDomainIds = LABORATORY_WORKSPACES.flatMap(workspace => workspace.domainIds);
    expect(groupedDomainIds).toHaveLength(4);
    expect(new Set(groupedDomainIds).size).toBe(4);
    expect(new Set(groupedDomainIds)).toEqual(new Set(LABORATORY_DOMAINS.map(domain => domain.id)));
  });

  it("groups fresh and hardened concrete together without changing their stored domain IDs", () => {
    expect(getLaboratoryWorkspaceId("fresh_concrete")).toBe("concrete");
    expect(getLaboratoryWorkspaceId("hardened_concrete")).toBe("concrete");
    expect(getLaboratoryWorkspaceId("civil_materials")).toBe("civil_materials");
    expect(getLaboratoryWorkspaceId("geotechnical")).toBe("geotechnical");
    expect(LABORATORY_DOMAINS.map(domain => domain.id)).toContain("fresh_concrete");
    expect(LABORATORY_DOMAINS.map(domain => domain.id)).toContain("hardened_concrete");
  });

  it("infers old concrete records from legacy IDs/categories when domainId is absent", () => {
    expect(inferLaboratoryDomain({ testType: "FC_SLUMP", category: "workability", laboratoryArea: "concrete" })).toBe("fresh_concrete");
    expect(inferLaboratoryDomain({ testType: "HC_COMPRESSIVE_STRENGTH", category: "hardened_mechanical", laboratoryArea: "concrete" })).toBe("hardened_concrete");
    expect(inferLaboratoryDomain({ testType: "AGG_SIEVE", category: "aggregates", laboratoryArea: "materials" })).toBe("civil_materials");
  });

  it("scopes legacy sessions from their test IDs and refuses to misclassify mixed-domain sessions", () => {
    expect(inferLaboratorySessionDomain({ domainId: "hardened_concrete", tests: [{ testType: "HC_COMPRESSIVE_STRENGTH" } as never] })).toBe("hardened_concrete");
    expect(inferLaboratorySessionDomain({ tests: [{ testType: "FC_SLUMP" } as never] })).toBe("fresh_concrete");
    expect(inferLaboratorySessionDomain({ tests: [{ testType: "GT_SIEVE_SOIL" } as never] })).toBe("geotechnical");
    expect(inferLaboratorySessionDomain({ tests: [{ testType: "AGG_SIEVE" } as never] })).toBe("civil_materials");
    expect(inferLaboratorySessionDomain({ tests: [{ testType: "FC_SLUMP" } as never, { testType: "HC_COMPRESSIVE_STRENGTH" } as never] })).toBeUndefined();
  });

  it("assigns each legacy catalog test to the workspace of its declared domain", () => {
    for (const test of MASTER_TEST_CATALOG) {
      const domain = test.domainId || "civil_materials";
      expect(getLaboratoryWorkspaceId(domain)).toBe(
        domain === "fresh_concrete" || domain === "hardened_concrete" ? "concrete" : domain
      );
    }
    expect(MASTER_TEST_CATALOG.filter(test => test.id.startsWith("FC_")).every(test => test.domainId === "fresh_concrete")).toBe(true);
    expect(MASTER_TEST_CATALOG.filter(test => test.id.startsWith("HC_")).every(test => test.domainId === "hardened_concrete")).toBe(true);
  });

  it("keeps planned and official tests under exactly one existing internal domain", () => {
    const assignments = LABORATORY_DOMAINS.flatMap(domain => domain.plannedTests.map(test => ({ testId: test.id, domainId: domain.id })));
    expect(assignments.every(assignment => assignment.testId.trim().length > 0)).toBe(true);
    expect(new Set(assignments.map(assignment => assignment.testId)).size).toBe(assignments.length);
    for (const domain of LABORATORY_DOMAINS) {
      expect(LABORATORY_WORKSPACES.filter(workspace => workspace.domainIds.includes(domain.id))).toHaveLength(1);
      expect(new Set(domain.plannedTests.map(test => test.id)).size).toBe(domain.plannedTests.length);
    }
  });

  it("marks only the newly connected Atterberg and CBR runs as implemented maturity", () => {
    const soilTests = LABORATORY_DOMAINS.find(domain => domain.id === "geotechnical")!.plannedTests;
    expect(soilTests.find(test => test.id === "GT_ATTERBERG")?.maturity).toBe("implemented");
    expect(soilTests.find(test => test.id === "GT_CBR")?.maturity).toBe("implemented");
    expect(soilTests.find(test => test.id === "GT_HYDROMETER")?.maturity).toBe("planned");
    expect(soilTests.find(test => test.id === "GT_DIRECT_SHEAR")?.maturity).toBe("planned");
  });
});
