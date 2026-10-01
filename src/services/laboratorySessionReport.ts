import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { LaboratorySession, LaboratorySessionTestItem } from "../types/laboratorySessionTypes";
import type { CalibrationRecord, TestDeviceRecord } from "../types/qualityDomain";
import { hashReportPayload } from "./reporting/reportContract";
import { createPdfDocument, drawLaboratoryEmblemLogo, PDF_COLORS, PDF_PAGE_MARGINS } from "./pdf/pdfCore";
import { drawPdfText, preparePdfTableRows, setPdfFont } from "./pdf/pdfArabic";

export type LaboratoryReportLanguage = "ar" | "fr" | "en";

export interface LaboratorySessionReportOptions {
  language?: LaboratoryReportLanguage;
  devices?: TestDeviceRecord[];
  calibrations?: CalibrationRecord[];
  generatedBy?: string;
}

export interface LaboratorySessionReport {
  metadata: {
    reportId: string;
    reportType: "laboratory-session";
    requestNumber: string;
    projectId?: string;
    projectName?: string;
    language: LaboratoryReportLanguage;
    direction: "rtl" | "ltr";
    generatedAt: string;
    generatedBy: string;
    status: LaboratorySession["status"];
    reviewDecision?: LaboratorySession["review"];
    integrityHash: string;
    formats: Array<"pdf" | "html" | "json" | "csv">;
  };
  summary: {
    totalSamples: number;
    totalTests: number;
    completedTests: number;
    passedTests: number;
    warningTests: number;
    failedTests: number;
    blockedTests: number;
    completionPercent: number;
  };
  samples: LaboratorySession["samples"];
  tests: Array<{
    id: string;
    sequence: number;
    testType: string;
    title: { ar: string; fr: string; en: string };
    standard: string;
    materialId: string;
    sampleId: string;
    sampleCode?: string;
    status: LaboratorySessionTestItem["status"];
    operator?: string;
    requiredReplicates?: number;
    result?: LaboratorySessionTestItem["result"];
    resultSummary?: LaboratorySessionTestItem["resultSummary"];
    replicates: LaboratorySessionTestItem["replicates"];
    notes?: string;
  }>;
  calibrationEvidence: Array<{ deviceId: string; deviceName: string; serialNumber?: string; calibrationStatus: string; calibrationDue?: string; certificateNumber?: string }>;
  auditHistory: LaboratorySession["auditLog"];
  findings: string[];
}

const labels = {
  ar: { title: "التقرير المختبري الرسمي", request: "رقم الطلب", project: "المشروع", status: "الحالة", generated: "تاريخ الإصدار", samples: "العينات", tests: "نتائج الاختبارات", standard: "المواصفة", sample: "العينة", result: "النتيجة", replicates: "التكرارات", audit: "سجل التدقيق", calibration: "أدلة الأجهزة والمعايرة", noData: "لا توجد بيانات" },
  fr: { title: "RAPPORT OFFICIEL DE SESSION LABORATOIRE", request: "Référence demande", project: "Projet", status: "Statut", generated: "Date d'émission", samples: "Échantillons", tests: "Résultats des essais", standard: "Norme", sample: "Échantillon", result: "Résultat", replicates: "Répétitions", audit: "Journal d'audit", calibration: "Preuves appareils et étalonnage", noData: "Aucune donnée" },
  en: { title: "OFFICIAL LABORATORY SESSION REPORT", request: "Request reference", project: "Project", status: "Status", generated: "Issue date", samples: "Samples", tests: "Test results", standard: "Standard", sample: "Sample", result: "Result", replicates: "Replicates", audit: "Audit trail", calibration: "Equipment & calibration evidence", noData: "No data" }
} as const;

function locale(options?: LaboratorySessionReportOptions): LaboratoryReportLanguage {
  return options?.language || "en";
}

function value(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function statusText(status: string, language: LaboratoryReportLanguage): string {
  const map: Record<string, Record<LaboratoryReportLanguage, string>> = {
    APPROVED: { ar: "معتمد", fr: "Approuvé", en: "Approved" },
    UNDER_REVIEW: { ar: "قيد المراجعة", fr: "En revue", en: "Under review" },
    COMPLETED: { ar: "مكتمل", fr: "Terminé", en: "Completed" },
    PARTIALLY_COMPLETED: { ar: "مكتمل جزئيًا", fr: "Partiellement terminé", en: "Partially completed" },
    IN_PROGRESS: { ar: "قيد التنفيذ", fr: "En cours", en: "In progress" },
    DRAFT: { ar: "مسودة", fr: "Brouillon", en: "Draft" },
    PASS: { ar: "مطابق", fr: "Conforme", en: "Pass" },
    WARNING: { ar: "تحذير", fr: "Attention", en: "Warning" },
    FAIL: { ar: "غير مطابق", fr: "Non conforme", en: "Fail" },
    BLOCKED: { ar: "محظور", fr: "Bloqué", en: "Blocked" }
  };
  return map[status]?.[language] || status;
}

export function buildLaboratorySessionReport(session: LaboratorySession, options: LaboratorySessionReportOptions = {}): LaboratorySessionReport {
  const language = locale(options);
  const generatedAt = new Date().toISOString();
  const summary = {
    totalSamples: session.samples.length,
    totalTests: session.tests.length,
    completedTests: session.tests.filter(test => ["PASS", "WARNING", "FAIL"].includes(test.status)).length,
    passedTests: session.tests.filter(test => test.status === "PASS").length,
    warningTests: session.tests.filter(test => test.status === "WARNING").length,
    failedTests: session.tests.filter(test => test.status === "FAIL").length,
    blockedTests: session.tests.filter(test => test.status === "BLOCKED").length,
    completionPercent: session.tests.length ? Math.round((session.tests.filter(test => ["PASS", "WARNING", "FAIL"].includes(test.status)).length / session.tests.length) * 100) : 0
  };
  const calibrationEvidence = (options.devices || []).map(device => {
    const calibration = (options.calibrations || []).find(item => item.deviceId === device.id);
    const due = calibration?.dueAt || device.calibrationDueAt;
    const dueTime = due ? new Date(due).getTime() : NaN;
    const status = calibration?.result === "fail" ? "expired" : Number.isFinite(dueTime) && dueTime < Date.now() ? "expired" : Number.isFinite(dueTime) && dueTime < Date.now() + 30 * 86400000 ? "due-soon" : device.calibrationStatus || (due ? "valid" : "unknown");
    return { deviceId: device.id, deviceName: device.name, serialNumber: device.serialNumber, calibrationStatus: status, calibrationDue: due, certificateNumber: calibration?.certificateNumber };
  });
  const payload = { session, summary, calibrationEvidence };
  const integrityHash = hashReportPayload(payload);
  const findings = [
    ...(session.tests.length === 0 ? ["No test items are attached to this request."] : []),
    ...(summary.blockedTests > 0 ? [`${summary.blockedTests} test item(s) are blocked.`] : []),
    ...(summary.failedTests > 0 ? [`${summary.failedTests} test item(s) failed conformity.`] : []),
    ...(session.status !== "APPROVED" ? ["The report is informational until the laboratory request is approved."] : [])
  ];
  return {
    metadata: { reportId: `LAB-RPT-${session.requestNumber}-${integrityHash.slice(-8)}`, reportType: "laboratory-session", requestNumber: session.requestNumber, projectId: session.projectId, projectName: session.projectName, language, direction: language === "ar" ? "rtl" : "ltr", generatedAt, generatedBy: options.generatedBy || "SnoLab", status: session.status, reviewDecision: session.review, integrityHash, formats: ["pdf", "html", "json", "csv"] },
    summary,
    samples: session.samples,
    tests: session.tests.map(test => ({ id: test.id, sequence: test.sequence, testType: test.testType, title: { ar: test.testTitleAr, fr: test.testTitleFr, en: test.testTitleEn }, standard: test.standard, materialId: test.materialId, sampleId: test.sampleId, sampleCode: session.samples.find(sample => sample.id === test.sampleId)?.sampleCode, status: test.status, operator: test.operator, requiredReplicates: test.requiredReplicates, result: test.result, resultSummary: test.resultSummary, replicates: test.replicates, notes: test.notes })), calibrationEvidence, auditHistory: session.auditLog, findings
  };
}

function reportRows(report: LaboratorySessionReport): string[][] {
  const rows: string[][] = [];
  report.samples.forEach(sample => rows.push(["sample", sample.sampleNumber, sample.sampleCode, sample.materialName, sample.receivedAt || sample.collectedAt || "—"]));
  report.tests.forEach(test => rows.push(["test", `${test.sequence}. ${test.testType}`, test.sampleCode || test.sampleId, test.standard, test.status, value(test.resultSummary?.mean ?? test.result)]));
  report.calibrationEvidence.forEach(device => rows.push(["calibration", device.deviceName, device.serialNumber || "—", device.calibrationStatus, device.calibrationDue || "—", device.certificateNumber || "—"]));
  return rows;
}

export function laboratorySessionReportToCsv(report: LaboratorySessionReport): string {
  const headers = ["Section", "Reference", "Sample / Serial", "Standard / Status", "Date / State", "Result / Certificate"];
  const esc = (item: unknown) => `"${value(item).replace(/"/g, '""')}"`;
  return [headers, ...reportRows(report)].map(row => row.map(esc).join(",")).join("\n");
}

export function laboratorySessionReportToHtml(report: LaboratorySessionReport): string {
  const lang = report.metadata.language;
  const rtl = report.metadata.direction === "rtl";
  const l = labels[lang];
  const esc = (item: unknown) => value(item).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
  const tests = report.tests.map(test => `<tr><td>${test.sequence}. ${esc(test.title[lang])}</td><td>${esc(test.sampleCode || test.sampleId)}</td><td>${esc(test.standard)}</td><td>${esc(statusText(test.status, lang))}</td><td>${esc(value(test.resultSummary?.mean ?? test.result))}</td></tr>`).join("");
  const samples = report.samples.map(sample => `<tr><td>${esc(sample.sampleNumber)}</td><td>${esc(sample.sampleCode)}</td><td>${esc(sample.materialName)}</td><td>${esc(sample.receivedAt || sample.collectedAt || "—")}</td></tr>`).join("");
  const audit = report.auditHistory.map(entry => `<tr><td>${esc(entry.timestamp)}</td><td>${esc(entry.action)}</td><td>${esc(entry.actor)}</td><td>${esc(entry.entityType)}</td></tr>`).join("");
  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(l.title)} — ${esc(report.metadata.requestNumber)}</title><style>body{font-family:Arial,"Noto Sans Arabic",sans-serif;color:#172033;margin:32px;line-height:1.5}h1{color:#0f3b74;border-bottom:3px solid #f59e0b;padding-bottom:12px}h2{color:#0f3b74;margin-top:28px}table{border-collapse:collapse;width:100%;font-size:12px;margin:10px 0 20px}th{background:#0f3b74;color:white;text-align:start}td,th{border:1px solid #cbd5e1;padding:7px;vertical-align:top}tr:nth-child(even){background:#f8fafc}.meta{background:#f1f5f9;padding:12px;border-radius:8px}.finding{color:#991b1b;font-weight:700}</style></head><body><h1>${esc(l.title)}</h1><div class="meta"><b>${esc(l.request)}:</b> ${esc(report.metadata.requestNumber)}<br><b>${esc(l.project)}:</b> ${esc(report.metadata.projectName || "—")}<br><b>${esc(l.status)}:</b> ${esc(statusText(report.metadata.status, lang))}<br><b>${esc(l.generated)}:</b> ${esc(report.metadata.generatedAt)}<br><b>Integrity:</b> ${esc(report.metadata.integrityHash)}</div>${report.findings.map(f => `<p class="finding">${esc(f)}</p>`).join("")}<h2>${esc(l.samples)}</h2><table><thead><tr><th>Sample</th><th>Code</th><th>Material</th><th>Received</th></tr></thead><tbody>${samples || `<tr><td colspan="4">${esc(l.noData)}</td></tr>`}</tbody></table><h2>${esc(l.tests)}</h2><table><thead><tr><th>Test</th><th>${esc(l.sample)}</th><th>${esc(l.standard)}</th><th>Status</th><th>${esc(l.result)}</th></tr></thead><tbody>${tests || `<tr><td colspan="5">${esc(l.noData)}</td></tr>`}</tbody></table><h2>${esc(l.audit)}</h2><table><thead><tr><th>Timestamp</th><th>Action</th><th>Actor</th><th>Entity</th></tr></thead><tbody>${audit}</tbody></table></body></html>`;
}

function download(content: BlobPart, mime: string, fileName: string): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function downloadLaboratorySessionReport(report: LaboratorySessionReport, format: "json" | "csv" | "html"): void {
  const base = report.metadata.reportId;
  if (format === "json") download(JSON.stringify(report, null, 2), "application/json;charset=utf-8", `${base}.json`);
  if (format === "csv") download("\uFEFF" + laboratorySessionReportToCsv(report), "text/csv;charset=utf-8", `${base}.csv`);
  if (format === "html") download(laboratorySessionReportToHtml(report), "text/html;charset=utf-8", `${base}.html`);
}

export async function generateLaboratorySessionPdf(report: LaboratorySessionReport): Promise<jsPDF> {
  const lang = report.metadata.language;
  const rtl = report.metadata.direction === "rtl";
  const l = labels[lang];
  const doc = createPdfDocument();
  setPdfFont(doc, "normal");
  drawLaboratoryEmblemLogo(doc, PDF_PAGE_MARGINS.left, 10, 14);
  doc.setFontSize(13); doc.setTextColor(...PDF_COLORS.primary); setPdfFont(doc, "bold");
  drawPdfText(doc, l.title, rtl ? 196 : 32, 18, { direction: report.metadata.direction, align: rtl ? "right" : "left" });
  doc.setFontSize(7); setPdfFont(doc, "normal"); doc.setTextColor(...PDF_COLORS.textSecondary);
  drawPdfText(doc, `${l.request}: ${report.metadata.requestNumber} · ${l.status}: ${statusText(report.metadata.status, lang)}`, rtl ? 196 : 32, 24, { direction: report.metadata.direction, align: rtl ? "right" : "left" });
  let y = 34;
  const metaRows = [[l.request, report.metadata.requestNumber], [l.project, report.metadata.projectName || "—"], [l.status, statusText(report.metadata.status, lang)], [l.generated, report.metadata.generatedAt], ["Integrity", report.metadata.integrityHash]];
  autoTable(doc, { startY: y, head: preparePdfTableRows([["Field", "Value"]], report.metadata.direction), body: preparePdfTableRows(metaRows, report.metadata.direction), theme: "grid", styles: { font: "SnoArabic", fontSize: 8, cellPadding: 2, halign: rtl ? "right" : "left" }, headStyles: { fillColor: PDF_COLORS.primary }, margin: { left: PDF_PAGE_MARGINS.left, right: PDF_PAGE_MARGINS.right } });
  y = (doc as any).lastAutoTable.finalY + 7;
  const sampleRows = report.samples.map(sample => [sample.sampleNumber, sample.sampleCode, sample.materialName, sample.receivedAt || sample.collectedAt || "—"]);
  doc.setTextColor(...PDF_COLORS.primary); doc.setFontSize(10); setPdfFont(doc, "bold"); drawPdfText(doc, l.samples, rtl ? 196 : 14, y, { direction: report.metadata.direction, align: rtl ? "right" : "left" }); y += 3;
  autoTable(doc, { startY: y, head: preparePdfTableRows([["Sample", "Code", "Material", "Received"]], report.metadata.direction), body: preparePdfTableRows(sampleRows.length ? sampleRows : [[l.noData, "—", "—", "—"]], report.metadata.direction), theme: "grid", styles: { font: "SnoArabic", fontSize: 7.5, cellPadding: 2, halign: rtl ? "right" : "left" }, headStyles: { fillColor: PDF_COLORS.secondary }, margin: { left: PDF_PAGE_MARGINS.left, right: PDF_PAGE_MARGINS.right } });
  y = (doc as any).lastAutoTable.finalY + 7;
  if (y > 240) { doc.addPage(); y = 32; }
  doc.setFontSize(10); setPdfFont(doc, "bold"); drawPdfText(doc, l.tests, rtl ? 196 : 14, y, { direction: report.metadata.direction, align: rtl ? "right" : "left" }); y += 3;
  const testRows = report.tests.map(test => [`${test.sequence}. ${test.title[lang]}`, test.sampleCode || test.sampleId, test.standard, statusText(test.status, lang), value(test.resultSummary?.mean ?? test.result)]);
  autoTable(doc, { startY: y, head: preparePdfTableRows([["Test", "Sample", "Standard", "Status", "Result"]], report.metadata.direction), body: preparePdfTableRows(testRows.length ? testRows : [[l.noData, "—", "—", "—", "—"]], report.metadata.direction), theme: "grid", styles: { font: "SnoArabic", fontSize: 7.2, cellPadding: 2, halign: rtl ? "right" : "left" }, headStyles: { fillColor: PDF_COLORS.secondary }, margin: { left: PDF_PAGE_MARGINS.left, right: PDF_PAGE_MARGINS.right } });
  y = (doc as any).lastAutoTable.finalY + 7;
  if (y > 245) { doc.addPage(); y = 32; }
  doc.setFontSize(10); setPdfFont(doc, "bold"); drawPdfText(doc, l.audit, rtl ? 196 : 14, y, { direction: report.metadata.direction, align: rtl ? "right" : "left" }); y += 3;
  const auditRows = report.auditHistory.slice(-30).map(entry => [entry.timestamp, entry.action, entry.actor, entry.entityType]);
  autoTable(doc, { startY: y, head: preparePdfTableRows([["Timestamp", "Action", "Actor", "Entity"]], report.metadata.direction), body: preparePdfTableRows(auditRows.length ? auditRows : [[l.noData, "—", "—", "—"]], report.metadata.direction), theme: "grid", styles: { font: "SnoArabic", fontSize: 7.2, cellPadding: 2, halign: rtl ? "right" : "left" }, headStyles: { fillColor: PDF_COLORS.accentDark }, margin: { left: PDF_PAGE_MARGINS.left, right: PDF_PAGE_MARGINS.right } });
  return doc;
}

export async function downloadLaboratorySessionPdf(report: LaboratorySessionReport): Promise<void> {
  const doc = await generateLaboratorySessionPdf(report);
  doc.save(`${report.metadata.reportId}.pdf`);
}
