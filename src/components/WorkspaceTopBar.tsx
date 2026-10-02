import React from "react";
import { Bell, RefreshCw, Settings } from "lucide-react";
import SnoLabLogo from "./SnoLabLogo";
import { ProjectTopBarControls } from "./ProjectTopBarControls";

type Language = "ar" | "fr" | "en";
type ThemeMode = "light" | "dark";

export interface WorkspaceNotification {
  id: string;
  read: boolean;
  textAr: string;
  textFr: string;
  textEn: string;
}

interface WorkspaceUser {
  displayName?: string | null;
  photoURL?: string | null;
}

export interface WorkspaceTopBarProps {
  language: Language;
  themeMode: ThemeMode;
  activeSidebarTab: string;
  notifications: WorkspaceNotification[];
  notificationOpen: boolean;
  user?: WorkspaceUser | null;
  fck28: number;
  selectedMethod?: string;
  currentClient: string;
  onToggleNotification: () => void;
  onMarkAllNotificationsRead: () => void;
  onCloseNotifications: () => void;
  onOpenSettings: () => void;
  onOpenProjectProperties: () => void;
  onOpenNewProjectModal: () => void;
  onNavigateLanding: () => void;
  onReset: () => void;
}

export const WorkspaceTopBar: React.FC<WorkspaceTopBarProps> = ({
  language,
  themeMode,
  activeSidebarTab,
  notifications,
  notificationOpen,
  user,
  fck28,
  selectedMethod,
  currentClient,
  onToggleNotification,
  onMarkAllNotificationsRead,
  onCloseNotifications,
  onOpenSettings,
  onOpenProjectProperties,
  onOpenNewProjectModal,
  onNavigateLanding,
  onReset,
}) => {
  const unreadCount = notifications.filter(notification => !notification.read).length;
  const text = (notification: WorkspaceNotification) => language === "ar" ? notification.textAr : language === "fr" ? notification.textFr : notification.textEn;
  return <header className={`sticky top-0 z-40 border-b font-sans shadow-2xl print:hidden select-none transition-colors duration-200 ${themeMode === "dark" ? "border-slate-800 bg-[#0B1120] text-white" : "border-slate-200 bg-white text-slate-800 shadow-md"}`} id="concrete.ai-premium-topbar">
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        <button type="button" className="flex shrink-0 cursor-pointer items-center gap-3" onClick={onNavigateLanding} aria-label="SnoLab home"><SnoLabLogo themeMode={themeMode} /></button>
        <div className="flex flex-grow items-center justify-center"><ProjectTopBarControls onOpenProjectProperties={onOpenProjectProperties} onOpenNewProjectModal={onOpenNewProjectModal} /></div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative">
            <button type="button" onClick={onToggleNotification} className={`relative cursor-pointer rounded-xl border p-2 transition-all duration-200 ${themeMode === "dark" ? "border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-850" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`} title={language === "ar" ? "الرسائل والتنبيهات الهندسية الفعالة" : "Engineering alerts and messages"}><Bell size={14} />{unreadCount > 0 && <span className="absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white">{unreadCount}</span>}</button>
            {notificationOpen && <div className={`absolute left-0 top-10 z-50 mt-1 w-80 rounded-2xl py-2 text-right shadow-2xl ${themeMode === "dark" ? "border border-slate-800 bg-slate-950" : "border border-slate-200 bg-white"}`}>
              <div className={`mb-2 flex items-center justify-between border-b px-3 py-2 ${themeMode === "dark" ? "border-slate-850" : "border-slate-100"}`}><button type="button" onClick={onMarkAllNotificationsRead} className="cursor-pointer text-[9.5px] font-bold text-blue-500 hover:underline">{language === "ar" ? "قراءة الكل" : language === "fr" ? "Marquer tout lu" : "Read all"}</button><span className={`text-[11px] font-black ${themeMode === "dark" ? "text-slate-300" : "text-slate-700"}`}>{language === "ar" ? "رسائل تنبيه السيستم" : language === "fr" ? "Alertes & Messages" : "Alerts & Notifications"}</span></div>
              <div className={`max-h-64 space-y-1 overflow-y-auto px-2 ${themeMode === "dark" ? "divide-slate-850/60" : "divide-slate-100"}`}>{notifications.map(notification => <div key={notification.id} className={`rounded-lg p-2 text-right ${notification.read ? "opacity-60" : "border-r-2 border-blue-500 bg-blue-500/10"}`}><p className={`text-[10px] leading-relaxed ${themeMode === "dark" ? "text-slate-200" : "font-semibold text-slate-700"}`}>{text(notification)}</p></div>)}</div>
              <div className={`mt-2 border-t p-2 text-center ${themeMode === "dark" ? "border-slate-850" : "border-slate-100"}`}><button type="button" onClick={onCloseNotifications} className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">{language === "ar" ? "إغلاق التنبيهات" : language === "fr" ? "Fermer" : "Close Panel"}</button></div>
            </div>}
          </div>
          <button type="button" onClick={onOpenSettings} className={`rounded-xl border p-2 transition-all ${activeSidebarTab === "settings" ? "bg-[#C7F43A] text-[#0A0F15]" : themeMode === "dark" ? "border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-850" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`} title={language === "ar" ? "إعدادات المنصة" : "System Settings"}><Settings size={14} /></button>
          <div className={`hidden h-6 w-px sm:block ${themeMode === "dark" ? "bg-slate-800" : "bg-slate-200"}`} />
          {user && <div className="flex shrink-0 items-center gap-2"><div className="hidden flex-col text-right lg:flex"><span className={`text-[10.5px] font-extrabold leading-tight ${themeMode === "dark" ? "text-blue-200" : "text-slate-800"}`}>{user.displayName || (language === "ar" ? "مهندس معتمد" : "Certified engineer")}</span><span className="text-right text-[9px] font-bold text-emerald-600">{language === "ar" ? "تخزين محلي" : "Local storage"}</span></div>{user.photoURL ? <img src={user.photoURL} alt="Profile" className="h-7 w-7 rounded-full border border-blue-500/20 shadow-md" referrerPolicy="no-referrer" /> : <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C7F43A] text-xs font-black uppercase text-[#0A0F15] shadow-md">{user.displayName?.charAt(0) || "M"}</div>}</div>}
        </div>
      </div>
    </div>
    <div className={`border-t px-4 py-2 transition-colors duration-200 md:px-6 ${themeMode === "dark" ? "border-slate-800/80 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}><div className="mx-auto flex max-w-7xl flex-col items-stretch justify-between gap-3 text-xs md:flex-row md:items-center"><div className={`flex items-center gap-2 font-mono text-[10px] ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"}`}><span className={`rounded px-2 py-0.5 font-sans font-black ${themeMode === "dark" ? "bg-slate-850 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>{language === "ar" ? "الوجبة النشطة:" : language === "fr" ? "Recette active:" : "Active Recipe:"} C{fck28} MPa</span><span>•</span><span>{selectedMethod?.toUpperCase()} METHOD</span><span>•</span><span className="hidden max-w-[200px] truncate lg:inline">{language === "ar" ? `العميل: ${currentClient}` : `Client: ${currentClient}`}</span></div><div className="flex flex-wrap items-center justify-end gap-2 text-[11px]"><button type="button" onClick={onReset} className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 font-bold transition ${themeMode === "dark" ? "border-slate-850 bg-slate-950 text-slate-350 hover:bg-slate-850 hover:text-white" : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:text-slate-900"}`} title={language === "ar" ? "تصفير وإعادة ضبط المتغيرات الأساسية" : "Reset core inputs"}><RefreshCw size={11} /><span>{language === "ar" ? "تصفير" : "Reset"}</span></button></div></div></div>
  </header>;
};
