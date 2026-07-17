import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { 
  UserCheck, 
  UserX, 
  Search, 
  Users, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Trash2, 
  Mail,
  RefreshCw
} from "lucide-react";
import { useLanguage } from "../services/localization";

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  activated: boolean;
  createdAt: any;
  updatedAt: any;
}

interface AdminPanelProps {
  themeMode: "light" | "dark";
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ themeMode }) => {
  const { language, isRtl } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "pending">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Real-time listener for the users collection
  useEffect(() => {
    setLoading(true);
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersList: AdminUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          uid: doc.id,
          ...data
        } as AdminUser);
      });
      setUsers(usersList);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "users");
      console.error("Firestore users read error:", err);
      setError(
        language === "ar" 
          ? "فشل في قراءة بيانات المستخدمين. يرجى التحقق من صلاحيات قاعدة البيانات."
          : "Failed to fetch registered users. Please ensure Firestore Security Rules permit administrative access."
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, [language]);

  // Toggle user activation status
  const handleToggleActivation = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    setError("");
    try {
      const currentStatusBool = !!currentStatus;
      const isActivating = !currentStatusBool;
      const userToActivate = users.find((u) => u.uid === userId);

      // Perform user activation state update in Firestore
      const userRef = doc(db, "users", userId);
      const updatePayload: any = {
        activated: !currentStatusBool,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updatePayload).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        throw err;
      });

      // Send the professional HTML email if transition is Pending -> Active (isActivating is true)
      if (isActivating && userToActivate) {
        let emailSentSuccess = true;
        let emailAttempts = 1;
        let emailMode = "simulation";
        let emailErrorMsg = "";

        try {
          const response = await fetch("/api/admin/send-activation-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              userId: userToActivate.uid,
              email: userToActivate.email,
              displayName: userToActivate.displayName || "SNO Engineer"
            })
          });

          const resData = await response.json();
          if (resData.success) {
            emailMode = resData.mode;
            emailAttempts = resData.attempts || 1;
          } else {
            emailSentSuccess = false;
            emailErrorMsg = resData.error || "Email delivery failed";
            emailAttempts = resData.attempts || 1;
          }
        } catch (emailErr: any) {
          emailSentSuccess = false;
          emailErrorMsg = emailErr.message || String(emailErr);
        }

        // Generate database log entries
        const today = new Date();
        const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
        const timeStr = today.toTimeString().split(" ")[0]; // HH:MM:SS

        const logPayload: any = {
          userId: userToActivate.uid,
          email: userToActivate.email,
          date: dateStr,
          time: timeStr,
          deliveryStatus: emailSentSuccess ? "sent" : "failed",
          emailType: "Account Activation",
          attempts: emailAttempts,
          mode: emailMode,
          createdAt: serverTimestamp()
        };

        if (!emailSentSuccess) {
          logPayload.error = emailErrorMsg;
        }

        try {
          console.log("Writing email log payload:", JSON.stringify(logPayload, null, 2));
          await addDoc(collection(db, "email_logs"), logPayload).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, "email_logs");
            throw err;
          });
        } catch (logErr) {
          console.error("Failed to write email log to Firestore:", logErr);
        }

        if (!emailSentSuccess) {
          setError(
            language === "ar"
              ? `فشل إرسال بريد التفعيل التلقائي بعد ${emailAttempts} محاولات: ${emailErrorMsg}`
              : `Automatic activation email delivery failed after ${emailAttempts} attempts: ${emailErrorMsg}`
          );
        }
      }

    } catch (err: any) {
      console.error("Update activation error:", err);
      setError(
        language === "ar"
          ? "حدث خطأ أثناء تعديل حالة الحساب: " + err.message
          : "Failed to change account activation status: " + err.message
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Delete user record safely from database
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(
      language === "ar"
        ? `هل أنت متأكد من حذف حساب المستخدم ${email} نهائياً؟`
        : `Are you absolutely sure you want to permanently delete user ${email}?`
    )) return;

    setActionLoading(userId);
    setError("");
    try {
      await deleteDoc(doc(db, "users", userId)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
        throw err;
      });
    } catch (err: any) {
      console.error("Delete user error:", err);
      setError(
        language === "ar"
          ? "حدث خطأ أثناء حذف حساب المستخدم: " + err.message
          : "Failed to delete user account: " + err.message
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Filters calculation
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "active") return matchesSearch && u.activated;
    if (filter === "pending") return matchesSearch && !u.activated;
    return matchesSearch;
  });

  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.activated).length;
  const pendingUsersCount = users.filter(u => !u.activated).length;

  // Text helper
  const t = (ar: string, en: string, fr: string = en) => {
    return language === "ar" ? ar : language === "fr" ? fr : en;
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-panel-container">
      {/* Header section with Stats Cards */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="text-right w-full md:w-auto">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            <span className="text-rose-500 font-extrabold">🛡️</span>
            <span>{t("لوحة تفعيل وحوكمة الحسابات", "User Activation & Security Governance", "Gouvernance et Activation")}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "إدارة وتأهيل المستخدمين للعمل على المنصة مع ميزة البث والتحقق في الوقت الفعلي.",
              "Grant or revoke platform access privileges. Updates sync instantly in real-time.",
              "Gérer les autorisations d'accès à la plateforme avec synchronisation temps réel."
            )}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/20 flex items-center gap-2.5 justify-end" dir={isRtl ? "rtl" : "ltr"}>
          <span>{error}</span>
          <ShieldAlert size={16} className="shrink-0" />
        </div>
      )}

      {/* Admin stats dashboard banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-blue-500"></div>
          <div className="text-blue-500 bg-blue-500/10 p-3 rounded-2xl shrink-0">
            <Users size={20} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("إجمالي المسجلين", "Total Registered Users", "Total Utilisateurs")}</p>
            <h3 className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-200">{totalUsersCount}</h3>
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-emerald-500"></div>
          <div className="text-emerald-500 bg-emerald-500/10 p-3 rounded-2xl shrink-0">
            <CheckCircle size={20} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("الحسابات المفعلة", "Activated Accounts", "Comptes Activés")}</p>
            <h3 className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-200">{activeUsersCount}</h3>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-amber-500"></div>
          <div className="text-amber-500 bg-amber-500/10 p-3 rounded-2xl shrink-0">
            <Clock size={20} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("بانتظار التفعيل", "Pending Approval", "En Attente")}</p>
            <h3 className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-200">{pendingUsersCount}</h3>
          </div>
        </div>
      </div>

      {/* Filters & search bars */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-100/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-200/65 dark:border-slate-800/60" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-300/30 dark:border-slate-800/40 shrink-0 w-full sm:w-auto">
          <button 
            onClick={() => setFilter("all")} 
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition-all ${filter === "all" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            {t("الكل", "All", "Tous")} ({totalUsersCount})
          </button>
          <button 
            onClick={() => setFilter("active")} 
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition-all ${filter === "active" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            {t("المفعلة", "Active Only", "Actifs")} ({activeUsersCount})
          </button>
          <button 
            onClick={() => setFilter("pending")} 
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition-all ${filter === "pending" ? "bg-amber-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            {t("بانتظار التفعيل", "Pending Only", "En Attente")} ({pendingUsersCount})
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? "left-3" : "right-3"}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("البحث بالاسم أو البريد...", "Search by name or email...", "Rechercher...")}
            className={`w-full py-2 pl-9 pr-4 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-blue-550 focus:outline-none transition-all ${
              isRtl ? "text-right pl-3 pr-9" : "text-left pl-9 pr-3"
            }`}
          />
        </div>
      </div>

      {/* Users List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-450 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/10">
          <RefreshCw size={24} className="animate-spin text-blue-500 mb-2" />
          <span className="text-xs font-bold">{t("جاري تحميل حسابات المهندسين...", "Loading engineers list...", "Chargement...")}</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/10">
          <Users size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
          <span className="text-xs font-black">{t("لا يوجد مستخدمون يطابقون الفلتر المختار.", "No users match the current selection.", "Aucun utilisateur trouvé.")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((u) => {
            const isSelf = u.uid === "bypassed-demo-engineer-99" || u.email === "engineer.demo@sno-engineering.com";
            const isOfficialAdmin = u.email === "senoussi.s.t@gmail.com";
            const dateStr = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString(language === "ar" ? "ar-DZ" : "fr-FR", {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : "";

            return (
              <div 
                key={u.uid}
                className={`p-5 rounded-3xl border shadow-sm relative overflow-hidden transition-all flex flex-col justify-between ${
                  u.activated 
                    ? "border-emerald-500/25 bg-emerald-500/[0.01] dark:bg-emerald-500/[0.02]" 
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/10"
                }`}
              >
                {/* Header Profile Badge row */}
                <div className="flex justify-between items-start mb-4" dir={isRtl ? "rtl" : "ltr"}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm uppercase shrink-0 ${
                      u.activated 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {u.displayName ? u.displayName.slice(0, 2) : "EN"}
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{u.displayName || "SNO Engineer"}</span>
                        {(isOfficialAdmin || u.uid === "bypassed-demo-engineer-99" || u.email === "engineer.demo@sno-engineering.com") && (
                          <span className="text-[9px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                            Admin
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 break-all">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide uppercase ${
                    u.activated 
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" 
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                  }`}>
                    {u.activated ? t("نشط ومفعل", "Active", "Actif") : t("معلق بانتظار التفعيل", "Pending", "En Attente")}
                  </span>
                </div>

                {/* Additional metadata info */}
                <div className="pt-3 border-t border-slate-105 dark:border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400 font-mono" dir={isRtl ? "rtl" : "ltr"}>
                  <span>
                    {t("المعرف الفريد UID:", "User UID:", "UID :")} {u.uid ? `${u.uid.slice(0, 8)}...` : "Unknown"}
                  </span>
                  {dateStr && (
                    <span>
                      {dateStr}
                    </span>
                  )}
                </div>

                {/* Interactive Admin Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-105 dark:border-slate-800/40 flex gap-2" dir={isRtl ? "rtl" : "ltr"}>
                  <button
                    disabled={actionLoading !== null || isOfficialAdmin}
                    onClick={() => handleToggleActivation(u.uid, u.activated)}
                    className={`flex-grow flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-black transition-all cursor-pointer select-none active:scale-[0.99] disabled:opacity-40 ${
                      u.activated
                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/10"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                    }`}
                  >
                    {actionLoading === u.uid ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : u.activated ? (
                      <>
                        <UserX size={13} />
                        <span>{t("تعطيل الحساب", "Deactivate Access", "Désactiver")}</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={13} />
                        <span>{t("تفعيل الحساب الآن", "Activate Access Now", "Activer")}</span>
                      </>
                    )}
                  </button>

                  <button
                    disabled={actionLoading !== null || isOfficialAdmin}
                    onClick={() => handleDeleteUser(u.uid, u.email)}
                    className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-[11px] font-black bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-450 border border-rose-500/10 hover:border-rose-600 cursor-pointer transition-all disabled:opacity-40 select-none active:scale-[0.99]"
                    title={t("حذف نهائياً", "Delete User Account", "Supprimer")}
                  >
                    <Trash2 size={13} />
                    <span>{t("حذف", "Delete", "Supprimer")}</span>
                  </button>

                  <a
                    href={`mailto:${u.email}?subject=SNO%20Concrete%20Engineering%20-%20Account%20Activated!&body=Hello%20${encodeURIComponent(u.displayName || "Engineer")}%2C%0A%0AWe%20are%20happy%20to%20inform%20you%20that%20your%20account%2520has%20been%20activated%20on%20SNO%20Smart%20Concrete%20Platform.%0A%0AYou%20can%20now%20log%20in%20and%20use%20all%20workspace%20features%20at%20http%3A%2F%2Flocalhost%3A3000%2F%0A%0AWarm%20regards%2C%0ASNO%20Engineering%20Admin`}
                    className={`p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 border transition-all cursor-pointer ${
                      themeMode === "dark" ? "border-slate-800" : "border-slate-200"
                    }`}
                    title={t("مراسلة المستخدم", "Send Email to User", "Contacter")}
                  >
                    <Mail size={14} />
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
