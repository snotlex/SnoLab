import { describe, expect, it } from "vitest";
import { buildReportEnvelope } from "./reportContract";
import { reportToCsv, reportToHtml } from "./reportFormatExport";

describe("report format exporters", () => {
  const report = buildReportEnvelope({
    input: { fck28: 25, selectedMethod: "dreux" } as any,
    result: { cementWeight: 333.76, notes: "<unsafe>" } as any,
    language: "ar",
    project: { name: "Project <test>" },
  });

  it("emits UTF-8 CSV with a stable header and escaped values", () => {
    const csv = reportToCsv(report);
    expect(csv.startsWith("section,field,value")).toBe(true);
    expect(csv).toContain("input,fck28,25");
  });

  it("neutralizes formula-like report values in CSV", () => {
    const csv = reportToCsv(buildReportEnvelope({
      input: { fck28: 25 } as any,
      result: { notes: "=HYPERLINK(\"https://example.com\")" } as any,
      language: "en",
    }));
    expect(csv).toContain("'=HYPERLINK");
  });

  it("emits standalone RTL HTML and escapes user data", () => {
    const html = reportToHtml(report);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("Project &lt;test&gt;");
    expect(html).not.toContain("<unsafe>");
  });
});
