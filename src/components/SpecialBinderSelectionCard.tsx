import React from "react";
import { EngineeringMaterial } from "../types";

type Language = "ar" | "fr" | "en";

export const SpecialBinderSelectionCard: React.FC<{
  language: Language;
  materials: EngineeringMaterial[];
  selectedId?: string;
  materialOptionLabel: (material: EngineeringMaterial) => string;
  isUserMaterial: (material: EngineeringMaterial) => boolean;
  materialBadge: React.ReactNode;
  onSelect: (id: string) => void;
}> = ({ language, materials, selectedId, materialOptionLabel, isUserMaterial, materialBadge, onSelect }) => <div className="space-y-2.5 rounded border border-slate-200/40 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
  <div className="flex items-center gap-1 border-b border-slate-200/50 pb-1 text-xs font-black text-slate-800 dark:border-slate-800 dark:text-white"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /><span>{language === "ar" ? "الروابط والمجلدات الخاصة:" : language === "fr" ? "Liants spéciaux :" : "Special Binders:"}</span></div>
  <div><label className="mb-1 block text-[10px] text-slate-500">{language === "ar" ? "روابط تخصصية وجيوبوليمر معتمدة" : language === "fr" ? "Liants spéciaux approuvés" : "Approved special binders"}</label><select aria-label={language === "ar" ? "اختيار الرابط الخاص" : language === "fr" ? "Choisir le liant spécial" : "Select special binder"} value={selectedId || ""} onChange={(event) => onSelect(event.target.value)} className="w-full cursor-pointer rounded border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">{language === "ar" ? "اختر مادة من المستودع (المعتمدة فقط)" : language === "fr" ? "Choisir un liant approuvé" : "Select approved special binder"}</option>{materials.map((material) => <option key={material.id} value={material.id} className={isUserMaterial(material) ? "font-semibold text-emerald-600" : "text-blue-600"}>{materialOptionLabel(material)}</option>)}</select>{materialBadge}</div>
  <p className="font-sans text-[9px] leading-normal text-slate-400">{language === "ar" ? "للروابط الصديقة للبيئة والخرسانة ذاتية الالتئام وبدائل الإسمنت البورتلاندي." : language === "fr" ? "Pour le béton géopolymère et les liants écologiques." : "For eco-friendly binders, self-healing mixes, and green concretes."}</p>
</div>;
