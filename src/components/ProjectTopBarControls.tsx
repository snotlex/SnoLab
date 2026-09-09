import React, { useState } from "react";
import { 
  FolderOpen, 
  Save, 
  FilePlus, 
  Download, 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  FileText, 
  Info, 
  ChevronDown,
  HardDrive,
  Copy,
  ExternalLink
} from "lucide-react";
import { useProjectStorage } from "../services/storage/ProjectContext";
import { useLanguage } from "../services/localization";

interface ProjectTopBarControlsProps {
  onOpenProjectProperties: () => void;
  onOpenNewProjectModal: () => void;
}

export const ProjectTopBarControls: React.FC<ProjectTopBarControlsProps> = ({
  onOpenProjectProperties,
  onOpenNewProjectModal
}) => {
  const { 
    project, 
    fileName, 
    saveStatus, 
    hasUnsavedChanges, 
    lastSavedAt,
    saveProject, 
    saveProjectAs, 
    openProject, 
    backupProject,
    exportProject,
    importProjectFile,
    isNativeFsSupported
  } = useProjectStorage();

  const { language } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const backupName = await backupProject();
      setBackupSuccess(backupName);
      setTimeout(() => setBackupSuccess(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setBackupLoading(false);
    }
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
    setDropdownOpen(false);
  };

  return (
    <div className="flex items-center gap-2 relative">
      {/* File Dropdown Trigger & Current File Badge */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm text-sm font-medium text-slate-800 dark:text-slate-200"
          title={language === "ar" ? "قائمة ملف المشروع (.snlab)" : "Project File Menu (.snlab)"}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="max-w-[160px] sm:max-w-[200px] truncate font-mono text-xs sm:text-sm font-semibold">
            {fileName}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setDropdownOpen(false)} 
            />
            <div className="absolute top-full mt-1.5 start-0 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {language === "ar" ? "إدارة ملف المشروع المحلي" : "Local Project File System"}
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                  {project.metadata.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Format: .snlab (v{project.schemaVersion})
                </div>
              </div>

              {/* Action: New Project */}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenNewProjectModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition text-start"
              >
                <div className="flex items-center gap-2.5">
                  <FilePlus className="w-4 h-4 text-blue-500" />
                  <span>{language === "ar" ? "مشروع جديد..." : "New Project..."}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+N</span>
              </button>

              {/* Action: Open Project */}
              <button
                onClick={async () => {
                  setDropdownOpen(false);
                  await openProject();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition text-start"
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  <span>{language === "ar" ? "فتح ملف مشروع (.snlab)..." : "Open Project (.snlab)..."}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+O</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

              {/* Action: Save */}
              <button
                onClick={async () => {
                  setDropdownOpen(false);
                  await saveProject();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition text-start"
              >
                <div className="flex items-center gap-2.5">
                  <Save className="w-4 h-4 text-emerald-500" />
                  <span>{language === "ar" ? "حفظ المشروع" : "Save Project"}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+S</span>
              </button>

              {/* Action: Save As */}
              <button
                onClick={async () => {
                  setDropdownOpen(false);
                  await saveProjectAs();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition text-start"
              >
                <div className="flex items-center gap-2.5">
                  <Copy className="w-4 h-4 text-teal-500" />
                  <span>{language === "ar" ? "حفظ باسم (Save As)..." : "Save As..."}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+Shift+S</span>
              </button>

              {/* Action: Backup Project */}
              <button
                onClick={async () => {
                  setDropdownOpen(false);
                  await handleBackup();
                }}
                disabled={backupLoading}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition text-start disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>{language === "ar" ? "نسخ احتياطي فوري (Backup)" : "Backup Project..."}</span>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

              {/* Action: Export */}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  exportProject();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition text-start"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-purple-500" />
                  <span>{language === "ar" ? "تصدير ملف .snlab" : "Export .snlab"}</span>
                </div>
              </button>

              {/* Action: Import */}
              <button
                onClick={handleImportClick}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition text-start"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-orange-500" />
                  <span>{language === "ar" ? "استيراد ملف .snlab..." : "Import .snlab..."}</span>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

              {/* Action: Project Properties */}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenProjectProperties();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition text-start"
              >
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-cyan-500" />
                  <span>{language === "ar" ? "معلومات وخصائص المشروع" : "Project Info & Audit"}</span>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Quick Direct Save Button */}
      <button
        onClick={saveProject}
        disabled={saveStatus === "saving"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm ${
          hasUnsavedChanges
            ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
        }`}
        title={language === "ar" ? "حفظ التعديلات (Ctrl+S)" : "Save Project (Ctrl+S)"}
      >
        {saveStatus === "saving" ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {saveStatus === "saving" 
            ? (language === "ar" ? "جاري الحفظ..." : "Saving...") 
            : (language === "ar" ? "حفظ" : "Save")}
        </span>
      </button>

      {/* Save Status Badge */}
      <div className="flex items-center">
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="hidden md:inline">{language === "ar" ? "جاري الحفظ..." : "Saving..."}</span>
          </span>
        )}

        {saveStatus === "saved" && !hasUnsavedChanges && (
          <span 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
            title={lastSavedAt ? `Saved at ${lastSavedAt.toLocaleTimeString()}` : "Saved"}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="hidden md:inline">{language === "ar" ? "محفوظ محلياً" : "Saved"}</span>
          </span>
        )}

        {hasUnsavedChanges && saveStatus !== "saving" && (
          <span 
            onClick={saveProject}
            className="cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition"
            title={language === "ar" ? "توجد تغييرات غير محفوظة على القرص. اضغط للحفظ" : "Unsaved changes on disk. Click to save."}
          >
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="hidden md:inline">{language === "ar" ? "غير محفوظ" : "Unsaved"}</span>
          </span>
        )}

        {saveStatus === "error" && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-3 h-3" />
            <span className="hidden md:inline">{language === "ar" ? "فشل الحفظ" : "Save Failed"}</span>
          </span>
        )}
      </div>

      {/* Backup Notification Toast */}
      {backupSuccess && (
        <div className="absolute top-full mt-2 end-0 bg-emerald-600 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-1">
          <ShieldCheck className="w-4 h-4 text-emerald-200" />
          <span>{language === "ar" ? `تم إنشاء النسخة الاحتياطية: ${backupSuccess}` : `Backup created: ${backupSuccess}`}</span>
        </div>
      )}
    </div>
  );
};
