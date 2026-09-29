import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../engine/calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";
import { mixDesignEngine } from "../core/MixDesignEngine";
import { getConcreteTypeRouteTable, selectConcreteMixDesignRoute } from "../core/concreteMixDesignSelector";

describe("specialized concrete mix-design routes", () => {
  it("routes SCC automatically to the SCC engine and returns a preliminary numeric design", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "SCC",
      fck28: 35,
      slump: 2,
      dMax: 16,
      selectedMethod: "dreux",
      dosageSuper: 1.2
    }));

    expect(result.methodId).toBe("scc-specialized");
    expect(result.status).toBe("success");
    expect(result.isValid).toBe(true);
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.cementKg).toBeGreaterThan(0);
    expect(result.fineAggregateKg).toBeGreaterThan(0);
    expect(result.coarseAggregateKg).toBeGreaterThan(0);
    expect(result.quantities?.totalBinder).toBeGreaterThanOrEqual(380);
    expect(result.quantities?.totalBinder).toBeLessThanOrEqual(500);
    expect(result.engineeringAudit?.specializedMethod).toBe("SCC");
  });

  it("routes pervious concrete automatically using connected-void proportioning", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "PERVIOUS",
      fck28: 12,
      slump: 1,
      dMax: 12,
      selectedMethod: "dreux",
      approvedBulkDensity: 1450,
      approvedVoidRatio: 20
    }));

    expect(result.methodId).toBe("pervious-specialized");
    expect(result.status).toBe("success");
    expect(result.isValid).toBe(true);
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.targetVoidContentPercent).toBeCloseTo(20, 6);
    expect(result.estimatedVoidContentPercent).toBeGreaterThanOrEqual(15);
    expect(result.estimatedVoidContentPercent).toBeLessThanOrEqual(30);
    expect(result.engineeringAudit?.specializedMethod).toBe("PERVIOUS");
    expect(result.cementKg).toBeGreaterThan(0);
    expect(result.waterKg).toBeGreaterThan(0);
  });


  it("activates the specialized engines that are already registered in SnoLab", () => {
    const routes = getConcreteTypeRouteTable();
    const byType = new Map(routes.map((route) => [route.concreteType, route]));

    for (const [type, methodId] of [
      ["HSC", "hsc-hpc-specialized"],
      ["HPC", "hsc-hpc-specialized"],
      ["SCC", "scc-specialized"],
      ["LWC", "lightweight-specialized"],
      ["HWC", "heavyweight-specialized"],
      ["PERVIOUS", "pervious-specialized"]
    ] as const) {
      expect(byType.get(type)?.support).toBe("active");
      expect(byType.get(type)?.methodId).toBe(methodId);
    }
  });

  it("normalizes common concrete-type aliases before automatic routing", () => {
    expect(selectConcreteMixDesignRoute({ concreteType: "Self-Compacting Concrete (SCC)" }).methodId).toBe("scc-specialized");
    expect(selectConcreteMixDesignRoute({ concreteType: "Lightweight Béton" }).methodId).toBe("lightweight-specialized");
    expect(selectConcreteMixDesignRoute({ concreteType: "Heavyweight Concrete" }).methodId).toBe("heavyweight-specialized");
    expect(selectConcreteMixDesignRoute({ concreteType: "Pervious Concrete" }).methodId).toBe("pervious-specialized");
    expect(selectConcreteMixDesignRoute({ concreteType: "Béton de masse" }).methodId).toBe("dreux-gorisse");
    expect(selectConcreteMixDesignRoute({ concreteType: "Béton recyclé" }).methodId).toBe("recycled-aggregate-specialized");
  });

  it("does not fall back to Dreux for an unsupported specialized family", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "UHPC",
      fck28: 100,
      dMax: 10,
      selectedMethod: "dreux"
    }));

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("not-supported");
    expect(result.methodId).toBe("uhpc-specialized");
    expect(result.calculationStatus).toBe("blocked");
  });

  it("does not silently reinterpret an unknown concrete type as NSC", () => {
    const route = selectConcreteMixDesignRoute({ concreteType: "Experimental-Concrete-X" });
    expect(route.concreteType).toBe("UNSUPPORTED");
    expect(route.support).toBe("planned");
    expect(route.methodId).toBe("unsupported-concrete-type");

    const result: any = calculateMixDesign(createTestInput({ concreteType: "Experimental-Concrete-X" }));
    expect(result.isValid).toBe(false);
    expect(result.calculationStatus).toBe("blocked");
    expect(result.methodId).toBe("unsupported-concrete-type");
  });

  it("blocks a specialized design when its engineering contract inputs are missing", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "SCC",
      enforceInputContract: true,
      fck28: 35,
      dMax: 16
    }));
    expect(result.isValid).toBe(false);
    expect(result.calculationStatus).toBe("blocked");
    expect(result.methodId).toBe("scc-specialized");
    expect(result.calculationNotes.join(" ")).toContain("sccTargetSlumpFlowMm");
  });

  it("keeps migrated specialized projects on automatic routing instead of forcing Dreux", () => {
    const migrated = mixDesignEngine.migrateProject({
      inputs: { concreteType: "SCC", fck28: 35 }
    });

    expect(migrated.methodId).toBe("auto");
    expect(migrated.inputs.methodId).toBe("auto");
  });
});
