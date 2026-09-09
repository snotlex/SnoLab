import { describe, it, expect } from "vitest";
import { 
  PROJECT_STAGES, 
  WORKFLOW_STAGES,
  ProjectStageNumber,
  computeEffectiveProjectIsOpen,
  validateStageNavigation,
  getNextStage,
  getPrevStage,
  getStageForTab,
  getTabForStage
} from "../services/workflow/ProjectWorkflowController";

describe("Phase 1: Project Workflow Architecture & Controller Behavior", () => {
  // Test A — Six stages
  it("Test A: defines exactly 6 canonical project workflow stages in order (1 -> 6)", () => {
    expect(WORKFLOW_STAGES).toHaveLength(6);
    expect(PROJECT_STAGES).toHaveLength(6);
    expect(WORKFLOW_STAGES.map(s => s.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(WORKFLOW_STAGES[0].nameKey).toBe("workflow.step1.label");
    expect(WORKFLOW_STAGES[1].nameKey).toBe("workflow.step2.label");
    expect(WORKFLOW_STAGES[2].nameKey).toBe("workflow.step3.label");
    expect(WORKFLOW_STAGES[3].nameKey).toBe("workflow.step4.label");
    expect(WORKFLOW_STAGES[4].nameKey).toBe("workflow.step5.label");
    expect(WORKFLOW_STAGES[5].nameKey).toBe("workflow.step6.label");
  });

  // Test B — Stage navigation with open project
  it("Test B: allows navigation to any valid stage (1..6) when a valid project is open", () => {
    const isProjectOpen = true;
    for (let stage = 1; stage <= 6; stage++) {
      const result = validateStageNavigation(stage, isProjectOpen);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    }
  });

  // Test C — Invalid stage rejection
  it("Test C: rejects invalid stage numbers (< 1, > 6, non-integers)", () => {
    const isProjectOpen = true;
    expect(validateStageNavigation(0, isProjectOpen).allowed).toBe(false);
    expect(validateStageNavigation(7, isProjectOpen).allowed).toBe(false);
    expect(validateStageNavigation(-1, isProjectOpen).allowed).toBe(false);
    expect(validateStageNavigation(2.5, isProjectOpen).allowed).toBe(false);
    expect(validateStageNavigation(NaN, isProjectOpen).allowed).toBe(false);
    expect(validateStageNavigation(0, isProjectOpen).reason).toContain("Invalid stage range");
  });

  // Test D — No active project blocks navigation
  it("Test D: blocks stage navigation when there is no valid active project", () => {
    const isProjectOpen = false;
    for (let stage = 1; stage <= 6; stage++) {
      const result = validateStageNavigation(stage, isProjectOpen);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("No active project is open. Please start or open a project.");
    }
  });

  // Test E — nextStage progression
  it("Test E: verifies nextStage step-by-step sequential progression (1 -> 2 -> 3 -> 4 -> 5 -> 6) and boundary at 6", () => {
    expect(getNextStage(1)).toBe(2);
    expect(getNextStage(2)).toBe(3);
    expect(getNextStage(3)).toBe(4);
    expect(getNextStage(4)).toBe(5);
    expect(getNextStage(5)).toBe(6);
    expect(getNextStage(6)).toBeNull(); // Terminal boundary
  });

  // Test F — prevStage regression
  it("Test F: verifies prevStage step-by-step regression (6 -> 5 -> 4 -> 3 -> 2 -> 1) and boundary at 1", () => {
    expect(getPrevStage(6)).toBe(5);
    expect(getPrevStage(5)).toBe(4);
    expect(getPrevStage(4)).toBe(3);
    expect(getPrevStage(3)).toBe(2);
    expect(getPrevStage(2)).toBe(1);
    expect(getPrevStage(1)).toBeNull(); // Initial boundary
  });

  // Test G — Stage <-> Tab bidirectional mapping
  it("Test G: verifies two-way Stage <-> Tab mapping for primary and submodule tabs", () => {
    // Primary tab mappings
    expect(getTabForStage(1)).toBe("saved_projects");
    expect(getTabForStage(2)).toBe("materials_library");
    expect(getTabForStage(3)).toBe("calculator");
    expect(getTabForStage(4)).toBe("materials_lab");
    expect(getTabForStage(5)).toBe("cost");
    expect(getTabForStage(6)).toBe("reports");

    // Stage resolution from primary tabs
    expect(getStageForTab("saved_projects")).toBe(1);
    expect(getStageForTab("materials_library")).toBe(2);
    expect(getStageForTab("calculator")).toBe(3);
    expect(getStageForTab("materials_lab")).toBe(4);
    expect(getStageForTab("cost")).toBe(5);
    expect(getStageForTab("reports")).toBe(6);

    // Stage resolution from submodule tabs
    expect(getStageForTab("cloud_storage")).toBe(1);
    expect(getStageForTab("cement_database")).toBe(2);
    expect(getStageForTab("granular_skeleton")).toBe(3);
    expect(getStageForTab("academic_lab")).toBe(4);
    expect(getStageForTab("forecasting")).toBe(5);
    expect(getStageForTab("compliance_reports")).toBe(6);

    // Unknown tabs return null
    expect(getStageForTab("non_existent_tab")).toBeNull();
  });

  // Test H — No implicit project
  it("Test H: verifies that a stale session flag or missing project metadata cannot create a valid active project", () => {
    // Stale session flag with no storage project id
    expect(computeEffectiveProjectIsOpen(true, undefined)).toBe(false);
    expect(computeEffectiveProjectIsOpen(true, null)).toBe(false);
    expect(computeEffectiveProjectIsOpen(true, "")).toBe(false);

    // Project exists in storage but projectIsOpen state is false
    expect(computeEffectiveProjectIsOpen(false, "PROJ-2026-001")).toBe(false);

    // Both state is false and id is missing
    expect(computeEffectiveProjectIsOpen(false, undefined)).toBe(false);

    // Authoritative valid active project: BOTH open intent and valid project metadata ID must exist
    expect(computeEffectiveProjectIsOpen(true, "PROJ-2026-001")).toBe(true);
  });
});

