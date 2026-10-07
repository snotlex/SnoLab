import React, { useState } from "react";
import { CheckCircle2, FileCheck2, ShieldAlert } from "lucide-react";
import type { AIEvidence, AIGovernanceMetadata } from "../services/aiGovernance";
import { verifyAIDraft } from "../services/aiGovernance";

interface AIEvidenceReviewPanelProps {
  metadata?: AIGovernanceMetadata;
  suggestions?: Record<string, unknown>;
  language?: "ar" | "en";
  onVerified: (metadata: AIGovernanceMetadata) => void;
  onApplyVerifiedSuggestions?: () => void;
}

const labels = {
  ar: {
    title: "مراجعة مسودة AI والأدلة",
    draft: "AI Draft — يتطلب مراجعة",
    verified: "تم التحقق من المخرج والأدلة",
    note: "لا تصبح القيم الهندسية قابلة للاستخدام إلا بعد دليل ومراجع محدد. هذا الإجراء لا يعتمد المادة تلقائيًا.",
    reviewer: "اسم المراجع",
    reference: "مرجع الدليل",
    description: "وصف الدليل",
    type: "نوع الدليل",
    lab: "تقرير مختبر",
    supplier: "وثيقة مورد",
    attestation: "إقرار مستخدم",
    other: "دليل آخر",
    verify: "تحقق من المخرج والأدلة",
    apply: "تطبيق القيم الموثقة على النموذج",
    applied: "يمكن الآن تطبيق القيم بقرار صريح",
    error: "تعذر التحقق: يجب إدخال مراجع ومراجع بشري.",
  },
  en: {
    title: "AI Draft & Evidence Review",
    draft: "AI Draft — review required",
    verified: "Output and evidence verified",
    note: "Engineering values remain unusable until evidence and a named reviewer are recorded. This does not approve the material automatically.",
    reviewer: "Reviewer",
    reference: "Evidence reference",
    description: "Evidence description",
    type: "Evidence type",
    lab: "Laboratory report",
    supplier: "Supplier document",
    attestation: "User attestation",
    other: "Other evidence",
    verify: "Verify output and evidence",
    apply: "Apply verified values to form",
    applied: "Values may now be applied explicitly",
    error: "Cannot verify: a reviewer and evidence reference are required.",
  },
};

export const AIEvidenceReviewPanel: React.FC<AIEvidenceReviewPanelProps> = ({
  metadata,
  suggestions = {},
  language = "ar",
  onVerified,
  onApplyVerifiedSuggestions,
}) => {
  const t = labels[language];
  const [reviewer, setReviewer] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AIEvidence["type"]>("laboratory_report");
  const [error, setError] = useState("");

  if (!metadata) return null;
  const verified = metadata.status === "USER_VERIFIED" && metadata.reviewRequired === false;
  const suggestionCount = Object.keys(suggestions).length;

  const handleVerify = () => {
    try {
      const next = verifyAIDraft({
        draft: metadata,
        reviewer,
        evidence: [{ type, reference, description: description.trim() || undefined }],
      });
      setError("");
      onVerified(next);
    } catch {
      setError(t.error);
    }
  };

  return (
    <section className="rounded-xl border border-amber-300/70 bg-amber-50/70 p-3 text-right dark:border-amber-900/60 dark:bg-amber-950/20" data-testid="ai-evidence-review-panel">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-1 text-[9px] font-black ${verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {verified ? t.verified : t.draft}
        </span>
        <h5 className="flex items-center gap-1.5 text-[11px] font-black text-amber-800 dark:text-amber-300">
          {verified ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
          {t.title}
        </h5>
      </div>
      <p className="mt-2 text-[9px] leading-relaxed text-slate-600 dark:text-slate-300">{t.note}</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input aria-label={t.reviewer} value={reviewer} onChange={event => setReviewer(event.target.value)} placeholder={t.reviewer} disabled={verified} className="rounded-lg border border-amber-200 bg-white p-1.5 text-[10px] dark:border-amber-900 dark:bg-slate-950" />
        <select aria-label={t.type} value={type} onChange={event => setType(event.target.value as AIEvidence["type"])} disabled={verified} className="rounded-lg border border-amber-200 bg-white p-1.5 text-[10px] dark:border-amber-900 dark:bg-slate-950">
          <option value="laboratory_report">{t.lab}</option>
          <option value="supplier_document">{t.supplier}</option>
          <option value="user_attestation">{t.attestation}</option>
          <option value="other">{t.other}</option>
        </select>
        <input aria-label={t.reference} value={reference} onChange={event => setReference(event.target.value)} placeholder={t.reference} disabled={verified} className="rounded-lg border border-amber-200 bg-white p-1.5 text-[10px] dark:border-amber-900 dark:bg-slate-950" />
        <input aria-label={t.description} value={description} onChange={event => setDescription(event.target.value)} placeholder={t.description} disabled={verified} className="rounded-lg border border-amber-200 bg-white p-1.5 text-[10px] dark:border-amber-900 dark:bg-slate-950" />
      </div>
      {!verified ? (
        <button type="button" onClick={handleVerify} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-[10px] font-black text-white hover:bg-amber-700">
          <FileCheck2 size={13} /> {t.verify}
        </button>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-[9px] font-bold text-emerald-700">{t.applied} {suggestionCount ? `(${suggestionCount})` : ""}</p>
          {suggestionCount > 0 && onApplyVerifiedSuggestions && <button type="button" onClick={onApplyVerifiedSuggestions} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white hover:bg-emerald-700">{t.apply}</button>}
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-[9px] font-bold text-rose-600">{error}</p>}
    </section>
  );
};
