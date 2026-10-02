import React from "react";
import { getMixDesignContract } from "../mix-design/core/mixDesignContracts";
import { getSpecializedInputDefinition, validateSpecializedInputValue, specializedInputErrorMessage } from "../mix-design/core/specializedInputDefinitions";

type Language = "ar" | "fr" | "en";

export const SpecializedConcreteInputs: React.FC<{
  language: Language;
  concreteType: string;
  inputs: Record<string, any>;
  errors: Record<string, string>;
  translate: (key: string) => string;
  onFieldChange: (field: string, value: unknown, error?: string) => void;
}> = ({ language, concreteType, inputs, errors, onFieldChange }) => {
  const contract = getMixDesignContract(String(concreteType || "NSC").toUpperCase());
  if (!contract || contract.concreteType === "NSC") return null;
  const coreKeys = new Set(["fck28", "dMax", "cementType", "cementClassStrength", "cementDensity", "moistureSand", "moistureGravel", "airContent", "slump"]);
  const specializedKeys = contract.requiredInputs.filter((key) => !coreKeys.has(String(key)));
  return <div id="step1-specialized-inputs" className="mt-4 space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-right"><div><div className="text-[11px] font-black text-blue-600 dark:text-blue-300">{language === "ar" ? `المدخلات الخاصة بـ ${contract.methodId}` : `${contract.methodId} specialized inputs`}</div><div className="mt-1 text-[9px] text-slate-500 dark:text-slate-400">{contract.engineeringFramework} — {language === "ar" ? "تظهر بجانب المدخلات العامة ولا تستخدم قيماً افتراضية." : "Shown beside the general inputs with no silent defaults."}</div></div><div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{specializedKeys.map((key) => { const field = String(key); const isText = field.endsWith("Type") || field.endsWith("Method") || field === "fiberType" || field === "shcHealingAgentType"; const value = inputs[field]; const definition = getSpecializedInputDefinition(field); const fieldError = errors[field]; return <label key={field} className="text-[9px] font-bold text-slate-600 dark:text-slate-300"><span className="mb-1 block">{definition.label[language] || definition.label.en}</span><input type={isText ? "text" : "number"} min={isText ? undefined : definition.min} max={isText ? undefined : definition.max} step={isText ? undefined : definition.step || "any"} value={value ?? ""} onChange={(event) => { const raw = event.target.value; const nextValue = isText ? raw : (raw === "" ? undefined : Number(raw)); const error = validateSpecializedInputValue(field, nextValue); onFieldChange(field, nextValue, error || undefined); }} className={`w-full rounded border ${fieldError ? "border-rose-500 ring-1 ring-rose-300" : "border-blue-500/20"} bg-white p-2 text-[10px] outline-none focus:border-blue-500 dark:bg-slate-950`} placeholder={language === "ar" ? "مطلوب" : "Required"} />{fieldError && <span className="mt-1 block text-[9px] font-bold text-rose-600 dark:text-rose-400">{specializedInputErrorMessage(field, fieldError, language)}</span>}</label>; })}</div></div>;
};
