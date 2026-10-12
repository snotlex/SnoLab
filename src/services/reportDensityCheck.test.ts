import { describe, expect, it } from "vitest";
import { classifyReportDensity } from "./reportDensityCheck";

describe("report density safety check", () => {
  it.each([undefined, null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY, "2400"])(
    "blocks unavailable or invalid density values (%s)",
    (value) => {
      expect(classifyReportDensity(value, "NSC")).toBe("unavailable");
    }
  );

  it("fails an implausibly low density for non-lightweight concrete", () => {
    expect(classifyReportDensity(2000, "NSC")).toBe("below-minimum");
  });

  it("does not apply the normal-density threshold to lightweight concrete", () => {
    expect(classifyReportDensity(1800, "LWC")).toBe("pass");
  });

  it("accepts a finite positive density for further review, not as engineering approval", () => {
    expect(classifyReportDensity(2400, "NSC")).toBe("pass");
  });
});
