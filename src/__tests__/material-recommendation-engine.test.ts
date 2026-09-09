import { describe, it, expect, beforeEach, vi } from "vitest";
import { determineMaterialRequirements } from "../services/materialRequirementEngine";
import { evaluateMaterialCompatibility } from "../services/materialCompatibilityEngine";
import { generateMaterialRecommendations } from "../services/materialRecommendationEngine";
import { recordEngineerApproval, getStoredApprovals } from "../services/materialApprovalService";
import { EngineeringMaterial } from "../types";

// Polyfill localStorage for node test environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0
} as any;

const mockMaterials: EngineeringMaterial[] = [
  {
    id: "cem-52.5-1",
    name: "إسمنت بورتلاندي نقي CEM I 52.5 R",
    englishName: "Portland Cement CEM I 52.5 R",
    type: "cement",
    category: "إسمنت",
    density: 3150,
    specificGravity: 3.15,
    strengthClass: "52.5",
    cementClass: "CEM I",
    quality: "excellent",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "UHPC, HSC, Precast",
    desc: "High-grade cement",
    rating: 5,
    provenance: "Chlef",
    isSystem: true
  },
  {
    id: "cem-42.5-1",
    name: "إسمنت بورتلاندي مركب CEM II/A-L 42.5 N",
    englishName: "Portland Composite Cement CEM II 42.5",
    type: "cement",
    category: "إسمنت",
    density: 3100,
    specificGravity: 3.10,
    strengthClass: "42.5",
    cementClass: "CEM II",
    quality: "standard",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "NSC, Structures",
    desc: "Standard cement",
    rating: 4,
    provenance: "Meftah",
    isSystem: true
  },
  {
    id: "sand-micro-1",
    name: "رمل سيليسي ناعم جداً ميكروي (0-1 مم)",
    englishName: "Micro Siliceous Sand (0-1 mm)",
    type: "sand",
    category: "رمال",
    density: 2650,
    bulkDensity: 1500,
    specificGravity: 2.65,
    finenessModulus: 1.8,
    dMax: 1.0,
    sandEquivalent: 90,
    absorption: 0.8,
    moisture: 0.2,
    quality: "excellent",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "UHPC, Mortars",
    desc: "Ultra fine quartz sand",
    rating: 5,
    provenance: "Boussaada",
    isSystem: true
  },
  {
    id: "sand-std-1",
    name: "رمل وادي طبيعي متدرج (0-4 مم)",
    englishName: "Wadi Natural Sand (0-4 mm)",
    type: "sand",
    category: "رمال",
    density: 2600,
    bulkDensity: 1550,
    specificGravity: 2.60,
    finenessModulus: 2.6,
    dMax: 4.0,
    sandEquivalent: 78,
    absorption: 1.5,
    moisture: 1.0,
    quality: "standard",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "NSC, Concrete",
    desc: "River sand",
    rating: 4,
    provenance: "Oued Souf",
    isSystem: true
  },
  {
    id: "gravel-15-1",
    name: "حصى مكسر متدرج 8/15 مم (Dmax 15mm)",
    englishName: "Crushed Gravel 8/15 mm",
    type: "gravel",
    category: "حصى",
    density: 2680,
    bulkDensity: 1480,
    specificGravity: 2.68,
    dMax: 15.0,
    particleShape: "مكسر",
    absorption: 0.9,
    moisture: 0.5,
    losAngelesAbrasion: 18,
    quality: "excellent",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "SCC, HSC",
    desc: "High quality crushed gravel",
    rating: 5,
    provenance: "Bouira",
    isSystem: true
  },
  {
    id: "gravel-25-1",
    name: "حصى مكسر كبير 15/25 مم (Dmax 25mm)",
    englishName: "Coarse Gravel 15/25 mm",
    type: "gravel",
    category: "حصى",
    density: 2650,
    bulkDensity: 1450,
    specificGravity: 2.65,
    dMax: 25.0,
    particleShape: "مكسر",
    absorption: 1.1,
    moisture: 0.8,
    losAngelesAbrasion: 22,
    quality: "standard",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "NSC, Mass Concrete",
    desc: "Large gravel",
    rating: 4,
    provenance: "Mascara",
    isSystem: true
  },
  {
    id: "water-1",
    name: "مياه شرب نقية للمختبر",
    englishName: "Potable Mixing Water",
    type: "water",
    category: "ماء",
    density: 1000,
    ph: 7.2,
    quality: "excellent",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "All concrete",
    desc: "Potable water",
    rating: 5,
    provenance: "Tap",
    isSystem: true
  },
  {
    id: "admix-pce-1",
    name: "ملدن فائق عالي الكفاءة بولي كربوكسيل (PCE Superplasticizer)",
    englishName: "High-Range PCE Superplasticizer",
    type: "admixture",
    category: "إضافات كيميائية",
    admixtureType: "superplasticizer",
    density: 1.08,
    waterReduction: 32,
    recommendedDosage: 1.5,
    quality: "excellent",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "UHPC, SCC, HSC",
    desc: "PCE Superplasticizer",
    rating: 5,
    provenance: "Sika",
    isSystem: true
  },
  {
    id: "scm-silica-1",
    name: "غبار سيليكا فائق النعومة (Silica Fume 95% SiO2)",
    englishName: "Densified Silica Fume 95%",
    type: "scm",
    category: "إضافات معدنية",
    density: 2200,
    silicaContent: 95,
    pozzolanicIndex: 115,
    quality: "excellent",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "UHPC, HPC",
    desc: "Active pozzolanic micro-silica",
    rating: 5,
    provenance: "Norway",
    isSystem: true
  } as any,
  {
    id: "fiber-steel-1",
    name: "ألياف فولاذية دقيقة مستقيمة فائقة المقاومة (Micro Steel Fibers)",
    englishName: "High-Strength Micro Steel Fibers",
    type: "fiber",
    category: "ألياف",
    fiberType: "steel",
    density: 7850,
    tensileStrength: 2600,
    quality: "excellent",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "UHPC, BFUP, FRC",
    desc: "Micro steel fibers for ductile UHPC",
    rating: 5,
    provenance: "Bekaert",
    isSystem: true
  } as any,
  {
    id: "lw-pumice-1",
    name: "حجر خفاف بركاني مسامي خفيف (Pumice)",
    englishName: "Lightweight Volcanic Pumice",
    type: "lightweightAggregate",
    category: "ركام خفيف",
    density: 1100,
    specificGravity: 1.10,
    absorption: 18,
    quality: "standard",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "LWC",
    desc: "Lightweight aggregate",
    rating: 4,
    provenance: "Tamanrasset",
    isSystem: true
  },
  {
    id: "hw-barite-1",
    name: "ركام باريت طبيعي عالي الكثافة (Barite BaSO4)",
    englishName: "High-Density Heavy Barite Aggregate",
    type: "heavyweightAggregate",
    category: "ركام ثقيل",
    density: 4100,
    specificGravity: 4.10,
    absorption: 0.4,
    quality: "excellent",
    status: "نشط",
    approvalStatus: "Approved",
    uses: "HWC, Radiation Shielding",
    desc: "Radiation shield aggregate",
    rating: 5,
    provenance: "Ain Defla",
    isSystem: true
  },
  {
    id: "mat-incomplete-1",
    name: "مادة غير مكتملة الخواص (بدون كثافة)",
    englishName: "Incomplete User Material",
    type: "cement",
    category: "إسمنت",
    density: 0,
    quality: "poor",
    status: "نشط",
    approvalStatus: "Draft",
    uses: "Test",
    desc: "Incomplete test material",
    rating: 1,
    provenance: "Test",
    isSystem: false
  }
];

describe("Material Requirement Engine", () => {
  it("determines proper mandatory roles for NSC", () => {
    const plan = determineMaterialRequirements({
      concreteType: "NSC",
      mixDesignMethod: "dreux",
      targetStrength: 25,
      maxAggregateSize: 20
    });

    expect(plan.concreteType).toBe("NSC");
    const cement = plan.roles.find(r => r.role === "cement");
    const sand = plan.roles.find(r => r.role === "sand");
    const gravel = plan.roles.find(r => r.role === "gravel");
    const water = plan.roles.find(r => r.role === "water");
    const admix = plan.roles.find(r => r.role === "admixture");

    expect(cement?.requirementType).toBe("mandatory");
    expect(sand?.requirementType).toBe("mandatory");
    expect(gravel?.requirementType).toBe("mandatory");
    expect(water?.requirementType).toBe("mandatory");
    expect(admix?.requirementType).toBe("optional");
  });

  it("determines strict mandatory constituents for UHPC / BFUP", () => {
    const plan = determineMaterialRequirements({
      concreteType: "UHPC",
      mixDesignMethod: "aitcin",
      targetStrength: 150,
      maxAggregateSize: 2
    });

    const cement = plan.roles.find(r => r.role === "cement");
    const sand = plan.roles.find(r => r.role === "sand");
    const gravel = plan.roles.find(r => r.role === "gravel");
    const admix = plan.roles.find(r => r.role === "admixture");
    const scm = plan.roles.find(r => r.role === "scm");
    const fiber = plan.roles.find(r => r.role === "fiber");

    expect(cement?.requirementType).toBe("mandatory");
    expect(cement?.constraints?.minStrengthClass).toBe(52.5);
    expect(sand?.requirementType).toBe("mandatory");
    expect(gravel?.requirementType).toBe("forbidden"); // No coarse gravel in UHPC
    expect(admix?.requirementType).toBe("mandatory");
    expect(scm?.requirementType).toBe("mandatory");
    expect(scm?.constraints?.preferredScmType).toBe("silica_fume");
    expect(fiber?.requirementType).toBe("mandatory");
    expect(fiber?.constraints?.preferredFiberType).toBe("steel");
  });

  it("handles SCC Dmax limitation and mandatory high-flow PCE", () => {
    const plan = determineMaterialRequirements({
      concreteType: "SCC",
      mixDesignMethod: "dreux",
      targetStrength: 35,
      maxAggregateSize: 15
    });

    const gravel = plan.roles.find(r => r.role === "gravel");
    const admix = plan.roles.find(r => r.role === "admixture");

    expect(gravel?.constraints?.maxDmax).toBe(16);
    expect(admix?.requirementType).toBe("mandatory");
    expect(admix?.constraints?.preferredAdmixtureType).toBe("superplasticizer");
  });

  it("handles LWC lightweight aggregate and forbids normal gravel", () => {
    const plan = determineMaterialRequirements({
      concreteType: "LWC",
      mixDesignMethod: "dreux",
      targetStrength: 20
    });

    const gravel = plan.roles.find(r => r.role === "gravel");
    const lw = plan.roles.find(r => r.role === "lightweightAggregate");

    expect(gravel?.requirementType).toBe("forbidden");
    expect(lw?.requirementType).toBe("mandatory");
  });

  it("handles HWC heavyweight aggregate for radiation shielding", () => {
    const plan = determineMaterialRequirements({
      concreteType: "HWC",
      mixDesignMethod: "dreux",
      targetStrength: 30
    });

    const gravel = plan.roles.find(r => r.role === "gravel");
    const hw = plan.roles.find(r => r.role === "heavyweightAggregate");

    expect(gravel?.requirementType).toBe("forbidden");
    expect(hw?.requirementType).toBe("mandatory");
    expect(hw?.constraints?.targetDensityMin).toBe(3000);
  });
});

describe("Material Recommendation Engine", () => {
  it("generates recommendation for HSC with high-grade cement and aggregate", () => {
    const recResult = generateMaterialRecommendations(
      mockMaterials,
      {
        concreteType: "HSC",
        mixDesignMethod: "dreux",
        targetStrength: 60,
        maxAggregateSize: 15
      }
    );

    expect(recResult.isReadyForMix).toBe(true);
    expect(recResult.overallCompatibilityScore).toBeGreaterThanOrEqual(80);

    const cementCandidate = recResult.roleGroups.cement?.topCandidate;
    expect(cementCandidate?.material.id).toBe("cem-52.5-1");
    expect(cementCandidate?.compatibilityScore).toBeGreaterThanOrEqual(85);
  });

  it("identifies ineligible gravel when Dmax exceeds 16mm limit for SCC", () => {
    const recResult = generateMaterialRecommendations(
      mockMaterials,
      {
        concreteType: "SCC",
        mixDesignMethod: "dreux",
        targetStrength: 35,
        maxAggregateSize: 15
      }
    );

    const topGravel = recResult.roleGroups.gravel.topCandidate;
    expect(topGravel?.material.id).toBe("gravel-15-1");
    expect(topGravel?.compatibilityScore).toBeGreaterThanOrEqual(80);

    // Check all gravel candidates
    const allGravelCandidates = [
      ...recResult.roleGroups.gravel.recommended,
      ...recResult.roleGroups.gravel.alternatives,
      ...recResult.roleGroups.gravel.ineligible
    ];

    const gravel25Candidate = allGravelCandidates.find(c => c.material.id === "gravel-25-1");
    expect(gravel25Candidate).toBeDefined();
    expect(gravel25Candidate?.tier).toBe("not_eligible");
  });

  it("marks incomplete materials as ineligible with clear failure reason", () => {
    const recResult = generateMaterialRecommendations(
      mockMaterials,
      {
        concreteType: "NSC",
        mixDesignMethod: "dreux",
        targetStrength: 25
      }
    );

    const incompleteMat = recResult.roleGroups.cement.ineligible.find(c => c.material.id === "mat-incomplete-1");
    expect(incompleteMat).toBeDefined();
    expect(incompleteMat?.tier).toBe("not_eligible");
    expect(incompleteMat?.eligibility.eligible).toBe(false);
  });
});

describe("Material Approval Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records engineer approval with signature hash and audit log", () => {
    const record = recordEngineerApproval({
      concreteType: "HSC",
      mixDesignMethod: "dreux",
      targetStrength: 60,
      engineerName: "Dr. Karim Mansouri",
      engineerTitle: "Lead Materials Consultant",
      notes: "Lab-tested cylinders verified. Approved for pouring.",
      status: "approved",
      approvedMaterials: [
        {
          role: "cement",
          materialId: "cem-52.5-1",
          materialName: "CEM I 52.5 R",
          compatibilityScore: 95
        }
      ]
    });

    expect(record.approvalId).toMatch(/^APPR-/);
    expect(record.signatureHash).toMatch(/^SIG-/);
    expect(record.engineerName).toBe("Dr. Karim Mansouri");

    const stored = getStoredApprovals();
    expect(stored.length).toBe(1);
    expect(stored[0].approvalId).toBe(record.approvalId);
  });
});
