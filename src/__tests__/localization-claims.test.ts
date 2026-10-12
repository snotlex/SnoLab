import { describe, expect, it } from "vitest";
import { TECHNICAL_DICTIONARY } from "../services/localization";

describe("localization approval-claim guard", () => {
  it("uses review-safe wording for material status labels in all languages", () => {
    const approvedStatus = TECHNICAL_DICTIONARY.status_approved;
    const validatedStatus = TECHNICAL_DICTIONARY.status_validated;
    const activeInMix = TECHNICAL_DICTIONARY.approved_active_in_mix;

    expect(approvedStatus.en).toContain("Eligible for calculation after review");
    expect(approvedStatus.fr).toContain("après revue");
    expect(approvedStatus.ar).toContain("بعد المراجعة");
    expect(validatedStatus.en).toContain("Fields Complete — Review Required");
    expect(activeInMix.en).toContain("Approval Pending");

    for (const value of [
      ...Object.values(approvedStatus),
      ...Object.values(validatedStatus),
      ...Object.values(activeInMix)
    ]) {
      expect(value).not.toMatch(/Certified for Engineering|Approved\)$/i);
      expect(value).not.toMatch(/معتمد للصب الهندسي|موافقة مشروطة/);
    }
  });

  it("describes diagnostic success without turning it into official approval", () => {
    const diagnosticMessage = TECHNICAL_DICTIONARY.no_diagnostic_warnings;

    expect(diagnosticMessage.en).toContain("official approval remain separate");
    expect(diagnosticMessage.fr).toContain("approbation officielle restent distinctes");
    expect(diagnosticMessage.ar).toContain("الاعتماد الرسمي منفصلين");
    expect(diagnosticMessage.en).not.toContain("fully compliant");
  });
});
