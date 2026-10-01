import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardPenLine, FilePlus2, LockKeyhole, Save, ShieldAlert } from "lucide-react";

export type MixLifecycleStatus = "draft" | "needs-review" | "approved";

interface MixLifecyclePanelProps {
  language: "ar" | "fr" | "en";
  status: MixLifecycleStatus;
  criticalCount: number;
  warningCount: number;
  calculationReady: boolean;
  onSaveDraft: (name: string) => void;
  onSaveCopy: (name: string) => void;
  onApprove: () => void;
}

const labels = {
  ar: {
    title: "حالة الخلطة ودورة الاعتماد",
    description: "الحفظ كمسودة لا يحتاج اكتمال الحساب. الاعتماد منفصل ولا يُتاح عند وجود خطأ حرج.",
    name: "اسم الخلطة أو النسخة",
    placeholder: "مثال: خلطة أساسات C30 – v1",
    draft: "مسودة",
    review: "يحتاج مراجعة هندسية",
    approved: "معتمدة",
    saveDraft: "حفظ كمسودة",
    saveCopy: "حفظ كنسخة جديدة",
    approve: "اعتماد الخلطة",
    blocked: "الاعتماد محظور حتى تصحيح الأخطاء الحرجة",
    warnings: "تحذيرات هندسية تمنع الاعتماد النهائي حتى المراجعة",
    ready: "اجتازت الخلطة بوابة التحقق ويمكن اعتمادها",
    critical: "أخطاء حرجة",
    warning: "تحذيرات"
  },
  fr: {
    title: "Cycle de vie et approbation du mélange",
    description: "L'enregistrement comme brouillon reste possible. L'approbation est séparée et bloquée par une erreur critique.",
    name: "Nom du mélange ou de la version",
    placeholder: "Ex. Fondation C30 – v1",
    draft: "Brouillon",
    review: "Revue d'ingénierie requise",
    approved: "Approuvé",
    saveDraft: "Enregistrer le brouillon",
    saveCopy: "Enregistrer une nouvelle version",
    approve: "Approuver le mélange",
    blocked: "Approbation bloquée jusqu'à correction des erreurs critiques",
    warnings: "Des avertissements exigent une revue avant approbation",
    ready: "Le mélange a passé la porte de validation",
    critical: "erreurs critiques",
    warning: "avertissements"
  },
  en: {
    title: "Mix lifecycle and approval",
    description: "Saving a draft does not require a complete calculation. Approval is separate and blocked by critical errors.",
    name: "Mix or version name",
    placeholder: "Example: Foundation C30 – v1",
    draft: "Draft",
    review: "Needs engineering review",
    approved: "Approved",
    saveDraft: "Save as draft",
    saveCopy: "Save as new version",
    approve: "Approve mix",
    blocked: "Approval is blocked until critical errors are corrected",
    warnings: "Engineering warnings require review before approval",
    ready: "The mix passed the validation gate",
    critical: "critical errors",
    warning: "warnings"
  }
} as const;

export const MixLifecyclePanel: React.FC<MixLifecyclePanelProps> = ({
  language,
  status,
  criticalCount,
  warningCount,
  calculationReady,
  onSaveDraft,
  onSaveCopy,
  onApprove
}) => {
  const [name, setName] = useState("");
  const t = labels[language];
  const statusLabel = status === "approved" ? t.approved : status === "needs-review" ? t.review : t.draft;
  const statusClass = status === "approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : status === "needs-review" ? "bg-amber-500/10 text-amber-700 border-amber-500/20" : "bg-slate-500/10 text-slate-600 border-slate-500/20";
  const save = (callback: (value: string) => void) => {
    const value = name.trim();
    if (!value) return;
    callback(value);
    setName("");
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm" aria-label={t.title}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <ClipboardPenLine size={17} className="text-blue-500" />
            <h3 className="text-sm font-black">{t.title}</h3>
          </div>
          <p className="text-[11px] text-slate-500 max-w-2xl leading-relaxed">{t.description}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black whitespace-nowrap ${statusClass}`}>
          {status === "approved" ? <CheckCircle2 size={13} /> : status === "needs-review" ? <AlertTriangle size={13} /> : <FilePlus2 size={13} />}
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
        <div className={`rounded-xl border p-2.5 ${criticalCount ? "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300" : "border-slate-200 dark:border-slate-800 text-slate-500"}`}>
          <div className="flex items-center gap-1.5 font-bold"><ShieldAlert size={13} />{criticalCount} {t.critical}</div>
        </div>
        <div className={`rounded-xl border p-2.5 ${warningCount ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300" : "border-slate-200 dark:border-slate-800 text-slate-500"}`}>
          <div className="flex items-center gap-1.5 font-bold"><AlertTriangle size={13} />{warningCount} {t.warning}</div>
        </div>
        <div className={`rounded-xl border p-2.5 ${calculationReady ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300" : "border-slate-200 dark:border-slate-800 text-slate-500"}`}>
          <div className="flex items-center gap-1.5 font-bold"><CheckCircle2 size={13} />{calculationReady ? t.ready : t.blocked}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row gap-2">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.placeholder} aria-label={t.name} className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-blue-500" />
        <button type="button" onClick={() => save(onSaveDraft)} disabled={!name.trim()} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-black text-slate-700 dark:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"><Save size={14} />{t.saveDraft}</button>
        <button type="button" onClick={() => save(onSaveCopy)} disabled={!name.trim()} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-700 dark:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-500/20"><FilePlus2 size={14} />{t.saveCopy}</button>
        <button type="button" onClick={onApprove} disabled={!calculationReady || criticalCount > 0 || warningCount > 0} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-700"><LockKeyhole size={14} />{t.approve}</button>
      </div>
    </section>
  );
};
