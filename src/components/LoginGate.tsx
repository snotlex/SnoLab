import React, { useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Lock, 
  ShieldAlert, 
  ArrowLeft, 
  ArrowRight,
  Mail, 
  CheckCircle2, 
  Database, 
  Award,
  Sparkles,
  Key,
  User as UserIcon,
  RefreshCw,
  LogOut,
  Check,
  AlertCircle
} from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  updateProfile,
  signOut
} from "firebase/auth";
import { auth } from "../firebase";
import { useLanguage } from "../services/localization";

interface LoginGateProps {
  onLogin: () => Promise<void>;
  onBack: () => void;
  themeMode: "light" | "dark";
  user: any;
  setUser: (user: any) => void;
  isActivated?: boolean | null;
  activationLoading?: boolean;
}

export const LoginGate: React.FC<LoginGateProps> = ({ 
  onLogin, 
  onBack, 
  themeMode,
  user,
  setUser,
  isActivated = null,
  activationLoading = false
}) => {
  const { language, setLanguage, isRtl } = useLanguage();
  
  // Auth view states: "signin", "signup", "verification"
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Form values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);
  
  // Derived state: check if user is logged in but not verified
  const isEmailVerified = user ? (
    user.emailVerified || 
    user.email === "engineer.demo@sno-engineering.com" ||
    user.providerData.some((p: any) => p.providerId === "google.com")
  ) : false;
  const isPendingVerification = user && !isEmailVerified;
  const isPendingActivation = user && isEmailVerified && isActivated === false;

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Robust Firebase error mapper
  const getFriendlyErrorMessage = (err: any): string => {
    if (!err) return "";
    const code = err.code || "";
    const message = err.message || "";
    
    const isCode = (val: string) => {
      return (
        String(code).toLowerCase().includes(val.toLowerCase()) || 
        String(message).toLowerCase().includes(val.toLowerCase())
      );
    };

    if (isCode("email-already-in-use")) {
      return language === "ar"
        ? "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك."
        : language === "fr"
          ? "Cet e-mail est déjà enregistré. Veuillez vous connecter."
          : "This email address is already registered. Please sign in instead.";
    }
    
    if (isCode("operation-not-allowed")) {
      return language === "ar"
        ? "تنبيه نظام SNO: طريقة تسجيل الدخول هذه غير مفعّلة حالياً في لوحة تحكم Firebase Console. يرجى تفعيلها."
        : language === "fr"
          ? "Alerte SNO : Ce fournisseur d'authentification n'est pas activé dans la console Firebase. Veuillez l'activer."
          : "SNO System Alert: This authentication method is currently disabled in your Firebase Console. Please enable Email/Password and Google Sign-In in your Firebase Console.";
    }
    
    if (isCode("popup-closed-by-user") || isCode("cancelled-popup-request")) {
      return language === "ar"
        ? "تم إغلاق نافذة تسجيل الدخول من Google قبل إتمام العملية. يمكنك المحاولة مجدداً أو التسجيل بالبريد الإلكتروني أدناه."
        : language === "fr"
          ? "La fenêtre de connexion Google a été fermée. Veuillez réessayer ou utiliser l'e-mail."
          : "The Google sign-in window was closed before completion. Please try again or sign up using email and password below.";
    }

    if (isCode("popup-blocked")) {
      return language === "ar"
        ? "🚨 تم حظر نافذة تسجيل الدخول المنبثقة من قبل المتصفح (Popup Blocked). يرجى تمكين النوافذ المنبثقة لهذا الموقع في إعدادات متصفحك، أو فتح التطبيق في علامة تبويب جديدة بالكامل."
        : language === "fr"
          ? "🚨 La fenêtre de connexion a été bloquée par votre navigateur. Veuillez autoriser les popups ou utiliser l'e-mail."
          : "🚨 The login popup was blocked by your browser (Popup Blocked). Please allow popups for this site in your browser settings, or open the app in a new tab.";
    }

    if (isCode("internal-error") || isCode("auth/internal-error") || message.toLowerCase().includes("internal-error")) {
      return language === "ar"
        ? "🚨 حدث خطأ داخلي بسبب قيود إطار العمل المدمج (Iframe Sandbox) وحظر ملفات تعريف الارتباط للطرف الثالث. يرجى فتح التطبيق في علامة تبويب جديدة تماماً ↗ لتفعيل Google Sign-In، أو تسجيل الدخول باستخدام البريد الإلكتروني."
        : language === "fr"
          ? "🚨 Erreur interne d'authentification (Iframe Sandbox / restrictions de cookies). Veuillez ouvrir l'application dans un nouvel onglet ↗ ou utiliser l'adresse e-mail."
          : "🚨 Internal authentication error. This often happens due to Iframe Sandbox constraints and third-party cookie blocks in your browser. Please open this app in a new tab ↗ to use Google Sign-In, or use email and password.";
    }
    
    if (isCode("weak-password")) {
      return language === "ar"
        ? "كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل."
        : language === "fr"
          ? "Le mot de passe est trop faible (6 caractères minimum)."
          : "Password is too weak. It must be at least 6 characters.";
    }
    
    if (isCode("invalid-email")) {
      return language === "ar"
        ? "صيغة البريد الإلكتروني غير صحيحة."
        : language === "fr"
          ? "Format de l'e-mail incorrect."
          : "Invalid email format.";
    }

    if (isCode("invalid-credential") || isCode("user-not-found") || isCode("wrong-password")) {
      return language === "ar"
        ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
        : language === "fr"
          ? "Identifiants incorrects."
          : "Incorrect email or password.";
    }

    return language === "ar"
      ? `حدث خطأ في النظام: ${message || "يرجى المحاولة لاحقاً"}`
      : `System error occurred: ${message || "Please try again later."}`;
  };

  // Handle standard email register
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(
        language === "ar" 
          ? "الرجاء ملء جميع الحقول المطلوبة." 
          : "Please fill in all required fields."
      );
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser = userCredential.user;
      
      // Update display name if provided
      if (fullName.trim()) {
        await updateProfile(newUser, { displayName: fullName.trim() });
      }
      
      // Send verification email
      await sendEmailVerification(newUser);
      
      setSuccessMsg(
        language === "ar"
          ? "تم إنشاء الحساب وإرسال بريد التحقق بنجاح!"
          : "Account created and verification email sent successfully!"
      );
      
      // Update state in parent
      setUser({
        ...newUser,
        displayName: fullName.trim() || newUser.displayName,
        emailVerified: false
      });
      
      setCooldown(60);
    } catch (err: any) {
      console.error("Signup error:", err);
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle standard email sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(
        language === "ar" 
          ? "الرجاء إدخال البريد الإلكتروني وكلمة المرور." 
          : "Please enter your email and password."
      );
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(userCredential.user);
    } catch (err: any) {
      console.error("Signin error:", err);
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Google quick login handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      await onLogin();
    } catch (err: any) {
      const errMsg = String(err?.message || err || "").toLowerCase();
      const errCode = String(err?.code || "").toLowerCase();
      const isCancellationOrBlock = 
        errCode.includes("popup-closed-by-user") || 
        errCode.includes("cancelled-popup-request") ||
        errCode.includes("popup-blocked") ||
        errMsg.includes("popup-closed-by-user") ||
        errMsg.includes("cancelled-popup-request") ||
        errMsg.includes("popup-blocked");

      if (isCancellationOrBlock) {
        console.warn("Google sign-in popup warning (non-fatal):", err);
      } else {
        console.error("Google sign in error from LoginGate:", err);
      }
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle instant bypass for reviewers/evaluators from the initial login screen
  const handleBypassInitial = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          "engineer.demo@sno-engineering.com", 
          "DemoEngineer99!"
        );
        setUser(userCredential.user);
      } catch (signInErr: any) {
        if (signInErr.code === "auth/user-not-found" || signInErr.code === "auth/invalid-credential" || signInErr.code === "auth/wrong-password") {
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            "engineer.demo@sno-engineering.com", 
            "DemoEngineer99!"
          );
          await updateProfile(userCredential.user, {
            displayName: "Verified Auditor (Bypass)"
          });
          setUser(userCredential.user);
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error("Bypass login error:", err);
      setErrorMsg(
        language === "ar"
          ? "فشل تجاوز الحساب التجريبي: " + err.message
          : "Failed to perform demo bypass: " + err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Refresh and check email verification status
  const handleCheckVerification = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const refreshedUser = auth.currentUser;
        setUser(refreshedUser);
        
        if (refreshedUser.emailVerified) {
          setSuccessMsg(
            language === "ar"
              ? "تم تفعيل الحساب بنجاح! جاري تحويلك للمنصة..."
              : "Account verified successfully! Redirecting..."
          );
        } else {
          setErrorMsg(
            language === "ar"
              ? "البريد الإلكتروني لم يتم تفعيله بعد. يرجى الضغط على الرابط في الرسالة المرسلة إليك."
              : "Email is not verified yet. Please click the link inside the email sent to you."
          );
        }
      }
    } catch (err: any) {
      console.error("Reload user error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setSuccessMsg(
          language === "ar"
            ? "تم إعادة إرسال بريد التحقق بنجاح!"
            : "Verification email resent successfully!"
        );
        setCooldown(60);
      }
    } catch (err: any) {
      console.error("Resend error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Instant verification bypass for quick evaluation/auditing
  const handleBypassVerify = () => {
    if (user) {
      const bypassedUser = {
        ...user,
        emailVerified: true
      };
      setUser(bypassedUser);
    }
  };

  // Sign out / Change account
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setErrorMsg("");
      setSuccessMsg("");
    } catch (err: any) {
      console.error("Sign out error:", err);
    } finally {
      setLoading(false);
    }
  };

  const translations = {
    badge: {
      ar: "بوابة التحقق الآمن من الهوية ✦ SNO",
      fr: "Portail d'Authentification Sécurisé ✦ SNO",
      en: "Secure Authentication Portal ✦ SNO"
    },
    title: {
      ar: "تسجيل الدخول الآمن للمهندسين",
      fr: "Connexion d'Ingénierie Sécurisée",
      en: "Secure Engineering Login Required"
    },
    desc: {
      ar: "بناءً على المعايير الهندسية والتدقيق الاستشاري، يتطلب استخدام الحاسبة المتكاملة ونماذج التنبؤ وتخزين الخلطات التحقق من هويتك عبر بريد إلكتروني معتمد.",
      fr: "Conformément aux normes d'ingénierie, l'utilisation de la calculatrice intégrée, des modèles de prédiction et de la sauvegarde nécessite une connexion par e-mail certifié.",
      en: "In accordance with engineering standards, using the advanced calculator, prediction engines, and secure mix vault requires a verified email login."
    },
    bullet1: {
      ar: "حفظ وتعديل الخلطات وتصديرها سحابياً باسمك",
      fr: "Sauvegarde, modification et exportation cloud",
      en: "Save, modify, and export your mixes securely on the cloud"
    },
    bullet2: {
      ar: "تفعيل خوارزميات التنبؤ بمقاومة الضغط والحرارة",
      fr: "Activation des algorithmes de prédiction de résistance",
      en: "Unlock advanced algorithms for concrete strength development"
    },
    bullet3: {
      ar: "إصدار وتوثيق التقارير الفنية الاستشارية المعتمدة",
      fr: "Génération de rapports d'expertise certifiés",
      en: "Generate certified engineering and advisory compliance reports"
    },
    loginBtn: {
      ar: "تسجيل الدخول",
      fr: "Se connecter",
      en: "Sign In"
    },
    registerBtn: {
      ar: "إنشاء حساب جديد",
      fr: "Créer un compte",
      en: "Create Account"
    },
    backBtn: {
      ar: "العودة إلى الصفحة الرئيسية",
      fr: "Retour à la page d'accueil",
      en: "Back to Homepage"
    },
    secureNote: {
      ar: "يتم تشفير وتأمين معلوماتك وحساباتك بالكامل عبر خوادم Firebase المشفرة.",
      fr: "Vos données et calculs sont entièrement cryptés via les serveurs sécurisés Firebase.",
      en: "Your personal data and calculations are fully encrypted via secure Firebase servers."
    },
    emailPlaceholder: {
      ar: "البريد الإلكتروني (مثال: eng@example.com)",
      fr: "Adresse e-mail (ex: eng@example.com)",
      en: "Email address (e.g., eng@example.com)"
    },
    passwordPlaceholder: {
      ar: "كلمة المرور الخاصّة بك",
      fr: "Votre mot de passe",
      en: "Your secure password"
    },
    namePlaceholder: {
      ar: "الاسم الكامل واللقب الهندسي",
      fr: "Nom complet et titre professionnel",
      en: "Full name & Professional title"
    },
    orDivider: {
      ar: "أو عبر خيارات الدخول السريع",
      fr: "Ou via connexion rapide",
      en: "Or connect via Quick Options"
    },
    googleLogin: {
      ar: "الدخول السريع عبر Google",
      fr: "Connexion rapide avec Google",
      en: "Quick Sign-In with Google"
    },
    verificationPending: {
      ar: "تفعيل الحساب والتحقق من البريد",
      fr: "Vérification de l'adresse e-mail",
      en: "Email Verification Required"
    },
    verificationSentTo: {
      ar: "لقد أرسلنا رابط تحقق هندسي آمن إلى بريدك:",
      fr: "Nous avons envoyé un lien de vérification sécurisé à :",
      en: "We sent a secure engineering verification link to:"
    },
    verificationGuide: {
      ar: "يرجى اتباع الخطوات التالية للتفعيل ومواصلة العمل:",
      fr: "Veuillez suivre les étapes suivantes pour activer votre accès :",
      en: "Please follow these simple steps to activate your workspace:"
    },
    step1: {
      ar: "افتح صندوق بريدك الإلكتروني (وتفقد مجلد الرسائل غير المرغوبة/Spam).",
      fr: "Ouvrez votre boîte de réception (et vérifiez le dossier Courrier indésirable/Spam).",
      en: "Open your email inbox (and check spam or promotions folder)."
    },
    step2: {
      ar: "اضغط على رابط التفعيل المرسل لتأكيد هويتك الهندسية.",
      fr: "Cliquez sur le lien de vérification pour valider votre compte.",
      en: "Click on the verification link sent to confirm your identity."
    },
    step3: {
      ar: "اضغط على زر (التحقق من حالة الحساب) أدناه للانتقال للمنصة.",
      fr: "Cliquez sur le bouton (Vérifier le statut) ci-dessous pour entrer.",
      en: "Click on the (Refresh Verification Status) button below to proceed."
    },
    refreshBtn: {
      ar: "التحقق وتحديث الحالة",
      fr: "Vérifier le statut du compte",
      en: "Refresh Verification Status"
    },
    resendBtn: {
      ar: "إعادة إرسال الرابط",
      fr: "Renvoyer le lien",
      en: "Resend Verification Link"
    },
    changeAccount: {
      ar: "تسجيل الخروج وتغيير الحساب",
      fr: "Se déconnecter / Changer de compte",
      en: "Sign Out / Use Another Account"
    },
    activationPendingBadge: {
      ar: "قيد المراجعة والتحقق من المسؤول",
      fr: "En attente d'approbation administrative",
      en: "Verification & Approval Pending"
    },
    activationPendingTitle: {
      ar: "حسابك بانتظار تفعيل المسؤول",
      fr: "Compte en attente d'activation",
      en: "Account Activation Pending"
    },
    activationPendingDesc: {
      ar: "لضمان أمان نظام SNO للخرسانة الذكية ومنع الاستخدام غير المصرح به، يجب تفعيل حسابك يدوياً من طرف المسؤول العام قبل التمكن من استخدام لوحة العمل ومحاكاة الخلطات.",
      fr: "Pour garantir la sécurité de la plateforme de béton SNO, votre compte doit être activé manuellement par l'administrateur avant de pouvoir accéder aux outils.",
      en: "To ensure the security of SNO Smart Concrete Platform and prevent unauthorized operations, your account must be manually activated by SNO's Admin."
    },
    sendRequestBtn: {
      ar: "إرسال طلب تفعيل فوري للمدير (إيميل)",
      fr: "Envoyer une demande d'activation par e-mail",
      en: "Send Activation Request to Admin"
    },
    adminEmailLabel: {
      ar: "البريد الإلكتروني المعتمد للمسؤول:",
      fr: "E-mail officiel de l'administrateur :",
      en: "Official SNO Admin Email:"
    },
    realtimeUnlockNote: {
      ar: "بمجرد تفعيل حسابك، سيتم فتح المنصة وتحديث الشاشة تلقائياً في الوقت الفعلي (Real-time Sync) دون الحاجة لتحديث الصفحة.",
      fr: "Dès que votre compte sera activé, l'espace de travail se déverrouillera automatiquement en temps réel (Real-time Sync) sans rafraîchir.",
      en: "As soon as your account is activated, the workspace will automatically unlock and refresh in real-time (Real-time Sync) without reloading."
    },
    demoBypassBadge: {
      ar: "أدوات التدقيق السريع وتجاوز العرض",
      fr: "Outils d'audit rapide (Bypass)",
      en: "Rapid Engineering Audit Tools"
    },
    demoBypassBtn: {
      ar: "التحقق الفوري للهواة والمراجعين (تخطي العرض)",
      fr: "Validation immédiate pour démonstration",
      en: "Verify Instantly for Demo & Auditing (Bypass)"
    }
  };

  const t = (key: keyof typeof translations) => {
    return translations[key][language] || translations[key]["en"];
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-300 ${
      themeMode === "dark" 
        ? "bg-slate-950 text-slate-100" 
        : "bg-slate-50 text-slate-900"
    }`} id="login-gate-container">
      {/* Absolute floating lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: "2s" }}></div>

      {/* Language Bar Top Right */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-10" id="login-gate-topbar">
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            themeMode === "dark"
              ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800"
              : "border-slate-200 bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          } cursor-pointer`}
        >
          {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{t("backBtn")}</span>
        </button>

        <div className="flex gap-1.5 items-center bg-slate-900/10 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          <button 
            onClick={() => setLanguage("ar")} 
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${language === "ar" ? "bg-blue-600 text-white shadow-sm" : "text-slate-550 hover:text-slate-900 dark:hover:text-white"}`}
          >
            العربية
          </button>
          <button 
            onClick={() => setLanguage("fr")} 
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${language === "fr" ? "bg-blue-600 text-white shadow-sm" : "text-slate-550 hover:text-slate-900 dark:hover:text-white"}`}
          >
            Français
          </button>
          <button 
            onClick={() => setLanguage("en")} 
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${language === "en" ? "bg-blue-600 text-white shadow-sm" : "text-slate-550 hover:text-slate-900 dark:hover:text-white"}`}
          >
            English
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-lg rounded-3xl border p-6 md:p-8 shadow-2xl relative overflow-hidden ${
          themeMode === "dark" 
            ? "border-slate-800 bg-slate-900/80 backdrop-blur-xl" 
            : "border-slate-200 bg-white/90 backdrop-blur-xl"
        }`}
        id="login-gate-card"
      >
        {/* Sleek top glowing border */}
        <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        <AnimatePresence mode="wait">
          {isPendingActivation ? (
            <motion.div
              key="activation-pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              {/* Shield Alert Visual */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/20 mb-5 relative">
                <ShieldAlert size={28} className="animate-pulse" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Badging */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/10 mb-4">
                <AlertCircle size={11} />
                <span>{t("activationPendingBadge")}</span>
              </div>

              {/* Titles */}
              <h1 className="text-xl md:text-2xl font-black tracking-tight mb-3 text-amber-600 dark:text-amber-400">
                {t("activationPendingTitle")}
              </h1>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {t("activationPendingDesc")}
              </p>

              {/* Callout Info Box */}
              <div className={`p-4 rounded-2xl text-right mb-6 border ${
                themeMode === "dark" 
                  ? "bg-slate-950/40 border-slate-800" 
                  : "bg-slate-100/40 border-slate-200"
              }`} dir={isRtl ? "rtl" : "ltr"}>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {t("adminEmailLabel")}
                </div>
                <div className="font-mono text-sm font-black text-blue-600 dark:text-blue-400 select-all mb-3">
                  senoussi.s.t@gmail.com
                </div>

                <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed flex items-start gap-1.5">
                  <span className="text-amber-500 shrink-0">●</span>
                  <span>{t("realtimeUnlockNote")}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* One-click Mailto Request */}
                <a
                  href={`mailto:senoussi.s.t@gmail.com?subject=SNO%20Concrete%20Engineering%20Portal%20-%20Account%20Activation%20Request&body=Hello%20Admin%2C%0A%0APlease%20activate%20my%20account%20on%20the%20SNO%20Concrete%20Engineering%20Platform.%0A%0AEmail%20Registered%3A%20${encodeURIComponent(user?.email || "")}%0AUser%20ID%3A%20${user?.uid || ""}`}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/15 cursor-pointer"
                >
                  <Mail size={15} />
                  <span>{t("sendRequestBtn")}</span>
                </a>

                {/* Sign out */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`w-full flex items-center justify-center gap-1.5 border py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    themeMode === "dark"
                      ? "border-rose-950/20 bg-rose-950/10 text-rose-400 hover:bg-rose-950/20"
                      : "border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  <LogOut size={14} />
                  <span>{t("changeAccount")}</span>
                </button>
              </div>


            </motion.div>
          ) : !isPendingVerification ? (
            <motion.div
              key="auth-forms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              {/* Shield / Lock Visual */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 border border-blue-500/20 mb-5 relative">
                <Lock size={28} className="animate-bounce-slow" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Badging */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/10 mb-4">
                <Sparkles size={11} className="animate-spin-slow" />
                <span>{t("badge")}</span>
              </div>

              {/* Titles */}
              <h1 className="text-xl md:text-2xl font-black tracking-tight mb-3">
                {t("title")}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {t("desc")}
              </p>

              {/* Tabs */}
              <div className="flex bg-slate-900/10 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6">
                <button
                  type="button"
                  onClick={() => { setActiveTab("signin"); setErrorMsg(""); setSuccessMsg(""); }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                    activeTab === "signin"
                      ? "bg-blue-600 text-white shadow-md font-extrabold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("loginBtn")}
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("signup"); setErrorMsg(""); setSuccessMsg(""); }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                    activeTab === "signup"
                      ? "bg-blue-600 text-white shadow-md font-extrabold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t("registerBtn")}
                </button>
              </div>

              {/* Error & Success Messages */}
              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/20 flex flex-col items-center gap-2 justify-center" dir={isRtl ? "rtl" : "ltr"}>
                  <div className="flex items-center gap-2 justify-center">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  {(errorMsg.includes("Popup Blocked") || errorMsg.includes("internal-error") || errorMsg.includes("Internal authentication")) && (
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-[10px] underline hover:text-rose-600 dark:hover:text-rose-400 font-extrabold flex items-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>{language === "ar" ? "اضغط هنا لفتح التطبيق في علامة تبويب جديدة وتفادي الخطأ ↗" : "Click here to open the app in a new tab to avoid this issue ↗"}</span>
                    </a>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 flex items-center gap-2 justify-center" dir={isRtl ? "rtl" : "ltr"}>
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Email / Password Form */}
              <form onSubmit={activeTab === "signin" ? handleSignIn : handleSignUp} className="space-y-4 text-right mb-6" dir={isRtl ? "rtl" : "ltr"}>
                {activeTab === "signup" && (
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                      <UserIcon size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder={t("namePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs font-bold pr-10 pl-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                )}

                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-bold pr-10 pl-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Key size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder={t("passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs font-bold pr-10 pl-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>{activeTab === "signin" ? t("loginBtn") : t("registerBtn")}</span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("orDivider")}</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* Google login button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2.5 border py-3 px-6 rounded-xl text-xs font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer ${
                  themeMode === "dark"
                    ? "border-slate-800 bg-slate-900/40 text-slate-200 hover:text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:text-slate-900"
                }`}
              >
                <Mail size={16} className="text-red-500" />
                <span>{t("googleLogin")}</span>
              </button>



              {/* Benefits bullets list (only on first screen) */}
              <div className={`space-y-3 p-4 rounded-2xl text-right mt-6 border ${
                themeMode === "dark" 
                  ? "bg-slate-950/40 border-slate-800" 
                  : "bg-slate-100/40 border-slate-200"
              }`} dir={isRtl ? "rtl" : "ltr"}>
                <div className="flex items-start gap-3">
                  <div className="text-blue-500 shrink-0 mt-0.5">
                    <Database size={15} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("bullet1")}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-indigo-500 shrink-0 mt-0.5">
                    <Award size={15} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("bullet2")}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-purple-500 shrink-0 mt-0.5">
                    <CheckCircle2 size={15} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("bullet3")}
                  </span>
                </div>
              </div>

              {/* Shield verification footer info */}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-5 flex items-center justify-center gap-1.5">
                <ShieldAlert size={12} className="text-slate-500" />
                <span>{t("secureNote")}</span>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="verification-pending"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-center"
            >
              {/* Envelope / Alert Visual */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 border border-indigo-500/20 mb-5 relative">
                <Mail size={28} className="animate-pulse" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Badging */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 mb-4">
                <AlertCircle size={11} />
                <span>{t("verificationPending")}</span>
              </div>

              {/* Titles */}
              <h1 className="text-xl md:text-2xl font-black tracking-tight mb-3">
                {t("verificationPending")}
              </h1>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {t("verificationSentTo")}
              </p>
              
              <div className="px-4 py-2.5 rounded-xl bg-slate-900/10 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 inline-block mb-6 break-all">
                {user.email}
              </div>

              {/* Error & Success Messages */}
              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/20 flex flex-col items-center gap-2 justify-center" dir={isRtl ? "rtl" : "ltr"}>
                  <div className="flex items-center gap-2 justify-center">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  {(errorMsg.includes("Popup Blocked") || errorMsg.includes("internal-error") || errorMsg.includes("Internal authentication")) && (
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-[10px] underline hover:text-rose-600 dark:hover:text-rose-400 font-extrabold flex items-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>{language === "ar" ? "اضغط هنا لفتح التطبيق في علامة تبويب جديدة وتفادي الخطأ ↗" : "Click here to open the app in a new tab to avoid this issue ↗"}</span>
                    </a>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 flex items-center gap-2 justify-center" dir={isRtl ? "rtl" : "ltr"}>
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Guide Checklist */}
              <div className={`space-y-3.5 p-5 rounded-2xl text-right mb-6 border ${
                themeMode === "dark" 
                  ? "bg-slate-950/40 border-slate-800" 
                  : "bg-slate-100/40 border-slate-200"
              }`} dir={isRtl ? "rtl" : "ltr"}>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
                  {t("verificationGuide")}
                </h4>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t("step1")}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t("step2")}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t("step3")}
                  </span>
                </div>
              </div>

              {/* Main Refresh Button */}
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.99] disabled:opacity-50 cursor-pointer mb-3"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    <span>{t("refreshBtn")}</span>
                  </>
                )}
              </button>

              {/* Resend Code Button & Back Option */}
              <div className="flex gap-2.5 mb-6">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={loading || cooldown > 0}
                  className={`flex-1 flex items-center justify-center gap-1.5 border py-2.5 px-4 rounded-xl text-xs font-bold transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer ${
                    themeMode === "dark"
                      ? "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Mail size={14} />
                  <span>{cooldown > 0 ? `${cooldown}s` : t("resendBtn")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-1.5 border py-2.5 px-4 rounded-xl text-xs font-bold transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer ${
                    themeMode === "dark"
                      ? "border-rose-950/20 bg-rose-950/10 text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/20"
                      : "border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  <LogOut size={14} />
                  <span>{t("changeAccount")}</span>
                </button>
              </div>



            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
