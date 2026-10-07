export type AIDraftStatus = "AI_DRAFT" | "USER_VERIFIED";
export type AIConfidence = "unknown" | "low" | "medium" | "high";

export interface AIEvidence {
  type: "supplier_document" | "laboratory_report" | "user_attestation" | "other";
  reference: string;
  description?: string;
}

export interface AIGovernanceMetadata {
  source: "AI";
  status: AIDraftStatus;
  modelId: string;
  generatedAt: string;
  promptVersion: string;
  confidence: AIConfidence;
  evidence: AIEvidence[];
  reviewRequired: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
}

export function createAIDraftMetadata(params: {
  modelId: string;
  promptVersion: string;
  confidence?: AIConfidence;
  generatedAt?: string;
}): AIGovernanceMetadata {
  return {
    source: "AI",
    status: "AI_DRAFT",
    modelId: params.modelId,
    generatedAt: params.generatedAt || new Date().toISOString(),
    promptVersion: params.promptVersion,
    confidence: params.confidence || "unknown",
    evidence: [],
    reviewRequired: true
  };
}

export function canUseAIValueInEngineeringCalculation(metadata?: AIGovernanceMetadata): boolean {
  return Boolean(
    metadata
    && metadata.source === "AI"
    && metadata.status === "USER_VERIFIED"
    && metadata.reviewRequired === false
    && metadata.evidence.length > 0
    && metadata.reviewedBy
    && metadata.reviewedAt
  );
}

export function verifyAIDraft(params: {
  draft: AIGovernanceMetadata;
  reviewer: string;
  evidence: AIEvidence[];
  reviewedAt?: string;
}): AIGovernanceMetadata {
  if (params.draft.source !== "AI" || params.draft.status !== "AI_DRAFT") {
    throw new Error("Only an AI_DRAFT can be converted to USER_VERIFIED.");
  }
  if (!params.reviewer.trim()) throw new Error("A reviewer is required to verify an AI draft.");
  if (params.evidence.length === 0) throw new Error("Evidence is required to verify an AI draft.");
  if (params.evidence.some(item => !item.reference.trim())) throw new Error("Every AI evidence item requires a traceable reference.");
  return {
    ...params.draft,
    status: "USER_VERIFIED",
    evidence: params.evidence.map(item => ({ ...item })),
    reviewRequired: false,
    reviewedBy: params.reviewer.trim(),
    reviewedAt: params.reviewedAt || new Date().toISOString()
  };
}
