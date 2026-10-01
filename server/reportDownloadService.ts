import crypto from "crypto";

export interface StoredReport { input: any; result: any; activeProject?: any; materialsDatabase?: any[]; language: "ar" | "fr" | "en"; reportId: string; revisionId: string; reportReference: string; status: string; inputHash: string; createdAt: string; }
const reports = new Map<string, StoredReport>();
let runtimeSecret: string | undefined;
function getSecret() { return runtimeSecret || (runtimeSecret = process.env.REPORT_DOWNLOAD_SECRET || process.env.ADMIN_API_TOKEN || crypto.randomBytes(32).toString("hex")); }
const ttlMs = Math.max(60 * 60_000, Number(process.env.REPORT_DOWNLOAD_TTL_MS || 7 * 24 * 60 * 60_000));
function b64(value: string) { return Buffer.from(value).toString("base64url"); }
function hash(value: unknown) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
export function createReportToken(report: StoredReport) { const issuedAt = Date.now(); const payload = { reportId: report.reportId, revisionId: report.revisionId, language: report.language, reportVersion: "1", issuedAt, expiresAt: issuedAt + ttlMs, inputHash: report.inputHash }; const body = b64(JSON.stringify(payload)); const signature = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url"); return { token: `${body}.${signature}`, issuedAt: new Date(issuedAt).toISOString(), expiresAt: new Date(issuedAt + ttlMs).toISOString() }; }
export function verifyReportToken(token: string) { try { const [body, signature] = token.split("."); if (!body || !signature) return null; const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url"); if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); if (!payload.expiresAt || payload.expiresAt <= Date.now()) return null; const report = reports.get(payload.reportId); if (!report || report.revisionId !== payload.revisionId || report.inputHash !== payload.inputHash) return null; return { payload, report }; } catch { return null; } }
export function storeReport(input: Omit<StoredReport, "inputHash" | "createdAt">) { const report = { ...input, inputHash: hash({ input: input.input, result: input.result, activeProject: input.activeProject, materialsDatabase: input.materialsDatabase, revisionId: input.revisionId }), createdAt: new Date().toISOString() }; reports.set(report.reportId, report); return report; }
export function reportCount() { return reports.size; }
