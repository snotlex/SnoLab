import React from "react";
import { AggregateQuality, AggregateType, EngineeringMaterial } from "../types";

type Language = "ar" | "fr" | "en";

export const GravelSelectionCard: React.FC<{
  language: Language;
  translate: (key: string) => string;
  materials: EngineeringMaterial[];
  selectedId?: string;
  aggregateType: AggregateType;
  aggregateQuality: AggregateQuality;
  materialOptionLabel: (material: EngineeringMaterial) => string;
  isUserMaterial: (material: EngineeringMaterial) => boolean;
  materialBadge: React.ReactNode;
  onSelect: (id: string) => void;
}> = ({ language, translate, materials, selectedId, aggregateType, aggregateQuality, materialOptionLabel, isUserMaterial, materialBadge, onSelect }) => <div className="space-y-2.5 rounded border border-slate-200/40 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
  <div className="flex items-center gap-1 border-b border-slate-200/50 pb-1 text-xs font-black text-slate-800 dark:border-slate-800 dark:text-white"><span className="h-1.5 w-1.5 rounded-full bg-slate-500" /><span>{translate("gravel_calibration")}</span></div>
  <div><label className="mb-1 block text-[10px] text-slate-500">{translate("gravel_types_available")}</label><select aria-label={language === "ar" ? "اختيار الركام الخشن" : language === "fr" ? "Choisir le gravier" : "Select coarse aggregate"} value={selectedId || ""} onChange={(event) => onSelect(event.target.value)} className="w-full cursor-pointer rounded border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">{language === "ar" ? "اختر مادة من المستودع (المعتمدة فقط)" : language === "fr" ? "Choisir un gravier approuvé" : "Select approved gravel"}</option>{materials.map((material) => <option key={material.id} value={material.id} className={isUserMaterial(material) ? "font-semibold text-emerald-600" : "text-blue-600"}>{materialOptionLabel(material)}</option>)}</select>{materialBadge}</div>
  <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200/50 bg-slate-100/50 p-2 dark:border-slate-800/60 dark:bg-slate-800/40"><div><span className="mb-0.5 block text-[9px] text-slate-500 dark:text-slate-400">{translate("grain_shape")}</span><div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-slate-500" /><span>{aggregateType === AggregateType.CONCASSE ? (language === "ar" ? "مكسر / زاوي (آلي)" : "Crushed / Angular (Auto)") : (language === "ar" ? "مستدير (آلي)" : "Rounded (Auto)")}</span></div></div><div><span className="mb-0.5 block text-[9px] text-slate-500 dark:text-slate-400">{translate("grading_quality")}</span><div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-slate-500" /><span>{aggregateQuality === AggregateQuality.EXCELLENT ? (language === "ar" ? "ممتاز (آلي)" : "Excellent (Auto)") : aggregateQuality === AggregateQuality.POOR ? (language === "ar" ? "ضعيف (آلي)" : "Poor (Auto)") : (language === "ar" ? "عادي / قياسي (آلي)" : "Standard (Auto)")}</span></div></div></div>
  {materials.length === 0 && <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">⚠️ {language === "ar" ? "لا توجد مواد حصى مسجلة في المستودع." : "No gravel materials in repository."}</div>}
  {materials.length > 0 && !selectedId && <div className="mt-1.5 rounded border border-amber-500/15 bg-amber-500/5 p-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">⚠️ {language === "ar" ? "الرجاء اختيار الحصى المعتمد من القائمة." : "Please select approved gravel."}</div>}
</div>;
