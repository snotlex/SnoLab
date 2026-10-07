import { flattenReportRows, type ReportEnvelope } from "./reportContract";
import { sanitizeSpreadsheetValue } from "../export/spreadsheetSanitizer";

function downloadBlob(content: BlobPart, mime: string, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "snolab-report";
}

function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  const text = String(sanitizeSpreadsheetValue(raw));
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function reportToCsv(report: ReportEnvelope): string {
  const rows = flattenReportRows(report);
  return [
    ["section", "field", "value"],
    ...rows.map((row) => [row.section, row.field, row.value]),
  ].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function reportToHtml(report: ReportEnvelope): string {
  const rtl = report.metadata.direction === "rtl";
  const rows = flattenReportRows(report).map((row) => `<tr><td>${escapeHtml(row.section)}</td><td>${escapeHtml(row.field)}</td><td>${escapeHtml(row.value)}</td></tr>`).join("");
  const title = report.metadata.projectName || "SnoLab Engineering Report";
  return `<!doctype html><html lang="${report.metadata.language}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,"Noto Sans Arabic",sans-serif;color:#172033;margin:32px;line-height:1.5}h1{color:#0f3b74;border-bottom:3px solid #f59e0b;padding-bottom:12px}table{border-collapse:collapse;width:100%;font-size:12px}th{background:#0f3b74;color:white;text-align:start}td,th{border:1px solid #cbd5e1;padding:7px;vertical-align:top}tr:nth-child(even){background:#f8fafc}.meta{background:#f1f5f9;padding:12px;border-radius:8px;margin-bottom:18px}.warning{color:#991b1b;font-weight:700}</style></head><body><h1>${escapeHtml(title)}</h1><div class="meta"><b>Report ID:</b> ${escapeHtml(report.metadata.reportId)}<br><b>Revision:</b> ${report.metadata.revision}<br><b>Status:</b> ${escapeHtml(report.metadata.status)}<br><b>Verification:</b> ${escapeHtml(report.metadata.verificationStatus)}<br><b>Integrity:</b> ${escapeHtml(report.metadata.integrityHash)}</div>${report.findings.length ? `<p class="warning">${report.findings.length} validation finding(s) require review.</p>` : ""}<table><thead><tr><th>Section</th><th>Field</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
}

export function downloadReportFormat(report: ReportEnvelope, format: "csv" | "json" | "html"): void {
  const base = safeFilename(report.metadata.reportId);
  if (format === "csv") downloadBlob("\uFEFF" + reportToCsv(report), "text/csv;charset=utf-8", `${base}.csv`);
  if (format === "json") downloadBlob(JSON.stringify(report, null, 2), "application/json;charset=utf-8", `${base}.json`);
  if (format === "html") downloadBlob(reportToHtml(report), "text/html;charset=utf-8", `${base}.html`);
}
