import { MixDesignInput, MixDesignResult } from "../types";

export type ReportDownloadLanguage = "ar" | "fr" | "en";
export interface ReportDownloadMetadata {
  reportId: string;
  revisionId: string;
  reportReference: string;
  inputHash: string;
  issuedAt: string;
  expiresAt: string;
  downloadUrl: string;
  status: string;
}

export interface ReportDownloadSnapshot {
  input: MixDesignInput;
  result: MixDesignResult;
  activeProject?: Record<string, unknown>;
  materialsDatabase?: unknown[];
  language: ReportDownloadLanguage;
  reportId: string;
  revisionId: string;
  reportReference: string;
  status: string;
}

export async function createReportDownloadToken(snapshot: ReportDownloadSnapshot): Promise<ReportDownloadMetadata> {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || payload?.error || "تعذر إنشاء رابط التقرير الآمن.");
  }
  return payload.metadata as ReportDownloadMetadata;
}

export function verifyReportDownloadToken(metadata: ReportDownloadMetadata): boolean {
  return Boolean(metadata?.downloadUrl && metadata?.expiresAt && Date.parse(metadata.expiresAt) > Date.now());
}

export function buildReportDownloadUrl(metadata: ReportDownloadMetadata): string {
  return metadata.downloadUrl;
}

export function getReportDownloadMetadata(metadata: ReportDownloadMetadata | null): ReportDownloadMetadata | null {
  return metadata && verifyReportDownloadToken(metadata) ? metadata : null;
}
