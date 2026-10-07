import type { AIGovernanceMetadata } from "./aiGovernance";

export type AIProvider = "google" | "local";
export type AIOutputKind = "recommendation" | "classification" | "extraction" | "engineering_value" | "narrative";

export interface AIConsent {
  granted: boolean;
  grantedAt?: string;
  userId?: string;
  purpose: string;
  provider: AIProvider;
  fieldsShared: string[];
  attachmentsShared: string[];
}

export interface AIRequestAttachment {
  name: string;
  mimeType: string;
  sizeBytes: number;
  reference?: string;
}

export interface AIRequestEnvelope<TContext extends Record<string, unknown> = Record<string, unknown>> {
  provider: AIProvider;
  purpose: string;
  outputKind: AIOutputKind;
  promptVersion: string;
  context: TContext;
  attachments: AIRequestAttachment[];
  consent?: AIConsent;
  createdAt: string;
}

export interface AISanitizePolicy {
  allowedFields: string[];
  blockedFields?: string[];
  maxPromptCharacters?: number;
  maxAttachments?: number;
  maxAttachmentBytes?: number;
  allowedMimeTypes?: string[];
}

export interface AISanitizedContext {
  context: Record<string, unknown>;
  removedFields: string[];
  estimatedCharacters: number;
}

const DEFAULT_BLOCKED_FIELDS = [
  "clientName", "clientEmail", "email", "phone", "address", "customer", "customerName",
  "password", "token", "secret", "apiKey", "authorization", "attachments", "rawFileMetadata"
];
const DEFAULT_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "text/csv", "application/json", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

function fieldName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function sanitizeAIContext(input: Record<string, unknown>, policy: AISanitizePolicy): AISanitizedContext {
  const allowed = new Set(policy.allowedFields.map(fieldName));
  const blocked = new Set([...(policy.blockedFields || []), ...DEFAULT_BLOCKED_FIELDS].map(fieldName));
  const removedFields: string[] = [];
  const context: Record<string, unknown> = {};

  Object.entries(input).forEach(([key, value]) => {
    const normalized = fieldName(key);
    if (blocked.has(normalized) || !allowed.has(normalized)) {
      removedFields.push(key);
      return;
    }
    context[key] = value;
  });

  const estimatedCharacters = JSON.stringify(context).length;
  if (policy.maxPromptCharacters !== undefined && estimatedCharacters > policy.maxPromptCharacters) {
    throw new Error("AI_CONTEXT_TOO_LARGE");
  }
  return { context, removedFields, estimatedCharacters };
}

export function validateAIConsent(
  consent: AIConsent | undefined,
  requiredFields: string[],
  attachments: AIRequestAttachment[] = [],
  policy: Pick<AISanitizePolicy, "maxAttachments" | "maxAttachmentBytes" | "allowedMimeTypes"> = {}
): void {
  if (!consent || consent.provider !== "google") return;
  if (!consent.granted) throw new Error("AI_CONSENT_REQUIRED");
  if (!consent.grantedAt || !consent.userId) throw new Error("AI_CONSENT_IDENTITY_REQUIRED");
  if (!consent.purpose.trim()) throw new Error("AI_CONSENT_PURPOSE_REQUIRED");
  const missing = requiredFields.filter(field => !consent.fieldsShared.includes(field));
  if (missing.length) throw new Error(`AI_CONSENT_FIELD_NOT_LISTED:${missing.join(",")}`);
  const maxAttachments = policy.maxAttachments ?? 5;
  if (attachments.length > maxAttachments) throw new Error("AI_ATTACHMENT_COUNT_EXCEEDED");
  const maxBytes = policy.maxAttachmentBytes ?? 10 * 1024 * 1024;
  const allowedMimeTypes = policy.allowedMimeTypes || DEFAULT_MIME_TYPES;
  attachments.forEach(attachment => {
    if (!allowedMimeTypes.includes(attachment.mimeType)) throw new Error(`AI_ATTACHMENT_MIME_NOT_ALLOWED:${attachment.mimeType}`);
    if (!Number.isFinite(attachment.sizeBytes) || attachment.sizeBytes < 0 || attachment.sizeBytes > maxBytes) throw new Error(`AI_ATTACHMENT_SIZE_EXCEEDED:${attachment.name}`);
  });
}

export function createAIRequestEnvelope<TContext extends Record<string, unknown>>(params: {
  provider: AIProvider;
  purpose: string;
  outputKind: AIOutputKind;
  promptVersion: string;
  context: TContext;
  attachments?: AIRequestAttachment[];
  consent?: AIConsent;
  policy?: AISanitizePolicy;
}): AIRequestEnvelope<Record<string, unknown>> {
  if (!params.purpose.trim()) throw new Error("AI_PURPOSE_REQUIRED");
  if (!params.promptVersion.trim()) throw new Error("AI_PROMPT_VERSION_REQUIRED");
  if (params.provider === "google" && !params.consent) throw new Error("AI_CONSENT_REQUIRED");
  const attachments = [...(params.attachments || [])];
  const policy = params.policy || { allowedFields: Object.keys(params.context) };
  const sanitized = sanitizeAIContext(params.context, policy);
  validateAIConsent(params.consent, Object.keys(sanitized.context), attachments, policy);
  return {
    provider: params.provider,
    purpose: params.purpose.trim(),
    outputKind: params.outputKind,
    promptVersion: params.promptVersion.trim(),
    context: sanitized.context,
    attachments,
    consent: params.consent,
    createdAt: new Date().toISOString(),
  };
}

export function assertAIEngineeringWriteAllowed(metadata?: AIGovernanceMetadata): void {
  if (!metadata || metadata.source !== "AI") return;
  if (
    metadata.status !== "USER_VERIFIED" ||
    metadata.reviewRequired ||
    metadata.evidence.length === 0 ||
    !metadata.reviewedBy ||
    !metadata.reviewedAt
  ) {
    throw new Error("AI_ENGINEERING_WRITE_BLOCKED");
  }
}
