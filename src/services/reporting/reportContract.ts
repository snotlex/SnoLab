import type { MixDesignInput, MixDesignResult } from "../../types";
import type { Language } from "../localization";

export type ReportKind = "summary" | "technical" | "audit" | "client";
export type ReportStatus =
  | "draft"
  | "in-progress"
  | "pending-review"
  | "returned-for-correction"
  | "technically-reviewed"
  | "approved"
  | "issued"
  | "superseded"
  | "archived"
  | "cancelled";
export type ReportFormat = "pdf" | "docx" | "xlsx" | "csv" | "json" | "html" | "png" | "svg";
export type FindingSeverity = "critical" | "high" | "medium" | "low";

export interface ReportFinding {
  code: string;
  severity: FindingSeverity;
  message: string;
  source?: string;
  path?: string;
}

export interface ReportAuditEntry {
  id: string;
  action: "created" | "updated" | "validated" | "exported" | "submitted" | "approved" | "issued" | "archived";
  actor: string;
  at: string;
  details?: string;
}

export interface ReportMetadata {
  reportId: string;
  reportType: ReportKind;
  projectId?: string;
  projectName?: string;
  client?: string;
  site?: string;
  author?: string;
  reviewer?: string;
  approver?: string;
  createdAt: string;
  revision: number;
  status: ReportStatus;
  language: Language;
  direction: "rtl" | "ltr";
  templateId: string;
  dataVersion: string;
  calculationVersion: string;
  verificationStatus: "not-checked" | "passed" | "passed-with-warnings" | "blocked";
  approvalStatus: "not-submitted" | "pending" | "approved" | "rejected";
  integrityHash: string;
  formats: ReportFormat[];
}

export interface ReportEnvelope {
  metadata: ReportMetadata;
  input: MixDesignInput;
  result: MixDesignResult;
  findings: ReportFinding[];
  auditHistory: ReportAuditEntry[];
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`).join(",")}}`;
}

export function hashReportPayload(value: unknown): string {
  // Deterministic, browser-safe integrity identifier. The server additionally hashes
  // downloaded reports with SHA-256 before issuing signed links.
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function buildReportEnvelope(args: {
  input: MixDesignInput;
  result: MixDesignResult;
  language: Language;
  reportType?: ReportKind;
  status?: ReportStatus;
  project?: { id?: string; name?: string; client?: string; plant?: string };
  findings?: ReportFinding[];
}): ReportEnvelope {
  const now = new Date().toISOString();
  const payload = { input: args.input, result: args.result };
  const findings = args.findings || [];
  const hasCritical = findings.some((finding) => finding.severity === "critical");
  const metadata: ReportMetadata = {
    reportId: `SNO-${now.replace(/[-:.TZ]/g, "").slice(0, 14)}-${hashReportPayload(payload).slice(-6)}`,
    reportType: args.reportType || "technical",
    projectId: args.project?.id,
    projectName: args.project?.name,
    client: args.project?.client,
    site: args.project?.plant,
    createdAt: now,
    revision: 1,
    status: args.status || "draft",
    language: args.language,
    direction: args.language === "ar" ? "rtl" : "ltr",
    templateId: "snolab-engineering-v2",
    dataVersion: "mix-design-contract-v2",
    calculationVersion: String((args.result as any).methodVersion || "dreux-gorisse-1.0.0"),
    verificationStatus: hasCritical ? "blocked" : findings.length ? "passed-with-warnings" : "passed",
    approvalStatus: "not-submitted",
    integrityHash: hashReportPayload(payload),
    formats: ["pdf", "docx", "xlsx", "csv", "json", "html", "png", "svg"],
  };
  return {
    metadata,
    input: args.input,
    result: args.result,
    findings,
    auditHistory: [{ id: metadata.reportId, action: "created", actor: "SnoLab", at: now }],
  };
}

export function canIssueReport(report: ReportEnvelope): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (report.findings.some((finding) => finding.severity === "critical")) reasons.push("critical_findings");
  if (!report.input || !report.result) reasons.push("missing_data");
  if (report.metadata.verificationStatus === "blocked") reasons.push("verification_blocked");
  if (report.metadata.approvalStatus !== "approved") reasons.push("approval_required");
  return { allowed: reasons.length === 0, reasons };
}

export function flattenReportRows(report: ReportEnvelope): Array<{ section: string; field: string; value: unknown }> {
  const rows: Array<{ section: string; field: string; value: unknown }> = [];
  const append = (section: string, value: unknown, prefix = "") => {
    if (value === null || value === undefined || typeof value !== "object") {
      rows.push({ section, field: prefix || section, value });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => append(section, item, `${prefix}[${index}]`));
      return;
    }
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => append(section, item, prefix ? `${prefix}.${key}` : key));
  };
  append("metadata", report.metadata);
  append("input", report.input);
  append("result", report.result);
  append("findings", report.findings);
  return rows;
}
