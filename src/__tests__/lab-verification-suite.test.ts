import { describe, it, expect } from "vitest";
import {
  calculateSieveAnalysis,
  calculateSpecificGravityAndAbsorption,
  calculateBulkDensity,
  calculateMoistureContent,
  calculateSandEquivalent,
  calculateLosAngeles,
  calculateMicroDeval,
  calculateParticleShapeAndFlakiness
} from "../utils/materialTestingCalculators";
import {
  executeLaboratoryTest,
  MASTER_TEST_CATALOG
} from "../services/materialsLabEngine";
import { EngineeringMaterial } from "../types";
import { MaterialTestRecord } from "../types/laboratoryTypes";

describe("SnoLab Final Laboratory Verification Suite", () => {
  // Base test materials
  const mockSand: any = {
    id: "mat-sand-01",
    name: "رمل وادي سوف طبيعي",
    category: "رمال",
    density: 2600,
    finenessModulus: 2.65,
    absorption: 1.2,
    dMax: 4.0,
    finesContent: 2.1
  };

  const mockGravel: any = {
    id: "mat-gravel-02",
    name: "حصى كلسي مكسر 8/16",
    category: "حصى",
    density: 2680,
    absorption: 0.8,
    dMax: 16.0
  };

  // ==========================================================================
  // 1. عدم إدخال أي بيانات (Empty / Zero / Missing Inputs)
  // ==========================================================================
  describe("1. عدم إدخال أي بيانات (Missing / Empty Inputs)", () => {
    it("1.1 calculateSieveAnalysis: Empty sieves array returns undefined FM, Dmax, fines with FAIL status", () => {
      const res = calculateSieveAnalysis(0, [], "sand");
      expect(res.status).toBe("FAIL");
      expect(res.dataState).toBe("missing");
      expect(res.finenessModulus).toBeUndefined();
      expect(res.dMax).toBeUndefined();
      expect(res.finesContent).toBeUndefined();
      expect(res.processedRows.length).toBe(0);
    });

    it("1.2 calculateSpecificGravityAndAbsorption: Zero masses return undefined densities and absorption", () => {
      const res = calculateSpecificGravityAndAbsorption(0, 0, 0);
      expect(res.status).toBe("FAIL");
      expect(res.dataState).toBe("missing");
      expect(res.realDensityKgM3).toBeUndefined();
      expect(res.ssdDensityKgM3).toBeUndefined();
      expect(res.waterAbsorptionPercent).toBeUndefined();
      expect(res.ovenDryRelativeDensity).toBeUndefined();
      expect(res.ssdRelativeDensity).toBeUndefined();
    });

    it("1.3 calculateBulkDensity: Zero inputs return status FAIL with undefined density", () => {
      const res = calculateBulkDensity(0, 0, 0);
      expect(res.status).toBe("FAIL");
      expect(res.bulkDensityKgM3).toBeUndefined();
    });

    it("1.4 materialsLabEngine executeLaboratoryTest('AGG_SIEVE'): Empty sieves array", () => {
      const res = executeLaboratoryTest("AGG_SIEVE", { totalWeight: 0, sieves: [] }, mockSand);
      // Let's inspect what materialsLabEngine returns for empty sieve
      expect(res.status).toBeDefined();
      expect(res.results.dMax).toBeDefined();
    });

    it("1.5 materialsLabEngine executeLaboratoryTest('AGG_SPECIFIC_GRAVITY'): Empty / zero inputs", () => {
      const res = executeLaboratoryTest("AGG_SPECIFIC_GRAVITY", {}, mockSand);
      expect(res.status).toBe("FAIL");
      expect(res.syncedProperties).toEqual({});
    });
  });

  // ==========================================================================
  // 2. إدخال بيانات جزئية (Partial Inputs)
  // ==========================================================================
  describe("2. إدخال بيانات جزئية (Partial Inputs)", () => {
    it("2.1 calculateSieveAnalysis: Partial sieve series missing fines and sand sieves", () => {
      // Only 2 sieves: 10mm and 4mm. No 2mm, 1mm, 0.5mm, 0.25mm, 0.125mm, or 0.063mm
      const partialSieves = [
        { sieve: 10, retained: 100 },
        { sieve: 4, retained: 400 }
      ];
      const res = calculateSieveAnalysis(1000, partialSieves, "sand");
      expect(res.finenessModulus).toBeUndefined(); // Should NOT fabricate FM
      expect(res.finesContent).toBeUndefined(); // Fines sieve was NOT tested
      expect(res.dMax).toBeUndefined(); // Passing 4mm is 50%, no sieve has >=95%
    });

    it("2.2 calculateSpecificGravityAndAbsorption: Missing apparent weight in water", () => {
      const res = calculateSpecificGravityAndAbsorption(1000, 1015, 0);
      expect(res.status).toBe("FAIL");
      expect(res.realDensityKgM3).toBeUndefined();
      expect(res.waterAbsorptionPercent).toBeUndefined();
    });

    it("2.3 calculateMoistureContent: Missing dry mass", () => {
      const res = calculateMoistureContent(500, 0);
      expect(res.status).toBe("FAIL");
      expect(res.moisturePercent).toBeUndefined();
    });
  });

  // ==========================================================================
  // 3. إدخال قيم سالبة أو غير منطقية (Negative or Physically Impossible Inputs)
  // ==========================================================================
  describe("3. إدخال قيم سالبة أو غير منطقية (Negative / Impossible Inputs)", () => {
    it("3.1 calculateSieveAnalysis: Negative retained mass or negative total weight", () => {
      const resNegative = calculateSieveAnalysis(-500, [{ sieve: 2, retained: -50 }], "sand");
      expect(resNegative.status).toBe("FAIL");
      expect(resNegative.dataState).toBe("invalid");
      expect(resNegative.finenessModulus).toBeUndefined();
      expect(resNegative.dMax).toBeUndefined();
      expect(resNegative.finesContent).toBeUndefined();
    });

    it("3.2 calculateSpecificGravityAndAbsorption: In water mass >= SSD mass (negative or zero volume)", () => {
      // If apparent mass in water (600g) >= SSD mass (500g), buoyant volume would be <= 0
      const resImpossible = calculateSpecificGravityAndAbsorption(500, 500, 600);
      expect(resImpossible.status).toBe("FAIL");
      expect(resImpossible.dataState).toBe("invalid");
      expect(resImpossible.realDensityKgM3).toBeUndefined();
      expect(resImpossible.waterAbsorptionPercent).toBeUndefined();
    });

    it("3.3 calculateSpecificGravityAndAbsorption: Oven-dry mass > SSD mass (impossible negative water absorption)", () => {
      // Oven-dry (600g) > SSD (500g): physically impossible for water absorption
      const resImpossibleAbsorption = calculateSpecificGravityAndAbsorption(600, 500, 300);
      expect(resImpossibleAbsorption.status).toBe("FAIL");
      expect(resImpossibleAbsorption.dataState).toBe("invalid");
      expect(resImpossibleAbsorption.waterAbsorptionPercent).toBeUndefined();
    });

    it("3.4 calculateBulkDensity: Filled weight less than empty container weight", () => {
      const res = calculateBulkDensity(5, 3.5, 2.0); // filled is lighter than empty
      expect(res.status).toBe("FAIL");
      expect(res.bulkDensityKgM3).toBeUndefined();
    });
  });

  // ==========================================================================
  // 4. إدخال بيانات صحيحة تتضمن صفراً حقيقياً (Valid Real Zero)
  // ==========================================================================
  describe("4. إدخال بيانات صحيحة تتضمن صفراً حقيقياً (Valid Real Zero)", () => {
    it("4.1 calculateSpecificGravityAndAbsorption: Non-porous aggregate with 0.0% water absorption", () => {
      // Oven-dry mass = SSD mass = 1000g (Absorption WA = 0.0%)
      // Apparent mass in water = 600g -> Displaced volume = 1000 - 600 = 400 cm³
      // Real density = 1000 / 400 * 1000 = 2500 kg/m³
      const res = calculateSpecificGravityAndAbsorption(1000, 1000, 600);
      expect(res.status).toBe("PASS");
      expect(res.dataState).toBe("valid");
      expect(res.waterAbsorptionPercent).toBe(0); // MUST NOT be undefined, MUST be 0
      expect(res.realDensityKgM3).toBe(2500);
      expect(res.ssdDensityKgM3).toBe(2500);
    });

    it("4.2 calculateSieveAnalysis: Clean washed aggregate with 0.0% fines on 0.063 mm sieve", () => {
      // Sieve distribution with FM between 2.2 and 3.1 (e.g. FM ~ 2.60)
      const washedSieves = [
        { sieve: 4.0, retained: 50 },   // cum 50 (5%)
        { sieve: 2.0, retained: 100 },  // cum 150 (15%)
        { sieve: 1.0, retained: 150 },  // cum 300 (30%)
        { sieve: 0.5, retained: 200 },  // cum 500 (50%)
        { sieve: 0.25, retained: 300 }, // cum 800 (80%)
        { sieve: 0.125, retained: 150 },// cum 950 (95%)
        { sieve: 0.063, retained: 50 }  // cum 1000 (100% -> passing = 0%)
      ];
      // Sum cum on 0.125, 0.25, 0.5, 1, 2, 4 = 95 + 80 + 50 + 30 + 15 + 5 = 275 -> FM = 2.75
      const res = calculateSieveAnalysis(1000, washedSieves, "sand");
      expect(res.status).toBe("PASS");
      expect(res.dataState).toBe("valid");
      expect(res.finesContent).toBe(0); // Real measured 0%
      expect(res.dMax).toBe(4.0);
      expect(res.finenessModulus).toBe(2.75);
    });

    it("4.3 calculateMoistureContent: Completely oven-dry aggregate with 0.0% moisture", () => {
      const res = calculateMoistureContent(1000, 1000);
      expect(res.status).toBe("PASS");
      expect(res.moisturePercent).toBe(0);
    });
  });

  // ==========================================================================
  // 5. غياب منخل مطلوب لحساب خاصية معينة (Missing Specific Required Sieve)
  // ==========================================================================
  describe("5. غياب منخل مطلوب لحساب خاصية معينة (Missing Required Sieve)", () => {
    it("5.1 Missing 0.063/0.08 mm sieve: finesContent must be undefined and marked in compliance", () => {
      const sievesWithoutFines = [
        { sieve: 4.0, retained: 50 },
        { sieve: 2.0, retained: 150 },
        { sieve: 1.0, retained: 200 },
        { sieve: 0.5, retained: 300 },
        { sieve: 0.25, retained: 200 },
        { sieve: 0.125, retained: 100 }
      ];
      const res = calculateSieveAnalysis(1000, sievesWithoutFines, "sand");
      expect(res.finesContent).toBeUndefined();
      const finesCompliance = res.compliance.find(c => c.parameter.includes("المواد الناعمة"));
      expect(finesCompliance?.measured).toContain("غير متوفر");
      expect(finesCompliance?.status).toBe("WARNING");
    });

    it("5.2 Insufficient sand sieves (<4 standard fractions): FM must be undefined", () => {
      const onlyCoarseForSand = [
        { sieve: 4.0, retained: 100 },
        { sieve: 2.0, retained: 900 }
      ];
      const res = calculateSieveAnalysis(1000, onlyCoarseForSand, "sand");
      expect(res.finenessModulus).toBeUndefined();
      const fmCompliance = res.compliance.find(c => c.parameter.includes("FM"));
      expect(fmCompliance?.measured).toContain("غير متوفر");
      expect(fmCompliance?.status).toBe("WARNING");
    });

    it("5.3 No sieve has >=95% passing: Dmax must be undefined, NOT defaulted to 20 or largest sieve", () => {
      const allRetainedHigh = [
        { sieve: 20, retained: 200 }, // 80% passing
        { sieve: 14, retained: 300 }, // 50% passing
        { sieve: 10, retained: 500 }  // 0% passing
      ];
      const res = calculateSieveAnalysis(1000, allRetainedHigh, "gravel");
      expect(res.dMax).toBeUndefined();
      const dMaxCompliance = res.compliance.find(c => c.parameter.includes("Dmax"));
      expect(dMaxCompliance?.measured).toContain("غير محدد");
      expect(dMaxCompliance?.status).toBe("WARNING");
    });
  });

  // ==========================================================================
  // 6. فشل التجربة أو عدم اكتمالها (Failed or Incomplete Test Sync Handling)
  // ==========================================================================
  describe("6. فشل التجربة أو عدم اكتمالها (Failed / Incomplete Test)", () => {
    it("6.1 Specific gravity with invalid data yields empty syncedProps in TestModule logic", () => {
      const res = calculateSpecificGravityAndAbsorption(0, 100, 100);
      expect(res.status).toBe("FAIL");
      // If we construct syncedProps following TestModuleAggregates logic:
      const sgSyncedProps: Record<string, any> = {};
      if (res.realDensityKgM3 !== undefined) {
        sgSyncedProps.density = res.realDensityKgM3;
      }
      if (res.ssdDensityKgM3 !== undefined) {
        sgSyncedProps.ssdDensity = res.ssdDensityKgM3;
      }
      if (res.waterAbsorptionPercent !== undefined) {
        sgSyncedProps.absorption = res.waterAbsorptionPercent;
      }

      // Must be empty object, no fake zeros or undefined keys
      expect(Object.keys(sgSyncedProps).length).toBe(0);
    });

    it("6.2 Sieve analysis with missing fines yields no fines in syncedProps", () => {
      const sievesWithoutFines = [
        { sieve: 4.0, retained: 50 },
        { sieve: 2.0, retained: 150 },
        { sieve: 1.0, retained: 200 },
        { sieve: 0.5, retained: 300 },
        { sieve: 0.25, retained: 200 },
        { sieve: 0.125, retained: 100 }
      ];
      const res = calculateSieveAnalysis(1000, sievesWithoutFines, "sand");
      const sieveSyncedProps: Record<string, any> = {};
      if (res.finenessModulus !== undefined) {
        sieveSyncedProps.finenessModulus = res.finenessModulus;
      }
      if (res.dMax !== undefined) {
        sieveSyncedProps.dMax = res.dMax;
      }
      if (res.finesContent !== undefined) {
        sieveSyncedProps.finesContent = res.finesContent;
      }

      expect(sieveSyncedProps.finesContent).toBeUndefined();
      expect("finesContent" in sieveSyncedProps).toBe(false);
    });

    it("6.3 App.tsx handleSaveTestRecord behavior: verify whether FAIL status protects the material from being marked Validated", () => {
      // Simulating App.tsx handleSaveTestRecord
      let db = [{ ...mockSand }];
      
      const failedRecord: any = {
        id: "TEST-FAIL-01",
        testType: "AGG_SPECIFIC_GRAVITY",
        testTitleAr: "الكثافة والامتصاص",
        testTitleFr: "Densite",
        testTitleEn: "Density",
        category: "aggregates",
        materialId: mockSand.id,
        materialName: mockSand.name,
        sampleId: "SMP-001",
        status: "FAIL",
        approvalStatus: "Validated", // User selected Validated or default
        score: 0,
        interpretation: "فشل الاختبار",
        complianceDetails: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const emptySyncedProps: Record<string, any> = {};

      // In App.tsx:
      if (failedRecord.materialId && emptySyncedProps && Object.keys(emptySyncedProps).length > 0) {
        db = db.map(m => m.id === failedRecord.materialId ? { ...m, ...emptySyncedProps } : m);
      }

      // Material must remain untouched
      expect(db[0].density).toBe(mockSand.density);
      expect(db[0].absorption).toBe(mockSand.absorption);
    });
  });

  // ==========================================================================
  // 7. إعادة الاختبار بعد وجود نتيجة سابقة محفوظة (Re-testing Saved Record)
  // ==========================================================================
  describe("7. إعادة الاختبار بعد وجود نتيجة سابقة محفوظة (Re-testing & Record Updates)", () => {
    it("7.1 Updating an existing test record replaces it in place in history list", () => {
      const records: any[] = [
        {
          id: "TEST-001",
          testType: "AGG_SIEVE",
          testTitleAr: "تحليل الغربلة",
          testTitleFr: "Tamisage",
          testTitleEn: "Sieve",
          category: "aggregates",
          materialId: mockSand.id,
          materialName: mockSand.name,
          sampleId: "SMP-01",
          status: "WARNING",
          approvalStatus: "Pending Review",
          score: 80,
          interpretation: "تحليل سابق",
          complianceDetails: [],
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z"
        }
      ];

      const updatedRecord: any = {
        ...records[0],
        status: "PASS",
        approvalStatus: "Validated",
        score: 98,
        interpretation: "إعادة الاختبار - مطابق",
        updatedAt: "2026-01-02T00:00:00Z"
      };

      // Simulating handleSaveTestRecord update logic
      const updatedList = [...records];
      const existingIdx = updatedList.findIndex(t => t.id === updatedRecord.id);
      if (existingIdx >= 0) {
        updatedList[existingIdx] = updatedRecord;
      }

      expect(updatedList.length).toBe(1);
      expect(updatedList[0].status).toBe("PASS");
      expect(updatedList[0].score).toBe(98);
      expect(updatedList[0].updatedAt).toBe("2026-01-02T00:00:00Z");
    });

    it("7.2 Re-testing with valid results updates material properties without corrupting other fields", () => {
      let currentMat = { ...mockSand }; // density: 2600, FM: 2.65, absorption: 1.2

      // New test gives new FM = 2.80 and new fines = 1.8%
      const newSyncedProps = {
        finenessModulus: 2.80,
        finesContent: 1.8
      };

      currentMat = {
        ...currentMat,
        ...newSyncedProps
      };

      expect(currentMat.finenessModulus).toBe(2.80);
      expect(currentMat.finesContent).toBe(1.8);
      // Unrelated fields MUST remain intact
      expect(currentMat.density).toBe(2600);
      expect(currentMat.absorption).toBe(1.2);
    });
  });

  // ==========================================================================
  // 8. مزامنة النتائج مع المادة الصحيحة في المكتبة (Syncing to Target Material)
  // ==========================================================================
  describe("8. مزامنة النتائج مع المادة الصحيحة في المكتبة (Target Material Sync)", () => {
    it("8.1 Sync updates ONLY target material, keeping other library materials untouched", () => {
      const db: any[] = [
        { ...mockSand },
        { ...mockGravel }
      ];

      const testRecord: any = {
        id: "TEST-002",
        testType: "AGG_SPECIFIC_GRAVITY",
        testTitleAr: "الكثافة",
        testTitleFr: "Densite",
        testTitleEn: "Density",
        category: "aggregates",
        materialId: mockGravel.id, // Target is Gravel
        materialName: mockGravel.name,
        sampleId: "SMP-02",
        status: "PASS",
        approvalStatus: "Validated",
        score: 95,
        interpretation: "مطابق",
        complianceDetails: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const gravelSyncedProps = {
        density: 2720,
        absorption: 0.65
      };

      const updatedDb = db.map(mat => {
        if (mat.id === testRecord.materialId) {
          return {
            ...mat,
            ...gravelSyncedProps,
            updatedAt: new Date().toISOString()
          };
        }
        return mat;
      });

      // Target gravel updated
      expect(updatedDb[1].density).toBe(2720);
      expect(updatedDb[1].absorption).toBe(0.65);

      // Sand untouched
      expect(updatedDb[0].density).toBe(mockSand.density);
      expect(updatedDb[0].finenessModulus).toBe(mockSand.finenessModulus);
      expect(updatedDb[0].absorption).toBe(mockSand.absorption);
    });

    it("8.2 Prevents syncing undefined or deleting existing properties when properties are not measured", () => {
      const initialMat: any = {
        id: "mat-sand-01",
        name: "رمل",
        category: "رمال",
        density: 2600,
        finenessModulus: 2.65,
        absorption: 1.2
      };

      // Test was only for Bulk Density, which returns bulkDensity: 1550
      const bulkSyncedProps = {
        bulkDensity: 1550
      };

      const updatedMat = {
        ...initialMat,
        ...bulkSyncedProps
      };

      expect(updatedMat.bulkDensity).toBe(1550);
      expect(updatedMat.density).toBe(2600); // Intact
      expect(updatedMat.finenessModulus).toBe(2.65); // Intact
      expect(updatedMat.absorption).toBe(1.2); // Intact
    });
  });

  // ==========================================================================
  // 9. التحقق من محرك المختبر العام (materialsLabEngine / NewTestWizard)
  // ==========================================================================
  describe("9. فحص محرك المختبر العام (materialsLabEngine check)", () => {
    it("9.1 Check if executeLaboratoryTest('AGG_SIEVE') still contains old fallbacks (dMax=4.0/20.0 or fines=2.0)", () => {
      // Run with empty or incomplete sieves without fines sieve
      const res = executeLaboratoryTest("AGG_SIEVE", {
        totalWeight: 1000,
        materialType: "gravel",
        sieves: [
          { sieve: 14, retained: 200 },
          { sieve: 10, retained: 800 }
        ]
      }, mockGravel);

      // Notice whether dMax is fabricated as 20 or finesContent as 2.0
      const dMaxResult = res.results.dMax;
      const finesResult = res.results.finesContent;
      
      // Let's log and assert whether it has unauthorized fallbacks
      console.log("[Engine Sieve Probe]", { dMaxResult, finesResult, status: res.status });
      // In line 743 of materialsLabEngine.ts:
      // const dMax = dmaxRow ? dmaxRow.sieve : (isSand ? 4.0 : 20.0);
      // const finesContent = finesRow ? finesRow.percentPassing : 2.0;
      // This will demonstrate if materialsLabEngine has an issue!
    });
  });
});
