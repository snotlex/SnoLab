import { describe, expect, it } from "vitest";
import { SEEDED_MATERIALS } from "../data/seededMaterials";
import { isMaterialApprovedByEngineer } from "../services/materialApprovalService";

describe("Additional approved system materials", () => {
  const ids = [
    "SYS-CEM-106", "SYS-CEM-107", "SYS-SCM-SF-001", "SYS-SCM-FA-001", "SYS-SCM-GGBS-001",
    "SYS-ADM-SP-001", "SYS-ADM-RET-001", "SYS-ADM-ACC-001", "SYS-ADM-AE-001",
    "SYS-FIB-STEEL-001", "SYS-AGG-LWA-001", "SYS-AGG-HWA-001", "SYS-AGG-RCA-001", "SYS-WATER-POT-002"
  ];

  it("contains every added catalog material", () => {
    for (const id of ids) expect(SEEDED_MATERIALS.find(m => m.id === id)).toBeDefined();
  });

  it("marks every added material as a system-approved active reference", () => {
    for (const id of ids) {
      const material = SEEDED_MATERIALS.find(m => m.id === id)!;
      expect(material.isSystem).toBe(true);
      expect(material.materialSource).toBe("system");
      expect(material.approvalStatus).toBe("Approved");
      expect(material.status).toBe("نشط");
      expect(material.usableInMixDesign).toBe(true);
      expect(isMaterialApprovedByEngineer(material)).toBe(true);
    }
  });

  it("exposes the required technical properties by material family", () => {
    const silica = SEEDED_MATERIALS.find(m => m.id === "SYS-SCM-SF-001")!;
    const superplasticizer = SEEDED_MATERIALS.find(m => m.id === "SYS-ADM-SP-001")!;
    const steelFiber = SEEDED_MATERIALS.find(m => m.id === "SYS-FIB-STEEL-001")!;
    const lightweight = SEEDED_MATERIALS.find(m => m.id === "SYS-AGG-LWA-001")!;
    const heavyweight = SEEDED_MATERIALS.find(m => m.id === "SYS-AGG-HWA-001")!;
    expect(silica.admixtureType).toBe("silica_fume");
    expect(silica.maxReplacementPercent).toBe(15);
    expect(superplasticizer.waterReduction).toBe(25);
    expect(steelFiber.fiberDensity).toBe(7850);
    expect(lightweight.absorption).toBe(8);
    expect(heavyweight.specificGravity).toBe(4.1);
  });
});
