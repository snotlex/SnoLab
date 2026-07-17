import React, { useState } from "react";
import { 
  Flame, 
  Layers, 
  Droplet, 
  Bookmark, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Calendar, 
  Lock,
  ArrowUpRight,
  Database
} from "lucide-react";
import { MixDesignInput, EngineeringMaterial } from "../types";

// Helper to look up a property dynamically in nested object paths, capitalized or lowercase
const getProp = (m: any, ...keys: string[]) => {
  if (!m) return undefined;
  for (const k of keys) {
    if (m[k] !== undefined && m[k] !== null && m[k] !== "") return m[k];
    
    const lk = k.toLowerCase();
    if (m[lk] !== undefined && m[lk] !== null && m[lk] !== "") return m[lk];
    
    const ck = k.charAt(0).toUpperCase() + k.slice(1);
    if (m[ck] !== undefined && m[ck] !== null && m[ck] !== "") return m[ck];
    
    if (m.engineeringData) {
      if (m.engineeringData[k] !== undefined && m.engineeringData[k] !== null && m.engineeringData[k] !== "") return m.engineeringData[k];
      if (m.engineeringData[lk] !== undefined && m.engineeringData[lk] !== null && m.engineeringData[lk] !== "") return m.engineeringData[lk];
      if (m.engineeringData[ck] !== undefined && m.engineeringData[ck] !== null && m.engineeringData[ck] !== "") return m.engineeringData[ck];
    }
  }
  return undefined;
};

interface MaterialPropertiesCardProps {
  inputs: MixDesignInput;
  setInputs: React.Dispatch<React.SetStateAction<MixDesignInput>>;
  materials: EngineeringMaterial[];
  language?: string;
  onOpenLibrary?: (category?: string, materialId?: string) => void;
}

export const MaterialPropertiesCard: React.FC<MaterialPropertiesCardProps> = ({ 
  inputs, 
  materials, 
  language = "ar",
  onOpenLibrary 
}) => {
  const isAr = language === "ar";
  const isFr = language === "fr";

  // State to track open/closed state of each collapsible material card
  // Default first few open for high user engagement
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to evaluate properties of a material based on its category
  const evaluateMaterial = (categoryKey: string, m: any) => {
    const properties: {
      key: string;
      labelAr: string;
      labelFr: string;
      labelEn: string;
      required: boolean;
      display: string;
      hasValue: boolean;
    }[] = [];

    const addProp = (keys: string[], labelAr: string, labelFr: string, labelEn: string, required: boolean, unit: string = "") => {
      const val = getProp(m, ...keys);
      const hasValue = val !== undefined && val !== null && val !== "";
      let display = "—";
      if (hasValue) {
        if (typeof val === "number") {
          display = `${val}${unit}`;
        } else {
          display = `${val}${unit ? " " + unit : ""}`;
        }
      }
      properties.push({ key: keys[0], labelAr, labelFr, labelEn, required, display, hasValue });
    };

    if (categoryKey === "cement") {
      addProp(["cementClass", "cementType", "Category"], "نوع الإسمنت", "Type de Ciment", "Cement Type", true);
      addProp(["strengthClass", "StrengthClass"], "فئة المقاومة", "Classe de Résistance", "Strength Class", true);
      
      // Specific Gravity / Absolute density
      let spGrav = getProp(m, "specificGravity", "SpecificGravity");
      if (!spGrav && m.density) {
        spGrav = (m.density / 1000).toFixed(2);
      }
      const hasSpGrav = spGrav !== undefined && spGrav !== null && spGrav !== "";
      properties.push({
        key: "specificGravity",
        labelAr: "الوزن النوعي",
        labelFr: "Masse Volumique Absolue",
        labelEn: "Specific Gravity",
        required: true,
        display: hasSpGrav ? `${spGrav}` : "—",
        hasValue: hasSpGrav
      });
      addProp(["bulkDensity", "BulkDensity"], "الكثافة الظاهرية", "Masse Volumique Apparente", "Bulk Density", false, " g/cm³");
      addProp(["blaineFineness", "BlaineFineness"], "نعومة بلين", "Finesse de Blaine", "Blaine Fineness", false, " cm²/g");
    } 
    else if (categoryKey === "sand") {
      addProp(["density", "Density"], "الكثافة المطلقة", "Masse Volumique Absolue", "Density", true, " kg/m³");
      addProp(["bulkDensity", "BulkDensity"], "الكثافة الظاهرية", "Masse Volumique Apparente", "Bulk Density", true, " kg/m³");
      addProp(["ssdDensity", "SsdDensity"], "كثافة SSD", "Masse Volumique SSD", "SSD Density", false, " kg/m³");
      addProp(["moisture", "moistureContent", "MoistureContent"], "محتوى الرطوبة", "Teneur en Eau", "Moisture Content", true, "%");
      addProp(["absorption", "Absorption"], "امتصاص الماء", "Absorption d'Eau", "Water Absorption", true, "%");
      addProp(["finenessModulus", "FinenessModulus"], "معامل النعومة", "Module de Finesse", "Fineness Modulus", true);
      addProp(["sandEquivalent", "SandEquivalent", "clayContent"], "المكافئ الرملي", "Équivalent de Sable", "Sand Equivalent", true, "%");
      
      // Particle Size Distribution (gradationData)
      const hasGradation = !!(m.gradationData && Array.isArray(m.gradationData) && m.gradationData.length > 0);
      properties.push({
        key: "gradationData",
        labelAr: "التدرج الحبيبي",
        labelFr: "Distribution Granulométrique",
        labelEn: "Particle Size Distribution",
        required: false,
        display: hasGradation ? (isAr ? "متوفر (جدول المناخل)" : "Available (Sieve analysis)") : "—",
        hasValue: hasGradation
      });
    } 
    else if (categoryKey === "gravel") {
      addProp(["density", "Density"], "الكثافة المطلقة", "Masse Volumique Absolue", "Density", true, " kg/m³");
      addProp(["bulkDensity", "BulkDensity"], "الكثافة الظاهرية", "Masse Volumique Apparente", "Bulk Density", true, " kg/m³");
      addProp(["ssdDensity", "SsdDensity"], "كثافة SSD", "Masse Volumique SSD", "SSD Density", false, " kg/m³");
      addProp(["moisture", "moistureContent", "MoistureContent"], "محتوى الرطوبة", "Teneur en Eau", "Moisture Content", false, "%");
      addProp(["absorption", "Absorption"], "امتصاص الماء", "Absorption d'Eau", "Water Absorption", true, "%");
      addProp(["losAngelesAbrasion", "losAngeles", "LosAngeles"], "مقاومة لوس أنجلوس", "Essai Los Angeles", "Los Angeles Abrasion", false, "%");
      addProp(["particleShape", "shape", "Shape"], "شكل الحبيبات", "Forme des Granulats", "Aggregate Shape", true);
      addProp(["dMax", "dmax", "DMax"], "القطر الأقصى للحصمة Dmax", "Taille maximale des granulats Dmax", "Max Aggregate Size Dmax", true, " mm");
      
      // Particle Size Distribution
      const hasGradation = !!(m.gradationData && Array.isArray(m.gradationData) && m.gradationData.length > 0);
      properties.push({
        key: "gradationData",
        labelAr: "التدرج الحبيبي",
        labelFr: "Distribution Granulométrique",
        labelEn: "Particle Size Distribution",
        required: false,
        display: hasGradation ? (isAr ? "متوفر (جدول المناخل)" : "Available (Sieve analysis)") : "—",
        hasValue: hasGradation
      });
    } 
    else if (categoryKey === "admixture") {
      addProp(["density", "Density"], "الكثافة المطلقة", "Masse Volumique Absolue", "Density", false, " kg/m³");
      addProp(["recommendedDosage", "recommendedDosagePercent", "dosage"], "الجرعة الموصى بها", "Dosage Recommandé", "Recommended Dosage", true, "%");
      addProp(["waterReduction", "waterReductionPercent"], "نسبة خفض الماء", "Réduction d'Eau", "Water Reduction", true, "%");
      addProp(["chlorides", "chlorideContent"], "محتوى الكلوريدات", "Teneur en Chlorures", "Chloride Content", false, "%");
    } 
    else if (categoryKey === "scm") {
      addProp(["density", "Density"], "الكثافة المطلقة", "Masse Volumique Absolue", "Density", true, " kg/m³");
      addProp(["pozzolanicIndex", "PozzolanicIndex"], "مؤشر الفعالية البوزولانية", "Indice Pouzzolanique", "Pozzolanic Index", true, "%");
      addProp(["waterDemandFactor", "WaterDemandFactor"], "عامل الطلب على الماء", "Demande en Eau SCM", "Water Demand Factor", false);
    } 
    else if (categoryKey === "water") {
      addProp(["density", "Density"], "الكثافة المطلقة", "Masse Volumique", "Density", true, " kg/m³");
      addProp(["ph", "PH"], "الرقم الهيدروجيني pH", "Valeur du pH", "pH Value", false);
      addProp(["chlorides", "chlorideContent"], "محتوى الكلوريدات", "Teneur en Chlorures", "Chloride Content", false, " ppm");
      addProp(["sulfates", "sulphates"], "محتوى الكبريتات", "Teneur en Sulfates", "Sulphate Content", false, " ppm");
    } 
    else if (categoryKey === "fiber") {
      addProp(["fiberType", "type"], "نوع الألياف", "Type de Fibres", "Fiber Type", true);
      addProp(["density", "Density"], "الكثافة المطلقة", "Masse Volumique", "Density", true, " kg/m³");
      addProp(["fiberLength", "fiberLengthMm"], "طول الألياف", "Longueur des Fibres", "Length", false, " mm");
      addProp(["fiberDiameter", "fiberDiameterMm"], "قطر الألياف", "Diamètre des Fibres", "Diameter", false, " mm");
      addProp(["tensileStrength", "tensileStrengthMPa"], "مقاومة الشد", "Résistance à la Traction", "Tensile Strength", false, " MPa");
    } 
    else if (categoryKey === "specialBinder") {
      addProp(["density", "Density"], "الكثافة المطلقة", "Masse Volumique Absolue", "Density", true, " kg/m³");
      addProp(["alkalineRatio", "specialBinderAlkalineRatio"], "نسبة القلوية للرابط الخاص", "Rapport Alcalin", "Alkaline Ratio", false, "%");
    }

    const missingRequired: string[] = [];
    const missingOptional: string[] = [];

    properties.forEach(p => {
      if (!p.hasValue) {
        const label = isAr ? p.labelAr : isFr ? p.labelFr : p.labelEn;
        if (p.required) {
          missingRequired.push(label);
        } else {
          missingOptional.push(label);
        }
      }
    });

    let status: "complete" | "optional_missing" | "required_missing" = "complete";
    if (missingRequired.length > 0) {
      status = "required_missing";
    } else if (missingOptional.length > 0) {
      status = "optional_missing";
    }

    return { properties, status, missingRequired, missingOptional };
  };

  // Build the list of active/selected materials
  const selectedMaterialsList: {
    id: string;
    key: string;
    material: EngineeringMaterial;
    categoryAr: string;
    categoryFr: string;
    categoryEn: string;
    rawCategory: string;
    icon: React.ReactNode;
  }[] = [];

  const checkAndAdd = (idField: string | undefined, key: string, catAr: string, catFr: string, catEn: string, rawCat: string, icon: React.ReactNode) => {
    if (idField) {
      const mat = materials.find(m => m.id === idField);
      if (mat) {
        selectedMaterialsList.push({
          id: mat.id,
          key,
          material: mat,
          categoryAr: catAr,
          categoryFr: catFr,
          categoryEn: catEn,
          rawCategory: rawCat,
          icon
        });
      }
    }
  };

  checkAndAdd(inputs.selectedCementId, "cement", "إسمنت", "Ciment", "Cement", "إسمنت", <Flame size={16} className="text-red-500" />);
  checkAndAdd(inputs.selectedSandId, "sand", "رمل (ركام ناعم)", "Sable", "Fine Aggregate", "رمال", <Layers size={16} className="text-amber-500" />);
  checkAndAdd(inputs.selectedGravelId, "gravel", "حصى (ركام خشن)", "Gravier", "Coarse Aggregate", "حصى", <Layers size={16} className="text-slate-500" />);
  checkAndAdd(inputs.selectedAdmixtureId, "admixture", "إضافات كيميائية", "Adjuvants", "Chemical Admixture", "إضافات كيميائية", <Droplet size={16} className="text-emerald-500" />);
  checkAndAdd(inputs.selectedScmId, "scm", "إضافات معدنية (SCM)", "Ajouts", "Mineral Admixture", "إضافات معدنية", <Layers size={16} className="text-purple-500" />);
  checkAndAdd(inputs.selectedWaterId, "water", "مياه الخلط", "Eau", "Mixing Water", "ماء", <Droplet size={16} className="text-sky-500" />);
  checkAndAdd(inputs.selectedFiberId, "fiber", "ألياف التسليح", "Fibres", "Fibers", "ألياف", <Bookmark size={16} className="text-amber-600" />);
  checkAndAdd(inputs.selectedSpecialBinderId, "specialBinder", "روابط خاصة", "Liants Spéciaux", "Special Binders", "مجلدات خاصة", <Flame size={16} className="text-rose-500" />);

  return (
    <div className="space-y-4" id="cardE-materialSpecs" style={{ direction: isAr ? "rtl" : "ltr" }}>
      
      {/* Mini Title Section */}
      <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
        <span className="font-extrabold text-slate-400 uppercase tracking-widest text-[9.5px]">
          {isAr ? "مواصفات المواد النشطة للخلطة" : isFr ? "Spécifications des matériaux actifs" : "Specifications of Active Mix Materials"}
        </span>
        <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
          {selectedMaterialsList.length} {isAr ? "مواد مختارة" : "Materials Selected"}
        </span>
      </div>

      {/* Empty State */}
      {selectedMaterialsList.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <Database className="mx-auto text-slate-350 dark:text-slate-700 animate-pulse" size={40} />
          <div className="max-w-md mx-auto space-y-1.5">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? "لم يتم اختيار أي مواد للخلطة الحالية" : isFr ? "Aucun matériau sélectionné pour ce mélange" : "No Materials Selected for This Mix"}
            </h5>
            <p className="text-[11px] text-slate-400 leading-normal">
              {isAr ? "يرجى اختيار الإسمنت والرمل والحصى من مستودع المواد في الخطوات السابقة لتظهر مواصفاتها هنا تلقائيًا." 
                   : isFr ? "Veuillez sélectionner le ciment, le sable et le gravier dans les étapes précédentes."
                   : "Please select cement, sand, and gravel from the repository in the steps above to populate specs here dynamically."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedMaterialsList.map(({ id, key, material, categoryAr, categoryFr, categoryEn, rawCategory, icon }) => {
            const isCollapsed = collapsedStates[id] ?? false;
            const evaluation = evaluateMaterial(key, material);
            const matName = isAr ? material.name : (material.englishName || material.name);
            const catLabel = isAr ? categoryAr : isFr ? categoryFr : categoryEn;
            const supplier = material.supplierName || material.Supplier;
            const updated = material.updatedDate || material.UpdatedAt || material.createdDate || "N/A";

            // Status indicator badge helper
            const getStatusBadge = () => {
              if (evaluation.status === "complete") {
                return (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{isAr ? "🟢 مكتملة المواصفات" : isFr ? "🟢 Spécifications Complètes" : "🟢 Complete"}</span>
                  </span>
                );
              } else if (evaluation.status === "optional_missing") {
                return (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-450 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>{isAr ? "🟡 خصائص اختيارية ناقصة" : isFr ? "🟡 Specs Optionnelles Manquantes" : "🟡 Optional Specs Missing"}</span>
                  </span>
                );
              } else {
                return (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>{isAr ? "🔴 خصائص إلزامية ناقصة" : isFr ? "🔴 Specs Requises Manquantes" : "🔴 Required Specs Missing"}</span>
                  </span>
                );
              }
            };

            return (
              <div 
                key={id}
                className={`bg-slate-50/50 dark:bg-slate-900/10 border rounded-2xl transition-all shadow-xs ${
                  evaluation.status === "required_missing" 
                    ? "border-rose-300/60 dark:border-rose-900/40 bg-rose-500/[0.01]" 
                    : "border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                
                {/* Collapsible Card Header */}
                <button
                  type="button"
                  onClick={() => toggleCollapse(id)}
                  className="w-full p-4 flex items-center justify-between text-right cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl shadow-xs border border-slate-100 dark:border-slate-850">
                      {icon}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        {catLabel}
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 font-sans">
                        {matName}
                      </h5>
                      <span className="text-[9px] font-mono text-slate-450 block mt-0.5">
                        ID: {id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge()}
                    <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>
                  </div>
                </button>

                {/* Collapsible Card Body */}
                {!isCollapsed && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/50 space-y-4">
                    
                    {/* Metadata strip (Supplier & Date) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-slate-550 dark:text-slate-400 bg-white dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/50">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span><strong>{isAr ? "المورد:" : "Supplier:"}</strong> {supplier || (isAr ? "غير محدد" : "Unspecified")}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Calendar size={13} className="text-slate-400" />
                        <span><strong>{isAr ? "آخر تحديث:" : "Last Updated:"}</strong> {updated}</span>
                      </div>
                    </div>

                    {/* RED WARNING CARD FOR MISSING REQUIRED PROPERTIES */}
                    {evaluation.status === "required_missing" && (
                      <div className="p-4 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 dark:border-rose-500/10 text-rose-800 dark:text-rose-400 rounded-xl space-y-3 font-sans">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                          <div className="space-y-1">
                            <strong className="text-[11px] block font-black">
                              {isAr ? `تنبيه: مادة ركامية غير مكتملة المواصفات` : `Warning: Incomplete Aggregate Specifications`}
                            </strong>
                            <p className="text-[10px] leading-relaxed opacity-90">
                              {isAr 
                                ? "هذه المادة لا تحتوي على جميع الخصائص الهندسية الإلزامية المطلوبة لإجراء حسابات طريقة درو-غوريس (Dreux-Gorisse) بالشكل الصحيح."
                                : "This material is missing core technical engineering parameters essential for executing Dreux-Gorisse absolute volumetric calculation."}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/60 dark:bg-slate-950/30 p-2.5 rounded-lg border border-rose-500/10">
                          <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-350 block mb-1">
                            {isAr ? "الخصائص الناقصة الإلزامية:" : "Missing Required Properties:"}
                          </span>
                          <ul className="list-disc list-inside text-[9.5px] font-bold space-y-0.5">
                            {evaluation.missingRequired.map((propLabel, idx) => (
                              <li key={idx} className="text-rose-600 dark:text-rose-400">{propLabel}</li>
                            ))}
                          </ul>
                        </div>

                        {onOpenLibrary && (
                          <button
                            type="button"
                            onClick={() => onOpenLibrary(rawCategory, id)}
                            className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black py-1.5 px-3 rounded-lg text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm w-full sm:w-auto justify-center"
                          >
                            <span>{isAr ? "فتح مستودع المواد للتعديل" : isFr ? "Ouvrir la matériauthèque" : "Open Material Library"}</span>
                            <ArrowUpRight size={12} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* YELLOW WARNING CARD FOR MISSING OPTIONAL PROPERTIES */}
                    {evaluation.status === "optional_missing" && (
                      <div className="p-3 bg-amber-500/5 border border-amber-500/15 text-amber-800 dark:text-amber-450 rounded-xl space-y-2 font-sans">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <strong className="text-[10px] block font-extrabold">
                              {isAr ? `تنبيه: خصائص ثانوية مفقودة` : `Notice: Secondary Specs Missing`}
                            </strong>
                            <p className="text-[9px] leading-relaxed opacity-90">
                              {isAr 
                                ? "المادة صالحة للحسابات، ولكن ينقصها بعض الخصائص الاختيارية لتحقيق أقصى درجات الدقة والتحكم المخبري."
                                : "The material is valid for calculation, but missing optional properties that would allow advanced micro-precision."}
                            </p>
                          </div>
                        </div>
                        <div className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                          {isAr ? "الخصائص الاختيارية الناقصة:" : "Missing Optional Properties:"}{" "}
                          <span className="font-bold">{evaluation.missingOptional.join(" • ")}</span>
                        </div>
                      </div>
                    )}

                    {/* PROPERTIES DISPLAY GRID */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        {isAr ? "المواصفات الفنية والفيزيائية:" : "Technical & Physical Properties:"}
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {evaluation.properties.map((p, idx) => {
                          return (
                            <div 
                              key={idx}
                              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                                !p.hasValue 
                                  ? p.required 
                                    ? "bg-rose-500/[0.02] border-rose-200/50 dark:border-rose-900/30"
                                    : "bg-slate-100/30 dark:bg-slate-900/30 border-slate-200/30 dark:border-slate-800/30 opacity-60"
                                  : "bg-white dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/80"
                              }`}
                            >
                              <div className="flex justify-between items-start text-[9.5px]">
                                <span className="text-slate-450 font-bold">
                                  {isAr ? p.labelAr : isFr ? p.labelFr : p.labelEn}
                                </span>
                                {p.required && (
                                  <span className="text-[8px] font-black uppercase text-rose-500/80 font-mono tracking-widest bg-rose-500/5 px-1 py-0.25 rounded border border-rose-500/10">
                                    {isAr ? "إلزامي" : "Req"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-baseline justify-between mt-1.5">
                                <strong className={`text-xs font-mono font-black ${
                                  !p.hasValue 
                                    ? "text-slate-400" 
                                    : "text-slate-800 dark:text-slate-200"
                                }`}>
                                  {p.display}
                                </strong>
                                <span className="text-[9px]">
                                  {p.hasValue ? (
                                    <span className="text-emerald-500">✓</span>
                                  ) : p.required ? (
                                    <span className="text-rose-500">✗</span>
                                  ) : (
                                    <span className="text-slate-400 font-mono">—</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Gradation analyses special view */}
                    {material.gradationData && Array.isArray(material.gradationData) && material.gradationData.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-250/30 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2">
                          {isAr ? "التدرج الحبيبي (تحليل المناخل):" : "Sieve Gradation Analysis:"}
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 text-center">
                          {material.gradationData.map((g: any, i: number) => (
                            <div key={i} className="p-1 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
                              <div className="text-[9px] text-slate-400 font-mono">{g.sieve}mm</div>
                              <div className="text-[10px] font-black font-mono text-blue-500 mt-0.5">{g.passing}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* READ-ONLY FOOTNOTE INFO CAPTION */}
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <Lock size={10} className="text-slate-450" />
                      <span>
                        {isAr 
                          ? "هذه البيانات الفنية والفيزيائية مستوردة مباشرة وهي غير قابلة للتعديل اليدوي من هنا."
                          : "These parameters are locked read-only and synchronized in real-time from the materials database."}
                      </span>
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
