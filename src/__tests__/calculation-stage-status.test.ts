import { describe, expect, it } from "vitest";
import { buildCalculationStageStatuses } from "../services/calculationStageStatus";

const validResults = {
  cementWeight: 360,
  waterContentActual: 180,
  sandWeightDry: 720,
  gravelWeightDry: 1040,
  sandPercent: 42,
  admixtureWeights: [],
  absoluteVolumeCheck: { totalAbsVolumeL: 1000 }
};

describe("calculation stage status", () => {
  it("exposes a complete staged path when inputs and outputs are ready", () => {
    const stages = buildCalculationStageStatuses({ results: validResults, criticalErrors: 0, warnings: 0, selectedMaterialCount: 4 });
    expect(stages.every(stage => stage.state === "complete")).toBe(true);
    expect(stages.find(stage => stage.id === "water-binder")?.values).toContain("180 L/m³");
    expect(stages.find(stage => stage.id === "volume")?.values).toContain("1000 L absolute volume");
  });

  it("keeps missing material selections pending instead of claiming completion", () => {
    const stages = buildCalculationStageStatuses({ results: validResults, criticalErrors: 0, warnings: 0, selectedMaterialCount: 2 });
    expect(stages.find(stage => stage.id === "materials")?.state).toBe("pending");
  });

  it("propagates blocking and warning states to every ready calculation gate", () => {
    const blocked = buildCalculationStageStatuses({ results: validResults, criticalErrors: 1, warnings: 0, selectedMaterialCount: 4 });
    expect(blocked.find(stage => stage.id === "water-binder")?.state).toBe("blocked");
    const review = buildCalculationStageStatuses({ results: validResults, criticalErrors: 0, warnings: 2, selectedMaterialCount: 4 });
    expect(review.find(stage => stage.id === "aggregates")?.state).toBe("warning");
    expect(review.find(stage => stage.id === "compliance")?.state).toBe("warning");
  });
});
