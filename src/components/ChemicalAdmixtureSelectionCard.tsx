import React from "react";
import { EngineeringMaterial } from "../types";

type Language = "ar" | "fr" | "en";

export const ChemicalAdmixtureSelectionCard: React.FC<{
  language: Language;
  materials: EngineeringMaterial[];
  selectedId?: string;
  materialOptionLabel: (material: EngineeringMaterial) => string;
  isUserMaterial: (material: EngineeringMaterial) => boolean;
  materialBadge: React.ReactNode;
  onSelect: (id: string) => void;
}> = ({ language, materials, selectedId, materialOptionLabel, isUserMaterial, materialBadge, onSelect }) => <div className="space-y-2.5 rounded border border-slate-200/40 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
  <div className="flex items-center gap-1 border-b border-slate-200/50 pb-1 text-xs font-black text-slate-800 dark:border-slate-800 dark:text-white"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /><span>{language === "ar" ? "المضافات الكيميائية:" : language === "fr" ? "Adjuvants chimiques :" : "Chemical Admixtures:"}</span></div>
  <div><label className="mb-1 block text-[10px] text-slate-500">{language === "ar" ? "المضافات المعتمدة في المستودع" : language === "fr" ? "Adjuvants approuvés" : "Approved Admixtures"}</label><select value={selectedId || ""} onChange={(event) => onSelect(event.target.value)} className="w-full cursor-pointer rounded border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">{language === "ar" ? "اختر مادة من المستودع (المعتمدة فقط)" : language === "fr" ? "Choisir un adjuvant approuvé" : "Select approved admixture"}</option>{materials.map((material) => <option key={material.id} value={material.id} className={isUserMaterial(material) ? "font-semibold text-emerald-600" : "text-blue-600"}>{materialOptionLabel(material)}</option>)}</select>{materialBadge}</div>
  <p className="font-sans text-[9px] leading-normal text-slate-400">{language === "ar" ? "تتحكم في قوام وتشغيلية المزيج وزمن الشك ونسبة الماء إلى الإسمنت." : language === "fr" ? "Contrôle la plasticité, la maniabilité et le temps de prise." : "Controls mix consistency, fluidity, workability, and setting time."}</p>
</div>;
