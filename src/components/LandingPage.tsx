import React from "react";
import { 
  motion 
} from "motion/react";
import { 
  Sliders, 
  Activity, 
  Sparkles, 
  Layers, 
  Coins, 
  GraduationCap, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Building, 
  Users, 
  FlaskConical, 
  ChevronRight, 
  ChevronLeft,
  Sun, 
  Moon, 
  Monitor,
  FolderPlus,
  ArrowDown,
  Percent,
  TrendingUp,
  Cpu,
  BookOpen
} from "lucide-react";
import { Language, useLanguage } from "../services/localization";
import { SnoLabLogo } from "./SnoLabLogo";

interface LandingPageProps {
  onStartProject: () => void;
  themeMode: "light" | "dark";
  themeSetting: "light" | "dark" | "system";
  setThemeSetting: (theme: "light" | "dark" | "system") => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onStartProject,
  themeMode,
  themeSetting,
  setThemeSetting
}) => {
  const { language, setLanguage, isRtl, dir } = useLanguage();

  // Multi-language content dictionary specifically for SNO Engineering AI landing page
  const content = {
    hero: {
      badge: {
        ar: "منصة الذكاء الاصطناعي للهندسة والخرسانة ✦ الإصدار الاحترافي",
        fr: "Plateforme IA d'Ingénierie du Béton ✦ Edition Pro",
        en: "Concrete Engineering AI Platform ✦ Pro Edition"
      },
      title: {
        ar: "تصميم الخلطات الخرسانية المدعوم بالذكاء الاصطناعي",
        fr: "Formulation Assistée par l'Intelligence Artificielle",
        en: "AI-Powered Concrete Mix Design Platform"
      },
      desc: {
        ar: "النظام الهندسي الأكثر دقة وكفاءة لتصميم الخرسانة الإنشائية والجاهزة وحساب الكميات بمعايير Dreux-Gorisse بالتكامل مع نظام تقارير استشارية معترف به.",
        fr: "Le système d'ingénierie le plus précis pour la formulation du béton structurel, le calcul volumique et l'inventaire matériel selon la méthode Dreux-Gorisse.",
        en: "The most precise and efficient engineering system for concrete formulation, volumetric balancing, and material calculations based on Dreux-Gorisse codes."
      },
      ctaStart: {
        ar: "انطلاق مشروع جديد",
        fr: "Lancer un Projet",
        en: "Start New Project"
      },
      ctaLearn: {
        ar: "اكتشف المميزات",
        fr: "Découvrir",
        en: "Explore Features"
      },
      stats: {
        recipes: {
          val: "+15,420",
          lbl: { ar: "تركيبة محسنة", fr: "Mélanges Optimisés", en: "Optimized Recipes" }
        },
        co2: {
          val: "-22%",
          lbl: { ar: "انبعاثات الكربون", fr: "Réduction CO₂", en: "Carbon Reduction" }
        },
        accuracy: {
          val: "100%",
          lbl: { ar: "دقة الحسابات", fr: "Précision de Calcul", en: "Math Accuracy" }
        }
      }
    },
    benefits: {
      title: {
        ar: "مزايا المنصة لرفع كفاءة أعمالك الهندسية",
        fr: "Fonctionnalités avancées pour vos travaux",
        en: "Enterprise Benefits for Engineering Teams"
      },
      subtitle: {
        ar: "من الجرعات النظرية إلى المعايرة المعملية والتدقيق الاستشاري الكامل",
        fr: "De la formulation théorique aux essais physiques et validations d'expert",
        en: "From theoretical dosages to physical laboratory testing and compliance audits"
      },
      items: [
        {
          icon: Sliders,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          title: {
            ar: "تصميم الخلطات الاحترافي",
            fr: "Formulation de Béton",
            en: "Precision Mix Design"
          },
          desc: {
            ar: "تصميم خلطات خرسانية متكاملة بطريقة Dreux-Gorisse مع تحكم دقيق في نسب الماء والإسمنت (W/C).",
            fr: "Formulations complètes selon la méthode Dreux-Gorisse avec contrôle précis du rapport E/C.",
            en: "Comprehensive mix designs using Dreux-Gorisse standards with absolute water/cement ratio tuning."
          }
        },
        {
          icon: FileText,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          title: {
            ar: "تقارير هندسية استشارية",
            fr: "Rapports d'Expertise",
            en: "Consultant-Grade Reports"
          },
          desc: {
            ar: "تصدير تقرير PDF احترافي مدمج بصفحة غلاف استشارية، ملخص تنفيذي، معايير التحقق، ورمز الاستجابة السريعة (QR).",
            fr: "Génération automatique de rapports PDF d'expertise avec page de garde, synthèse exécutive, conformité et QR code.",
            en: "Export polished, executive PDF reports complete with cover sheets, comprehensive checklists, and verifiable QR codes."
          }
        },
        {
          icon: Sparkles,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          title: {
            ar: "مستشار هندسي بالذكاء الاصطناعي",
            fr: "Conseiller IA Spécialisé",
            en: "AI Engineering Advisor"
          },
          desc: {
            ar: "فحص فوري للخلطات، تقديم تشخيصات معملية وتحسين الجرعات لتقليل الهدر الكربوني والمادي ولقوام متجانس دائم.",
            fr: "Vérification en temps réel, diagnostics de durabilité et optimisations automatiques pour réduire le coût et le ciment.",
            en: "Get instant mix audits, laboratory diagnoses, and smart parameters optimization to reduce cement cost and CO₂ footprint."
          }
        },
        {
          icon: Activity,
          color: "text-indigo-500",
          bg: "bg-indigo-500/10",
          title: {
            ar: "لوحة تحليل تفاعلية ومحاكاة",
            fr: "Analyse Génie Civil",
            en: "Structural Analysis & Simulation"
          },
          desc: {
            ar: "تحليل توزيع مقاسات الركام ورسم منحنيات Dreux المستهدفة، مع محاكاة قوى الكسر المتوقعة بعد 7 و 28 يوماً.",
            fr: "Analyse granulométrique avec courbes de Dreux-Gorisse, simulation de résistance de rupture de compression à 7 et 28j.",
            en: "Audit grain-size distributions via interactive Dreux-Gorisse curves, and simulate compressive strength targets."
          }
        },
        {
          icon: Coins,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          title: {
            ar: "هيكل محاسبة التكاليف والمخزون",
            fr: "Analyse Financière & Prix",
            en: "Dynamic Resource Costing"
          },
          desc: {
            ar: "تعديل أسعار المواد الإقليمية وحساب فوري للتكلفة الكلية للمتر المكعب، ومقارنة فورية لربحية المشاريع.",
            fr: "Mise à jour en temps réel du coût par m³, comparaison budgétaire des variantes pour l'optimisation économique.",
            en: "Update regional component costs to dynamically monitor total per m³ price, comparing variants for maximum profitability."
          }
        }
      ]
    },
    howItWorks: {
      title: {
        ar: "كيف تعمل منصة SNO AI؟",
        fr: "Comment ça marche ?",
        en: "How It Works"
      },
      subtitle: {
        ar: "خطوات هندسية متكاملة للوصول إلى الخلطة الخرسانية المثالية وتوثيقها",
        fr: "Quatre étapes clés pour concevoir et faire certifier vos mélanges de béton",
        en: "Four structured steps to design, calibrate, and document your concrete recipes"
      },
      steps: [
        {
          num: "01",
          title: { ar: "إنشاء المشروع والمصنع", fr: "Créer Projet / Centrale", en: "Establish Location & Project" },
          desc: {
            ar: "اختر المحطة المركزية، حدد العميل والمشروع الفعال، وفئة التعرض البيئي للمتانة.",
            fr: "Sélectionnez la centrale à béton, le client actif et la classe d'exposition environnementale.",
            en: "Configure active batching plants, target client scopes, and specify exposure durability environments."
          }
        },
        {
          num: "02",
          title: { ar: "إدخال المعايير المستهدفة", fr: "Saisir les Paramètres", en: "Set Design Targets" },
          desc: {
            ar: "حدد مقاومة الضغط (fc28)، درجة الهبوط بقمع أبرامز، القطر الأقصى للحجر ونوع الإسمنت.",
            fr: "Définissez fc28, la classe d'affaissement, le diamètre maximal Dmax, et le type de ciment.",
            en: "Input specified fc28 strength, slump consistency, aggregate maximum grain size, and cement class."
          }
        },
        {
          num: "03",
          title: { ar: "البثق والتحسين التلقائي", fr: "Générer & Optimiser", en: "Auto-Optimize dosage" },
          desc: {
            ar: "حساب فوري لتناسب المواد الجافة والمبللة وتحديد الجرعات ومطابقة اختبارات الجودة.",
            fr: "Obtenez instantanément les dosages précis, les courbes de compacité et les prix au m³.",
            en: "Instantly obtain volumetric balances, packing optimization curves, and real-time durability checks."
          }
        },
        {
          num: "04",
          title: { ar: "تصدير الملف المعتمد", fr: "Exporter le Rapport", en: "Export Verified PDF" },
          desc: {
            ar: "تحميل التقرير الفني الموثق بصفحة الغلاف الاستشارية والملخص المالي جاهزاً للتسليم والمطابقة.",
            fr: "Téléchargez des rapports techniques professionnels intégrant des synthèses financières et la compliance.",
            en: "Download comprehensive tech dossiers with executive summaries and economic reports ready for submit."
          }
        }
      ]
    },
    whoItIsFor: {
      title: {
        ar: "لمن صممت هذه المنصة؟",
        fr: "À qui s'adresse cette plateforme ?",
        en: "Who Is It Built For?"
      },
      subtitle: {
        ar: "حلول تقنية متقدمة تلبي متطلبات كافة قطاعات الهندسة والإنتاج الخرساني",
        fr: "Des solutions intelligentes pour tous les acteurs de l'industrie du béton",
        en: "Intelligent workspace designed for every stakeholder in the concrete value chain"
      },
      items: [
        {
          icon: Users,
          title: { ar: "المهندسون الاستشاريون", fr: "Bureaux d'Études", en: "Consulting Engineers" },
          desc: {
            ar: "لتدقيق ومراجعة خلطات الورش، وتقييم جودة المواد الاستهلاكية، وتثبيت مستندات معتمدة للمشاريع.",
            fr: "Pour valider les recettes de chantiers, vérifier la durabilité et produire des notes de calcul conformes.",
            en: "To verify, review, and lock recipe compositions in and produce compliant consulting documentation."
          }
        },
        {
          icon: Building,
          title: { ar: "مصانع الخرسانة الجاهزة", fr: "Centrales à Béton", en: "Ready-Mix Batching Plants" },
          desc: {
            ar: "لتحسين تسعير المتر المكعب وتقليل الفائض الأسمنتي مع ضمان مطابقة مقاومة المترو والكسر الفعلي.",
            fr: "Pour optimiser le coût de revient par m³, économiser le ciment et assurer la conformité qualité.",
            en: "Optimize cost margins, maximize aggregate packing layout, and safely reduce cement percentages."
          }
        },
        {
          icon: FlaskConical,
          title: { ar: "مختبرات الهندسة المدنية", fr: "Laboratoires de Contrôle", en: "Geotechnical Labs" },
          desc: {
            ar: "لإجراء فرز الركامات، ومتابعة منحنيات التدرج، وتوثيق فحوص كسر الخرسانة بدفتر حسابات رقمي.",
            fr: "Pour tracer la granulométrie des carrières, enregistrer les écrasements et éditer les rapports officiels.",
            en: "Track quarry sieve distributions, calibrate wet moisture metrics, and issue certified compliance certifications."
          }
        },
        {
          icon: GraduationCap,
          title: { ar: "الباحثون والجامعات", fr: "Universités & Chercheurs", en: "Academia & Universities" },
          desc: {
            ar: "لدراسة وتحليل نموذج التصميم Dreux-Gorisse دراسياً بدفتر حسابات أكاديمي مفصل.",
            fr: "Pour analyser académiquement les lois physiques de compacité de Dreux et enseigner la formulation théorique.",
            en: "To analyze mathematical theories, validate Dreux-Gorisse packing curve models, and run civil engineering labs."
          }
        }
      ]
    },
    ctaSection: {
      title: {
        ar: "صمّم خلطتك الخرسانية الاحترافية الأولى اليوم",
        fr: "Concevez votre premier mélange de béton dès maintenant",
        en: "Formulate Your First Compliant Concrete Recipe Today"
      },
      desc: {
        ar: "انضم إلى المكاتب الاستشارية والمحطات المركزية التي تعتمد على SNO Engineering AI لرفع مخرجات الجودة وتقليص كلف الإنتاج.",
        fr: "Rejoignez les leaders de l'ingénierie civile utilisant SNO AI pour automatiser leurs calculs de composition.",
        en: "Join professional engineering consultancies using SNO AI to streamline calculations and optimize materials."
      },
      btn: {
        ar: "ابدأ مسار العمل الآن (Start Workspace)",
        fr: "Accéder à l'Espace de Calcul",
        en: "Open Design Workspace Now"
      }
    },
    nav: {
      title: { ar: "بوابة SNO الذكية", fr: "Portail SNO AI", en: "SNO AI Portal" },
      enterWorkspace: { ar: "مسار التصميم ⚙", fr: "Workspace ⚙", en: "Workspace ⚙" }
    }
  };

  const currentThemeIcon = themeSetting === "dark" 
    ? <Moon size={14} className="text-indigo-400" />
    : themeSetting === "light" 
      ? <Sun size={14} className="text-amber-500" />
      : <Monitor size={14} className="text-emerald-500" />;

  const tLanding = (field: any) => {
    return field[language] || field["ar"] || "";
  };

  return (
    <div 
      className={`min-h-screen transition-colors duration-350 overflow-x-hidden ${themeMode === "dark" ? "bg-[#0B1120] text-slate-100" : "bg-[#F1F5F9] text-slate-900"}`}
      dir={isRtl ? "rtl" : "ltr"}
      id="sno-landing-page-root"
    >
      {/* 1. TOP BAR NAVBAR */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors px-4 md:px-8 py-3 ${themeMode === "dark" ? "bg-[#0B1120]/80 border-slate-800/80" : "bg-[#F1F5F9]/80 border-slate-200/80"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={onStartProject}>
            <SnoLabLogo themeMode={themeMode} />
          </div>

          {/* Nav Links / Quick Controls */}
          <div className="flex items-center gap-2.5 md:gap-4 shrink-0">
            {/* Quick Language Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setLanguage("ar")}
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  language === "ar" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                🇸🇦 AR
              </button>
              <button
                onClick={() => setLanguage("fr")}
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  language === "fr" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                🇫🇷 FR
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  language === "en" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                🇺🇸 EN
              </button>
            </div>

            {/* Quick Theme Select loop */}
            <div className="relative group">
              <button
                onClick={() => {
                  const next: Record<"light"|"dark"|"system", "light"|"dark"|"system"> = {
                    light: "dark",
                    dark: "system",
                    system: "light"
                  };
                  setThemeSetting(next[themeSetting]);
                }}
                className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center"
                title="SNO visual theme selector (Light -> Dark -> System)"
              >
                {currentThemeIcon}
              </button>
            </div>

            {/* Action Gateway */}
            <button
              onClick={onStartProject}
              className="bg-blue-600 hover:bg-blue-500 hover:scale-103 active:scale-97 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
            >
              <span>{tLanding(content.nav.enterWorkspace)}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-28" id="sno-hero-section">
        {/* Subtle decorative glowing background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[650px] h-[350px] md:h-[650px] bg-blue-500/10 dark:bg-blue-600/10 blur-[80px] md:blur-[130px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute top-10 right-10 w-[200px] h-[200px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none z-0"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-right">
          
          {/* Hero Left info */}
          <div className={`lg:col-span-7 flex flex-col space-y-6 ${isRtl ? "text-right" : "text-left"}`}>
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="self-start"
            >
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-[11px] font-black border border-blue-500/20 tracking-wide uppercase">
                {tLanding(content.hero.badge)}
              </span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-tight"
            >
              {tLanding(content.hero.title)}
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-2xl"
            >
              {tLanding(content.hero.desc)}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`flex flex-wrap gap-3 pt-3 justify-start ${isRtl ? "" : "flex-row-reverse"}`}
            >
              <button
                onClick={onStartProject}
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm px-6 py-3 rounded-xl transition-all shadow-xl hover:shadow-blue-500/10 hover:scale-102 flex items-center gap-2 cursor-pointer"
              >
                <span>{tLanding(content.hero.ctaStart)}</span>
                {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>

              <button
                onClick={() => {
                  document.getElementById("sno-benefits-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs md:text-sm px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5`}
              >
                <ArrowDown size={14} className="animate-bounce" />
                <span>{tLanding(content.hero.ctaLearn)}</span>
              </button>
            </motion.div>

            {/* Performance Tickers Info */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-8 mt-6"
            >
              <div>
                <strong className="block text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {content.hero.stats.recipes.val}
                </strong>
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 block font-bold font-sans mt-0.5">
                  {tLanding(content.hero.stats.recipes.lbl)}
                </span>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-800 px-4">
                <strong className="block text-2xl md:text-3xl font-black text-emerald-500 font-mono flex items-center gap-0.5 justify-start">
                  <span>{content.hero.stats.co2.val}</span>
                  <Percent size={14} className="text-emerald-500" />
                </strong>
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 block font-bold font-sans mt-0.5">
                  {tLanding(content.hero.stats.co2.lbl)}
                </span>
              </div>
              <div>
                <strong className="block text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {content.hero.stats.accuracy.val}
                </strong>
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 block font-bold font-sans mt-0.5">
                  {tLanding(content.hero.stats.accuracy.lbl)}
                </span>
              </div>
            </motion.div>

          </div>

          {/* Hero Right Interactive Mock Dashboard representation */}
          <div className="lg:col-span-5 relative w-full flex justify-center">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="w-full max-w-sm bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 overflow-hidden text-right space-y-4"
              id="hero-dashboard-mockup"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1 text-[9.5px] font-black text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200/50 dark:border-slate-800 font-mono">
                  c28_strength_calc.d3
                </div>
              </div>

              {/* Sieve Packing Packing visual mock representation */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200/40 dark:border-slate-900 flex flex-col justify-between h-40 relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 bottom-0 bg-grid-slate-200/[0.05] pointer-events-none"></div>
                <div className="flex items-center justify-between z-10">
                  <span className="text-[12px] font-black text-slate-800 dark:text-slate-200">
                    {language === "ar" ? "قوام صلد (Abrams Slump)" : "Abrams Slump consistency"}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono border border-emerald-500/20">
                    S3 (8-10 cm)
                  </span>
                </div>

                {/* Sieve pseudo graph lines */}
                <div className="h-16 flex items-end gap-1.5 py-1.5 z-10 relative">
                  <svg className="absolute inset-0 w-full h-full text-slate-300 dark:text-slate-800" fill="none">
                    <path d="M 0 55 Q 80 40 180 20 T 320 0" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
                    <path d="M 0 60 Q 90 25 210 10 T 320 0" stroke="#3B82F6" strokeWidth="2.5" className="animate-pulse"/>
                  </svg>
                  <div className="h-full w-full"></div>
                </div>

                <div className="flex justify-between items-center z-10 text-[9px] font-mono text-slate-400">
                  <span>D_Max = 20 mm</span>
                  <span>Dreux-Gorisse Target Curve</span>
                  <span>0.08 mm</span>
                </div>
              </div>

              {/* Proportions preview list mockup */}
              <div className="space-y-2">
                <span className="text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase block font-sans">
                  {language === "ar" ? "جرعات المتر المكعب (Dosages):" : "Mix Dosages preview:"}
                </span>

                <div className="grid grid-cols-2 gap-2 text-right">
                  <div className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block">{language === "ar" ? "الإسمنت بالتفريد" : "Cem I 42.5N"}</span>
                    <strong className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">350 kg/m³</strong>
                  </div>
                  <div className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block">{language === "ar" ? "الرمل الكلي" : "Fine Sand"}</span>
                    <strong className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">624 kg/m³</strong>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs">
                  <strong className="text-blue-600 dark:text-blue-400 font-mono font-black">0.48</strong>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black">
                    {language === "ar" ? "معيار الماء/الإسمنت W/C" : "Water/Cement factor"}
                  </span>
                </div>
              </div>

              {/* Advisor suggestion mock line */}
              <div className="bg-slate-900 border border-slate-800 text-[10.5px] p-2.5 rounded-xl text-slate-300 leading-relaxed font-sans flex items-center gap-2">
                <Sparkles size={11} className="text-blue-400 shrink-0 animate-pulse" />
                <span className="truncate">
                  {language === "ar" ? "مستشار الذكاء الاصطناعي: الخلطة مستوفية لشروط EN 206 بنجاح!" : "Advisor: This mix fully complies with EN 206 standards successfully!"}
                </span>
              </div>

            </motion.div>

          </div>

        </div>
      </section>

      {/* 3. PLATFORM BENEFITS SECTION */}
      <section className="py-20 bg-slate-50/50 dark:bg-[#090D1E]/40 border-y border-slate-200 dark:border-slate-850" id="sno-benefits-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight">
              {tLanding(content.benefits.title)}
            </h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-normal font-sans">
              {tLanding(content.benefits.subtitle)}
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.benefits.items.map((b, idx) => {
              const IconComp = b.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-md space-y-4 text-right cursor-default transition-all"
                >
                  <div className={`p-3 rounded-xl inline-flex ${b.bg} ${b.color}`}>
                    <IconComp size={20} />
                  </div>
                  <div className={`space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
                    <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 font-sans">
                      {tLanding(b.title)}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                      {tLanding(b.desc)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="py-20" id="sno-howitworks-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight">
              {tLanding(content.howItWorks.title)}
            </h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-normal font-sans">
              {tLanding(content.howItWorks.subtitle)}
            </p>
          </div>

          {/* Timeframe steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Horizontal timeline connector */}
            <div className="absolute top-1/4 left-8 right-8 h-px border-t border-dashed border-slate-200 dark:border-slate-800 hidden lg:block pointer-events-none z-0"></div>

            {content.howItWorks.steps.map((st, idx) => (
              <div key={idx} className={`relative flex flex-col space-y-4 z-10 ${isRtl ? "text-right" : "text-left"}`}>
                <span className="h-12 w-12 bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center rounded-xl shadow-lg font-mono">
                  {st.num}
                </span>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 font-sans">
                    {tLanding(st.title)}
                  </h4>
                  <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans pr-1">
                    {tLanding(st.desc)}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. WHO IS IT FOR? SECTION */}
      <section className="py-20 bg-slate-50/50 dark:bg-[#090D1E]/40 border-t border-slate-200 dark:border-slate-850" id="sno-whoitisfor-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight">
              {tLanding(content.whoItIsFor.title)}
            </h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-normal font-sans">
              {tLanding(content.whoItIsFor.subtitle)}
            </p>
          </div>

          {/* Target Audience sectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.whoItIsFor.items.map((sec, idx) => {
              const SComp = sec.icon;
              return (
                <div 
                  key={idx} 
                  className={`bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between ${isRtl ? "text-right" : "text-left"}`}
                >
                  <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg self-start">
                    <SComp size={18} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-slate-100 font-sans">
                      {tLanding(sec.title)}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                      {tLanding(sec.desc)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 6. CALL TO ACTION (CTA) SECTION */}
      <section className="py-16 md:py-24 relative overflow-hidden" id="sno-cta-section">
        {/* Glow decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent dark:from-blue-600/20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-96 h-48 bg-blue-500/10 dark:bg-blue-500/15 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative z-10 space-y-6">
          <motion.div
            whileInView={{ scale: [0.95, 1.02, 1] }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-snug">
              {tLanding(content.ctaSection.title)}
            </h3>
            
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto font-sans">
              {tLanding(content.ctaSection.desc)}
            </p>

            <div className="pt-2">
              <button
                onClick={onStartProject}
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm md:text-base px-8 py-3.5 rounded-xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{tLanding(content.ctaSection.btn)}</span>
                {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. LANDING FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-slate-100/50 dark:bg-[#060A14]/80 text-xs text-slate-500 font-sans px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-right">
            <p>© {new Date().getFullYear()} SNO Engineering AI. All rights reserved.</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Standard Model packing optimizer</p>
          </div>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">{language === "ar" ? "الشروط والاستخدام" : "Terms"}</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">{language === "ar" ? "قسط ومكعب الخرسانة" : "Concrete trial index"}</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
