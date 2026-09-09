import React, { useState } from "react";
import { 
  X, 
  FilePlus, 
  FolderOpen, 
  Save, 
  ShieldCheck, 
  Download, 
  Upload, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Building2, 
  MapPin, 
  FileText, 
  Layers, 
  FlaskConical, 
  Sliders, 
  Clock, 
  Hash, 
  Info,
  Database,
  RefreshCw
} from "lucide-react";
import { useProjectStorage } from "../services/storage/ProjectContext";
import { useLanguage } from "../services/localization";

interface ProjectFileManagerModalProps {
  mode: "new" | "properties" | "import_export";
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectFileManagerModal: React.FC<ProjectFileManagerModalProps> = ({
  mode,
  isOpen,
  onClose
}) => {
  const { 
    project, 
    fileName, 
    saveStatus, 
    lastSavedAt,
    createNewProject, 
    updateProjectMetadata, 
    saveProject, 
    saveProjectAs, 
    backupProject, 
    exportProject, 
    importProjectFile 
  } = useProjectStorage();

  const { language } = useLanguage();

  // Form State for New Project / Editing Metadata
  const [formData, setFormData] = useState({
    name: mode === "new" ? "New_Concrete_Project" : project.metadata.name,
    code: mode === "new" ? `PROJ-${Date.now().toString(36).toUpperCase()}` : (project.metadata.code || project.metadata.id),
    engineer: mode === "new" ? "Ingénieur Béton" : project.metadata.engineer,
    client: mode === "new" ? "Maître d'Ouvrage / Client" : project.metadata.client,
    location: mode === "new" ? "Alger, Algérie" : project.metadata.location,
    plant: mode === "new" ? "Centrale à Béton Centrale" : project.metadata.plant,
    description: mode === "new" ? "Étude de formulation de béton et contrôle de conformité laboratoire." : project.metadata.description
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backupName, setBackupName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createNewProject({
        name: formData.name.trim() || "New_Project",
        code: formData.code.trim(),
        engineer: formData.engineer.trim(),
        client: formData.client.trim(),
        location: formData.location.trim(),
        plant: formData.plant.trim(),
        description: formData.description.trim()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProperties = (e: React.FormEvent) => {
    e.preventDefault();
    updateProjectMetadata({
      name: formData.name.trim() || project.metadata.name,
      code: formData.code.trim(),
      engineer: formData.engineer.trim(),
      client: formData.client.trim(),
      location: formData.location.trim(),
      plant: formData.plant.trim(),
      description: formData.description.trim()
    });
    onClose();
  };

  const handleTriggerBackup = async () => {
    try {
      const name = await backupProject();
      setBackupName(name);
      setTimeout(() => setBackupName(null), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              {mode === "new" ? (
                <FilePlus className="w-6 h-6" />
              ) : mode === "properties" ? (
                <Info className="w-6 h-6" />
              ) : (
                <HardDrive className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {mode === "new"
                  ? (language === "ar" ? "إنشاء مشروع محلي جديد (.snlab)" : "Create New Local Project (.snlab)")
                  : mode === "properties"
                  ? (language === "ar" ? "معلومات وخصائص ملف المشروع" : "Project File Properties & Audit")
                  : (language === "ar" ? "إدارة وتصدير ملف المشروع" : "Project File Management")}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === "new"
                  ? (language === "ar" ? "يتم حفظ كافة البيانات الهندسية في ملف محلي خاص بك دون أي اتصال سحابي." : "All engineering data is stored locally in your own project file.")
                  : `${fileName} (Schema v${project.schemaVersion})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {mode === "new" && (
            <form onSubmit={handleCreateNew} id="new-project-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === "ar" ? "اسم المشروع *" : "Project Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Villa_Msila_B25"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === "ar" ? "كود المشروع / المعرف" : "Project Code / ID"}
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === "ar" ? "المهندس المسؤول" : "Engineer / Responsible"}
                  </label>
                  <input
                    type="text"
                    value={formData.engineer}
                    onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === "ar" ? "العميل / صاحب المشروع" : "Client / Owner"}
                  </label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === "ar" ? "الموقع الجغرافي / الولاية" : "Site Location"}
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === "ar" ? "محطة الخلط / المصنع" : "Batching Plant"}
                  </label>
                  <input
                    type="text"
                    value={formData.plant}
                    onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "ar" ? "وصف المشروع والملاحظات" : "Description / Notes"}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 dark:text-emerald-300">
                  {language === "ar"
                    ? "سيتم إنشاء هيكل مشروع محلي متكامل يحتوي على مكتبة المواد، وسجلات الاختبارات المعملية، وصيغ الخلط، وخصائص المواد المعايرة، وسجل التدقيق."
                    : "A complete local project structure will be created containing materials catalog, laboratory test records, mix design formulas, and audit logs."}
                </div>
              </div>
            </form>
          )}

          {mode === "properties" && (
            <div className="space-y-6">
              {/* Project Statistics Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <Layers className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                  <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {project.materials?.length || 0}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === "ar" ? "المواد المسجلة" : "Materials"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <FlaskConical className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                  <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {project.laboratoryTests?.length || 0}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === "ar" ? "الاختبارات المعملية" : "Lab Tests"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <Sliders className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                  <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {(project.mixDesigns?.versions?.length || 0) + (project.mixDesigns?.savedMixes?.length || 0)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === "ar" ? "إصدارات الخلطات" : "Mix Versions"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <Clock className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                  <div className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
                    v{project.schemaVersion}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === "ar" ? "إصدار البنية" : "Schema Version"}
                  </div>
                </div>
              </div>

              {/* Editable Metadata Form */}
              <form onSubmit={handleSaveProperties} id="edit-properties-form" className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {language === "ar" ? "البيانات الوصفية للمشروع" : "Project Metadata"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === "ar" ? "اسم المشروع" : "Project Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === "ar" ? "المهندس" : "Engineer"}
                    </label>
                    <input
                      type="text"
                      value={formData.engineer}
                      onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === "ar" ? "العميل" : "Client"}
                    </label>
                    <input
                      type="text"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === "ar" ? "الموقع" : "Location"}
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Audit & Timestamps */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>{language === "ar" ? "تاريخ الإنشاء:" : "Created Date:"}</span>
                    <span className="font-mono">{new Date(project.metadata.createdDate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === "ar" ? "آخر تعديل:" : "Last Modified:"}</span>
                    <span className="font-mono">{new Date(project.metadata.lastModified).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === "ar" ? "ملف التخزين الحالي:" : "Current File:"}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{fileName}</span>
                  </div>
                </div>
              </form>

              {/* Action Buttons for Backup & Export */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleTriggerBackup}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === "ar" ? "إنشاء نسخة احتياطية (Backup)" : "Create Instant Backup"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportProject()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{language === "ar" ? "تصدير ملف .snlab" : "Export .snlab"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => saveProjectAs()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{language === "ar" ? "حفظ باسم (Save As)..." : "Save As..."}</span>
                </button>
              </div>

              {backupName && (
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{language === "ar" ? `تم حفظ النسخة الاحتياطية بنجاح: ${backupName}` : `Backup successfully generated: ${backupName}`}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            {language === "ar" ? "إلغاء" : "Cancel"}
          </button>

          {mode === "new" && (
            <button
              type="submit"
              form="new-project-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              <FilePlus className="w-4 h-4" />
              <span>{language === "ar" ? "إنشاء وبدء المشروع" : "Create Project"}</span>
            </button>
          )}

          {mode === "properties" && (
            <button
              type="submit"
              form="edit-properties-form"
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>{language === "ar" ? "حفظ التعديلات" : "Save Changes"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
