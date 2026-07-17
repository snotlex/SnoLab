import React, { useState } from "react";
import { Admixture } from "../types";
import { STANDARD_ADMIXTURES_LIST, getLocalizedValue } from "../utils";
import { Plus, Trash2, Sliders, Info, ShieldAlert } from "lucide-react";
import { useLanguage } from "../services/localization";

interface AdmixtureSelectionProps {
  selectedAdmixtures: Admixture[];
  onAdmixturesChange: (admixtures: Admixture[]) => void;
}

export const AdmixtureSelection: React.FC<AdmixtureSelectionProps> = ({
  selectedAdmixtures,
  onAdmixturesChange
}) => {
  const { language } = useLanguage();
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<Admixture["type"]>("custom");
  const [customDosage, setCustomDosage] = useState(1.0);
  const [customReduction, setCustomReduction] = useState(10);

  const addPreset = (presetId: string) => {
    const preset = STANDARD_ADMIXTURES_LIST.find((p) => p.id === presetId);
    if (!preset) return;

    // Check if already added
    if (selectedAdmixtures.some((a) => a.id === presetId)) {
      alert(
        language === "ar"
          ? "هذه الإضافة مضافة بالفعل في الخلطة الحالية."
          : language === "fr"
          ? "Cet adjuvant est déjà ajouté au mélange actuel."
          : "This admixture is already added to the current mix."
      );
      return;
    }

    const newAdmixture: Admixture = {
      id: preset.id,
      name: preset.name,
      type: preset.type,
      dosage: preset.dosage,
      waterReduction: preset.waterReduction,
      effect: preset.effect
    };

    onAdmixturesChange([...selectedAdmixtures, newAdmixture]);
    setShowPresetsMenu(false);
  };

  const addCustom = () => {
    if (!customName.trim()) {
      alert(
        language === "ar"
          ? "يرجى إدخال اسم للإضافة الكيميائية المخصصة."
          : language === "fr"
          ? "Veuillez entrer un nom pour l'adjuvant personnalisé."
          : "Please enter a name for the custom admixture."
      );
      return;
    }

    const newAdmixture: Admixture = {
      id: "custom-" + Date.now(),
      name: customName,
      type: customType,
      dosage: customDosage,
      waterReduction: customReduction,
      effect: {
        ar: `إضافة مخصصة مضافة يدوياً بجرعة ${customDosage}% وتخفيض ماء الخلط بنسبة ${customReduction}%.`,
        en: `Custom admixture added manually at dosage of ${customDosage}% with ${customReduction}% water reduction.`,
        fr: `Adjuvant personnalisé ajouté manuellement au dosage de ${customDosage}% avec une réduction d'eau de ${customReduction}%.`
      }
    };

    onAdmixturesChange([...selectedAdmixtures, newAdmixture]);
    setCustomName("");
    setCustomDosage(1.0);
    setCustomReduction(10);
    setShowPresetsMenu(false);
  };

  const removeAdmixture = (id: string) => {
    onAdmixturesChange(selectedAdmixtures.filter((a) => a.id !== id));
  };

  const updateDosage = (id: string, newDosage: number) => {
    const updated = selectedAdmixtures.map((a) => {
      if (a.id === id) {
        // Find if preset exists to update explanation dynamically
        const preset = STANDARD_ADMIXTURES_LIST.find((p) => p.id === id);
        let explanation: string | { ar: string; en: string; fr: string };
        if (preset) {
          const eff = preset.effect as { ar: string; en: string; fr: string };
          explanation = {
            ar: eff.ar.replace(/جرعة [\d.]+%/, `جرعة ${newDosage}%`),
            en: eff.en.replace(/dosage of [\d.]+%/, `dosage of ${newDosage}%`),
            fr: eff.fr.replace(/dosage de [\d.]+%/, `dosage de ${newDosage}%`)
          };
        } else {
          explanation = {
            ar: `إضافة مخصصة مضافة يدوياً بجرعة ${newDosage}% وتخفيض ماء الخلط بنسبة ${a.waterReduction}%.`,
            en: `Custom admixture added manually at dosage of ${newDosage}% with ${a.waterReduction}% water reduction.`,
            fr: `Adjuvant personnalisé ajouté manuellement au dosage de ${newDosage}% avec une réduction d'eau de ${a.waterReduction}%.`
          };
        }
        return { ...a, dosage: newDosage, effect: explanation };
      }
      return a;
    });
    onAdmixturesChange(updated);
  };

  const updateWaterReduction = (id: string, newReduction: number) => {
    const updated = selectedAdmixtures.map((a) => {
      if (a.id === id) {
        return { ...a, waterReduction: newReduction };
      }
      return a;
    });
    onAdmixturesChange(updated);
  };

  const totalWaterReduction = selectedAdmixtures.reduce((s, a) => s + a.waterReduction, 0);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm" id="admixture-selector-section">
      <div className="flex justify-between items-center mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-sans">
            <span className="p-1 px-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-mono">🧪</span>
            <span>
              {language === "ar"
                ? "الإضافات الكيميائية والمحسنات"
                : language === "fr"
                ? "Adjuvants Chimiques et Améliorants"
                : "Chemical Admixtures & Modifiers"}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {language === "ar"
              ? "تطوير خصائص الخرسانة وقابلية تشغيلها وقوتها بالاستعانة بمعدلات زمن الشك والملدنات الفائقة"
              : language === "fr"
              ? "Améliorer les propriétés du béton, sa maniabilité et sa résistance à l'aide de retardateurs de prise et de superplastifiants."
              : "Enhance concrete properties, workability, and strength using set modifiers and superplasticizers."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPresetsMenu(!showPresetsMenu)}
          className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-3 rounded-xl flex items-center gap-1 transition-all shadow-sm"
          id="btn-add-admixture-presets"
        >
          <Plus size={14} /> {language === "ar" ? "إضافة" : language === "fr" ? "Ajouter" : "Add"}
        </button>
      </div>

      {/* Preset selections and CUSTOM add panel */}
      {showPresetsMenu && (
        <div className="mb-4 bg-zinc-50 dark:bg-zinc-800/80 p-4 rounded-xl border border-zinc-150 dark:border-zinc-750/80 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-sans">
              {language === "ar"
                ? "اختر إضافة قياسية أو أضف واحدة مخصصة:"
                : language === "fr"
                ? "Sélectionnez un adjuvant standard ou ajoutez-en un personnalisé :"
                : "Select a standard admixture or add a custom one:"}
            </span>
            <button 
              type="button"
              onClick={() => setShowPresetsMenu(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-sans"
            >
              {language === "ar" ? "إلغاء ×" : language === "fr" ? "Annuler ×" : "Cancel ×"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {STANDARD_ADMIXTURES_LIST.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => addPreset(preset.id)}
                className="text-right p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-xs flex flex-col justify-between"
              >
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-sans">{getLocalizedValue(preset.name, language)}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block font-sans truncate w-full leading-normal">
                  {language === "ar" ? "الأثر المقدر: " : language === "fr" ? "Effet estimé : " : "Estimated Effect: "}
                  {getLocalizedValue(preset.effect, language)}
                </span>
                <div className="flex gap-2 mt-1.5 text-[9px] text-indigo-600 dark:text-indigo-400">
                  <span>{language === "ar" ? "الجرعة الافتراضية: " : language === "fr" ? "Dosage par défaut : " : "Default dosage: "}{preset.dosage}%</span>
                  <span>•</span>
                  <span>{language === "ar" ? "نسبة تقليص الماء: " : language === "fr" ? "Réduction d'eau : " : "Water reduction: "}{preset.waterReduction}%</span>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-2 font-sans">
              {language === "ar"
                ? "إضافة كيميائية مخصصة:"
                : language === "fr"
                ? "Adjuvant chimique personnalisé :"
                : "Custom Chemical Admixture:"}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-end">
              <div>
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 font-sans">
                  {language === "ar" ? "اسم الإضافة" : language === "fr" ? "Nom de l'adjuvant" : "Admixture Name"}
                </label>
                <input
                  type="text"
                  placeholder={language === "ar" ? "مثال: MasterPozzolith 95" : "Ex: MasterPozzolith 95"}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 font-sans">
                  {language === "ar" ? "الفئة الوظيفية" : language === "fr" ? "Catégorie fonctionnelle" : "Functional Class"}
                </label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="superplasticizer">{language === "ar" ? "ملدن فائق (Superplasticizer)" : language === "fr" ? "Superplastifiant" : "Superplasticizer"}</option>
                  <option value="retarder">{language === "ar" ? "مؤخر شك (Retarder)" : language === "fr" ? "Retardateur de prise" : "Set Retarder"}</option>
                  <option value="accelerator">{language === "ar" ? "مسرع تصلد (Accelerator)" : language === "fr" ? "Accélérateur de prise" : "Set Accelerator"}</option>
                  <option value="air_entraining">{language === "ar" ? "مدخل هواء (Air Entraining)" : language === "fr" ? "Entraîneur d'air" : "Air Entrainer"}</option>
                  <option value="silica_fume">{language === "ar" ? "بوزولان/سيليكا فوم" : language === "fr" ? "Fumée de silice" : "Silica Fume"}</option>
                  <option value="custom">{language === "ar" ? "أخرى / مخصصة" : language === "fr" ? "Autre / Personnalisé" : "Other / Custom"}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 font-sans">
                  {language === "ar" ? "الجرعة (% من الإسمنت): " : language === "fr" ? "Dosage (% du ciment) : " : "Dosage (% of cement): "}{customDosage}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="12"
                  step="0.1"
                  value={customDosage}
                  onChange={(e) => setCustomDosage(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1 font-sans">
                    {language === "ar" ? "تقليص الماء (%): " : language === "fr" ? "Réduction d'eau (%) : " : "Water reduction (%): "}{customReduction}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={customReduction}
                    onChange={(e) => setCustomReduction(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCustom}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2 font-semibold text-xs flex justify-center items-center h-9 w-12 font-sans"
                >
                  {language === "ar" ? "إضافة" : language === "fr" ? "Ajouter" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List of currently installed active admixtures */}
      {selectedAdmixtures.length === 0 ? (
        <div className="text-center p-6 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 flex flex-col items-center gap-1.5 transition-all">
          <Sliders className="opacity-40" size={24} />
          <span className="text-xs font-sans">
            {language === "ar"
              ? "لا توجد إضافات كيميائية مضافة حتى الآن للخلطة."
              : language === "fr"
              ? "Aucun adjuvant chimique ajouté pour le moment."
              : "No chemical admixtures added to the mix yet."}
          </span>
          <span className="text-[10px] font-sans opacity-80">
            {language === "ar"
              ? "أضف ملدنات فائقة لتقليل مياه الصب مع الحفاظ على المقاومة ومستوى الهبوط."
              : language === "fr"
              ? "Ajoutez des superplastifiants pour réduire l'eau de gâchée tout en maintenant la résistance et l'affaissement."
              : "Add superplasticizers to reduce water demand while keeping strength and slump."}
          </span>
        </div>
      ) : (
        <div className="space-y-3.5">
          {selectedAdmixtures.map((admixture) => (
            <div
              key={admixture.id}
              className="p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/30 flex flex-col md:flex-row justify-between gap-4 animate-in fade-in duration-200"
              id={`admixture-card-${admixture.id}`}
            >
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 font-sans block">
                    {getLocalizedValue(admixture.name, language)}
                  </span>
                  <span className="text-[9px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 p-0.5 px-2 rounded-full font-sans uppercase">
                    {admixture.type === "superplasticizer" 
                      ? (language === "ar" ? "ملدن متفوق W/R" : language === "fr" ? "Superplastifiant W/R" : "Superplasticizer W/R")
                      : (language === "ar" ? "معدل شكّ/ميكانيكي" : language === "fr" ? "Modificateur de prise" : "Set modifier")}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed flex items-start gap-1 font-sans">
                  <Info size={11} className="mt-0.5 text-zinc-400 shrink-0" />
                  <span>{getLocalizedValue(admixture.effect, language)}</span>
                </p>
              </div>

              {/* Adjustable parameters for current added chemicals */}
              <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 md:border-r border-zinc-200 dark:border-zinc-700 pt-3 md:pt-0 pr-0 md:pr-4">
                <div className="w-32">
                  <div className="flex justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 font-sans">
                    <span>{language === "ar" ? "الجرعة (Dosage)" : language === "fr" ? "Dosage" : "Dosage"}</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{admixture.dosage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                    value={admixture.dosage}
                    onChange={(e) => updateDosage(admixture.id, parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-zinc-200 dark:bg-zinc-705 appearance-none rounded-lg cursor-pointer"
                  />
                </div>

                <div className="w-32">
                  <div className="flex justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 font-sans">
                    <span>{language === "ar" ? "تقليل مياه المعايرة" : language === "fr" ? "Réduction d'eau" : "Water Reduction"}</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{admixture.waterReduction}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    disabled={admixture.type === "silica_fume" /* silica fume increases water uptake */}
                    value={admixture.waterReduction}
                    onChange={(e) => updateWaterReduction(admixture.id, parseInt(e.target.value))}
                    className="w-full h-1.5 accent-indigo-600 bg-zinc-200 dark:bg-zinc-705 appearance-none rounded-lg cursor-pointer disabled:opacity-40"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeAdmixture(admixture.id)}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors self-end"
                  title={language === "ar" ? "حذف الإضافة" : language === "fr" ? "Supprimer l'adjuvant" : "Delete Admixture"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Admixtures summation status */}
          <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center gap-2.5 text-xs text-indigo-700 dark:text-indigo-300">
            <Info size={14} className="shrink-0" />
            <span className="font-sans">
              {language === "ar" ? (
                <>
                  النظام يدمج تأثير الإضافات: إجمالي نسبة تخفيض ماء الخرسانة المحسوب هو <strong>{totalWaterReduction}%</strong>. سيعاد حساب وزن الإسمنت لإنتاج الخلطة المكافئة بطريقة <strong>درو</strong> لتوفير الإسمنت دون المساس بالمقاومة المتوسطة البالغة {totalWaterReduction > 0 ? "أعلى أو مساوية للمستهدفة" : "المستهدفة"}.
                </>
              ) : language === "fr" ? (
                <>
                  Le système intègre l'effet des adjuvants : le taux total de réduction d'eau calculé est de <strong>{totalWaterReduction}%</strong>. La masse de ciment sera recalculée pour produire le mélange équivalent selon la méthode <strong>Dreux</strong> afin d'économiser le ciment sans compromettre la résistance moyenne {totalWaterReduction > 0 ? "supérieure ou égale à la cible" : "cible"}.
                </>
              ) : (
                <>
                  The system integrates the admixture effects: the total calculated water reduction is <strong>{totalWaterReduction}%</strong>. The cement content will be recalculated for the equivalent mix using the <strong>Dreux</strong> method to optimize cement consumption without compromising target strength.
                </>
              )}
            </span>
          </div>
          {totalWaterReduction > 30 && (
            <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 items-start">
              <ShieldAlert size={15} className="shrink-0 mt-0.5" />
              <span className="font-sans">
                {language === "ar" ? (
                  <>
                    <strong>تنبيه هندسي:</strong> تجاوزت نسبة تقليص مياه الخلط عتبة 30%، في خرسانة الموقع الفعلية هذا قد يسبب جفافاً سريعاً أو صعوبة بالغة في الترطيب ويستلزم استخدام ملدنات من الجيل المتفوق وإدارة صب بالغة الدقة (الحد الأقصى للتعديل النظري في الحاسبة هو 32%).
                  </>
                ) : language === "fr" ? (
                  <>
                    <strong>Alerte d'ingénierie :</strong> Le taux de réduction d'eau a dépassé le seuil de 30%. Dans le béton de chantier réel, cela peut provoquer une dessiccation rapide ou des difficultés d'hydratation majeures, nécessitant des superplastifiants de dernière génération et un contrôle de coulage très strict (la limite théorique maximale de calibrage dans la calculatrice est de 32%).
                  </>
                ) : (
                  <>
                    <strong>Engineering Warning:</strong> Water reduction ratio exceeded 30%. In field placement, this may lead to rapid dry-out or extreme hydration issues, requiring next-gen superplasticizers and highly precise placement handling (the theoretical simulation limit is 32%).
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
