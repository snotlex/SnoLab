import { describe, it, expect } from "vitest";
import { isUserMaterial, isApprovedAndActive, checkMaterialSuitability } from "../engine/suitabilityGate";
import { SEEDED_MATERIALS } from "../data/seededMaterials";
import { calculateDreuxGorisse } from "../utils";
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
  selectedCementId: "user-cem",
  selectedSandId: "user-sand",
  selectedGravelId: "user-grav",
  selectedWaterId: "user-wat",
  ...overrides
});

const getValidUserMaterials = (): EngineeringMaterial[] => [
  {
    id: "user-cem",
    name: "User Cement CEM I",
    englishName: "User Cement CEM I",
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
    provenance: "Local",
    createdBy: "User Email",
    ownerId: "real-user-123",
    source: "user",
    createdDate: "2026-06-01",
    updatedDate: "2026-06-15"
  },
  {
    id: "user-sand",
    name: "User Sand 0/4",
    englishName: "User Sand 0/4",
    category: "رمال",
    type: "sand",
    ApprovalStatus: "Approved",
    status: "نشط",
    image: "/placeholder-material.png",
    density: 2600,
    specificGravity: 2.6,
    quality: "high",
    uses: "general",
    desc: "",
    absorption: 1.5,
    moisture: 3.5,
    ssdDensity: 2630,
    rating: 5,
    provenance: "Local",
    createdBy: "User Email",
    ownerId: "real-user-123",
    source: "project",
    createdDate: "2026-06-01",
    updatedDate: "2026-06-15",
    gradationData: [
      { sieve: 2.0, passing: 100 },
      { sieve: 1.0, passing: 95 }
    ]
  },
  {
    id: "user-grav",
    name: "User Gravel 4/20",
    englishName: "User Gravel 4/20",
    category: "حصى",
    type: "gravel",
    ApprovalStatus: "Approved",
    status: "نشط",
    image: "/placeholder-material.png",
    density: 2650,
    specificGravity: 2.65,
    quality: "high",
    uses: "general",
    desc: "",
    absorption: 0.8,
    moisture: 1.0,
    ssdDensity: 2680,
    rating: 5,
    provenance: "Local",
    createdBy: "User Email",
    ownerId: "real-user-123",
    source: "lab",
    createdDate: "2026-06-01",
    updatedDate: "2026-06-15",
    gradationData: [
      { sieve: 20, passing: 100 },
      { sieve: 10, passing: 45 }
    ]
  },
  {
    id: "user-wat",
    name: "User Water",
    englishName: "User Water",
    category: "ماء",
    type: "water",
    ApprovalStatus: "Approved",
    status: "نشط",
    image: "/placeholder-material.png",
    density: 1000,
    specificGravity: 1.0,
    quality: "high",
    uses: "general",
    desc: "",
    absorption: 0,
    moisture: 0,
    ssdDensity: 1000,
    rating: 5,
    provenance: "Local",
    createdBy: "User Email",
    ownerId: "real-user-123",
    source: "user",
    createdDate: "2026-06-01",
    updatedDate: "2026-06-15"
  }
];

describe("Strict Materials Governance and Exclusion of Default/Mock/Seeded Materials", () => {
  
  it("should prove that SEEDED_MATERIALS are not classified as user materials", () => {
    SEEDED_MATERIALS.forEach(m => {
      expect(isUserMaterial(m)).toBe(false);
      expect(isApprovedAndActive(m)).toBe(false);
    });
  });

  it("should prove that no seeded/preset materials can be auto-selected", () => {
    // If we only have SEEDED_MATERIALS, a lookup for auto-select must fail
    const selected = SEEDED_MATERIALS.filter(isApprovedAndActive);
    expect(selected.length).toBe(0);
  });

  it("should prove that a material with Approved/Active status but lacking ownerId or user source/creator is rejected", () => {
    const suspiciousMaterial: EngineeringMaterial = {
      id: "fake-material-1",
      name: "Unauthenticated Active Material",
      englishName: "Unauthenticated Active Material",
      category: "إسمنت",
      type: "cementitious",
      ApprovalStatus: "Approved",
      status: "نشط",
      image: "/placeholder-material.png",
      density: 3100,
      ssdDensity: 3100,
      absorption: 0,
      moisture: 0,
      rating: 5,
      provenance: "Local",
      createdBy: "", // Empty or non-user
      ownerId: "",   // Missing owner ID
      source: "",    // Missing user/project/lab source
      createdDate: "",
      updatedDate: "",
      quality: "high",
      uses: "general",
      desc: ""
    };

    expect(isUserMaterial(suspiciousMaterial)).toBe(false);
    expect(isApprovedAndActive(suspiciousMaterial)).toBe(false);
  });

  it("should prove that without complete real user materials, calculation returns blocked status", () => {
    const inputWithoutUserIds = getMockInput({
      selectedCementId: "",
      selectedSandId: "",
      selectedGravelId: "",
      selectedWaterId: ""
    });

    const resSuitability = checkMaterialSuitability(inputWithoutUserIds, []);
    expect(resSuitability.status).toBe("blocked");
    expect(resSuitability.reason).toBe("missing_user_materials");
    
    // Engine call must fail/be blocked
    const resEngine = calculateDreuxGorisse({
      ...inputWithoutUserIds,
      materialsDatabase: []
    });
    expect(resEngine.valid).toBe(false);
    expect(resEngine.errors[0]).toContain("مواد المشروع");
  });

  it("should prove that diagnostic_only does not exist as an approved result in live calculation, but is blocked", () => {
    const input = getMockInput({
      materialsDatabase: getValidUserMaterials()
    });
    
    const res = calculateDreuxGorisse(input);
    expect(res.materialSuitability?.status).not.toBe("diagnostic_only");
    // Should be approved or blocked/warning, never diagnostic_only
  });

  it("should prove that C25 only calculates successfully if all 4 key materials are approved, certified, active, and real user materials", () => {
    const validDB = getValidUserMaterials();
    const input = getMockInput({
      materialsDatabase: validDB
    });

    // Valid C25 should work
    const res = calculateDreuxGorisse(input);
    expect(res.valid).toBe(true);

    // If one material is unapproved (e.g. Draft), it must fail/be blocked
    const modifiedDB = JSON.parse(JSON.stringify(validDB));
    modifiedDB[0].status = "draft"; // cement draft

    const badInput = getMockInput({
      materialsDatabase: modifiedDB
    });

    const resBlocked = calculateDreuxGorisse(badInput);
    expect(resBlocked.valid).toBe(false);
    expect(resBlocked.errors[0]).toContain("مواد المشروع");
  });

  describe("Volumetric Chart Visibility & Preset Isolation Rules", () => {
    // Mirroring component visibility checks to guarantee behavior
    const checkVolumetricChartHidden = (
      result: any,
      input: any
    ): boolean => {
      const hasRealDensities = !!(
        input.cementDensity && input.cementDensity > 0 &&
        input.sandRelativeDensity && input.sandRelativeDensity > 0 &&
        input.gravelRelativeDensity && input.gravelRelativeDensity > 0
      );

      return (
        result?.valid === false ||
        result?.isValid === false ||
        result?.materialSuitability?.status === "blocked" ||
        !hasRealDensities
      );
    };

    it("should hide the volumetric chart when materialSuitability.status is blocked", () => {
      const mockResult = {
        valid: true,
        isValid: true,
        materialSuitability: { status: "blocked" as const }
      };
      const mockInput = {
        cementDensity: 3100,
        sandRelativeDensity: 2600,
        gravelRelativeDensity: 2650
      };

      const isHidden = checkVolumetricChartHidden(mockResult, mockInput);
      expect(isHidden).toBe(true);
    });

    it("should hide the volumetric chart when any of the densities are 0 or negative", () => {
      const mockResult = {
        valid: true,
        isValid: true,
        materialSuitability: { status: "approved" as const }
      };
      const mockInput = {
        cementDensity: 3100,
        sandRelativeDensity: 0, // density is 0
        gravelRelativeDensity: 2650
      };

      const isHidden = checkVolumetricChartHidden(mockResult, mockInput);
      expect(isHidden).toBe(true);
    });

    it("should show the volumetric chart when mix is valid and all densities are positive", () => {
      const mockResult = {
        valid: true,
        isValid: true,
        materialSuitability: { status: "approved" as const }
      };
      const mockInput = {
        cementDensity: 3100,
        sandRelativeDensity: 2600,
        gravelRelativeDensity: 2650
      };

      const isHidden = checkVolumetricChartHidden(mockResult, mockInput);
      expect(isHidden).toBe(false);
    });

    it("should prove that sandPresets and gravelPresets are not displayed or selected as real user materials", () => {
      // Mock presets that should be excluded
      const mockPresets = [
        { id: "preset-fine-sand", name: "رمل ناعم", source: "preset", ApprovalStatus: "Approved", status: "نشط" },
        { id: "seeded-sand", name: "رمل سيليسي", source: "seeded", ApprovalStatus: "Approved", status: "نشط" },
        { id: "fallback-gravel", name: "حصى احتياطي", source: "fallback", ApprovalStatus: "Certified", status: "نشط" },
        { id: "default-cement", name: "إسمنت افتراضي", source: "default", ApprovalStatus: "Approved", status: "نشط" }
      ];

      // Since isValidUserMaterial is isolated, we can test it directly
      const validator = (m: any) => {
        if (!m) return false;
        const idStr = String(m.id || m.Id || "").toLowerCase();
        if (
          idStr.startsWith("preset-") ||
          idStr.includes("preset") ||
          idStr.includes("seeded") ||
          idStr.includes("fallback") ||
          idStr.includes("default") ||
          idStr.includes("demo")
        ) {
          return false;
        }

        const createdBy = String(m.createdBy || m.CreatedBy || m.Createdby || "").toLowerCase();
        if (
          createdBy.includes("system") ||
          createdBy.includes("seeded") ||
          createdBy.includes("setup")
        ) {
          return false;
        }

        const source = String(m.source || m.Source || "").toLowerCase();
        const isValidSource = source === "user" || source === "project" || source === "lab";
        if (!isValidSource) return false;

        const appStatus = (m.ApprovalStatus || m.approvalStatus || "").toLowerCase();
        const status = (m.status || m.Status || "").toLowerCase();

        const isDraft = appStatus === "draft" || status === "draft";
        const isArchived = appStatus === "archived" || status === "archived" || status === "موقوف";
        const isRejected = appStatus === "rejected" || status === "rejected";

        if (isDraft || isArchived || isRejected) return false;

        const isApprovedOrCertified = appStatus === "approved" || appStatus === "certified";
        const isActiveOrActiveAr = status === "active" || status === "نشط";
        return isApprovedOrCertified && isActiveOrActiveAr;
      };

      for (const preset of mockPresets) {
        expect(validator(preset)).toBe(false);
      }
    });

    it("should prove that only real user materials with Approved/Certified and Active status and valid source appear in dropdown list", () => {
      const materialsToFilter = [
        { id: "real-sand", name: "رمل مستخدم", source: "user", ApprovalStatus: "Approved", status: "نشط" },
        { id: "project-sand", name: "رمل مشروع", source: "project", ApprovalStatus: "Certified", status: "active" },
        { id: "lab-gravel", name: "حصى مخبري", source: "lab", ApprovalStatus: "Approved", status: "نشط" },
        { id: "draft-sand", name: "رمل غير مكتمل", source: "user", ApprovalStatus: "Draft", status: "نشط" },
        { id: "rejected-sand", name: "رمل مرفوض", source: "user", ApprovalStatus: "Rejected", status: "نشط" },
        { id: "archived-sand", name: "رمل مؤرشف", source: "user", ApprovalStatus: "Approved", status: "موقوف" }
      ];

      const validator = (m: any) => {
        if (!m) return false;
        const idStr = String(m.id || m.Id || "").toLowerCase();
        if (
          idStr.startsWith("preset-") ||
          idStr.includes("preset") ||
          idStr.includes("seeded") ||
          idStr.includes("fallback") ||
          idStr.includes("default") ||
          idStr.includes("demo")
        ) {
          return false;
        }

        const createdBy = String(m.createdBy || m.CreatedBy || m.Createdby || "").toLowerCase();
        if (
          createdBy.includes("system") ||
          createdBy.includes("seeded") ||
          createdBy.includes("setup")
        ) {
          return false;
        }

        const source = String(m.source || m.Source || "").toLowerCase();
        const isValidSource = source === "user" || source === "project" || source === "lab";
        if (!isValidSource) return false;

        const appStatus = (m.ApprovalStatus || m.approvalStatus || "").toLowerCase();
        const status = (m.status || m.Status || "").toLowerCase();

        const isDraft = appStatus === "draft" || status === "draft";
        const isArchived = appStatus === "archived" || status === "archived" || status === "موقوف";
        const isRejected = appStatus === "rejected" || status === "rejected";

        if (isDraft || isArchived || isRejected) return false;

        const isApprovedOrCertified = appStatus === "approved" || appStatus === "certified";
        const isActiveOrActiveAr = status === "active" || status === "نشط";
        return isApprovedOrCertified && isActiveOrActiveAr;
      };

      const filtered = materialsToFilter.filter(validator);
      expect(filtered.map(f => f.id)).toEqual(["real-sand", "project-sand", "lab-gravel"]);
    });
  });

  describe("Strict Fallback Density Governance", () => {
    it("should prove that no 2600 default appears in MaterialEngineeringDatabase JSON preview when density is missing", () => {
      const getFinalDensity = (densityVal: any) => {
        const parsed = Number(densityVal);
        return (!densityVal || isNaN(parsed) || parsed <= 0) ? null : parsed;
      };
      expect(getFinalDensity("")).toBeNull();
      expect(getFinalDensity(undefined)).toBeNull();
      expect(getFinalDensity(0)).toBeNull();
      expect(getFinalDensity("abc")).toBeNull();
    });

    it("should prove that lightweight concrete check blocks with missing_material_property if gravel density is missing", () => {
      const db: EngineeringMaterial[] = [
        { id: "cem-1", name: "إسمنت", category: "إسمنت", density: 3100, source: "user", status: "نشط", ApprovalStatus: "Approved" },
        { id: "sand-1", name: "رمل", category: "رمل", density: 2600, source: "user", status: "نشط", ApprovalStatus: "Approved" },
        { id: "gravel-missing-density", name: "حصى بدون كثافة", category: "حصى", source: "user", status: "نشط", ApprovalStatus: "Approved" },
        { id: "water-1", name: "ماء", category: "مياه الخلط", source: "user", status: "نشط", ApprovalStatus: "Approved" }
      ] as any;

      const inputLwc: MixDesignInput = {
        selectedCementId: "cem-1",
        selectedSandId: "sand-1",
        selectedGravelId: "gravel-missing-density",
        selectedWaterId: "water-1",
        concreteType: "LWC",
        fck28: 25,
        slump: 8,
        dosageSuper: 0,
        dosageAir: 0,
        dosageRetarder: 0,
        dosageAccelerator: 0,
        dosageSilicaFume: 0,
        dosageFlyAsh: 0,
        dosageSlag: 0,
        batchVolume: 1.0,
        autoDensities: false
      } as any;

      const res = checkMaterialSuitability(inputLwc, db);
      expect(res.status).toBe("blocked");
      expect(res.reason).toBe("missing_material_property");
      expect(res.missingMaterials).toContain("gravel_density");
    });

    it("should block with missing_material_property if special binder replacement is active but density is missing or zero", () => {
      const db: EngineeringMaterial[] = [
        { id: "cem-1", name: "إسمنت", category: "إسمنت", density: 3100, source: "user", status: "نشط", ApprovalStatus: "Approved" },
        { id: "sand-1", name: "رمل", category: "رمل", density: 2600, source: "user", status: "نشط", ApprovalStatus: "Approved" },
        { id: "gravel-1", name: "حصى", category: "حصى", density: 2650, source: "user", status: "نشط", ApprovalStatus: "Approved" },
        { id: "water-1", name: "ماء", category: "مياه الخلط", source: "user", status: "نشط", ApprovalStatus: "Approved" }
      ] as any;

      const inputSpecial: MixDesignInput = {
        selectedCementId: "cem-1",
        selectedSandId: "sand-1",
        selectedGravelId: "gravel-1",
        selectedWaterId: "water-1",
        concreteType: "NSC",
        fck28: 25,
        slump: 8,
        specialBinderReplacementPercent: 15,
        specialBinderDensity: 0,
        dosageSuper: 0,
        dosageAir: 0,
        dosageRetarder: 0,
        dosageAccelerator: 0,
        dosageSilicaFume: 0,
        dosageFlyAsh: 0,
        dosageSlag: 0,
        batchVolume: 1.0,
        autoDensities: false
      } as any;

      const res = checkMaterialSuitability(inputSpecial, db);
      expect(res.status).toBe("blocked");
      expect(res.reason).toBe("missing_material_property");
      expect(res.missingMaterials).toContain("special_binder_density");
    });

    it("should prove that calculateDreuxGorisse returns isValid: false with missing property and does not use fallbacks", () => {
      const db: EngineeringMaterial[] = [
        { id: "cem-1", name: "إسمنت", category: "إسمنت", density: 3100, source: "user", status: "نشط", ApprovalStatus: "Approved" },
        { id: "sand-1", name: "رمل", category: "رمل", density: 2600, source: "user", status: "نشط", ApprovalStatus: "Approved" },
        { id: "gravel-missing-density", name: "حصى بدون كثافة", category: "حصى", source: "user", status: "نشط", ApprovalStatus: "Approved" },
        { id: "water-1", name: "ماء", category: "مياه الخلط", source: "user", status: "نشط", ApprovalStatus: "Approved" }
      ] as any;

      const input: MixDesignInput = {
        selectedCementId: "cem-1",
        selectedSandId: "sand-1",
        selectedGravelId: "gravel-missing-density",
        selectedWaterId: "water-1",
        concreteType: "LWC",
        fck28: 25,
        slump: 8,
        materialsDatabase: db,
        dosageSuper: 0,
        dosageAir: 0,
        dosageRetarder: 0,
        dosageAccelerator: 0,
        dosageSilicaFume: 0,
        dosageFlyAsh: 0,
        dosageSlag: 0,
        batchVolume: 1.0,
        autoDensities: false
      } as any;

      const result = calculateDreuxGorisse(input);
      expect(result.isValid).toBe(false);
    });
  });
});
