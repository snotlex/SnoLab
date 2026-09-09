import React, { useState } from "react";
import { 
  Settings, 
  Globe, 
  Moon, 
  Sun, 
  Monitor, 
  Coins, 
  FileCheck2, 
  Building2, 
  User, 
  HardDrive, 
  ShieldCheck, 
  Download, 
  Upload, 
  RotateCcw,
  Check,
  CheckCircle2,
  Sparkles,
  Info,
  Sliders,
  Scale
} from "lucide-react";
import { useLanguage } from "../services/localization";
import { useTheme } from "../hooks/useTheme";

interface SettingsPanelProps {
  currency: "DZD" | "EUR" | "USD";
  setCurrency: (c: "DZD" | "EUR" | "USD") => void;
  currentPlant: string;
  setCurrentPlant: (p: string) => void;
  currentProject: string;
  setCurrentProject: (p: string) => void;
  onExportBackup?: () => void;
  onImportBackup?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDatabase?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  currency,
  setCurrency,
  currentPlant,
  setCurrentPlant,
  currentProject,
  setCurrentProject,
  onExportBackup,
  onImportBackup,
  onResetDatabase
}) => {
  const { language, setLanguage, isRtl } = useLanguage();
  const { themeSetting, setThemeSetting } = useTheme();

  const [defaultMethod, setDefaultMethod] = useState<string>("dreux");
  const [standardCode, setStandardCode] = useState<string>("NF EN 206+A2/CN");
  const [engineerName, setEngineerName] = useState<string>(() => {
    return localStorage.getItem("snolab_engineer_name") || "مهندس ضبط الجودة المعتمد";
  });
  const [labName, setLabName] = useState<string>(() => {
    return localStorage.getItem("snolab_lab_name") || "مخبر الهندسة المدنية المركزي - SNO Lab";
  });
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const handleSavePreferences = () => {
    localStorage.setItem("snolab_engineer_name", engineerName);
    localStorage.setItem("snolab_lab_name", labName);
    localStorage.setItem("snolab_default_method", defaultMethod);
    localStorage.setItem("snolab_standard_code", standardCode);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in text-right font-sans" dir={isRtl ? "rtl" : "ltr"} id="snolab-settings-panel">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Settings size={26} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {language === "ar" ? "إعدادات منصة SnoLab الهندسي" : language === "fr" ? "Paramètres de la Plateforme SnoLab" : "SnoLab System & Engineering Preferences"}
            </h2>
            <p className="text-xs text-blue-200/70 mt-0.5">
              {language === "ar" ? "تخصيص اللغات، المعايير الكودية، العملات وهوية التقارير الهندسية" : "Customize localization, technical standards, currencies and report credentials"}
            </p>
          </div>
        </div>

        {saveToast && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold animate-fade-in">
            <CheckCircle2 size={16} />
            <span>{language === "ar" ? "تم حفظ التفضيلات بنجاح!" : "Preferences saved successfully!"}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Localization & Theme */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Globe size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
              {language === "ar" ? "اللغة والمظهر البصري" : "Localization & Appearance"}
            </h3>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {language === "ar" ? "لغة واجهة المستخدم:" : "Interface Language:"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: "ar", label: "العربية", flag: "🇩🇿" },
                { code: "fr", label: "Français", flag: "🇫🇷" },
                { code: "en", label: "English", flag: "🇬🇧" }
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code as any)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                    language === lang.code
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {language === "ar" ? "المظهر ونمط الألوان:" : "Color Theme:"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: "light", labelAr: "النهاري", labelEn: "Light", icon: Sun },
                { mode: "dark", labelAr: "الليلي", labelEn: "Dark", icon: Moon },
                { mode: "system", labelAr: "النظام", labelEn: "System", icon: Monitor }
              ].map((th) => {
                const Icon = th.icon;
                const active = themeSetting === th.mode;
                return (
                  <button
                    key={th.mode}
                    type="button"
                    onClick={() => setThemeSetting(th.mode as any)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{language === "ar" ? th.labelAr : th.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Standards & Currency */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileCheck2 size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
              {language === "ar" ? "الكودات والمعايير الهندسية والعملة" : "Technical Standards & Currency"}
            </h3>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {language === "ar" ? "العملة المعتمدة لحساب التكاليف:" : "Cost Currency:"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: "DZD", label: "دينار (DZD)" },
                { code: "EUR", label: "Euro (€)" },
                { code: "USD", label: "USD ($)" }
              ].map((curr) => (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => setCurrency(curr.code as any)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                    currency === curr.code
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Coins size={13} />
                  <span>{curr.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Standard Code */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {language === "ar" ? "الكود والمواصفة المرجعية:" : "Reference Standard:"}
            </label>
            <select
              value={standardCode}
              onChange={(e) => setStandardCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NF EN 206+A2/CN">NF EN 206+A2/CN (المواصفة الأوروبية/الفرنسية للخرسانة)</option>
              <option value="NA 5071 / NA 2607">NA 5071 / NA 2607 (المواصفة الجزائرية للخرسانة والركام)</option>
              <option value="ACI 211.1 / ACI 318">ACI 211.1 / ACI 318 (الكود الأمريكي للخرسانة)</option>
              <option value="BAEL 91">BAEL 91 (قواعد الحسابات الخرسانية الفرنسية)</option>
            </select>
          </div>
        </div>

        {/* 3. Plant & Engineer Credentials */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
              {language === "ar" ? "بيانات المصنع والمهندس المعتمد" : "Plant & Certification Credentials"}
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === "ar" ? "اسم وحدة الإنتاج / المصنع:" : "Production Plant Name:"}
              </label>
              <input
                type="text"
                value={currentPlant}
                onChange={(e) => setCurrentPlant(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === "ar" ? "اسم المهندس المسؤول / المعتمد:" : "Engineer / Technologist Name:"}
              </label>
              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === "ar" ? "اسم المخبر المركزي:" : "Central Laboratory:"}
              </label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSavePreferences}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check size={14} />
              <span>{language === "ar" ? "حفظ التفضيلات والبيانات" : "Save Preferences"}</span>
            </button>
          </div>
        </div>

        {/* 4. Local Database & Backup Management */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <HardDrive size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
              {language === "ar" ? "إدارة قواعد البيانات والنسخ الاحتياطي" : "Data Management & Backups"}
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {language === "ar"
              ? "يمكنك تصدير قاعدة الخامات والمشاريع كملف JSON آمن، أو استيراد بيانات سابقة لضمان عدم ضياع النتائج."
              : "Export materials database and project configurations as a secure JSON backup, or import previous data."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {onExportBackup && (
              <button
                type="button"
                onClick={onExportBackup}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <Download size={14} />
                <span>{language === "ar" ? "تصدير نسخة احتياطية" : "Export Backup"}</span>
              </button>
            )}

            {onImportBackup && (
              <label className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                <Upload size={14} />
                <span>{language === "ar" ? "استيراد ملف JSON" : "Import JSON"}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportBackup}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {onResetDatabase && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onResetDatabase}
                className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-rose-500/20"
              >
                <RotateCcw size={13} />
                <span>{language === "ar" ? "إعادة تعيين مستودع المواد إلى الحالة الأولية" : "Reset Database to Defaults"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
