import React, { useState, useMemo } from "react";
import { 
  X, 
  Search, 
  FileText, 
  Download, 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  ShieldCheck, 
  Building2, 
  Layers,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { downloadMaterialDossierPdf } from "../../services/pdf";

interface MaterialDossierSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: EngineeringMaterial[];
  tests: MaterialTestRecord[];
  onSelectMaterial: (material: EngineeringMaterial) => void;
  onRunTestForMaterial: (material: EngineeringMaterial) => void;
  language?: "ar" | "fr" | "en";
}

export const MaterialDossierSelectorModal: React.FC<MaterialDossierSelectorModalProps> = ({
  isOpen,
  onClose,
  materials = [],
  tests = [],
  onSelectMaterial,
  onRunTestForMaterial,
  language = "ar"
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(materials.map(m => m.category || "عام"));
    return ["all", ...Array.from(cats)];
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchCat = m.category?.toLowerCase().includes(q);
        const matchId = m.id?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchId) return false;
      }
      return true;
    });
  }, [materials, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleQuickDownloadPdf = async (mat: EngineeringMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloadingId(mat.id);
      const matTests = tests.filter(
        t => t.materialId === mat.id || 
             (t.materialName && mat.name && t.materialName.toLowerCase().includes(mat.name.toLowerCase()))
      );
      await downloadMaterialDossierPdf(mat, matTests, {
        language: language === "ar" ? "ar" : "fr",
        includeSignatures: true
      });
    } catch (err) {
      console.error("Failed to download PDF for material:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh]"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === "ar" ? "التقارير والملفات الأكاديمية الشاملة لمواد المكتبة" : "Comprehensive Academic Material Dossiers"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر أي مادة لعرض ملف التوصيف الشامل، سجل التجارب المخبرية، وتحميل التقرير الأكاديمي (PDF)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن مادة بالاسم أو التصنيف أو الكود..."
              className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {cat === "all" ? "جميع المواد" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Material Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد مواد مطابقة للبحث</h4>
              <p className="text-xs text-slate-400">جرّب تغيير كلمات البحث أو التصنيف المحدد</p>
            </div>
          ) : (
            filteredMaterials.map(mat => {
              const matTests = tests.filter(
                t => t.materialId === mat.id || 
                     (t.materialName && mat.name && t.materialName.toLowerCase().includes(mat.name.toLowerCase()))
              );
              const isTested = matTests.length > 0;
              const passedCount = matTests.filter(t => t.status === "PASS").length;

              return (
                <div
                  key={mat.id}
                  onClick={() => {
                    onSelectMaterial(mat);
                    onClose();
                  }}
                  className="group p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {mat.category || "عام"}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {mat.name}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-400">
                        ({mat.id})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {mat.density !== undefined && (
                        <span>الكثافة: <strong className="text-slate-800 dark:text-slate-200 font-mono">{mat.density} t/m³</strong></span>
                      )}
                      {mat.absorption !== undefined && (
                        <span>• الامتصاص: <strong className="text-slate-800 dark:text-slate-200 font-mono">{mat.absorption}%</strong></span>
                      )}
                      <span>
                        • الحالة:{" "}
                        <strong className={isTested ? "text-emerald-600" : "text-slate-400"}>
                          {isTested ? `${matTests.length} فحص (${passedCount} مطابق)` : "بانتظار الفحص"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunTestForMaterial(mat);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>إجراء فحص</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleQuickDownloadPdf(mat, e)}
                      disabled={downloadingId === mat.id}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-600 dark:hover:text-white transition-all cursor-pointer disabled:opacity-50"
                      title="تحميل التقرير الأكاديمي (PDF)"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض التقرير الشامل</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center text-xs text-slate-500">
          <span>إجمالي المواد المتاحة: {materials.length} مادة</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
