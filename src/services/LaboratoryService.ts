import { 
  LabTestRunRecord, 
  MaterialCoreRecord, 
  GranulometrySieveEntry 
} from "../types/materialCoreTypes";
import { MaterialService } from "./MaterialService";
import { PropertyService } from "./PropertyService";
import { ValidationService } from "./ValidationService";

export interface GranulometryCalcResult {
  finenessModulus: number;
  d10: number;
  d30: number;
  d60: number;
  cu: number; // Uniformity coefficient Cu = D60 / D10
  cc: number; // Curvature coefficient Cc = (D30)^2 / (D10 * D60)
  dMax: number;
  dMin: number;
  sieveTable: GranulometrySieveEntry[];
}

/**
 * Central Laboratory Service for SnoLab
 * Connects laboratory testing with material properties, executes standardized calculations,
 * and maintains complete test run audit histories without erasing past tests.
 */
export class LaboratoryService {
  private static STORAGE_KEY_TEST_RUNS = "snolab_lab_test_runs_vault_v2";
  private static testRuns: Map<string, LabTestRunRecord> = new Map();

  static {
    LaboratoryService.loadTestRunsFromStorage();
  }

  /**
   * Retrieves all test runs recorded for a given material ID.
   */
  public static getTestRunsForMaterial(materialId: string): LabTestRunRecord[] {
    return Array.from(LaboratoryService.testRuns.values())
      .filter(t => t.materialId === materialId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Retrieves a specific test run by ID.
   */
  public static getTestRunById(testRunId: string): LabTestRunRecord | undefined {
    return LaboratoryService.testRuns.get(testRunId);
  }

  /**
   * Performs standard Granulometric (Sieve Analysis) calculations:
   * Computes % Retained, Cumulative Retained, % Passing, FM, D10, D30, D60, Cu, Cc, Dmax.
   */
  public static calculateGranulometry(
    rawSieves: Array<{ sieve: number; massRetained: number }>,
    totalSampleMass?: number
  ): GranulometryCalcResult {
    // Sort descending by sieve size for retain calculation
    const sorted = [...rawSieves].sort((a, b) => b.sieve - a.sieve);
    const calculatedTotalMass = totalSampleMass || sorted.reduce((sum, s) => sum + (s.massRetained || 0), 0) || 1;

    let cumulativeRetainedMass = 0;
    const computedTable: GranulometrySieveEntry[] = [];

    for (const item of sorted) {
      cumulativeRetainedMass += (item.massRetained || 0);
      const percentRetained = (item.massRetained / calculatedTotalMass) * 100;
      const cumulativeRetained = (cumulativeRetainedMass / calculatedTotalMass) * 100;
      const passing = Math.max(0, Math.min(100, 100 - cumulativeRetained));

      computedTable.push({
        sieve: item.sieve,
        massRetained: item.massRetained,
        percentRetained: parseFloat(percentRetained.toFixed(2)),
        cumulativeRetained: parseFloat(cumulativeRetained.toFixed(2)),
        passing: parseFloat(passing.toFixed(2))
      });
    }

    // Fineness Modulus calculation (standard sieves: 0.125, 0.25, 0.5, 1, 2, 4 mm)
    // FM = Sum(Cumulative % Retained on sieves >= 0.150mm) / 100
    const fmSieveSizes = [0.125, 0.15, 0.25, 0.3, 0.5, 0.6, 1.0, 1.18, 2.0, 2.36, 4.0, 4.75];
    let fmSum = 0;
    for (const row of computedTable) {
      if (fmSieveSizes.some(s => Math.abs(s - row.sieve) < 0.05)) {
        fmSum += (row.cumulativeRetained || 0);
      }
    }
    const fm = parseFloat((fmSum / 100).toFixed(2));

    // Interpolate Dx (size at which x% passes)
    const sortedAsc = [...computedTable].sort((a, b) => a.sieve - b.sieve);
    const interpolateD = (targetPassing: number): number => {
      for (let i = 0; i < sortedAsc.length - 1; i++) {
        const p1 = sortedAsc[i].passing;
        const p2 = sortedAsc[i + 1].passing;
        const s1 = sortedAsc[i].sieve;
        const s2 = sortedAsc[i + 1].sieve;

        if ((p1 <= targetPassing && targetPassing <= p2) || (p2 <= targetPassing && targetPassing <= p1)) {
          if (p2 === p1) return s1;
          const ratio = (targetPassing - p1) / (p2 - p1);
          return parseFloat((s1 + ratio * (s2 - s1)).toFixed(3));
        }
      }
      return targetPassing >= 95 ? (sortedAsc[sortedAsc.length - 1]?.sieve ?? 0) : (sortedAsc[0]?.sieve ?? 0);
    };

    const d10 = interpolateD(10);
    const d30 = interpolateD(30);
    const d60 = interpolateD(60);

    const cu = d10 > 0 ? parseFloat((d60 / d10).toFixed(2)) : 1;
    const cc = (d10 > 0 && d60 > 0) ? parseFloat(((d30 * d30) / (d10 * d60)).toFixed(2)) : 1;

    // Dmax is the first sieve where passing >= 95%
    const dMaxCandidate = sortedAsc.find(s => s.passing >= 95)?.sieve ?? sortedAsc[sortedAsc.length - 1]?.sieve ?? 0;
    const dMinCandidate = sortedAsc.find(s => s.passing > 5)?.sieve || 0;

    return {
      finenessModulus: fm,
      d10,
      d30,
      d60,
      cu,
      cc,
      dMax: dMaxCandidate,
      dMin: dMinCandidate,
      sieveTable: computedTable
    };
  }

  /**
   * Executes a complete lab test lifecycle:
   * 1. Records test run with raw measurements
   * 2. Runs standard calculations
   * 3. Validates results
   * 4. Updates linked Material Properties automatically
   * 5. Preserves historical log
   */
  public static executeAndRecordTestRun(params: {
    materialId: string;
    testDefinitionId: string;
    testName: string;
    standard: string;
    operator: string;
    laboratoryName: string;
    measurements: Record<string, any>;
    calculatedResults: Record<string, { value: any; unit: string; outputPropertyId?: string }>;
    validationNotes?: string[];
  }): LabTestRunRecord {
    const runId = `RUN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record: LabTestRunRecord = {
      id: runId,
      materialId: params.materialId,
      testDefinitionId: params.testDefinitionId,
      testName: params.testName,
      standard: params.standard,
      testDate: now,
      operator: params.operator,
      laboratoryName: params.laboratoryName,
      measurements: params.measurements,
      calculatedResults: params.calculatedResults,
      status: "VERIFIED",
      validationNotes: params.validationNotes || [],
      createdAt: now
    };

    // Save test run to registry
    LaboratoryService.testRuns.set(record.id, record);
    LaboratoryService.persistTestRunsToStorage();

    // Automatically update linked material properties with LABORATORY provenance
    const mat = MaterialService.getMaterialById(params.materialId);
    if (mat) {
      for (const [key, res] of Object.entries(params.calculatedResults)) {
        if (res.outputPropertyId && PropertyService.hasMeaningfulValue(res.value)) {
          MaterialService.setMaterialProperty(
            mat.id,
            res.outputPropertyId,
            res.value,
            "LABORATORY",
            res.unit
          );
        }
      }

      // Link test run ID to material
      if (!mat.laboratoryTestIds) mat.laboratoryTestIds = [];
      mat.laboratoryTestIds.push(record.id);

      // If granulometry curve data present, update granulometry
      if (params.measurements.sieveTable) {
        mat.granulometry = params.measurements.sieveTable;
      }

      MaterialService.saveMyMaterial(mat);
    }

    return record;
  }

  private static persistTestRunsToStorage(): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      const arr = Array.from(LaboratoryService.testRuns.values());
      window.localStorage.setItem(LaboratoryService.STORAGE_KEY_TEST_RUNS, JSON.stringify(arr));
    } catch (e) {
      console.warn("Could not save lab test runs to localStorage:", e);
    }
  }

  private static loadTestRunsFromStorage(): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      const raw = window.localStorage.getItem(LaboratoryService.STORAGE_KEY_TEST_RUNS);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        LaboratoryService.testRuns.clear();
        for (const item of arr) {
          if (item && item.id) {
            LaboratoryService.testRuns.set(item.id, item);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load lab test runs from localStorage:", e);
    }
  }
}
