import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from "react";
import { useProjectStorage } from "../storage/ProjectContext";
import type { ProjectMetadata, SnoLabProjectFile } from "../storage/types";

export type ProjectStageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ProjectStageDefinition {
  number: ProjectStageNumber;
  id: string;
  nameKey: string;
  descKey: string;
  primaryTab: string;
  submoduleTabs: string[];
}

/** Canonical product path: requirements → verification → design → trial → review → release. */
export const WORKFLOW_STAGES: ProjectStageDefinition[] = [
  { number: 1, id: "project_setup", nameKey: "workflow.stage1.label", descKey: "workflow.stage1.desc", primaryTab: "saved_projects", submoduleTabs: ["saved_projects", "cloud_storage"] },
  { number: 2, id: "requirements", nameKey: "workflow.stage2.label", descKey: "workflow.stage2.desc", primaryTab: "cloud_storage", submoduleTabs: ["cloud_storage", "project_properties"] },
  { number: 3, id: "materials_verification", nameKey: "workflow.stage3.label", descKey: "workflow.stage3.desc", primaryTab: "materials_library", submoduleTabs: ["materials_library", "materials", "cement_database", "aggregates_database", "admixtures_database", "water_admixture_database"] },
  { number: 4, id: "mix_calculation", nameKey: "workflow.stage4.label", descKey: "workflow.stage4.desc", primaryTab: "calculator", submoduleTabs: ["calculator", "granular_skeleton", "methodology"] },
  { number: 5, id: "trial_mix", nameKey: "workflow.stage5.label", descKey: "workflow.stage5.desc", primaryTab: "batch_preparation", submoduleTabs: ["batch_preparation", "batch_ticket"] },
  { number: 6, id: "lab_review", nameKey: "workflow.stage6.label", descKey: "workflow.stage6.desc", primaryTab: "quality_control", submoduleTabs: ["quality_control", "materials_lab", "academic_lab", "lab_validation", "quality_assets"] },
  { number: 7, id: "release_report", nameKey: "workflow.stage7.label", descKey: "workflow.stage7.desc", primaryTab: "reports", submoduleTabs: ["reports", "compliance_reports", "journal", "cost", "forecasting", "performance_analysis"] }
];

export const PROJECT_STAGES = WORKFLOW_STAGES;

export interface StageGateResult {
  stage: ProjectStageNumber;
  ready: boolean;
  reasonCode?: string;
  reasons: string[];
}

const finitePositive = (value: unknown): boolean => typeof value === "number" && Number.isFinite(value) && value > 0;
const hasProjectRequirements = (project: SnoLabProjectFile): boolean => {
  const input = project.mixDesigns?.currentInputs;
  return Boolean(
    input &&
    finitePositive(input.fck28) &&
    finitePositive(input.dMax) &&
    finitePositive(input.slump) &&
    finitePositive(input.cementClassStrength) &&
    Boolean(input.cementType) &&
    Boolean(input.concreteType) &&
    Boolean(input.selectedMethod)
  );
};

/** Pure, deterministic readiness evaluation used by navigation and UI. */
export function evaluateStageGate(stage: ProjectStageNumber, project?: SnoLabProjectFile): StageGateResult {
  const reasons: string[] = [];
  if (!project) return { stage, ready: false, reasonCode: "PROJECT_REQUIRED", reasons: ["Open or create a project first."] };

  if (stage >= 1 && (!project.metadata?.id || !project.metadata.name || !project.metadata.client || !project.metadata.plant)) {
    reasons.push("PROJECT_SETUP_INCOMPLETE");
  }
  if (stage >= 2 && !hasProjectRequirements(project)) reasons.push("REQUIREMENTS_INCOMPLETE");
  if (stage >= 3) {
    const input = project.mixDesigns?.currentInputs;
    const materials = project.materials || [];
    const selectedIds = [input?.selectedCementId, input?.selectedSandId, input?.selectedGravelId];
    if (selectedIds.some(id => !id || !materials.some(material => material.id === id))) reasons.push("MATERIALS_NOT_VERIFIED");
  }
  if (stage >= 4) {
    const result = project.mixDesigns?.currentResults;
    if (!result || result.valid === false || result.isValid === false || result.calculationStatus === "blocked" || result.calculationStatus === "needs_data") reasons.push("CALCULATION_NOT_VALID");
  }
  if (stage >= 5 && !(project.validationRecords || []).some(record => record.status === "PASSED")) reasons.push("TRIAL_MIX_REQUIRED");
  if (stage >= 6) {
    const approvedSession = (project.governance?.auditEvents || []).length >= 0 && (project as any).laboratorySessions?.some((session: any) => session.status === "APPROVED" && session.review?.decision === "APPROVED");
    if (!approvedSession && !(project.validationRecords || []).some(record => record.status === "PASSED")) reasons.push("LAB_REVIEW_REQUIRED");
  }
  if (stage >= 7) {
    const reports = project.reports || [];
    if (!reports.length) reasons.push("REPORT_NOT_GENERATED");
  }

  return { stage, ready: reasons.length === 0, reasonCode: reasons[0], reasons };
}

export interface NavigationCheckResult {
  allowed: boolean;
  reason?: string;
  gate?: StageGateResult;
}

export function computeEffectiveProjectIsOpen(sessionOrStateIsOpen: boolean, storageProjectId: string | null | undefined): boolean {
  return Boolean(sessionOrStateIsOpen && storageProjectId);
}

/** Navigation is forward-gated; moving backward remains available for correction. */
export function validateStageNavigation(
  targetStage: number,
  effectiveProjectIsOpen: boolean,
  currentStage: ProjectStageNumber = 1,
  project?: SnoLabProjectFile
): NavigationCheckResult {
  if (typeof targetStage !== "number" || targetStage < 1 || targetStage > 7 || !Number.isInteger(targetStage)) {
    return { allowed: false, reason: "Invalid stage range (must be integer 1..7)" };
  }
  if (!effectiveProjectIsOpen) return { allowed: false, reason: "No active project is open. Please start or open a project." };
  const gate = evaluateStageGate(targetStage as ProjectStageNumber, project);
  if (targetStage > currentStage && !gate.ready) {
    return { allowed: false, reason: `Navigation blocked: ${gate.reasons.join(", ")}`, gate };
  }
  return { allowed: true, gate };
}

export function getNextStage(current: ProjectStageNumber): ProjectStageNumber | null {
  return current < 7 ? (current + 1) as ProjectStageNumber : null;
}
export function getPrevStage(current: ProjectStageNumber): ProjectStageNumber | null {
  return current > 1 ? (current - 1) as ProjectStageNumber : null;
}
export function getStageForTab(tab: string): ProjectStageNumber | null {
  for (const stage of WORKFLOW_STAGES) if (stage.submoduleTabs.includes(tab)) return stage.number;
  return null;
}
export function getTabForStage(stage: ProjectStageNumber): string {
  return WORKFLOW_STAGES.find(s => s.number === stage)?.primaryTab || "saved_projects";
}

export interface ProjectWorkflowContextValue {
  currentStage: ProjectStageNumber;
  activeStageInfo: ProjectStageDefinition;
  allStages: ProjectStageDefinition[];
  totalStages: number;
  projectIsOpen: boolean;
  activeProjectId: string | null;
  activeProjectMeta: ProjectMetadata | null;
  getStageGate: (stage: ProjectStageNumber) => StageGateResult;
  canNavigateToStage: (targetStage: ProjectStageNumber) => NavigationCheckResult;
  goToStage: (targetStage: ProjectStageNumber) => boolean;
  nextStage: () => boolean;
  prevStage: () => boolean;
  startNewProject: (meta?: Partial<ProjectMetadata>) => Promise<void>;
  openExistingProject: () => Promise<boolean>;
  openFromFileObject: (file: File) => Promise<boolean>;
  closeProject: () => Promise<void>;
  getStageForTab: (tab: string) => ProjectStageNumber | null;
  getTabForStage: (stage: ProjectStageNumber) => string;
  syncStageWithTab: (tab: string) => void;
}

const ProjectWorkflowContext = createContext<ProjectWorkflowContextValue | null>(null);
const SESSION_STORAGE_KEY = "snolab_active_project_is_open";

export const ProjectWorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { project: storageProject, createNewProject: storageCreateNew, openProject: storageOpen, openFromFileObject: storageOpenFromFile, saveProject: storageSave, hasUnsavedChanges: storageHasUnsaved } = useProjectStorage();
  const [currentStage, setCurrentStage] = useState<ProjectStageNumber>(1);
  const [projectIsOpen, setProjectIsOpen] = useState<boolean>(() => {
    try { return typeof window !== "undefined" && window.sessionStorage?.getItem(SESSION_STORAGE_KEY) === "true"; } catch { return false; }
  });
  const hasValidProject = Boolean(storageProject?.metadata?.id);
  const effectiveProjectIsOpen = computeEffectiveProjectIsOpen(projectIsOpen, storageProject?.metadata?.id);

  useEffect(() => {
    if (!hasValidProject && projectIsOpen) {
      setProjectIsOpen(false);
      try { window.sessionStorage?.removeItem(SESSION_STORAGE_KEY); } catch { /* ignore */ }
    }
  }, [hasValidProject, projectIsOpen]);

  const activeProjectId = useMemo(() => effectiveProjectIsOpen ? storageProject?.metadata?.id || null : null, [effectiveProjectIsOpen, storageProject?.metadata?.id]);
  const activeProjectMeta = useMemo(() => effectiveProjectIsOpen ? storageProject?.metadata || null : null, [effectiveProjectIsOpen, storageProject?.metadata]);
  const activeStageInfo = useMemo(() => WORKFLOW_STAGES.find(s => s.number === currentStage) || WORKFLOW_STAGES[0], [currentStage]);
  const getStageGate = useCallback((stage: ProjectStageNumber) => evaluateStageGate(stage, storageProject || undefined), [storageProject]);
  const canNavigateToStage = useCallback((targetStage: ProjectStageNumber) => validateStageNavigation(targetStage, effectiveProjectIsOpen, currentStage, storageProject || undefined), [effectiveProjectIsOpen, currentStage, storageProject]);
  const goToStage = useCallback((targetStage: ProjectStageNumber) => {
    const check = canNavigateToStage(targetStage);
    if (!check.allowed) { console.warn("[ProjectWorkflow] Navigation blocked:", check.reason); return false; }
    setCurrentStage(targetStage);
    return true;
  }, [canNavigateToStage]);
  const nextStage = useCallback(() => { const next = getNextStage(currentStage); return next === null ? false : goToStage(next); }, [currentStage, goToStage]);
  const prevStage = useCallback(() => { const prev = getPrevStage(currentStage); return prev === null ? false : goToStage(prev); }, [currentStage, goToStage]);
  const syncStageWithTab = useCallback((tab: string) => { const stage = getStageForTab(tab); if (stage !== null) setCurrentStage(stage); }, []);

  const markOpen = useCallback(() => {
    setProjectIsOpen(true); setCurrentStage(1);
    try { window.sessionStorage?.setItem(SESSION_STORAGE_KEY, "true"); } catch { /* ignore */ }
  }, []);
  const startNewProject = useCallback(async (meta?: Partial<ProjectMetadata>) => { await storageCreateNew(meta); markOpen(); }, [storageCreateNew, markOpen]);
  const openExistingProject = useCallback(async () => { const success = await storageOpen(); if (success) markOpen(); return success; }, [storageOpen, markOpen]);
  const openFromFileObject = useCallback(async (file: File) => { const success = await storageOpenFromFile(file); if (success) markOpen(); return success; }, [storageOpenFromFile, markOpen]);
  const closeProject = useCallback(async () => {
    if (storageHasUnsaved) { let confirmSave = false; try { confirmSave = window.confirm("لديك تعديلات غير محفوظة في المشروع الحالي. هل تريد حفظها قبل الإغلاق؟\nYou have unsaved changes. Save before closing?"); } catch { /* ignore */ } if (confirmSave) await storageSave(); }
    setProjectIsOpen(false); setCurrentStage(1); try { window.sessionStorage?.removeItem(SESSION_STORAGE_KEY); } catch { /* ignore */ }
  }, [storageHasUnsaved, storageSave]);

  const value = useMemo<ProjectWorkflowContextValue>(() => ({ currentStage, activeStageInfo, allStages: WORKFLOW_STAGES, totalStages: 7, projectIsOpen: effectiveProjectIsOpen, activeProjectId, activeProjectMeta, getStageGate, canNavigateToStage, goToStage, nextStage, prevStage, startNewProject, openExistingProject, openFromFileObject, closeProject, getStageForTab, getTabForStage, syncStageWithTab }), [currentStage, activeStageInfo, effectiveProjectIsOpen, activeProjectId, activeProjectMeta, getStageGate, canNavigateToStage, goToStage, nextStage, prevStage, startNewProject, openExistingProject, openFromFileObject, closeProject, syncStageWithTab]);
  return <ProjectWorkflowContext.Provider value={value}>{children}</ProjectWorkflowContext.Provider>;
};

export const useProjectWorkflow = (): ProjectWorkflowContextValue => {
  const context = useContext(ProjectWorkflowContext);
  if (!context) throw new Error("useProjectWorkflow must be used within a ProjectWorkflowProvider");
  return context;
};
