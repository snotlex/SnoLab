import React from "react";
import { EngineeringMaterial } from "../types";

type Language = "ar" | "fr" | "en";

export const FiberSelectionCard: React.FC<{
  language: Language;
  materials: EngineeringMaterial[];
  selectedId?: string;
  materialOptionLabel: (material: EngineeringMaterial) => string;
  isUserMaterial: (material: EngineeringMaterial) => boolean;
  materialBadge: React.ReactNode;
  onSelect: (id: string) => void;
}> = ({ language, materials, selectedId, materialOptionLabel, isUserMaterial, materialBadge, onSelect }) => <div className="space-y-2.5 rounded border border-slate-200/40 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
  <div className="flex items-center gap-1 border-b border-slate-200/50 pb-1 text-xs font-black text-slate-800 dark:border-slate-800 dark:text-white"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /><span>{language === "ar" ? "ألياف التسليح الخرساني:" : language === "fr" ? "Fibres de renforcement :" : "Structural Fibers:"}</span></div>
  <div><label className="mb-1 block text-[10px] text-slate-500">{language === "ar" ? "ألياف الصلب والبوليمر المعتمدة" : language === "fr" ? "Fibres approuvées" : "Approved fibers"}</label><select aria-label={language === "ar" ? "اختيار ألياف التسليح" : language === "fr" ? "Choisir les fibres" : "Select structural fibers"} value={selectedId || ""} onChange={(event) => onSelect(event.target.value)} className="w-full cursor-pointer rounded border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">{language === "ar" ? "اختر مادة من المستودع (المعتمدة فقط)" : language === "fr" ? "Choisir des fibres approuvées" : "Select approved fibers"}</option>{materials.map((material) => <option key={material.id} value={material.id} className={isUserMaterial(material) ? "font-semibold text-emerald-600" : "text-blue-600"}>{materialOptionLabel(material)}</option>)}</select>{materialBadge}</div>
  <p className="font-sans text-[9px] leading-normal text-slate-400">{language === "ar" ? "تمنع شروخ الانكماش اللدن في السطح وتزيد من مرونة وتحمل المزيج." : language === "fr" ? "Prévient la fissuration et améliore la ductilité du béton." : "Prevents early cracking and improves structural ductility and toughness."}</p>
</div>;
