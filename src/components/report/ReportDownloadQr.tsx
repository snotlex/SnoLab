import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Download, Link2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { MixDesignInput, MixDesignResult } from "../../types";
import { createReportDownloadToken, ReportDownloadMetadata } from "../../services/reportDownloadService";

interface Props {
  input: MixDesignInput;
  result: MixDesignResult;
  activeProject?: any;
  materialsDatabase?: unknown[];
  language: "ar" | "fr" | "en";
}

const labels = {
  ar: { title: "تحميل تقرير الخلطة على الهاتف", desc: "امسح رمز QR بكاميرا الهاتف لتنزيل النسخة الحالية من تقرير الخلطة بصيغة PDF.", direct: "تنزيل PDF مباشرة", copy: "نسخ رابط التقرير", copied: "تم نسخ الرابط", local: "يتطلب تنزيل التقرير من الهاتف رابط HTTPS متاحاً عبر الإنترنت.", ref: "مرجع التقرير", revision: "الإصدار", expires: "صلاحية الرابط حتى", preliminary: "هذا التقرير تصميم أولي ويتطلب مراجعة هندسية وخلطة تجريبية قبل التنفيذ.", failed: "تعذر إنشاء QR حالياً. استخدم تنزيل PDF على الجهاز الحالي.", loading: "جارٍ تجهيز رابط التقرير...", status: "حالة التقرير" },
  en: { title: "Download mix report on phone", desc: "Scan this QR code with your phone camera to download the current mix report as a PDF.", direct: "Download PDF directly", copy: "Copy report link", copied: "Link copied", local: "Phone download requires a publicly reachable HTTPS report link.", ref: "Report reference", revision: "Revision", expires: "Link expires", preliminary: "This is a preliminary design and requires engineering review and a trial mix before execution.", failed: "QR generation failed. Use the local PDF download instead.", loading: "Preparing secure report link...", status: "Report status" },
  fr: { title: "Télécharger le rapport sur téléphone", desc: "Scannez ce QR avec la caméra du téléphone pour télécharger le rapport PDF actuel.", direct: "Télécharger le PDF", copy: "Copier le lien", copied: "Lien copié", local: "Le téléchargement mobile exige un lien HTTPS public.", ref: "Référence", revision: "Révision", expires: "Lien valable jusqu’au", preliminary: "Cette étude préliminaire exige une revue et une gâchée d’essai avant exécution.", failed: "Échec du QR. Utilisez le téléchargement PDF local.", loading: "Préparation du lien sécurisé...", status: "État du rapport" }
};

function digestSeed(input: MixDesignInput, result: MixDesignResult, project: any): string {
  return JSON.stringify({ input, result, project, revision: project?.mixId || project?.id || "current" });
}

export const ReportDownloadQr: React.FC<Props> = ({ input, result, activeProject, materialsDatabase, language }) => {
  const t = labels[language];
  const [metadata, setMetadata] = useState<ReportDownloadMetadata | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fingerprint = useMemo(() => digestSeed(input, result, activeProject), [input, result, activeProject]);
  const reportId = String(activeProject?.mixId || activeProject?.id || `MIX-${input.fck28 || "NA"}`);
  const revisionId = String(activeProject?.revisionNumber || activeProject?.mixVersions?.length || "1");
  const status = String(activeProject?.mixLifecycleStatus || "draft");

  useEffect(() => {
    let cancelled = false;
    setMetadata(null); setQrDataUrl(""); setError("");
    const protocolAvailable = typeof window !== "undefined" && window.location.protocol === "https:" && !/localhost|127\.0\.0\.1/i.test(window.location.hostname);
    if (!protocolAvailable) { setError("LOCAL_FIRST"); return; }
    createReportDownloadToken({ input, result, activeProject, materialsDatabase, language, reportId, revisionId, reportReference: `SNO-${reportId}-${revisionId}`, status })
      .then(async (next) => { if (cancelled) return; setMetadata(next); setQrDataUrl(await QRCode.toDataURL(next.downloadUrl, { width: 280, margin: 3, errorCorrectionLevel: "H", color: { dark: "#0f172a", light: "#ffffff" } })); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : t.failed); });
    return () => { cancelled = true; };
  }, [fingerprint, language]);

  const isAr = language === "ar";
  return <section data-testid="report-download-qr" dir={isAr ? "rtl" : "ltr"} className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5 shadow-sm" aria-label={t.title}>
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1 text-right">
        <div className="mb-2 flex items-center gap-2 text-indigo-700"><ShieldCheck size={18} /><h3 className="text-sm font-black">{t.title}</h3></div>
        <p className="text-xs leading-6 text-slate-600">{t.desc}</p>
        {metadata && <div className="mt-3 grid grid-cols-1 gap-1 text-[10px] font-mono text-slate-600 sm:grid-cols-2"><span>{t.ref}: <b>{metadata.reportReference}</b></span><span>{t.revision}: <b>{revisionId}</b></span><span>{t.expires}: <b>{new Date(metadata.expiresAt).toLocaleString()}</b></span><span>{t.status}: <b>{status}</b></span></div>}
        {status !== "approved" && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px] font-bold leading-5 text-amber-800">{t.preliminary}</p>}
        {error === "LOCAL_FIRST" && <p className="mt-3 rounded-lg border border-slate-200 bg-white p-2 text-[10px] font-bold text-slate-600">{t.local}</p>}
        {error && error !== "LOCAL_FIRST" && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{t.failed} {error}</p>}
        <div className="mt-4 flex flex-wrap gap-2"><a href={metadata?.downloadUrl || undefined} aria-disabled={!metadata} onClick={(e) => !metadata && e.preventDefault()} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-indigo-700 aria-disabled:pointer-events-none aria-disabled:opacity-50"><Download size={14} />{t.direct}</a>{metadata && <button type="button" onClick={() => { navigator.clipboard?.writeText(metadata.downloadUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-50"><Link2 size={14} />{copied ? t.copied : t.copy}</button>}{error && error !== "LOCAL_FIRST" && <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"><RefreshCw size={14} />{language === "ar" ? "إعادة المحاولة" : "Retry"}</button>}</div>
      </div>
      <div data-testid="report-download-qr-preview" className="flex min-h-[190px] min-w-[190px] flex-col items-center justify-center rounded-xl border border-white bg-white p-3 shadow-sm">{qrDataUrl ? <img data-testid="report-download-qr-image" src={qrDataUrl} width={170} height={170} alt={`${t.title} — ${metadata?.reportReference || ""}`} /> : error ? <div className="p-5 text-center text-[10px] font-bold text-slate-400">{error === "LOCAL_FIRST" ? "HTTPS" : "QR"}</div> : <><Loader2 className="animate-spin text-indigo-500" size={28} /><span className="mt-2 text-[10px] font-bold text-slate-500">{t.loading}</span></>}<span className="mt-1 text-[9px] font-mono font-bold tracking-widest text-slate-400">SCAN • PDF</span></div>
    </div>
  </section>;
};
