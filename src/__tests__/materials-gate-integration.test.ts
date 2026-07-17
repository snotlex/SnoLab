import { describe, it, expect } from "vitest";
import { checkMaterialSuitability } from "../engine/suitabilityGate";
import { calculateDreuxGorisse } from "../utils";
import { calculateByMethod } from "../mix-design-methods/calculateByMethod";
import { MixDesignInput, EngineeringMaterial, AggregateType, AggregateQuality } from "../types";

const getMockInput = (overrides: Partial<MixDesignInput> = {}): MixDesignInput => ({
  fck28: 25,
  concreteType: "NSC",
  controlClass: "normal",
  cementType: "Cement CEM I",
  cementClassStrength: 42.5,
  dMax: 20,
  slump: 8,
  aggregateType: AggregateType.ROULE,
  aggregateQuality: AggregateQuality.STANDARD,
  hasPumping: false,
  sandRelativeDensity: 2600,
  gravelRelativeDensity: 2650,
  cementDensity: 3100,
  airContent: 1.0,
  moistureSand: 3.5,
  moistureGravel: 1.0,
  sandAbsorption: 1.5,
  gravelAbsorption: 0.8,
  admixtures: [],
  costBasis: "wet",
  dosageSuper: 0.8,
  dosageAir: 0,
  dosageRetarder: 0,
  dosageAccelerator: 0,
  dosageSilicaFume: 0,
  dosageFlyAsh: 0,
  dosageSlag: 0,
  sandType: "Sand 0/4",
  gravelType: "Gravel 4/20",
  autoDensities: true,
  batchVolume: 1.0,
  areaM2: 10,
  thicknessCm: 10,
  volumeInputMode: "volume",
  selectedMethod: "dreux",
  exposureClass: "X0",
  durabilityLevel: "normal",
  carbonationLevel: "negligible",
  chloridesLevel: "none",
  sulfatesLevel: "none",
  internalUnitWeight: 1600,
  internalCoeffG: 0.50,
  internalCurveCoeff: 1.0,
  internalSandRatio: 0.35,
  packingFactor: 0.82,
  internalWcOverride: 0.45,
  priceCement: 20,
  priceSand: 2.5,
  priceGravel: 2.8,
  priceSuper: 150,
  priceAir: 110,
  priceRetarder: 95,
  priceAccelerator: 125,
  priceSilicaFume: 65,
  priceFlyAsh: 40,
  priceSlag: 30,
  priceLabor: 1200,
  priceWater: 2,
  selectedCementId: "cem-1",
  selectedSandId: "sand-1",
  selectedGravelId: "grav-1",
  selectedWaterId: "wat-1",
  ...overrides
});

const getMockMaterials = (): EngineeringMaterial[] => [
  {
    id: "cem-1",
    name: "Cement CEM I",
    englishName: "Cement CEM I",
    category: "إسمنت",
    type: "cementitious",
    ApprovalStatus: "Approved",
    status: "نشط",
    image: "/placeholder-material.png",
    density: 3100,
    specificGravity: 3.1,
    strengthClass: "42.5",
    quality: "high",
    uses: "general",
    desc: "",
    absorption: 0,
    moisture: 0,
    ssdDensity: 3100,
    rating: 5,
    provenance: "",
    createdBy: "user",
    ownerId: "user-123",
    source: "user",
    createdDate: "",
    updatedDate: ""
  },
  {
    id: "sand-1",
    name: "Sand 0/4",
    englishName: "Sand 0/4",
    category: "رمال",
    type: "sand",
    ApprovalStatus: "Approved",
    status: "نشط",
    image: "/placeholder-material.png",
    density: 2600,
    absorption: 1.5,
    moisture: 3.5,
    finenessModulus: 2.6,
    quality: "high",
    uses: "general",
    desc: "",
    ssdDensity: 2600,
    rating: 5,
    provenance: "",
    createdBy: "user",
    ownerId: "user-123",
    source: "project",
    createdDate: "",
    updatedDate: ""
  },
  {
    id: "grav-1",
    name: "Gravel 4/20",
    englishName: "Gravel 4/20",
    category: "حصى",
    type: "gravel",
    ApprovalStatus: "Approved",
    status: "نشط",
    image: "/placeholder-material.png",
    density: 2650,
    absorption: 0.8,
    moisture: 1.0,
    dMax: 20,
    particleShape: "مستدير",
    quality: "high",
    uses: "general",
    desc: "",
    ssdDensity: 2650,
    rating: 5,
    provenance: "",
    createdBy: "user",
    ownerId: "user-123",
    source: "lab",
    createdDate: "",
    updatedDate: ""
  },
  {
    id: "wat-1",
    name: "Mixing Water",
    englishName: "Mixing Water",
    category: "ماء",
    type: "water",
    ApprovalStatus: "Approved",
    status: "نشط",
    image: "/placeholder-material.png",
    density: 1000,
    absorption: 0,
    quality: "high",
    uses: "general",
    desc: "",
    moisture: 0,
    ssdDensity: 1000,
    rating: 5,
    provenance: "",
    createdBy: "user",
    ownerId: "user-123",
    source: "user",
    createdDate: "",
    updatedDate: ""
  }
];

describe("Materials Gate Connection & Integration Tests", () => {
  it("A) App-style input + materialsDatabase approved yields materialSuitability.status = approved", () => {
    const input = getMockInput();
    const materials = getMockMaterials();
    
    const suit = checkMaterialSuitability(input, materials);
    expect(suit.status).toBe("approved");
    expect(suit.missingMaterials.length).toBe(0);
    expect(suit.invalidMaterials.length).toBe(0);
  });

  it("B) App-style input without materialsDatabase (empty) yields status = blocked", () => {
    const input = getMockInput();
    const suit = checkMaterialSuitability(input, []);
    expect(suit.status).toBe("blocked");
    expect(suit.missingMaterials).toContain("cement");
    expect(suit.missingMaterials).toContain("sand");
    expect(suit.missingMaterials).toContain("gravel");
    expect(suit.missingMaterials).toContain("water");
  });

  it("C) Selecting material name only without selected ID is NOT approved (yields blocked)", () => {
    const inputNoCementId = getMockInput({ selectedCementId: "" });
    const suit = checkMaterialSuitability(inputNoCementId, getMockMaterials());
    expect(suit.status).toBe("blocked");
    expect(suit.missingMaterials).toContain("cement");
  });

  it("D) Selected IDs with materialsDatabase are preserved through calculateDreuxGorisse and calculateByMethod", () => {
    const input = getMockInput({
      materialsDatabase: getMockMaterials()
    });
    
    const resultDreux = calculateDreuxGorisse(input);
    expect(resultDreux).toBeDefined();
    expect(resultDreux.materialSuitability).toBeDefined();
    expect(resultDreux.materialSuitability?.status).toBe("approved");

    const resultByMethod = calculateByMethod("dreux-gorisse", input);
    expect(resultByMethod).toBeDefined();
    expect(resultByMethod.materialSuitability).toBeDefined();
    expect(resultByMethod.materialSuitability?.status).toBe("approved");
  });

  it("E) Strict material status checks (AND condition for Approved/Certified and Active/نشط)", () => {
    const baseInput = getMockInput();
    const materials = getMockMaterials();

    // Test case 1: Approved but inactive (unacceptable)
    materials[0].ApprovalStatus = "Approved";
    materials[0].status = "موقوف"; // inactive (archived)
    const suitInactive = checkMaterialSuitability(baseInput, materials);
    expect(suitInactive.status).toBe("blocked");
    expect(suitInactive.invalidMaterials).toContain("cement");

    // Test case 2: Active but unapproved (unacceptable)
    const materialsUnapproved = getMockMaterials();
    materialsUnapproved[1].ApprovalStatus = "Draft"; // unapproved
    materialsUnapproved[1].status = "نشط"; // active
    const suitUnapproved = checkMaterialSuitability(baseInput, materialsUnapproved);
    expect(suitUnapproved.status).toBe("blocked");
    expect(suitUnapproved.invalidMaterials).toContain("sand");

    // Test case 3: Certified and active (acceptable)
    const materialsCertified = getMockMaterials();
    materialsCertified[2].ApprovalStatus = "Certified" as any;
    materialsCertified[2].status = "Active" as any;
    const suitCertified = checkMaterialSuitability(baseInput, materialsCertified);
    expect(suitCertified.status).toBe("approved");
    expect(suitCertified.invalidMaterials.length).toBe(0);
  });
});
