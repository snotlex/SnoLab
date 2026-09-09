import React, { useState } from "react";
import { 
  HardDrive, 
  FolderOpen, 
  Save, 
  FilePlus, 
  ShieldCheck, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Layers, 
  FlaskConical, 
  Sliders, 
  Clock, 
  Hash, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  User, 
  Building2, 
  MapPin, 
  RefreshCw,
  Edit3,
  Check,
  Plus
} from "lucide-react";
import { useProjectStorage } from "../services/storage/ProjectContext";
import { useLanguage } from "../services/localization";
import { ProjectFileManagerModal } from "./ProjectFileManagerModal";

interface LocalProjectVaultProps {
  onLoadMixToCalculator?: (inputs: any, results?: any) => void;
}

export const LocalProjectVault: React.FC<LocalProjectVaultProps> = ({
  onLoadMixToCalculator
}) => {
  const { 
    project, 
    fileName, 
    saveStatus, 
    hasUnsavedChanges, 
    lastSavedAt,
    createNewProject, 
    openProject, 
    saveProject, 
    saveProjectAs, 
    backupProject, 
    exportProject, 
    importProjectFile,
    updateProjectMetadata,
    updateNotes,
    deleteNamedMix,
    isNativeFsSupported
  } = useProjectStorage();

  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<"overview" | "mixes" | "notes" | "audit">("overview");
  const [modalMode, setModalMode] = useState<"new" | "properties" | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<"general" | "site" | "lab">("general");
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  const handleCreateBackup = async () => {
    try {
      const name = await backupProject();
      setBackupSuccess(name);
      setTimeout(() => setBackupSuccess(null), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote = {
      id: `note_${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      category: newNoteCategory,
      author: project.metadata.engineer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateNotes([newNote, ...(project.notes || [])]);
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const handleDeleteNote = (noteId: string) => {
    updateNotes((project.notes || []).filter(n => n.id !== noteId));
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".snlab,.json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        await importProjectFile(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="local-project-vault-panel">
      {/* 1. Main Project Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-6 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                {language === "ar" ? "ملف المشروع المحلي الفعّال (.snlab)" : "Active Local Project File (.snlab)"}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Schema v{project.schemaVersion}
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{project.metadata.name}</span>
            </h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {project.metadata.engineer || "Engineer"}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {project.metadata.client || "Client"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.metadata.location || "Site"}
              </span>
              <span className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
                {fileName}
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={saveProject}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                hasUnsavedChanges
                  ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{language === "ar" ? "حفظ التعديلات (Ctrl+S)" : "Save Project (Ctrl+S)"}</span>
            </button>

            <button
              onClick={() => saveProjectAs()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Copy className="w-4 h-4" />
              <span>{language === "ar" ? "حفظ باسم..." : "Save As..."}</span>
            </button>

            <button
              onClick={() => openProject()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <FolderOpen className="w-4 h-4" />
              <span>{language === "ar" ? "فتح (.snlab)..." : "Open..."}</span>
            </button>

            <button
              onClick={() => setModalMode("new")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              <FilePlus className="w-4 h-4" />
              <span>{language === "ar" ? "مشروع جديد" : "New"}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 border-t border-slate-800/80 pt-4 text-center">
          <div>
            <span className="text-[11px] text-slate-400 block">{language === "ar" ? "المواد المعايرة" : "Calibrated Materials"}</span>
            <span className="font-mono text-lg font-bold text-emerald-400">{project.materials?.length || 0}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">{language === "ar" ? "سجلات الاختبارات" : "Lab Test Records"}</span>
            <span className="font-mono text-lg font-bold text-amber-400">{project.laboratoryTests?.length || 0}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">{language === "ar" ? "صيغ الخلط المحفوظة" : "Saved Mix Formulas"}</span>
            <span className="font-mono text-lg font-bold text-blue-400">
              {(project.mixDesigns?.savedMixes?.length || 0) + (project.mixDesigns?.versions?.length || 0)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">{language === "ar" ? "حالة التزامن المحلي" : "Storage Mode"}</span>
            <span className="font-sans text-xs font-bold text-indigo-300 block truncate mt-1">
              {isNativeFsSupported ? "Direct FS Access" : "Browser Storage"}
            </span>
          </div>
        </div>
      </div>

      {backupSuccess && (
        <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between border border-emerald-300 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === "ar" ? `تم إنشاء النسخة الاحتياطية بنجاح: ${backupSuccess}` : `Backup created: ${backupSuccess}`}</span>
          </div>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "overview"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{language === "ar" ? "نظرة عامة والعمليات" : "Overview & Operations"}</span>
        </button>

        <button
          onClick={() => setActiveTab("mixes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "mixes"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{language === "ar" ? "صيغ الخلطات المحفوظة" : "Saved Mix Formulas"}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono">
            {project.mixDesigns?.savedMixes?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "notes"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{language === "ar" ? "الملاحظات والتعليمات" : "Engineering Notes"}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono">
            {project.notes?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "audit"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{language === "ar" ? "سجل التدقيق والتاريخ" : "Audit Trail"}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono">
            {project.history?.length || 0}
          </span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 & 2: Local File System Operations */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  <span>{language === "ar" ? "إدارة وتصدير ملف المشروع المحلي" : "Project File Storage Operations"}</span>
                </h3>
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase">LOCAL-FIRST STORAGE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={saveProject}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800 transition text-start group"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "ar" ? "حفظ ملف المشروع" : "Save Project File"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {language === "ar" ? "حفظ كافة التعديلات مباشرة في الملف الحالي (.snlab)." : "Save all changes directly to the current .snlab file."}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => saveProjectAs()}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-300 dark:hover:border-teal-800 transition text-start group"
                >
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                    <Copy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "ar" ? "حفظ باسم (Save As)" : "Save As (.snlab)"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {language === "ar" ? "حفظ نسخة جديدة باسم وموقع مختلف على جهازك." : "Save a copy with a new name and destination on your disk."}
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleCreateBackup}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition text-start group"
                >
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "ar" ? "إنشاء نسخة احتياطية (Backup)" : "Create Instant Backup"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {language === "ar" ? "توليد نسخة احتياطية فورية مؤرخة زمنياً لحماية البيانات." : "Generate a timestamped safety backup file."}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => exportProject()}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-800 transition text-start group"
                >
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "ar" ? "تصدير الملف (.snlab)" : "Export Project File"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {language === "ar" ? "تنزيل ملف المشروع لمشاركته مع مهندس آخر أو نقله." : "Download project file to share or transfer."}
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleImportClick}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 dark:hover:border-amber-800 transition text-start group"
                >
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "ar" ? "استيراد ملف مشروع" : "Import Project File"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {language === "ar" ? "فتح واستيراد أي ملف .snlab أو .json من جهازك." : "Open and load any .snlab or .json file from your machine."}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setModalMode("properties")}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:border-cyan-300 dark:hover:border-cyan-800 transition text-start group"
                >
                  <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "ar" ? "خصائص ومعلومات المشروع" : "Project Properties"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {language === "ar" ? "تعديل اسم المشروع، الموقع، المهندس والعميل." : "Edit project metadata, engineer, client, and location."}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Column 3: Storage Engine & Integrity Specs */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === "ar" ? "مواصفات نظام التخزين المحلي" : "Storage Architecture"}
                </h4>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Local-First Privacy: </span>
                    {language === "ar" ? "بياناتك ملكك بالكامل ولا يتم إرسالها إلى أي قاعدة بيانات سحابية مدفوعة." : "Your data is completely yours and never uploaded to third-party cloud databases."}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Schema Versioning: </span>
                    {language === "ar" ? `هيكل موثق بإصدار v${project.schemaVersion} يضمن التوافق المستقبلي.` : `Standardized schema v${project.schemaVersion} for backward compatibility.`}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Crash Protection: </span>
                    {language === "ar" ? "نسخ دوري في IndexedDB يمنع فقدان البيانات عند إغلاق المتصفح." : "IndexedDB session recovery prevents data loss on accidental browser closure."}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Universal Web Compatibility: </span>
                    {language === "ar" ? "يعمل بكفاءة عبر File System Access API مع تنزيل/رفع قياسي كبديل." : "Supports native File System Access API with standard upload/download fallback."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "mixes" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === "ar" ? "صيغ الخلطات والتركيبات المحفوظة في ملف المشروع" : "Mix Formulas Stored in This Project File"}
              </h3>
            </div>
          </div>

          {(!project.mixDesigns?.savedMixes || project.mixDesigns.savedMixes.length === 0) ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Sliders className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm">{language === "ar" ? "لا توجد صيغ خلطات مسجلة بعد في هذا المشروع." : "No saved mix formulas in this project yet."}</p>
              <p className="text-xs text-slate-500">{language === "ar" ? "يمكنك حفظ أي خلطة من نافذة حاسبة الخرسانة." : "Save any mix formulation from the Calculator tab."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.mixDesigns.savedMixes.map((mix) => (
                <div 
                  key={mix.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:border-blue-400 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{mix.name}</h4>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {new Date(mix.date).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteNamedMix(mix.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                      title={language === "ar" ? "حذف الصيغة" : "Delete Formula"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">fck28</span>
                      <span className="font-mono font-bold text-blue-500">{mix.inputs.fck28} MPa</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Slump</span>
                      <span className="font-mono font-bold text-amber-500">{mix.inputs.slump} cm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Method</span>
                      <span className="font-sans font-bold text-emerald-500 uppercase">{mix.inputs.selectedMethod || "dreux"}</span>
                    </div>
                  </div>

                  {onLoadMixToCalculator && (
                    <button
                      onClick={() => onLoadMixToCalculator(mix.inputs, mix.results)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === "ar" ? "تحميل في بيئة الحساب" : "Load into Workspace"}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === "ar" ? "الملاحظات الهندسية المحفوظة مع ملف المشروع" : "Project Engineering Notes"}
              </h3>
            </div>
          </div>

          {/* New Note Form */}
          <form onSubmit={handleAddNote} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder={language === "ar" ? "عنوان الملاحظة الهندسية..." : "Note Title..."}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={newNoteCategory}
                  onChange={(e: any) => setNewNoteCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                >
                  <option value="general">{language === "ar" ? "عامة (General)" : "General"}</option>
                  <option value="site">{language === "ar" ? "موقع الصب (Site)" : "Site"}</option>
                  <option value="lab">{language === "ar" ? "المخبر (Laboratory)" : "Lab"}</option>
                </select>
              </div>
            </div>

            <textarea
              rows={2}
              required
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder={language === "ar" ? "نص الملاحظة أو التعليمات الفنية المرفقة بالملف..." : "Engineering notes or technical observations..."}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "إضافة ملاحظة للمشروع" : "Add Note"}</span>
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3">
            {(!project.notes || project.notes.length === 0) ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                {language === "ar" ? "لا توجد ملاحظات مرفقة حالياً." : "No notes attached to this project file."}
              </div>
            ) : (
              project.notes.map((note) => (
                <div 
                  key={note.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase">
                        {note.category || "general"}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{note.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === "ar" ? "سجل التدقيق والتاريخ الفني للعمليات (.snlab Audit Trail)" : "Project Audit Trail & Chronology"}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              {project.history?.length || 0} EVENTS
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {(!project.history || project.history.length === 0) ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {language === "ar" ? "لا توجد سجلات أحداث بعد." : "No audit trail records yet."}
              </div>
            ) : (
              project.history.map((entry) => (
                <div 
                  key={entry.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{entry.action}</span>
                      {entry.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {entry.category}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                      {entry.details || "Action executed"}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {modalMode && (
        <ProjectFileManagerModal
          mode={modalMode}
          isOpen={true}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
};
