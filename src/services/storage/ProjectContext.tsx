import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useRef, 
  useCallback 
} from "react";
import { 
  SnoLabProjectFile, 
  ProjectMetadata, 
  SaveStatus, 
  ProjectSavedMix, 
  ProjectNote, 
  ProjectHistoryEntry 
} from "./types";
import { 
  ProjectStorageService, 
  createNewProjectFile, 
  validateProjectFile, 
  migrateProjectSchema,
  getDefaultMixInputs 
} from "./ProjectStorageService";
import { IndexedDBCache } from "./indexedDBCache";
import { EngineeringMaterial, MixDesignInput, MixDesignResult, MixVersion, LabValidationRecord } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";

interface ProjectContextValue {
  project: SnoLabProjectFile;
  fileName: string;
  fileHandle: FileSystemFileHandle | null;
  saveStatus: SaveStatus;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
  errorMessage: string;
  isNativeFsSupported: boolean;

  // File Operations
  createNewProject: (meta?: Partial<ProjectMetadata>) => Promise<void>;
  openProject: () => Promise<boolean>;
  openFromFileObject: (file: File) => Promise<boolean>;
  saveProject: () => Promise<boolean>;
  saveProjectAs: (suggestedName?: string) => Promise<boolean>;
  backupProject: () => Promise<string>;
  exportProject: (customName?: string) => void;
  importProjectFile: (file: File) => Promise<boolean>;
  closeProject: () => Promise<void>;

  // Data Mutators (All local!)
  updateProjectMetadata: (metadata: Partial<ProjectMetadata>) => void;
  updateMaterials: (materials: EngineeringMaterial[]) => void;
  updateLaboratoryTests: (tests: MaterialTestRecord[]) => void;
  updateMixInputs: (inputs: MixDesignInput) => void;
  updateMixResults: (results: MixDesignResult) => void;
  saveCurrentMixVersion: (name: string, isOptimized?: boolean) => void;
  saveNamedMix: (name: string, inputs: MixDesignInput, results?: MixDesignResult, currency?: string) => void;
  deleteNamedMix: (mixId: string) => void;
  updateValidationRecords: (records: LabValidationRecord[]) => void;
  updateNotes: (notes: ProjectNote[]) => void;
  addHistoryEntry: (action: string, details?: string, category?: ProjectHistoryEntry["category"], prev?: any, next?: any) => void;
  markDirty: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with blank/default project or restore from IndexedDB
  const [project, setProject] = useState<SnoLabProjectFile>(() => createNewProjectFile());
  const [fileName, setFileName] = useState<string>("New_Project.snlab");
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());
  const [errorMessage, setErrorMessage] = useState<string>("");

  const projectRef = useRef<SnoLabProjectFile>(project);
  projectRef.current = project;

  const fileHandleRef = useRef<FileSystemFileHandle | null>(fileHandle);
  fileHandleRef.current = fileHandle;

  const fileNameRef = useRef<string>(fileName);
  fileNameRef.current = fileName;

  const autoSaveTimerRef = useRef<any>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // 1. Initial Load: Try restoring last active working project from IndexedDB
  useEffect(() => {
    async function loadCachedWorkingProject() {
      try {
        const cached = await IndexedDBCache.loadWorkingProject();
        if (cached && cached.project) {
          const validation = validateProjectFile(cached.project, cached.fileName);
          if (validation.isValid) {
            const migrated = migrateProjectSchema(cached.project, cached.fileName);
            setProject(migrated);
            setFileName(cached.fileName || `${migrated.metadata.name}.snlab`);
            setSaveStatus("saved");
            setHasUnsavedChanges(false);
          }
        }
      } catch (err) {
        console.warn("Could not restore cached working project:", err);
      } finally {
        isInitialLoadRef.current = false;
      }
    }
    loadCachedWorkingProject();
  }, []);

  // 2. BeforeUnload Guard: Prevent loss of unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in your SnoLab project. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 3. Helper: Mark project as modified & trigger smart auto-save
  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");

    // Clear previous debounce timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Debounce auto-save (1800ms)
    autoSaveTimerRef.current = setTimeout(async () => {
      const currentProj = projectRef.current;
      const currentHandle = fileHandleRef.current;
      const currentName = fileNameRef.current;

      try {
        setSaveStatus("saving");

        // Always save to IndexedDB session cache
        await IndexedDBCache.saveWorkingProject(currentProj, currentName);

        // If direct file handle is available via File System Access API, save directly
        if (currentHandle) {
          await ProjectStorageService.saveToHandle(currentHandle, currentProj);
          setHasUnsavedChanges(false);
          setSaveStatus("saved");
          setLastSavedAt(new Date());
        } else {
          // In fallback mode, cached in IndexedDB working store
          setSaveStatus("unsaved"); // remains unsaved to disk until manual Save/Download
        }
      } catch (err: any) {
        console.error("Auto-save error:", err);
        setSaveStatus("error");
        setErrorMessage(err.message || "Failed to auto-save file");
      }
    }, 1800);
  }, []);

  // 4. Keyboard Shortcuts: Ctrl+S, Ctrl+Shift+S, Ctrl+O
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          if (e.shiftKey) {
            saveProjectAs();
          } else {
            saveProject();
          }
        } else if (e.key === "o" || e.key === "O") {
          e.preventDefault();
          openProject();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // File Operation: Create New Project
  const createNewProject = async (meta?: Partial<ProjectMetadata>) => {
    if (hasUnsavedChanges) {
      const confirmNew = window.confirm("لديك تعديلات غير محفوظة. هل تريد المتابعة وإنشاء مشروع جديد؟\nYou have unsaved changes. Proceed to create a new project?");
      if (!confirmNew) return;
    }

    const newProj = createNewProjectFile(meta);
    const newName = `${newProj.metadata.name}.snlab`;

    setProject(newProj);
    setFileName(newName);
    setFileHandle(null);
    setHasUnsavedChanges(false);
    setSaveStatus("saved");
    setLastSavedAt(new Date());
    setErrorMessage("");

    await IndexedDBCache.saveWorkingProject(newProj, newName);
  };

  // File Operation: Open Project with native picker or HTML file input
  const openProject = async (): Promise<boolean> => {
    if (hasUnsavedChanges) {
      let confirmOpen = true;
      try {
        confirmOpen = window.confirm("لديك تعديلات غير محفوظة في المشروع الحالي. هل تريد المتابعة وفتح ملف آخر؟\nYou have unsaved changes. Proceed to open another project?");
      } catch (e) {
        confirmOpen = true;
      }
      if (!confirmOpen) return false;
    }

    const triggerHtmlFileInputFallback = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".snlab,.json";
      input.style.display = "none";
      document.body.appendChild(input);
      input.onchange = async (e: any) => {
        try {
          const file = e.target?.files?.[0];
          if (file) {
            await openFromFileObject(file);
          }
        } finally {
          document.body.removeChild(input);
        }
      };
      input.click();
      return true;
    };

    try {
      if (ProjectStorageService.isFileSystemAccessSupported()) {
        try {
          const result = await ProjectStorageService.openProjectWithPicker();
          setProject(result.project);
          setFileName(result.fileName);
          setFileHandle(result.handle);
          setHasUnsavedChanges(false);
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          setErrorMessage("");
          return true;
        } catch (pickerErr: any) {
          if (pickerErr.name === "AbortError") {
            return false; // User cancelled picker
          }
          console.warn("File picker unavailable or restricted by iframe sandbox, falling back to file input:", pickerErr);
          return triggerHtmlFileInputFallback();
        }
      } else {
        return triggerHtmlFileInputFallback();
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return false;
      }
      console.warn("Open project error, using fallback input:", err);
      return triggerHtmlFileInputFallback();
    }
  };

  // File Operation: Open from dropped / selected File object
  const openFromFileObject = async (file: File): Promise<boolean> => {
    try {
      setSaveStatus("saving");
      const result = await ProjectStorageService.openProjectFromFileObject(file);
      setProject(result.project);
      setFileName(result.fileName);
      setFileHandle(null); // Fallback mode has no handle
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      setLastSavedAt(new Date());
      setErrorMessage("");
      return true;
    } catch (err: any) {
      console.error("Failed to load file object:", err);
      setSaveStatus("error");
      setErrorMessage(err.message || "File parsing failed");
      return false;
    }
  };

  // File Operation: Save
  const saveProject = async (): Promise<boolean> => {
    setSaveStatus("saving");
    setErrorMessage("");

    try {
      if (fileHandleRef.current && ProjectStorageService.isFileSystemAccessSupported()) {
        try {
          await ProjectStorageService.saveToHandle(fileHandleRef.current, projectRef.current);
          setHasUnsavedChanges(false);
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          return true;
        } catch (handleErr: any) {
          console.warn("Saving to existing handle failed, falling back to download/Save As:", handleErr);
          setFileHandle(null);
          return await saveProjectAs();
        }
      } else if (ProjectStorageService.isFileSystemAccessSupported()) {
        // No handle yet, prompt Save As
        return await saveProjectAs();
      } else {
        // Fallback: Download .snlab file directly
        const downloadedName = ProjectStorageService.downloadProjectFile(projectRef.current, fileNameRef.current);
        setFileName(downloadedName);
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        return true;
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setSaveStatus(hasUnsavedChanges ? "unsaved" : "saved");
        return false;
      }
      console.warn("Save error, falling back to direct download:", err);
      try {
        const downloadedName = ProjectStorageService.downloadProjectFile(projectRef.current, fileNameRef.current);
        setFileName(downloadedName);
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        return true;
      } catch (fallbackErr: any) {
        setSaveStatus("error");
        setErrorMessage(err.message || "Failed to save project file");
        return false;
      }
    }
  };

  // File Operation: Save As
  const saveProjectAs = async (suggestedName?: string): Promise<boolean> => {
    setSaveStatus("saving");
    setErrorMessage("");

    const targetName = suggestedName || fileNameRef.current || projectRef.current?.metadata?.name || "SnoLab_Project";

    try {
      if (ProjectStorageService.isFileSystemAccessSupported()) {
        try {
          const result = await ProjectStorageService.saveProjectAsWithPicker(
            projectRef.current,
            targetName
          );
          setFileHandle(result.handle);
          setFileName(result.fileName);
          setHasUnsavedChanges(false);
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          return true;
        } catch (pickerErr: any) {
          if (pickerErr.name === "AbortError") {
            setSaveStatus(hasUnsavedChanges ? "unsaved" : "saved");
            return false; // User cancelled
          }
          console.warn("Native file picker failed or restricted in iframe, executing direct download fallback:", pickerErr);
          const downloadedName = ProjectStorageService.downloadProjectFile(projectRef.current, targetName);
          setFileName(downloadedName);
          setFileHandle(null);
          setHasUnsavedChanges(false);
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          return true;
        }
      } else {
        const downloadedName = ProjectStorageService.downloadProjectFile(projectRef.current, targetName);
        setFileName(downloadedName);
        setFileHandle(null);
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        return true;
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setSaveStatus(hasUnsavedChanges ? "unsaved" : "saved");
        return false;
      }
      console.warn("Save As error, attempting final direct download fallback:", err);
      try {
        const downloadedName = ProjectStorageService.downloadProjectFile(projectRef.current, targetName);
        setFileName(downloadedName);
        setFileHandle(null);
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        return true;
      } catch (fallbackErr: any) {
        setSaveStatus("error");
        setErrorMessage(err.message || "Failed to Save As");
        return false;
      }
    }
  };

  // File Operation: Create Backup
  const backupProject = async (): Promise<string> => {
    try {
      const backupName = await ProjectStorageService.createBackup(projectRef.current, fileNameRef.current);
      addHistoryEntry("PROJECT_BACKUP", `Backup created: ${backupName}`, "system");
      return backupName;
    } catch (err: any) {
      console.error("Backup creation failed:", err);
      throw err;
    }
  };

  // File Operation: Export
  const exportProject = (customName?: string) => {
    ProjectStorageService.downloadProjectFile(projectRef.current, customName || fileNameRef.current);
  };

  // File Operation: Import
  const importProjectFile = async (file: File): Promise<boolean> => {
    return await openFromFileObject(file);
  };

  // File Operation: Close
  const closeProject = async () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm("لديك تعديلات غير محفوظة. هل تريد حفظها قبل الإغلاق؟\nDo you want to save before closing?");
      if (confirmClose) {
        await saveProject();
      }
    }
    await createNewProject();
  };

  // Data Mutator: Update Project Metadata
  const updateProjectMetadata = (meta: Partial<ProjectMetadata>) => {
    setProject(prev => {
      const updated = {
        ...prev,
        metadata: {
          ...prev.metadata,
          ...meta,
          lastModified: new Date().toISOString()
        }
      };
      return updated;
    });
    markDirty();
  };

  // Data Mutator: Update Materials
  const updateMaterials = (materials: EngineeringMaterial[]) => {
    setProject(prev => ({
      ...prev,
      materials,
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString()
      }
    }));
    markDirty();
  };

  // Data Mutator: Update Laboratory Tests
  const updateLaboratoryTests = (tests: MaterialTestRecord[]) => {
    setProject(prev => ({
      ...prev,
      laboratoryTests: tests,
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString()
      }
    }));
    markDirty();
  };

  // Data Mutator: Update Mix Inputs
  const updateMixInputs = (inputs: MixDesignInput) => {
    setProject(prev => ({
      ...prev,
      mixDesigns: {
        ...prev.mixDesigns,
        currentInputs: inputs
      },
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString()
      }
    }));
    markDirty();
  };

  // Data Mutator: Update Mix Results
  const updateMixResults = (results: MixDesignResult) => {
    setProject(prev => ({
      ...prev,
      mixDesigns: {
        ...prev.mixDesigns,
        currentResults: results
      },
      calculationResults: {
        lastCalculatedAt: new Date().toISOString(),
        summary: results.mixQuantitySummary
      },
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString()
      }
    }));
    markDirty();
  };

  // Data Mutator: Save Current Mix as Version
  const saveCurrentMixVersion = (name: string, isOptimized?: boolean) => {
    const current = projectRef.current;
    const newVer: MixVersion = {
      id: `ver_${Date.now()}`,
      name: name || `Version ${current.mixDesigns.versions.length + 1}`,
      date: new Date().toISOString().split("T")[0],
      inputs: { ...current.mixDesigns.currentInputs },
      results: current.mixDesigns.currentResults ? { ...current.mixDesigns.currentResults } : ({} as any),
      isOptimized: !!isOptimized,
      auditTrail: {
        createdAt: new Date().toISOString(),
        createdBy: current.metadata.engineer
      }
    };

    setProject(prev => ({
      ...prev,
      mixDesigns: {
        ...prev.mixDesigns,
        versions: [newVer, ...(prev.mixDesigns.versions || [])]
      }
    }));
    addHistoryEntry("MIX_VERSION_SAVED", `Saved mix version: ${newVer.name}`, "mix");
    markDirty();
  };

  // Data Mutator: Save Named Mix
  const saveNamedMix = (name: string, inputs: MixDesignInput, results?: MixDesignResult, currency?: string) => {
    const newMix: ProjectSavedMix = {
      id: `mix_${Date.now()}`,
      name: name.trim(),
      date: new Date().toISOString(),
      inputs: { ...inputs },
      results: results ? { ...results } : undefined,
      currency: currency || "DZD"
    };

    setProject(prev => ({
      ...prev,
      mixDesigns: {
        ...prev.mixDesigns,
        savedMixes: [newMix, ...(prev.mixDesigns.savedMixes || []).filter(m => m.id !== newMix.id)]
      }
    }));
    addHistoryEntry("SAVED_MIX_ADDED", `Added saved mix formula: ${name}`, "mix");
    markDirty();
  };

  // Data Mutator: Delete Named Mix
  const deleteNamedMix = (mixId: string) => {
    setProject(prev => ({
      ...prev,
      mixDesigns: {
        ...prev.mixDesigns,
        savedMixes: (prev.mixDesigns.savedMixes || []).filter(m => m.id !== mixId)
      }
    }));
    markDirty();
  };

  // Data Mutator: Update Validation Records
  const updateValidationRecords = (records: LabValidationRecord[]) => {
    setProject(prev => ({
      ...prev,
      validationRecords: records
    }));
    markDirty();
  };

  // Data Mutator: Update Notes
  const updateNotes = (notes: ProjectNote[]) => {
    setProject(prev => ({
      ...prev,
      notes
    }));
    markDirty();
  };

  // Data Mutator: Add History Entry
  const addHistoryEntry = (
    action: string, 
    details?: string, 
    category: ProjectHistoryEntry["category"] = "system",
    prev?: any, 
    next?: any
  ) => {
    const entry: ProjectHistoryEntry = {
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      category,
      previousValue: prev,
      newValue: next,
      user: projectRef.current.metadata.engineer
    };

    setProject(prevProj => ({
      ...prevProj,
      history: [entry, ...(prevProj.history || []).slice(0, 200)] // Keep up to 200 history logs
    }));
    markDirty();
  };

  const value: ProjectContextValue = {
    project,
    fileName,
    fileHandle,
    saveStatus,
    hasUnsavedChanges,
    lastSavedAt,
    errorMessage,
    isNativeFsSupported: ProjectStorageService.isFileSystemAccessSupported(),
    createNewProject,
    openProject,
    openFromFileObject,
    saveProject,
    saveProjectAs,
    backupProject,
    exportProject,
    importProjectFile,
    closeProject,
    updateProjectMetadata,
    updateMaterials,
    updateLaboratoryTests,
    updateMixInputs,
    updateMixResults,
    saveCurrentMixVersion,
    saveNamedMix,
    deleteNamedMix,
    updateValidationRecords,
    updateNotes,
    addHistoryEntry,
    markDirty
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectStorage = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectStorage must be used within a ProjectProvider");
  }
  return context;
};
