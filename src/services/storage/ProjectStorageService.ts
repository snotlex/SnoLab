import { 
  SnoLabProjectFile, 
  ProjectMetadata, 
  ProjectFileValidationResult, 
  SaveStatus 
} from "./types";
import { IndexedDBCache } from "./indexedDBCache";
import { SEEDED_MATERIALS } from "../../data/seededMaterials";
import { SEEDED_MATERIAL_TESTS } from "../../data/seedMaterialTests";
import { AggregateType, AggregateQuality, MixDesignInput, EngineeringMaterial } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { normalizeMaterialSource } from "../../utils/materialSourceHelper";

export const CURRENT_SCHEMA_VERSION = 1;
export const APP_VERSION = "2.5.0";
export const FILE_EXTENSION = ".snlab";

/**
 * Generates default MixDesignInput if none provided.
 */
export function getDefaultMixInputs(): MixDesignInput {
  return {
    fck28: 25,
    controlClass: "normal",
    cementType: "CEM II/A-L 42.5 N",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 7,
    aggregateType: AggregateType.CONCASSE,
    aggregateQuality: AggregateQuality.STANDARD,
    hasPumping: false,
    sandRelativeDensity: 2.62,
    gravelRelativeDensity: 2.68,
    cementDensity: 3100,
    airContent: 1.5,
    moistureSand: 0,
    moistureGravel: 0,
    sandAbsorption: 1.2,
    gravelAbsorption: 0.8,
    finenessModulus: 2.6,
    admixtures: [],
    dosageSuper: 0,
    dosageAir: 0,
    dosageRetarder: 0,
    dosageAccelerator: 0,
    dosageSilicaFume: 0,
    dosageFlyAsh: 0,
    dosageSlag: 0,
    selectedMethod: "dreux",
    exposureClass: "XC1",
    durabilityLevel: "عادية (Standard)",
    carbonationLevel: "منخفضة (Low)",
    chloridesLevel: "معدومة (None)",
    sulfatesLevel: "معدومة (None)",
    priceCement: 16,
    priceSand: 2.5,
    priceGravel: 2.2,
    priceSuper: 250,
    priceAir: 180,
    priceRetarder: 200,
    priceAccelerator: 220,
    priceSilicaFume: 45,
    priceFlyAsh: 25,
    priceSlag: 30,
    priceLabor: 1500,
    priceWater: 0.5,
    costBasis: "dry",
    concreteType: "NSC",
    sandType: "الرمل القياسي النقي (Standard Pure Sand)",
    gravelType: "حصى مكسرة قياسية (Standard Crushed Gravel)",
    autoDensities: true,
    batchVolume: 1.0,
    areaM2: 10,
    thicknessCm: 10,
    volumeInputMode: "volume",
    selectedCementId: "CEM-001",
    selectedSandId: "SAND-001",
    selectedGravelId: "GRAVEL-001",
    selectedWaterId: "WATER-001"
  };
}

/**
 * Creates a brand new SnoLab project file structure.
 */
export function createNewProjectFile(
  meta?: Partial<ProjectMetadata>,
  initialMaterials?: any[],
  initialTests?: any[]
): SnoLabProjectFile {
  const now = new Date().toISOString();
  const projId = meta?.id || `PROJ-${Date.now().toString(36).toUpperCase()}`;
  const projName = meta?.name || "New_Concrete_Project";

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    fileType: "snolab_project",
    appVersion: APP_VERSION,
    exportedAt: now,
    metadata: {
      id: projId,
      name: projName,
      code: meta?.code || projId,
      engineer: meta?.engineer || "SnoLab Engineer",
      client: meta?.client || "Client Organization",
      location: meta?.location || "Project Site",
      plant: meta?.plant || "Central Batching Plant",
      createdDate: meta?.createdDate || now,
      lastModified: now,
      description: meta?.description || "SnoLab Concrete Engineering Mix Design & Laboratory Project",
      version: 1,
      workflowStatus: "draft",
      tags: meta?.tags || ["SnoLab", "Concrete Mix", "Lab Validated"]
    },
    settings: {
      language: "ar",
      currency: "DZD",
      unitSystem: "metric",
      concreteType: "NSC",
      selectedMethod: "dreux",
      costBasis: "dry",
      autoDensities: true
    },
    materials: initialMaterials || [...SEEDED_MATERIALS],
    laboratoryTests: initialTests || [...SEEDED_MATERIAL_TESTS],
    materialProperties: {
      overrides: {},
      sources: {},
      ratings: {},
      favorites: []
    },
    mixDesigns: {
      currentInputs: getDefaultMixInputs(),
      currentResults: undefined,
      savedMixes: [],
      versions: []
    },
    calculationResults: {
      lastCalculatedAt: now
    },
    validationRecords: [],
    reports: [],
    notes: [
      {
        id: `note-${Date.now()}`,
        title: "ملاحظات المشروع الأولية / Initial Project Notes",
        content: "تم إنشاء ملف المشروع محلياً بواسطة نظام الملفات الهندسية SnoLab Local Project File System.",
        category: "general",
        author: meta?.engineer || "Engineer",
        createdAt: now,
        updatedAt: now
      }
    ],
    history: [
      {
        id: `hist-${Date.now()}`,
        timestamp: now,
        action: "PROJECT_CREATED",
        user: meta?.engineer || "Engineer",
        details: `Created new project "${projName}" (.snlab)`,
        category: "project"
      }
    ],
    auditTrail: {
      createdBy: meta?.engineer || "Engineer",
      createdAt: now,
      lastModifiedBy: meta?.engineer || "Engineer",
      lastModifiedAt: now,
      revisionCount: 1,
      revisionHistory: [`Initial creation at ${now}`]
    }
  };
}

/**
 * Unwraps data from wrapped exports (e.g. { project: ... }, { activeProject: ... }, { data: ... }, or arrays).
 */
export function unwrapProjectData(raw: any): any {
  if (!raw) return raw;

  if (Array.isArray(raw)) {
    if (raw.length === 0) return {};
    // If it is an array of materials
    if (raw[0] && (raw[0].category || raw[0].density || raw[0].relativeDensity || raw[0].specificGravity)) {
      return { materials: raw };
    }
    // If it is an array of tests
    if (raw[0] && (raw[0].testType || raw[0].standardReference || raw[0].testDate)) {
      return { laboratoryTests: raw };
    }
    // Otherwise pick the first project in array
    return unwrapProjectData(raw[0]);
  }

  if (typeof raw === "object") {
    if (raw.project && typeof raw.project === "object") {
      return unwrapProjectData(raw.project);
    }
    if (raw.activeProject && typeof raw.activeProject === "object") {
      return unwrapProjectData(raw.activeProject);
    }
    if (raw.currentProject && typeof raw.currentProject === "object") {
      return unwrapProjectData(raw.currentProject);
    }
    if (raw.data && typeof raw.data === "object" && !raw.metadata && !raw.inputs) {
      return unwrapProjectData(raw.data);
    }
  }

  return raw;
}

/**
 * Validates whether the given parsed JSON object is a valid SnoLab project file or importable mix/materials file.
 */
export function validateProjectFile(data: any, fileNameFallback?: string): ProjectFileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const unwrapped = unwrapProjectData(data);

  if (!unwrapped || typeof unwrapped !== "object") {
    return {
      isValid: false,
      errors: ["ملف المشروع تالف أو فارغ / Invalid or empty project file."],
      warnings: [],
      schemaVersion: 0
    };
  }

  // Check file type or legacy project structure
  if (unwrapped.fileType && unwrapped.fileType !== "snolab_project") {
    warnings.push("الملف لا يحتوي على وسم snolab_project الصريح. سيتم محاولة استيراده / File missing snolab_project tag.");
  }

  // Check project identification
  const hasExplicitName = Boolean(
    unwrapped.metadata?.name || 
    unwrapped.name || 
    unwrapped.projectName || 
    unwrapped.title || 
    unwrapped.project_name || 
    unwrapped.nomProjet || 
    unwrapped.designName ||
    unwrapped.mixName ||
    unwrapped.label
  );

  const hasMixData = Boolean(
    unwrapped.inputs || 
    unwrapped.mixDesigns || 
    unwrapped.results || 
    unwrapped.fck28 !== undefined || 
    unwrapped.cementWeight !== undefined || 
    unwrapped.dMax !== undefined ||
    unwrapped.materials || 
    unwrapped.laboratoryTests ||
    unwrapped.settings
  );

  const hasFallbackName = Boolean(fileNameFallback && fileNameFallback.trim().length > 0);

  if (!hasExplicitName) {
    if (hasMixData || hasFallbackName || Object.keys(unwrapped).length > 0) {
      warnings.push("بيانات تعريف المشروع (metadata) سيتم توليدها تلقائياً من محتوى الملف أو الاسم.");
    } else {
      errors.push("ملف المشروع فارغ ولا يحتوي على أي بيانات صالحة / File contains no recognizable project data.");
    }
  }

  if (unwrapped.materials && !Array.isArray(unwrapped.materials) && typeof unwrapped.materials !== "object") {
    errors.push("جدول المواد (materials) غير سليم.");
  }

  if (unwrapped.laboratoryTests && !Array.isArray(unwrapped.laboratoryTests) && typeof unwrapped.laboratoryTests !== "object") {
    errors.push("سجل الاختبارات المعملية (laboratoryTests) غير سليم.");
  }

  const schemaVer = typeof unwrapped.schemaVersion === "number" ? unwrapped.schemaVersion : 1;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    schemaVersion: schemaVer,
    migrated: schemaVer < CURRENT_SCHEMA_VERSION || !unwrapped.fileType || !unwrapped.metadata?.name
  };
}

/**
 * Migrates older schema versions or raw exports into the standard SnoLabProjectFile format.
 */
export function migrateProjectSchema(rawInput: any, fileNameFallback?: string): SnoLabProjectFile {
  const now = new Date().toISOString();
  const raw = unwrapProjectData(rawInput) || {};

  const cleanFallbackName = fileNameFallback 
    ? fileNameFallback.replace(/\.(snlab|json|txt)$/i, "").trim()
    : "Imported_Project";

  // If already standard schema version 1 and has all required keys:
  if (raw.schemaVersion === CURRENT_SCHEMA_VERSION && raw.metadata?.name && raw.mixDesigns && Array.isArray(raw.materials)) {
    return {
      ...raw,
      metadata: {
        ...raw.metadata,
        lastModified: now
      },
      materials: raw.materials || [],
      laboratoryTests: raw.laboratoryTests || [],
      validationRecords: raw.validationRecords || [],
      notes: raw.notes || [],
      history: raw.history || []
    };
  }

  const rawMeta = raw.metadata || {};
  const projName = rawMeta.name || 
    raw.name || 
    raw.projectName || 
    raw.title || 
    raw.project_name || 
    raw.nomProjet || 
    raw.designName || 
    raw.mixName || 
    raw.label || 
    cleanFallbackName || 
    "Imported_Project";

  // Construct from legacy activeProject, raw export, or partial mix file
  const meta: ProjectMetadata = {
    id: rawMeta.id || raw.id || `PROJ-${Date.now().toString(36).toUpperCase()}`,
    name: projName,
    code: rawMeta.code || raw.code || raw.id || "PROJ-IMPORTED",
    engineer: rawMeta.engineer || raw.engineer || "SnoLab Engineer",
    client: rawMeta.client || raw.client || "Client Organization",
    location: rawMeta.location || raw.location || "Project Site",
    plant: rawMeta.plant || raw.plant || "Batching Plant",
    createdDate: rawMeta.createdDate || raw.createdDate || now,
    lastModified: now,
    description: rawMeta.description || raw.description || "Imported SnoLab Concrete Mix Project",
    version: rawMeta.version || raw.version || 1,
    workflowStatus: rawMeta.workflowStatus || "draft",
    tags: Array.isArray(rawMeta.tags) ? rawMeta.tags : (Array.isArray(raw.tags) ? raw.tags : ["Imported"])
  };

  let inputs: MixDesignInput = getDefaultMixInputs();
  if (raw.mixDesigns?.currentInputs) {
    inputs = { ...getDefaultMixInputs(), ...raw.mixDesigns.currentInputs };
  } else if (raw.inputs) {
    inputs = { ...getDefaultMixInputs(), ...raw.inputs };
  } else if (raw.fck28 !== undefined || raw.cementStrength !== undefined || raw.dMax !== undefined || raw.sandType !== undefined) {
    inputs = { ...getDefaultMixInputs(), ...raw };
  }

  const results = raw.mixDesigns?.currentResults || raw.results || raw.calculationResults?.results || undefined;
  
  let materials: EngineeringMaterial[] = [...SEEDED_MATERIALS];
  if (Array.isArray(raw.materials) && raw.materials.length > 0) {
    materials = raw.materials;
  } else if (raw.materials && typeof raw.materials === "object") {
    materials = Object.values(raw.materials);
  } else if (Array.isArray(raw.materialsCatalog) && raw.materialsCatalog.length > 0) {
    materials = raw.materialsCatalog;
  }
  // Ensure strict provenance and isolation between system and user materials
  materials = materials.map(normalizeMaterialSource);

  let tests: MaterialTestRecord[] = [...SEEDED_MATERIAL_TESTS];
  if (Array.isArray(raw.laboratoryTests)) {
    tests = raw.laboratoryTests;
  } else if (raw.laboratoryTests && typeof raw.laboratoryTests === "object") {
    tests = Object.values(raw.laboratoryTests);
  } else if (Array.isArray(raw.tests)) {
    tests = raw.tests;
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    fileType: "snolab_project",
    appVersion: APP_VERSION,
    exportedAt: now,
    metadata: meta,
    settings: {
      language: raw.settings?.language || "ar",
      currency: raw.settings?.currency || "DZD",
      unitSystem: raw.settings?.unitSystem || "metric",
      concreteType: raw.settings?.concreteType || inputs.concreteType || "NSC",
      selectedMethod: raw.settings?.selectedMethod || inputs.selectedMethod || "dreux",
      costBasis: raw.settings?.costBasis || inputs.costBasis || "dry",
      autoDensities: raw.settings?.autoDensities ?? true
    },
    materials,
    laboratoryTests: tests,
    materialProperties: raw.materialProperties || {
      overrides: raw.labOverrides || {},
      sources: {},
      ratings: {},
      favorites: []
    },
    mixDesigns: {
      currentInputs: inputs,
      currentResults: results,
      savedMixes: raw.mixDesigns?.savedMixes || raw.savedMixes || [],
      versions: raw.mixDesigns?.versions || raw.mixVersions || raw.versions || []
    },
    calculationResults: raw.calculationResults || {
      lastCalculatedAt: now
    },
    validationRecords: raw.validationRecords || [],
    reports: raw.reports || raw.generatedReports || [],
    notes: raw.notes || [],
    history: raw.history || [
      {
        id: `hist-${Date.now()}`,
        timestamp: now,
        action: "PROJECT_MIGRATED",
        user: meta.engineer,
        details: "Loaded and adapted project to standard .snlab format",
        category: "project"
      }
    ],
    auditTrail: raw.auditTrail || {
      createdBy: meta.engineer,
      createdAt: meta.createdDate,
      lastModifiedBy: meta.engineer,
      lastModifiedAt: now,
      revisionCount: 1,
      revisionHistory: [`Imported to SnoLab v${APP_VERSION}`]
    }
  };
}

/**
 * Unified Project Storage Service.
 * Implements File System Access API with progressive fallback for all browsers.
 */
export const ProjectStorageService = {
  /**
   * Check if File System Access API (showOpenFilePicker, showSaveFilePicker) is supported and permitted.
   * Cross-origin iframes / subframes do not have permission to show file pickers.
   */
  isFileSystemAccessSupported(): boolean {
    if (typeof window === "undefined") return false;
    
    // Check if executing inside an iframe / subframe where browsers forbid showOpenFilePicker/showSaveFilePicker
    try {
      if (window.self !== window.top) {
        return false; // In an iframe/subframe: use standard download and HTML file input fallback
      }
    } catch (e) {
      // Cross-origin access to window.top throws SecurityError -> definitely an iframe
      return false;
    }

    return (
      typeof (window as any).showOpenFilePicker === "function" &&
      typeof (window as any).showSaveFilePicker === "function"
    );
  },

  /**
   * Serializes a project to formatted JSON string.
   */
  serializeProject(project: SnoLabProjectFile): string {
    return JSON.stringify(project, null, 2);
  },

  /**
   * Open project via native File System Access API.
   */
  async openProjectWithPicker(): Promise<{ project: SnoLabProjectFile; handle: FileSystemFileHandle; fileName: string }> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error("File System Access API is not supported in this browser");
    }

    const [handle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: "SnoLab Concrete Project (*.snlab)",
          accept: {
            "application/json": [".snlab", ".json"],
            "text/plain": [".snlab"]
          }
        }
      ],
      multiple: false
    });

    const file = await handle.getFile();
    const content = await file.text();
    const rawData = JSON.parse(content);

    const validation = validateProjectFile(rawData, file.name);
    if (!validation.isValid) {
      throw new Error(`Invalid project file: ${validation.errors.join(", ")}`);
    }

    const project = migrateProjectSchema(rawData, file.name);

    // Cache to IndexedDB for quick crash recovery
    await IndexedDBCache.saveWorkingProject(project, file.name);

    return {
      project,
      handle,
      fileName: file.name
    };
  },

  /**
   * Open project from an HTML file input element (fallback for all browsers).
   */
  async openProjectFromFileObject(file: File): Promise<{ project: SnoLabProjectFile; fileName: string }> {
    const content = await file.text();
    let rawData: any;
    try {
      rawData = JSON.parse(content);
    } catch (e: any) {
      throw new Error(`ملف غير صالح / Invalid JSON format: ${e.message}`);
    }

    const validation = validateProjectFile(rawData, file.name);
    if (!validation.isValid) {
      throw new Error(`خطأ في بنية الملف / File validation failed: ${validation.errors.join(", ")}`);
    }

    const project = migrateProjectSchema(rawData, file.name);

    // Cache to IndexedDB
    await IndexedDBCache.saveWorkingProject(project, file.name);

    return {
      project,
      fileName: file.name
    };
  },

  /**
   * Save project directly to an existing FileSystemFileHandle.
   */
  async saveToHandle(handle: FileSystemFileHandle, project: SnoLabProjectFile): Promise<void> {
    // Update last modified timestamp
    const now = new Date().toISOString();
    project.metadata.lastModified = now;
    project.exportedAt = now;
    if (project.auditTrail) {
      project.auditTrail.lastModifiedAt = now;
      project.auditTrail.revisionCount = (project.auditTrail.revisionCount || 1) + 1;
    }

    const content = this.serializeProject(project);
    const writable = await (handle as any).createWritable();
    await writable.write(content);
    await writable.close();

    // Sync IndexedDB cache
    const file = await handle.getFile();
    await IndexedDBCache.saveWorkingProject(project, file.name);
  },

  /**
   * Save project as a new file via File System Access API.
   */
  async saveProjectAsWithPicker(
    project: SnoLabProjectFile, 
    suggestedName?: string
  ): Promise<{ handle: FileSystemFileHandle; fileName: string }> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error("File System Access API is not supported");
    }

    const cleanBaseName = (suggestedName || project.metadata.name || "SnoLab_Project")
      .replace(/\.snlab$/i, "")
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, "_")
      .trim();

    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `${cleanBaseName}.snlab`,
      types: [
        {
          description: "SnoLab Concrete Project (*.snlab)",
          accept: {
            "application/json": [".snlab"],
            "text/plain": [".snlab"]
          }
        }
      ]
    });

    await this.saveToHandle(handle, project);
    const file = await handle.getFile();

    return {
      handle,
      fileName: file.name
    };
  },

  /**
   * Download / export project file directly (standard Web fallback & export).
   */
  downloadProjectFile(project: SnoLabProjectFile, customFileName?: string): string {
    const now = new Date().toISOString();
    project.metadata.lastModified = now;
    project.exportedAt = now;

    const cleanBaseName = (customFileName || project.metadata.name || "SnoLab_Project")
      .replace(/\.snlab$/i, "")
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, "_")
      .trim();

    const finalFileName = `${cleanBaseName}.snlab`;
    const jsonString = this.serializeProject(project);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = finalFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => URL.revokeObjectURL(url), 5000);

    // Also update working cache
    IndexedDBCache.saveWorkingProject(project, finalFileName);

    return finalFileName;
  },

  /**
   * Create a timestamped backup copy.
   */
  async createBackup(project: SnoLabProjectFile, currentFileName?: string): Promise<string> {
    const dateStamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const baseName = (currentFileName || project.metadata.name || "Project").replace(/\.snlab$/i, "");
    const backupFileName = `${baseName}_backup_${dateStamp}.snlab`;

    // Save in IndexedDB backup store
    await IndexedDBCache.saveLocalBackup(project);

    // Also trigger file download for user physical retention
    this.downloadProjectFile(project, backupFileName);

    return backupFileName;
  }
};
