export type CalculationStageState = "complete" | "warning" | "blocked" | "pending";

export interface CalculationStageInput {
  results: any;
  criticalErrors: number;
  warnings: number;
  selectedMaterialCount: number;
}

export interface CalculationStageStatus {
  id: "inputs" | "materials" | "water-binder" | "aggregates" | "admixtures" | "volume" | "compliance";
  state: CalculationStageState;
  values: string[];
}

const finitePositive = (value: unknown) => Number.isFinite(Number(value)) && Number(value) > 0;

export function buildCalculationStageStatuses(input: CalculationStageInput): CalculationStageStatus[] {
  const result = input.results || {};
  const materialsReady = input.selectedMaterialCount >= 4;
  const waterReady = finitePositive(result.waterContentActual || result.designWater) && finitePositive(result.cementWeight || result.cementKg);
  const aggregatesReady = finitePositive(result.sandWeightDry) && finitePositive(result.gravelWeightDry) && Number.isFinite(Number(result.sandPercent));
  const absoluteVolume = Number(result.absoluteVolumeCheck?.totalAbsVolumeL ?? result.absoluteVolumeTotal);
  const volumeReady = Number.isFinite(absoluteVolume) && absoluteVolume > 0;
  const hasCriticalCalculation = input.criticalErrors > 0 || result.calculationStatus === "blocked" || result.materialSuitability?.status === "blocked";
  const warningState = input.warnings > 0;
  const state = (ready: boolean): CalculationStageState => !ready ? "pending" : hasCriticalCalculation ? "blocked" : warningState ? "warning" : "complete";

  return [
    { id: "inputs", state: state(input.criticalErrors === 0), values: input.criticalErrors ? [`${input.criticalErrors} critical`] : ["validated"] },
    { id: "materials", state: state(materialsReady), values: [`${input.selectedMaterialCount}/4 base materials`] },
    { id: "water-binder", state: state(waterReady), values: [finitePositive(result.waterContentActual || result.designWater) ? `${Math.round(Number(result.waterContentActual || result.designWater))} L/m³` : "water pending", finitePositive(result.cementWeight || result.cementKg) ? `${Math.round(Number(result.cementWeight || result.cementKg))} kg/m³` : "binder pending"] },
    { id: "aggregates", state: state(aggregatesReady), values: [Number.isFinite(Number(result.sandPercent)) ? `sand ${Math.round(Number(result.sandPercent))}%` : "grading pending", finitePositive(result.sandWeightDry) && finitePositive(result.gravelWeightDry) ? "dry masses ready" : "masses pending"] },
    { id: "admixtures", state: state(Array.isArray(result.admixtureWeights)), values: [Array.isArray(result.admixtureWeights) && result.admixtureWeights.length ? `${result.admixtureWeights.length} dosage(s)` : "no active dosage"] },
    { id: "volume", state: state(volumeReady), values: [volumeReady ? `${Math.round(absoluteVolume)} L absolute volume` : "volume closure pending"] },
    { id: "compliance", state: input.criticalErrors > 0 ? "blocked" : warningState ? "warning" : input.results ? "complete" : "pending", values: input.criticalErrors ? [`${input.criticalErrors} blocking issue(s)`] : input.warnings ? [`${input.warnings} review warning(s)`] : ["ready for review"] }
  ];
}
