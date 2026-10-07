import { describe, expect, it } from "vitest";
import { createAIDraftMetadata, verifyAIDraft } from "./aiGovernance";
import { assertAIEngineeringWriteAllowed, createAIRequestEnvelope, sanitizeAIContext, validateAIConsent } from "./aiRequestGovernance";

describe("AI request and engineering write governance", () => {
  it("keeps only explicitly allowed context fields and removes sensitive fields", () => {
    const result = sanitizeAIContext({ materialCategory: "sand", density: 2650, clientEmail: "private@example.com", token: "secret" }, { allowedFields: ["materialCategory", "density"] });
    expect(result.context).toEqual({ materialCategory: "sand", density: 2650 });
    expect(result.removedFields).toEqual(expect.arrayContaining(["clientEmail", "token"]));
  });

  it("requires explicit consent for external AI and validates the declared payload", () => {
    expect(() => createAIRequestEnvelope({ provider: "google", purpose: "material recommendation", outputKind: "recommendation", promptVersion: "v1", context: { materialCategory: "sand" } })).toThrow("AI_CONSENT_REQUIRED");
    const envelope = createAIRequestEnvelope({
      provider: "google",
      purpose: "material recommendation",
      outputKind: "recommendation",
      promptVersion: "v1",
      context: { materialCategory: "sand", customerName: "must be removed" },
      consent: { granted: true, grantedAt: "2026-10-07T00:00:00.000Z", userId: "u-1", purpose: "material recommendation", provider: "google", fieldsShared: ["materialCategory"], attachmentsShared: [] },
      policy: { allowedFields: ["materialCategory", "customerName"] },
    });
    expect(envelope.context).toEqual({ materialCategory: "sand" });
    expect(envelope.consent?.userId).toBe("u-1");
  });

  it("validates attachment count, MIME, and size", () => {
    const consent = { granted: true, grantedAt: "2026-10-07T00:00:00.000Z", userId: "u-1", purpose: "OCR", provider: "google" as const, fieldsShared: ["materialCategory"], attachmentsShared: ["report.pdf"] };
    expect(() => validateAIConsent(consent, ["materialCategory"], [{ name: "report.exe", mimeType: "application/x-msdownload", sizeBytes: 10 }])).toThrow("AI_ATTACHMENT_MIME_NOT_ALLOWED");
    expect(() => validateAIConsent(consent, ["materialCategory"], [{ name: "large.pdf", mimeType: "application/pdf", sizeBytes: 11 * 1024 * 1024 }])).toThrow("AI_ATTACHMENT_SIZE_EXCEEDED");
  });

  it("blocks AI draft values from engineering writes until evidence-backed verification", () => {
    const draft = createAIDraftMetadata({ modelId: "model", promptVersion: "v1" });
    expect(() => assertAIEngineeringWriteAllowed(draft)).toThrow("AI_ENGINEERING_WRITE_BLOCKED");
    const verified = verifyAIDraft({ draft, reviewer: "engineer", evidence: [{ type: "laboratory_report", reference: "LAB-1" }] });
    expect(() => assertAIEngineeringWriteAllowed(verified)).not.toThrow();
  });
});
