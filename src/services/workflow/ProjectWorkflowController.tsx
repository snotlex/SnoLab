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

export type ProjectStageNumber = 1 | 2 | 3 | 4 | 5 | 6;

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
    id: "mix_calibration",
    nameKey: "workflow.step4.label",
    descKey: "workflow.step4.desc",
    primaryTab: "materials_lab",
    submoduleTabs: ["materials_lab", "academic_lab", "lab_validation", "optimization", "simulation"]
  },
  {
    number: 5,
    id: "expense_budget",
    nameKey: "workflow.step5.label",
    descKey: "workflow.step5.desc",
    primaryTab: "cost",
    submoduleTabs: ["cost", "forecasting", "performance_analysis"]
  },
  {
    number: 6,
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

  // Single active project tracking
  const [projectIsOpen, setProjectIsOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Active Project ID and Metadata directly derived from underlying storage project
  const activeProjectId = useMemo<string | null>(() => {
    if (!projectIsOpen || !storageProject?.metadata?.id) return null;
    return storageProject.metadata.id;
  }, [projectIsOpen, storageProject?.metadata?.id]);

  const activeProjectMeta = useMemo<ProjectMetadata | null>(() => {
    if (!projectIsOpen || !storageProject?.metadata) return null;
    return storageProject.metadata;
  }, [projectIsOpen, storageProject?.metadata]);

  // Active stage info
  const activeStageInfo = useMemo(() => {
    return WORKFLOW_STAGES.find(s => s.number === currentStage) || WORKFLOW_STAGES[0];
  }, [currentStage]);

  // Stage Gating: Safe & non-destructive check
  const canNavigateToStage = useCallback((targetStage: ProjectStageNumber): NavigationCheckResult => {
    if (targetStage < 1 || targetStage > 6) {
      return { allowed: false, reason: "Invalid stage range (must be 1..6)" };
    }
    if (!projectIsOpen) {
      return { allowed: false, reason: "No active project is open. Please start or open a project." };
    }
    // Safe, non-destructive stage transition
    return { allowed: true };
  }, [projectIsOpen]);

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
    if (currentStage < 6) {
      return goToStage((currentStage + 1) as ProjectStageNumber);
    }
    return false;
  }, [currentStage, goToStage]);

  const prevStage = useCallback((): boolean => {
    if (currentStage > 1) {
      return goToStage((currentStage - 1) as ProjectStageNumber);
    }
    return false;
  }, [currentStage, goToStage]);

  // Tab mapping
  const getStageForTab = useCallback((tab: string): ProjectStageNumber | null => {
    for (const stage of WORKFLOW_STAGES) {
      if (stage.submoduleTabs.includes(tab)) {
        return stage.number;
      }
    }
    return null;
  }, []);

  const getTabForStage = useCallback((stage: ProjectStageNumber): string => {
    const def = WORKFLOW_STAGES.find(s => s.number === stage);
    return def ? def.primaryTab : "saved_projects";
  }, []);

  const syncStageWithTab = useCallback((tab: string) => {
    const stageNum = getStageForTab(tab);
    if (stageNum !== null) {
      setCurrentStage(stageNum);
    }
  }, [getStageForTab]);

  // Project lifecycle operations
  const startNewProject = useCallback(async (meta?: Partial<ProjectMetadata>) => {
    await storageCreateNew(meta);
    setProjectIsOpen(true);
    setCurrentStage(1);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
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
        sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
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
        sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
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
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [storageHasUnsaved, storageSave]);

  const value = useMemo<ProjectWorkflowContextValue>(() => ({
    currentStage,
    activeStageInfo,
    allStages: WORKFLOW_STAGES,
    totalStages: 6,
    projectIsOpen,
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
    projectIsOpen,
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
