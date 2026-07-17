import { describe, it, expect } from "vitest";
import { checkMaterialSuitability } from "../engine/suitabilityGate";
import { calculateDreuxGorisse } from "../utils";
import { validateMixInputs } from "../engine/validateInputs";
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
  bypassSuitabilityGate: false,
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

describe("Engine Clear Error Messages Validation Tests", () => {
  describe("1. Required Material Selection Checks", () => {
    it("should return a blocked status with clear Arabic warning when any basic material is not selected", () => {
      const db = getValidUserMaterials();

      const scenarios = [
        { key: "selectedCementId", label: "cement" },
        { key: "selectedSandId", label: "sand" },
        { key: "selectedGravelId", label: "gravel" },
        { key: "selectedWaterId", label: "water" }
      ];

      for (const scenario of scenarios) {
        const input = getMockInput({
          [scenario.key]: ""
        });

        const suitability = checkMaterialSuitability(input, db);
        expect(suitability.status).toBe("blocked");
        expect(suitability.reason).toBe("missing_user_materials");
        expect(suitability.missingMaterials).toContain(scenario.label);
        expect(suitability.warnings[0]).toContain("لا يمكن حساب الخلطة قبل إدخال مواد المشروع في مستودع المواد وتفعيلها.");
        expect(suitability.recommendations[0]).toContain("أدخل مواد المشروع أولًا في مستودع المواد");
      }
    });

    it("should block and output a clear warning when using non-user (mock/system) materials", () => {
      const db = [
        {
          id: "seeded-cem-1",
          name: "إسمنت افتراضي",
          englishName: "Default Cement",
          category: "إسمنت",
          type: "cementitious",
          ApprovalStatus: "Approved",
          status: "نشط",
          createdBy: "system"
        },
        ...getValidUserMaterials().slice(1) // Include valid sand, gravel, water
      ] as any;

      const input = getMockInput({
        selectedCementId: "seeded-cem-1"
      });

      const suitability = checkMaterialSuitability(input, db);
      expect(suitability.status).toBe("blocked");
      expect(suitability.reason).toBe("non_user_material_source");
      expect(suitability.warnings[0]).toContain("المواد المستخدمة غير صالحة، يرجى عدم استخدام المواد الافتراضية أو التوضيحية.");
    });
  });

  describe("2. Missing Properties Checks based on Concrete Type", () => {
    it("should block lightweight concrete (LWC) calculation with clear Arabic warning if coarse aggregate density is missing", () => {
      const db = getValidUserMaterials();
      // Remove density from gravel
      const badGravel = db.find(m => m.id === "user-grav") as any;
      if (badGravel) {
        delete badGravel.density;
        delete badGravel.specificGravity;
      }

      const input = getMockInput({
        concreteType: "LWC"
      });

      const suitability = checkMaterialSuitability(input, db);
      expect(suitability.status).toBe("blocked");
      expect(suitability.reason).toBe("missing_material_property");
      expect(suitability.missingMaterials).toContain("gravel_density");
      expect(suitability.warnings[0]).toContain("كثافة الركام الخشن غير متوفرة. الخرسانة خفيفة الوزن تتطلب ركام خفيف حقيقي بكثافة محددة.");
      expect(suitability.recommendations[0]).toContain("يرجى إدخال كثافة صحيحة للركام الخشن.");
    });

    it("should block heavyweight concrete (HWC) calculation with clear Arabic warning if coarse aggregate density is missing", () => {
      const db = getValidUserMaterials();
      // Remove density from gravel
      const badGravel = db.find(m => m.id === "user-grav") as any;
      if (badGravel) {
        delete badGravel.density;
      }

      const input = getMockInput({
        concreteType: "HWC"
      });

      const suitability = checkMaterialSuitability(input, db);
      expect(suitability.status).toBe("blocked");
      expect(suitability.reason).toBe("missing_material_property");
      expect(suitability.missingMaterials).toContain("gravel_density");
      expect(suitability.warnings[0]).toContain("كثافة الركام الخشن غير متوفرة. الخرسانة ثقيلة الوزن تتطلب ركاماً ثقيل الكثافة بكثافة محددة.");
    });

    it("should block high-strength concrete (HSC) calculation with clear Arabic warning if superplasticizer dosage is missing", () => {
      const db = getValidUserMaterials();
      const input = getMockInput({
        concreteType: "HSC",
        dosageSuper: 0 // Missing dosage
      });

      const suitability = checkMaterialSuitability(input, db);
      expect(suitability.status).toBe("blocked");
      expect(suitability.reason).toBe("invalid_material_status");
      expect(suitability.warnings[0]).toContain("الخرسانة عالية المقاومة (HSC) تتطلب جرعة ملدن فائق (Superplasticizer) أكبر من الصفر.");
    });

    it("should block self-consolidating concrete (SCC) calculation with clear Arabic warning if superplasticizer is not selected", () => {
      const db = getValidUserMaterials();
      const input = getMockInput({
        concreteType: "SCC",
        selectedAdmixtureId: "" // No superplasticizer selected
      });

      const suitability = checkMaterialSuitability(input, db);
      expect(suitability.status).toBe("blocked");
      expect(suitability.reason).toBe("missing_user_materials");
      expect(suitability.warnings[0]).toContain("الخرسانة ذاتية الرص (SCC) تتطلب ملدناً فائقاً معتمداً من مستودع المستخدم.");
    });

    it("should block fiber-reinforced concrete (FRC) calculation with clear Arabic warning if fiber is not selected", () => {
      const db = getValidUserMaterials();
      const input = getMockInput({
        concreteType: "FRC",
        selectedFiberId: "" // No fiber selected
      });

      const suitability = checkMaterialSuitability(input, db);
      expect(suitability.status).toBe("blocked");
      expect(suitability.reason).toBe("missing_user_materials");
      expect(suitability.warnings[0]).toContain("لم يتم اختيار ألياف معتمدة من مستودع المستخدم لتصميم الخرسانة المسلحة بالألياف (FRC).");
    });

    it("should block geopolymer concrete (GPC) calculation with clear Arabic warning if conventional Portland cement is selected", () => {
      const db = getValidUserMaterials();
      const input = getMockInput({
        concreteType: "GPC"
      });

      const suitability = checkMaterialSuitability(input, db);
      expect(suitability.status).toBe("blocked");
      expect(suitability.reason).toBe("invalid_material_status");
      expect(suitability.warnings[0]).toContain("يمنع استخدام الإسمنت البورتلاندي التقليدي في الخرسانة الجيوبوليمرية (GPC).");
    });
  });

  describe("3. Input Validation Range Checks", () => {
    it("should return a clear Arabic warning when slump is out of range", () => {
      const input = getMockInput({
        slump: 45 // out of range 0 - 40 cm
      });

      const validation = validateMixInputs(input, "ar");
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("قيمة الهبوط Slump يجب أن تكون بين 0 و 40 سم.");
    });

    it("should return a clear Arabic warning when fck28 is out of range", () => {
      const input = getMockInput({
        fck28: 200 // out of range 5 - 150 MPa
      });

      const validation = validateMixInputs(input, "ar");
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("مقاومة الضغط المميزة fck28 المطلوبة يجب أن تقع بين 5 و 150 ميجاباسكال.");
    });

    it("should return a clear Arabic warning when sand specific gravity is out of range", () => {
      const input = getMockInput({
        sandRelativeDensity: 4.5 // out of range 1.5 - 3.5
      });

      const validation = validateMixInputs(input, "ar");
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("الكثافة النوعية للرمال للرمل (Sand Specific Gravity) غير منطقية هندسياً (يجب أن تقع بين 1.5 و 3.5).");
    });
  });
});
