import { describe, it, expect } from "vitest";
import { generateMixDesignPdf } from "../mixDesignPdfGenerator";
import { generateLabTestPdf } from "../labTestPdfGenerator";
import { generateProjectAuditPdf } from "../projectAuditPdfGenerator";
import { AggregateType, AggregateQuality } from "../../../types";

describe("PDF Report Generator Service (Vector Native)", () => {
  it("should generate a multi-page Concrete Mix Design PDF without errors", async () => {
    const mockResult: any = {
      fcm28: 38.5,
      stdDev: 4.5,
      wcRatio: 0.48,
      wcRatioAdjusted: 0.44,
      dreuxAggregateFactor: 0.55,
      compactorGamma: 0.83,
      cementWeight: 380,
      waterContentNeeded: 180,
      waterContentActual: 165,
      sandPercent: 38,
      gravelPercent: 62,
      sandWeightDry: 680,
      gravelWeightDry: 1150,
      admixtureWeights: [
        { admixtureId: "sp-1", name: "Sika ViscoCrete 20 HE", weight: 4.56 }
      ],
      sandWeightWet: 700,
      gravelWeightWet: 1162,
      waterWeightWet: 133,
      totalFreshDensity: 2380,
      pivotPoint: { x: 10, y: 45 },
      gradingCurve: []
    };

    const mockInput: any = {
      fck28: 30,
      controlClass: "high",
      cementType: "CEM II/A-L 42.5 N",
      cementClassStrength: 42.5,
      dMax: 20,
      slump: 8,
      aggregateType: AggregateType.CONCASSE,
      aggregateQuality: AggregateQuality.EXCELLENT,
      hasPumping: true,
      sandRelativeDensity: 2.65,
      gravelRelativeDensity: 2.68,
      cementDensity: 3100,
      airContent: 1.5,
      moistureSand: 3.0,
      moistureGravel: 1.0,
      sandAbsorption: 1.2,
      gravelAbsorption: 0.7,
      finenessModulus: 2.65,
      admixtures: [],
      dosageSuper: 1.2,
      dosageAir: 0,
      dosageRetarder: 0,
      dosageAccelerator: 0,
      dosageSilicaFume: 0,
      dosageFlyAsh: 0,
      dosageSlag: 0,
      selectedMethod: "dreux",
      exposureClass: "XC2",
      durabilityLevel: "normal",
      carbonationLevel: "moderate",
      chloridesLevel: "none",
      sulfatesLevel: "none",
      sandType: "River Sand",
      gravelType: "Crushed Limestone",
      autoDensities: true,
      batchVolume: 6.0
    };

    const doc = await generateMixDesignPdf(mockResult, mockInput, {
      batchVolume: 6.0,
      language: "fr",
      activeProject: {
        name: "Olympic Bridge Infrastructure",
        client: "Ministry of Transport",
        plant: "Ready-Mix Batching Plant #1"
      }
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it("should generate a Laboratory Material Test PDF without errors", async () => {
    const mockTestRecord: any = {
      id: "TEST-AGG-2026-001",
      testType: "AGG_SAND_EQUIVALENT",
      testTitleAr: "تجربة المكافئ الرملي للركام الناعم",
      testTitleFr: "Essai d'Équivalent de Sable (ES)",
      testTitleEn: "Sand Equivalent Test",
      category: "aggregates",
      materialId: "mat-sand-1",
      materialName: "Sable de Rivière 0/4",
      materialCategory: "Sable",
      sampleId: "SMP-2026-042",
      projectName: "Highway Extension Project",
      operator: "M. Benali (Senior Lab Tech)",
      laboratoryName: "SnoLab Central Materials Facility",
      date: "2026-08-26",
      standard: "NF EN 933-8",
      inputs: {
        h1_piston_height_mm: 85,
        h2_flocculate_height_mm: 110,
        sample_mass_dry_g: 120
      },
      results: {
        sandEquivalentPercent: 77.3
      },
      status: "PASS",
      score: 95,
      interpretation: "Le sable présente une propreté optimale (ES = 77.3% > 70%), parfaitement adapté pour des bétons à haute performance sans risque de baisse d'adhérence.",
      complianceDetails: [
        {
          parameter: "Équivalent de Sable (ES Piston)",
          measured: "77.3",
          unit: "%",
          limit: ">= 70.0%",
          status: "PASS",
          note: "Propreté optimale selon NF EN 933-8"
        }
      ],
      syncedToMaterial: true,
      createdAt: "2026-08-26",
      updatedAt: "2026-08-26"
    };

    const doc = await generateLabTestPdf(mockTestRecord, { language: "fr" });
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it("should generate a Project Audit PDF without errors", async () => {
    const doc = await generateProjectAuditPdf({
      project: {
        name: "Grand Tunnel Project",
        client: "National Infrastructure Agency",
        engineer: "Dr. K. Amrani"
      },
      materials: [
        {
          id: "m1",
          name: "Sable de Dune 0/2",
          englishName: "Dune Sand",
          type: "Sand",
          category: "aggregates",
          quality: "standard",
          uses: "Mix design",
          desc: "Fine silica sand",
          rating: 4,
          provenance: "Biskra Quarry",
          image: "",
          status: "نشط"
        }
      ],
      testRecords: []
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
