import { SnoLabProjectFile, ProjectMetadata } from "./types";

const DB_NAME = "SnoLab_Local_DB_v1";
const DB_VERSION = 1;
const STORE_WORKING = "working_project";
const STORE_RECENTS = "recent_projects";
const STORE_BACKUPS = "local_backups";

let dbInstance: IDBDatabase | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_WORKING)) {
        db.createObjectStore(STORE_WORKING, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_RECENTS)) {
        db.createObjectStore(STORE_RECENTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
        db.createObjectStore(STORE_BACKUPS, { keyPath: "id" });
      }
    };

    request.onsuccess = (event: any) => {
      dbInstance = event.target.result as IDBDatabase;
      resolve(dbInstance);
    };

    request.onerror = (event: any) => {
      console.warn("IndexedDB open error:", event.target.error);
      reject(event.target.error);
    };
  });
}

export const IndexedDBCache = {
  /**
   * Save the current active working project into IndexedDB cache for instant reload recovery.
   */
  async saveWorkingProject(project: SnoLabProjectFile, fileName?: string): Promise<void> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_WORKING, STORE_RECENTS], "readwrite");
        const workingStore = tx.objectStore(STORE_WORKING);
        const recentsStore = tx.objectStore(STORE_RECENTS);

        const record = {
          id: "active_working_project",
          fileName: fileName || `${project.metadata.name}.snlab`,
          project,
          savedAt: new Date().toISOString()
        };

        workingStore.put(record);

        // Update recents metadata
        const recentMeta = {
          id: project.metadata.id,
          name: project.metadata.name,
          fileName: fileName || `${project.metadata.name}.snlab`,
          engineer: project.metadata.engineer,
          client: project.metadata.client,
          materialsCount: project.materials?.length || 0,
          testsCount: project.laboratoryTests?.length || 0,
          lastModified: project.metadata.lastModified || new Date().toISOString()
        };
        recentsStore.put(recentMeta);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      // Fallback to localStorage safely if IndexedDB fails
      try {
        localStorage.setItem("snolab_working_project_cache", JSON.stringify(project));
      } catch (e) {
        console.warn("IndexedDB cache save warning (local storage quota might be tight):", e);
      }
    }
  },

  /**
   * Load the active working project from IndexedDB cache.
   */
  async loadWorkingProject(): Promise<{ project: SnoLabProjectFile; fileName: string } | null> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_WORKING, "readonly");
        const store = tx.objectStore(STORE_WORKING);
        const req = store.get("active_working_project");

        req.onsuccess = () => {
          if (req.result && req.result.project) {
            resolve({
              project: req.result.project,
              fileName: req.result.fileName || `${req.result.project.metadata?.name || "Project"}.snlab`
            });
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      });
    } catch (err) {
      try {
        const saved = localStorage.getItem("snolab_working_project_cache");
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            project: parsed,
            fileName: `${parsed.metadata?.name || "Project"}.snlab`
          };
        }
      } catch {
        // ignore
      }
      return null;
    }
  },

  /**
   * Clear working project cache (e.g. on new project creation).
   */
  async clearWorkingProject(): Promise<void> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_WORKING, "readwrite");
        const store = tx.objectStore(STORE_WORKING);
        store.delete("active_working_project");
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      localStorage.removeItem("snolab_working_project_cache");
    }
  },

  /**
   * Save a timestamped local safety backup in IndexedDB.
   */
  async saveLocalBackup(project: SnoLabProjectFile): Promise<void> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_BACKUPS, "readwrite");
        const store = tx.objectStore(STORE_BACKUPS);
        const backupRecord = {
          id: `backup_${project.metadata.id}_${Date.now()}`,
          projectId: project.metadata.id,
          projectName: project.metadata.name,
          timestamp: new Date().toISOString(),
          project
        };
        store.put(backupRecord);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn("Could not write backup to IndexedDB:", err);
    }
  },

  /**
   * Get list of recent projects metadata from local browser cache.
   */
  async getRecentProjects(): Promise<Array<any>> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_RECENTS, "readonly");
        const store = tx.objectStore(STORE_RECENTS);
        const req = store.getAll();

        req.onsuccess = () => {
          resolve(req.result || []);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
};
