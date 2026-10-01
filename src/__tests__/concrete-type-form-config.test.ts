import { describe, expect, it } from "vitest";
import { getConcreteTypeFormConfig, isFieldRequiredForConcreteType } from "../mix-design/core/concreteTypeFormConfig";

describe("stage 3 concrete type form configuration", () => {
  it("keeps NSC focused and does not expose specialized sections by default", () => {
    const config = getConcreteTypeFormConfig("NSC");
    expect(config.sections).not.toContain("admixtures");
    expect(config.requiredFields).toContain("fck28");
    expect(config.requiredFields).not.toContain("sccTargetSlumpFlowMm");
  });

  it("maps SCC and UHPC requirements to their specialized fields", () => {
    expect(isFieldRequiredForConcreteType("SCC", "sccTargetSlumpFlowMm")).toBe(true);
    expect(isFieldRequiredForConcreteType("UHPC", "uhpcQuartzPowderKgM3")).toBe(true);
    expect(isFieldRequiredForConcreteType("NSC", "uhpcQuartzPowderKgM3")).toBe(false);
  });

  it("keeps shared requirements visible for specialized types", () => {
    const config = getConcreteTypeFormConfig("GPC");
    expect(config.sections).toContain("requirements");
    expect(config.requiredFields).toContain("gpcActivatorLiquidKgM3");
    expect(config.specialMaterialRoles).toContain("special binder and activator");
  });
});
