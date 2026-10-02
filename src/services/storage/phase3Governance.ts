import { SnoLabProjectFile } from "./types";

export const PROJECT_UPLOAD_ENVELOPE_VERSION = 1 as const;

export type ProjectOperation = "upload" | "download" | "share" | "export" | "import";

export interface ProjectIdentity {
  subject: string;
  email?: string;
  displayName?: string;
  teamId?: string;
  roles?: string[];
}

export interface ProjectAuditEvent {
  id: string;
  timestamp: string;
  operation: ProjectOperation;
  projectId: string;
  actor?: ProjectIdentity;
  fileName?: string;
  revision: number;
  contentHash?: string;
  details?: string;
}

export interface ImmutableProjectVersion {
  versionId: string;
  projectId: string;
  schemaVersion: number;
  createdAt: string;
  contentHash: string;
  fileName: string;
  byteLength: number;
}

export interface ProjectUploadEnvelope {
  envelopeVersion: typeof PROJECT_UPLOAD_ENVELOPE_VERSION;
  version: ImmutableProjectVersion;
  content: string;
}

const encoder = new TextEncoder();

export async function sha256Hex(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("SHA-256 is unavailable in this runtime");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function serializeProjectForIntegrity(project: SnoLabProjectFile): string {
  return JSON.stringify(project);
}

export async function createImmutableProjectVersion(
  project: SnoLabProjectFile,
  fileName: string,
  content = serializeProjectForIntegrity(project)
): Promise<ImmutableProjectVersion> {
  const createdAt = new Date().toISOString();
  const contentHash = await sha256Hex(content);
  return {
    versionId: `${project.metadata.id}:${contentHash.slice(0, 16)}`,
    projectId: project.metadata.id,
    schemaVersion: project.schemaVersion,
    createdAt,
    contentHash,
    fileName,
    byteLength: encoder.encode(content).byteLength
  };
}

export async function createProjectUploadEnvelope(
  project: SnoLabProjectFile,
  fileName: string
): Promise<ProjectUploadEnvelope> {
  const content = serializeProjectForIntegrity(project);
  return {
    envelopeVersion: PROJECT_UPLOAD_ENVELOPE_VERSION,
    version: await createImmutableProjectVersion(project, fileName, content),
    content
  };
}

export async function validateProjectUploadEnvelope(
  envelope: ProjectUploadEnvelope
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  if (envelope?.envelopeVersion !== PROJECT_UPLOAD_ENVELOPE_VERSION) {
    errors.push("Unsupported upload envelope version");
  }
  if (!envelope?.content || typeof envelope.content !== "string") {
    errors.push("Upload content is missing");
    return { valid: false, errors };
  }
  if (!envelope.version?.projectId || !envelope.version.contentHash) {
    errors.push("Immutable version metadata is incomplete");
    return { valid: false, errors };
  }
  const actualHash = await sha256Hex(envelope.content);
  if (actualHash !== envelope.version.contentHash) {
    errors.push("Content hash does not match immutable version metadata");
  }
  if (encoder.encode(envelope.content).byteLength !== envelope.version.byteLength) {
    errors.push("Content byte length does not match immutable version metadata");
  }
  return { valid: errors.length === 0, errors };
}

export function appendProjectAuditEvent(
  project: SnoLabProjectFile,
  event: Omit<ProjectAuditEvent, "id" | "timestamp" | "projectId" | "revision">
): SnoLabProjectFile {
  const now = new Date().toISOString();
  const revision = (project.auditTrail?.revisionCount || 1) + 1;
  const auditEvent: ProjectAuditEvent = {
    ...event,
    id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now,
    projectId: project.metadata.id,
    revision
  };
  return {
    ...project,
    auditTrail: {
      ...project.auditTrail,
      lastModifiedBy: event.actor?.displayName || event.actor?.subject || project.auditTrail?.lastModifiedBy,
      lastModifiedAt: now,
      revisionCount: revision,
      revisionHistory: [...(project.auditTrail?.revisionHistory || []), `${event.operation}:${auditEvent.id}`]
    },
    governance: {
      ...project.governance,
      auditEvents: [...(project.governance?.auditEvents || []), auditEvent]
    }
  };
}

export type AuditExportFormat = "json" | "csv";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  // Prefix formula-like values so opening the export in spreadsheet software
  // cannot interpret an actor or detail as an executable formula.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Serializes the immutable audit history for download or external archiving. */
export function exportProjectAuditTrail(
  project: SnoLabProjectFile,
  format: AuditExportFormat = "json"
): string {
  const events = project.governance?.auditEvents || [];
  if (format === "json") {
    return JSON.stringify({
      projectId: project.metadata.id,
      exportedAt: new Date().toISOString(),
      events
    }, null, 2);
  }

  const header = ["id", "timestamp", "operation", "projectId", "actor", "fileName", "revision", "contentHash", "details"];
  const rows = events.map(event => [
    event.id,
    event.timestamp,
    event.operation,
    event.projectId,
    event.actor?.displayName || event.actor?.email || event.actor?.subject || "",
    event.fileName || "",
    event.revision,
    event.contentHash || "",
    event.details || ""
  ]);
  return [header, ...rows].map(row => row.map(csvCell).join(",")).join("\n");
}
