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
  getAvailableMaterialsForRole
} from "../services/materialEligibilityService";
import { ImportManager } from "../services/import/ImportManager";
import { BulkCompletionService } from "../services/import/BulkCompletionService";
import { EngineeringMaterial } from "../types";

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
});
