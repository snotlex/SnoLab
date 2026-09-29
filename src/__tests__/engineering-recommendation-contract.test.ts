import { describe, expect, it } from "vitest";
import {
  buildRecommendedDosagePlan,
  toMaterialRecommendationScore
} from "../services/materialRecommendationEngine";

const material = (overrides: Record<string, unknown> = {}) => ({
  id: "MAT-1",
  name: "مادة مسجلة",
  englishName: "Registered material",
  type: "admixture",
  category: "إضافات كيميائية",
  quality: "excellent",
  uses: "SCC",
  desc: "",
  rating: 5,
  provenance: "lab",
  status: "نشط",
  approvalStatus: "Approved",
  isSystem: true,
  ...overrides
}) as any;

describe("engineering recommendation contract", () => {
  it("does not invent an SCM dosage when the library omits the replacement limit", () => {
    const result = {
      requirementPlan: { concreteType: "HPC", targetStrength: 60 },
      recommendedSet: { scm: material({ id: "SCM-1", name: "SCM", type: "scm", category: "إضافات معدنية" }) },
    } as any;

    const plan = buildRecommendedDosagePlan(result, { concreteType: "HPC", targetStrength: 60 });

    expect(plan.mineralAdmixture).toBeUndefined();
    expect(plan.warnings.some((warning: string) => warning.includes("الحد الأقصى للاستبدال"))).toBe(true);
  });

  it("does not invent an admixture dosage when the library omits the recommended dosage", () => {
    const result = {
      requirementPlan: { concreteType: "SCC", targetStrength: 40 },
      recommendedSet: { admixture: material() },
    } as any;

    const plan = buildRecommendedDosagePlan(result, { concreteType: "SCC", targetStrength: 40 });

    expect(plan.chemicalAdmixture).toBeUndefined();
    expect(plan.warnings.some((warning: string) => warning.includes("الجرعة الموصى بها"))).toBe(true);
  });

  it("maps eligibility and compatibility into an auditable score contract", () => {
    const score = toMaterialRecommendationScore({
      material: material({ id: "CEM-1" }),
      role: "cement",
      compatibilityScore: 82,
      tier: "recommended",
      justificationAr: "متوافق مع المتطلبات.",
      warnings: [],
      eligibility: {
        eligible: true,
        incompatibleWithConcreteType: false,
        missingProperties: [],
        invalidProperties: [],
      }
    } as any);

    expect(score).toEqual(expect.objectContaining({
      materialId: "CEM-1",
      role: "cement",
      score: 82,
      status: "recommended",
      missingProperties: [],
      failedRules: []
    }));
  });
});
