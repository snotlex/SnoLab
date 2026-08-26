import React, { useState } from "react";
import { 
  X, 
  FlaskConical, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  Layers,
  History,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Award,
  Check,
  Ban,
  Clock
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { 
  MaterialTestRecord, 
  TestApprovalStatus,
  MaterialPropertySource,
  MaterialPropertyHistoryEntry
} from "../../types/laboratoryTypes";
import { TestReportModal } from "./TestReportModal";
import { 
  getMaterialPropertyProvenance, 
  PROPERTY_LABELS,
  applyTestToMaterial
} from "../../services/materialLabSync";

interface MaterialLabHistoryModalProps {
  material: EngineeringMaterial | null;
  tests: MaterialTestRecord[];
  onClose: () => void;
  onRunNewTestForMaterial: (material: EngineeringMaterial) => void;
  onSyncPropertyToMaterial?: (materialId: string, updatedProps: Record<string, any>) => void;
  onUpdateTestStatus?: (testId: string, newStatus: TestApprovalStatus) => void;
}

export const MaterialLabHistoryModal: React.FC<MaterialLabHistoryModalProps> = ({
  material,
  tests,
  onClose,
  onRunNewTestForMaterial,
  onSyncPropertyToMaterial,
  onUpdateTestStatus
}) => {
  const [selectedReportTest, setSelectedReportTest] = useState<MaterialTestRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"PROPERTIES" | "SIEVE" | "TESTS" | "AUDIT">("PROPERTIES");
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

  if (!material) return null;

  // Filter all tests conducted on this material (by ID or matching name)
  const materialTests = tests.filter(
    t => t.materialId === material.id || (t.materialName && t.materialName.toLowerCase().includes(material.name.toLowerCase()))
  );

  // Collect all properties present on this material
  const propertyKeysToCheck = [
    "absorption",
    "moisture",
    "density",
    "ssdDensity",
    "bulkDensity",
    "finenessModulus",
    "dMax",
    "sandEquivalent",
    "foisonnement",
    "losAngelesAbrasion",
    "microDeval",
    "clayContent",
    "methyleneBlue",
    "flakinessIndex",
    "blaineFineness",
    "strength2d",
    "strength28d",
    "initialSetting",
    "finalSetting",
    "solidContent",
    "waterReduction",
    "recommendedDosage",
    "pozzolanicIndex",
    "waterDemandFactor",
    "tensileStrength",
    "fiberLength",
    "pH",
    "chlorides",
    "sulfates"
  ];

  const activeProperties = propertyKeysToCheck
    .map(key => ({ key, ...getMaterialPropertyProvenance(material, key) }))
    .filter(item => item.value !== undefined && item.value !== null && item.value !== "");

  // Collect Sieve data if available
  const sieveTest = materialTests.find(t => t.testType === "AGG_SIEVE" && (t.approvalStatus === "Validated" || t.status === "PASS")) ||
    materialTests.find(t => t.testType === "AGG_SIEVE");

  const sieveRows = material.sieveAnalysisDetail?.sieves || 
    (sieveTest?.results?.passingPercentages ? Object.entries(sieveTest.results.passingPercentages).map(([s, p]) => ({
      sieve: parseFloat(s),
      percentPassing: Number(p),
      percentRetained: 0,
      cumulativePercentRetained: Math.max(0, 100 - Number(p)),
      retainedWeight: 0
    })).sort((a, b) => b.sieve - a.sieve) : []);

  const handleValidateTest = (test: MaterialTestRecord) => {
    if (onUpdateTestStatus) {
      onUpdateTestStatus(test.id, "Validated");
    }
    const syncRes = applyTestToMaterial(material, { ...test, approvalStatus: "Validated" });
    if (onSyncPropertyToMaterial && material.id) {
      onSyncPropertyToMaterial(material.id, syncRes.updatedMaterial);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-right" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <FlaskConical size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {material.name}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                    {material.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  ربط وتوصيف الخصائص المخبرية الحقيقية وسجل التدقيق والتحقق (Single Source of Truth)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRunNewTestForMaterial(material)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow transition cursor-pointer"
              >
                <Plus size={14} />
                <span>إجراء فحص جديد</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-right" dir="rtl">
            <button
              onClick={() => setActiveTab("PROPERTIES")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "PROPERTIES"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Layers size={14} />
              <span>الخصائص المخبرية ومصدرها ({activeProperties.length})</span>
            </button>

            {(sieveRows.length > 0 || material.category === "رمال" || material.category === "حصى") && (
              <button
                onClick={() => setActiveTab("SIEVE")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "SIEVE"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <TrendingUp size={14} />
                <span>التحليل الحبيبي ومنحنى الغربلة (Sieve Analysis)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("TESTS")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "TESTS"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <FlaskConical size={14} />
              <span>الفحوصات المسجلة ({materialTests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("AUDIT")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "AUDIT"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <History size={14} />
              <span>سجل التغييرات والتدقيق (Property Audit Trail)</span>
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-right" dir="rtl">
            
            {/* TAB 1: PROPERTIES & SOURCES */}
            {activeTab === "PROPERTIES" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-semibold">
                    القيم الفعلية الحالية المعتمدة لحسابات Mix Design ومصدر كل خاصية هندسية:
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck size={13} />
                    <span>فقط النتائج المعتمدة (Validated) تغذي محرك الحسابات</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeProperties.map((prop) => {
                    const labelInfo = PROPERTY_LABELS[prop.key] || { ar: prop.key, fr: prop.key, unit: "" };
                    const isExpanded = expandedProperty === prop.key;

                    return (
                      <div
                        key={prop.key}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-300 dark:hover:border-blue-700 transition flex flex-col justify-between gap-2 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {labelInfo.ar}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {labelInfo.fr}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-mono text-base font-black text-blue-600 dark:text-blue-400">
                              {typeof prop.value === "object" ? "بيانات تفصيلية" : `${prop.value} ${labelInfo.unit}`}
                            </div>
                          </div>
                        </div>

                        {/* Provenance Badge */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              prop.badgeColor === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : prop.badgeColor === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : prop.badgeColor === "rose" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}>
                              {prop.isFromValidatedTest && <CheckCircle size={10} />}
                              <span>{prop.badgeTextAr}</span>
                            </span>

                            {prop.source?.testDate && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({prop.source.testDate})
                              </span>
                            )}
                          </div>

                          {prop.history.length > 0 && (
                            <button
                              onClick={() => setExpandedProperty(isExpanded ? null : prop.key)}
                              className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>السجل ({prop.history.length})</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                        </div>

                        {/* Expandable History Accordion */}
                        {isExpanded && prop.history.length > 0 && (
                          <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px] animate-fade-in">
                            <div className="font-bold text-slate-600 dark:text-slate-300 text-[10px]">
                              سجل القيم السابقة وتاريخ التحديث:
                            </div>
                            {prop.history.map((h, i) => (
                              <div key={h.id || i} className="flex items-center justify-between text-slate-500 py-1 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                                <div>
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {h.oldValue !== undefined ? `${h.oldValue} ${h.unit || ""}` : "قيمة أولية"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mx-1.5 font-mono">
                                    [{h.testId} • {h.testDate}]
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">{h.operator}</span>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: SIEVE ANALYSIS GRANULOMETRY */}
            {activeTab === "SIEVE" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-500" />
                    <span>بيانات التدرج الحبيبي وتحليل الغربلة (Sieve Gradation Results)</span>
                  </h4>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    {material.finenessModulus && (
                      <span className="px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                        معامل النعومة FM: {material.finenessModulus}
                      </span>
                    )}
                    {material.dMax && (
                      <span className="px-2.5 py-1 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold">
                        القطر الأقصى Dmax: {material.dMax} mm
                      </span>
                    )}
                  </div>
                </div>

                {sieveRows.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <TrendingUp size={32} className="mx-auto text-slate-400" />
                    <p className="text-xs text-slate-500">
                      لم يتم تسجيل فحص تحليل غربلة معتمد لهذه المادة بعد.
                    </p>
                    <button
                      onClick={() => onRunNewTestForMaterial(material)}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                    >
                      إجراء تحليل الغربلة (Sieve Analysis) الآن
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Sieve Table */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">فتحة الغربال (mm)</th>
                            <th className="py-2.5 px-3">الوزن المحجوز (g)</th>
                            <th className="py-2.5 px-3">المحجوز الجزئي (%)</th>
                            <th className="py-2.5 px-3">المحجوز التراكمي (%)</th>
                            <th className="py-2.5 px-3">المار التراكمي (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {sieveRows.map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {row.sieve} mm
                              </td>
                              <td className="py-2 px-3 font-mono">
                                {row.retainedWeight !== undefined ? `${row.retainedWeight} g` : "—"}
                              </td>
                              <td className="py-2 px-3 font-mono">
                                {row.percentRetained !== undefined ? `${row.percentRetained}%` : "—"}
                              </td>
                              <td className="py-2 px-3 font-mono font-semibold text-amber-600 dark:text-amber-400">
                                {row.cumulativePercentRetained !== undefined ? `${row.cumulativePercentRetained}%` : "—"}
                              </td>
                              <td className="py-2 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {row.percentPassing !== undefined ? `${row.percentPassing}%` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Granulometric Curve Visualizer */}
                    <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">المنحنى الحبيبي التراكمي للمادة (% Passing vs Sieve Size)</span>
                        <span className="text-[10px] text-slate-400 font-mono">EN 933-1 Semi-logarithmic view</span>
                      </div>
                      <div className="h-36 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-700">
                        {sieveRows.map((r: any, i: number) => {
                          const passing = r.percentPassing || 0;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                              <span className="text-[9px] font-mono text-emerald-400 font-bold">
                                {passing}%
                              </span>
                              <div
                                style={{ height: `${Math.max(4, passing)}%` }}
                                className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-blue-600 to-emerald-400 transition-all"
                              />
                              <span className="text-[9px] font-mono text-slate-400 truncate max-w-[32px]">
                                {r.sieve}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ALL TESTS LIST */}
            {activeTab === "TESTS" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FlaskConical size={16} className="text-blue-500" />
                    <span>كافة الفحوصات المخبرية المسجلة لهذه المادة ({materialTests.length})</span>
                  </h4>
                </div>

                {materialTests.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <FlaskConical size={32} className="mx-auto text-slate-400" />
                    <p className="text-xs text-slate-500">
                      لا توجد أي فحوصات مخبرية مسجلة لهذه المادة بعد.
                    </p>
                    <button
                      onClick={() => onRunNewTestForMaterial(material)}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                    >
                      بدء أول فحص مخبري لهذه المادة
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {materialTests.map((t) => {
                      const approval = t.approvalStatus || (t.status === "PASS" ? "Validated" : "Pending Review");

                      return (
                        <div
                          key={t.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-300 dark:hover:border-blue-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                {t.id}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {t.testTitleAr}
                              </span>
                              
                              {/* Approval Status Badge */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                approval === "Validated" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : approval === "Pending Review" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                : approval === "Draft" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                              }`}>
                                {approval === "Validated" && <CheckCircle size={10} />}
                                {approval === "Pending Review" && <Clock size={10} />}
                                {approval === "Rejected" && <Ban size={10} />}
                                <span>{approval === "Validated" ? "معتمد (Validated)" : approval === "Pending Review" ? "قيد المراجعة" : approval === "Draft" ? "مسودة" : "مرفوض"}</span>
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>التاريخ: {t.date}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                <span>المسؤول: {t.operator}</span>
                              </span>
                              <span>المعيار: {t.standard}</span>
                              <span className="font-mono text-indigo-500 font-bold">كود العينة: {t.sampleId}</span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                              {t.interpretation}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {approval !== "Validated" && (
                              <button
                                onClick={() => handleValidateTest(t)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow transition cursor-pointer"
                              >
                                <Check size={13} />
                                <span>اعتماد وربط بالمادة</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedReportTest(t)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                            >
                              <FileText size={13} />
                              <span>التقرير PDF</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AUDIT TRAIL */}
            {activeTab === "AUDIT" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History size={16} className="text-blue-500" />
                    <span>سجل التدقيق وتاريخ تعديل الخصائص (Property Modification Audit Trail)</span>
                  </h4>
                </div>

                {(!material.propertyHistory || Object.keys(material.propertyHistory).length === 0) ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <History size={32} className="mx-auto text-slate-400" />
                    <p className="text-xs text-slate-500">
                      لا يوجد سجل تعديلات سابقة حتى الآن. يتم حفظ وتوثيق القيم السابقة تلقائياً عند اعتماد فحوصات جديدة.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(material.propertyHistory).map(([propKey, entries]: [string, any]) => {
                      const labelInfo = PROPERTY_LABELS[propKey] || { ar: propKey, unit: "" };
                      return (
                        <div key={propKey} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2">
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{labelInfo.ar} ({propKey})</span>
                            <span className="text-[10px] text-slate-400 font-mono">{entries.length} تسجيلات</span>
                          </div>

                          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                            {entries.map((e: MaterialPropertyHistoryEntry, idx: number) => (
                              <div key={e.id || idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                      {e.oldValue !== undefined ? `${e.oldValue} ${e.unit || ""}` : "—"} ➔ {e.newValue} {e.unit || ""}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono">
                                      {e.testId}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                    <span>المعيار: {e.standard || "NF EN"}</span>
                                    <span>•</span>
                                    <span>العينة: {e.sampleId || "N/A"}</span>
                                  </div>
                                </div>

                                <div className="text-left text-[10px] text-slate-500 font-mono">
                                  <div>{e.testDate || e.timestamp?.slice(0, 10)}</div>
                                  <div>{e.operator}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Report Modal */}
      {selectedReportTest && (
        <TestReportModal
          testRecord={selectedReportTest}
          onClose={() => setSelectedReportTest(null)}
        />
      )}
    </>
  );
};
