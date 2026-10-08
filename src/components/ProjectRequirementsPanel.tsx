import React, { useMemo } from "react";
import type { MixDesignInput } from "../types";
import type { ProjectMetadata } from "../services/storage/types";

type Language = "ar" | "fr" | "en";

interface ProjectRequirementsPanelProps {
  language: Language;
  metadata: ProjectMetadata | null;
  inputs: MixDesignInput;
  onMetadataChange: (patch: Partial<ProjectMetadata>) => void;
  onInputsChange: (patch: Partial<MixDesignInput>) => void;
  onContinue: () => void;
}

const copy = (language: Language) => ({
  ar: {
    title: "متطلبات المشروع",
    description: "ثبّت المتطلبات الهندسية قبل اختيار المواد وتشغيل الحساب. تُحفظ التعديلات داخل ملف المشروع.",
    project: "بيانات المشروع",
    design: "معايير التصميم",
    name: "اسم المشروع",
    client: "العميل",
    plant: "المصنع / الموقع",
    strength: "المقاومة المطلوبة بعد 28 يومًا (MPa)",
    slump: "الهبوط المستهدف (سم)",
    dmax: "القطر الأقصى للركام Dmax (مم)",
    cementClass: "رتبة الإسمنت (MPa)",
    concreteType: "نوع الخرسانة",
    method: "طريقة الحساب",
    complete: "المتطلبات مكتملة",
    incomplete: "أكمل الحقول المميزة قبل الانتقال",
    toMaterials: "الانتقال إلى المتطلبات والحساب",
    saved: "تُحفظ التعديلات تلقائيًا ضمن المشروع الحالي"
  },
  fr: {
    title: "Exigences du projet",
    description: "Fixez les exigences d’ingénierie avant de sélectionner les matériaux et de lancer le calcul. Les modifications sont enregistrées dans le projet.",
    project: "Données du projet",
    design: "Critères de formulation",
    name: "Nom du projet",
    client: "Client",
    plant: "Usine / site",
    strength: "Résistance à 28 jours (MPa)",
    slump: "Affaissement cible (cm)",
    dmax: "Dmax des granulats (mm)",
    cementClass: "Classe du ciment (MPa)",
    concreteType: "Type de béton",
    method: "Méthode de calcul",
    complete: "Exigences complètes",
    incomplete: "Complétez les champs signalés avant de continuer",
    toMaterials: "Passer aux exigences et au calcul",
    saved: "Les modifications sont enregistrées automatiquement dans le projet"
  },
  en: {
    title: "Project Requirements",
    description: "Lock the engineering requirements before selecting materials and running the calculation. Changes are saved in the project file.",
    project: "Project details",
    design: "Design criteria",
    name: "Project name",
    client: "Client",
    plant: "Plant / site",
    strength: "28-day target strength (MPa)",
    slump: "Target slump (cm)",
    dmax: "Maximum aggregate size Dmax (mm)",
    cementClass: "Cement strength class (MPa)",
    concreteType: "Concrete type",
    method: "Calculation method",
    complete: "Requirements complete",
    incomplete: "Complete the highlighted fields before continuing",
    toMaterials: "Continue to requirements and mix calculation",
    saved: "Changes are saved automatically in the current project"
  }
}[language]);

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-950";

export const ProjectRequirementsPanel: React.FC<ProjectRequirementsPanelProps> = ({ language, metadata, inputs, onMetadataChange, onInputsChange, onContinue }) => {
  const t = copy(language);
  const requiredFields = useMemo(() => ({
    name: Boolean(metadata?.name?.trim()),
    client: Boolean(metadata?.client?.trim()),
    plant: Boolean(metadata?.plant?.trim()),
    strength: Number.isFinite(inputs.fck28) && inputs.fck28 > 0,
    slump: Number.isFinite(inputs.slump) && inputs.slump > 0,
    dmax: Number.isFinite(inputs.dMax) && inputs.dMax > 0,
    cementClass: Number.isFinite(inputs.cementClassStrength) && inputs.cementClassStrength > 0,
    concreteType: Boolean(inputs.concreteType),
    method: Boolean(inputs.selectedMethod)
  }), [metadata, inputs]);
  const complete = Object.values(requiredFields).every(Boolean);
  const fieldState = (valid: boolean) => valid ? "border-slate-200 dark:border-slate-700" : "border-rose-400 bg-rose-50/40 dark:border-rose-700 dark:bg-rose-950/20";

  return (
    <section id="project-requirements-panel" className="sno-card mx-auto max-w-5xl space-y-6 rounded-3xl p-5 text-right md:p-8" dir={language === "ar" ? "rtl" : "ltr"} aria-labelledby="project-requirements-title">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
        <div><h2 id="project-requirements-title" className="text-xl font-black text-slate-900 dark:text-white">{t.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{t.description}</p></div>
        <div role="status" aria-live="polite" className={`rounded-2xl border px-4 py-3 text-xs font-black ${complete ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"}`}>{complete ? `✓ ${t.complete}` : `! ${t.incomplete}`}</div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <fieldset className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><legend className="px-2 text-sm font-black text-slate-700 dark:text-slate-200">{t.project}</legend><div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.name}<input aria-label={t.name} value={metadata?.name || ""} onChange={e => onMetadataChange({ name: e.target.value })} className={`${inputClass} ${fieldState(requiredFields.name)}`} /></label>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.client}<input aria-label={t.client} value={metadata?.client || ""} onChange={e => onMetadataChange({ client: e.target.value })} className={`${inputClass} ${fieldState(requiredFields.client)}`} /></label>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">{t.plant}<input aria-label={t.plant} value={metadata?.plant || ""} onChange={e => onMetadataChange({ plant: e.target.value })} className={`${inputClass} ${fieldState(requiredFields.plant)}`} /></label>
        </div></fieldset>

        <fieldset className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><legend className="px-2 text-sm font-black text-slate-700 dark:text-slate-200">{t.design}</legend><div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.strength}<input aria-label={t.strength} type="number" min="1" value={inputs.fck28 ?? ""} onChange={e => onInputsChange({ fck28: Number(e.target.value) })} className={`${inputClass} ${fieldState(requiredFields.strength)}`} /></label>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.slump}<input aria-label={t.slump} type="number" min="0.1" value={inputs.slump ?? ""} onChange={e => onInputsChange({ slump: Number(e.target.value) })} className={`${inputClass} ${fieldState(requiredFields.slump)}`} /></label>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.dmax}<input aria-label={t.dmax} type="number" min="1" value={inputs.dMax ?? ""} onChange={e => onInputsChange({ dMax: Number(e.target.value) })} className={`${inputClass} ${fieldState(requiredFields.dmax)}`} /></label>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.cementClass}<input aria-label={t.cementClass} type="number" min="1" value={inputs.cementClassStrength ?? ""} onChange={e => onInputsChange({ cementClassStrength: Number(e.target.value) })} className={`${inputClass} ${fieldState(requiredFields.cementClass)}`} /></label>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.concreteType}<select aria-label={t.concreteType} value={inputs.concreteType || ""} onChange={e => onInputsChange({ concreteType: e.target.value })} className={`${inputClass} ${fieldState(requiredFields.concreteType)}`}><option value="">—</option><option value="NSC">NSC</option><option value="HSC">HSC</option><option value="HPC">HPC</option><option value="SCC">SCC</option><option value="FRC">FRC</option><option value="RCC">RCC</option></select></label>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.method}<input aria-label={t.method} value={inputs.selectedMethod || "dreux"} readOnly className={`${inputClass} cursor-not-allowed opacity-75`} /></label>
        </div></fieldset>
      </div>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row"><p className="text-xs text-slate-500 dark:text-slate-400">{t.saved}</p><button type="button" onClick={onContinue} disabled={!complete} className="rounded-xl bg-[#C7F43A] px-5 py-3 text-xs font-black text-[#0A0F15] shadow transition hover:bg-[#d7ff63] disabled:cursor-not-allowed disabled:opacity-40">{t.toMaterials}</button></footer>
    </section>
  );
};
