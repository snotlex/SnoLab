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
import { auditMaterial } from "../services/materialAuditEngine";

interface MaterialPropertiesCardProps {
  inputs: MixDesignInput;
  setInputs?: React.Dispatch<React.SetStateAction<MixDesignInput>>;
  materials: EngineeringMaterial[];
  language?: string;
  onOpenBatchModal?: () => void;
}

export const MaterialPropertiesCard: React.FC<MaterialPropertiesCardProps> = ({ 
  inputs, 
  materials, 
  language = "ar",
  onOpenBatchModal
}) => {
  const isAr = language === "ar";
  const isFr = language === "fr";

  // State to track open/closed state of each collapsible material card
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  checkAndAdd(inputs?.selectedCementId, "cement", "إسمنت", "Ciment", "Cement", "إسمنت", <Flame size={16} className="text-red-500" />);
  checkAndAdd(inputs?.selectedSandId, "sand", "رمل (ركام ناعم)", "Sable", "Fine Aggregate", "رمال", <Layers size={16} className="text-amber-500" />);
  checkAndAdd(inputs?.selectedGravelId, "gravel", "حصى (ركام خشن)", "Gravier", "Coarse Aggregate", "حصى", <Layers size={16} className="text-slate-500" />);
  checkAndAdd(inputs?.selectedAdmixtureId, "admixture", "إضافات كيميائية", "Adjuvants", "Chemical Admixture", "إضافات كيميائية", <Droplet size={16} className="text-emerald-500" />);
  checkAndAdd(inputs?.selectedScmId, "scm", "إضافات معدنية (SCM)", "Ajouts", "Mineral Admixture", "إضافات معدنية", <Layers size={16} className="text-purple-500" />);
  checkAndAdd(inputs?.selectedWaterId, "water", "مياه الخلط", "Eau", "Mixing Water", "ماء", <Droplet size={16} className="text-sky-500" />);
  checkAndAdd(inputs?.selectedFiberId, "fiber", "ألياف التسليح", "Fibres", "Fibers", "ألياف", <Bookmark size={16} className="text-amber-600" />);
  checkAndAdd(inputs?.selectedSpecialBinderId, "specialBinder", "روابط خاصة", "Liants Spéciaux", "Special Binders", "مجلدات خاصة", <Flame size={16} className="text-rose-500" />);

  // Calculate total missing required properties across all active materials
  let totalMissingRequiredCount = 0;
  selectedMaterialsList.forEach(({ material }) => {
    const audit = auditMaterial(material, inputs?.selectedMethod || "dreux", inputs?.concreteType || "standard");
    totalMissingRequiredCount += audit.missingRequiredCount;
  });

  return (
    <div className="space-y-4" id="cardE-materialSpecs" style={{ direction: isAr ? "rtl" : "ltr" }}>
      
      {/* Top Banner for Missing Properties Action */}
      {totalMissingRequiredCount > 0 && onOpenBatchModal && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20 shrink-0">
              <AlertCircle size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-black text-amber-900 dark:text-amber-300">
                  {isAr ? `⚠ توجد ${totalMissingRequiredCount} خصائص ناقصة في المواد المختارة.` : `⚠ ${totalMissingRequiredCount} missing properties in selected materials.`}
                </strong>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-500/20">
                  {isAr ? "مطلوبة للمعادلات الحجمية" : "Required for Volumetric Mix"}
                </span>
              </div>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-400/90 mt-0.5">
                {isAr 
                  ? "توجد خصائص هندسية لم تُسجل بعد للمواد المستخدمة فعليًا في الخلطة. يمكنك إكمال جميع الخصائص الناقصة دفعة واحدة من هنا دون الانتقال للمكتبة."
                  : "Some selected materials have missing properties. You can complete all missing properties directly from here without leaving mix preparation."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBatchModal}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>{isAr ? "إكمال خصائص المواد الناقصة" : isFr ? "Compléter les caractéristiques manquantes" : "Complete Missing Material Properties"}</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* Mini Title Section */}
      <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
        <span className="font-extrabold text-slate-400 uppercase tracking-widest text-[9.5px]">
          {isAr ? "بطاقات مواصفات المواد النشطة للخلطة (Schema-Driven)" : isFr ? "Spécifications des matériaux actifs" : "Specifications of Active Mix Materials"}
        </span>
        <div className="flex items-center gap-2">
          {totalMissingRequiredCount === 0 && selectedMaterialsList.length > 0 && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1">
              ✓ {isAr ? "بيانات المواد مكتملة" : isFr ? "Données des matériaux complètes" : "Material Data Complete"}
            </span>
          )}
          <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
            {selectedMaterialsList.length} {isAr ? "مواد مختارة" : "Materials Selected"}
          </span>
        </div>
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
          {selectedMaterialsList.map(({ id, key, material, categoryAr, categoryFr, categoryEn, icon }) => {
            const isCollapsed = collapsedStates[id] ?? false;
            const audit = auditMaterial(material, inputs?.selectedMethod || "dreux", inputs?.concreteType || "standard");
            const matName = isAr ? material.name : (material.englishName || material.name);
            const catLabel = isAr ? categoryAr : isFr ? categoryFr : categoryEn;
            const supplier = material.supplierName || (material as any).Supplier;
            const updated = material.updatedDate || (material as any).UpdatedAt || material.createdDate || "N/A";

            // Status indicator badge helper
            const getStatusBadge = () => {
              if (audit.readinessStatus === "ready") {
                return (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{isAr ? "🟢 100% جاهز للخلطات" : isFr ? "🟢 100% Prêt" : "🟢 100% Ready"}</span>
                  </span>
                );
              } else if (audit.readinessStatus === "needs_review") {
                return (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-450 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>{isAr ? `🟡 يحتاج مراجعة (${audit.completenessScore}%)` : `🟡 Review Needed (${audit.completenessScore}%)`}</span>
                  </span>
                );
              } else {
                return (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>{isAr ? `🔴 ناقص ${audit.missingRequiredCount} خصائص (${audit.completenessScore}%)` : `🔴 ${audit.missingRequiredCount} Missing (${audit.completenessScore}%)`}</span>
                  </span>
                );
              }
            };

            return (
              <div 
                key={id}
                className={`bg-slate-50/50 dark:bg-slate-900/10 border rounded-2xl transition-all shadow-xs ${
                  audit.readinessStatus === "incomplete" 
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono text-slate-450">
                          ID: {id}
                        </span>
                        <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                          audit.isSystemMaterial 
                            ? "bg-purple-500/10 text-purple-600 border border-purple-500/20" 
                            : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                        }`}>
                          {audit.isSystemMaterial 
                            ? (isAr ? "مرجع نظام قياسي" : "Standard System Preset") 
                            : (isAr ? "بيانات مستخدم" : "User Record")}
                        </span>
                      </div>
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
                        <span><strong>{isAr ? "المورد / المصدر:" : "Supplier / Source:"}</strong> {supplier || (isAr ? "غير محدد" : "Unspecified")}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Calendar size={13} className="text-slate-400" />
                        <span><strong>{isAr ? "تاريخ التحقق والتحديث:" : "Audit / Update Date:"}</strong> {updated}</span>
                      </div>
                    </div>

                    {/* RED WARNING CARD FOR MISSING REQUIRED PROPERTIES */}
                    {audit.missingRequiredCount > 0 && (
                      <div className="p-4 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 dark:border-rose-500/10 text-rose-800 dark:text-rose-400 rounded-xl space-y-3 font-sans">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                          <div className="space-y-1">
                            <strong className="text-[11px] block font-black">
                              {isAr ? `تنبيه: بطاقة مادة غير مكتملة المواصفات (${audit.missingRequiredCount} خصائص مفقودة)` : `Warning: Incomplete Material Card (${audit.missingRequiredCount} Missing)`}
                            </strong>
                            <p className="text-[10px] leading-relaxed opacity-90">
                              {isAr 
                                ? "هذه المادة تفتقر إلى بعض الخصائص الهندسية الإلزامية في Schema الخاص بنوعها. لن يتم ملء قيم عشوائية لضمان سلامة الحسابات الإنشائية."
                                : "This material lacks required schema properties. No synthetic values will be forged to ensure structural calculation safety."}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/60 dark:bg-slate-950/30 p-2.5 rounded-lg border border-rose-500/10">
                          <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-350 block mb-1">
                            {isAr ? "الخصائص الإلزامية المفقودة (Status = Missing):" : "Missing Required Properties (Status = Missing):"}
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {audit.missingRequiredProperties.map((propDef) => (
                              <span key={propDef.key} className="px-2 py-0.5 bg-rose-500/15 text-rose-700 dark:text-rose-300 rounded border border-rose-500/20 text-[9.5px] font-bold">
                                {isAr ? propDef.labelAr : isFr ? propDef.labelFr : propDef.labelEn}
                                {propDef.testStandard && <span className="font-mono text-[8px] opacity-75 mr-1">({propDef.testStandard})</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PROPERTIES DISPLAY GRID (SCHEMA-DRIVEN) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          {isAr ? "مصفوفة الخصائص الهندسية (Property Schema Table):" : "Engineering Property Schema Matrix:"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {audit.validRequiredCount}/{audit.requiredCount} {isAr ? "إلزامية محققة" : "Required Valid"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {audit.evaluatedProperties.map((p, idx) => {
                          const isMissing = p.status === "missing";
                          const isInvalid = p.status === "invalid";

                          return (
                            <div 
                              key={idx}
                              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                                isMissing 
                                  ? p.isRequired 
                                    ? "bg-rose-500/[0.03] border-rose-300/60 dark:border-rose-900/40"
                                    : "bg-slate-100/30 dark:bg-slate-900/30 border-dashed border-slate-200/60 dark:border-slate-800/60"
                                  : isInvalid
                                  ? "bg-amber-500/5 border-amber-300/60 dark:border-amber-900/40"
                                  : "bg-white dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/80"
                              }`}
                            >
                              <div className="flex justify-between items-start text-[9.5px]">
                                <div className="space-y-0.5">
                                  <span className="text-slate-600 dark:text-slate-300 font-bold block">
                                    {isAr ? p.labelAr : isFr ? p.labelFr : p.labelEn}
                                  </span>
                                  {p.testStandard && (
                                    <span className="text-[8px] font-mono text-slate-400 block">
                                      {p.testStandard}
                                    </span>
                                  )}
                                </div>
                                {p.isRequired ? (
                                  <span className="text-[8px] font-black uppercase text-rose-500/90 font-mono tracking-widest bg-rose-500/10 px-1 py-0.25 rounded border border-rose-500/20 shrink-0">
                                    {isAr ? "إلزامي" : "Req"}
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-medium text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.25 rounded shrink-0">
                                    {isAr ? "اختياري" : "Opt"}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-850">
                                <div className="space-y-0.5">
                                  <strong className={`text-xs font-mono font-black ${
                                    isMissing 
                                      ? "text-rose-500 dark:text-rose-400 italic text-[11px]" 
                                      : isInvalid
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-slate-800 dark:text-slate-200"
                                  }`}>
                                    {isMissing ? (isAr ? "مفقودة (Missing)" : "Missing") : p.currentValueDisplay}
                                  </strong>
                                  {p.hasCurrentValue && (
                                    <span className="text-[8px] text-slate-400 block font-mono">
                                      {isAr ? p.sourceLabelAr : isFr ? p.sourceLabelFr : p.sourceLabelEn}
                                    </span>
                                  )}
                                </div>
                                
                                <span className="text-[9px]">
                                  {p.status === "valid" ? (
                                    <span className="text-emerald-500 font-bold">✓</span>
                                  ) : p.status === "invalid" ? (
                                    <span className="text-amber-500 font-bold" title={isAr ? p.validationErrorAr : p.validationErrorEn}>⚠</span>
                                  ) : p.isRequired ? (
                                    <span className="text-rose-500 font-bold font-mono">✕</span>
                                  ) : (
                                    <span className="text-slate-450 font-mono">—</span>
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
                          {isAr ? "التدرج الحبيبي (تحليل المناخل EN 933-1 / ASTM C136):" : "Sieve Gradation Analysis (EN 933-1 / ASTM C136):"}
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 text-center">
                          {material.gradationData.map((g: any, i: number) => (
                            <div key={i} className="p-1 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
                              <div className="text-[9px] text-slate-400 font-mono">{g.sieve ?? g.sieveSize}mm</div>
                              <div className="text-[10px] font-black font-mono text-blue-500 mt-0.5">{g.passing ?? g.percentPassing}%</div>
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
                          ? "هذه البيانات الفنية مستمدة من Schema الموحد ومستودع المواد. لا يتم اختلاق أو تعويض أي قيم مفقودة تلقائياً."
                          : "These technical properties are derived strictly from the unified Schema. Missing values are never fabricated."}
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
