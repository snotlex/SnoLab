import React, { useState } from "react";
import { MixVersion, ActiveProject, MixDesignInput, MixDesignResult } from "../types";
import { 
  History, 
  Save, 
  Trash2, 
  RefreshCw, 
  GitCompare, 
  TrendingDown, 
  CheckCircle2, 
  Layers, 
  AlertTriangle 
} from "lucide-react";

interface MixVersioningPanelProps {
  activeProject: ActiveProject;
  inputs: MixDesignInput;
  results: MixDesignResult;
  onSaveVersion: (name: string, isOptimized?: boolean) => void;
  onRestoreVersion: (version: MixVersion) => void;
  onDeleteVersion: (versionId: string) => void;
}

export const MixVersioningPanel: React.FC<MixVersioningPanelProps> = ({
  activeProject,
  inputs,
  results,
  onSaveVersion,
  onRestoreVersion,
  onDeleteVersion,
}) => {
  const [versionName, setVersionName] = useState("");
  const [selectedVersionsToCompare, setSelectedVersionsToCompare] = useState<string[]>([]);

  const versions = activeProject.mixVersions || [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionName.trim()) return;
    onSaveVersion(versionName.trim());
    setVersionName("");
  };

  const handleToggleCompare = (id: string) => {
    setSelectedVersionsToCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(vId => vId !== id);
      }
      if (prev.length >= 3) {
        // limit to max 3 versions for layout spacing
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const comparedItems = versions.filter(v => selectedVersionsToCompare.includes(v.id));

  return (
    <div className="space-y-6" id="mix-versioning-dashboard">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-205 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-right" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#6366F1] font-bold uppercase block mb-1">
              VERSIONING & HISTORICAL SNAPSHOTS
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
              <History className="text-[#6366F1]" size={20} />
              <span>إدارة ومقارنة إصدارات الخلطات الخرسانية</span>
            </h3>
          </div>

          {/* Quick instructions */}
          <span className="text-xs text-slate-450 dark:text-slate-500 max-w-md font-sans leading-relaxed">
            تتيح هذه اللوحة للمهندسين السير في عملية تجريبية متعاقبة، حيث يمكن حفظ الإعدادات الحالية بأسماء مختلفة (مثل: مسودة 1، خلطة اقتصادية، إلخ) ومقارنتها جنباً إلى جنب لرصد الفروق الفنية والمالية.
          </span>
        </div>

        {/* Action: Save current state as version */}
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 rounded-2xl p-4">
          <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-3 items-end justify-between">
            <div className="w-full md:w-3/4 space-y-1.5 text-right">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                أدخل اسماً لحفظ النسخة الحالية من خلطة المشروع:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder='مثال: "نسخة fck 30 - عيار 400" أو "الخلطة المحسنة اقتصادياً"'
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-right pr-9"
                />
                <Save className="absolute right-3 top-3 text-slate-400" size={16} />
              </div>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs min-w-[150px] transition-colors shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save size={15} />
              <span>حفظ كإصدار جديد</span>
            </button>
          </form>
        </div>

        {/* Existing Versions list */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6366F1] font-mono font-bold">
              {versions.length} SAVED VERSIONS FOR {activeProject.name}
            </span>
            <h4 className="text-sm font-black text-slate-850 dark:text-slate-150">إصدارات الخلطات المحفوظة</h4>
          </div>

          {versions.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-450 dark:text-slate-550 space-y-2">
              <Layers className="mx-auto text-slate-300 dark:text-slate-700" size={32} />
              <p className="text-xs font-bold font-sans">لم يتم تسجيل أي إصدارات سابقة بعد لمشروع {activeProject.name}.</p>
              <p className="text-[10px] text-slate-400">يرجى كتابة اسم الإصدار أعلاه وحفظ حالتك الأولى لمباشرة التعقب المقارن!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {versions.map((ver) => {
                const isSelected = selectedVersionsToCompare.includes(ver.id);
                const resultsCopy = ver.results;

                return (
                  <div
                    key={ver.id}
                    className={`border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/10 dark:bg-blue-950/10 ring-1 ring-blue-500"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
                    }`}
                  >
                    <div className="space-y-2 text-right">
                      {/* Name & Badge */}
                      <div className="flex justify-between items-start gap-2 flex-row-reverse">
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white text-right leading-tight">
                          {ver.name}
                        </h5>
                        {ver.isOptimized && (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded font-mono">
                            OPTIMIZED
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono">
                        {ver.date}
                      </div>

                      {/* Quick Tech Metrics */}
                      <div className="border-t border-dashed border-slate-150 dark:border-slate-800 pt-2 grid grid-cols-2 gap-2 text-right font-sans">
                        <div>
                          <span className="text-[9px] text-slate-450 block">المقاومة fck (28j):</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-205 font-mono">
                            {ver.inputs.fck28} MPa
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-450 block">مجهود الإسمنت:</span>
                          <span className="text-xs font-black text-blue-600 font-mono">
                            {ver.inputs.cementTypeKey === "cem_custom" ? ver.inputs.dosageSlag : (ver.inputs.priceCement ? Math.round(ver.inputs.priceCement) : 400)} كغ
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-450 block">التشغيلية / الانزلاق:</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-205 font-mono">
                            {ver.inputs.slump} سم
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-450 block">التكلفة الإجمالية:</span>
                          <span className="text-xs font-black text-indigo-600 font-mono">
                            {resultsCopy?.mixCostTotal ? `${Math.round(resultsCopy.mixCostTotal)} دج` : "---"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onDeleteVersion(ver.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="حذف هذا الرصيد التاريخي"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCompare(ver.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
                          }`}
                        >
                          <GitCompare size={12} />
                          <span>{isSelected ? "مشمول بالدراسة" : "حدد للمقارنة"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRestoreVersion(ver)}
                          className="px-2.5 py-1.5 rounded-xl text-[10.5px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={12} />
                          <span>استعادة المعايير</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Drawer / Side-by-Side Matrix */}
      {comparedItems.length > 0 && (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-210 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-right" dir="rtl" id="comparison-analysis-panel">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-600 uppercase font-black">
              COMPARISON DASHBOARD VIEW {comparedItems.length}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
              <GitCompare size={18} className="text-[#6366F1]" />
              <span>جدول المقارنة التفصيلي (Side-by-Side Analysis)</span>
            </h4>
          </div>

          <p className="text-xs text-slate-500 font-sans">
            يرجى مراجعة المعطيات الرقمية المفارقة بين الإصدارات المختارة. تبرز الفروق الكتلية وحسابات Dreux-Gorisse وتفاوت نسب الكلفة الإجمالية في الجزائر لكل متر مكعب.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-350 font-black border-y border-slate-200 dark:border-slate-800">
                  <th className="p-3 text-right">أوجه المقارنة والمعاملات الهندسية</th>
                  {comparedItems.map((v) => (
                    <th key={v.id} className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                      {v.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 leading-relaxed">
                {/* 1. Target Strength */}
                <tr>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200 text-right">مقاومة الضغط fck (MPa)</td>
                  {comparedItems.map((v) => (
                    <td key={v.id} className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                      {v.inputs.fck28} MPa
                    </td>
                  ))}
                </tr>

                {/* 2. Cohesion / Slump */}
                <tr>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-300 text-right font-sans">هبوط الخرسانة المستهدف (Slump)</td>
                  {comparedItems.map((v) => (
                    <td key={v.id} className="p-3 text-center font-mono border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                      {v.inputs.slump} سم
                    </td>
                  ))}
                </tr>

                {/* 3. Cement Amount */}
                <tr>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-300 text-right">مقدار الإسمنت للمتر المكعب (كغ)</td>
                  {comparedItems.map((v) => {
                    const cWeight = v.results?.cementWeight || 400;
                    return (
                      <td key={v.id} className="p-3 text-center font-mono font-black text-blue-600 border-r border-slate-200 dark:border-slate-800">
                        {Math.round(cWeight)} كغ/م³
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Water / Cement ratio */}
                <tr>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-300 text-right">نسبة المياه لكيميائيات الإسمنت (W/C)</td>
                  {comparedItems.map((v) => {
                    const wc = v.results?.wcRatioActual || 0.45;
                    return (
                      <td key={v.id} className="p-3 text-center font-mono font-extrabold text-[#6366F1] border-r border-slate-200 dark:border-slate-800">
                        {wc.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>

                {/* 5. Sand component */}
                <tr>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-300 text-right font-sans">الرمل الناعم الفعلي (Sand)</td>
                  {comparedItems.map((v) => (
                    <td key={v.id} className="p-3 text-center font-mono text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                      {v.results ? Math.round(v.results.sandWeight) : "---"} كغ/م³
                    </td>
                  ))}
                </tr>

                {/* 6. Coarse Gravel */}
                <tr>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-300 text-right">الحصى والركام الخشن الإجمالي</td>
                  {comparedItems.map((v) => (
                    <td key={v.id} className="p-3 text-center font-mono text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                      {v.results ? Math.round(v.results.gravelWeight || v.results.gravelWeightActual) : "---"} كغ/م³
                    </td>
                  ))}
                </tr>

                {/* 7. Total Cost */}
                <tr className="bg-indigo-50/20 dark:bg-indigo-950/20 font-black">
                  <td className="p-3 font-black text-slate-900 dark:text-white text-right">التكلفة التقديرية الكلية للصب (دج / م³)</td>
                  {comparedItems.map((v) => (
                    <td key={v.id} className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm border-r border-slate-200 dark:border-slate-800">
                      {v.results?.mixCostTotal ? `${Math.round(v.results.mixCostTotal)} دج` : "---"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
