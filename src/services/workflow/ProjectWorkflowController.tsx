import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef 
} from "react";
import { useProjectStorage } from "../storage/ProjectContext";
import { ProjectMetadata } from "../storage/types";

export type ProjectStageNumber = 1 | 2 | 3 | 4 | 5;

export interface ProjectStageDefinition {
  number: ProjectStageNumber;
  id: string;
  nameKey: string;
  descKey: string;
  primaryTab: string;
  submoduleTabs: string[];
}

export const WORKFLOW_STAGES: ProjectStageDefinition[] = [
  {
    number: 1,
    id: "project_setup",
    nameKey: "workflow.step1.label",
    descKey: "workflow.step1.desc",
    primaryTab: "saved_projects",
    submoduleTabs: ["saved_projects", "cloud_storage", "project_properties"]
  },
  {
    number: 2,
    id: "material_library",
    nameKey: "workflow.step2.label",
    descKey: "workflow.step2.desc",
    primaryTab: "materials_library",
    submoduleTabs: ["materials_library", "materials", "cement_database", "aggregates_database", "water_admixture_database"]
  },
  {
    number: 3,
    id: "mix_proportioning",
    nameKey: "workflow.step3.label",
    descKey: "workflow.step3.desc",
    primaryTab: "calculator",
    submoduleTabs: ["calculator", "granular_skeleton", "methodology"]
  },
  {
    number: 4,
    id: "expense_budget",
    nameKey: "workflow.step5.label",
    descKey: "workflow.step5.desc",
    primaryTab: "cost",
    submoduleTabs: ["cost", "forecasting", "performance_analysis"]
  },
  {
    number: 5,
    id: "final_report",
    nameKey: "workflow.step6.label",
    descKey: "workflow.step6.desc",
    primaryTab: "reports",
    submoduleTabs: ["reports", "compliance_reports", "journal"]
  }
];

export const PROJECT_STAGES = WORKFLOW_STAGES;

export interface NavigationCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Pure function: Computes whether an active engineering project is effectively open.
 * Strictly requires both open intent (projectIsOpen state or user action) AND a valid project with metadata.id.
 * A stale session flag can never independently create an active project.
 */
export function computeEffectiveProjectIsOpen(
  sessionOrStateIsOpen: boolean,
  storageProjectId: string | null | undefined
): boolean {
  return Boolean(sessionOrStateIsOpen && storageProjectId);
}

/**
 * Pure function: Validates navigation to a target stage.
 * Rejects invalid stage numbers and blocks navigation when there is no valid active project.
 */
export function validateStageNavigation(
  targetStage: number,
  effectiveProjectIsOpen: boolean
): NavigationCheckResult {
  if (typeof targetStage !== "number" || targetStage < 1 || targetStage > 5 || !Number.isInteger(targetStage)) {
    return { allowed: false, reason: "Invalid stage range (must be integer 1..5)" };
  }
  if (!effectiveProjectIsOpen) {
    return { allowed: false, reason: "No active project is open. Please start or open a project." };
  }
  return { allowed: true };
}

/**
 * Pure function: Computes next sequential stage (1 -> 5), or null if at final stage.
 */
export function getNextStage(current: ProjectStageNumber): ProjectStageNumber | null {
  if (current < 5) {
    return (current + 1) as ProjectStageNumber;
  }
  return null;
}

/**
 * Pure function: Computes previous sequential stage (5 -> 1), or null if at first stage.
 */
export function getPrevStage(current: ProjectStageNumber): ProjectStageNumber | null {
  if (current > 1) {
    return (current - 1) as ProjectStageNumber;
  }
  return null;
}

/**
 * Pure function: Maps workspace tab ID to its corresponding ProjectStageNumber (1..5), or null if unmapped.
 */
export function getStageForTab(tab: string): ProjectStageNumber | null {
  for (const stage of WORKFLOW_STAGES) {
    if (stage.submoduleTabs.includes(tab)) {
      return stage.number;
    }
  }
  return null;
}

/**
 * Pure function: Returns primary workspace tab for a given stage number.
 */
export function getTabForStage(stage: ProjectStageNumber): string {
  const def = WORKFLOW_STAGES.find(s => s.number === stage);
  return def ? def.primaryTab : "saved_projects";
}

export interface ProjectWorkflowContextValue {
  // Core stage & state
  currentStage: ProjectStageNumber;
  activeStageInfo: ProjectStageDefinition;
  allStages: ProjectStageDefinition[];
  totalStages: number;
  projectIsOpen: boolean;
  activeProjectId: string | null;
  activeProjectMeta: ProjectMetadata | null;

  // Navigation
  canNavigateToStage: (targetStage: ProjectStageNumber) => NavigationCheckResult;
  goToStage: (targetStage: ProjectStageNumber) => boolean;
  nextStage: () => boolean;
  prevStage: () => boolean;

  // Project lifecycle operations
  startNewProject: (meta?: Partial<ProjectMetadata>) => Promise<void>;
  openExistingProject: () => Promise<boolean>;
  openFromFileObject: (file: File) => Promise<boolean>;
  closeProject: () => Promise<void>;

  // Tab - Stage mapping & coordination
  getStageForTab: (tab: string) => ProjectStageNumber | null;
  getTabForStage: (stage: ProjectStageNumber) => string;
  syncStageWithTab: (tab: string) => void;
}

const ProjectWorkflowContext = createContext<ProjectWorkflowContextValue | null>(null);

const SESSION_STORAGE_KEY = "snolab_active_project_is_open";

export const ProjectWorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    project: storageProject,
    createNewProject: storageCreateNew,
    openProject: storageOpen,
    openFromFileObject: storageOpenFromFile,
    saveProject: storageSave,
    hasUnsavedChanges: storageHasUnsaved
  } = useProjectStorage();

  // Workflow stage (1 to 6)
  const [currentStage, setCurrentStage] = useState<ProjectStageNumber>(1);

  // Single active project tracking from session storage (secondary persistence)
  const [projectIsOpen, setProjectIsOpen] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
      }
      return false;
    } catch {
      return false;
    }
  });

  // Authoritative project verification:
  // Effective open state strictly requires both open intent AND a real project with metadata.id
  const hasValidProject = Boolean(storageProject?.metadata?.id);
  const effectiveProjectIsOpen = computeEffectiveProjectIsOpen(projectIsOpen, storageProject?.metadata?.id);

  // Resilient synchronization: Clean up stale session storage flags if no valid project exists
  useEffect(() => {
    if (!hasValidProject && projectIsOpen) {
      setProjectIsOpen(false);
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch {
        // ignore
      }
    }
  }, [hasValidProject, projectIsOpen]);

  // Active Project ID and Metadata directly derived from underlying storage project
  const activeProjectId = useMemo<string | null>(() => {
    if (!effectiveProjectIsOpen || !storageProject?.metadata?.id) return null;
    return storageProject.metadata.id;
  }, [effectiveProjectIsOpen, storageProject?.metadata?.id]);

  const activeProjectMeta = useMemo<ProjectMetadata | null>(() => {
    if (!effectiveProjectIsOpen || !storageProject?.metadata) return null;
    return storageProject.metadata;
  }, [effectiveProjectIsOpen, storageProject?.metadata]);

  // Active stage info
  const activeStageInfo = useMemo(() => {
    return WORKFLOW_STAGES.find(s => s.number === currentStage) || WORKFLOW_STAGES[0];
  }, [currentStage]);

  // Stage Gating: Safe & non-destructive check
  const canNavigateToStage = useCallback((targetStage: ProjectStageNumber): NavigationCheckResult => {
    return validateStageNavigation(targetStage, effectiveProjectIsOpen);
  }, [effectiveProjectIsOpen]);

  // Navigation handlers
  const goToStage = useCallback((targetStage: ProjectStageNumber): boolean => {
    const check = canNavigateToStage(targetStage);
    if (!check.allowed) {
      console.warn(`[ProjectWorkflow] Navigation blocked:`, check.reason);
      return false;
    }
    setCurrentStage(targetStage);
    return true;
  }, [canNavigateToStage]);

  const nextStage = useCallback((): boolean => {
    const next = getNextStage(currentStage);
    if (next !== null) {
      return goToStage(next);
    }
    return false;
  }, [currentStage, goToStage]);

  const prevStage = useCallback((): boolean => {
    const prev = getPrevStage(currentStage);
    if (prev !== null) {
      return goToStage(prev);
    }
    return false;
  }, [currentStage, goToStage]);

  const syncStageWithTab = useCallback((tab: string) => {
    const stageNum = getStageForTab(tab);
    if (stageNum !== null) {
      setCurrentStage(stageNum);
    }
  }, []);

  // Project lifecycle operations
  const startNewProject = useCallback(async (meta?: Partial<ProjectMetadata>) => {
    await storageCreateNew(meta);
    setProjectIsOpen(true);
    setCurrentStage(1);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      }
    } catch {
      // ignore
    }
  }, [storageCreateNew]);

  const openExistingProject = useCallback(async (): Promise<boolean> => {
    const success = await storageOpen();
    if (success) {
      setProjectIsOpen(true);
      setCurrentStage(1);
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
        }
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  }, [storageOpen]);

  const openFromFileObject = useCallback(async (file: File): Promise<boolean> => {
    const success = await storageOpenFromFile(file);
    if (success) {
      setProjectIsOpen(true);
      setCurrentStage(1);
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
        }
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  }, [storageOpenFromFile]);

  const closeProject = useCallback(async () => {
    if (storageHasUnsaved) {
      let confirmSave = false;
      try {
        confirmSave = window.confirm("لديك تعديلات غير محفوظة في المشروع الحالي. هل تريد حفظها قبل الإغلاق؟\nYou have unsaved changes. Save before closing?");
      } catch {
        confirmSave = false;
      }
      if (confirmSave) {
        await storageSave();
      }
    }
    setProjectIsOpen(false);
    setCurrentStage(1);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [storageHasUnsaved, storageSave]);

  const value = useMemo<ProjectWorkflowContextValue>(() => ({
    currentStage,
    activeStageInfo,
    allStages: WORKFLOW_STAGES,
    totalStages: 5,
    projectIsOpen: effectiveProjectIsOpen,
    activeProjectId,
    activeProjectMeta,
    canNavigateToStage,
    goToStage,
    nextStage,
    prevStage,
    startNewProject,
    openExistingProject,
    openFromFileObject,
    closeProject,
    getStageForTab,
    getTabForStage,
    syncStageWithTab
  }), [
    currentStage,
    activeStageInfo,
    effectiveProjectIsOpen,
    activeProjectId,
    activeProjectMeta,
    canNavigateToStage,
    goToStage,
    nextStage,
    prevStage,
    startNewProject,
    openExistingProject,
    openFromFileObject,
    closeProject,
    syncStageWithTab
  ]);

  return (
    <ProjectWorkflowContext.Provider value={value}>
      {children}
    </ProjectWorkflowContext.Provider>
  );
};

export const useProjectWorkflow = (): ProjectWorkflowContextValue => {
  const context = useContext(ProjectWorkflowContext);
  if (!context) {
    throw new Error("useProjectWorkflow must be used within a ProjectWorkflowProvider");
  }
  return context;
};
