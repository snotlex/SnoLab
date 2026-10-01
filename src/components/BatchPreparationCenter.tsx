import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Droplet, FlaskConical, LockKeyhole, Scale, ShieldAlert } from "lucide-react";
import { EngineeringMaterial, MixDesignInput, MixDesignResult } from "../types";
import { applyMoistureCorrection } from "../engine/moistureCorrection";
import { getActiveMaterialBatch } from "../services/materialBatchService";

type Language = "ar" | "fr" | "en";

interface Props {
  input: MixDesignInput;
  result: MixDesignResult & Record<string, any>;
  materials: EngineeringMaterial[];
  language: Language;
  onNavigateToDesign: () => void;
  onSaveTrialMix: (record: { slump: number; freshDensity: number; concreteTemp: number; strength28d: number; notes: string; status: "PASSED" | "WARNING" | "FAILED" }) => void;
}

const copy = (language: Language, ar: string, fr: string, en: string) => language === "ar" ? ar : language === "fr" ? fr : en;
const n = (value: unknown, digits = 1) => typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";

export const BatchPreparationCenter: React.FC<Props> = ({ input, result, materials, language, onNavigateToDesign, onSaveTrialMix }) => {
  const [trial, setTrial] = useState({ slump: input.slump || 0, freshDensity: result.totalFreshDensity || 0, concreteTemp: 20, strength28d: 0, notes: "" });
  const isRtl = language === "ar";
  const selected = useMemo(() => {
    const find = (id?: string) => id ? materials.find(material => material.id === id) : undefined;
    const sand = find(input.selectedSandId);
    const gravel = find(input.selectedGravelId);
    return {
      cement: find(input.selectedCementId),
      sand,
      gravel,
      water: find(input.selectedWaterId),
      sandBatch: sand ? getActiveMaterialBatch(sand) : undefined,
      gravelBatch: gravel ? getActiveMaterialBatch(gravel) : undefined
    };
  }, [input, materials]);

  const correction = useMemo(() => applyMoistureCorrection({
    sandDryKg: result.sandWeightDry,
    gravelDryKg: result.gravelWeightDry,
    effectiveWaterKg: result.effectiveWater ?? result.waterContentActual,
    sandMoisturePercent: input.moistureSand,
    gravelMoisturePercent: input.moistureGravel,
    sandAbsorptionPercent: input.sandAbsorption,
    gravelAbsorptionPercent: input.gravelAbsorption
  }), [input, result]);

  const binder = result.totalBinder || result.cementWeight || 0;
  const totalBatchWater = correction.waterToAddKg + correction.totalFreeSurfaceWaterKg + (result.waterFromAdmixtures || 0);
  const actualWb = binder > 0 ? totalBatchWater / binder : undefined;
  const blocked = correction.rawWaterToAddKg < 0 || !selected.sandBatch || !selected.gravelBatch || [selected.sandBatch, selected.gravelBatch].some(batch => batch && !["مقبولة", "مقبولة بشروط"].includes(batch.status));
  const statusText = blocked
    ? copy(language, "محظور — لا يمكن إصدار تذكرة وزن", "Bloqué — ticket de pesée indisponible", "Blocked — batch ticket unavailable")
    : copy(language, "جاهز للمراجعة الفنية", "Prêt pour revue technique", "Ready for engineering review");
  const trialStatus: "PASSED" | "WARNING" | "FAILED" = trial.strength28d <= 0 ? "WARNING" : trial.strength28d >= Number(input.fck28 || 0) ? "PASSED" : "FAILED";

  const materialRows = [
    { label: copy(language, "الإسمنت", "Ciment", "Cement"), material: selected.cement, batch: undefined },
    { label: copy(language, "الرمل", "Sable", "Sand"), material: selected.sand, batch: selected.sandBatch },
    { label: copy(language, "الحصى", "Gravier", "Gravel"), material: selected.gravel, batch: selected.gravelBatch },
    { label: copy(language, "الماء", "Eau", "Water"), material: selected.water, batch: undefined }
  ];

  return <section dir={isRtl ? "rtl" : "ltr"} className="space-y-5" data-testid="batch-preparation-center">
    <header className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl dark:border-slate-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300"><ClipboardList size={15} /> {copy(language, "مركز تحضير الخلطة", "Centre de préparation", "Batch preparation center")}</div>
          <h1 className="text-2xl font-black">{copy(language, "تحضير دفعة قابلة للتتبع", "Préparation traçable de gâchée", "Traceable batch preparation")}</h1>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-300">{copy(language, "يعرض هذا المركز مصدر المادة والدفعة وتصحيح الرطوبة والماء الفعلي قبل السماح بإصدار كميات الوزن.", "Ce centre affiche les sources, les lots et la correction d'humidité avant toute pesée.", "This center exposes material sources, batch status and moisture correction before any weighing release.")}</p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 ${blocked ? "border-rose-400/40 bg-rose-500/10 text-rose-200" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"}`} role="status">
          <div className="flex items-center gap-2 text-sm font-black">{blocked ? <ShieldAlert size={17} /> : <CheckCircle2 size={17} />}{statusText}</div>
          <div className="mt-1 text-[10px] opacity-80">{copy(language, "الحساب لا يساوي اعتمادًا إنتاجيًا تلقائيًا", "Le calcul ne vaut pas une approbation de production", "Calculation is not production approval")}</div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
        {["الوصفة", "المواد والدفعات", "التحقق", "تصحيح الماء", "تذكرة الوزن"].map((step, index) => <div key={step} className={`rounded-xl border p-2.5 text-[10px] font-bold ${index < 4 ? "border-cyan-300/20 bg-white/10 text-cyan-100" : blocked ? "border-rose-300/30 bg-rose-500/10 text-rose-200" : "border-emerald-300/30 bg-emerald-500/10 text-emerald-200"}`}><span className="me-1 font-mono">0{index + 1}</span>{copy(language, step, ["Formule", "Lots", "Validation", "Eau", "Pesée"][index], ["Recipe", "Batches", "Validation", "Water", "Ticket"][index])}</div>)}
      </div>
    </header>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FlaskConical className="text-indigo-600" size={18} /><h2 className="text-sm font-black">{copy(language, "مصدر المواد والدفعات", "Sources des matériaux et lots", "Material and batch sources")}</h2></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{copy(language, "لقطة الحساب الحالية", "Snapshot actuel", "Current snapshot")}</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-xs"><thead className="border-b border-slate-200 text-[10px] text-slate-500 dark:border-slate-800"><tr><th className="p-2 text-start">{copy(language, "المكوّن", "Constituant", "Component")}</th><th className="p-2 text-start">{copy(language, "المادة", "Matériau", "Material")}</th><th className="p-2 text-start">{copy(language, "الدفعة", "Lot", "Batch")}</th><th className="p-2 text-start">{copy(language, "المصدر/الحالة", "Source/état", "Source/status")}</th></tr></thead><tbody>{materialRows.map(row => <tr key={row.label} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="p-2 font-bold">{row.label}</td><td className="p-2">{row.material?.name || "—"}</td><td className="p-2 font-mono">{row.batch?.batchNumber || "—"}</td><td className="p-2">{row.batch ? <span className={row.batch.status === "مقبولة" || row.batch.status === "مقبولة بشروط" ? "text-emerald-600" : "text-rose-600"}>{row.batch.status}</span> : <span className="text-amber-600">{copy(language, "مرجع مادة — لا توجد دفعة", "Référence — aucun lot", "Reference — no batch")}</span>}</td></tr>)}</tbody></table></div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-3 flex items-center gap-2"><Droplet className="text-cyan-600" size={18} /><h2 className="text-sm font-black">{copy(language, "ميزانية الماء وتصحيح الرطوبة", "Bilan d'eau et correction", "Water budget and moisture correction")}</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
            [copy(language, "ماء التصميم الفعال", "Eau efficace de conception", "Design effective water"), `${n(correction.effectiveWaterKg)} kg/m³`, "bg-blue-50 text-blue-700"],
            [copy(language, "الماء الحر من الركام", "Eau libre des granulats", "Aggregate free water"), `${n(correction.totalFreeSurfaceWaterKg)} kg/m³`, "bg-cyan-50 text-cyan-700"],
            [copy(language, "ماء الإضافة", "Eau à ajouter", "Water to add"), `${n(correction.waterToAddKg)} kg/m³`, "bg-indigo-50 text-indigo-700"],
            [copy(language, "W/B الفعلية", "W/B réelle", "Actual W/B"), n(actualWb, 3), "bg-amber-50 text-amber-700"]
          ].map(([label, value, className]) => <div key={label} className={`rounded-xl p-3 ${className}`}><div className="text-[10px] font-bold opacity-80">{label}</div><div className="mt-1 font-mono text-lg font-black">{value}</div></div>)}</div>
          {correction.rawWaterToAddKg < 0 && <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold leading-5 text-rose-800"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{copy(language, `حالة محظورة: الماء الحر من الركام (${n(correction.totalFreeSurfaceWaterKg)} kg/m³) يتجاوز ماء التصميم. يجب إعادة قياس الرطوبة أو تعديل الوصفة قبل إصدار تذكرة الوزن.`, `Bloqué: l'eau libre (${n(correction.totalFreeSurfaceWaterKg)} kg/m³) dépasse l'eau de conception.`, `Blocked: aggregate free water (${n(correction.totalFreeSurfaceWaterKg)} kg/m³) exceeds design water. Re-measure moisture or revise the mix before weighing.`)}</div>}
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-1 flex items-center gap-2"><FlaskConical className="text-emerald-600" size={18} /><h2 className="text-sm font-black">{copy(language, "تسجيل الخلطة التجريبية", "Enregistrer la gâchée d'essai", "Record trial mix")}</h2></div>
          <p className="mb-3 text-[10px] leading-5 text-slate-500">{copy(language, "يجب تسجيل قياسات فعلية قبل السماح بالاعتماد الإنتاجي. لا تُنشئ هذه الشاشة بيانات مخبرية تلقائية.", "Saisissez des mesures réelles; aucune donnée laboratoire n'est inventée.", "Enter measured values; this form never invents laboratory data.")}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {([["slump", copy(language, "الهطول mm", "Affaissement mm", "Slump mm"), trial.slump], ["freshDensity", copy(language, "الكثافة kg/m³", "Masse volumique kg/m³", "Fresh density kg/m³"), trial.freshDensity], ["concreteTemp", copy(language, "الحرارة °C", "Température °C", "Temperature °C"), trial.concreteTemp], ["strength28d", copy(language, "مقاومة 28 يوم MPa", "Résistance 28 j MPa", "28-day strength MPa"), trial.strength28d]] as const).map(([key, label, value]) => <label key={key} className="space-y-1"><span className="block text-[10px] font-bold text-slate-500">{label}</span><input type="number" step="any" value={value} onChange={event => setTrial(prev => ({ ...prev, [key]: Number(event.target.value) }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 font-mono outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label>)}
          </div>
          <label className="mt-2 block space-y-1 text-[10px] font-bold text-slate-500"><span>{copy(language, "ملاحظات الفاحص", "Notes du contrôleur", "Inspector notes")}</span><textarea value={trial.notes} onChange={event => setTrial(prev => ({ ...prev, notes: event.target.value }))} rows={2} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label>
          <div className={`mt-3 rounded-xl border p-2 text-[10px] font-black ${trialStatus === "PASSED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : trialStatus === "FAILED" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{trialStatus === "PASSED" ? copy(language, "ناجحة مبدئيًا حسب مقاومة 28 يوم", "Réussie selon la résistance à 28 jours", "Preliminarily passed by 28-day strength") : trialStatus === "FAILED" ? copy(language, "فاشلة — المقاومة أقل من الهدف", "Échec — résistance sous la cible", "Failed — strength below target") : copy(language, "بانتظار مقاومة 28 يوم الفعلية", "En attente de résistance réelle à 28 jours", "Waiting for measured 28-day strength")}</div>
          <button type="button" disabled={trial.strength28d <= 0 || blocked} onClick={() => onSaveTrialMix({ ...trial, status: trialStatus })} className="mt-3 w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-700">{copy(language, "حفظ سجل الخلطة التجريبية", "Enregistrer la gâchée", "Save trial mix record")}</button>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"><div className="mb-3 flex items-center gap-2"><Scale className="text-indigo-600" size={18} /><h2 className="text-sm font-black">{copy(language, "كميات 1 م³", "Quantités pour 1 m³", "Quantities per 1 m³")}</h2></div><div className="space-y-2 text-xs">{[["Cement", result.cementWeight], ["Sand wet", correction.sandWetKg], ["Gravel wet", correction.gravelWetKg], ["Water to add", correction.waterToAddKg]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800"><span className="text-slate-500">{label}</span><strong className="font-mono">{n(value)} kg</strong></div>)}</div><button type="button" onClick={onNavigateToDesign} className="mt-4 w-full rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-black text-white hover:bg-indigo-700">{copy(language, "العودة لتعديل التصميم", "Retour à la formulation", "Back to mix design")}</button></section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><div className="flex items-center gap-2 text-xs font-black"><LockKeyhole size={16} />{copy(language, "بوابة الإصدار", "Portail de libération", "Release gate")}</div><p className="mt-2 text-[11px] leading-5">{copy(language, "تذكرة الوزن لا تصدر من هذه الشاشة إلا بعد اجتياز بوابة التحقق واعتماد الدفعات ووجود خلطة تجريبية موثقة.", "Le ticket reste bloqué jusqu'à validation des lots et de la gâchée d'essai.", "The batch ticket remains blocked until batch validation and a documented trial mix are complete.")}</p></section>
      </aside>
    </div>
  </section>;
};
