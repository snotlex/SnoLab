import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  normalizeProjectId,
  recordProjectRecommendationDecision,
  getProjectRecommendationDecisions,
  clearProjectRecommendationDecisions,
  saveProjectRecommendationDecisions,
  RecommendationDecisionRecord
} from "../services/materialRecommendationEngine";

describe("Material Recommendation Storage & Project ID Resilience", () => {
  let mockStore: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStore[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStore[key];
    }),
    clear: vi.fn(() => {
      mockStore = {};
    }),
    get length() {
      return Object.keys(mockStore).length;
    },
    key: vi.fn((index: number) => Object.keys(mockStore)[index] ?? null)
  };

  beforeEach(() => {
    mockStore = {};
    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes project IDs properly across various representations without producing [object Object]", () => {
    expect(normalizeProjectId("PROJ-99")).toBe("PROJ-99");
    expect(normalizeProjectId({ id: "PROJ-99" })).toBe("PROJ-99");
    expect(normalizeProjectId({ projectId: "PROJ-42" })).toBe("PROJ-42");
    expect(normalizeProjectId({ name: "Project Alpha" })).toBe("Project Alpha");
    expect(normalizeProjectId({ id: { id: "NESTED-1" } })).toBe("NESTED-1");
    expect(normalizeProjectId("[object Object]")).toBe("default");
    expect(normalizeProjectId(null)).toBe("default");
    expect(normalizeProjectId(undefined)).toBe("default");
  });

  it("records decisions without ever creating an [object Object] localStorage key even if an object is passed as projectId", () => {
    const mockRecord: any = {
      id: "dec-1",
      projectId: { id: "PROJ-CONSTRUCTION-A", name: "Bridge Project" },
      role: "cement",
      materialId: "mat-cem-1",
      materialName: "CEM I 42.5 R",
      materialCategory: "cement",
      action: "accept",
      compatibilityScore: 95,
      timestamp: new Date().toISOString()
    };

    recordProjectRecommendationDecision(mockRecord);

    // Verify localStorage key
    expect(mockLocalStorage.getItem("snolab_material_recommendation_decisions_[object Object]")).toBeNull();
    const stored = mockLocalStorage.getItem("snolab_material_recommendation_decisions_PROJ-CONSTRUCTION-A");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed[0].projectId).toBe("PROJ-CONSTRUCTION-A");
    expect(parsed[0].materialId).toBe("mat-cem-1");

    // Reading back
    const retrieved = getProjectRecommendationDecisions("PROJ-CONSTRUCTION-A");
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].materialId).toBe("mat-cem-1");
  });

  it("handles QuotaExceededError smoothly without crashing and retains decisions in memory", () => {
    const mockRecord: RecommendationDecisionRecord = {
      id: "dec-quota-test",
      projectId: "PROJ-QUOTA",
      role: "sand",
      materialId: "mat-sand-1",
      materialName: "Silica Sand 0/4",
      materialCategory: "sand",
      isSystem: false,
      action: "accept",
      compatibilityScore: 88,
      timestamp: new Date().toISOString(),
      context: {
        concreteType: "NSC",
        mixDesignMethod: "dreux"
      }
    };

    // Simulate quota exceeded error on setItem
    mockLocalStorage.setItem.mockImplementation(() => {
      const err = new Error("Failed to execute 'setItem' on 'Storage': Setting the value exceeded the quota.");
      err.name = "QuotaExceededError";
      (err as any).code = 22;
      throw err;
    });

    expect(() => {
      recordProjectRecommendationDecision(mockRecord);
    }).not.toThrow();

    // Decisions must still be accessible through the in-memory fallback
    const retrieved = getProjectRecommendationDecisions("PROJ-QUOTA");
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].materialId).toBe("mat-sand-1");
  });

  it("clears decisions and purges any legacy corrupted keys properly", () => {
    // Set a legacy corrupted key manually
    mockStore["snolab_material_recommendation_decisions_[object Object]"] = "[]";
    mockStore["snolab_material_recommendation_decisions_PROJ-X"] = "[{}]";

    clearProjectRecommendationDecisions("PROJ-X");

    expect(mockStore["snolab_material_recommendation_decisions_PROJ-X"]).toBeUndefined();
    expect(mockStore["snolab_material_recommendation_decisions_[object Object]"]).toBeUndefined();
  });
});
