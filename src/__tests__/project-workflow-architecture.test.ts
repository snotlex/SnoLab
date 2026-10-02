import { describe, it, expect } from "vitest";
import {
  PROJECT_STAGES,
  WORKFLOW_STAGES,
  computeEffectiveProjectIsOpen,
  evaluateStageGate,
  validateStageNavigation,
  getNextStage,
  getPrevStage,
  getStageForTab,
  getTabForStage,
  ProjectStageNumber
} from "../services/workflow/ProjectWorkflowController";

const baseProject = (overrides: any = {}): any => ({
  schemaVersion: 1,
  fileType: "snolab_project",
  appVersion: "test",
  exportedAt: "2026-10-02T00:00:00.000Z",
  metadata: { id: "P-1", name: "Project", client: "Client", plant: "Plant", engineer: "Engineer" },
  settings: { language: "ar", currency: "DZD", unitSystem: "metric", selectedMethod: "dreux", costBasis: "dry", autoDensities: false },
  materials: [
    { id: "cement-1" }, { id: "sand-1" }, { id: "gravel-1" }
  ],
  laboratoryTests: [],
  materialProperties: {},
  mixDesigns: {
    currentInputs: { fck28: 25, dMax: 20, slump: 8, cementClassStrength: 42.5, cementType: "CEM I", concreteType: "NSC", selectedMethod: "dreux", selectedCementId: "cement-1", selectedSandId: "sand-1", selectedGravelId: "gravel-1" },
    currentResults: { valid: true, isValid: true, calculationStatus: "valid" }
  },
  validationRecords: [{ status: "PASSED" }],
  reports: [{ id: "R-1", name: "Report", type: "technical", generatedAt: "2026-10-02" }],
  notes: [],
  history: [],
  ...overrides
});

describe("Seven-stage project workflow architecture", () => {
  it("defines exactly seven canonical stages in the requested order", () => {
    expect(WORKFLOW_STAGES).toHaveLength(7);
    expect(PROJECT_STAGES).toHaveLength(7);
    expect(WORKFLOW_STAGES.map(stage => stage.id)).toEqual([
      "project_setup", "requirements", "materials_verification", "mix_calculation", "trial_mix", "lab_review", "release_report"
    ]);
    expect(WORKFLOW_STAGES.map(stage => stage.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("allows valid navigation only when the active project and forward gate exist", () => {
    const project = baseProject();
    for (let stage = 1; stage <= 7; stage++) {
      expect(validateStageNavigation(stage, true, stage as ProjectStageNumber, project).allowed).toBe(true);
    }
    expect(validateStageNavigation(7, true, 1, project).allowed).toBe(true);
  });

  it("rejects invalid stage numbers and missing projects", () => {
    expect(validateStageNavigation(0, true).allowed).toBe(false);
    expect(validateStageNavigation(8, true).allowed).toBe(false);
    expect(validateStageNavigation(2.5, true).allowed).toBe(false);
    expect(validateStageNavigation(2, false).reason).toContain("No active project");
  });

  it("blocks forward navigation at the first unmet gate with actionable reason codes", () => {
    const incomplete = baseProject({ mixDesigns: { currentInputs: {} }, materials: [], validationRecords: [], reports: [] });
    const check = validateStageNavigation(4, true, 1, incomplete);
    expect(check.allowed).toBe(false);
    expect(check.gate?.reasons).toContain("REQUIREMENTS_INCOMPLETE");
    expect(check.gate?.reasons).toContain("MATERIALS_NOT_VERIFIED");
  });

  it("evaluates every gate independently and reports the final release requirements", () => {
    const project = baseProject();
    expect(evaluateStageGate(1, project).ready).toBe(true);
    expect(evaluateStageGate(2, project).ready).toBe(true);
    expect(evaluateStageGate(3, project).ready).toBe(true);
    expect(evaluateStageGate(4, project).ready).toBe(true);
    expect(evaluateStageGate(5, project).ready).toBe(true);
    expect(evaluateStageGate(6, project).ready).toBe(true);
    expect(evaluateStageGate(7, project).ready).toBe(true);
    expect(evaluateStageGate(7, baseProject({ reports: [] })).reasons).toContain("REPORT_NOT_GENERATED");
  });

  it("supports sequential next/previous boundaries across seven stages", () => {
    expect(getNextStage(6)).toBe(7);
    expect(getNextStage(7)).toBeNull();
    expect(getPrevStage(7)).toBe(6);
    expect(getPrevStage(1)).toBeNull();
  });

  it("maps primary and submodule tabs without losing the legacy calculator/library paths", () => {
    expect(getTabForStage(1)).toBe("saved_projects");
    expect(getTabForStage(2)).toBe("cloud_storage");
    expect(getTabForStage(3)).toBe("calculator");
    expect(getTabForStage(4)).toBe("calculator");
    expect(getTabForStage(5)).toBe("batch_preparation");
    expect(getTabForStage(6)).toBe("quality_control");
    expect(getTabForStage(7)).toBe("reports");
    expect(getStageForTab("calculator")).toBe(4);
    expect(getStageForTab("materials_lab")).toBe(6);
    expect(getStageForTab("compliance_reports")).toBe(7);
    expect(getStageForTab("non_existent_tab")).toBeNull();
  });

  it("never treats a stale session flag as an active project", () => {
    expect(computeEffectiveProjectIsOpen(true, undefined)).toBe(false);
    expect(computeEffectiveProjectIsOpen(true, null)).toBe(false);
    expect(computeEffectiveProjectIsOpen(false, "P-1")).toBe(false);
    expect(computeEffectiveProjectIsOpen(true, "P-1")).toBe(true);
  });
});
