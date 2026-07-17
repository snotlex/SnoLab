import { describe, it, expect } from "vitest";
import { checkMaterialSuitability } from "../suitabilityGate";

const getMockInput = (overrides: any = {}): any => ({
  concreteType: "normal",
  fck28: 25,
  slump: 10,
  dMax: 20,
  selectedCementId: "cem-1",
  selectedSandId: "sand-1",
  selectedGravelId: "grav-1",
  selectedWaterId: "wat-1",
  controlClass: "normal",
  ...overrides
});

const getMockMaterials = (): any[] => [
  {
    id: "cem-1",
    name: "Cement CEM I",
    englishName: "Cement CEM I",
    category: "CEMENT",
    type: "cement",
    ApprovalStatus: "Approved",
    status: "نشط",
    density: 3.15,
    strengthClass: "42.5",
    quality: "high",
    uses: "general",
    desc: "",
    ownerId: "user-123",
    source: "user"
  },
  {
    id: "sand-1",
    name: "Sand 0/4",
    englishName: "Sand 0/4",
    category: "SAND",
    type: "sand",
    ApprovalStatus: "Approved",
    status: "نشط",
    density: 2.65,
    absorption: 1.2,
    moisture: 3.0,
    finenessModulus: 2.8,
    quality: "high",
    uses: "general",
    desc: "",
    ownerId: "user-123",
    source: "user"
  },
  {
    id: "grav-1",
    name: "Gravel 4/20",
    englishName: "Gravel 4/20",
    category: "GRAVEL",
    type: "gravel",
    ApprovalStatus: "Approved",
    status: "نشط",
    density: 2.68,
    absorption: 0.8,
    moisture: 1.0,
    dMax: 20,
    particleShape: "مستدير",
    losAngelesAbrasion: 25,
    quality: "high",
    uses: "general",
    desc: "",
    ownerId: "user-123",
    source: "user"
  },
  {
    id: "wat-1",
    name: "Mixing Water",
    englishName: "Mixing Water",
    category: "WATER",
    type: "water",
    ApprovalStatus: "Approved",
    status: "نشط",
    density: 1.0,
    absorption: 0,
    quality: "high",
    uses: "general",
    desc: "",
    ownerId: "user-123",
    source: "user"
  }
];

describe("Active Materials & Concrete-Type Suitability Gate Tests", () => {
  it("should return blocked when basic materials are missing", () => {
    const input = getMockInput({ selectedCementId: "" });
    const res = checkMaterialSuitability(input, getMockMaterials());
    expect(res.status).toBe("blocked");
    expect(res.missingMaterials).toContain("cement");
  });

  it("should approve a C25 mix when all basic materials are Approved and active", () => {
    const input = getMockInput();
    const res = checkMaterialSuitability(input, getMockMaterials());
    expect(res.status).toBe("approved");
    expect(res.invalidMaterials.length).toBe(0);
  });

  it("should block a mix when cement is in Draft status", () => {
    const materials = getMockMaterials();
    materials[0].ApprovalStatus = "Draft";
    materials[0].status = "draft";
    const input = getMockInput();
    const res = checkMaterialSuitability(input, materials);
    expect(res.status).toBe("blocked");
    expect(res.invalidMaterials).toContain("cement");
  });

  it("should block a mix when sand is in Archived status", () => {
    const materials = getMockMaterials();
    materials[1].ApprovalStatus = "Archived";
    materials[1].status = "archived";
    const input = getMockInput();
    const res = checkMaterialSuitability(input, materials);
    expect(res.status).toBe("blocked");
    expect(res.invalidMaterials).toContain("sand");
  });

  it("should block SCC when superplasticizer is missing", () => {
    const input = getMockInput({ concreteType: "scc" });
    const res = checkMaterialSuitability(input, getMockMaterials());
    expect(res.status).toBe("blocked");
    expect(res.incompatibleMaterials).toContain("superplasticizer");
  });

  it("should approve SCC when approved superplasticizer is selected and dMax <= 16", () => {
    const materials = getMockMaterials();
    materials.push({
      id: "super-1",
      name: "Superplasticizer Admix",
      englishName: "Superplasticizer Admix",
      category: "إضافات كيميائية",
      type: "admixture",
      admixtureType: "superplasticizer",
      ApprovalStatus: "Approved",
      status: "نشط",
      density: 1.2,
      absorption: 0,
      quality: "high",
      uses: "general",
      desc: "",
      ownerId: "user-123",
      source: "user"
    });
    const input = getMockInput({
      concreteType: "scc",
      selectedAdmixtureId: "super-1",
      dosageSuper: 2.0,
      dMax: 14
    });
    const res = checkMaterialSuitability(input, materials);
    expect(res.status).toBe("approved");
  });

  it("should block LWC when using normal aggregate of density 2650 and no lightweight aggregate is selected", () => {
    const input = getMockInput({ concreteType: "lightweight" });
    const res = checkMaterialSuitability(input, getMockMaterials());
    expect(res.status).toBe("blocked");
    expect(res.incompatibleMaterials).toContain("gravel");
  });

  it("should block HWC when using normal aggregate of density 2680", () => {
    const input = getMockInput({ concreteType: "heavyweight" });
    const res = checkMaterialSuitability(input, getMockMaterials());
    expect(res.status).toBe("blocked");
    expect(res.incompatibleMaterials).toContain("gravel");
  });

  it("should block FRC when fibers are missing or dosage is 0", () => {
    const input = getMockInput({ concreteType: "frc", fiberDosageKgM3: 0 });
    const res = checkMaterialSuitability(input, getMockMaterials());
    expect(res.status).toBe("blocked");
    expect(res.incompatibleMaterials).toContain("fiber");
  });

  it("should flag a thermal hazard warning for mass concrete without SCM or low heat cement", () => {
    const input = getMockInput({ concreteType: "mass", dosageFlyAsh: 0, dosageSlag: 0 });
    const res = checkMaterialSuitability(input, getMockMaterials());
    expect(res.status).toBe("blocked");
    expect(res.warnings.some(w => w.includes("الخرسانة الكتلية") || w.includes("الحرارية"))).toBe(true);
  });

  it("should warn for recycled concrete when normal gravel is used without recycled aggregate characteristics", () => {
    const input = getMockInput({ concreteType: "recycled" });
    const res = checkMaterialSuitability(input, getMockMaterials());
    expect(res.status).toBe("blocked");
    expect(res.warnings.some(w => w.includes("معاد تدويره"))).toBe(true);
  });

  it("should prove that no selected IDs + empty materialsDatabase = blocked and not approved", () => {
    const input = getMockInput({
      selectedCementId: undefined,
      selectedSandId: undefined,
      selectedGravelId: undefined,
      selectedWaterId: undefined
    });
    const res = checkMaterialSuitability(input, []);
    expect(res.status).toBe("blocked");
    expect(res.reason).toBe("missing_user_materials");
  });

  it("should prove that empty initial state IDs blocks calculation before choosing real materials", () => {
    const input = getMockInput({
      selectedCementId: "",
      selectedSandId: "",
      selectedGravelId: "",
      selectedWaterId: ""
    });
    const res = checkMaterialSuitability(input, []);
    expect(res.status).toBe("blocked");
    expect(res.reason).toBe("missing_user_materials");
  });
});
