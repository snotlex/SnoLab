import { describe, it, expect } from "vitest";
import { PROJECT_STAGES, ProjectStageNumber } from "../services/workflow/ProjectWorkflowController";

describe("Phase 1: Project Workflow Architecture", () => {
  it("defines exactly 6 canonical project workflow stages in order", () => {
    expect(PROJECT_STAGES).toHaveLength(6);
    expect(PROJECT_STAGES.map(s => s.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(PROJECT_STAGES[0].nameKey).toBe("workflow.step1.label");
    expect(PROJECT_STAGES[1].nameKey).toBe("workflow.step2.label");
    expect(PROJECT_STAGES[2].nameKey).toBe("workflow.step3.label");
    expect(PROJECT_STAGES[3].nameKey).toBe("workflow.step4.label");
    expect(PROJECT_STAGES[4].nameKey).toBe("workflow.step5.label");
    expect(PROJECT_STAGES[5].nameKey).toBe("workflow.step6.label");
  });

  it("maps each stage to the correct canonical primary workspace tab", () => {
    expect(PROJECT_STAGES[0].primaryTab).toBe("saved_projects");
    expect(PROJECT_STAGES[1].primaryTab).toBe("materials_library");
    expect(PROJECT_STAGES[2].primaryTab).toBe("calculator");
    expect(PROJECT_STAGES[3].primaryTab).toBe("materials_lab");
    expect(PROJECT_STAGES[4].primaryTab).toBe("cost");
    expect(PROJECT_STAGES[5].primaryTab).toBe("reports");
  });

  it("correctly handles stage 4 as Mix Calibration / Laboratory", () => {
    const stage4 = PROJECT_STAGES.find(s => s.number === 4);
    expect(stage4).toBeDefined();
    expect(stage4?.id).toBe("mix_calibration");
    expect(stage4?.nameKey).toBe("workflow.step4.label");
  });
});
