import { describe, expect, it } from "vitest";
import { canUseAIValueInEngineeringCalculation, createAIDraftMetadata, verifyAIDraft } from "../aiGovernance";

describe("AI output governance", () => {
  it("creates a review-required AI draft with no evidence", () => {
    const draft = createAIDraftMetadata({ modelId: "test-model", promptVersion: "v1" });
    expect(draft).toMatchObject({ source: "AI", status: "AI_DRAFT", reviewRequired: true, evidence: [] });
    expect(canUseAIValueInEngineeringCalculation(draft)).toBe(false);
  });

  it("requires evidence and a reviewer before AI values become usable", () => {
    const draft = createAIDraftMetadata({ modelId: "test-model", promptVersion: "v1" });
    expect(() => verifyAIDraft({ draft, reviewer: "", evidence: [{ type: "laboratory_report", reference: "LAB-1" }] })).toThrow("reviewer");
    expect(() => verifyAIDraft({ draft, reviewer: "Engineer", evidence: [] })).toThrow("Evidence");
    const verified = verifyAIDraft({ draft, reviewer: "Engineer", evidence: [{ type: "laboratory_report", reference: "LAB-1" }] });
    expect(verified.status).toBe("USER_VERIFIED");
    expect(canUseAIValueInEngineeringCalculation(verified)).toBe(true);
  });

  it("does not allow an already verified or non-AI record to be reclassified", () => {
    const draft = createAIDraftMetadata({ modelId: "test-model", promptVersion: "v1" });
    const verified = verifyAIDraft({ draft, reviewer: "Engineer", evidence: [{ type: "supplier_document", reference: "DOC-1" }] });
    expect(() => verifyAIDraft({ draft: verified, reviewer: "Engineer", evidence: verified.evidence })).toThrow("AI_DRAFT");
  });
});
