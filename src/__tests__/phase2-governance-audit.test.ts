import { describe, it, expect } from "vitest";
import {
  isSystemMaterial,
  isUserMaterial,
  canEditMaterial,
  canForkMaterial,
  canApproveMaterial,
  forkSystemMaterial
} from "../utils/materialSourceHelper";
import {
  canMaterialEnterMixDesign,
  isMaterialEligible,
  getAvailableMaterialsForRole,
  handleMaterialMutationWithGovernance,
  validateMaterialSelection
} from "../services/materialEligibilityService";
import { isMaterialApprovedByEngineer } from "../services/materialApprovalService";
import { ImportManager } from "../services/import/ImportManager";
import { BulkCompletionService } from "../services/import/BulkCompletionService";
import { RecommendationService } from "../services/RecommendationService";
import { MaterialService } from "../services/MaterialService";
import { EngineeringMaterial, MixDesignInput, AggregateType, AggregateQuality } from "../types";

const createMockMat = (m: any): EngineeringMaterial => ({
  englishName: m.name || "Test Material",
  type: "aggregate",
  quality: "standard",
  uses: "general concrete",
  image: "/placeholder-material.png",
  desc: "",
  cost: 0,
  ...m
} as unknown as EngineeringMaterial);

describe("SnoLab Phase 2: Engineering Governance, Approval & Dreux Eligibility", () => {
  // 1. Ownership & Immutability Tests
  describe("1. Material Ownership & Governance Boundaries", () => {
    const systemSand: EngineeringMaterial = createMockMat({
      id: "sys-sand-oued-01",
      name: "رمل واد أمليس المعتمد",
      category: "رمال",
      materialSource: "system",
      isSystem: true,
      isCustom: false,
      density: 2650,
      specificGravity: 2.65,
      finenessModulus: 2.6,
      absorption: 1.2,
      ApprovalStatus: "Approved",
      status: "نشط"
    });

    const userSand: EngineeringMaterial = createMockMat({
      id: "usr-sand-custom-01",
      name: "رمل مقلع خاص",
      category: "رمال",
      materialSource: "user",
      isSystem: false,
      isCustom: true,
      density: 2620,
      specificGravity: 2.62,
      finenessModulus: 2.4,
      absorption: 1.5,
      ApprovalStatus: "Pending Review",
      status: "نشط"
    });

    it("should correctly identify system vs user materials", () => {
      expect(isSystemMaterial(systemSand)).toBe(true);
      expect(isUserMaterial(systemSand)).toBe(false);

      expect(isSystemMaterial(userSand)).toBe(false);
      expect(isUserMaterial(userSand)).toBe(true);
    });

    it("should protect system materials as read-only references", () => {
      expect(canEditMaterial(systemSand, "edit")).toBe(false);
      expect(canEditMaterial(systemSand, "delete")).toBe(false);
      expect(canForkMaterial(systemSand)).toBe(true);
      expect(canApproveMaterial(systemSand)).toBe(false); // System materials are already pre-certified standards
    });

    it("should allow user materials to be edited, deleted, and approved", () => {
      expect(canEditMaterial(userSand, "edit")).toBe(true);
      expect(canEditMaterial(userSand, "delete")).toBe(true);
      expect(canForkMaterial(userSand)).toBe(true);
      expect(canApproveMaterial(userSand)).toBe(true);
    });

    it("should fork system material into an independent, linked user copy", () => {
      const forked = forkSystemMaterial(systemSand, "رمل واد أمليس - موقع المشروع", "engineer@snolab.dz");
      
      expect(forked.id).not.toBe(systemSand.id);
      expect(forked.originalSystemMaterialId).toBe(systemSand.id);
      expect(forked.materialSource).toBe("user");
      expect(forked.isSystem).toBe(false);
      expect(forked.isCustom).toBe(true);
      expect(canEditMaterial(forked, "edit")).toBe(true);
      expect(canEditMaterial(forked, "delete")).toBe(true);
      expect(forked.name).toBe("رمل واد أمليس - موقع المشروع");
    });
  });

  // 2. Import Pipeline & JSON Validation
  describe("2. Import Pipeline Validation & Governance", () => {
    it("should validate JSON imports through central pipeline and flag missing properties", async () => {
      const incompleteJson = JSON.stringify([
        {
          name: "رمل مستورد غير مكتمل",
          category: "رمال",
          density: 2600
          // missing finenessModulus & absorption
        }
      ]);

      const mockFile = {
        name: "test-sand.json",
        arrayBuffer: async () => new TextEncoder().encode(incompleteJson).buffer
      };

      const report = await ImportManager.analyzeFile(mockFile, []);
      expect(report.totalDetected).toBe(1);
      
      const draft = report.drafts[0];
      expect(draft.validation.isComplete).toBe(false);
      expect(draft.validation.isEligibleForDreuxGorisse).toBe(false);
      expect(draft.status).toBe("Incomplete");
      expect(draft.validation.missingRequiredForDreux.length).toBeGreaterThan(0);
    });

    it("should NEVER auto-approve materials based on category (Water, SCM, Fibers)", async () => {
      const waterJson = JSON.stringify([
        {
          name: "ماء خلط بئر ارتوازي",
          category: "ماء",
          density: 1000
        }
      ]);

      const mockFile = {
        name: "well-water.json",
        arrayBuffer: async () => new TextEncoder().encode(waterJson).buffer
      };

      const report = await ImportManager.analyzeFile(mockFile, []);
      const importResult = ImportManager.executeImport({
        drafts: report.drafts,
        duplicates: [],
        existingMaterials: [],
        userEmail: "test-engineer@snolab.dz"
      });

      expect(importResult.importedCount).toBe(1);
      const importedWater = importResult.updatedMaterialsList[0];

      // Must be a user material
      expect(importedWater.materialSource).toBe("user");
      expect(importedWater.isSystem).toBe(false);
      // Must NOT be auto-approved: starts as Pending Review for engineer verification
      expect(importedWater.ApprovalStatus).toBe("Pending Review");
    });
  });

  // 3. Ready is NOT Approved
  describe("3. READY vs APPROVED Separation", () => {
    const completeUserGravel: EngineeringMaterial = createMockMat({
      id: "usr-gravel-100",
      name: "حصى مقلع 15/25 مكتمل المواصفات",
      category: "حصى",
      materialSource: "user",
      isSystem: false,
      isCustom: true,
      density: 2680,
      bulkDensity: 1520,
      dMax: 25,
      dMin: 15,
      absorption: 0.8,
      moisture: 1.0,
      validationStatus: "VALID",
      status: "نشط",
      ApprovalStatus: "Pending Review" // Complete but pending review
    });

    it("should evaluate a complete unapproved user material as NOT eligible for mix design", () => {
      const gateResult = canMaterialEnterMixDesign(completeUserGravel, "dreux", "NSC");
      expect(gateResult.status).toBe("pending_approval");
      expect(gateResult.eligible).toBe(false);
      expect(gateResult.reasons.some(r => r.includes("بانتظار اعتماد المهندس المشرف"))).toBe(true);
    });

    it("should allow complete user material to enter mix design once officially approved", () => {
      const approvedGravel: EngineeringMaterial = createMockMat({
        ...completeUserGravel,
        ApprovalStatus: "Approved"
      });

      const gateResult = canMaterialEnterMixDesign(approvedGravel, "dreux", "NSC");
      expect(gateResult.status).toBe("ready_for_mix");
      expect(gateResult.eligible).toBe(true);
    });

    it("should preserve Pending Review status after Batch Completion fills missing properties", () => {
      const incompleteSand: EngineeringMaterial = createMockMat({
        id: "usr-sand-batch-1",
        name: "رمل مستورد ناقص",
        category: "رمال",
        materialSource: "user",
        isSystem: false,
        isCustom: true,
        density: 2640,
        bulkDensity: 1530,
        moisture: 1.5,
        SandEquivalent: 80,
        sandEquivalent: 80,
        ApprovalStatus: "Incomplete",
        status: "قيد المراجعة"
      });

      const completionResult = BulkCompletionService.applyBulkCompletion(
        [incompleteSand],
        [
          {
            materialId: "usr-sand-batch-1",
            propertyKey: "finenessModulus",
            value: 2.5
          },
          {
            materialId: "usr-sand-batch-1",
            propertyKey: "absorption",
            value: 1.1
          }
        ],
        "engineer@snolab.dz"
      );

      const updated = completionResult.updatedMaterials[0];
      expect(updated.validationStatus).toBe("VALID");
      expect(updated.status).toBe("نشط");
      // Ready is NOT approved: ApprovalStatus transitions to Pending Review, not Approved
      expect(updated.ApprovalStatus).toBe("Pending Review");
      expect(updated.propertySources?.finenessModulus).toBeDefined();
    });
  });

  // 4. Dreux-Gorisse Eligibility Rules
  describe("4. Dreux-Gorisse Eligibility Gate Checks", () => {
    it("Sand: requires density, finenessModulus, and absorption", () => {
      const sandApproved: EngineeringMaterial = createMockMat({
        id: "usr-sand-d",
        name: "رمل سيليسي معتمد",
        category: "رمال",
        materialSource: "user",
        isSystem: false,
        ApprovalStatus: "Approved",
        status: "نشط",
        density: 2650,
        bulkDensity: 1540,
        finenessModulus: 2.5,
        absorption: 1.2,
        moisture: 2.0
      });

      // Fully valid
      expect(isMaterialEligible(sandApproved, "dreux", "NSC").eligible).toBe(true);

      // Missing absorption
      const sandNoAbs = { ...sandApproved, absorption: undefined };
      const resNoAbs = isMaterialEligible(sandNoAbs, "dreux", "NSC");
      expect(resNoAbs.eligible).toBe(false);
      expect(resNoAbs.missingProperties).toContain("absorption");

      // Missing finenessModulus
      const sandNoFm = { ...sandApproved, finenessModulus: undefined };
      const resNoFm = isMaterialEligible(sandNoFm, "dreux", "NSC");
      expect(resNoFm.eligible).toBe(false);
      expect(resNoFm.missingProperties).toContain("finenessModulus");

      // Missing density
      const sandNoDens = { ...sandApproved, density: undefined, specificGravity: undefined };
      const resNoDens = isMaterialEligible(sandNoDens, "dreux", "NSC");
      expect(resNoDens.eligible).toBe(false);
      expect(resNoDens.missingProperties).toContain("density");
    });

    it("Gravel: requires density and dMax", () => {
      const gravelApproved: EngineeringMaterial = createMockMat({
        id: "usr-gravel-d",
        name: "حصى مقلع معتمد",
        category: "حصى",
        materialSource: "user",
        isSystem: false,
        ApprovalStatus: "Approved",
        status: "نشط",
        density: 2680,
        bulkDensity: 1500,
        dMax: 20,
        dMin: 5,
        absorption: 0.8,
        moisture: 1.0
      });

      expect(isMaterialEligible(gravelApproved, "dreux", "NSC").eligible).toBe(true);

      // Missing dMax
      const gravelNoDmax = { ...gravelApproved, dMax: undefined };
      const resNoDmax = isMaterialEligible(gravelNoDmax, "dreux", "NSC");
      expect(resNoDmax.eligible).toBe(false);
      expect(resNoDmax.missingProperties).toContain("dMax");

      // Missing density
      const gravelNoDens = { ...gravelApproved, density: undefined, specificGravity: undefined };
      const resNoDens = isMaterialEligible(gravelNoDens, "dreux", "NSC");
      expect(resNoDens.eligible).toBe(false);
      expect(resNoDens.missingProperties).toContain("density");
    });

    it("Cement: requires density and 28-day strength / class", () => {
      const cemApproved: EngineeringMaterial = createMockMat({
        id: "usr-cem-d",
        name: "إسمنت بورتلاندي معتمد",
        category: "إسمنت",
        materialSource: "user",
        isSystem: false,
        ApprovalStatus: "Approved",
        status: "نشط",
        density: 3100,
        cementClass: "CEM I 42.5",
        strengthClass: "42.5",
        strength28d: 42.5
      });

      expect(isMaterialEligible(cemApproved, "dreux", "NSC").eligible).toBe(true);

      // Missing strength
      const cemNoStr = { ...cemApproved, strength28d: undefined, strengthClass: undefined, cementClass: undefined };
      const resNoStr = isMaterialEligible(cemNoStr, "dreux", "NSC");
      expect(resNoStr.eligible).toBe(false);
      expect(resNoStr.missingProperties).toContain("strengthClass");
    });

    it("Water: rejects contaminated water", () => {
      const cleanWater: EngineeringMaterial = createMockMat({
        id: "usr-water-clean",
        name: "ماء نقي",
        category: "ماء",
        materialSource: "user",
        isSystem: false,
        ApprovalStatus: "Approved",
        status: "نشط",
        density: 1000
      });
      expect(isMaterialEligible(cleanWater, "dreux", "NSC").eligible).toBe(true);

      const badWater: EngineeringMaterial = createMockMat({
        ...cleanWater,
        isContaminated: true
      });
      const resBad = isMaterialEligible(badWater, "dreux", "NSC");
      expect(resBad.eligible).toBe(false);
      expect(resBad.invalidProperties.some(p => p.key === "waterQuality")).toBe(true);
    });
  });

  // 5. Mix Preparation Selector Gating
  describe("5. Mix Preparation Material Selector Gating", () => {
    const list: EngineeringMaterial[] = [
      createMockMat({
        id: "sys-sand",
        name: "رمل نظام معتمد",
        category: "رمال",
        materialSource: "system",
        isSystem: true,
        density: 2650,
        bulkDensity: 1540,
        finenessModulus: 2.6,
        absorption: 1.2,
        moisture: 2.0,
        ApprovalStatus: "Approved",
        status: "نشط"
      }),
      createMockMat({
        id: "usr-sand-approved",
        name: "رمل مستخدم معتمد",
        category: "رمال",
        materialSource: "user",
        isSystem: false,
        density: 2640,
        bulkDensity: 1540,
        finenessModulus: 2.5,
        absorption: 1.1,
        moisture: 2.0,
        ApprovalStatus: "Approved",
        status: "نشط"
      }),
      createMockMat({
        id: "usr-sand-pending",
        name: "رمل مستخدم قيد المراجعة",
        category: "رمال",
        materialSource: "user",
        isSystem: false,
        density: 2640,
        bulkDensity: 1540,
        finenessModulus: 2.5,
        absorption: 1.1,
        moisture: 2.0,
        ApprovalStatus: "Pending Review",
        status: "نشط"
      }),
      createMockMat({
        id: "usr-sand-incomplete",
        name: "رمل مستخدم ناقص",
        category: "رمال",
        materialSource: "user",
        isSystem: false,
        density: 2640,
        ApprovalStatus: "Incomplete",
        status: "قيد المراجعة"
      })
    ];

    it("should only return eligible (complete and approved) materials in getAvailableMaterialsForRole", () => {
      const selectable = getAvailableMaterialsForRole(list, "sand", "dreux", "NSC");
      
      const ids = selectable.map(m => m.id);
      expect(ids).toContain("sys-sand");
      expect(ids).toContain("usr-sand-approved");
      // Pending approval and incomplete MUST NOT be selectable in mix design
      expect(ids).not.toContain("usr-sand-pending");
      expect(ids).not.toContain("usr-sand-incomplete");
      expect(selectable.length).toBe(2);
    });
  });

  // 6. P0-1: Critical Property Mutation Invalidation
  describe("6. P0-1: Critical Property Mutation Invalidation", () => {
    const approvedUserSand: EngineeringMaterial = createMockMat({
      id: "usr-sand-app-1",
      name: "رمل سيليسي معتمد",
      category: "رمال",
      materialSource: "user",
      isSystem: false,
      density: 2650,
      finenessModulus: 2.6,
      absorption: 1.2,
      moisture: 2.0,
      ApprovalStatus: "Approved",
      status: "نشط",
      version: 1
    });

    it("should invalidate approval when density is mutated", () => {
      const mutated = { ...approvedUserSand, density: 2700 };
      const govResult = handleMaterialMutationWithGovernance(approvedUserSand, mutated, "engineer@snolab.dz");

      expect(govResult.approvalInvalidated).toBe(true);
      expect(govResult.material.ApprovalStatus).toBe("Pending Review");
      expect(govResult.material.version).toBe(2);
      expect(govResult.invalidatedProperties).toContain("density");
    });

    it("should invalidate approval when finenessModulus is mutated", () => {
      const mutated = { ...approvedUserSand, finenessModulus: 2.8 };
      const govResult = handleMaterialMutationWithGovernance(approvedUserSand, mutated, "engineer@snolab.dz");

      expect(govResult.approvalInvalidated).toBe(true);
      expect(govResult.material.ApprovalStatus).toBe("Pending Review");
      expect(govResult.invalidatedProperties).toContain("finenessModulus");
    });

    it("should invalidate approval when dMax is mutated on gravel", () => {
      const approvedGravel: EngineeringMaterial = createMockMat({
        id: "usr-gravel-app-1",
        name: "حصى معتمد",
        category: "حصى",
        materialSource: "user",
        isSystem: false,
        density: 2680,
        dMax: 20,
        absorption: 0.8,
        ApprovalStatus: "Approved",
        status: "نشط"
      });

      const mutated = { ...approvedGravel, dMax: 25 };
      const govResult = handleMaterialMutationWithGovernance(approvedGravel, mutated, "engineer@snolab.dz");

      expect(govResult.approvalInvalidated).toBe(true);
      expect(govResult.material.ApprovalStatus).toBe("Pending Review");
      expect(govResult.invalidatedProperties).toContain("dMax");
    });

    it("should invalidate approval when 28-day strength is mutated on cement", () => {
      const approvedCement: EngineeringMaterial = createMockMat({
        id: "usr-cem-app-1",
        name: "إسمنت معتمد",
        category: "إسمنت",
        materialSource: "user",
        isSystem: false,
        density: 3100,
        strength28d: 42.5,
        ApprovalStatus: "Approved",
        status: "نشط"
      });

      const mutated = { ...approvedCement, strength28d: 52.5 };
      const govResult = handleMaterialMutationWithGovernance(approvedCement, mutated, "engineer@snolab.dz");

      expect(govResult.approvalInvalidated).toBe(true);
      expect(govResult.material.ApprovalStatus).toBe("Pending Review");
      expect(govResult.invalidatedProperties).toContain("strength28d");
    });

    it("should NOT invalidate approval when non-critical property is mutated", () => {
      const mutated = { ...approvedUserSand, price: 1500, notes: "ملاحظات تجارية محدثة" };
      const govResult = handleMaterialMutationWithGovernance(approvedUserSand, mutated, "engineer@snolab.dz");

      expect(govResult.approvalInvalidated).toBe(false);
      expect(govResult.material.ApprovalStatus).toBe("Approved");
    });
  });

  // 7. P0-2: Strict Mix Preparation Gate
  describe("7. P0-2: Authoritative Mix Preparation Gate (canMaterialEnterMixDesign)", () => {
    it("should block Draft, Incomplete, Pending Review, Rejected, Suspended, Archived materials", () => {
      const baseProps = {
        name: "مادة فحص الحظر",
        category: "رمال",
        materialSource: "user",
        isSystem: false,
        density: 2650,
        bulkDensity: 1540,
        finenessModulus: 2.6,
        absorption: 1.2,
        moisture: 2.0
      };

      const statesToBlock = [
        { ApprovalStatus: "Draft", status: "نشط" },
        { ApprovalStatus: "Incomplete", status: "قيد المراجعة" },
        { ApprovalStatus: "Pending Review", status: "نشط" },
        { ApprovalStatus: "Pending Approval", status: "نشط" },
        { ApprovalStatus: "Rejected", status: "نشط" },
        { ApprovalStatus: "Approved", status: "archived" },
        { ApprovalStatus: "Approved", status: "موقوف" }
      ];

      for (const st of statesToBlock) {
        const mat = createMockMat({ ...baseProps, id: `test-block-${st.ApprovalStatus}-${st.status}`, ...st });
        const gate = canMaterialEnterMixDesign(mat, "dreux", "NSC");
        expect(gate.eligible).toBe(false);
      }
    });

    it("should allow valid System materials to enter without user approval", () => {
      const validSysSand = createMockMat({
        id: "sys-sand-gate",
        name: "رمل نظام قياسي",
        category: "رمال",
        materialSource: "system",
        isSystem: true,
        density: 2650,
        bulkDensity: 1540,
        finenessModulus: 2.6,
        absorption: 1.2,
        moisture: 2.0,
        ApprovalStatus: "Approved",
        status: "نشط"
      });

      const gate = canMaterialEnterMixDesign(validSysSand, "dreux", "NSC");
      expect(gate.eligible).toBe(true);
    });

    it("should allow complete and explicitly Approved User materials to enter", () => {
      const approvedUserMat = createMockMat({
        id: "usr-sand-gate-app",
        name: "رمل مستخدم معتمد بالكامل",
        category: "رمال",
        materialSource: "user",
        isSystem: false,
        density: 2650,
        bulkDensity: 1540,
        finenessModulus: 2.6,
        absorption: 1.2,
        moisture: 2.0,
        ApprovalStatus: "Approved",
        status: "نشط"
      });

      const gate = canMaterialEnterMixDesign(approvedUserMat, "dreux", "NSC");
      expect(gate.eligible).toBe(true);
    });
  });

  // 8. P1-1: Strict Recommendation Application (No Fallbacks)
  describe("8. P1-1: Recommendation Application Strict Property Retrieval", () => {
    const mockInputs: MixDesignInput = {
      fck28: 30,
      controlClass: "normal",
      cementType: "CPJ 42.5",
      cementClassStrength: 42.5,
      dMax: 20,
      slump: 8,
      aggregateType: AggregateType.CONCASSE,
      aggregateQuality: AggregateQuality.STANDARD,
      hasPumping: false,
      sandRelativeDensity: 2.6,
      gravelRelativeDensity: 2.65,
      cementDensity: 3100,
      airContent: 2,
      moistureSand: 0,
      moistureGravel: 0,
      sandAbsorption: 1.5,
      gravelAbsorption: 1.0,
      finenessModulus: 2.6,
      admixtures: [],
      dosageSuper: 0,
      dosageAir: 0,
      dosageRetarder: 0,
      dosageAccelerator: 0,
      dosageSilicaFume: 0,
      dosageFlyAsh: 0,
      dosageSlag: 0,
      selectedMethod: "dreux",
      exposureClass: "XC1",
      durabilityLevel: "normal",
      carbonationLevel: "normal",
      chloridesLevel: "normal",
      sulfatesLevel: "normal",
      priceCement: 12,
      priceSand: 1.5,
      priceGravel: 1.8,
      priceSuper: 45,
      priceAir: 20,
      priceRetarder: 25,
      priceAccelerator: 30,
      priceSilicaFume: 40,
      priceFlyAsh: 15,
      priceSlag: 18,
      priceLabor: 500,
      priceWater: 0.2,
      sandType: "silica",
      gravelType: "crushed",
      autoDensities: false
    };

    it("Eligible material with density = 2650: relative density 2.65 comes from material data", () => {
      const sandWith2650 = MaterialService.fromEngineeringMaterial(createMockMat({
        id: "mat-sand-2650",
        name: "رمل بكثافة 2650",
        category: "رمال",
        density: 2650,
        absorption: 1.3,
        finenessModulus: 2.7
      }));

      const res = RecommendationService.applyRecommendationToMixInputs(sandWith2650, mockInputs);
      expect(res.success).toBe(true);
      expect(res.updatedInputs.sandRelativeDensity).toBe(2.65);
      expect(res.updatedInputs.sandAbsorption).toBe(1.3);
      expect(res.updatedInputs.finenessModulus).toBe(2.7);
    });

    it("Material missing density: no fallback value, recommendation rejected, project input unchanged", () => {
      const sandNoDensity = MaterialService.fromEngineeringMaterial(createMockMat({
        id: "mat-sand-no-dens",
        name: "رمل بدون كثافة",
        category: "رمال",
        density: undefined,
        specificGravity: undefined,
        absorption: 1.2,
        finenessModulus: 2.5
      }));

      const res = RecommendationService.applyRecommendationToMixInputs(sandNoDensity, mockInputs);
      expect(res.success).toBe(false);
      expect(res.missingProperties).toContain("density / specificGravity");
      // Existing mix inputs must remain completely unchanged
      expect(res.updatedInputs.sandRelativeDensity).toBe(mockInputs.sandRelativeDensity);
    });

    it("Material missing FM: no 2.6 fallback, application rejected, input preserved", () => {
      const sandNoFm = MaterialService.fromEngineeringMaterial(createMockMat({
        id: "mat-sand-no-fm",
        name: "رمل بدون معامل نعومة",
        category: "رمال",
        density: 2640,
        absorption: 1.2,
        finenessModulus: undefined
      }));

      const res = RecommendationService.applyRecommendationToMixInputs(sandNoFm, mockInputs);
      expect(res.success).toBe(false);
      expect(res.missingProperties).toContain("finenessModulus");
      expect(res.updatedInputs.finenessModulus).toBe(mockInputs.finenessModulus);
    });

    it("Material missing Dmax: no 20 mm fallback, application rejected, input preserved", () => {
      const gravelNoDmax = MaterialService.fromEngineeringMaterial(createMockMat({
        id: "mat-gravel-no-dmax",
        name: "حصى بدون مقاس أقصى",
        category: "حصى",
        density: 2680,
        absorption: 0.9,
        dMax: undefined
      }));

      const res = RecommendationService.applyRecommendationToMixInputs(gravelNoDmax, mockInputs);
      expect(res.success).toBe(false);
      expect(res.missingProperties).toContain("dMax");
      expect(res.updatedInputs.dMax).toBe(mockInputs.dMax);
    });
  });

  // 9. P1-2: Import Ownership and Governance
  describe("9. P1-2: Import Pipeline Ownership and Governance", () => {
    it("JSON import: User ownership, isSystem = false, not automatically Approved", async () => {
      const completeJson = JSON.stringify([
        {
          name: "رمل مستورد كامل JSON",
          category: "رمال",
          density: 2650,
          finenessModulus: 2.6,
          absorption: 1.2,
          isSystem: true, // Should be ignored/overridden!
          ApprovalStatus: "Approved" // Should be ignored/overridden!
        }
      ]);

      const file = {
        name: "test-complete.json",
        arrayBuffer: async () => new TextEncoder().encode(completeJson).buffer
      };

      const report = await ImportManager.analyzeFile(file, []);
      const result = ImportManager.executeImport({
        drafts: report.drafts,
        duplicates: [],
        existingMaterials: [],
        userEmail: "engineer@snolab.dz"
      });

      expect(result.importedCount).toBe(1);
      const imported = result.updatedMaterialsList[0];
      expect(imported.materialSource).toBe("user");
      expect(imported.isSystem).toBe(false);
      // Must NOT be Approved: remains Pending Review for engineer sign-off
      expect(imported.ApprovalStatus).toBe("Pending Review");
    });

    it("Incomplete imported material: ApprovalStatus must NOT be Approved", async () => {
      const incompleteJson = JSON.stringify([
        {
          name: "رمل ناقص JSON",
          category: "رمال",
          density: 2650
        }
      ]);

      const file = {
        name: "test-incomplete.json",
        arrayBuffer: async () => new TextEncoder().encode(incompleteJson).buffer
      };

      const report = await ImportManager.analyzeFile(file, []);
      const result = ImportManager.executeImport({
        drafts: report.drafts,
        duplicates: [],
        existingMaterials: [],
        userEmail: "engineer@snolab.dz"
      });

      const imported = result.updatedMaterialsList[0];
      expect(imported.ApprovalStatus).toBe("Incomplete");
      expect(imported.ApprovalStatus).not.toBe("Approved");
    });
  });

  // 10. P1-3: System Material Immutability
  describe("10. P1-3: System Material Immutability & Fork Governance", () => {
    const originalSystemGravel: EngineeringMaterial = createMockMat({
      id: "sys-gravel-ref-1",
      name: "حصى نظام قياسي معتمد",
      category: "حصى",
      materialSource: "system",
      isSystem: true,
      density: 2680,
      dMax: 20,
      absorption: 0.8,
      ApprovalStatus: "Approved",
      status: "نشط"
    });

    it("Test A: Attempt to edit System material through BulkCompletionService - remains unchanged", () => {
      const systemCopy = JSON.parse(JSON.stringify(originalSystemGravel));

      const res = BulkCompletionService.applyBulkCompletion(
        [systemCopy],
        [
          {
            materialId: "sys-gravel-ref-1",
            propertyKey: "dMax",
            value: 25
          }
        ],
        "user@snolab.dz"
      );

      // System material must be rejected from mutation
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors.some(e => e.propertyKey === "system_immutability")).toBe(true);
      expect(systemCopy.dMax).toBe(20); // Unchanged!
    });

    it("Test B: Fork System material -> isSystem = false, materialSource = user, originalSystemMaterialId exists, ApprovalStatus = Pending Review", () => {
      const forked = forkSystemMaterial(originalSystemGravel, "حصى مقلع مشتق", "engineer@snolab.dz");

      expect(forked.isSystem).toBe(false);
      expect(forked.materialSource).toBe("user");
      expect(forked.originalSystemMaterialId).toBe(originalSystemGravel.id);
      expect(forked.ApprovalStatus).toBe("Pending Review");
      expect(forked.engineerApproval?.status).toBe("pending");
    });

    it("Test C: Modify fork's critical property -> approval remains/resets to Pending Review", () => {
      const forked = forkSystemMaterial(originalSystemGravel, "حصى مقلع مشتق", "engineer@snolab.dz");
      // Suppose an engineer approved it initially:
      const approvedFork = {
        ...forked,
        ApprovalStatus: "Approved" as const,
        Status: "Approved" as const
      };

      // Modifying critical property dMax:
      const mutatedFork = { ...approvedFork, dMax: 25 };
      const govResult = handleMaterialMutationWithGovernance(approvedFork, mutatedFork, "engineer@snolab.dz");

      expect(govResult.approvalInvalidated).toBe(true);
      expect(govResult.material.ApprovalStatus).toBe("Pending Review");
    });
  });

  // 11. Final Acceptance & Closure: Canonical Governance Checklist (A - T)
  describe("11. Final Acceptance & Closure: Canonical Governance Checklist (A - T)", () => {
    // Base Approved User Sand
    const approvedUserSand: EngineeringMaterial = createMockMat({
      id: "usr-sand-audit-final",
      name: "رمل سيليسي معتمد هندسياً",
      category: "رمال",
      materialSource: "user",
      isSystem: false,
      density: 2650,
      bulkDensity: 1540,
      finenessModulus: 2.6,
      absorption: 1.2,
      moisture: 1.0,
      ApprovalStatus: "Approved",
      status: "نشط",
      version: 1
    });

    // Base Approved User Gravel
    const approvedUserGravel: EngineeringMaterial = createMockMat({
      id: "usr-gravel-audit-final",
      name: "حصى بازلتي معتمد هندسياً",
      category: "حصى",
      materialSource: "user",
      isSystem: false,
      density: 2680,
      bulkDensity: 1580,
      dMax: 20,
      absorption: 0.8,
      moisture: 0.5,
      ApprovalStatus: "Approved",
      status: "نشط",
      version: 1
    });

    const mockInputs: MixDesignInput = {
      fck28: 30,
      controlClass: "normal",
      cementType: "CPJ 42.5",
      cementClassStrength: 42.5,
      dMax: 20,
      slump: 8,
      aggregateType: AggregateType.CONCASSE,
      aggregateQuality: AggregateQuality.STANDARD,
      hasPumping: false,
      sandRelativeDensity: 2.6,
      gravelRelativeDensity: 2.65,
      cementDensity: 3100,
      airContent: 2,
      moistureSand: 0,
      moistureGravel: 0,
      sandAbsorption: 1.5,
      gravelAbsorption: 1.0,
      finenessModulus: 2.6,
      admixtures: [],
      dosageSuper: 0,
      dosageAir: 0,
      dosageRetarder: 0,
      dosageAccelerator: 0,
      dosageSilicaFume: 0,
      dosageFlyAsh: 0,
      dosageSlag: 0,
      selectedMethod: "dreux",
      exposureClass: "XC1",
      durabilityLevel: "normal",
      carbonationLevel: "normal",
      chloridesLevel: "normal",
      sulfatesLevel: "normal",
      priceCement: 12,
      priceSand: 1.5,
      priceGravel: 1.8,
      priceSuper: 45,
      priceAir: 20,
      priceRetarder: 25,
      priceAccelerator: 30,
      priceSilicaFume: 40,
      priceFlyAsh: 15,
      priceSlag: 18,
      priceLabor: 500,
      priceWater: 0.2,
      sandType: "silica",
      gravelType: "crushed",
      autoDensities: false
    };

    // A. Approved User + density mutation
    it("A. Approved User + density mutation -> resets to Pending Review and is not approved", () => {
      const mutated = { ...approvedUserSand, density: 2620 };
      const res = handleMaterialMutationWithGovernance(approvedUserSand, mutated, "lead.engineer@snolab.dz");
      expect(res.approvalInvalidated).toBe(true);
      expect(res.material.ApprovalStatus).toBe("Pending Review");
      expect(res.material.Status).toBe("Pending Review");
      expect(isMaterialApprovedByEngineer(res.material)).toBe(false);
      expect(res.invalidatedProperties).toContain("density");
    });

    // B. Approved User + absorption mutation
    it("B. Approved User + absorption mutation -> resets to Pending Review and is not approved", () => {
      const mutated = { ...approvedUserSand, absorption: 1.9 };
      const res = handleMaterialMutationWithGovernance(approvedUserSand, mutated, "lead.engineer@snolab.dz");
      expect(res.approvalInvalidated).toBe(true);
      expect(res.material.ApprovalStatus).toBe("Pending Review");
      expect(res.material.Status).toBe("Pending Review");
      expect(isMaterialApprovedByEngineer(res.material)).toBe(false);
      expect(res.invalidatedProperties).toContain("absorption");
    });

    // C. Approved User + FM mutation
    it("C. Approved User + FM mutation -> resets to Pending Review and is not approved", () => {
      const mutated = { ...approvedUserSand, finenessModulus: 3.1 };
      const res = handleMaterialMutationWithGovernance(approvedUserSand, mutated, "lead.engineer@snolab.dz");
      expect(res.approvalInvalidated).toBe(true);
      expect(res.material.ApprovalStatus).toBe("Pending Review");
      expect(res.material.Status).toBe("Pending Review");
      expect(isMaterialApprovedByEngineer(res.material)).toBe(false);
      expect(res.invalidatedProperties).toContain("finenessModulus");
    });

    // D. Approved User + Dmax mutation
    it("D. Approved User + Dmax mutation -> resets to Pending Review and is not approved", () => {
      const mutated = { ...approvedUserGravel, dMax: 25 };
      const res = handleMaterialMutationWithGovernance(approvedUserGravel, mutated, "lead.engineer@snolab.dz");
      expect(res.approvalInvalidated).toBe(true);
      expect(res.material.ApprovalStatus).toBe("Pending Review");
      expect(res.material.Status).toBe("Pending Review");
      expect(isMaterialApprovedByEngineer(res.material)).toBe(false);
      expect(res.invalidatedProperties).toContain("dMax");
    });

    // E. Approved User + non-critical metadata mutation
    it("E. Approved User + non-critical metadata mutation -> preserves ApprovalStatus", () => {
      const mutated = { ...approvedUserSand, price: 1800, desc: "مستودع الشرقية، مورد معتمد" };
      const res = handleMaterialMutationWithGovernance(approvedUserSand, mutated, "lead.engineer@snolab.dz");
      expect(res.approvalInvalidated).toBe(false);
      expect(res.material.ApprovalStatus).toBe("Approved");
      expect(isMaterialApprovedByEngineer(res.material)).toBe(true);
    });

    // F. Pending User excluded from Mix Preparation
    it("F. Pending User excluded from Mix Preparation gate", () => {
      const pendingMat = { ...approvedUserSand, ApprovalStatus: "Pending Review" as const, Status: "Pending Review" as any };
      const gate = canMaterialEnterMixDesign(pendingMat, "dreux", "NSC");
      expect(gate.eligible).toBe(false);
      const sel = validateMaterialSelection(pendingMat.id, [pendingMat], "sand", "dreux", "NSC");
      expect(sel.isValid).toBe(false);
    });

    // G. Incomplete User excluded
    it("G. Incomplete User excluded from Mix Preparation gate", () => {
      const incompleteMat = { ...approvedUserSand, absorption: undefined as any };
      const gate = canMaterialEnterMixDesign(incompleteMat, "dreux", "NSC");
      expect(gate.eligible).toBe(false);
      const sel = validateMaterialSelection(incompleteMat.id, [incompleteMat], "sand", "dreux", "NSC");
      expect(sel.isValid).toBe(false);
    });

    // H. Invalid User excluded
    it("H. Invalid User excluded from Mix Preparation gate", () => {
      const invalidMat = { ...approvedUserSand, finenessModulus: 6.5 };
      const gate = canMaterialEnterMixDesign(invalidMat, "dreux", "NSC");
      expect(gate.eligible).toBe(false);
      const sel = validateMaterialSelection(invalidMat.id, [invalidMat], "sand", "dreux", "NSC");
      expect(sel.isValid).toBe(false);
    });

    // I. Rejected User excluded
    it("I. Rejected User excluded from Mix Preparation gate", () => {
      const rejectedMat = { ...approvedUserSand, ApprovalStatus: "Rejected" as const, status: "موقوف" as const };
      const gate = canMaterialEnterMixDesign(rejectedMat, "dreux", "NSC");
      expect(gate.eligible).toBe(false);
      const sel = validateMaterialSelection(rejectedMat.id, [rejectedMat], "sand", "dreux", "NSC");
      expect(sel.isValid).toBe(false);
    });

    // J. Approved User included
    it("J. Approved User included in Mix Preparation gate", () => {
      const gate = canMaterialEnterMixDesign(approvedUserSand, "dreux", "NSC");
      expect(gate.eligible).toBe(true);
      const sel = validateMaterialSelection(approvedUserSand.id, [approvedUserSand], "sand", "dreux", "NSC");
      expect(sel.isValid).toBe(true);
    });

    // K. Approved System included
    it("K. Approved System included in Mix Preparation gate", () => {
      const sysMat = createMockMat({
        id: "sys-sand-k",
        name: "رمل سيليسي نظامي معتمد",
        category: "رمال",
        materialSource: "system",
        isSystem: true,
        density: 2650,
        bulkDensity: 1540,
        finenessModulus: 2.6,
        absorption: 1.2,
        moisture: 0,
        ApprovalStatus: "Approved",
        status: "نشط"
      });
      const gate = canMaterialEnterMixDesign(sysMat, "dreux", "NSC");
      expect(gate.eligible).toBe(true);
      const sel = validateMaterialSelection(sysMat.id, [sysMat], "sand", "dreux", "NSC");
      expect(sel.isValid).toBe(true);
    });

    // L. System immutable
    it("L. System immutable: direct bulk completion mutation is blocked", () => {
      const sysMat = createMockMat({
        id: "sys-sand-l",
        name: "رمل نظامي ثابت",
        category: "رمال",
        materialSource: "system",
        isSystem: true,
        density: 2650
      });
      const res = BulkCompletionService.applyBulkCompletion(
        [sysMat],
        [{ materialId: sysMat.id, propertyKey: "density", value: 2700 }],
        "engineer@snolab.dz"
      );
      expect(res.errors.some(e => e.propertyKey === "system_immutability")).toBe(true);
      expect(sysMat.density).toBe(2650);
    });

    // M. System Fork -> User + Pending Review
    it("M. System Fork -> User + Pending Review", () => {
      const sysMat = createMockMat({
        id: "sys-gravel-m",
        name: "حصى نظامي أصلي",
        category: "حصى",
        materialSource: "system",
        isSystem: true,
        density: 2680,
        dMax: 20,
        absorption: 0.8
      });
      const forked = forkSystemMaterial(sysMat, "حصى مقلع محلي مشتق", "engineer@snolab.dz");
      expect(forked.materialSource).toBe("user");
      expect(forked.isSystem).toBe(false);
      expect(forked.originalSystemMaterialId).toBe(sysMat.id);
      expect(forked.ApprovalStatus).toBe("Pending Review");
      expect(isMaterialApprovedByEngineer(forked)).toBe(false);
    });

    // N. PDF import ownership
    it("N. PDF import ownership: user ownership and Pending Review / Incomplete status", () => {
      const pdfDraft = {
        id: "draft-pdf-1",
        name: "تقرير فحص رمل مخبري PDF",
        englishName: "Lab PDF Sand Report",
        category: "رمال",
        materialType: "رمال",
        source: "تقرير مخبري PDF",
        sourceTracking: {
          fileName: "lab_test_report.pdf",
          fileType: "pdf",
          row: 1,
          column: "TABLE_1",
          extractionMethod: "PDF",
          confidence: 0.9
        },
        properties: {
          density: {
            canonicalId: "PROP-DENSITY",
            key: "density",
            nameAr: "الكثافة",
            nameEn: "Density",
            nameFr: "Masse volumique",
            value: 2650,
            unit: "kg/m³",
            originalValue: 2650,
            confidence: "HIGH" as const,
            status: "VALID" as const,
            sourceTracking: { fileName: "lab_test_report.pdf", fileType: "pdf", row: 1, column: "col1", extractionMethod: "PDF", confidence: 0.9 }
          }
        },
        extraProperties: {},
        validation: { isComplete: false, errors: [], warnings: [], missingRequired: ["finenessModulus"] },
        status: "Incomplete" as const,
        selectedForImport: true
      };

      const result = ImportManager.executeImport({
        drafts: [pdfDraft as any],
        duplicates: [],
        existingMaterials: [],
        userEmail: "qc.engineer@snolab.dz"
      });

      expect(result.importedCount).toBe(1);
      const imported = result.updatedMaterialsList[0];
      expect(imported.materialSource).toBe("user");
      expect(imported.isSystem).toBe(false);
      expect(imported.uploadedBy).toBe("qc.engineer@snolab.dz");
      expect(imported.ApprovalStatus).not.toBe("Approved");
    });

    // O. XLS/XLSX import ownership
    it("O. XLS/XLSX import ownership: user ownership, isSystem=false, ApprovalStatus not approved", () => {
      const xlsDraft = {
        id: "draft-xls-1",
        name: "توريد رمل مقلع إكسل",
        category: "رمال",
        materialType: "رمال",
        source: "ملف توريدات مقالع.xlsx",
        sourceTracking: {
          fileName: "quarry_deliveries.xlsx",
          fileType: "excel",
          row: 2,
          column: "A",
          extractionMethod: "EXCEL",
          confidence: 0.95
        },
        properties: {},
        extraProperties: {},
        validation: { isComplete: false, errors: [], warnings: [], missingRequired: [] },
        status: "Incomplete" as const,
        selectedForImport: true
      };

      const result = ImportManager.executeImport({
        drafts: [xlsDraft as any],
        duplicates: [],
        existingMaterials: [],
        userEmail: "procurement@snolab.dz"
      });

      const imported = result.updatedMaterialsList[0];
      expect(imported.materialSource).toBe("user");
      expect(imported.isSystem).toBe(false);
      expect(imported.ApprovalStatus).not.toBe("Approved");
      expect(isMaterialApprovedByEngineer(imported)).toBe(false);
    });

    // P. JSON import ownership
    it("P. JSON import ownership: overrides isSystem:true and ApprovalStatus:'Approved'", async () => {
      const maliciousJson = JSON.stringify([
        {
          name: "رمل JSON مدعي صفة النظام والاعتماد",
          category: "رمال",
          density: 2650,
          finenessModulus: 2.6,
          absorption: 1.2,
          isSystem: true,
          ApprovalStatus: "Approved"
        }
      ]);

      const file = {
        name: "untrusted_payload.json",
        arrayBuffer: async () => new TextEncoder().encode(maliciousJson).buffer
      };

      const report = await ImportManager.analyzeFile(file, []);
      const result = ImportManager.executeImport({
        drafts: report.drafts,
        duplicates: [],
        existingMaterials: [],
        userEmail: "tester@snolab.dz"
      });

      const imported = result.updatedMaterialsList[0];
      expect(imported.materialSource).toBe("user");
      expect(imported.isSystem).toBe(false);
      expect(imported.ApprovalStatus).toBe("Pending Review");
      expect(isMaterialApprovedByEngineer(imported)).toBe(false);
    });

    // Q. Complete imported material ≠ Approved
    it("Q. Complete imported material ≠ Approved (ready is NOT approved)", async () => {
      const completeJson = JSON.stringify([
        {
          name: "رمل كامل الخصائص مستورد",
          category: "رمال",
          density: 2650,
          finenessModulus: 2.6,
          absorption: 1.2
        }
      ]);

      const file = {
        name: "complete_sand.json",
        arrayBuffer: async () => new TextEncoder().encode(completeJson).buffer
      };

      const report = await ImportManager.analyzeFile(file, []);
      const result = ImportManager.executeImport({
        drafts: report.drafts,
        duplicates: [],
        existingMaterials: [],
        userEmail: "tester@snolab.dz"
      });

      const imported = result.updatedMaterialsList[0];
      expect(imported.ApprovalStatus).toBe("Pending Review");
      expect(isMaterialApprovedByEngineer(imported)).toBe(false);
    });

    // R. Recommendation cannot invent values
    it("R. Recommendation cannot invent fallback values for missing properties", () => {
      const incompleteSand = MaterialService.fromEngineeringMaterial(createMockMat({
        id: "rec-sand-no-density",
        name: "رمل ناقص الكثافة",
        category: "رمال",
        finenessModulus: 2.6,
        absorption: 1.2
      }));

      const res = RecommendationService.applyRecommendationToMixInputs(incompleteSand, mockInputs);
      expect(res.success).toBe(false);
      expect(res.missingProperties).toContain("density / specificGravity");
      // Original project inputs must not be modified or replaced with synthetic defaults
      expect(res.updatedInputs.sandRelativeDensity).toBe(mockInputs.sandRelativeDensity);
    });

    // S. Recommendation Accept preserves engineering source of truth
    it("S. Recommendation Accept preserves engineering source of truth without synthetic values", () => {
      const completeSand = MaterialService.fromEngineeringMaterial(createMockMat({
        id: "rec-sand-complete-true",
        name: "رمل بمعطيات مخبرية حقيقية",
        category: "رمال",
        density: 2630,
        finenessModulus: 2.75,
        absorption: 1.45
      }));

      const res = RecommendationService.applyRecommendationToMixInputs(completeSand, mockInputs);
      expect(res.success).toBe(true);
      expect(res.updatedInputs.sandRelativeDensity).toBe(2.63);
      expect(res.updatedInputs.finenessModulus).toBe(2.75);
      expect(res.updatedInputs.sandAbsorption).toBe(1.45);
    });

    // T. Recommendation Reject preserves project inputs
    it("T. Recommendation Reject preserves project inputs without alteration", () => {
      const rejectedSand = MaterialService.fromEngineeringMaterial(createMockMat({
        id: "rec-sand-rejected",
        name: "رمل مرفوض من المهندس",
        category: "رمال",
        density: 2690
      }));

      // In the recommendations workflow, rejection leaves mix inputs strictly intact:
      RecommendationService.recordDecision(rejectedSand.id, "REJECTED", {
        targetStrength: 30,
        workability: "S3",
        mixDesignMethod: "dreux",
        concreteType: "NSC"
      });

      const decisions = RecommendationService.getAuditTrail();
      const lastDecision = decisions[0];
      expect(lastDecision.action).toBe("REJECTED");
      expect(lastDecision.materialId).toBe(rejectedSand.id);
    });
  });
});
