import React from "react";
import { EngineeringMaterial } from "../types";

type Language = "ar" | "fr" | "en";

export const WaterSelectionCard: React.FC<{
  language: Language;
  materials: EngineeringMaterial[];
  selectedId?: string;
  materialOptionLabel: (material: EngineeringMaterial) => string;
  isUserMaterial: (material: EngineeringMaterial) => boolean;
  materialBadge: React.ReactNode;
  onSelect: (id: string) => void;
}> = ({ language, materials, selectedId, materialOptionLabel, isUserMaterial, materialBadge, onSelect }) => <div className="space-y-2.5 rounded border border-slate-200/40 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
  <div className="flex items-center gap-1 border-b border-slate-200/50 pb-1 text-xs font-black text-slate-800 dark:border-slate-800 dark:text-white"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /><span>{language === "ar" ? "معايرة مياه الخلط" : language === "fr" ? "Calibrage de l'eau" : "Water Calibration"}</span></div>
  <div><label className="mb-1 block text-[10px] text-slate-500">{language === "ar" ? "مياه الخلط المعتمدة في المستودع" : language === "fr" ? "Eaux approuvées du dépôt" : "Approved mixing water"}</label><select value={selectedId || ""} onChange={(event) => onSelect(event.target.value)} className="w-full cursor-pointer rounded border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">{language === "ar" ? "اختر مادة من المستودع (المعتمدة فقط)" : language === "fr" ? "Choisir une eau approuvée" : "Select approved water"}</option>{materials.map((material) => <option key={material.id} value={material.id} className={isUserMaterial(material) ? "font-semibold text-emerald-600" : "text-blue-600"}>{materialOptionLabel(material)}</option>)}</select>{materialBadge}</div>
  <p className="font-sans text-[9px] leading-normal text-slate-400">{language === "ar" ? "مياه خلط خرسانية معالجة ومطابقة لمعايير المتانة الكيميائية." : language === "fr" ? "Eau traitée conforme aux normes de durabilité chimique." : "Treated mixing water complying with chemical durability standards."}</p>
  {materials.length === 0 && <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">⚠️ {language === "ar" ? "لا توجد مياه مسجلة في المستودع." : "No water in repository."}</div>}
  {materials.length > 0 && !selectedId && <div className="mt-1.5 rounded border border-amber-500/15 bg-amber-500/5 p-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">⚠️ {language === "ar" ? "الرجاء اختيار مياه الخلط المعتمدة." : "Please select approved water."}</div>}
</div>;
