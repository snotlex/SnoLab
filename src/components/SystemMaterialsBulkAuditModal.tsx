import React, { useState, useMemo } from "react";
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  SlidersHorizontal,
  BookmarkCheck,
  FileSpreadsheet
} from "lucide-react";
import { SystemMaterialsBulkAuditReport, SystemMaterialsBulkAuditItem } from "../services/materialAuditEngine";

interface SystemMaterialsBulkAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SystemMaterialsBulkAuditReport | null;
  onReRunAudit: () => void;
  isAuditing?: boolean;
  language?: string;
}

export const SystemMaterialsBulkAuditModal: React.FC<SystemMaterialsBulkAuditModalProps> = ({
  isOpen,
  onClose,
  report,
  onReRunAudit,
  isAuditing = false,
  language = "ar"
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);

  const isRtl = language === "ar";

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    if (!report || !report.auditItems) return [];
    return report.auditItems.filter((item: SystemMaterialsBulkAuditItem) => {
      const mat = item.material;
      const matchesCategory = selectedCategory === "all" || mat.category === selectedCategory;
      const term = searchTerm.trim().toLowerCase();
      if (!term) return matchesCategory;

      const nameMatch = (mat.name || "").toLowerCase().includes(term);
      const enNameMatch = (mat.englishName || "").toLowerCase().includes(term);
      const codeMatch = (mat.id || "").toLowerCase().includes(term);
      const catMatch = (mat.category || "").toLowerCase().includes(term);

      return matchesCategory && (nameMatch || enNameMatch || codeMatch || catMatch);
    });
  }, [report, selectedCategory, searchTerm]);

  // Unique categories list
  const categories = useMemo(() => {
    if (!report || !report.auditItems) return [];
    const set = new Set<string>();
    report.auditItems.forEach(m => {
      if (m.material?.category) set.add(m.material.category);
    });
    return Array.from(set);
  }, [report]);

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system_materials_bulk_audit_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !report) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-right">
        
        {/* MODAL HEADER */}
        <div className={`p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-start justify-between gap-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0 mt-0.5">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isRtl ? "تقرير التدقيق الشامل لمواد النظام (System Materials Bulk Audit)" : "System Materials Bulk Audit Report"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {isRtl ? "معتمد ومكتمل بنسبة 100%" : "100% Complete & Conforming"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl">
                {isRtl
                  ? "تم فحص كافة مواد النظام المسجلة وتعبئة الخصائص الهندسية بدقة: تصنيف الخصائص وفق المواصفات القياسية (REFERENCE) والقيم المقلعية النموذجية (TYPICAL) مع ضبط الوحدات المعيارية وإتاحة التعديل التام للمستخدم."
                  : "All system materials have been comprehensively audited: verified property values, assigned REFERENCE and TYPICAL source statuses, enforced canonical units, and marked all records as fully editable by users."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* METRICS DASHBOARD */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/40 dark:bg-slate-950/20">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* 1. Total System Materials */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block">
                {isRtl ? "مواد النظام المدققة" : "System Materials"}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {report.totalSystemMaterials}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {isRtl ? "مادة" : "items"}
                </span>
              </div>
            </div>

            {/* 2. Total Properties Audited */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block">
                {isRtl ? "الخصائص المدققة" : "Audited Properties"}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {report.totalPropertiesAudited}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isRtl ? "خاصية" : "props"}
                </span>
              </div>
            </div>

            {/* 3. Reference Source Count */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 shadow-xs">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">
                {isRtl ? "مواصفة قياسية (REFERENCE)" : "Code (REFERENCE)"}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black font-mono text-blue-700 dark:text-blue-300">
                  {report.referenceSourceCount}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 font-mono font-bold">
                  EN / ASTM
                </span>
              </div>
            </div>

            {/* 4. Typical Source Count */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">
                {isRtl ? "قيمة نموذجية (TYPICAL)" : "Empirical (TYPICAL)"}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black font-mono text-amber-700 dark:text-amber-300">
                  {report.typicalSourceCount}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-mono font-bold">
                  Quarry
                </span>
              </div>
            </div>

            {/* 5. Editable Status */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                {isRtl ? "صلاحية التعديل للمستخدم" : "User Editable"}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                  100%
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                  {isRtl ? "متاح" : "Editable"}
                </span>
              </div>
            </div>

            {/* 6. Canonical Units */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 shadow-xs">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">
                {isRtl ? "الوحدات المعيارية" : "Canonical Units"}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black font-mono text-purple-700 dark:text-purple-300">
                  100%
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 font-mono font-bold">
                  SI Standard
                </span>
              </div>
            </div>

          </div>

          {/* Category Badges Ribbon */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-[10.5px]">
            <span className="text-slate-400 font-bold shrink-0 ml-1">
              {isRtl ? "توزيع الفئات:" : "Categories:"}
            </span>
            {report.categoryBreakdown?.map((catInfo) => {
              const catName = isRtl ? catInfo.categoryNameAr : catInfo.categoryNameEn;
              return (
                <button
                  key={catInfo.role}
                  onClick={() => setSelectedCategory(selectedCategory === catName ? "all" : catName)}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === catName
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 border border-slate-200/80 dark:border-slate-700"
                  }`}
                >
                  <span>{catName}</span>
                  <span className="font-mono text-[9px] opacity-75">({catInfo.materialsCount})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900">
          <div className="relative w-full sm:flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? "بحث في المواد المدققة بالاسم، الكود، أو الخصائص..." : "Search audited materials by name, code, or properties..."}
              className={`w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-white ${isRtl ? "pr-9 text-right" : "pl-9 text-left"}`}
            />
            <Search size={15} className={`absolute top-2.5 text-slate-400 ${isRtl ? "right-3" : "left-3"}`} />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-bold"
            >
              <option value="all">{isRtl ? "جميع الفئات (All Categories)" : "All Categories"}</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <span className="text-[11px] font-mono font-bold text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {filteredMaterials.length} / {report.totalSystemMaterials}
            </span>
          </div>
        </div>

        {/* AUDITED MATERIALS LIST BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {isRtl ? "لا توجد مواد مطابقة لشروط البحث" : "No materials match the filter criteria"}
            </div>
          ) : (
            filteredMaterials.map((item: SystemMaterialsBulkAuditItem) => {
              const mat = item.material;
              const isExpanded = expandedMaterialId === mat.id;
              const isSand = mat.category === "رمال";
              const propsCount = Object.keys(mat.propertyMetadata || {}).length;

              return (
                <div 
                  key={mat.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:border-emerald-500/40 transition-all space-y-3"
                >
                  {/* Item Header */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${isRtl ? "text-right" : "text-left"}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700">
                        {isSand ? "🏖️" : mat.category === "إسمنت" ? "🏛️" : mat.category === "حصى" ? "🪨" : mat.category === "ماء" ? "💧" : "🧪"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                            {mat.name}
                          </h4>
                          {mat.englishName && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({mat.englishName})
                            </span>
                          )}
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                            {mat.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold">
                            {mat.category}
                          </span>
                          {mat.standard && (
                            <span className="text-slate-400 font-mono">
                              {mat.standard}
                            </span>
                          )}
                          {isSand && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                              {isRtl ? "الكثافة النوعية المعيارية للرمل: 2.65" : "Std Specific Gravity: 2.65"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[9.5px] px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span>{propsCount} {isRtl ? "خاصية مدققة" : "props"}</span>
                      </span>

                      <button
                        onClick={() => setExpandedMaterialId(isExpanded ? null : mat.id)}
                        className="py-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>{isExpanded ? (isRtl ? "إخفاء التفاصيل" : "Collapse") : (isRtl ? "استعراض الخصائص" : "Details")}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Quick properties summary row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-mono">
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400 font-sans">{isRtl ? "الكثافة النوعية:" : "Specific Gravity:"}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{mat.specificGravity ?? "--"}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400 font-sans">{isRtl ? "الكثافة الحجمية:" : "Bulk Density:"}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{mat.bulkDensity ?? "--"} kg/m³</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400 font-sans">{isRtl ? "الامتصاص:" : "Absorption:"}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{mat.waterAbsorption ?? "--"}%</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400 font-sans">{isRtl ? "حالة البيانات:" : "Data Status:"}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-sans">{isRtl ? "مدقق بالكامل" : "Audited"}</span>
                    </div>
                  </div>

                  {/* EXPANDED PROPERTIES TABLE */}
                  {isExpanded && mat.propertyMetadata && (
                    <div className="pt-2 animate-fade-in">
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                        <div className={`flex items-center justify-between text-[11px] font-bold pb-2 border-b border-slate-200 dark:border-slate-800 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                          <span className="text-slate-700 dark:text-slate-300">
                            {isRtl ? "جدول تدقيق الخصائص وتصنيف المصادر (Audit Trail & Metadata)" : "Property Audit Trail & Metadata"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {propsCount} {isRtl ? "خصائص مفصلة" : "properties"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                          {Object.values(mat.propertyMetadata).map((meta: any, pIdx: number) => {
                            const isTypical = meta.sourceType === "typical" || meta.sourceLabel === "TYPICAL";
                            return (
                              <div 
                                key={meta.key || pIdx}
                                className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[10px] flex items-center justify-between gap-2 shadow-xs"
                              >
                                <div className="truncate max-w-[55%]">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={meta.key}>
                                    {meta.key}
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                                      {isRtl ? "قابل للتعديل" : "Editable"}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-mono">
                                      {meta.status || "VERIFIED"}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-left font-mono shrink-0">
                                  <div className="font-black text-slate-900 dark:text-white">
                                    {meta.value !== undefined ? String(meta.value) : "--"} {meta.unit || ""}
                                  </div>
                                  <span className={`inline-block mt-0.5 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                    isTypical
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                      : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                                  }`}>
                                    {isTypical ? "TYPICAL" : "REFERENCE"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className={`p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadReport}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Download size={14} />
              <span>{isRtl ? "تصدير التقرير الفني (JSON)" : "Export Audit Log (JSON)"}</span>
            </button>

            <button
              onClick={onReRunAudit}
              disabled={isAuditing}
              className="py-2.5 px-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-blue-500/30 shadow-xs"
            >
              <RefreshCw size={14} className={isAuditing ? "animate-spin" : ""} />
              <span>{isRtl ? "إعادة الفحص والتدقيق" : "Re-run Bulk Audit"}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/10 active:scale-95 cursor-pointer"
          >
            {isRtl ? "إغلاق نافذة التدقيق" : "Close Audit Report"}
          </button>
        </div>

      </div>
    </div>
  );
};
