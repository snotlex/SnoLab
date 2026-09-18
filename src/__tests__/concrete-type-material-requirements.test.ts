import { describe, expect, it } from "vitest";
import { checkMaterialSuitability } from "../engine/suitabilityGate";

const concreteTypes = ["NSC", "HSC", "HPC", "SCC", "LWC", "HWC", "RCC", "SHOTCRETE", "SHC", "RAC", "PERVIOUS", "UHPC", "BFUP", "FRC", "MASS"];
const materials: any[] = [
  { id: "cement", category: "إسمنت", name: "CEM I", englishName: "Portland cement", density: 3100, strengthClass: 52.5, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "p" },
  { id: "sand", category: "رمال", name: "Sand", englishName: "Sand", density: 2650, absorption: 1, moisture: 1, finenessModulus: 2.6, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "p" },
  { id: "gravel", category: "حصى", name: "Gravel", englishName: "Gravel", density: 2680, absorption: 1, moisture: 1, dMax: 20, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "p" },
  { id: "water", category: "ماء", name: "Water", englishName: "Water", density: 1000, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "p" },
];

function inputFor(type: string, withCement: boolean) {
  return {
    concreteType: type, selectedCementId: withCement ? "cement" : undefined,
    selectedSandId: "sand", selectedGravelId: "gravel", selectedWaterId: "water",
    fck28: 30, materialsDatabase: materials
  } as any;
}

describe("Concrete type material requirements", () => {
  it("requires cement for every cement-based type and never for GPC", () => {
    for (const type of concreteTypes) {
      const result = checkMaterialSuitability(inputFor(type, false), materials);
      expect(result.missingMaterials, `${type} should require cement`).toContain("cement");
    }
    const gpc = checkMaterialSuitability({ ...inputFor("GPC", false), dosageFlyAsh: 60, dosageSlag: 40, selectedSpecialBinderId: "activator" }, [...materials, { id: "activator", category: "مجلدات خاصة", name: "Alkaline activator", englishName: "Alkaline activator", density: 1500, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "p" }]);
    expect(gpc.missingMaterials).not.toContain("cement");
  });

  it("does not silently accept Portland cement in cementless GPC", () => {
    const result = checkMaterialSuitability({ ...inputFor("GPC", true), dosageFlyAsh: 60, dosageSlag: 40 }, materials);
    expect(result.status).toBe("blocked");
    expect(result.incompatibleMaterials).toContain("cement");
  });
});
