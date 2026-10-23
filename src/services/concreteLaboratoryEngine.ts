import type { ComplianceDetail, TestStatus } from "../types/laboratoryTypes";
import type { TestExecutionResult } from "./laboratoryExecutionTypes";
import { calculateFreshConcreteSlump, calculateFreshConcreteTemperature } from "./freshConcreteTestEngine";
import { calculateHardenedConcreteCompressive, calculateHardenedConcreteSplitTensile } from "./hardenedConcreteTestEngine";

/**
 * Domain dispatcher for the four currently executable legacy concrete tests.
 * It deliberately preserves the legacy result shape and acceptance behavior;
 * planned registry entries are not treated as executable calculations.
 */
export function executeConcreteLegacyTest(testType: string, inputs: Record<string, any>): TestExecutionResult | undefined {
  switch (testType) {
    case "HC_COMPRESSIVE_STRENGTH": {
      const result = calculateHardenedConcreteCompressive({
        failureLoadKN: Number(inputs.failureLoadKN),
        loadedAreaMm2: Number(inputs.loadedAreaMm2),
        ageDays: Number(inputs.ageDays),
        targetStrengthMpa: inputs.targetStrengthMpa === undefined || inputs.targetStrengthMpa === "" ? undefined : Number(inputs.targetStrengthMpa),
        specimenId: String(inputs.specimenId || ""),
        batchId: String(inputs.batchId || "")
      });
      const hasAcceptanceRule = inputs.targetStrengthMpa !== undefined && inputs.targetStrengthMpa !== "";
      const status: TestStatus = hasAcceptanceRule ? result.strengthMpa >= Number(inputs.targetStrengthMpa) ? "PASS" : "FAIL" : "WARNING";
      return {
        results: { compressiveStrengthMpa: result.strengthMpa, failureLoadKN: inputs.failureLoadKN, loadedAreaMm2: inputs.loadedAreaMm2, ageDays: inputs.ageDays, specimenId: inputs.specimenId, batchId: inputs.batchId },
        status,
        score: status === "FAIL" ? 0 : 100,
        interpretation: hasAcceptanceRule ? (status === "PASS" ? "Compressive strength meets the supplied target." : "Compressive strength is below the supplied target.") : "Compressive strength calculated; acceptance remains under review because no project target was supplied.",
        complianceDetails: [{ parameter: "Compressive strength", measured: result.strengthMpa, unit: "MPa", limit: hasAcceptanceRule ? `Minimum ${inputs.targetStrengthMpa} MPa` : "Project acceptance profile required", status, note: hasAcceptanceRule ? "Compared with the supplied target." : "No acceptance decision is inferred without a project criterion." }],
        syncedProperties: { compressiveStrengthMpa: result.strengthMpa }
      };
    }
    case "HC_SPLIT_TENSILE": {
      const result = calculateHardenedConcreteSplitTensile({
        failureLoadKN: Number(inputs.failureLoadKN),
        cylinderDiameterMm: Number(inputs.cylinderDiameterMm),
        cylinderLengthMm: Number(inputs.cylinderLengthMm),
        ageDays: Number(inputs.ageDays),
        targetStrengthMpa: inputs.targetStrengthMpa === undefined || inputs.targetStrengthMpa === "" ? undefined : Number(inputs.targetStrengthMpa),
        specimenId: String(inputs.specimenId || ""),
        batchId: String(inputs.batchId || "")
      });
      const hasAcceptanceRule = inputs.targetStrengthMpa !== undefined && inputs.targetStrengthMpa !== "";
      const status: TestStatus = hasAcceptanceRule ? result.strengthMpa >= Number(inputs.targetStrengthMpa) ? "PASS" : "FAIL" : "WARNING";
      return {
        results: { splitTensileStrengthMpa: result.strengthMpa, failureLoadKN: inputs.failureLoadKN, cylinderDiameterMm: inputs.cylinderDiameterMm, cylinderLengthMm: inputs.cylinderLengthMm, ageDays: inputs.ageDays, specimenId: inputs.specimenId, batchId: inputs.batchId },
        status,
        score: status === "FAIL" ? 0 : 100,
        interpretation: hasAcceptanceRule ? (status === "PASS" ? "Splitting tensile strength meets the supplied target." : "Splitting tensile strength is below the supplied target.") : "Splitting tensile strength calculated; acceptance remains under review because no project target was supplied.",
        complianceDetails: [{ parameter: "Splitting tensile strength", measured: result.strengthMpa, unit: "MPa", limit: hasAcceptanceRule ? `Minimum ${inputs.targetStrengthMpa} MPa` : "Project acceptance profile required", status, note: hasAcceptanceRule ? "Compared with the supplied target." : "No acceptance decision is inferred without a project criterion." }],
        syncedProperties: { splitTensileStrengthMpa: result.strengthMpa }
      };
    }
    case "FC_SLUMP": {
      const result = calculateFreshConcreteSlump({
        slumpMm: Number(inputs.slumpMm),
        targetSlumpMm: inputs.targetSlumpMm === undefined || inputs.targetSlumpMm === "" ? undefined : Number(inputs.targetSlumpMm),
        toleranceMm: inputs.toleranceMm === undefined || inputs.toleranceMm === "" ? undefined : Number(inputs.toleranceMm),
        batchId: String(inputs.batchId || ""),
        placementLocation: inputs.placementLocation ? String(inputs.placementLocation) : undefined,
        measuredAt: inputs.measuredAt ? String(inputs.measuredAt) : undefined
      });
      const hasAcceptanceRule = result.deviationMm !== undefined && inputs.toleranceMm !== undefined && inputs.toleranceMm !== "";
      const status: TestStatus = hasAcceptanceRule ? Math.abs(result.deviationMm as number) <= Number(inputs.toleranceMm) ? "PASS" : "FAIL" : "WARNING";
      return {
        results: { slumpMm: result.slumpMm, targetSlumpMm: inputs.targetSlumpMm, toleranceMm: inputs.toleranceMm, deviationMm: result.deviationMm, batchId: inputs.batchId },
        status,
        score: status === "FAIL" ? 0 : 100,
        interpretation: hasAcceptanceRule ? (status === "PASS" ? "Slump is within the supplied project tolerance." : "Slump is outside the supplied project tolerance.") : "Slump measured; acceptance remains under review because a complete project acceptance rule was not supplied.",
        complianceDetails: [{ parameter: "Slump", measured: result.slumpMm, unit: "mm", limit: hasAcceptanceRule ? `Target ${inputs.targetSlumpMm} ± ${inputs.toleranceMm} mm` : "Project acceptance profile required", status, note: hasAcceptanceRule ? "Measured against the supplied target and tolerance." : "No PASS decision is inferred without a complete acceptance profile." }],
        syncedProperties: { slumpMm: result.slumpMm }
      };
    }
    case "FC_TEMPERATURE": {
      const result = calculateFreshConcreteTemperature({
        measuredTemperatureC: Number(inputs.measuredTemperatureC),
        ambientTemperatureC: inputs.ambientTemperatureC === undefined || inputs.ambientTemperatureC === "" ? undefined : Number(inputs.ambientTemperatureC),
        batchId: String(inputs.batchId || ""),
        measuredAt: inputs.measuredAt ? String(inputs.measuredAt) : undefined
      });
      const complianceDetails: ComplianceDetail[] = [{ parameter: "Fresh concrete temperature", measured: result.temperatureC, unit: "°C", limit: "Project acceptance profile required", status: "WARNING", note: "The physical screening range passed; no project limit was inferred." }];
      return {
        results: { temperatureC: result.temperatureC, ambientTemperatureC: inputs.ambientTemperatureC, batchId: inputs.batchId },
        status: "WARNING",
        score: 100,
        interpretation: "Fresh concrete temperature recorded; acceptance remains under review until a project acceptance profile is active.",
        complianceDetails,
        syncedProperties: { temperatureC: result.temperatureC }
      };
    }
    default:
      return undefined;
  }
}
