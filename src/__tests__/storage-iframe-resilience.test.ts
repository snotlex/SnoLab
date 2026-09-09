import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  ProjectStorageService,
  createNewProjectFile,
  validateProjectFile,
  migrateProjectSchema
} from "../services/storage/ProjectStorageService";
import { SnoLabProjectFile } from "../services/storage/types";

describe("ProjectStorageService Iframe & File Picker Resilience", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("detects iframe execution and disables native file picker to prevent cross-origin sub frame errors", () => {
    // Simulate iframe environment where window.self !== window.top
    const mockWindow: any = {
      self: {},
      top: {},
      showOpenFilePicker: vi.fn(),
      showSaveFilePicker: vi.fn()
    };
    
    // In this mock, self !== top (simulating iframe / preview container)
    global.window = mockWindow;

    const supported = ProjectStorageService.isFileSystemAccessSupported();
    expect(supported).toBe(false);
  });

  it("handles cross-origin SecurityError when accessing window.top gracefully", () => {
    const mockWindow: any = {
      self: {},
      get top() {
        throw new Error("SecurityError: Blocked a frame with origin from accessing a cross-origin frame.");
      },
      showOpenFilePicker: vi.fn(),
      showSaveFilePicker: vi.fn()
    };

    global.window = mockWindow;

    const supported = ProjectStorageService.isFileSystemAccessSupported();
    expect(supported).toBe(false);
  });

  it("returns true for top-level windows with supported File System Access API", () => {
    const sameRef = {};
    const mockWindow: any = {
      self: sameRef,
      top: sameRef,
      showOpenFilePicker: vi.fn(),
      showSaveFilePicker: vi.fn()
    };

    global.window = mockWindow;

    const supported = ProjectStorageService.isFileSystemAccessSupported();
    expect(supported).toBe(true);
  });

  it("serializes project and formats download cleanly without errors", () => {
    const dummyProject = ProjectStorageService.serializeProject(
      createNewProjectFile({ name: "Test Bridge Mix" })
    );
    expect(dummyProject).toContain("Test Bridge Mix");
    expect(dummyProject).toContain("snolab_project");
  });

  it("validates and migrates files missing metadata gracefully without throwing error", () => {
    // Legacy file or export with no metadata object
    const rawData = {
      inputs: {
        fck28: 30,
        targetSlump: 100,
        cementType: "CEM I 42.5"
      },
      materials: [
        { id: "mat-1", name: "Chlef Cement", category: "إسمنت", density: 3100 }
      ]
    };

    const valResult = validateProjectFile(rawData, "Port_Oran_Mix.json");
    expect(valResult.isValid).toBe(true);

    const migrated = migrateProjectSchema(rawData, "Port_Oran_Mix.json");
    expect(migrated.metadata.name).toBe("Port_Oran_Mix");
    expect(migrated.materials.length).toBe(1);
    expect(migrated.mixDesigns.currentInputs.fck28).toBe(30);
  });

  it("handles wrapped project structures { project: ... } and { activeProject: ... }", () => {
    const wrapped = {
      project: {
        metadata: { name: "Wrapped Project" },
        materials: []
      }
    };

    const valResult = validateProjectFile(wrapped);
    expect(valResult.isValid).toBe(true);

    const migrated = migrateProjectSchema(wrapped);
    expect(migrated.metadata.name).toBe("Wrapped Project");
  });

  it("handles raw mix parameter files without metadata or name keys", () => {
    const rawMix = {
      fck28: 35,
      cementWeight: 380,
      waterWeight: 175
    };

    const valResult = validateProjectFile(rawMix, "Algiers_Metro.json");
    expect(valResult.isValid).toBe(true);

    const migrated = migrateProjectSchema(rawMix, "Algiers_Metro.json");
    expect(migrated.metadata.name).toBe("Algiers_Metro");
    expect(migrated.mixDesigns.currentInputs.fck28).toBe(35);
  });
});
