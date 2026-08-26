import React, { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage, getLocalizedValue } from "./services/localization";
import { useTheme } from "./hooks/useTheme";
import { 
  AggregateType, 
  AggregateQuality, 
  MixDesignInput, 
  Admixture,
  ActiveProject,
  EngineeringMaterial
} from "./types";
import { ExpandedMaterial } from "./data/expandedMaterials";
import { 
  calculateDreuxGorisse, 
  CEMENT_TYPES, 
  STANDARD_ADMIXTURES_LIST,
  ALGERIAN_MATERIALS_PRESETS,
  getRecommendedCoefficients
} from "./utils";
import { GradingChart } from "./components/GradingChart";
import { InteractiveTooltip } from "./components/InteractiveTooltip";
import { resolveMaterials } from "./utils/resolveMaterials";
import { MixVersioningPanel } from "./components/MixVersioningPanel";
import { LandingPage } from "./components/LandingPage";
import { LoginGate } from "./components/LoginGate";
import { AdminPanel } from "./components/AdminPanel";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { StatusBar } from "./components/StatusBar";
import { MixQualityScore } from "./components/MixQualityScore";
import { ConcreteImageVisualizer } from "./components/ConcreteImageVisualizer";
import { StrengthDevelopmentChart } from "./components/StrengthDevelopmentChart";
import { MethodInfoCard } from "./components/MethodInfoCard";
import { MethodReadinessChecklist } from "./components/MethodReadinessChecklist";
import { checkMixCompliance } from "./mix-design-methods/complianceChecker";
import { MixDesignMethodId } from "./mix-design-methods/types";
import { MaterialPropertiesCard } from "./components/MaterialPropertiesCard";
import { MaterialsIntegrationAudit } from "./components/MaterialsIntegrationAudit";
import { validateCalculationLogic } from "./engine/validationGate";
import { EngineeringCore, ProjectSession } from "./engine/EngineeringCore";
import { CalculationValidationGatePanel } from "./components/CalculationValidationGatePanel";
import { CONCRETE_TYPES_CATALOG, getConcreteTypeDetails, CONCRETE_TYPE_CONFIGS } from "./concreteTypes";
import { LogicalResultsSummary } from "./components/LogicalResultsSummary";
import { isUserMaterial } from "./engine/suitabilityGate";
import { SnoLabLogo } from "./components/SnoLabLogo";
import { STRUCTURAL_ELEMENTS, getStructuralElementById } from "./data/structuralElements";

// Lazy-loaded heavy panels for core bundle size optimization
const LaboratoryDashboard = React.lazy(() => import("./components/materials-lab/LaboratoryDashboard").then(m => ({ default: m.LaboratoryDashboard })));
import { INITIAL_MATERIAL_TESTS } from "./data/seedMaterialTests";
import { MaterialTestRecord, TestApprovalStatus } from "./types/laboratoryTypes";
import { applyTestToMaterial } from "./services/materialLabSync";
const RecipeReport = React.lazy(() => import("./components/RecipeReport").then(m => ({ default: m.RecipeReport })));
const ChemicalDosageMonitor = React.lazy(() => import("./components/ChemicalDosageMonitor").then(m => ({ default: m.ChemicalDosageMonitor })));
const SieveGradingCurves = React.lazy(() => import("./components/SieveGradingCurves").then(m => ({ default: m.SieveGradingCurves })));
const CostAnalysisDashboard = React.lazy(() => import("./components/CostAnalysisDashboard").then(m => ({ default: m.CostAnalysisDashboard })));


const DreuxMethodPanel = React.lazy(() => import("./components/DreuxMethodPanel").then(m => ({ default: m.DreuxMethodPanel })));
const EngineeringKnowledgeCenter = React.lazy(() => import("./components/EngineeringKnowledgeCenter").then(m => ({ default: m.EngineeringKnowledgeCenter })));
const MaterialEngineeringDatabase = React.lazy(() => import("./components/MaterialEngineeringDatabase").then(m => ({ default: m.MaterialEngineeringDatabase })));
const AggregatesEngineeringLibrary = React.lazy(() => import("./components/AggregatesEngineeringLibrary").then(m => ({ default: m.AggregatesEngineeringLibrary })));

// Expanded lazy-loaded heavy/charted elements for micro bundle size optimizations
const EngineeringInsights = React.lazy(() => import("./components/EngineeringInsights").then(m => ({ default: m.EngineeringInsights })));
const ConcreteSlumpVisualizer = React.lazy(() => import("./components/ConcreteSlumpVisualizer").then(m => ({ default: m.ConcreteSlumpVisualizer })));
const ConcreteHeatMap = React.lazy(() => import("./components/ConcreteHeatMap").then(m => ({ default: m.ConcreteHeatMap })));
const StrengthSimulationPanel = React.lazy(() => import("./components/StrengthSimulationPanel").then(m => ({ default: m.StrengthSimulationPanel })));
const VisualConcreteSimulation = React.lazy(() => import("./components/VisualConcreteSimulation").then(m => ({ default: m.VisualConcreteSimulation })));
const ConcreteRecommendationsCard = React.lazy(() => import("./components/ConcreteRecommendationsCard").then(m => ({ default: m.ConcreteRecommendationsCard })));
const SmartMaterialsSuggester = React.lazy(() => import("./components/SmartMaterialsSuggester").then(m => ({ default: m.SmartMaterialsSuggester })));
const MixOptimizationPanel = React.lazy(() => import("./components/MixOptimizationPanel").then(m => ({ default: m.MixOptimizationPanel })));
const CalculationJournal = React.lazy(() => import("./components/CalculationJournal").then(m => ({ default: m.CalculationJournal })));
const ReportCompliance = React.lazy(() => import("./components/ReportCompliance").then(m => ({ default: m.ReportCompliance })));
const ReportThermalAnalysis = React.lazy(() => import("./components/ReportThermalAnalysis").then(m => ({ default: m.ReportThermalAnalysis })));
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  Cpu, 
  Settings, 
  Compass, 
  HardHat, 
  Droplet, 
  FileText, 
  Activity, 
  Layout, 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  Scale, 
  Flame, 
  RefreshCw,
  Printer,
  ChevronLeft,
  Info,
  Sliders,
  CheckCircle2,
  Lock,
  Unlock,
  Coins,
  Sun,
  Moon,
  Database,
  Calculator,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  Trash2,
  Save,
  CloudLightning,
  History,
  UserCheck,
  Menu,
  GraduationCap,
  Bell,
  Globe,
  Folder,
  User,
  ChevronDown,
  ChevronUp,
  Home,
  Briefcase,
  PlusCircle,
  Building,
  Calendar,
  LogOut,
  MapPin,
  Check,
  Monitor,
  FlaskConical,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowLeftRight,
  BookOpen
} from "lucide-react";

import { 
  auth, 
  db, 
  signInWithPopup, 
  signOut, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, query, where, serverTimestamp, setDoc, deleteDoc, onSnapshot, orderBy, getDoc, getDocs } from "firebase/firestore";

// Helper to load default prices from local storage if any
const getInitialPrice = (key: string, defaultVal: number): number => {
  try {
    const saved = localStorage.getItem(`mixwizard_price_${key}`);
    return saved !== null ? parseFloat(saved) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

export function normalizeInputsToDreux(inputs: any): MixDesignInput {
  if (!inputs) return inputs;
  return {
    ...inputs,
    selectedMethod: "dreux"
  };
}

export const METHOD_CONFIGS: Record<string, {
  name: string;
  nameAr: string;
  nameFr: string;
  classification: "complete" | "support";
  fields: Record<string, "required" | "optional" | "not_used">;
  origin: string;
  year: string;
  application: string;
  applicationAr: string;
  applicationFr: string;
  applicationEn: string;
  prosAr: string;
  prosFr: string;
  prosEn: string;
  consAr: string;
  consFr: string;
  consEn: string;
  formulaAr: string;
  formulaFr: string;
  formulaEn: string;
}> = {
  dreux: {
    name: "Dreux-Gorisse",
    nameAr: "درو-غوريس (Dreux-Gorisse)",
    nameFr: "Dreux-Gorisse",
    classification: "complete",
    origin: "France / Algeria",
    year: "1970",
    application: "Structural Concrete, General civil works",
    applicationAr: "الخرسانة الإنشائية ومختلف أعمال الهندسة المدنية الكبيرة.",
    applicationFr: "Béton structurel et divers travaux de génie civil général.",
    applicationEn: "Structural concrete and various general civil engineering works.",
    prosAr: "تحديد دقيق للمنحنى الحبيبي المستهدف بناءً على معامل الملاءمة الفراغي الكلي ورص الحبات الحركي.",
    prosFr: "Détermination précise de la courbe de référence basée sur la compacité maximale.",
    prosEn: "Precise determination of the target grading curve based on maximum packing density.",
    consAr: "تتطلب حسابات معامل غاما وتأخذ وقتاً أكبر في القياس الرياضي في حال وجود إضافات كثيفة.",
    consFr: "Nécessite de multiples calculs et ajustements en cas d'additions de fines importantes.",
    consEn: "Requires complex corrections of grain packing factors when using chemical admixtures.",
    formulaAr: "C/E = (fcm / (A × fce)) + 0.5",
    formulaFr: "C/E = (fcm / (A × fce)) + 0.5",
    formulaEn: "C/W = (fcm / (A × fce)) + 0.5",
    fields: {
      fck28: "required",
      slump: "required",
      dMax: "required",
      cementType: "required",
      cementClassStrength: "required",
      aggregateType: "required",
      aggregateQuality: "required",
      moisture: "optional",
      packingFactor: "required",
      exposureClass: "required",
      airContent: "not_used",
      specificGravity: "not_used",
      internalUnitWeight: "not_used",
      internalCoeffG: "not_used",
      internalCurveCoeff: "not_used",
      internalSandRatio: "not_used",
    }
  }
};

interface PriceInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  step?: number;
  unit?: string;
  currencySymbol: string;
}

const PriceInput: React.FC<PriceInputProps> = ({ label, value, onChange, step = 1, unit = "", currencySymbol }) => {
  const handleDecrement = () => {
    const val = parseFloat((Math.max(0, value - step)).toFixed(2));
    onChange(val);
  };
  
  const handleIncrement = () => {
    const val = parseFloat((value + step).toFixed(2));
    onChange(val);
  };

  return (
    <div className="flex flex-col justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-slate-700 dark:text-slate-300">
        <span className="font-sans text-right">{label}:</span>
        <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px] uppercase font-bold">{unit}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-805 dark:text-slate-200 rounded-lg cursor-pointer select-none font-bold text-sm transition-all shadow-sm active:scale-95"
        >
          -
        </button>
        
        {/* Actual Number Input */}
        <div className="relative flex-1">
          <input
            type="number"
            value={isNaN(value) ? "" : value}
            step="any"
            min="0"
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              onChange(isNaN(parsed) ? 0 : parsed);
            }}
            className="w-full h-8 px-2 pl-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-705 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 font-sans text-[9px] font-bold text-slate-400 select-none">
            {currencySymbol}
          </span>
        </div>
        
        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-805 dark:text-slate-200 rounded-lg cursor-pointer select-none font-bold text-sm transition-all shadow-sm active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
};

export const enrichMaterials = (mats: EngineeringMaterial[]): EngineeringMaterial[] => {
  const standardUIDMap: Record<string, string> = {
    "preset-fine-sand": "MAT-SND-10001",
    "preset-medium-sand": "MAT-SND-10002",
    "preset-desert-sand": "MAT-SND-10003",
    "preset-coarse-sand": "MAT-SND-10004",
    "preset-gravel-biskra": "MAT-GRV-20001",
    "preset-gravel-bouira": "MAT-GRV-20002",
    "preset-gravel-jijel": "MAT-GRV-20003",
    "preset-cement-chlef": "MAT-CEM-30001",
    "preset-cement-meftah": "MAT-CEM-30002",
    "preset-potable-water": "MAT-WTR-40001"
  };

  const seenIds = new Set<string>();
  const enriched: EngineeringMaterial[] = [];

  for (let i = 0; i < mats.length; i++) {
    const m = mats[i];
    if (!m) continue;

    let finalId = m.id;
    if (standardUIDMap[m.id]) {
      finalId = standardUIDMap[m.id];
    } else if (!m.id || !m.id.startsWith("MAT-")) {
      const prefix = 
        m.category === "رمال" ? "MAT-SND" :
        m.category === "حصى" ? "MAT-GRV" :
        m.category === "إسمنت" ? "MAT-CEM" :
        m.category === "إضافات كيميائية" || m.category === "إضافات معدنية" ? "MAT-ADM" : "MAT-OTH";
      
      // Generate a stable hash from material's ID or name
      const stableStr = m.id || m.name || "";
      let hash = 0;
      for (let j = 0; j < stableStr.length; j++) {
        hash = (hash << 5) - hash + stableStr.charCodeAt(j);
        hash |= 0;
      }
      const uniqueNum = Math.abs(hash) % 1000000;
      finalId = `${prefix}-${uniqueNum}`;
    }

    // De-duplicate: if we already have this ID, resolve it deterministically
    let deDupId = finalId;
    let suffix = 1;
    while (seenIds.has(deDupId)) {
      deDupId = `${finalId}-${suffix}`;
      suffix++;
    }
    seenIds.add(deDupId);

    let supplierName = m.supplierName;
    let quarryName = m.quarryName;
    let supplierContact = m.supplierContact;
    let certificationStatus = m.certificationStatus;
    
    // Map status accurately to one of the allowed union types
    let approvalStatus: any = "Approved";
    const rawStatus = m.ApprovalStatus as string | undefined;
    if (rawStatus === "Draft") {
      approvalStatus = "Draft";
    } else if (rawStatus === "Pending Review" || rawStatus === "Review" || rawStatus === "Under Review") {
      approvalStatus = "Pending Review";
    } else if (rawStatus === "Archived" || rawStatus === "mats_archived") {
      approvalStatus = "Archived";
    } else if (rawStatus === "Rejected") {
      approvalStatus = "Rejected";
    } else if (rawStatus === "Validated") {
      approvalStatus = "Validated";
    } else if (rawStatus === "Incomplete") {
      approvalStatus = "Incomplete";
    } else if (rawStatus === "Not Verified") {
      approvalStatus = "Not Verified";
    } else if (rawStatus === "Approved" || rawStatus === "Certified" || !rawStatus) {
      approvalStatus = "Approved";
    }

    if (!supplierName) {
      if (m.category === "رمال") {
        supplierName = "شركة رمال الهضاب العليا الوطنية";
        quarryName = m.provenance ? `مقلع رمال ${m.provenance}` : "مقلع رمال الوادي المخروطي";
        supplierContact = "+213 29 88 44 22";
        certificationStatus = "سارية الصلاحية - شهادة فحص رقم SE-901";
      } else if (m.category === "حصى") {
        supplierName = "المؤسسة العمومية للركام والبحص";
        quarryName = m.provenance ? `محجرة ركام ${m.provenance}` : "محجرة ركام الأخضرية";
        supplierContact = "+213 26 42 11 99";
        certificationStatus = "مطابق لعموم المنشآت والجسور البنيوية";
      } else if (m.category === "إسمنت") {
        supplierName = m.name.includes("الشلف") ? "مجمع الإسمنت الصناعي بالشلف (GICA Chlef Group)" : "المؤسسة الوطنية لإسمنت مفتاح";
        quarryName = m.name.includes("الشلف") ? "محجر الصخور الجيرية بالشلف" : "محجر الطين والجبس بمفتاح";
        supplierContact = "+213 27 77 15 15";
        certificationStatus = "معتمد ومعاير مخبرياً - NA 442";
      } else {
        supplierName = "الشركة الجزائرية للمناولة والكيماويات الهندسية";
        quarryName = "مصنع إنتاج المذيبات والبوليمرات الفائقة";
        supplierContact = "+213 21 54 90 12";
        certificationStatus = "مطابقة فنية بشهادة CE و EN 934-2";
      }
    }

    const isPreset = m.id && (m.id.startsWith("preset-") || m.id.includes("seeded") || m.id.includes("fallback") || m.id.includes("default") || m.id.includes("demo"));
    const extraProps: Partial<EngineeringMaterial> = {};
    if (isPreset) {
      if (m.category === "رمال") {
        extraProps.SandEquivalent = m.SandEquivalent !== undefined ? m.SandEquivalent : (m.name.includes("ناعم") ? 72 : 84);
        extraProps.MethyleneBlue = m.MethyleneBlue !== undefined ? m.MethyleneBlue : (m.name.includes("ناعم") ? 1.4 : 0.8);
        extraProps.Chlorides = m.Chlorides !== undefined ? m.Chlorides : 0.012;
        extraProps.Sulfates = m.Sulfates !== undefined ? m.Sulfates : 0.015;
      } else if (m.category === "حصى") {
        extraProps.LosAngeles = m.LosAngeles !== undefined ? m.LosAngeles : (m.name.includes("بسكرة") ? 16 : 22);
        extraProps.flakinessIndex = m.flakinessIndex !== undefined ? m.flakinessIndex : 11;
        extraProps.elongationIndex = m.elongationIndex !== undefined ? m.elongationIndex : 8;
        extraProps.crushingValue = m.crushingValue !== undefined ? m.crushingValue : 14;
      }
    }

    if (m.category === "إسمنت") {
      extraProps.initialSetting = m.initialSetting !== undefined ? m.initialSetting : 125;
      extraProps.finalSetting = m.finalSetting !== undefined ? m.finalSetting : 190;
      extraProps.blaineFineness = m.blaineFineness !== undefined ? m.blaineFineness : 3380;
      extraProps.strength2d = m.strength2d !== undefined ? m.strength2d : 22.5;
      extraProps.strength28d = m.strength28d !== undefined ? m.strength28d : 52.5;
    } else if (m.category === "إضافات كيميائية" || m.category === "إضافات معدنية") {
      extraProps.solidContent = m.solidContent !== undefined ? m.solidContent : 38;
      extraProps.chlorideContent = m.chlorideContent !== undefined ? m.chlorideContent : 0.01;
    }

    const version = m.version || 1;
    const history = m.lifecycleHistory || [
      {
        date: m.createdDate || "2026-06-01",
        version: version,
        author: "senoussi.s.t@gmail.com",
        changes: "تهيئة وتسجيل المادة ببطاقة الفحص المخبري المعتمدة بمصفوفة التوافق.",
        approvalStatus: approvalStatus
      }
    ];

    const laboratory = m.laboratory || (m.category === "إسمنت" ? "المخبر المركزي لشركة GICA" : m.category === "ماء" ? "مختبر مصلحة المياه والبيئة الوطني" : "المخبر الوطني للسكن والبناء (LNCT)");
    const standard = m.standard || (m.category === "إسمنت" ? "NA 442 (Algerian Standard for Cement)" : m.category === "رمال" || m.category === "حصى" ? "NA 5115 (Aggregates Rule)" : m.category === "إضافات كيميائية" ? "NF EN 934-2" : "NA 17006 (Standards for Concrete)");
    const certificationNumber = m.certificationNumber || (deDupId === "preset-cement-chlef" ? "CERT-DZ-442-2026" : `CERT-QA-${deDupId.replace("MAT-", "")}-2026`);
    const approvalDate = m.approvalDate || m.updatedDate || m.createdDate || "2026-06-15";

    let materialType = m.materialType;
    if (!materialType) {
      const cat = m.category;
      if (cat === "إسمنت" || cat === "مجلدات خاصة" || cat === "الأسمنت") {
        materialType = "مادة رابطة";
      } else if (cat === "رمال" || cat === "حصى" || cat === "ركام خفيف" || cat === "ركام ثقيل" || cat === "الرمال" || cat === "الحصى") {
        materialType = "ركام";
      } else if (cat === "إضافات معدنية" || cat === "مواد مالئة" || cat === "الشوائب المعدنية") {
        materialType = "إضافات معدنية";
      } else if (cat === "ألياف" || cat === "الألياف") {
        materialType = "ألياف";
      } else if (cat === "إضافات كيميائية" || cat === "محتوى الهواء" || cat === "الخلطات الكيميائية") {
        materialType = "إضافات كيميائية";
      } else if (cat === "ماء" || cat === "المياه") {
        materialType = "ماء";
      } else {
        materialType = "أخرى";
      }
    }

    enriched.push({
      ...m,
      id: deDupId,
      MaterialID: deDupId,
      MaterialCode: deDupId,
      version,
      lifecycleHistory: history,
      ApprovalStatus: approvalStatus,
      supplierName,
      quarryName,
      supplierContact,
      certificationStatus,
      laboratory,
      standard,
      certificationNumber,
      approvalDate,
      materialType,
      ...extraProps,
    });
  }

  return enriched;
};

export default function App() {
  const { language, setLanguage, t, isRtl, dir } = useLanguage();

  // Firebase Auth and Firestore states
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const localizedLabel = (ar: string, fr: string, en: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };
  
  const isApprovedAndActive = (m: any) => {
    if (!m) return false;
    const idStr = String(m.id || m.Id || "").toLowerCase();
    
    const appStatus = (m.ApprovalStatus || m.approvalStatus || "");
    const status = (m.status || m.Status || "").toLowerCase();

    const isDraft = appStatus.toLowerCase() === "draft" || status === "draft";
    const isArchived = appStatus.toLowerCase() === "archived" || status === "archived" || status === "موقوف";
    const isRejected = appStatus.toLowerCase() === "rejected" || status === "rejected";

    if (isDraft || isArchived || isRejected) return false;

    const isPresetOrSeeded = idStr.startsWith("preset-") || 
      idStr.includes("seeded") || 
      idStr.includes("fallback") || 
      idStr.includes("default") || 
      idStr.includes("demo");

    const createdBy = String(m.createdBy || m.CreatedBy || m.Createdby || "").toLowerCase();
    const isSystemCreated = createdBy.includes("system") || 
      createdBy.includes("seeded") || 
      createdBy.includes("setup");

    if (isPresetOrSeeded || isSystemCreated) {
      return status !== "archived" && status !== "موقوف" && status !== "draft";
    }

    const isValidatedOrApproved = appStatus === "Validated" || appStatus === "Approved" || appStatus === "Certified" || appStatus.toLowerCase() === "approved";
    const isActiveOrActiveAr = status === "active" || status === "نشط";
    return isValidatedOrApproved && isActiveOrActiveAr;
  };

  const getMaterialOptionLabel = (m: any) => {
    const isUser = isUserMaterial(m);
    const prefix = isUser 
      ? (language === "ar" ? "👤 [مستودع مخصّص] " : "👤 [Custom User] ") 
      : (language === "ar" ? "⚙️ [مستودع النظام] " : "⚙️ [System Base] ");
    const name = language === "ar" ? m.name : (m.englishName || m.name);
    return `${prefix}${name}`;
  };

  const renderMaterialSourceBadge = (materialId: string | null | undefined) => {
    if (!materialId) return null;
    const mat = materialsDatabase.find(m => m.id === materialId);
    if (!mat) return null;
    const isUser = isUserMaterial(mat);
    return (
      <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border w-fit ${
        isUser 
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" 
          : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isUser ? "bg-amber-500 animate-pulse" : "bg-blue-500"}`}></span>
        <span>
          {isUser 
            ? (language === "ar" ? "مستودع المستخدم (مخصّص)" : "User Material (Custom)") 
            : (language === "ar" ? "مستودع النظام (افتراضي ومعتمد)" : "System Material (Standard/Approved)")}
        </span>
      </div>
    );
  };

  const { themeSetting, setThemeSetting, themeMode } = useTheme();
  const [showThemeDropdown, setShowThemeDropdown] = useState<boolean>(false);

  // Sidebar navigation switcher tabs
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    | "calculator"
    | "cost"
    | "reports"
    | "settings"
    | "simulation"
    | "sieve"
    | "optimization"
    | "journal"
    | "plant"
    | "materials_lab"
    | "methodology"
    | "materials_library"
    | "materials_lab"
    | "cement_database"
    | "aggregates_database"
    | "admixtures_database"
    | "compliance_reports"
    | "engineering_assistant"
    | "saved_projects"
    | "cloud_storage"
  >("calculator");

  // Collision states for navigation sidebar category groupings
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    home: false,
    workspace: false,
    materials: false,
    cost: false,
    reports: false,
    assistant: false,
    projects: false,
    settings: false,
    knowledge: false
  });

  // View state: landing page vs workspace
  const [viewMode, setViewMode] = useState<"landing" | "workspace">("landing");

  // Material Engineering Database States and Image Generators
  const [customMaterialImages, setCustomMaterialImages] = useState<Record<string, string>>({});
  const [generatingMaterialKey, setGeneratingMaterialKey] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerateMaterialImage = async (key: string, mat: any) => {
    setGeneratingMaterialKey(key);
    setGenerationError(null);
    try {
      const newUrl = mat.type === "sand" 
        ? "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&h=450&q=80"
        : mat.type === "gravel"
        ? "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?auto=format&fit=crop&w=600&h=450&q=80"
        : "https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=600&h=450&q=80";
      setCustomMaterialImages(prev => ({ ...prev, [key]: newUrl }));
    } catch (err: any) {
      setGenerationError(err.message || "Failed to generate material texture.");
    } finally {
      setGeneratingMaterialKey(null);
    }
  };

  // Reorganization platform states
  const [currentPlant, setCurrentPlant] = useState<string>("Algiers Central (A101)");
  const [currentProject, setCurrentProject] = useState<string>("Trident Mosque Tower (#PROJ-99)");
  const [currentClient, setCurrentClient] = useState<string>("COSIDER Group");
  const [showPlantDropdown, setShowPlantDropdown] = useState<boolean>(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState<boolean>(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);
  
  const plantsList = [
    "Algiers Central (A101)",
    "Oran East Batching (O202)",
    "Hassi Messaoud Oil Rig Mixers (H303)",
    "Constantine Rock Co. (C404)"
  ];
  
  const projectsList = [
    "Trident Mosque Tower (#PROJ-99)",
    "East-West Highway Viaduct (#PROJ-108)",
    "Algiers Metro Line Extension (#PROJ-044)",
    "Sidi Abdellah Housing Complex (#PROJ-012)"
  ];

  const clientsList = [
    "COSIDER Group",
    "Algerian National Building Corp",
    "Mediterranean ReadyMix Co.",
    "Sonatrach Refinement Group"
  ];

  
  // State for Materials Laboratory Characterization System
  const [materialTestRecords, setMaterialTestRecords] = useState<MaterialTestRecord[]>(() => {
    try {
      const saved = localStorage.getItem("snolab_material_tests_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load material tests:", e);
    }
    return INITIAL_MATERIAL_TESTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("snolab_material_tests_v1", JSON.stringify(materialTestRecords));
    } catch (e) {
      console.error("Failed to persist material tests:", e);
    }
  }, [materialTestRecords]);

  const [materialsDatabase, setMaterialsDatabase] = useState<EngineeringMaterial[]>(() => {
    try {
      const saved = localStorage.getItem("mixwizard_materials_db");
      let deletedMap: Record<string, number> = {};
      try {
        const savedDel = localStorage.getItem("mixwizard_deleted_materials");
        if (savedDel) {
          deletedMap = JSON.parse(savedDel) || {};
        }
      } catch (e) {
        console.error("Failed to parse deleted materials map on initialization", e);
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return enrichMaterials(parsed).filter(m => {
            const delTime = deletedMap[m.id];
            if (delTime !== undefined) {
              const updatedAt = m.updatedAt ? (typeof m.updatedAt === "number" ? m.updatedAt : new Date(m.updatedAt).getTime()) : 0;
              if (updatedAt < delTime) {
                return false;
              }
            }
            return true;
          });
        }
      }
    } catch (e) {
      console.error("Failed to parse materials database from localStorage", e);
    }
    return []; // Start completely empty
  });

  const aggregateValidation = useMemo(() => {
    const mats = materialsDatabase || [];
    
    // 1. Are there any sands?
    const sands = mats.filter(m => m.category === "رمال");
    const activeSands = sands.filter(isApprovedAndActive);
    
    // 2. Are there any gravels?
    const gravels = mats.filter(m => m.category === "حصى" || m.category === "ركام خفيف" || m.category === "ركام ثقيل");
    const activeGravels = gravels.filter(isApprovedAndActive);
    
    const hasSand = sands.length > 0;
    const hasActiveSand = activeSands.length > 0;
    
    const hasGravel = gravels.length > 0;
    const hasActiveGravel = activeGravels.length > 0;
    
    // Block calculations/navigation if there is no sand, or no active sand, or no gravel, or no active gravel in the repository!
    const isBlocked = !hasActiveSand || !hasActiveGravel;
    
    return {
      hasSand,
      hasActiveSand,
      hasGravel,
      hasActiveGravel,
      isBlocked,
      activeSands,
      activeGravels
    };
  }, [materialsDatabase]);

  // Listen for external sidebar tab switches (from diagnostics or alerts)
  useEffect(() => {
    const handleSwitch = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: string }>;
      if (customEvent.detail && customEvent.detail.tab) {
        setActiveSidebarTab(customEvent.detail.tab as any);
        setViewMode("workspace");
      }
    };
    window.addEventListener("switch-sidebar-tab", handleSwitch);
    return () => window.removeEventListener("switch-sidebar-tab", handleSwitch);
  }, []);

  // Keep track of the current materialsDatabase to avoid stale closures in the Firestore listener
  const materialsDatabaseRef = useRef<EngineeringMaterial[]>([]);
  useEffect(() => {
    materialsDatabaseRef.current = materialsDatabase;
  }, [materialsDatabase]);

  // Keep track of deleted material IDs with their deletion timestamps to avoid accidental restoration due to network latency/race conditions
  const deletedMaterialIdsRef = useRef<Map<string, number>>((() => {
    try {
      const saved = localStorage.getItem("mixwizard_deleted_materials");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return new Map<string, number>(Object.entries(parsed) as [string, number][]);
        }
      }
    } catch (e) {
      console.error("Failed to load deleted materials from localStorage", e);
    }
    return new Map<string, number>();
  })());

  const persistDeletedMaterialIds = () => {
    try {
      const obj = Object.fromEntries(deletedMaterialIdsRef.current.entries());
      localStorage.setItem("mixwizard_deleted_materials", JSON.stringify(obj));
    } catch (e) {
      console.error("Failed to save deleted materials to localStorage", e);
    }
  };

  // Helper to parse document updatedAt or updatedDate into a numeric timestamp
  const parseTimestamp = (val: any): number => {
    if (!val) return 0;
    if (typeof val === "object" && typeof val.toMillis === "function") {
      return val.toMillis();
    }
    if (typeof val === "object" && typeof val.seconds === "number") {
      return val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1000000) : 0);
    }
    if (typeof val === "number") {
      return val;
    }
    if (typeof val === "string") {
      const parsed = Date.parse(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Sync custom materials from Firestore in real-time if logged in, otherwise load from localStorage
  useEffect(() => {
    if (!user) {
      try {
        const saved = localStorage.getItem("mixwizard_materials_db");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = enrichMaterials(parsed).filter(m => {
              const delTime = deletedMaterialIdsRef.current.get(m.id);
              if (delTime !== undefined) {
                const updatedAt = m.updatedAt ? (typeof m.updatedAt === "number" ? m.updatedAt : new Date(m.updatedAt).getTime()) : 0;
                if (updatedAt < delTime) {
                  return false;
                }
              }
              return true;
            });
            setMaterialsDatabase(filtered);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse materials database from localStorage", e);
      }
      setMaterialsDatabase([]); // Start completely empty of SEEDED_MATERIALS
      return;
    }

    const q = query(
      collection(db, "user_materials"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customMaterials = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          ...data,
          updatedAt: parseTimestamp(data.updatedAt || data.updatedDate)
        };
      }) as EngineeringMaterial[];

      const enrichedCustom = enrichMaterials(customMaterials);

      // Clean up deleted IDs that are no longer present in the incoming snapshot
      const incomingIds = new Set(enrichedCustom.map(m => m.id));
      let deletedChanged = false;
      for (const [id] of deletedMaterialIdsRef.current) {
        if (!incomingIds.has(id)) {
          deletedMaterialIdsRef.current.delete(id);
          deletedChanged = true;
        }
      }
      if (deletedChanged) {
        persistDeletedMaterialIds();
      }

      // Merge and resolve conflicts between incoming data and current local state
      const currentLocal = materialsDatabaseRef.current;
      const currentLocalMap = new Map<string, EngineeringMaterial>(currentLocal.map(m => [m.id, m]));
      const resolvedList: EngineeringMaterial[] = [];

      for (const incomingMat of enrichedCustom) {
        const incomingUpdatedAt = parseTimestamp(incomingMat.updatedAt || incomingMat.updatedDate);
        
        // 1. Check if deleted locally
        const delTime = deletedMaterialIdsRef.current.get(incomingMat.id);
        if (delTime !== undefined && incomingUpdatedAt < delTime) {
          // Stale item that was deleted locally: skip/discard it
          continue;
        }

        // 2. Check if local version is newer
        const localMat = currentLocalMap.get(incomingMat.id);
        if (localMat) {
          const localUpdatedAt = parseTimestamp(localMat.updatedAt || localMat.updatedDate);
          if (localUpdatedAt > incomingUpdatedAt) {
            // Keep the newer local version
            resolvedList.push(localMat);
            continue;
          }
        }

        // Use the incoming version
        resolvedList.push({
          ...incomingMat,
          updatedAt: incomingUpdatedAt || Date.now()
        });
      }

      // Compare resolved list with current local state to avoid redundant re-renders
      const isSameList = (listA: EngineeringMaterial[], listB: EngineeringMaterial[]): boolean => {
        if (listA.length !== listB.length) return false;
        const sortedA = [...listA].sort((a, b) => a.id.localeCompare(b.id));
        const sortedB = [...listB].sort((a, b) => a.id.localeCompare(b.id));
        for (let i = 0; i < sortedA.length; i++) {
          if (JSON.stringify(sortedA[i]) !== JSON.stringify(sortedB[i])) {
            return false;
          }
        }
        return true;
      };

      if (!isSameList(resolvedList, currentLocal)) {
        setMaterialsDatabase(resolvedList);
        // Synchronize back to local storage cache so it's always hot-loaded on refresh
        localStorage.setItem("mixwizard_materials_db", JSON.stringify(resolvedList));
        localStorage.setItem("mixwizard_materials_seeded", "true");
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "user_materials");
    });

    return () => unsubscribe();
  }, [user]);

  // Handle addition, editing, duplication, and archiving/deleting of materials
  const handleUpdateMaterials = async (updatedList: EngineeringMaterial[]) => {
    // Ensure all modified or new items get a fresh high-precision updatedAt timestamp
    const now = Date.now();
    const updatedListWithTimestamps = updatedList.map(mat => {
      const existing = materialsDatabaseRef.current.find(prev => prev.id === mat.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(mat)) {
        return {
          ...mat,
          updatedAt: mat.updatedAt && mat.updatedAt > now ? mat.updatedAt : now,
          updatedDate: new Date().toISOString().split('T')[0]
        };
      }
      return mat;
    });

    // Track deleted IDs locally first, to prevent them from coming back on reload
    const updatedIds = new Set(updatedListWithTimestamps.map(m => m.id));
    let localDeletedChanged = false;
    for (const prevMat of materialsDatabaseRef.current) {
      if (!updatedIds.has(prevMat.id)) {
        deletedMaterialIdsRef.current.set(prevMat.id, now);
        localDeletedChanged = true;
      }
    }
    if (localDeletedChanged) {
      persistDeletedMaterialIds();
    }

    // 1. Optimistic update
    setMaterialsDatabase(updatedListWithTimestamps);

    // Save to localStorage so that offline or early initial loads are perfectly consistent
    localStorage.setItem("mixwizard_materials_db", JSON.stringify(updatedListWithTimestamps));

    // 2. Save custom or modified materials to database if logged in
    if (user) {
      try {
        
        // Ensure materialsSeeded is marked true on the user document in Firestore to prevent accidental auto-seeding
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          materialsSeeded: true,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          console.warn("Could not mark materialsSeeded on user document:", err);
        });
        localStorage.setItem("mixwizard_materials_seeded", "true");
        
        // Find deleted materials and delete them permanently from Firestore
        for (const prevMat of materialsDatabaseRef.current) {
          if (!updatedIds.has(prevMat.id)) {
            try {
              // Only delete if it belongs to the logged in user
              if (!prevMat.ownerId || prevMat.ownerId === user.uid) {
                await deleteDoc(doc(db, "user_materials", prevMat.id)).catch((err) => {
                  handleFirestoreError(err, OperationType.DELETE, `user_materials/${prevMat.id}`);
                  throw err;
                });
              }
            } catch (err) {
              console.warn(`Could not delete document user_materials/${prevMat.id} from Firestore, skipping:`, err);
            }
          }
        }
        
        for (const mat of updatedListWithTimestamps) {
          const previousMat = materialsDatabaseRef.current.find(prev => prev.id === mat.id);
          const isNewOrModified = !previousMat || JSON.stringify(previousMat) !== JSON.stringify(mat);

          if (isNewOrModified) {
            const matToSave: any = {
              ...mat,
              id: mat.id || "MAT-UNKNOWN",
              ownerId: user.uid,
              name: mat.name || "مادة غير مسمى",
              category: mat.category || "أخرى",
              status: mat.status || "نشط",
              ApprovalStatus: mat.ApprovalStatus || "Draft",
              updatedDate: new Date().toISOString().split('T')[0],
              updatedAt: mat.updatedAt || Date.now()
            };

            // Ensure correct types for checked fields if they are present
            if (matToSave.englishName !== undefined && matToSave.englishName !== null) {
              matToSave.englishName = String(matToSave.englishName || "Unnamed Material");
            }
            if (matToSave.type !== undefined && matToSave.type !== null) {
              matToSave.type = String(matToSave.type || "other");
            }
            if (matToSave.density !== undefined && matToSave.density !== null && matToSave.category !== "إضافات كيميائية") {
              const parsedDensity = Number(matToSave.density);
              matToSave.density = isNaN(parsedDensity) ? 0 : parsedDensity;
            }
            if (matToSave.absorption !== undefined && matToSave.absorption !== null) {
              const parsedAbs = Number(matToSave.absorption);
              matToSave.absorption = isNaN(parsedAbs) ? 0 : parsedAbs;
            }

            const cleanMat = JSON.parse(JSON.stringify(matToSave));
            
            try {
              await setDoc(doc(db, "user_materials", mat.id), cleanMat);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `user_materials/${mat.id}`);
            }
          }
        }
      } catch (error) {
        console.error("Failed to sync materials to Firestore:", error);
      }
    }
  };

  const handleClearAllMaterials = async () => {
    // Keep a copy of the current materials to delete from Firestore
    const currentMats = [...materialsDatabaseRef.current];

    // Track all as deleted locally
    const now = Date.now();
    for (const mat of currentMats) {
      deletedMaterialIdsRef.current.set(mat.id, now);
    }
    persistDeletedMaterialIds();

    // 1. Clear local state and cache immediately
    setMaterialsDatabase([]);
    materialsDatabaseRef.current = [];
    localStorage.setItem("mixwizard_materials_db", JSON.stringify([]));
    localStorage.setItem("mixwizard_materials_seeded", "true");

    // 2. Clear from Firestore if logged in
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          materialsSeeded: true,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          console.warn("Could not mark materialsSeeded on user document:", err);
        });

        // Delete all materials currently in the ref
        for (const mat of currentMats) {
          if (!mat.ownerId || mat.ownerId === user.uid) {
            await deleteDoc(doc(db, "user_materials", mat.id)).catch((err) => {
              handleFirestoreError(err, OperationType.DELETE, `user_materials/${mat.id}`);
            });
          }
        }

        // Fetch any remaining documents from user_materials query and delete them to guarantee a 100% clean slate
        const q = query(
          collection(db, "user_materials"),
          where("ownerId", "==", user.uid)
        );
        const snapshot = await getDocs(q).catch((err) => {
          handleFirestoreError(err, OperationType.GET, "user_materials");
          return null;
        });

        if (snapshot && !snapshot.empty) {
          let cloudDeletedChanged = false;
          for (const d of snapshot.docs) {
            deletedMaterialIdsRef.current.set(d.id, Date.now());
            cloudDeletedChanged = true;
            await deleteDoc(doc(db, "user_materials", d.id)).catch((err) => {
              handleFirestoreError(err, OperationType.DELETE, `user_materials/${d.id}`);
            });
          }
          if (cloudDeletedChanged) {
            persistDeletedMaterialIds();
          }
        }
      } catch (err) {
        console.error("Error clearing all materials from Firestore:", err);
      }
    }
  };

  const [expandedMaterials, setExpandedMaterials] = useState<ExpandedMaterial[]>(() => {
    try {
      const saved = localStorage.getItem("mixwizard_expanded_materials_db");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse expanded materials database from localStorage", e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("mixwizard_expanded_materials_db", JSON.stringify(expandedMaterials));
  }, [expandedMaterials]);

  // One-time initialization effect for seed projects to bootstrap their frozen snapshots and ensure absolute backward-compatibility
  useEffect(() => {
    setProjects(prev => prev.map(p => {
      const hasSnaps = p.materialSnapshots && Object.keys(p.materialSnapshots).length > 0;
      if (!hasSnaps) {
        // Resolve active constituent materials from current materials database
        const resolved = resolveMaterials(p.inputs, undefined, materialsDatabase);
        const snaps: Record<string, EngineeringMaterial> = {};
        if (resolved.cement) snaps.cement = { ...resolved.cement };
        if (resolved.sand) snaps.sand = { ...resolved.sand };
        if (resolved.gravel) snaps.gravel = { ...resolved.gravel };
        if (resolved.water) snaps.water = { ...resolved.water };
        if (resolved.admixture) snaps.admixture = { ...resolved.admixture };
        if (resolved.scm) snaps.scm = { ...resolved.scm };

        // Also clean up inner mixVersions snapshots
        const updatedVersions = (p.mixVersions || []).map(v => {
          if (!v.materialSnapshots || Object.keys(v.materialSnapshots).length === 0) {
            const vResolved = resolveMaterials(v.inputs, undefined, materialsDatabase);
            const vSnaps: Record<string, EngineeringMaterial> = {};
            if (vResolved.cement) vSnaps.cement = { ...vResolved.cement };
            if (vResolved.sand) vSnaps.sand = { ...vResolved.sand };
            if (vResolved.gravel) vSnaps.gravel = { ...vResolved.gravel };
            if (vResolved.water) vSnaps.water = { ...vResolved.water };
            if (vResolved.admixture) vSnaps.admixture = { ...vResolved.admixture };
            if (vResolved.scm) vSnaps.scm = { ...vResolved.scm };
            return {
              ...v,
              materialSnapshots: vSnaps
            };
          }
          return v;
        });

        return {
          ...p,
          materialSnapshots: snaps,
          mixVersions: updatedVersions,
          versions: updatedVersions // Both keys for full standard compliance
        };
      }
      return p;
    }));
  }, [materialsDatabase]);

  // Synchronize inputs selected IDs if they are missing or mismatched - Auto-selection disabled per strict governance
  useEffect(() => {
    // No auto-selection to prevent hidden assignments. 
    // Calculations remain blocked until user explicitly selects materials.
  }, [materialsDatabase]);

  const [activeProjectId, setActiveProjectId] = useState<string>("PROJ-99");
  const [projects, setProjects] = useState<ActiveProject[]>([
    {
      id: "PROJ-99",
      name: "Trident Mosque Tower (#PROJ-99)",
      client: "COSIDER Group",
      plant: "Algiers Central (A101)",
      createdDate: "2026-06-10",
      inputs: {
        fck28: 25,
        controlClass: "normal",
        cementType: "CEM I (إسمنت بورتلاندي عادي خالي من الإضافات)",
        cementClassStrength: 42.5,
        dMax: 20,
        slump: 8,
        aggregateType: AggregateType.ROULE,
        aggregateQuality: AggregateQuality.STANDARD,
        hasPumping: false,
        sandRelativeDensity: 0,
        gravelRelativeDensity: 0,
        cementDensity: 0,
        airContent: 1.0,
        moistureSand: 0,
        moistureGravel: 0,
        sandAbsorption: 0,
        gravelAbsorption: 0,
        admixtures: [],
        dosageSuper: 0,
        dosageAir: 0.0,
        dosageRetarder: 0.0,
        dosageAccelerator: 0.0,
        dosageSilicaFume: 0.0,
        dosageFlyAsh: 0.0,
        dosageSlag: 0.0,
        sandType: "رمل متوسط (Medium Sand)",
        gravelType: "حصى 8/15",
        autoDensities: true,
        batchVolume: 1.0,
        selectedMethod: "dreux",
        exposureClass: "X0",
        durabilityLevel: "normal",
        carbonationLevel: "negligible",
        chloridesLevel: "none",
        sulfatesLevel: "none",
        priceCement: 20,
        priceSand: 2.5,
        priceGravel: 2.8,
        priceSuper: 150,
        priceAir: 110,
        priceRetarder: 95,
        priceAccelerator: 125,
        priceSilicaFume: 65,
        priceFlyAsh: 40,
        priceSlag: 30,
        priceLabor: 1200,
        priceWater: 2,
        internalUnitWeight: 1600,
        internalCoeffG: 0.50,
        internalCurveCoeff: 1.0,
        internalSandRatio: 0.35,
        packingFactor: 0.82,
        internalWcOverride: 0.45,
      },
      mixVersions: [
        {
          id: "VER-SEED1",
          name: "المسودة المرجعية fck 25 MPa",
          date: "2026-06-10 14:22:10",
          inputs: {
            fck28: 25,
            controlClass: "normal",
            cementType: "CEM I (إسمنت بورتلاندي عادي خالي من الإضافات)",
            cementClassStrength: 42.5,
            dMax: 20,
            slump: 8,
            aggregateType: AggregateType.ROULE,
            aggregateQuality: AggregateQuality.STANDARD,
            hasPumping: false,
            sandRelativeDensity: 0,
            gravelRelativeDensity: 0,
            cementDensity: 0,
            airContent: 1.0,
            moistureSand: 0,
            moistureGravel: 0,
            sandAbsorption: 0,
            gravelAbsorption: 0,
            admixtures: [],
            dosageSuper: 0,
            dosageAir: 0.0,
            dosageRetarder: 0.0,
            dosageAccelerator: 0.0,
            dosageSilicaFume: 0.0,
            dosageFlyAsh: 0.0,
            dosageSlag: 0.0,
            sandType: "رمل متوسط (Medium Sand)",
            gravelType: "حصى 8/15",
            autoDensities: true,
            batchVolume: 1.0,
            selectedMethod: "dreux",
            exposureClass: "X0",
            durabilityLevel: "normal",
            carbonationLevel: "negligible",
            chloridesLevel: "none",
            sulfatesLevel: "none",
            priceCement: 20,
            priceSand: 2.5,
            priceGravel: 2.8,
            priceSuper: 150,
            priceAir: 110,
            priceRetarder: 95,
            priceAccelerator: 125,
            priceSilicaFume: 65,
            priceFlyAsh: 40,
            priceSlag: 30,
            priceLabor: 1200,
            priceWater: 2,
            internalUnitWeight: 1600,
            internalCoeffG: 0.50,
            internalCurveCoeff: 1.0,
            internalSandRatio: 0.35,
            packingFactor: 0.82,
            internalWcOverride: 0.45,
          },
          results: {
            cementWeight: 350,
            waterWeight: 175,
            sandWeight: 650,
            gravelWeight: 1150,
            wcRatioActual: 0.50,
            mixCostTotal: 12450,
            strengthEvolution: [],
            sandPercent: 35,
            gravelPercent: 65,
          }
        },
        {
          id: "VER-SEED2",
          name: "تعديل خلطة اقتصادي ذو جودة محسنة",
          date: "2026-06-11 09:15:30",
          isOptimized: true,
          inputs: {
            fck28: 25,
            controlClass: "high",
            cementType: "CEM II (إسمنت بورتلاندي مركب مع بوزولانا/خبث)",
            cementClassStrength: 32.5,
            dMax: 20,
            slump: 10,
            aggregateType: AggregateType.ROULE,
            aggregateQuality: AggregateQuality.EXCELLENT,
            hasPumping: true,
            sandRelativeDensity: 0,
            gravelRelativeDensity: 0,
            cementDensity: 0,
            airContent: 1.0,
            moistureSand: 0,
            moistureGravel: 0,
            sandAbsorption: 0,
            gravelAbsorption: 0,
            admixtures: [],
            dosageSuper: 0,
            dosageAir: 0.0,
            dosageRetarder: 0.1,
            dosageAccelerator: 0.0,
            dosageSilicaFume: 0.0,
            dosageFlyAsh: 0.0,
            dosageSlag: 0.0,
            sandType: "رمل متوسط (Medium Sand)",
            gravelType: "حصى 8/15",
            autoDensities: true,
            batchVolume: 1.0,
            selectedMethod: "dreux",
            exposureClass: "X0",
            durabilityLevel: "normal",
            carbonationLevel: "negligible",
            chloridesLevel: "none",
            sulfatesLevel: "none",
            priceCement: 18,
            priceSand: 2.5,
            priceGravel: 2.8,
            priceSuper: 150,
            priceAir: 110,
            priceRetarder: 95,
            priceAccelerator: 125,
            priceSilicaFume: 65,
            priceFlyAsh: 40,
            priceSlag: 30,
            priceLabor: 1200,
            priceWater: 2,
            internalUnitWeight: 1600,
            internalCoeffG: 0.50,
            internalCurveCoeff: 1.0,
            internalSandRatio: 0.35,
            packingFactor: 0.82,
            internalWcOverride: 0.45,
          },
          results: {
            cementWeight: 310,
            waterWeight: 145,
            sandWeight: 680,
            gravelWeight: 1210,
            wcRatioActual: 0.46,
            mixCostTotal: 10830,
            strengthEvolution: [],
            sandPercent: 36,
            gravelPercent: 64,
          }
        }
      ]
    },
    {
      id: "PROJ-108",
      name: "East-West Highway Viaduct (#PROJ-108)",
      client: "Algerian National Building Corp",
      plant: "Oran East Batching (O202)",
      createdDate: "2026-06-12",
      inputs: {
        fck28: 35,
        controlClass: "high",
        cementType: "CEM I (إسمنت بورتلاندي عادي خالي من الإضافات)",
        cementClassStrength: 52.5,
        dMax: 20,
        slump: 12,
        aggregateType: AggregateType.CONCASSE,
        aggregateQuality: AggregateQuality.EXCELLENT,
        hasPumping: true,
        sandRelativeDensity: 0,
        gravelRelativeDensity: 0,
        cementDensity: 0,
        airContent: 1.5,
        moistureSand: 0,
        moistureGravel: 0,
        sandAbsorption: 0,
        gravelAbsorption: 0,
        admixtures: [],
        dosageSuper: 0,
        dosageAir: 0.0,
        dosageRetarder: 0.5,
        dosageAccelerator: 0.0,
        dosageSilicaFume: 5.0,
        dosageFlyAsh: 10.0,
        dosageSlag: 0.0,
        sandType: "رمل خشن (Coarse Sand)",
        gravelType: "حصى 15/25",
        autoDensities: true,
        batchVolume: 1.0,
        selectedMethod: "dreux",
        exposureClass: "XC2",
        durabilityLevel: "high",
        carbonationLevel: "negligible",
        chloridesLevel: "none",
        sulfatesLevel: "none",
        priceCement: 22,
        priceSand: 2.8,
        priceGravel: 3.0,
        priceSuper: 160,
        priceAir: 110,
        priceRetarder: 95,
        priceAccelerator: 125,
        priceSilicaFume: 65,
        priceFlyAsh: 40,
        priceSlag: 30,
        priceLabor: 1200,
        priceWater: 2,
        internalUnitWeight: 1650,
        internalCoeffG: 0.55,
        internalCurveCoeff: 1.0,
        internalSandRatio: 0.38,
        packingFactor: 0.84,
        internalWcOverride: 0.38,
      }
    },
    {
      id: "PROJ-044",
      name: "Algiers Metro Line Extension (#PROJ-044)",
      client: "Sonatrach Refinement Group",
      plant: "Hassi Messaoud Oil Rig Mixers (H303)",
      createdDate: "2026-06-14",
      inputs: {
        fck28: 40,
        concreteType: "HSC",
        controlClass: "high",
        cementType: "CEM I (إسمنت بورتلاندي عادي خالي من الإضافات)",
        cementClassStrength: 52.5,
        dMax: 20,
        slump: 10,
        aggregateType: AggregateType.CONCASSE,
        aggregateQuality: AggregateQuality.EXCELLENT,
        hasPumping: true,
        sandRelativeDensity: 0,
        gravelRelativeDensity: 0,
        cementDensity: 0,
        airContent: 2.0,
        moistureSand: 0,
        moistureGravel: 0,
        sandAbsorption: 0,
        gravelAbsorption: 0,
        admixtures: [],
        dosageSuper: 0,
        dosageAir: 0.5,
        dosageRetarder: 0.2,
        dosageAccelerator: 0.0,
        dosageSilicaFume: 8.0,
        dosageFlyAsh: 15.0,
        dosageSlag: 10.0,
        sandType: "رمل كسارة (Crushed Sand)",
        gravelType: "حصى 8/15",
        autoDensities: true,
        batchVolume: 1.0,
        selectedMethod: "dreux",
        exposureClass: "XA1",
        durabilityLevel: "high",
        carbonationLevel: "low",
        chloridesLevel: "none",
        sulfatesLevel: "low",
        priceCement: 25,
        priceSand: 3.0,
        priceGravel: 3.5,
        priceSuper: 180,
        priceAir: 120,
        priceRetarder: 100,
        priceAccelerator: 130,
        priceSilicaFume: 70,
        priceFlyAsh: 45,
        priceSlag: 35,
        priceLabor: 1300,
        priceWater: 2.5,
        internalUnitWeight: 1700,
        internalCoeffG: 0.58,
        internalCurveCoeff: 1.0,
        internalSandRatio: 0.40,
        packingFactor: 0.85,
        internalWcOverride: 0.35,
      }
    }
  ]);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  // Derived active step value for Workflow Stepper (Core Project Lifecycle: Setup -> Materials -> Formulation -> Calibration -> Results -> Report)
  const activeStep = useMemo(() => {
    switch (activeSidebarTab) {
      case "saved_projects":
      case "cloud_storage":
        return 1; // 1. إنشاء المشروع
      case "materials_library":
      case "cement_database":
      case "aggregates_database":
      case "admixtures_database":
      case "materials":
        return 2; // 2. اختيار المواد
      case "calculator":
        return 3; // 3. تحضير الخلطة
      case "optimization":
      case "simulation":
        return 4; // 4. معايرة الخلطة
      case "cost":
      case "forecasting":
      case "performance_analysis":
        return 5; // 5. تحليل النتائج
      case "reports":
      case "compliance_reports":
      case "journal":
        return 6; // 6. التقرير النهائي
      default:
        return 3;
    }
  }, [activeSidebarTab]);

  const handleStepClick = (stepNum: number) => {
    if (aggregateValidation.isBlocked && stepNum > 2) {
      setActiveSidebarTab("materials_library");
      return;
    }
    switch (stepNum) {
      case 1:
        setActiveSidebarTab("saved_projects");
        break;
      case 2:
        setActiveSidebarTab("materials_library");
        break;
      case 3:
        setActiveSidebarTab("calculator"); // 3. تحضير الخلطة
        break;
      case 4:
        setActiveSidebarTab("optimization"); // 4. معايرة الخلطة
        break;
      case 5:
        setActiveSidebarTab("cost"); // 5. تحليل النتائج
        break;
      case 6:
        setActiveSidebarTab("reports"); // 6. التقرير النهائي
        break;
    }
  };

  const [newProjName, setNewProjName] = useState("");
  const [newProjClient, setNewProjClient] = useState("");
  const [newProjPlant, setNewProjPlant] = useState("Algiers Central (A101)");
  const [newProjStrength, setNewProjStrength] = useState(25);

  const [notifications, setNotifications] = useState<Array<{ id: string; textAr: string; textFr: string; textEn: string; read: boolean }>>([
    {
      id: "1",
      textAr: "تحسين تكلفة المواد: تم تخفيض استهلاك الإسمنت بنجاح بمقدار 15 kg/m³.",
      textFr: "Optimisation de coût : consommation de ciment réduite de 15 kg/m³.",
      textEn: "Cost optimization: cement consumption reduced by 15 kg/m³.",
      read: false
    },
    {
      id: "2",
      textAr: "تعديل رطوبة الرمل: تم كشف تعويض تلقائي للمياه بنسبة +0.8%.",
      textFr: "Humidité sable détectée : ajustement d'eau d'eau de +0.8%.",
      textEn: "Sand moisture detected: automatic water adjustment of +0.8%.",
      read: false
    },
    {
      id: "3",
      textAr: "مطابقة كودية: الخلطة الحالية مطابقة للدرجة المستهدفة C25 MPa وفقاً للدرجة البيئية NF EN 206.",
      textFr: "Conformité : formule conforme aux exigences de durabilité C25 MPa NF EN 206.",
      textEn: "Compliance check pass: current mix fulfills C25 durability specs NF EN 206.",
      read: true
    }
  ]);

  // Dynamic Audit Trail Activity Logs
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; timestamp: Date; descriptionAr: string; descriptionFr: string; descriptionEn: string; type: "info" | "success" | "warning" | "error" }>>([
    {
      id: "1",
      timestamp: new Date(Date.now() - 3600000 * 2),
      descriptionAr: "تم تحميل إعدادات مصانع الخرسانة الجاهزة النشطة بالجزائر الوسطى",
      descriptionFr: "Paramètres des centrales à béton d'Alger Centre chargés",
      descriptionEn: "Active concrete batch plant specs for Algiers loaded",
      type: "success"
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 3600000),
      descriptionAr: "معايرة مياه المعاوضة الموقعية ونسبة الرطوبة للرمل والحصى بنجاح",
      descriptionFr: "Compensation d'eau d'humidité et de malaxage calculée",
      descriptionEn: "Aggregate surface moisture water adjustments calculated successfully",
      type: "info"
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 1800000),
      descriptionAr: "تحديث منحنيات غربال التدرج الحبيبي طبقاً لمعيار Dreux-Gorisse",
      descriptionFr: "Courbes granulométriques mises à jour selon Dreux-Gorisse",
      descriptionEn: "Sieve grading standard curves updated to Dreux-Gorisse parameters",
      type: "info"
    }
  ]);


  // Basic vs Expert Mode state for Dashboard
  const [isBasicMode, setIsBasicMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("mixwizard-basic-mode");
    return saved === "true";
  });

  const toggleBasicMode = (val: boolean) => {
    setIsBasicMode(val);
    localStorage.setItem("mixwizard-basic-mode", String(val));
  };

  // Calculator Mode: normal (auto calculations) vs expert (manual custom overrides)
  const [designerMode, setDesignerMode] = useState<"normal" | "expert">("normal");

  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("mixwizard-sidebar-collapsed");
    return saved === "true";
  });

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("mixwizard-sidebar-collapsed", String(next));
      return next;
    });
  };



  // Firebase Auth and Firestore states
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [activationLoading, setActivationLoading] = useState<boolean>(false);
  const [savedMixes, setSavedMixes] = useState<any[]>([]);
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const savePricesAsDefault = () => {
    try {
      localStorage.setItem("mixwizard_price_Cement", inputs.priceCement.toString());
      localStorage.setItem("mixwizard_price_Sand", inputs.priceSand.toString());
      localStorage.setItem("mixwizard_price_Gravel", inputs.priceGravel.toString());
      localStorage.setItem("mixwizard_price_Water", inputs.priceWater.toString());
      localStorage.setItem("mixwizard_price_Super", inputs.priceSuper.toString());
      localStorage.setItem("mixwizard_price_Air", inputs.priceAir.toString());
      localStorage.setItem("mixwizard_price_Retarder", inputs.priceRetarder.toString());
      localStorage.setItem("mixwizard_price_Accelerator", inputs.priceAccelerator.toString());
      localStorage.setItem("mixwizard_price_SilicaFume", inputs.priceSilicaFume.toString());
      localStorage.setItem("mixwizard_price_FlyAsh", inputs.priceFlyAsh.toString());
      localStorage.setItem("mixwizard_price_Slag", inputs.priceSlag.toString());
      localStorage.setItem("mixwizard_price_Labor", inputs.priceLabor.toString());
      localStorage.setItem("mixwizard_default_currency", currency);
      
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 3000);
    } catch (e) {
      console.error("Local storage error", e);
    }
  };

  const resetPricesToZero = () => {
    setInputs(prev => ({
      ...prev,
      priceCement: 0,
      priceSand: 0,
      priceGravel: 0,
      priceWater: 0,
      priceSuper: 0,
      priceAir: 0,
      priceRetarder: 0,
      priceAccelerator: 0,
      priceSilicaFume: 0,
      priceFlyAsh: 0,
      priceSlag: 0,
      priceLabor: 0
    }));
  };

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Safe centralized user document initialization
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const uDoc = await getDoc(userDocRef).catch((err) => {
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
            return null;
          });
          if (!uDoc || !uDoc.exists() || !uDoc.data()?.email) {
            const isBypassed = currentUser.email === "senoussi.s.t@gmail.com" || 
                               currentUser.email === "engineer.demo@sno-engineering.com" || 
                               currentUser.uid === "bypassed-demo-engineer-99";
            const localSeeded = localStorage.getItem("mixwizard_materials_seeded") === "true";
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "SNO Engineering Professional",
              activated: isBypassed ? true : false,
              materialsSeeded: localSeeded,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true }).catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
            });
            console.log("Centralized initialization: Created/merged user profile document.");
          } else {
            // Self-healing: if the user document exists but materialsSeeded is missing, check if local materials are already marked seeded
            const data = uDoc.data();
            const localSeeded = localStorage.getItem("mixwizard_materials_seeded") === "true";
            if (data && !data.materialsSeeded && localSeeded) {
              await setDoc(userDocRef, {
                materialsSeeded: true,
                updatedAt: serverTimestamp()
              }, { merge: true }).catch((err) => {
                console.warn("Self-healing materialsSeeded update failed:", err);
              });
            }
          }
        } catch (err) {
          console.warn("Centralized initialization warning/error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time user activation Firestore synchronizer hook
  useEffect(() => {
    if (!user) {
      setIsActivated(null);
      setActivationLoading(false);
      return;
    }

    // Hardcoded bypass status
    const isBypassed = user.email === "senoussi.s.t@gmail.com" || 
                       user.email === "engineer.demo@sno-engineering.com" || 
                       user.uid === "bypassed-demo-engineer-99";

    setActivationLoading(true);
    const userDocRef = doc(db, "users", user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsActivated(isBypassed ? true : !!data.activated);
        setActivationLoading(false);
      } else {
        // Document does not exist yet. Rely on centralized initialization in onAuthStateChanged.
        setIsActivated(isBypassed ? true : false);
        setActivationLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      console.error("Error checking user activation status:", error);
      if (isBypassed) {
        setIsActivated(true);
      }
      setActivationLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Safe Google Sign-In with popup closed / canceled recovery
  const handleGoogleSignIn = async () => {
    try {
      setSaveError("");
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      const errCode = String(error?.code || "").toLowerCase();
      const errMsg = String(error?.message || "").toLowerCase();
      
      if (errCode.includes("popup-closed-by-user") || errMsg.includes("popup-closed-by-user")) {
        console.log("Safe Auth Recovery: Google sign-in popup was closed by the user.");
        throw error;
      }
      if (errCode.includes("cancelled-popup-request") || errMsg.includes("cancelled-popup-request")) {
        console.log("Safe Auth Recovery: Google sign-in popup request was cancelled.");
        throw error;
      }
      if (errCode.includes("popup-blocked") || errMsg.includes("popup-blocked")) {
        console.warn("Safe Auth Recovery: Google sign-in popup was blocked by the browser.");
        throw error;
      }
      console.error("Google login error:", error);
      setSaveError(localizedLabel("فشل تسجيل الدخول: ", "Échec de connexion: ", "Login failed: ") + (error.message || localizedLabel("الرجاء المحاولة لاحقاً", "Veuillez réessayer plus tard", "Please try again later")));
      throw error;
    }
  };

  // Sync saved mixes in real-time
  useEffect(() => {
    if (!user) {
      setSavedMixes([]);
      return;
    }
    const q = query(
      collection(db, "user_mixes"),
      where("ownerId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mixesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort client-side by createdAt desc (newest first) representing durable cloud history
      mixesList.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setSavedMixes(mixesList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "user_mixes");
    });
    return unsubscribe;
  }, [user]);

  // Action: Save custom mix design
  const handleSaveMix = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    if (!validationGate.isValidForReport) {
      setSaveError(localizedLabel("لا يمكن حفظ الخلطة لوجود أخطاء حرجة غير مسموح بحفظها.", "Impossible de sauvegarder la formule en raison d'erreurs critiques.", "Cannot save mix design due to critical validation errors."));
      return;
    }
    if (!saveName.trim()) {
      setSaveError(localizedLabel("الرجاء إدخال اسم مميز للخلطة", "Veuillez entrer un nom unique pour la formule", "Please enter a unique name for the mix design"));
      return;
    }
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const docId = `mix_${user.uid}_${Date.now()}`;
      await setDoc(doc(db, "user_mixes", docId), {
        ownerId: user.uid,
        name: saveName.trim(),
        inputs: inputs,
        currency: currency, // Save active currency context
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSaveName("");
      setSaveSuccess(localizedLabel("تم حفظ الخلطة بنجاح في خزنتك السحابية!", "Formule sauvegardée avec succès dans votre cloud !", "Mix design successfully saved to your cloud storage!"));
      setTimeout(() => setSaveSuccess(""), 4000);
    } catch (err: any) {
      console.error("Error saving mix: ", err);
      setSaveError(localizedLabel("فشلت عملية الحفظ. الرجاء المحاولة ثانية.", "Échec de la sauvegarde. Veuillez réessayer.", "Save operation failed. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  // Action: Delete a saved mix
  const handleDeleteMix = async (mixId: string) => {
    if (!user) return;
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا التصميم في السحابة؟")) return;
    try {
      await deleteDoc(doc(db, "user_mixes", mixId));
    } catch (err: any) {
      console.error("Error deleting mix: ", err);
      handleFirestoreError(err, OperationType.DELETE, `user_mixes/${mixId}`);
    }
  };

  // Action: Load a saved mix design
  const handleLoadMix = (mix: any) => {
    if (mix && mix.inputs) {
      if (mix.currency && mix.currency !== currency) {
        const fromRate = rates[mix.currency as "DZD" | "USD" | "EUR" | "GBP"] || 1;
        const toRate = rates[currency] || 1;
        const pricesKeys = [
          "priceCement", "priceSand", "priceGravel", "priceWater",
          "priceSuper", "priceAir", "priceRetarder", "priceAccelerator",
          "priceSilicaFume", "priceFlyAsh", "priceSlag", "priceLabor"
        ];
        const convertedInputs = { ...mix.inputs };
        pricesKeys.forEach(key => {
          const oldVal = mix.inputs[key];
          if (typeof oldVal === "number") {
            const oldUnit = getUnitForMaterial(key, mix.currency);
            const isOldPerTon = oldUnit.includes("طن") || oldUnit.includes("ton");
            const pricePerUnitInOld = isOldPerTon ? oldVal / 1000 : oldVal;
            
            const pricePerUnitInDZD = pricePerUnitInOld * fromRate;
            const pricePerUnitInNew = pricePerUnitInDZD / toRate;
            
            const newUnit = getUnitForMaterial(key, currency);
            const isNewPerTon = newUnit.includes("طن") || newUnit.includes("ton");
            const newVal = isNewPerTon ? pricePerUnitInNew * 1000 : pricePerUnitInNew;
            
            convertedInputs[key] = parseFloat(newVal.toFixed(newVal < 1 ? 4 : 2));
          }
        });
        setInputs(normalizeInputsToDreux(convertedInputs));
      } else {
        setInputs(normalizeInputsToDreux(mix.inputs));
        if (mix.currency) {
          setCurrency(mix.currency);
        }
      }
      setSaveSuccess("تم تحميل مفردات الخلطة المحفوظة بنجاح إلى الحاسبة!");
      setTimeout(() => setSaveSuccess(""), 4000);
      setActiveSidebarTab("calculator");
    }
  };

  const [currency, setCurrency] = useState<"DZD" | "USD" | "EUR" | "GBP">(() => {
    try {
      const saved = localStorage.getItem("mixwizard_default_currency");
      return (saved || "DZD") as "DZD" | "USD" | "EUR" | "GBP";
    } catch (e) {
      return "DZD";
    }
  });

  const rates: Record<"DZD" | "USD" | "EUR" | "GBP", number> = {
    DZD: 1,
    USD: 135,
    EUR: 145,
    GBP: 175
  };

  const convertCurrency = (amountInDZD: number): number => {
    return amountInDZD / rates[currency];
  };

  const getCurrencySymbol = (): string => {
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    if (currency === "GBP") return "£";
    return "دج";
  };

  const getUnitForMaterial = (key: string, curr: "DZD" | "USD" | "EUR" | "GBP" = currency): string => {
    const isAr = language === "ar";
    const dzdSym = isAr ? "دج" : "DZD";
    if (key === "priceLabor") {
      if (curr === "DZD") return `${dzdSym}/m³`;
      if (curr === "USD") return "$/m³";
      if (curr === "EUR") return "€/m³";
      return "£/m³";
    }
    if (key === "priceWater") {
      if (curr === "DZD") return `${dzdSym}/L`;
      if (curr === "USD") return "$/L";
      if (curr === "EUR") return "€/L";
      return "£/L";
    }
    // Base and additions: Cement, Sand, Gravel, Silica, Fly Ash, Slag
    const isTonnage = ["priceCement", "priceSand", "priceGravel", "priceSilicaFume", "priceFlyAsh", "priceSlag"].includes(key);
    if (isTonnage) {
      if (curr === "DZD") return `${dzdSym}/kg`;
      if (curr === "USD") return "$/kg";
      if (curr === "EUR") return "€/t";
      return "£/t";
    }
    // Admixtures
    if (curr === "DZD") return `${dzdSym}/kg`;
    if (curr === "USD") return "$/kg";
    if (curr === "EUR") return "€/kg";
    return "£/kg";
  };

  const getPriceInDZD = (value: number, key: string, curr: "DZD" | "USD" | "EUR" | "GBP" = currency): number => {
    const unit = getUnitForMaterial(key, curr);
    const isPerTon = unit.includes("طن") || unit.includes("ton");
    const pricePerUnit = isPerTon ? value / 1000 : value;
    return pricePerUnit * rates[curr];
  };

  // Format a value that is already in the active currency
  const formatActiveCurrency = (val: number, includeSymbol = true): string => {
    const sym = getCurrencySymbol();
    const formatted = val.toLocaleString(undefined, {
      minimumFractionDigits: currency === "DZD" ? 0 : 2,
      maximumFractionDigits: currency === "DZD" ? 0 : 2
    });
    return includeSymbol ? (currency === "DZD" ? `${formatted} ${sym}` : `${sym}${formatted}`) : formatted;
  };

  const formatCurrency = (amountInDZD: number): string => {
    const converted = convertCurrency(amountInDZD);
    return formatActiveCurrency(converted);
  };

  const handleCurrencyChange = (newCurrency: "DZD" | "USD" | "EUR" | "GBP") => {
    if (newCurrency === currency) return;
    
    const pricesKeys = [
      "priceCement", "priceSand", "priceGravel", "priceWater",
      "priceSuper", "priceAir", "priceRetarder", "priceAccelerator",
      "priceSilicaFume", "priceFlyAsh", "priceSlag", "priceLabor"
    ];

    setInputs(prev => {
      const nextInputs = { ...prev };
      pricesKeys.forEach(key => {
        const oldValue = prev[key as keyof MixDesignInput] as number;
        if (typeof oldValue !== "number") return;
        
        // 1. Get unit for material in old currency
        const oldUnit = getUnitForMaterial(key, currency);
        const isOldPerTon = oldUnit.includes("طن") || oldUnit.includes("ton");
        const pricePerUnitInOld = isOldPerTon ? oldValue / 1000 : oldValue;
        
        // 2. Convert to DZD
        const pricePerUnitInDZD = pricePerUnitInOld * rates[currency];
        
        // 3. Convert to new currency
        const pricePerUnitInNew = pricePerUnitInDZD / rates[newCurrency];
        
        // 4. Scale according to new unit
        const newUnit = getUnitForMaterial(key, newCurrency);
        const isNewPerTon = newUnit.includes("طن") || newUnit.includes("ton");
        const newValue = isNewPerTon ? pricePerUnitInNew * 1000 : pricePerUnitInNew;
        
        // Save back with appropriate rounding
        nextInputs[key as keyof MixDesignInput] = parseFloat(newValue.toFixed(newValue < 1 ? 4 : 2)) as any;
      });
      return nextInputs;
    });

    setCurrency(newCurrency);
  };

  // --- DYNAMIC METHOD-AWARE HELPERS & STATES ---
  const [transitionState, setTransitionState] = useState<{
    show: boolean;
    from: string;
    to: string;
    disabledCount: number;
    enabledCount: number;
  }>({
    show: false,
    from: "",
    to: "",
    disabledCount: 0,
    enabledCount: 0
  });

  const countTransitionFields = (fromMethod: string, toMethod: string) => {
    const fromConfig = METHOD_CONFIGS[fromMethod] || METHOD_CONFIGS.dreux;
    const toConfig = METHOD_CONFIGS[toMethod] || METHOD_CONFIGS.dreux;

    let disabledCount = 0;
    let enabledCount = 0;

    // We only track the core input keys to count correctly
    const inputKeys = [
      "fck28",
      "slump",
      "dMax",
      "cementType",
      "cementClassStrength",
      "aggregateType",
      "aggregateQuality",
      "moisture",
      "packingFactor",
      "exposureClass",
      "airContent",
      "specificGravity",
      "internalUnitWeight",
      "internalCoeffG",
      "internalCurveCoeff",
      "internalSandRatio",
      "internalWcOverride"
    ];

    inputKeys.forEach(key => {
      const fromStatus = fromConfig.fields[key] || "required";
      const toStatus = toConfig.fields[key] || "required";

      if (fromStatus !== "not_used" && toStatus === "not_used") {
        disabledCount++;
      }
      if (fromStatus === "not_used" && toStatus !== "not_used") {
        enabledCount++;
      }
    });

    return { disabledCount, enabledCount };
  };

  const handleMethodChange = (newMethod: string) => {
    const fromMethod = inputs.selectedMethod || "dreux";
    if (fromMethod === newMethod) return;

    const { disabledCount, enabledCount } = countTransitionFields(fromMethod, newMethod);

    setTransitionState({
      show: true,
      from: fromMethod,
      to: newMethod,
      disabledCount,
      enabledCount
    });

    setInputs(prev => ({ ...prev, selectedMethod: newMethod as any }));
  };

  const isFieldDisabled = (fieldKey: string) => {
    const currentMethod = inputs.selectedMethod || "dreux";
    const config = METHOD_CONFIGS[currentMethod as keyof typeof METHOD_CONFIGS];
    if (config && config.fields && config.fields[fieldKey] === "not_used") {
      return true;
    }
    return false;
  };

  const renderFieldIndicator = (fieldKey: string) => {
    const currentMethod = inputs.selectedMethod || "dreux";
    const config = METHOD_CONFIGS[currentMethod as keyof typeof METHOD_CONFIGS];
    let status: "required" | "optional" | "not_used" = "optional";

    if (config && config.fields && config.fields[fieldKey] !== undefined) {
      status = config.fields[fieldKey];
    } else {
      status = "required";
    }

    if (status === "required") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {language === "ar" ? "مطلوب" : language === "fr" ? "Requis" : "Required"}
        </span>
      );
    } else if (status === "optional") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {language === "ar" ? "اختياري" : language === "fr" ? "Optionnel" : "Optional"}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-normal bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-705">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-350 dark:bg-slate-650"></span>
          {language === "ar" ? "غير مستخدم" : language === "fr" ? "Inutilisé" : "Not Used"}
        </span>
      );
    }
  };

  // TODO: Refactor and segment the massive recipe calculations inputs state below into a modular, clean custom hook
  // named 'useMixInputs' within src/hooks/useMixInputs.ts when doing major visual or database refactoring.
  
  // 2. Initial State for inputs matching parameters
  const [inputs, setInputs] = useState<MixDesignInput>({
    fck28: 25, // Default C25 standard structural mix
    concreteType: "NSC", // Default normal strength concrete
    controlClass: "normal",
    cementType: "CEM I (إسمنت بورتلاندي عادي خالي من الإضافات)",
    cementClassStrength: 42.5,
    dMax: 20, // Standard gravel maximum size in mm
    slump: 8, // Normal vibrated concrete slump (medium consistency)
    aggregateType: AggregateType.ROULE,
    aggregateQuality: AggregateQuality.STANDARD,
    hasPumping: false,
    selectedCementId: "",
    selectedSandId: "",
    selectedGravelId: "",
    selectedWaterId: "",
    
     // Custom absolute densities in kg/m³
    sandRelativeDensity: 0,
    gravelRelativeDensity: 0,
    cementDensity: 0,
    airContent: 1.0, // 1% default air content
    
    moistureSand: 0, // default sand dampness
    moistureGravel: 0, // default gravel moisture
    sandAbsorption: 0, // default sand water absorption
    gravelAbsorption: 0, // default gravel water absorption
    admixtures: [],
    costBasis: "wet",
    
    // Sliders for admixtures
    dosageSuper: 0, // default superplasticizer
    dosageAir: 0.0,
    dosageRetarder: 0.0,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 0.0,
    dosageSlag: 0.0,
    
    // presets and metadata
    sandType: "رمل متوسط (Medium Sand)",
    gravelType: "حصى 8/15",
    autoDensities: true,
    batchVolume: 1.0, // Total batch volume in m³
    areaM2: 10,       // Default area in m²
    thicknessCm: 10,  // Default thickness in cm
    volumeInputMode: "volume", // volume (direct) or area (m² + cm)

    // Advanced additions
    selectedMethod: "dreux",
    exposureClass: "X0",
    durabilityLevel: "normal",
    carbonationLevel: "negligible",
    chloridesLevel: "none",
    sulfatesLevel: "none",

    // Dynamic method-aware default values
    internalUnitWeight: 1600,
    internalCoeffG: 0.50,
    internalCurveCoeff: 1.0,
    internalSandRatio: 0.35,
    packingFactor: 0.82,
    internalWcOverride: 0.45,

    // Customizable Algerian Material Prices (DA/kg)
    priceCement: getInitialPrice("Cement", 20), // 1000 DA per 50kg bag is 20 DA/kg
    priceSand: getInitialPrice("Sand", 2.5),
    priceGravel: getInitialPrice("Gravel", 2.8),
    priceSuper: getInitialPrice("Super", 150),
    priceAir: getInitialPrice("Air", 110),
    priceRetarder: getInitialPrice("Retarder", 95),
    priceAccelerator: getInitialPrice("Accelerator", 125),
    priceSilicaFume: getInitialPrice("SilicaFume", 65),
    priceFlyAsh: getInitialPrice("FlyAsh", 40),
    priceSlag: getInitialPrice("Slag", 30),
    priceLabor: getInitialPrice("Labor", 1200), // Default labor cost (DA/m³)
    priceWater: getInitialPrice("Water", 2) // Default water cost (DA/L)
  });

  // Central Engineering Session - Single Source of Truth
  const activeSession = useMemo(() => {
    // Construct a project snap combining active details and current edited inputs
    const projectWithCurrentInputs = {
      ...activeProject,
      inputs: { ...inputs },
    };
    return EngineeringCore.createSession(projectWithCurrentInputs, materialsDatabase);
  }, [activeProject, inputs, materialsDatabase]);

  // Hook to log configuration and formula modifications in real time
  useEffect(() => {
    const timestamp = new Date();
    const logId = Math.random().toString(36).substring(2, 11);
    setActivityLogs(prev => {
      // Avoid duplicate initial logging if logs got loaded
      if (prev.length > 5 && prev[0].descriptionAr.includes(`${inputs.fck28} MPa`)) return prev;
      return [
        {
          id: logId,
          timestamp,
          descriptionAr: `تم تعديل مقاومة خرسانة الصب المعيارية المستهدفة إلى ${inputs.fck28} MPa وقوام السلمب إلى ${inputs.slump} سم`,
          descriptionFr: `Résistance cible fck28 modifiée à ${inputs.fck28} MPa et slump S${inputs.slump} cm`,
          descriptionEn: `Target concrete strength adjusted to ${inputs.fck28} MPa with S${inputs.slump} cm consistency slump`,
          type: "success"
        },
        ...prev
      ].slice(0, 30); // Keep last 30 logs for auditing
    });
  }, [inputs.fck28, inputs.slump]);

    // Modern tracking states for the material database explorer
  const [selectedMaterialForInfo, setSelectedMaterialForInfo] = useState<string>("رمل متوسط (Medium Sand)");
  const [hoveredMaterialName, setHoveredMaterialName] = useState<string | null>(null);

  // --- LAB OVERRIDE ENGINE STATE & HELPERS ---
  const [activeOverrideProperty, setActiveOverrideProperty] = useState<string | null>(null);
  const [overrideForm, setOverrideForm] = useState({
    overrideValue: 0,
    reason: "",
    technician: "فني مختبر المواد الرئيسي",
    date: new Date().toISOString().split("T")[0]
  });

  const getOriginalValueForProperty = (property: string): number => {
    if (property === "cementDensity") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedCementId);
      return mat?.density || 0;
    }
    if (property === "sandRelativeDensity") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedSandId);
      return mat?.density || mat?.specificGravity || 0;
    }
    if (property === "gravelRelativeDensity") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedGravelId);
      return mat?.density || mat?.specificGravity || 0;
    }
    if (property === "sandAbsorption") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedSandId);
      return mat?.absorption !== undefined ? mat.absorption : 0;
    }
    if (property === "gravelAbsorption") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedGravelId);
      return mat?.absorption !== undefined ? mat.absorption : 0;
    }
    if (property === "dMax") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedGravelId);
      return mat?.dMax || 20;
    }
    return 0;
  };

  const handleOpenOverrideForm = (property: string, currentValue: number) => {
    setActiveOverrideProperty(property);
    setOverrideForm({
      overrideValue: currentValue || getOriginalValueForProperty(property) || 0,
      reason: "",
      technician: "فني مختبر المواد الرئيسي",
      date: new Date().toISOString().split("T")[0]
    });
  };

  const handleSaveOverride = () => {
    if (!activeOverrideProperty || !overrideForm.reason) return;
    const originalValue = getOriginalValueForProperty(activeOverrideProperty);
    const newOverride = {
      overriddenProperty: activeOverrideProperty,
      overrideValue: overrideForm.overrideValue,
      reason: overrideForm.reason,
      date: overrideForm.date,
      technician: overrideForm.technician,
      originalMaterialValue: originalValue
    };

    setInputs(prev => ({
      ...prev,
      [activeOverrideProperty]: overrideForm.overrideValue,
      labOverrides: {
        ...(prev.labOverrides || {}),
        [activeOverrideProperty]: newOverride
      }
    }));
    setActiveOverrideProperty(null);
  };

  const handleRemoveOverride = (property: string) => {
    const origVal = getOriginalValueForProperty(property);
    setInputs(prev => {
      const nextOverrides = { ...(prev.labOverrides || {}) };
      delete nextOverrides[property];
      return {
        ...prev,
        [property]: origVal,
        labOverrides: nextOverrides
      };
    });
  };

  const handleSandPreset = (name: string, density: number) => {
    const matched = materialsDatabase.find(m => m.name === name || m.id === name || m.englishName === name);
    if (matched) {
      const absorption = matched.absorption !== undefined ? matched.absorption : 1.5;
      const moisture = matched.moisture !== undefined ? matched.moisture : 0;
      setInputs(prev => ({
        ...prev,
        selectedSandId: matched.id,
        sandType: matched.name,
        sandRelativeDensity: matched.density || matched.specificGravity || density,
        sandAbsorption: absorption,
        moistureSand: moisture,
        finenessModulus: matched.finenessModulus || prev.finenessModulus
      }));
      setSelectedMaterialForInfo(matched.name);
    } else {
      setInputs(prev => ({
        ...prev,
        sandType: name,
        sandRelativeDensity: prev.autoDensities ? density : prev.sandRelativeDensity
      }));
      setSelectedMaterialForInfo(name);
    }
  };

  // Automatically calculate design parameters in Normal Mode
  useEffect(() => {
    if (designerMode === "normal") {
      const recs = getRecommendedCoefficients(
        inputs.concreteType || "NSC",
        inputs.selectedMethod || "dreux",
        inputs.fck28 || 25,
        inputs.aggregateType || "roule"
      );

      // Only set state if any values are actually different to prevent rendering loop
      if (
        inputs.internalWcOverride !== recs.internalWcOverride ||
        inputs.packingFactor !== recs.packingFactor ||
        inputs.internalCoeffG !== recs.internalCoeffG ||
        inputs.internalCurveCoeff !== recs.internalCurveCoeff ||
        inputs.internalSandRatio !== recs.internalSandRatio ||
        inputs.internalUnitWeight !== recs.internalUnitWeight
      ) {
        setInputs(prev => ({
          ...prev,
          ...recs
        }));
      }
    }
  }, [
    designerMode,
    inputs.concreteType,
    inputs.selectedMethod,
    inputs.fck28,
    inputs.aggregateType
  ]);

  const getChemicalSuggestionsNote = () => {
    const type = inputs.concreteType || "NSC";
    const isAr = language === "ar";
    const isFr = language === "fr";

    if (type === "UHPC" || type === "BFUP") {
      if (isAr) return "يوصى بجرعة ملدن فائق 2.0% إلى 3.0% مع غبار سيليكا 10% إلى 12% لضمان الانضغاط الفائق.";
      if (isFr) return "Dose recommandée de superplastifiant de 2,0% à 3,0% avec 10% à 12% de fumée de silice pour assurer une compacité extrême.";
      return "Recommended superplasticizer dosage of 2.0% to 3.0% with 10% to 12% silica fume to ensure ultra-high compactness.";
    }
    if (type === "SCC") {
      if (isAr) return "يوصى بجرعة ملدن فائق 1.5% إلى 2.2% لضمان الانسيابية العالية والصب دون اهتزاز.";
      if (isFr) return "Dose recommandée de superplastifiant de 1,5% à 2,2% pour garantir une fluidité élevée et un coulage sans vibration.";
      return "Recommended superplasticizer dosage of 1.5% to 2.2% to ensure high flowability and self-consolidation without vibration.";
    }
    if (type === "HPC" || type === "HSC") {
      if (isAr) return "يوصى بجرعة ملدن فائق 1.2% إلى 1.8% مع غبار سيليكا 6% إلى 10% لتحقيق مقاومة ونفاذية ممتازة.";
      if (isFr) return "Dose recommandée de superplastifiant de 1,2% à 1,8% avec 6% à 10% de fumée de silice pour une excellente résistance et durabilité.";
      return "Recommended superplasticizer dosage of 1.2% to 1.8% with 6% to 10% silica fume for excellent strength and permeability resistance.";
    }
    if (type === "RAC") {
      if (isAr) return "يوصى بجرعة ملدن فائق معتدلة لتأمين تشغيلية كافية لامتصاص الركام المعاد تدويره.";
      if (isFr) return "Dose modérée de superplastifiant recommandée pour assurer une maniabilité suffisante face à l'absorption des granulats recyclés.";
      return "Moderate superplasticizer dosage recommended to ensure sufficient workability for recycled aggregate absorption.";
    }
    if (inputs.fck28 >= 40) {
      if (isAr) return `للخلطات ذات المقاومة العالية (${inputs.fck28} MPa)، يوصى باستخدام الملدن الفائق بنسبة تفوق 1.2% مع إضافة غبار السيليكا.`;
      if (isFr) return `Pour les mélanges à haute résistance (${inputs.fck28} MPa), il est recommandé d'utiliser un superplastifiant supérieur à 1,2% avec ajout de fumée de silice.`;
      return `For high-strength mixes (${inputs.fck28} MPa), a superplasticizer dosage above 1.2% with silica fume addition is recommended.`;
    }
    if (isAr) return "للخرسانة العادية، يوصى بجرعة ملدن معتدلة 0.5% إلى 1.0% لتحسين التشغيلية وتخفيض ماء الخلط.";
    if (isFr) return "Pour le béton ordinaire, une dose modérée de plastifiant de 0,5% à 1,0% est recommandée pour améliorer la maniabilité et réduire l'eau.";
    return "For normal concrete, a moderate admixture dosage of 0.5% to 1.0% is recommended to improve workability and reduce mixing water.";
  };

  const handleGravelPreset = (name: string, density: number) => {
    const matched = materialsDatabase.find(m => m.name === name || m.id === name || m.englishName === name);
    if (matched) {
      const absorption = matched.absorption !== undefined ? matched.absorption : 0.8;
      const moisture = matched.moisture !== undefined ? matched.moisture : 0;
      const maxS = matched.dMax || 20;
      const shape = (matched.particleShape === "مكسر" || matched.particleShape === "زاوي") ? AggregateType.CONCASSE : AggregateType.ROULE;
      
      let qualityVal = AggregateQuality.STANDARD;
      if (matched.aggregateQuality === "excellent") {
        qualityVal = AggregateQuality.EXCELLENT;
      } else if (matched.aggregateQuality === "poor") {
        qualityVal = AggregateQuality.POOR;
      } else if (matched.aggregateQuality === "standard") {
        qualityVal = AggregateQuality.STANDARD;
      } else {
        const qStr = String(matched.quality || "").toLowerCase();
        if (qStr.includes("excellent") || qStr.includes("ممتاز") || qStr.includes("عالي")) {
          qualityVal = AggregateQuality.EXCELLENT;
        } else if (qStr.includes("poor") || qStr.includes("ضعيف") || qStr.includes("متوسط")) {
          qualityVal = AggregateQuality.POOR;
        }
        if (matched.losAngelesAbrasion !== undefined) {
          const la = matched.losAngelesAbrasion;
          if (la < 15) qualityVal = AggregateQuality.EXCELLENT;
          else if (la > 30) qualityVal = AggregateQuality.POOR;
        }
      }

      setInputs(prev => ({
        ...prev,
        selectedGravelId: matched.id,
        gravelType: matched.name,
        gravelRelativeDensity: matched.density || matched.specificGravity || density,
        gravelAbsorption: absorption,
        moistureGravel: moisture,
        dMax: maxS,
        aggregateType: shape,
        aggregateQuality: qualityVal
      }));
      setSelectedMaterialForInfo(matched.name);
    } else {
      setInputs(prev => ({
        ...prev,
        gravelType: name,
        gravelRelativeDensity: prev.autoDensities ? density : prev.gravelRelativeDensity
      }));
      setSelectedMaterialForInfo(name);
    }
  };

  const handleApplyRecommendations = (rec: any) => {
    // 1. Dynamic lookup for Cement
    // Find first cement in materialsDatabase whose name/englishName matches the key
    let matchedCement = materialsDatabase.find(m => m.category === "إسمنت" && (
      (rec.cementTypeKey === "cem_52_5" && m.name.includes("52.5")) ||
      (rec.cementTypeKey === "cem_42_5" && m.name.includes("42.5")) ||
      (rec.cementTypeKey === "cem_32_5" && m.name.includes("32.5")) ||
      (rec.cementTypeKey === "cem_ii_a" && (m.name.includes("CEM II") || m.name.includes("II/A"))) ||
      (rec.cementTypeKey === "cem_ii_b" && (m.name.includes("CEM II") || m.name.includes("II/B")))
    ));
    if (!matchedCement) {
      matchedCement = materialsDatabase.find(m => m.category === "إسمنت");
    }

    const cementName = matchedCement ? matchedCement.name : "CEM I 42.5";
    const cementDens = matchedCement ? matchedCement.density : 0;
    const cementPrice = matchedCement ? matchedCement.price : 18.0;

    // 2. Dynamic lookup for Sand
    let matchedSand = materialsDatabase.find(m => m.category === "رمال" && (
      (rec.sandTypeKey === "fine_sand" && m.name.includes("ناعم")) ||
      (rec.sandTypeKey === "medium_sand" && m.name.includes("متوسط")) ||
      (rec.sandTypeKey === "coarse_sand" && m.name.includes("خشن")) ||
      (rec.sandTypeKey === "river_sand" && (m.name.includes("نهر") || m.englishName.includes("River"))) ||
      (rec.sandTypeKey === "quarry_sand" && (m.name.includes("محجر") || m.name.includes("كسارة") || m.englishName.includes("Crushed"))) ||
      (rec.sandTypeKey === "siliceous_sand" && (m.name.includes("سيليسي") || m.englishName.includes("Silica"))) ||
      (rec.sandTypeKey === "calcareous_sand" && (m.name.includes("كلسي") || m.englishName.includes("Calcareous")))
    ));
    if (!matchedSand) {
      matchedSand = materialsDatabase.find(m => m.category === "رمال");
    }

    const sandName = matchedSand ? matchedSand.name : "رمل متوسط (Medium Sand)";
    const sandDens = matchedSand ? matchedSand.density : 0;
    const sandPrice = matchedSand ? matchedSand.price : 6.0;

    // 3. Dynamic lookup for Gravel
    let matchedGravel = materialsDatabase.find(m => m.category === "حصى" && (
      (rec.aggregateTypeKey === "gravel_3_8" && m.name.includes("3/8")) ||
      (rec.aggregateTypeKey === "gravel_8_15" && m.name.includes("8/15")) ||
      (rec.aggregateTypeKey === "gravel_15_25" && m.name.includes("15/25")) ||
      (rec.aggregateTypeKey === "gravel_25_40" && m.name.includes("25/40")) ||
      (rec.aggregateTypeKey === "gravel_basalt" && (m.name.includes("بازلت") || m.englishName.includes("Basalt"))) ||
      (rec.aggregateTypeKey === "gravel_calcareous" && (m.name.includes("كلس") || m.englishName.includes("Calcite") || m.englishName.includes("Calcareous"))) ||
      (rec.aggregateTypeKey === "gravel_river" && (m.name.includes("نهري") || m.englishName.includes("River"))) ||
      (rec.aggregateTypeKey === "gravel_crushed" && (m.name.includes("مكسر") || m.englishName.includes("Crushed")))
    ));
    if (!matchedGravel) {
      matchedGravel = materialsDatabase.find(m => m.category === "حصى");
    }

    const gravelName = matchedGravel ? matchedGravel.name : "حصى 8/15";
    const gravelDens = matchedGravel ? (matchedGravel.density || matchedGravel.specificGravity || 0) : 0;
    const gravelPrice = matchedGravel ? matchedGravel.price : 8.0;

    const sandAbsorption = matchedSand ? (matchedSand.absorption !== undefined ? matchedSand.absorption : 1.5) : 1.5;
    const sandMoisture = matchedSand ? (matchedSand.moisture !== undefined ? matchedSand.moisture : 0) : 0;
    const gravelAbsorption = matchedGravel ? (matchedGravel.absorption !== undefined ? matchedGravel.absorption : 0.8) : 0.8;
    const gravelMoisture = matchedGravel ? (matchedGravel.moisture !== undefined ? matchedGravel.moisture : 0) : 0;
    const gravelShape = matchedGravel?.particleShape === "مكسر" || matchedGravel?.particleShape === "زاوي" ? AggregateType.CONCASSE : AggregateType.ROULE;

    setInputs(prev => ({
      ...prev,
      fck28: rec.targetStrength,
      cementType: cementName,
      cementClassStrength: rec.cementTypeKey === "cem_52_5" ? 52.5 : rec.cementTypeKey === "cem_32_5" || rec.cementTypeKey === "cem_ii_b" ? 32.5 : 42.5,
      cementDensity: prev.autoDensities ? cementDens : prev.cementDensity,
      priceCement: cementPrice !== undefined ? cementPrice : prev.priceCement,
      selectedCementId: matchedCement ? matchedCement.id : prev.selectedCementId,
      dMax: rec.targetDmax,
      slump: rec.targetSlump,
      airContent: rec.targetAirContent,
      dosageSuper: rec.dosageSuper,
      dosageAir: rec.dosageAir,
      dosageRetarder: rec.dosageRetarder,
      dosageAccelerator: rec.dosageAccelerator,
      dosageSilicaFume: rec.dosageSilicaFume,
      dosageFlyAsh: rec.dosageFlyAsh,
      dosageSlag: rec.dosageSlag,
      sandType: sandName,
      sandRelativeDensity: prev.autoDensities ? sandDens : prev.sandRelativeDensity,
      priceSand: sandPrice !== undefined ? sandPrice : prev.priceSand,
      selectedSandId: matchedSand ? matchedSand.id : prev.selectedSandId,
      sandAbsorption: prev.autoDensities ? sandAbsorption : prev.sandAbsorption,
      moistureSand: sandMoisture,
      finenessModulus: matchedSand?.finenessModulus || prev.finenessModulus,
      gravelType: gravelName,
      gravelRelativeDensity: prev.autoDensities ? gravelDens : prev.gravelRelativeDensity,
      priceGravel: gravelPrice !== undefined ? gravelPrice : prev.priceGravel,
      selectedGravelId: matchedGravel ? matchedGravel.id : prev.selectedGravelId,
      gravelAbsorption: prev.autoDensities ? gravelAbsorption : prev.gravelAbsorption,
      moistureGravel: gravelMoisture,
      aggregateType: gravelShape
    }));
  };

  const handleApplySmartSuggestions = (selectedIds: {
    selectedCementId?: string;
    selectedSandId?: string;
    selectedGravelId?: string;
    selectedWaterId?: string;
    selectedAdmixtureId?: string;
    selectedScmId?: string;
    selectedFiberId?: string;
    selectedSpecialBinderId?: string;
  }) => {
    setInputs(prev => {
      const copy = { ...prev };

      // 1. Cement
      if (selectedIds.selectedCementId) {
        const mat = materialsDatabase.find(m => m.id === selectedIds.selectedCementId);
        if (mat) {
          copy.selectedCementId = mat.id;
          copy.cementType = mat.name;
          const rawDens = mat.density || mat.specificGravity || 0;
          let densNum = parseFloat(String(rawDens));
          if (!isNaN(densNum) && densNum > 0) {
            if (densNum < 10) densNum = densNum * 1000;
            copy.cementDensity = densNum;
          }
          copy.priceCement = mat.price !== undefined ? mat.price : 17;
          const strClass = parseFloat(mat.strengthClass || mat.cementClassStrength);
          if (!isNaN(strClass)) {
            copy.cementClassStrength = strClass;
          }
        }
      }

      // 2. Sand
      if (selectedIds.selectedSandId) {
        const mat = materialsDatabase.find(m => m.id === selectedIds.selectedSandId);
        if (mat) {
          copy.selectedSandId = mat.id;
          copy.sandType = mat.name;
          const rawDens = mat.density || mat.specificGravity || 0;
          let densNum = parseFloat(String(rawDens));
          if (!isNaN(densNum) && densNum > 0) {
            if (densNum > 10) densNum = densNum / 1000;
            copy.sandRelativeDensity = densNum;
          }
          copy.priceSand = mat.price !== undefined ? mat.price : 2.5;
          copy.sandAbsorption = mat.absorption !== undefined ? mat.absorption : 1.5;
          copy.moistureSand = mat.moisture !== undefined ? mat.moisture : 0;
          if (mat.finenessModulus) {
            copy.finenessModulus = mat.finenessModulus;
          }
        }
      }

      // 3. Gravel
      if (selectedIds.selectedGravelId) {
        const mat = materialsDatabase.find(m => m.id === selectedIds.selectedGravelId);
        if (mat) {
          copy.selectedGravelId = mat.id;
          copy.gravelType = mat.name;
          const rawDens = mat.density || mat.specificGravity || 0;
          let densNum = parseFloat(String(rawDens));
          if (!isNaN(densNum) && densNum > 0) {
            if (densNum > 10) densNum = densNum / 1000;
            copy.gravelRelativeDensity = densNum;
          }
          copy.priceGravel = mat.price !== undefined ? mat.price : 8.0;
          copy.gravelAbsorption = mat.absorption !== undefined ? mat.absorption : 0.8;
          copy.moistureGravel = mat.moisture !== undefined ? mat.moisture : 0;
          copy.aggregateType = mat.particleShape === "مكسر" || mat.particleShape === "زاوي" ? AggregateType.CONCASSE : AggregateType.ROULE;
          if (mat.dMax) {
            copy.dMax = mat.dMax;
          }
        }
      }

      // 4. Water
      if (selectedIds.selectedWaterId) {
        const mat = materialsDatabase.find(m => m.id === selectedIds.selectedWaterId);
        if (mat) {
          copy.selectedWaterId = mat.id;
          copy.selectedWaterName = mat.name;
          copy.priceWater = mat.price !== undefined ? mat.price : 0.15;
        }
      }

      // 5. Admixture
      if (selectedIds.selectedAdmixtureId) {
        const mat = materialsDatabase.find(m => m.id === selectedIds.selectedAdmixtureId);
        if (mat) {
          copy.selectedAdmixtureId = mat.id;
          copy.selectedAdmixtureName = mat.name;
          copy.priceSuper = mat.price !== undefined ? mat.price : 180;
          copy.selectedAdmixtureDensity = mat.density || 1.15;
          copy.selectedAdmixtureWaterReduction = mat.waterReduction || 20;
          
          if (copy.concreteType === "UHPC" || copy.concreteType === "BFUP") {
            copy.dosageSuper = 2.5;
          } else if (copy.concreteType === "SCC" || copy.fck28 >= 40) {
            copy.dosageSuper = 1.8;
          } else {
            copy.dosageSuper = 1.2;
          }
        }
      }

      // 6. SCM
      if (selectedIds.selectedScmId) {
        const mat = materialsDatabase.find(m => m.id === selectedIds.selectedScmId);
        if (mat) {
          copy.selectedScmId = mat.id;
          copy.selectedScmName = mat.name;
          copy.selectedScmDensity = mat.density || 2200;
          copy.priceSilicaFume = mat.price !== undefined ? mat.price : 90;
          
          if (copy.concreteType === "UHPC" || copy.concreteType === "BFUP" || copy.concreteType === "HSC" || copy.concreteType === "HPC") {
            copy.dosageSilicaFume = 8.0;
          } else {
            copy.dosageSilicaFume = 5.0;
          }
        }
      }

      // 7. Fiber
      if (selectedIds.selectedFiberId) {
        const mat = materialsDatabase.find(m => m.id === selectedIds.selectedFiberId);
        if (mat) {
          copy.selectedFiberId = mat.id;
          copy.selectedFiberName = mat.name;
          copy.fiberDensity = mat.density || 7850;
          copy.priceFiber = mat.price !== undefined ? mat.price : 250;
          copy.fiberDosageKgM3 = 45;
        }
      }

      // 8. Special Binder
      if (selectedIds.selectedSpecialBinderId) {
        const mat = materialsDatabase.find(m => m.id === selectedIds.selectedSpecialBinderId);
        if (mat) {
          copy.selectedSpecialBinderId = mat.id;
          copy.selectedSpecialBinderName = mat.name;
          copy.specialBinderDensity = mat.density || 2900;
          copy.priceSpecialBinder = mat.price !== undefined ? mat.price : 45;
          copy.specialBinderReplacementPercent = 100;
        }
      }

      return copy;
    });

    setActivityLogs(prev => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        descriptionAr: `🤖 مساعد المواد الذكي: تم اختيار وتطبيق المواد المقترحة تلقائياً للخرسانة (${inputs.concreteType || "NSC"}) ومقاومة (${inputs.fck28 || 25} MPa)`,
        descriptionFr: `🤖 Assistant intelligent : Sélection et application automatiques des matériaux pour le béton (${inputs.concreteType || "NSC"})`,
        descriptionEn: `🤖 Smart Materials Assistant: Automatically selected and applied matched materials for concrete (${inputs.concreteType || "NSC"})`,
        type: "success"
      },
      ...prev
    ].slice(0, 30));

    setNotifications(prev => [
      {
        id: String(Date.now()),
        textAr: "تم تطبيق واختيار المواد المقترحة من مكتبة المواد بنجاح!",
        textFr: "Matériaux suggérés appliqués avec succès depuis la bibliothèque !",
        textEn: "Suggested materials applied successfully from the library!",
        read: false
      },
      ...prev
    ]);
  };

  // Generate an inputs copy where all prices are normalized to DZD
  const normalizedInputsForCalc = useMemo(() => {
    const copy = { ...inputs };

    // Dynamically link selected material physical/engineering properties directly from the materials library
    if (materialsDatabase && materialsDatabase.length > 0) {
      // 1. Cement
      if (inputs.selectedCementId) {
        const mat = materialsDatabase.find(m => m.id === inputs.selectedCementId);
        if (mat) {
          if (!inputs.labOverrides?.cementDensity) {
            const rawDens = mat.density || mat.specificGravity || mat.specific_gravity;
            if (rawDens) {
              let densNum = parseFloat(String(rawDens));
              if (!isNaN(densNum) && densNum > 0) {
                if (densNum < 10) densNum = densNum * 1000;
                copy.cementDensity = densNum;
              }
            }
          }
          const rawStrength = mat.strengthClass || mat.strength_class || mat.cementClassStrength || mat.cementClass || mat.cement_class;
          if (rawStrength) {
            const match = String(rawStrength).match(/[\d.]+/);
            if (match) {
              const val = parseFloat(match[0]);
              if (!isNaN(val) && val > 0) copy.cementClassStrength = val;
            }
          }
          if (mat.price !== undefined && mat.price !== null) {
            copy.priceCement = mat.price;
          }
        }
      }

      // 2. Sand
      if (inputs.selectedSandId) {
        const mat = materialsDatabase.find(m => m.id === inputs.selectedSandId);
        if (mat) {
          if (!inputs.labOverrides?.sandRelativeDensity) {
            const rawDens = mat.density || mat.specificGravity || mat.specific_gravity;
            if (rawDens) {
              let densNum = parseFloat(String(rawDens));
              if (!isNaN(densNum) && densNum > 0) {
                copy.sandRelativeDensity = densNum;
              }
            }
          }
          if (!inputs.labOverrides?.sandAbsorption) {
            const rawAbs = mat.absorption || mat.waterAbsorption || mat.water_absorption;
            if (rawAbs !== undefined) {
              const absNum = parseFloat(String(rawAbs));
              if (!isNaN(absNum) && absNum >= 0) copy.sandAbsorption = absNum;
            }
          }
          const rawMoist = mat.moisture || mat.moistureContent || mat.moisture_content;
          if (rawMoist !== undefined) {
            const moistNum = parseFloat(String(rawMoist));
            if (!isNaN(moistNum) && moistNum >= 0) copy.moistureSand = moistNum;
          }
          const rawFm = mat.finenessModulus || mat.fineness_modulus;
          if (rawFm !== undefined) {
            const fmNum = parseFloat(String(rawFm));
            if (!isNaN(fmNum) && fmNum >= 0) copy.finenessModulus = fmNum;
          }
          if (mat.price !== undefined && mat.price !== null) {
            copy.priceSand = mat.price;
          }
        }
      }

      // 3. Gravel
      if (inputs.selectedGravelId) {
        const mat = materialsDatabase.find(m => m.id === inputs.selectedGravelId);
        if (mat) {
          if (!inputs.labOverrides?.gravelRelativeDensity) {
            const rawDens = mat.density || mat.specificGravity || mat.specific_gravity;
            if (rawDens) {
              let densNum = parseFloat(String(rawDens));
              if (!isNaN(densNum) && densNum > 0) {
                copy.gravelRelativeDensity = densNum;
              }
            }
          }
          if (!inputs.labOverrides?.gravelAbsorption) {
            const rawAbs = mat.absorption || mat.waterAbsorption || mat.water_absorption;
            if (rawAbs !== undefined) {
              const absNum = parseFloat(String(rawAbs));
              if (!isNaN(absNum) && absNum >= 0) copy.gravelAbsorption = absNum;
            }
          }
          const rawMoist = mat.moisture || mat.moistureContent || mat.moisture_content;
          if (rawMoist !== undefined) {
            const moistNum = parseFloat(String(rawMoist));
            if (!isNaN(moistNum) && moistNum >= 0) copy.moistureGravel = moistNum;
          }
          if (!inputs.labOverrides?.dMax) {
            const rawDmax = mat.dMax || mat.dmax || mat.DMax || mat.Dmax;
            if (rawDmax !== undefined) {
              const dmaxNum = parseFloat(String(rawDmax));
              if (!isNaN(dmaxNum) && dmaxNum > 0) copy.dMax = dmaxNum;
            }
          }
          const rawShape = mat.particleShape || mat.shapeIndex || mat.particle_shape;
          if (rawShape) {
            const sStr = String(rawShape).toLowerCase();
            if (sStr.includes("concasse") || sStr.includes("crushed") || sStr.includes("angular") || sStr.includes("مكسر") || sStr.includes("زاوي")) {
              copy.aggregateType = AggregateType.CONCASSE;
            } else if (sStr.includes("roule") || sStr.includes("rounded") || sStr.includes("مستدير") || sStr.includes("وديان")) {
              copy.aggregateType = AggregateType.ROULE;
            }
          }
          const rawQuality = mat.quality || mat.Quality || mat.quality_rating;
          if (rawQuality) {
            const qStr = String(rawQuality).toLowerCase();
            if (qStr.includes("excellent") || qStr.includes("ممتاز") || qStr.includes("عالي")) {
              copy.aggregateQuality = AggregateQuality.EXCELLENT;
            } else if (qStr.includes("poor") || qStr.includes("ضعيف") || qStr.includes("متوسط")) {
              copy.aggregateQuality = AggregateQuality.POOR;
            } else if (qStr.includes("standard") || qStr.includes("عادي") || qStr.includes("قياسي")) {
              copy.aggregateQuality = AggregateQuality.STANDARD;
            }
          }
          if (mat.price !== undefined && mat.price !== null) {
            copy.priceGravel = mat.price;
          }
        }
      }

      // 4. Water
      if (inputs.selectedWaterId) {
        const mat = materialsDatabase.find(m => m.id === inputs.selectedWaterId);
        if (mat) {
          if (mat.price !== undefined && mat.price !== null) {
            copy.priceWater = mat.price;
          }
          const rawPh = mat.ph || mat.pH || mat.waterPH || mat.phValue;
          if (rawPh !== undefined) {
            const phVal = parseFloat(String(rawPh));
            if (!isNaN(phVal)) copy.selectedWaterPH = phVal;
          }
          const rawCl = mat.chlorideContent || mat.chlorides || mat.chloride || mat.chlorideContentPpm;
          if (rawCl !== undefined) {
            const clVal = parseFloat(String(rawCl));
            if (!isNaN(clVal)) copy.selectedWaterChlorideContent = clVal;
          }
          const rawSo4 = mat.sulphateContent || mat.sulfateContent || mat.sulphates || mat.sulphate || mat.sulphateContentPpm;
          if (rawSo4 !== undefined) {
            const so4Val = parseFloat(String(rawSo4));
            if (!isNaN(so4Val)) copy.selectedWaterSulphateContent = so4Val;
          }
          const rawTemp = mat.temperature || mat.waterTemp || mat.temp || mat.waterTemperature;
          if (rawTemp !== undefined) {
            const tempVal = parseFloat(String(rawTemp));
            if (!isNaN(tempVal)) copy.selectedWaterTemperature = tempVal;
          }
        }
      }

      // 5. Chemical Admixtures
      if (inputs.selectedAdmixtureId) {
        const mat = materialsDatabase.find(m => m.id === inputs.selectedAdmixtureId);
        if (mat) {
          const rawReduction = mat.waterReduction || mat.water_reduction || mat.waterReductionPercent;
          if (rawReduction !== undefined) {
            const redNum = parseFloat(String(rawReduction));
            if (!isNaN(redNum)) copy.selectedAdmixtureWaterReduction = Math.min(35, Math.max(0, redNum));
          }
          const rawDens = mat.density || mat.specificGravity || mat.specific_gravity;
          if (rawDens) {
            let densNum = parseFloat(String(rawDens));
            if (!isNaN(densNum) && densNum > 0) {
              if (densNum < 10) densNum = densNum * 1000;
              copy.selectedAdmixtureDensity = densNum;
            }
          }
          if (mat.price !== undefined && mat.price !== null) {
            copy.priceSuper = mat.price;
          }
        }
      }

      // 6. Mineral Admixtures / SCM
      if (inputs.selectedScmId) {
        const mat = materialsDatabase.find(m => m.id === inputs.selectedScmId);
        if (mat) {
          const rawDens = mat.density || mat.specificGravity || mat.specific_gravity;
          if (rawDens) {
            let densNum = parseFloat(String(rawDens));
            if (!isNaN(densNum) && densNum > 0) {
              if (densNum < 10) densNum = densNum * 1000;
              copy.selectedScmDensity = densNum;
            }
          }
          const rawWdf = mat.selectedScmWaterDemandFactor || mat.waterDemandFactor || mat.waterDemand;
          if (rawWdf !== undefined) {
            const wdfNum = parseFloat(String(rawWdf));
            if (!isNaN(wdfNum)) copy.selectedScmWaterDemandFactor = wdfNum;
          }
          const rawPozz = mat.selectedScmPozzolanicIndex || mat.pozzolanicIndex || mat.pozzolanic;
          if (rawPozz !== undefined) {
            const pozzNum = parseFloat(String(rawPozz));
            if (!isNaN(pozzNum)) copy.selectedScmPozzolanicIndex = pozzNum;
          }
          const scmType = mat.category || mat.type || "";
          const scmTypeStr = String(scmType).toLowerCase();
          if (scmTypeStr.includes("silica") || scmTypeStr.includes("سيليكا")) {
            if (mat.price !== undefined && mat.price !== null) copy.priceSilicaFume = mat.price;
          } else if (scmTypeStr.includes("fly") || scmTypeStr.includes("رماد")) {
            if (mat.price !== undefined && mat.price !== null) copy.priceFlyAsh = mat.price;
          } else if (scmTypeStr.includes("slag") || scmTypeStr.includes("خبث")) {
            if (mat.price !== undefined && mat.price !== null) copy.priceSlag = mat.price;
          }
        }
      }
    }

    const pricesKeys = [
      "priceCement", "priceSand", "priceGravel", "priceWater",
      "priceSuper", "priceAir", "priceRetarder", "priceAccelerator",
      "priceSilicaFume", "priceFlyAsh", "priceSlag", "priceLabor"
    ];
    pricesKeys.forEach(key => {
      const val = copy[key as keyof typeof copy] as number;
      copy[key as keyof typeof copy] = getPriceInDZD(val, key, currency) as any;
    });

    return {
      ...copy,
      materialsDatabase: materialsDatabase
    };
  }, [inputs, currency, materialsDatabase]);

  // Live calculated results from utils.ts Dreux-Gorisse solver
  const results = useMemo(() => {
    const { selectedCementId, selectedSandId, selectedGravelId, selectedWaterId } = inputs;
    
    // Check if any required ID is missing
    if (!selectedCementId || !selectedSandId || !selectedGravelId || !selectedWaterId) {
      const errorMsg = language === "fr" ? "Veuillez entrer les matériaux du projet dans le dépôt avant de lancer le calcul." :
        language === "en" ? "Please enter the project materials in the repository before running the calculation." :
        "يرجى إدخال مواد المشروع في المستودع قبل تشغيل الحساب.";
        
      return {
        valid: false,
        isValid: false,
        errors: [errorMsg],
        warnings: [errorMsg],
        fcm28: 0,
        stdDev: 0,
        wcRatio: 0,
        wcRatioAdjusted: 0,
        dreuxAggregateFactor: 0,
        compactorGamma: 0,
        cementWeight: 0,
        waterContentNeeded: 0,
        waterContentActual: 0,
        sandPercent: 0,
        gravelPercent: 0,
        sandWeightDry: 0,
        gravelWeightDry: 0,
        admixtureWeights: [],
        sandWeightWet: 0,
        gravelWeightWet: 0,
        waterWeightWet: 0,
        totalFreshDensity: 0,
        waterBeforeCorrection: 0,
        waterAfterDmax: 0,
        waterFromAdmixtures: 0,
        totalAggregateVolume: 0,
        pivotPoint: { x: 0, y: 0 },
        gradingCurve: [],
        detailedSteps: [errorMsg],
        strengthEvolution: [],
        standardsCompliance: [],
        designWater: 0,
        effectiveWater: 0,
        aggregateFreeWater: 0,
        batchWaterToAdd: 0,
        waterCementRatio: 0,
        waterBinderRatio: 0,
        calculationMode: "strengthBased",
        costBreakdown: [],
        totalCost: 0,
        cementitiousMaterials: { cement: 0, flyAsh: 0, slag: 0, silicaFume: 0 },
        totalBinder: 0,
        materialSuitability: {
          status: "blocked",
          missingMaterials: ["cement", "sand", "gravel", "water"],
          invalidMaterials: [],
          incompatibleMaterials: [],
          warnings: [errorMsg],
          recommendations: [errorMsg]
        }
      };
    }

    const cement = materialsDatabase.find(m => m.id === selectedCementId);
    const sand = materialsDatabase.find(m => m.id === selectedSandId);
    const gravel = materialsDatabase.find(m => m.id === selectedGravelId);
    const water = materialsDatabase.find(m => m.id === selectedWaterId);

    const checkAggregateCompleteAndApproved = (m: any) => {
      if (!m) return false;
      const isFine = m.category === "رمال";
      const sg = m.SpecificGravity || m.specificGravity;
      const abs = m.Absorption || m.absorption;
      if (!sg || sg <= 0 || abs === undefined || abs < 0) return false;

      if (isFine) {
        const fm = m.FinenessModulus || m.finenessModulus;
        if (!fm || fm <= 0) return false;
      } else {
        const dMax = m.dMax;
        if (!dMax || dMax <= 0) return false;
      }

      if (!m.laboratory || !m.standard || !m.gradationData || m.gradationData.length === 0) return false;
      if (m.ApprovalStatus !== "Approved") return false;

      return true;
    };

    const hasValidMaterials = 
      cement && isApprovedAndActive(cement) &&
      sand && isApprovedAndActive(sand) &&
      gravel && isApprovedAndActive(gravel) &&
      water && isApprovedAndActive(water);

    const hasFullyVerifiedAggregates = 
      (!sand || checkAggregateCompleteAndApproved(sand)) &&
      (!gravel || checkAggregateCompleteAndApproved(gravel));

    if (!hasValidMaterials || !hasFullyVerifiedAggregates) {
      let errorMsg = language === "fr" ? "Veuillez entrer les matériaux du projet dans le dépôt avant de lancer le calcul." :
        language === "en" ? "Please enter the project materials in the repository before running the calculation." :
        "يرجى إدخال مواد المشروع في المستودع قبل تشغيل الحساب.";

      if (hasValidMaterials && !hasFullyVerifiedAggregates) {
        errorMsg = language === "ar" 
          ? "لا يمكن استخدام هذا التجميع (الركام) حتى يتم استكمال جميع الخصائص الهندسية الإلزامية والتحقق منها. (This assembler cannot be used until all mandatory engineering properties have been completed and verified.)"
          : "This assembler cannot be used until all mandatory engineering properties have been completed and verified.";
      }
        
      return {
        valid: false,
        isValid: false,
        errors: [errorMsg],
        warnings: [errorMsg],
        fcm28: 0,
        stdDev: 0,
        wcRatio: 0,
        wcRatioAdjusted: 0,
        dreuxAggregateFactor: 0,
        compactorGamma: 0,
        cementWeight: 0,
        waterContentNeeded: 0,
        waterContentActual: 0,
        sandPercent: 0,
        gravelPercent: 0,
        sandWeightDry: 0,
        gravelWeightDry: 0,
        admixtureWeights: [],
        sandWeightWet: 0,
        gravelWeightWet: 0,
        waterWeightWet: 0,
        totalFreshDensity: 0,
        waterBeforeCorrection: 0,
        waterAfterDmax: 0,
        waterFromAdmixtures: 0,
        totalAggregateVolume: 0,
        pivotPoint: { x: 0, y: 0 },
        gradingCurve: [],
        detailedSteps: [errorMsg],
        strengthEvolution: [],
        standardsCompliance: [],
        designWater: 0,
        effectiveWater: 0,
        aggregateFreeWater: 0,
        batchWaterToAdd: 0,
        waterCementRatio: 0,
        waterBinderRatio: 0,
        calculationMode: "strengthBased",
        costBreakdown: [],
        totalCost: 0,
        cementitiousMaterials: { cement: 0, flyAsh: 0, slag: 0, silicaFume: 0 },
        totalBinder: 0,
        materialSuitability: {
          status: "blocked",
          missingMaterials: ["cement", "sand", "gravel", "water"],
          invalidMaterials: [],
          incompatibleMaterials: [],
          warnings: [errorMsg],
          recommendations: [errorMsg]
        }
      };
    }

    const calcResult = calculateDreuxGorisse(normalizedInputsForCalc);
    if (calcResult.materialSuitability && (calcResult.materialSuitability.status as string) === "diagnostic_only") {
      calcResult.materialSuitability.status = "blocked";
    }
    return calcResult;
  }, [normalizedInputsForCalc, materialsDatabase, language]);

  // Central Calculation Validation Gate
  const validationGate = useMemo(() => {
    return validateCalculationLogic({
      ...inputs,
      currentProject,
      currentClient,
      currentPlant
    }, results, language);
  }, [inputs, results, language, currentProject, currentClient, currentPlant]);

  // Dynamically count the number of engineering properties imported from Material Library
  const countLoadedProperties = useMemo(() => {
    let count = 0;
    const selectedIds = [
      inputs.selectedCementId,
      inputs.selectedSandId,
      inputs.selectedGravelId,
      inputs.selectedWaterId,
      inputs.selectedAdmixtureId,
      inputs.selectedScmId
    ].filter(Boolean);
    
    selectedIds.forEach(id => {
      const mat = materialsDatabase.find(m => m.id === id);
      if (mat) {
        Object.keys(mat).forEach(key => {
          if (mat[key] !== undefined && mat[key] !== null && mat[key] !== "") {
            count++;
          }
        });
      }
    });
    return count;
  }, [inputs, materialsDatabase]);

  // Synchronize active project details with dynamic EMMS traceability and material snapshots
  useEffect(() => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        // Check what we have in p.materialSnapshots and build a filtered snapshot
        const currentSnaps = p.materialSnapshots || {};
        const filteredSnapshots: Record<string, EngineeringMaterial> = {};

        // Only reuse currentSnap if ID and name/type still match the selected inputs
        if (currentSnaps.cement && (currentSnaps.cement.id === inputs.selectedCementId || currentSnaps.cement.name === inputs.cementType)) {
          filteredSnapshots.cement = { ...currentSnaps.cement };
        }
        if (currentSnaps.sand && (currentSnaps.sand.id === inputs.selectedSandId || currentSnaps.sand.name === inputs.sandType)) {
          filteredSnapshots.sand = { ...currentSnaps.sand };
        }
        if (currentSnaps.gravel && (currentSnaps.gravel.id === inputs.selectedGravelId || currentSnaps.gravel.name === inputs.gravelType)) {
          filteredSnapshots.gravel = { ...currentSnaps.gravel };
        }
        if (currentSnaps.water && (currentSnaps.water.id === inputs.selectedWaterId)) {
          filteredSnapshots.water = { ...currentSnaps.water };
        }
        if (currentSnaps.admixture && (currentSnaps.admixture.id === inputs.selectedAdmixtureId)) {
          filteredSnapshots.admixture = { ...currentSnaps.admixture };
        }
        if (currentSnaps.scm && (currentSnaps.scm.id === inputs.selectedScmId)) {
          filteredSnapshots.scm = { ...currentSnaps.scm };
        }

        // Now resolve materials with this template prioritizing our frozen snapshots
        const resolvedAll = resolveMaterials(inputs, filteredSnapshots, materialsDatabase);
        
        // Define active material IDs for project tracking
        const materialIds = [
          resolvedAll.cement?.id || "",
          resolvedAll.sand?.id || "",
          resolvedAll.gravel?.id || "",
          resolvedAll.water?.id || ""
        ].filter(Boolean);
        if (resolvedAll.admixture) materialIds.push(resolvedAll.admixture.id);
        if (resolvedAll.scm) materialIds.push(resolvedAll.scm.id);

        const projectSnapshots: Record<string, EngineeringMaterial> = {};
        if (resolvedAll.cement) projectSnapshots.cement = { ...resolvedAll.cement };
        if (resolvedAll.sand) projectSnapshots.sand = { ...resolvedAll.sand };
        if (resolvedAll.gravel) projectSnapshots.gravel = { ...resolvedAll.gravel };
        if (resolvedAll.water) projectSnapshots.water = { ...resolvedAll.water };
        if (resolvedAll.admixture) projectSnapshots.admixture = { ...resolvedAll.admixture };
        if (resolvedAll.scm) projectSnapshots.scm = { ...resolvedAll.scm };

        const currentMixId = p.mixId || `mix_${Date.now()}`;
        const hasMaterialChanges = p.materialIds ? JSON.stringify(p.materialIds) !== JSON.stringify(materialIds) : true;
        
        const revisionHistory = [...(p.auditTrail?.revisionHistory || [])];
        if (hasMaterialChanges && p.materialIds) {
          revisionHistory.push(`Material selections updated. Active constituent list: [${materialIds.join(", ")}]`);
        }

        return {
          ...p,
          name: currentProject,
          client: currentClient,
          plant: currentPlant,
          inputs: { ...inputs },
          results: { ...results },
          materialSnapshots: projectSnapshots,
          projectId: p.id,
          mixId: currentMixId,
          materialIds,
          calculationVersion: "SNO-v3.5L",
          auditTrail: {
            createdBy: p.auditTrail?.createdBy || "senoussi.s.t@gmail.com",
            createdAt: p.auditTrail?.createdAt || p.createdDate || new Date().toISOString().split('T')[0],
            lastModifiedBy: "senoussi.s.t@gmail.com",
            lastModifiedAt: new Date().toISOString(),
            revisionHistory
          }
        };
      }
      return p;
    }));
  }, [inputs, results, currentProject, currentClient, currentPlant, activeProjectId, materialsDatabase]);

  const switchProject = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setActiveProjectId(projId);
      setCurrentProject(proj.name);
      setCurrentClient(proj.client);
      setCurrentPlant(proj.plant);
      setInputs(normalizeInputsToDreux(proj.inputs));
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newId = `PROJ-${Math.floor(100 + Math.random() * 900)}`;
    const newProjFields: MixDesignInput = {
      fck28: Number(newProjStrength) || 25,
      concreteType: "NSC",
      controlClass: "normal",
      cementType: "CEM I (إسمنت بورتلاندي عادي خالي من الإضافات)",
      cementClassStrength: 42.5,
      dMax: 20,
      slump: 8,
      aggregateType: AggregateType.ROULE,
      aggregateQuality: AggregateQuality.STANDARD,
      hasPumping: false,
      sandRelativeDensity: 0,
      gravelRelativeDensity: 0,
      cementDensity: 0,
      airContent: 1.0,
      moistureSand: 0,
      moistureGravel: 0,
      sandAbsorption: 0,
      gravelAbsorption: 0,
      admixtures: [],
      dosageSuper: 0,
      dosageAir: 0.0,
      dosageRetarder: 0.0,
      dosageAccelerator: 0.0,
      dosageSilicaFume: 0.0,
      dosageFlyAsh: 0.0,
      dosageSlag: 0.0,
      sandType: "رمل متوسط (Medium Sand)",
      gravelType: "حصى 8/15",
      autoDensities: true,
      batchVolume: 1.0,
      selectedMethod: "dreux",
      exposureClass: "X0",
      durabilityLevel: "normal",
      carbonationLevel: "negligible",
      chloridesLevel: "none",
      sulfatesLevel: "none",
      priceCement: 20,
      priceSand: 2.5,
      priceGravel: 2.8,
      priceSuper: 150,
      priceAir: 110,
      priceRetarder: 95,
      priceAccelerator: 125,
      priceSilicaFume: 65,
      priceFlyAsh: 40,
      priceSlag: 30,
      priceLabor: 1200,
      priceWater: 2,
      internalUnitWeight: 1600,
      internalCoeffG: 0.50,
      internalCurveCoeff: 1.0,
      internalSandRatio: 0.35,
      packingFactor: 0.82,
      internalWcOverride: 0.45,
    };
    const initialResolved = resolveMaterials(newProjFields, undefined, materialsDatabase);
    const initialSnapshots: Record<string, EngineeringMaterial> = {};
    if (initialResolved.cement) initialSnapshots.cement = JSON.parse(JSON.stringify(initialResolved.cement));
    if (initialResolved.sand) initialSnapshots.sand = JSON.parse(JSON.stringify(initialResolved.sand));
    if (initialResolved.gravel) initialSnapshots.gravel = JSON.parse(JSON.stringify(initialResolved.gravel));
    if (initialResolved.water) initialSnapshots.water = JSON.parse(JSON.stringify(initialResolved.water));
    if (initialResolved.admixture) initialSnapshots.admixture = JSON.parse(JSON.stringify(initialResolved.admixture));
    if (initialResolved.scm) initialSnapshots.scm = JSON.parse(JSON.stringify(initialResolved.scm));

    const materialIds = [
      initialResolved.cement?.id || "",
      initialResolved.sand?.id || "",
      initialResolved.gravel?.id || "",
      initialResolved.water?.id || ""
    ].filter(Boolean);
    if (initialResolved.admixture) materialIds.push(initialResolved.admixture.id);
    if (initialResolved.scm) materialIds.push(initialResolved.scm.id);

    const initialResults = calculateDreuxGorisse(newProjFields);
    if (initialResults.materialSuitability && (initialResults.materialSuitability.status as string) === "diagnostic_only") {
      initialResults.materialSuitability.status = "blocked";
    }

    const seedVer = {
      id: `VER-01`,
      name: "الإصدار المرجعي الأساسي - Initial Blueprint",
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      inputs: JSON.parse(JSON.stringify(newProjFields)),
      results: JSON.parse(JSON.stringify(initialResults)),
      materialSnapshots: JSON.parse(JSON.stringify(initialSnapshots)),
      projectId: newId,
      mixId: `mix_seed_${Date.now()}`,
      materialIds,
      calculationVersion: "SNO-v3.5L",
      auditTrail: {
        createdBy: "senoussi.s.t@gmail.com",
        createdAt: new Date().toISOString().split("T")[0],
        lastModifiedBy: "senoussi.s.t@gmail.com",
        lastModifiedAt: new Date().toISOString(),
        revisionHistory: ["Initial seed blueprint created and frozen."]
      }
    };

    const newProj: ActiveProject = {
      id: newId,
      name: `${newProjName.trim()} (#${newId})`,
      client: newProjClient.trim() || "عميل افتراضي",
      plant: newProjPlant,
      createdDate: new Date().toISOString().split("T")[0],
      inputs: newProjFields,
      projectId: newId,
      mixId: seedVer.mixId,
      materialIds,
      calculationVersion: "SNO-v3.5L",
      materialSnapshots: initialSnapshots,
      mixVersions: [seedVer],
      versions: [seedVer], // Save in both keys
      auditTrail: {
        createdBy: "senoussi.s.t@gmail.com",
        createdAt: new Date().toISOString().split("T")[0],
        lastModifiedBy: "senoussi.s.t@gmail.com",
        lastModifiedAt: new Date().toISOString(),
        revisionHistory: ["Initial project and concrete specification initialized with EMMS compliance checks."]
      }
    };

    setProjects(prev => [...prev, newProj]);
    
    // Switch to new project
    setActiveProjectId(newId);
    setCurrentProject(newProj.name);
    setCurrentClient(newProj.client);
    setCurrentPlant(newProj.plant);
    setInputs(normalizeInputsToDreux(newProj.inputs));

    // Reset form fields
    setNewProjName("");
    setNewProjClient("");
    setNewProjPlant("Algiers Central (A101)");
    setNewProjStrength(25);

    // Activity log
    setActivityLogs(prev => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        descriptionAr: `تم إنشاء وتفعيل مشروع هندسي جديد: ${newProj.name}`,
        descriptionFr: `Nouveau projet créé et activé : ${newProj.name}`,
        descriptionEn: `New project created and activated: ${newProj.name}`,
        type: "success"
      },
      ...prev
    ].slice(0, 30));
  };

  // Helper versions management
  const handleSaveVersion = (name: string, isOptimized?: boolean) => {
    if (!validationGate.isValidForReport) {
      alert(language === "ar" ? "لا يمكن حفظ هذا الإصدار لوجود أخطاء حسابية حرجة." : "Cannot save version: critical calculation errors.");
      return;
    }
    // Locate currently active project to use its snapshots as fallback prior to liveDatabase
    const activeProj = projects.find(p => p.id === activeProjectId);
    const resolvedAll = resolveMaterials(inputs, activeProj?.materialSnapshots, materialsDatabase);
    
    // Define active material IDs for project tracking
    const materialIds = [
      resolvedAll.cement?.id || "",
      resolvedAll.sand?.id || "",
      resolvedAll.gravel?.id || "",
      resolvedAll.water?.id || ""
    ].filter(Boolean);
    if (resolvedAll.admixture) materialIds.push(resolvedAll.admixture.id);
    if (resolvedAll.scm) materialIds.push(resolvedAll.scm.id);

    // Deep clone the resolved materials for the frozen snapshot
    const versionSnapshots: Record<string, EngineeringMaterial> = {};
    if (resolvedAll.cement) versionSnapshots.cement = JSON.parse(JSON.stringify(resolvedAll.cement));
    if (resolvedAll.sand) versionSnapshots.sand = JSON.parse(JSON.stringify(resolvedAll.sand));
    if (resolvedAll.gravel) versionSnapshots.gravel = JSON.parse(JSON.stringify(resolvedAll.gravel));
    if (resolvedAll.water) versionSnapshots.water = JSON.parse(JSON.stringify(resolvedAll.water));
    if (resolvedAll.admixture) versionSnapshots.admixture = JSON.parse(JSON.stringify(resolvedAll.admixture));
    if (resolvedAll.scm) versionSnapshots.scm = JSON.parse(JSON.stringify(resolvedAll.scm));

    const currentMixId = `mix_ver_${Date.now()}`;
    const revisionStr = `Saved certified mix version "${name}" (ID: ${currentMixId}).`;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const oldVersions = p.mixVersions || [];
        const revisionHistory = [...(p.auditTrail?.revisionHistory || []), revisionStr];
        
        const newVer = {
          id: `VER-${Date.now()}`,
          name,
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          inputs: JSON.parse(JSON.stringify(inputs)),
          results: JSON.parse(JSON.stringify(results)),
          isOptimized,
          materialSnapshots: versionSnapshots,
          projectId: p.id,
          mixId: currentMixId,
          materialIds,
          calculationVersion: "SNO-v3.5L",
          auditTrail: {
            createdBy: p.auditTrail?.createdBy || "senoussi.s.t@gmail.com",
            createdAt: p.auditTrail?.createdAt || p.createdDate || new Date().toISOString().split('T')[0],
            lastModifiedBy: "senoussi.s.t@gmail.com",
            lastModifiedAt: new Date().toISOString(),
            revisionHistory
          }
        };

        const updatedVersions = [newVer, ...oldVersions];

        return {
          ...p,
          mixVersions: updatedVersions,
          versions: updatedVersions, // Set both keys for compatibility
          materialSnapshots: versionSnapshots,
          projectId: p.id,
          mixId: currentMixId,
          materialIds,
          calculationVersion: "SNO-v3.5L",
          auditTrail: {
            createdBy: p.auditTrail?.createdBy || "senoussi.s.t@gmail.com",
            createdAt: p.auditTrail?.createdAt || p.createdDate || new Date().toISOString().split('T')[0],
            lastModifiedBy: "senoussi.s.t@gmail.com",
            lastModifiedAt: new Date().toISOString(),
            revisionHistory
          }
        };
      }
      return p;
    }));

    setActivityLogs(prev => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        descriptionAr: `تم حفظ إصدار خلطة جديد: ${name}`,
        descriptionFr: `Version de mélange sauvegardée : ${name}`,
        descriptionEn: `Saved new mix version: ${name}`,
        type: "info"
      },
      ...prev
    ].slice(0, 30));
  };

  const handleRestoreVersion = (version: any) => {
    const clonedInputs = JSON.parse(JSON.stringify(version.inputs));
    setInputs(normalizeInputsToDreux(clonedInputs));
    
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          inputs: clonedInputs,
          results: version.results ? JSON.parse(JSON.stringify(version.results)) : undefined,
          materialSnapshots: version.materialSnapshots ? JSON.parse(JSON.stringify(version.materialSnapshots)) : p.materialSnapshots,
          mixId: version.mixId || p.mixId,
          materialIds: version.materialIds || p.materialIds,
        };
      }
      return p;
    }));

    setActivityLogs(prev => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        descriptionAr: `تم استعادة معايير وإعدادات خلطة من نسخة: ${version.name}`,
        descriptionFr: `Paramètres restaurés à partir de la version : ${version.name}`,
        descriptionEn: `Restored mix parameters from version: ${version.name}`,
        type: "warning"
      },
      ...prev
    ].slice(0, 30));
  };

  const handleDeleteVersion = (versionId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          mixVersions: (p.mixVersions || []).filter(v => v.id !== versionId)
        };
      }
      return p;
    }));
  };

  // Handler to reset all variables to lab standard dry C25 mix
  const handleReset = () => {
    setInputs({
      fck28: 25,
      concreteType: "NSC",
      controlClass: "normal",
      cementType: "CEM I (إسمنت بورتلاندي عادي خالي من الإضافات)",
      cementClassStrength: 42.5,
      dMax: 20,
      slump: 8,
      aggregateType: AggregateType.ROULE,
      aggregateQuality: AggregateQuality.STANDARD,
      hasPumping: false,
      sandRelativeDensity: 0,
      gravelRelativeDensity: 0,
      cementDensity: 0,
      airContent: 1.0,
      moistureSand: 0,
      moistureGravel: 0,
      sandAbsorption: 0,
      gravelAbsorption: 0,
      admixtures: [],
      dosageSuper: 0,
      dosageAir: 0.0,
      dosageRetarder: 0.0,
      dosageAccelerator: 0.0,
      dosageSilicaFume: 0.0,
      dosageFlyAsh: 0.0,
      dosageSlag: 0.0,
      sandType: "رمل متوسط (Medium Sand)",
      gravelType: "حصى 8/15",
      autoDensities: true,
      batchVolume: 1.0,
      selectedMethod: "dreux",
      exposureClass: "X0",
      durabilityLevel: "normal",
      carbonationLevel: "negligible",
      chloridesLevel: "none",
      sulfatesLevel: "none",
      internalUnitWeight: 1600,
      internalCoeffG: 0.50,
      internalCurveCoeff: 1.0,
      internalSandRatio: 0.35,
      packingFactor: 0.82,
      internalWcOverride: 0.45,
      priceCement: 20,
      priceSand: 2.5,
      priceGravel: 2.8,
      priceSuper: 150,
      priceAir: 110,
      priceRetarder: 95,
      priceAccelerator: 125,
      priceSilicaFume: 65,
      priceFlyAsh: 40,
      priceSlag: 30,
      priceLabor: 1200,
      priceWater: 2
    });
    setSelectedMaterialForInfo("رمل متوسط (Medium Sand)");
    setSaveName("");
    setSaveError("");
    setSaveSuccess("");
    setShowPlantDropdown(false);
    setShowProjectDropdown(false);
    setShowNotificationDropdown(false);
    setShowThemeDropdown(false);
    setTransitionState({
      active: false,
      messageAr: "",
      messageFr: "",
      messageEn: "",
      enabledCount: 0,
      disabledCount: 0
    });
    
    // Add real-time activity log tracing reset event (without database or permanent modifications)
    setActivityLogs(prev => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        descriptionAr: "🧹 تم تصفير المعطيات وإعادة ضبط متغيرات الحساب الجاري إلى الحالة الافتراضية",
        descriptionFr: "🧹 Nettoyage terminé : paramètres de calcul réinitialisés à l'état initial par défaut",
        descriptionEn: "🧹 Cleanup complete: Active calculation parameters successfully zeroed out to default baseline",
        type: "success"
      },
      ...prev
    ].slice(0, 30));

    // Register safe notification toast for visual confirmation
    setNotifications(prev => [
      {
        id: String(Date.now()),
        textAr: "تم إعادة تعيين بيانات الجلسة الحالية وتصفير الحساب.",
        textFr: "Données de la session active réinitialisées et vidées.",
        textEn: "Active session parameters successfully zeroed out and reset.",
        read: false
      },
      ...prev
    ]);
  };

  // Convert weights to volumes (Liters out of 1000L of total concrete)
  const chartSectors = useMemo(() => {
    const cVol = results.cementWeight / (inputs.cementDensity / 1000);
    const wVol = results.waterContentActual;
    const sVol = results.sandWeightDry / ((inputs.sandRelativeDensity > 10 ? inputs.sandRelativeDensity : inputs.sandRelativeDensity * 1000) / 1000);
    const gVol = results.gravelWeightDry / ((inputs.gravelRelativeDensity > 10 ? inputs.gravelRelativeDensity : inputs.gravelRelativeDensity * 1000) / 1000);
    const aVol = results.admixtureWeights.reduce((s, a) => s + a.weight, 0) / 1.1; // estimate chemistry density as 1.1 kg/L
    const airVol = 10 * inputs.airContent;

    const totalVol = cVol + wVol + sVol + gVol + aVol + airVol;

    return [
      { name: "حصى خشن رطب", size: gVol, color: "#475569" }, // slate-600
      { name: "رمل سيليسي ناعم", size: sVol, color: "#D97706" }, // amber-600 (highly contrasting)
      { name: "عجينة إسمنتية ربط", size: cVol, color: "#78716C" }, // stone-500
      { name: "مياه الخلط الصافية", size: wVol, color: "#2563EB" }, // blue-600 (very vibrant)
      { name: "إضافات كيميائية", size: aVol, color: "#059669" }, // emerald-600
      { name: "فراغات الهواء المحبوس", size: airVol, color: "#E11D48" } // rose-600
    ].map(sector => ({
      ...sector,
      percent: totalVol > 0 ? (sector.size / totalVol) * 100 : 0
    }));
  }, [results, inputs]);

  // Recharts components configuration mapping
  const pieChartData = useMemo(() => {
    return chartSectors.map(s => ({
      name: s.name,
      value: parseFloat(s.size.toFixed(1)),
      percent: parseFloat(s.percent.toFixed(1)),
      color: s.color
    }));
  }, [chartSectors]);

  // Cost data calculation for the mix summary
  const costComparisonData = useMemo(() => {
    if (!results.mixQuantitySummary) return [];
    return results.mixQuantitySummary.map(item => ({
      name: item.methodName,
      cost: Math.round(convertCurrency(item.cost)),
      cement: Math.round(item.cement)
    }));
  }, [results, currency]);

  // Compliance summary percentage
  const complianceStats = useMemo(() => {
    const list = results.standardsCompliance || [];
    if (list.length === 0) return 100;
    const compliant = list.filter(item => item.status === "compliant").length;
    return Math.round((compliant / list.length) * 100);
  }, [results]);

  const activeResolvedMats = useMemo(() => {
    return resolveMaterials(inputs, activeProject?.materialSnapshots, materialsDatabase);
  }, [inputs, activeProject?.materialSnapshots, materialsDatabase]);

  const mixQualityScoreVal = useMemo(() => {
    let score = 50;
    const wcRatio = results.wcRatioAdjusted || 0.45;
    const controlClass = inputs.controlClass;
    const aggregateQuality = inputs.aggregateQuality;
    const admixturesCount = results.admixtureWeights?.length || 0;
    const hasPumping = inputs.hasPumping;
    const exposureClass = inputs.exposureClass || "X0";
    const sandAbsorption = activeResolvedMats.sand?.absorption ?? 0;
    const gravelAbsorption = activeResolvedMats.gravel?.absorption ?? 0;
    const sandFineness = activeResolvedMats.sand?.finenessModulus ?? 2.6;
    const admixtureRatio = inputs.dosageSuper || 0;
    const codeCompliance = results.standardsCompliance?.every(item => item.status === "compliant") ?? true;
    const finalDensity = results.totalFreshDensity || 2400;

    // 1. W/C Ratio (max 15 pt)
    if (wcRatio >= 0.40 && wcRatio <= 0.48) {
      score += 15;
    } else if (wcRatio > 0.48 && wcRatio <= 0.55) {
      score += 8;
    } else {
      score -= 5;
    }

    // 2. Compressive strength limits (max 10 pt)
    if (inputs.fck28 >= 40 && controlClass === "high") {
      score += 10;
    } else if (inputs.fck28 >= 25) {
      score += 6;
    } else {
      score += 2;
    }

    // 3. Exposure class compatibility (max 10 pt)
    const isAggressiveExp = ["XD1", "XD2", "XD3", "XS1", "XS2", "XS3", "XA1", "XA2", "XA3"].includes(exposureClass);
    if (isAggressiveExp && wcRatio <= 0.45) {
      score += 10;
    } else if (!isAggressiveExp) {
      score += 8;
    } else {
      score -= 3;
    }

    // 4. Aggregate quality (max 10 pt)
    if (aggregateQuality === "excellent") {
      score += 10;
    } else if (aggregateQuality === "standard") {
      score += 6;
    } else {
      score -= 4;
    }

    // 5. Sand Absorption (max 8 pt)
    if (sandAbsorption <= 1.2) {
      score += 8;
    } else if (sandAbsorption <= 2.2) {
      score += 5;
    } else {
      score += 1;
    }

    // 6. Gravel Absorption (max 7 pt)
    if (gravelAbsorption <= 0.8) {
      score += 7;
    } else if (gravelAbsorption <= 1.5) {
      score += 4;
    } else {
      score += 0;
    }

    // 7. Sand Fineness Modulus (max 10 pt)
    if (sandFineness >= 2.4 && sandFineness <= 2.9) {
      score += 10;
    } else {
      score += 5;
    }

    // 8. Admixture Optimization (max 10 pt)
    if (admixturesCount > 0 && admixtureRatio >= 0.8 && admixtureRatio <= 2.0) {
      score += 10;
    } else if (admixturesCount > 0) {
      score += 7;
    } else {
      score += 2;
    }

    // 9. Code Compliance (max 10 pt)
    if (codeCompliance) {
      score += 10;
    } else {
      score += 2;
    }

    // 10. Density (max 10 pt)
    if (finalDensity >= 2380) {
      score += 10;
    } else if (finalDensity >= 2300) {
      score += 7;
    } else {
      score += 3;
    }

    return Math.max(10, Math.min(100, score));
  }, [results, inputs, activeResolvedMats]);

  // Batch materials summation helpers
  const totalBatchWeight = useMemo(() => {
    const vol = inputs.batchVolume || 1.0;
    const waterToAdd = results.waterWeightWet !== undefined ? results.waterWeightWet : results.waterContentActual;
    return Math.round(
      (results.cementWeight + 
       waterToAdd + 
       results.sandWeightWet + 
       results.gravelWeightWet + 
       results.admixtureWeights.reduce((s, a) => s + a.weight, 0)) * vol
    );
  }, [results, inputs]);

  // Comprehensive Cost Analysis & Calculations
  const costBreakdown = useMemo(() => {
    const vol = inputs.batchVolume || 1.0;
    const costBasis = inputs.costBasis || "wet";
    
    const cementWeight = results.cementWeight * vol;
    const sandWeight = (costBasis === "wet" ? results.sandWeightWet : results.sandWeightDry) * vol;
    const gravelWeight = (costBasis === "wet" ? results.gravelWeightWet : results.gravelWeightDry) * vol;
    const waterVolume = (results.waterWeightWet !== undefined ? results.waterWeightWet : results.waterContentActual) * vol; // in Liters
    
    // Mineral additions weights
    const silicaWeight = inputs.dosageSilicaFume > 0 ? (results.cementWeight * (inputs.dosageSilicaFume / 100)) * vol : 0;
    const flyAshWeight = inputs.dosageFlyAsh > 0 ? (results.cementWeight * (inputs.dosageFlyAsh / 100)) * vol : 0;
    const slagWeight = inputs.dosageSlag > 0 ? (results.cementWeight * (inputs.dosageSlag / 100)) * vol : 0;
    
    // Chemical admixtures weights
    const chemicalAdmixtures = results.admixtureWeights || [];
    const chemWeight = chemicalAdmixtures.reduce((sum, adm) => sum + adm.weight * vol, 0);
    
    const additionsWeight = silicaWeight + flyAshWeight + slagWeight + chemWeight;

    // Costs (in DZD/DA)
    const cementCost = cementWeight * normalizedInputsForCalc.priceCement;
    const sandCost = sandWeight * normalizedInputsForCalc.priceSand;
    const gravelCost = gravelWeight * normalizedInputsForCalc.priceGravel;
    const waterCost = waterVolume * normalizedInputsForCalc.priceWater;

    const silicaCost = silicaWeight * normalizedInputsForCalc.priceSilicaFume;
    const flyAshCost = flyAshWeight * normalizedInputsForCalc.priceFlyAsh;
    const slagCost = slagWeight * normalizedInputsForCalc.priceSlag;
    const chemCost = chemicalAdmixtures.reduce((sum, adm) => {
      const priceKey = `price${adm.admixtureId.charAt(0).toUpperCase() + adm.admixtureId.slice(1)}`;
      const pricePerKg = normalizedInputsForCalc[priceKey as keyof typeof normalizedInputsForCalc] || 0;
      return sum + (adm.weight * vol * pricePerKg);
    }, 0);

    const additionsCost = silicaCost + flyAshCost + slagCost + chemCost;
    const laborCost = normalizedInputsForCalc.priceLabor * vol;
    const totalMaterialCost = cementCost + sandCost + gravelCost + waterCost + additionsCost;
    const grandTotalCost = totalMaterialCost + laborCost;

    // Averages/Prices
    const avgAdditionsUnitPrice = additionsWeight > 0 ? additionsCost / additionsWeight : 0;

    // Percentages of total material cost
    const cementPercent = totalMaterialCost > 0 ? (cementCost / totalMaterialCost) * 100 : 0;
    const sandPercent = totalMaterialCost > 0 ? (sandCost / totalMaterialCost) * 100 : 0;
    const gravelPercent = totalMaterialCost > 0 ? (gravelCost / totalMaterialCost) * 100 : 0;
    const waterPercent = totalMaterialCost > 0 ? (waterCost / totalMaterialCost) * 100 : 0;
    const additionsPercent = totalMaterialCost > 0 ? (additionsCost / totalMaterialCost) * 100 : 0;

    // Most expensive / Cheapest item (of strictly used items where cost > 0)
    const activeMaterials = [
      { name: "الإسمنت", cost: cementCost, color: "#3B82F6", arName: "الإسمنت", frName: "Ciment", enName: "Cement" },
      { name: "الرمل", cost: sandCost, color: "#F59E0B", arName: "الرمل", frName: "Sable", enName: "Sand" },
      { name: "الحصى", cost: gravelCost, color: "#EF4444", arName: "الحصى", frName: "Gravier", enName: "Gravel" },
      { name: "الماء", cost: waterCost, color: "#06B6D4", arName: "الماء", frName: "Eau", enName: "Water" },
      { name: "الإضافات", cost: additionsCost, color: "#A855F7", arName: "الإضافات", frName: "Adjuvants", enName: "Admixtures" }
    ].filter(item => item.cost > 0);

    let mostExpensive = { name: "لا يوجد", cost: 0, color: "", arName: "لا يوجد", frName: "Aucun", enName: "None" };
    let cheapest = { name: "لا يوجد", cost: Infinity, color: "", arName: "لا يوجد", frName: "Aucun", enName: "None" };

    if (activeMaterials.length > 0) {
      mostExpensive = activeMaterials.reduce((max, item) => item.cost > max.cost ? item : max, activeMaterials[0]);
      cheapest = activeMaterials.reduce((min, item) => item.cost < min.cost ? item : min, activeMaterials[0]);
    }

    return {
      cementWeight,
      sandWeight,
      gravelWeight,
      waterVolume,
      silicaWeight,
      flyAshWeight,
      slagWeight,
      additionsWeight,
      cementCost,
      sandCost,
      gravelCost,
      waterCost,
      silicaCost,
      flyAshCost,
      slagCost,
      chemCost,
      additionsCost,
      laborCost,
      totalMaterialCost,
      grandTotalCost,
      avgAdditionsUnitPrice,
      percentages: {
        cement: cementPercent,
        sand: sandPercent,
        gravel: gravelPercent,
        water: waterPercent,
        additions: additionsPercent
      },
      mostExpensive,
      cheapest: cheapest.cost === Infinity ? { name: "لا يوجد", cost: 0, color: "", arName: "لا يوجد", frName: "Aucun", enName: "None" } : cheapest
    };
  }, [results, inputs, normalizedInputsForCalc]);

  // Dynamic W/C safety level
  const wcRatioProgress = Math.min(100, Math.max(0, ((results.wcRatioAdjusted - 0.25) / 0.5) * 100));

  // Dynamic workability indicator text
  const slumpIndicator = useMemo(() => {
    const val = inputs.slump;
    if (val <= 2) {
      return {
        text: localizedLabel(
          "قوام صلب جداً (Dry / No slump) لمصانع البلاط",
          "Consistance très ferme (Sec / Sans affaissement) pour pavés",
          "Very stiff consistency (Dry / No slump) for pavers/tiles"
        ),
        color: "text-rose-450",
        bg: "bg-rose-500/10"
      };
    }
    if (val <= 5) {
      return {
        text: localizedLabel(
          "قوام لدن بلاستيكي معتدل (Semi-Dry) للمدارج والساحات",
          "Consistance ferme (Semi-sec) pour pistes et dalles",
          "Semi-Dry consistency (Stiff plastic) for pavements/slabs"
        ),
        color: "text-amber-500",
        bg: "bg-amber-500/10"
      };
    }
    if (val <= 9) {
      return {
        text: localizedLabel(
          "قوام لدن انسيابي عياري متناسق (Plastic) للهياكل العادية",
          "Consistance plastique (Standard) pour structures ordinaires",
          "Standard plastic consistency (Plastic) for ordinary structures"
        ),
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
      };
    }
    if (val <= 15) {
      return {
        text: localizedLabel(
          "قوام شديد السيولة انسيابي للمضخات (Fluid) للأعمدة الكثيفة",
          "Consistance très fluide (Fluide) pour béton pompable",
          "Fluid consistency (Highly pumpable) for congested columns"
        ),
        color: "text-blue-500",
        bg: "bg-blue-500/10"
      };
    }
    return {
      text: localizedLabel(
        "قوام سائل ذاتي الرص (Flowing Concrete) للأساسات والصب الحرج",
        "Béton autoplaçant (BAP) pour fondations complexes",
        "Self-consolidating concrete (Flowing) for foundations/critical pours"
      ),
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    };
  }, [inputs.slump, language]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B1120] text-slate-400 p-8 text-center font-sans space-y-4" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="font-bold text-slate-250">
          {localizedLabel(
            "SNO Engineering - جاري التحقق من الهوية والأدوات الهندسية...",
            "SNO Engineering - Vérification de l'identité et des outils...",
            "SNO Engineering - Verifying identity & engineering modules..."
          )}
        </span>
        <span className="text-xs text-slate-500">
          {localizedLabel(
            "يرجى الانتظار لتجهيز الواجهات وتأمين بياناتك الهندسية",
            "Veuillez patienter pendant la préparation des interfaces...",
            "Please wait while we set up the workspace and secure your engineering data..."
          )}
        </span>
      </div>
    );
  }

  if (viewMode === "landing") {
    return (
      <LandingPage 
        onStartProject={() => setViewMode("workspace")}
        themeMode={themeMode}
        themeSetting={themeSetting}
        setThemeSetting={setThemeSetting}
      />
    );
  }

  const isEmailVerified = user ? (
    user.emailVerified || 
    user.email === "engineer.demo@sno-engineering.com" ||
    user.providerData.some((p: any) => p.providerId === "google.com")
  ) : false;

  // Strictly enforce that the workspace can only be used if logged in with email AND verified AND activated by the administrator
  if (viewMode === "workspace" && (!user || !user.email || !isEmailVerified || isActivated === false)) {
    return (
      <LoginGate 
        onLogin={handleGoogleSignIn}
        onBack={() => setViewMode("landing")}
        themeMode={themeMode}
        user={user}
        setUser={setUser}
        isActivated={isActivated}
        activationLoading={activationLoading}
      />
    );
  }

  return (
    <div 
      className={`min-h-screen ${themeMode === "dark" ? "dark bg-[#0B1120] text-slate-200" : "bg-[#F1F5F9] text-slate-900"} font-sans transition-colors duration-200 select-none pb-12`} 
      id="main-layout-root" 
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B1120] text-slate-400 p-8 text-center font-sans space-y-4 animate-fade-in" dir={language === "ar" ? "rtl" : "ltr"}>
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <span className="font-bold text-slate-200">SNO Engineering - جاري تحميل الأدوات الهندسية...</span>
          <span className="text-xs text-slate-500">يرجى الانتظار لتجهيز الواجهات والرسومات والتحاليل المعملية</span>
        </div>
      }>
      
      {/* SMART TRANSITION NOTIFICATION OVERLAY */}
      <AnimatePresence>
        {transitionState.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-20 right-4 left-4 md:right-6 md:left-auto md:w-96 bg-slate-900 border border-slate-700 text-white rounded-2xl p-4.5 shadow-2xl z-50 overflow-hidden text-right leading-relaxed font-sans"
            style={{ direction: "rtl" }}
          >
            {/* Glowing top line */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl shrink-0 mt-0.5 border border-blue-500/20 text-blue-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    <span>تم الانتقال الذكي للمنهجية!</span>
                  </h3>
                  <button 
                    onClick={() => setTransitionState(prev => ({ ...prev, show: false }))}
                    className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-1">
                  تم تبديل نظام إدخال البيانات تلقائياً للتكيّف مع معايير وحسابات الطريقة المستهدفة:
                </p>

                {/* Transition Flow indicators */}
                <div className="flex items-center gap-2 justify-center py-2 text-xs font-black">
                  <span className="bg-slate-850 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-750 font-mono">
                    {METHOD_CONFIGS[transitionState.from]?.name || transitionState.from}
                  </span>
                  <span className="text-blue-400 animate-pulse font-mono">←</span>
                  <span className="bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/30 font-mono">
                    {METHOD_CONFIGS[transitionState.to]?.name || transitionState.to}
                  </span>
                </div>

                {/* Counts dynamic feedback */}
                <div className="border-t border-slate-850 pt-2.5 mt-1 space-y-1 text-[10px] text-slate-400 font-sans">
                  {transitionState.enabledCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">🟢 تم تنشيط وتعديل:</span>
                      <strong className="font-mono text-slate-200">{transitionState.enabledCount} حقول مخصصة جديدة</strong>
                    </div>
                  )}
                  {transitionState.disabledCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-amber-500 font-bold">🟡 تم تجميد وتعطيل:</span>
                      <strong className="font-mono text-slate-200">{transitionState.disabledCount} حقول غير مستخدمة</strong>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-500 leading-normal pt-1 flex items-center gap-1 justify-end">
                    <span>* تم حجب الحقول المعطلة من حساب التدوير والهضم والذاكرة السحابية</span>
                    <Info className="w-3 h-3 text-slate-500 shrink-0" />
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR & PLATFORM NAVIGATION GATEWAY */}
      <header className={`border-b font-sans sticky top-0 z-40 shadow-2xl print:hidden select-none transition-colors duration-200 ${
        themeMode === "dark" 
          ? "bg-[#0B1120] border-slate-800 text-white" 
          : "bg-white border-slate-200 text-slate-800 shadow-md"
      }`} id="concrete.ai-premium-topbar">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            
            {/* BRAND LOGO CONCRETE.AI FEEL */}
            <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setViewMode("landing")}>
              <SnoLabLogo themeMode={themeMode} />
            </div>

            {/* SPACER */}
            <div className="flex-grow"></div>

            {/* CONTROLS AREA: Language toggle, Notifications Bell, Settings Cog & Profile */}
            <div className="flex items-center gap-3 shrink-0">
              


              {/* NOTIFICATIONS BELL */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotificationDropdown(!showNotificationDropdown);
                    setShowPlantDropdown(false);
                    setShowProjectDropdown(false);
                  }}
                  className={`p-2 rounded-xl border cursor-pointer relative transition-all duration-200 ${
                    themeMode === "dark"
                      ? "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                  title="الرسائل والتنبيهات الهندسية الفعالة"
                >
                  <Bell size={14} />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 h-4 w-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                {showNotificationDropdown && (
                  <div className={`absolute left-0 top-10 mt-1 w-80 rounded-2xl shadow-2xl py-2 z-55 text-right animate-fade-in animate-duration-150 transition-colors duration-200 ${
                    themeMode === "dark"
                      ? "bg-slate-950 border border-slate-800"
                      : "bg-white border border-slate-200 shadow-xl"
                  }`}>
                    <div className={`px-3 py-2 border-b flex items-center justify-between mb-2 transition-colors duration-200 ${
                      themeMode === "dark" ? "border-slate-850" : "border-slate-100"
                    }`}>
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        }}
                        className="text-[9.5px] font-bold text-blue-500 hover:underline cursor-pointer focus:outline-none"
                      >
                        {language === "ar" ? "قراءة الكل" : language === "fr" ? "Marquer tout lu" : "Read all"}
                      </button>
                      <span className={`text-[11px] font-black transition-colors ${themeMode === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                        {language === "ar" ? "رسائل تنبيه السيستم" : language === "fr" ? "Alertes & Messages" : "Alerts & Notifications"}
                      </span>
                    </div>
                    
                    <div className={`max-h-64 overflow-y-auto divide-y px-2 space-y-1 transition-colors ${
                      themeMode === "dark" ? "divide-slate-850/60" : "divide-slate-100"
                    }`}>
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-2 rounded-lg text-right transition-all ${notif.read ? "bg-transparent opacity-60" : "bg-blue-500/10 border-r-2 border-blue-500"}`}
                        >
                          <p className={`text-[10px] leading-relaxed font-sans transition-colors ${
                            themeMode === "dark" ? "text-slate-200" : "text-slate-700 font-semibold"
                          }`}>
                            {language === "ar" ? notif.textAr : language === "fr" ? notif.textFr : notif.textEn}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div className={`p-2 border-t mt-2 text-center transition-colors ${
                      themeMode === "dark" ? "border-slate-850" : "border-slate-100"
                    }`}>
                      <button 
                        onClick={() => setShowNotificationDropdown(false)}
                        className={`text-[10px] font-bold transition-colors ${themeMode === "dark" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        {language === "ar" ? "إغلاق التنبيهات" : language === "fr" ? "Fermer" : "Close Panel"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* COG SETTINGS SHORTCUT */}
              <button
                onClick={() => setActiveSidebarTab("settings")}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  activeSidebarTab === "settings"
                    ? "bg-blue-600 text-white border-blue-650"
                    : themeMode === "dark"
                      ? "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
                title={language === "ar" ? "إعدادات المنصة" : "System Settings"}
              >
                <Settings size={14} className={activeSidebarTab === "settings" ? "animate-spin-slow" : ""} />
              </button>

              <div className={`w-px h-6 hidden sm:block ${themeMode === "dark" ? "bg-slate-800" : "bg-slate-200"}`}></div>

              {/* USER PROFILE INFO card */}
              <div className="flex items-center gap-2 shrink-0">
                {authLoading ? (
                  <div className="text-[10px] text-slate-500 py-1 font-mono animate-pulse">
                    LOADING...
                  </div>
                ) : user ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden lg:flex flex-col text-right">
                      <span className={`text-[10.5px] font-extrabold leading-tight ${themeMode === "dark" ? "text-blue-200" : "text-slate-800"}`}>
                        {user.displayName || "مهندس معتمد"}
                      </span>
                      <button 
                        onClick={() => signOut(auth)}
                        className={`text-[9px] text-red-500 hover:text-red-600 text-right font-bold transition hover:underline cursor-pointer`}
                      >
                        {language === "ar" ? "خروج" : "Sign Out"}
                      </button>
                    </div>
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="w-7 h-7 rounded-full border border-blue-500/20 select-none shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black select-none uppercase shadow-md">
                        {user.displayName?.charAt(0) || "M"}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    className="text-[10.5px] bg-blue-600 hover:bg-blue-500 hover:scale-102 active:scale-98 text-white px-3 py-1.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-1 shrink-0 cursor-pointer"
                    title="تسجيل الدخول الآمن لحساب Google"
                  >
                    <Lock size={12} />
                    <span>{language === "ar" ? "دخول" : "Login"}</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* SUBHEADER QUICK ACTION TOOLBAR (PRESETS, QUICK OPTIMIZE, RESET CMD) */}
        <div className={`px-4 md:px-6 py-2 border-t transition-colors duration-200 ${
          themeMode === "dark" 
            ? "bg-slate-900 border-slate-800/80 text-white" 
            : "bg-slate-50 border-slate-200 text-slate-700"
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            
            {/* Left part: active crumb details about recipe */}
            <div className={`flex items-center gap-2 text-[10px] font-mono transition-colors duration-200 ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              <span className={`px-2 py-0.5 rounded font-black font-sans transition-colors duration-200 ${
                themeMode === "dark" ? "bg-slate-850 text-emerald-400" : "bg-emerald-50 text-emerald-700"
              }`}>
                {language === "ar" ? "الوجبة النشطة:" : language === "fr" ? "Recette active:" : "Active Recipe:"} C{inputs.fck28} MPa
              </span>
              <span>•</span>
              <span className={themeMode === "dark" ? "text-slate-400" : "text-slate-500"}>{inputs.selectedMethod?.toUpperCase()} METHOD</span>
              <span>•</span>
              <span className="truncate max-w-[200px] hidden lg:inline">{language === "ar" ? `العميل: ${currentClient}` : `Client: ${currentClient}`}</span>
            </div>

            {/* Right part: core controls buttons belt */}
            <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">

              <button
                onClick={handleReset}
                className={`flex items-center gap-1 py-1 px-2.5 font-bold cursor-pointer rounded-lg border transition ${
                  themeMode === "dark" 
                    ? "bg-slate-950 hover:bg-slate-850 text-slate-350 hover:text-white border-slate-850" 
                    : "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200 shadow-sm"
                }`}
                title="تصفير وإعادة ضبط المتغيرات الأساسية"
              >
                <RefreshCw size={11} />
                <span>{language === "ar" ? "تصفير" : "Reset"}</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* PRIMARY CONTAINER BLOCK WITH SIDEBAR & ACTIVE AREA */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6" id="mixwizard-primary-container">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LATERAL SIDEBAR NAVIGATION (LEFT - occupies 1 to 3 columns depending on isSidebarCollapsed) */}
          <aside className={`${isSidebarCollapsed ? "lg:col-span-1" : "lg:col-span-3"} transition-all duration-300 space-y-4 print:hidden`} id="mixwizard-navigation-sidebar">
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl space-y-5 text-right transition-all">
              
              {/* BRAND LOGO CONCRETE.AI FEEL */}
              <div className="p-1 pb-4 border-b border-slate-200 dark:border-slate-800 text-right flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 overflow-hidden truncate">
                  <SnoLabLogo iconOnly={isSidebarCollapsed} themeMode={themeMode} className="h-7" />
                </div>
                
                <button 
                  onClick={toggleSidebarCollapsed}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-505 dark:text-slate-400 cursor-pointer shrink-0 transition-colors"
                  title={isSidebarCollapsed ? "توسيع شريط التنقل" : "طي شريط التنقل"}
                >
                  <Menu size={16} />
                </button>
              </div>

              {/* LIST OF SIDEBAR TAB ACTIONS CATEGORIZED LIKE CONCRETE.AI */}
              <nav className="flex flex-col gap-3 text-[11px] py-1" id="reorganized-engineering-sidebar">
                {isSidebarCollapsed ? (
                  /* COLLAPSED ICONIC RAIL SYSTEM WITH FLYOUT TOOLTIPS */
                  <div className="flex flex-col gap-3 items-center justify-center animate-fade-in" id="sidebar-collapsed-icons-rail">
                    {/* HOME */}
                    <button 
                      onClick={() => setViewMode("landing")}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "landing" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "الرئيسية" : "Home"}
                    >
                      <Home size={18} />
                    </button>

                    {/* WORKSPACE */}
                    <button 
                      onClick={() => { setViewMode("workspace"); setActiveSidebarTab("calculator"); }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "workspace" && ["calculator", "optimization"].includes(activeSidebarTab) ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "بيئة العمل" : "Workspace"}
                    >
                      <Sliders size={18} />
                    </button>

                    {/* MATERIALS */}
                    <button 
                      onClick={() => { setViewMode("workspace"); setActiveSidebarTab("materials_library"); }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "materials_library" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "مكتبة SnoLab للمواد" : "Materials Library"}
                    >
                      <Database size={18} />
                    </button>
                    {/* MATERIALS TESTING LAB */}
                    <button 
                      onClick={() => { setViewMode("workspace"); setActiveSidebarTab("materials_lab"); }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "materials_lab" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "مخبر خصائص المواد والتحقق المخبري" : "Materials Testing Lab"}
                    >
                      <FlaskConical size={18} />
                    </button>

                    {/* COST MANAGEMENT */}
                    <button 
                      onClick={() => { setViewMode("workspace"); setActiveSidebarTab("cost"); }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "cost" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "التكاليف" : "Cost Management"}
                    >
                      <Coins size={18} />
                    </button>

                    {/* REPORTS */}
                    <button 
                      onClick={() => { setViewMode("workspace"); setActiveSidebarTab("reports"); }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "workspace" && ["reports", "journal", "compliance_reports"].includes(activeSidebarTab) ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "التقارير" : "Reports"}
                    >
                      <FileText size={18} />
                    </button>

                    {/* KNOWLEDGE CENTER */}
                    <button 
                      onClick={() => { setViewMode("workspace"); setActiveSidebarTab("methodology"); }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "methodology" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "مركز المعرفة الهندسي" : "Engineering Knowledge Center"}
                    >
                      <BookOpen size={18} />
                    </button>

                    {/* AI ASSISTANT */}
                    <button 
                      onClick={() => { setViewMode("workspace"); setActiveSidebarTab("engineering_assistant"); }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "engineering_assistant" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "مساعد الذكاء الاصطناعي" : "AI Assistant"}
                    >
                      <Sparkles size={18} />
                    </button>

                    {/* PROJECTS */}
                    <button 
                      onClick={() => { setViewMode("workspace"); setActiveSidebarTab("saved_projects"); }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "workspace" && ["saved_projects", "cloud_storage"].includes(activeSidebarTab) ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "المشاريع" : "Projects"}
                    >
                      <Briefcase size={18} />
                    </button>

                    {/* SETTINGS */}
                    <button 
                      onClick={() => { setViewMode("workspace"); setActiveSidebarTab("settings"); }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "settings" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      title={language === "ar" ? "الإعدادات" : "Settings"}
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                ) : (
                  /* EXPANDED RICH TECHNICAL TREE VIEWS WITH COLLAPSIBLE ACCORDIONS */
                  <div className="flex flex-col gap-2.5 text-right animate-fade-in font-sans" id="sidebar-expanded-tree-view">
                    
                    {/* 1. HOME GROUP */}
                    <div className="border-b border-slate-105 dark:border-slate-800/40 pb-1.5 animate-fade-in">
                      <button 
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, home: !prev.home }))}
                        className="flex items-center justify-between w-full text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono select-none hover:text-slate-600"
                      >
                        <span className="flex items-center gap-1.5">
                          <Home size={11} />
                          <span>{language === "ar" ? "الرئيسية" : "HOME"}</span>
                        </span>
                        {collapsedGroups.home ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                      </button>
                      
                      {!collapsedGroups.home && (
                        <div className="flex flex-col pr-2 pl-1 space-y-0.5 mt-1 border-r border-slate-100 dark:border-slate-800/25 mr-1 animate-fade-in">
                          <button 
                            onClick={() => setViewMode("landing")}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "landing" ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-600 dark:text-slate-355 hover:text-blue-500 dark:hover:text-blue-400"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┘" : "└─"}
                            </span>
                            <span className="text-[11px] truncate">{language === "ar" ? "صفحة الانطلاق" : "Landing Page"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. WORKSPACE GROUP */}
                    <div className="border-b border-slate-105 dark:border-slate-800/40 pb-1.5 animate-fade-in">
                      <button 
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, workspace: !prev.workspace }))}
                        className="flex items-center justify-between w-full text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono select-none hover:text-slate-600"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sliders size={11} />
                          <span>{language === "ar" ? "بيئة العمل" : "WORKSPACE"}</span>
                        </span>
                        {collapsedGroups.workspace ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                      </button>

                      {!collapsedGroups.workspace && (
                        <div className="flex flex-col pr-2 pl-1 space-y-0.5 mt-1 border-r border-slate-100 dark:border-slate-800/25 mr-1 animate-fade-in">
                          <button 
                            onClick={() => { setViewMode("workspace"); setActiveSidebarTab("calculator"); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "calculator" ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-355 hover:text-blue-500"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┤" : "├─"}
                            </span>
                            <span className="text-[11px] truncate">{language === "ar" ? "معايرة وتصميم الخلطة" : "Mix Design"}</span>
                          </button>
                          <button 
                            onClick={() => { setViewMode("workspace"); setActiveSidebarTab("optimization"); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "optimization" ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-355 hover:text-blue-500"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┘" : "└─"}
                            </span>
                            <span className="text-[11px] truncate">{language === "ar" ? "تحسين الخلطة الخرسانية" : "Optimization"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. MATERIALS GROUP */}
                    <div className="border-b border-slate-105 dark:border-slate-800/40 pb-1.5 animate-fade-in">
                      <button 
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, materials: !prev.materials }))}
                        className="flex items-center justify-between w-full text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono select-none hover:text-slate-600"
                      >
                        <span className="flex items-center gap-1.5">
                          <Database size={11} />
                          <span>{language === "ar" ? "قاعدة المواد والبيتون" : language === "fr" ? "MATÉRIAUX" : "MATERIALS"}</span>
                        </span>
                        {collapsedGroups.materials ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                      </button>

                      {!collapsedGroups.materials && (
                        <div className="flex flex-col pr-2 pl-1 space-y-0.5 mt-1 border-r border-slate-100 dark:border-slate-800/25 mr-1 animate-fade-in">
                          <button 
                            onClick={() => { setViewMode("workspace"); setActiveSidebarTab("materials_library"); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "materials_library" ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-355 hover:text-blue-500"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┘" : "└─"}
                            </span>
                            <span className="text-[11px] truncate">{language === "ar" ? "مكتبة SnoLab" : language === "fr" ? "Bibliothèque SnoLab" : "SnoLab Library"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 5. COST MANAGEMENT GROUP */}
                    <div className="border-b border-slate-105 dark:border-slate-800/40 pb-1.5 animate-fade-in">
                      <button 
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, cost: !prev.cost }))}
                        className="flex items-center justify-between w-full text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono select-none hover:text-slate-600"
                      >
                        <span className="flex items-center gap-1.5">
                          <Coins size={11} />
                          <span>{language === "ar" ? "إدارة النفقات والتكاليف" : "COST MANAGEMENT"}</span>
                        </span>
                        {collapsedGroups.cost ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                      </button>

                      {!collapsedGroups.cost && (
                        <div className="flex flex-col pr-2 pl-1 space-y-0.5 mt-1 border-r border-slate-105 dark:border-slate-800/25 mr-1">
                          <button 
                            onClick={() => { setViewMode("workspace"); setActiveSidebarTab("cost"); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "cost" ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-355 hover:text-blue-550"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┘" : "└─"}
                            </span>
                            <span className="text-[11px] truncate">{language === "ar" ? "تحليل النفقات والميزانية" : language === "fr" ? "Analyse des Coûts" : "Cost Analysis"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 6. REPORTS GROUP */}
                    <div className="border-b border-slate-105 dark:border-slate-800/40 pb-1.5 animate-fade-in">
                      <button 
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, reports: !prev.reports }))}
                        className="flex items-center justify-between w-full text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono select-none hover:text-slate-600"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText size={11} />
                          <span>{language === "ar" ? "الوثائق والتقارير" : language === "fr" ? "RAPPORTS" : "REPORTS"}</span>
                        </span>
                        {collapsedGroups.reports ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                      </button>

                      {!collapsedGroups.reports && (
                        <div className="flex flex-col pr-2 pl-1 space-y-0.5 mt-1 border-r border-slate-105 dark:border-slate-800/25 mr-1">
                          <button 
                            onClick={() => { setViewMode("workspace"); setActiveSidebarTab("reports"); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "reports" ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-355 hover:text-blue-500"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┤" : "├─"}
                            </span>
                            <span className="text-[11px] truncate">{language === "ar" ? "تصدير وطباعة تقارير PDF" : language === "fr" ? "Rapports PDF" : "PDF Reports"}</span>
                          </button>
                          <button 
                            onClick={() => { setViewMode("workspace"); setActiveSidebarTab("materials_lab"); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "lab_validation" ? "bg-amber-500/10 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-355 hover:text-blue-500"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┤" : "├─"}
                            </span>
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 truncate">🔬 {language === "ar" ? "التحقق والتحكم المخبري" : language === "fr" ? "Validation de Laboratoire" : "Laboratory Performance Validation"}</span>
                          </button>
                          <button 
                            onClick={() => { setViewMode("workspace"); setActiveSidebarTab("journal"); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-55 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "journal" ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-355 hover:text-blue-500"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┤" : "├─"}
                            </span>
                            <span className="text-[11px] truncate">{language === "ar" ? "دفتر وكشوف الحسابات" : language === "fr" ? "Journal des Calculs" : "Calculation Journal"}</span>
                          </button>
                          <button 
                            onClick={() => { setViewMode("workspace"); setActiveSidebarTab("compliance_reports"); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-55 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "compliance_reports" ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-355 hover:text-blue-550"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┘" : "└─"}
                            </span>
                            <span className="text-[11px] truncate">{language === "ar" ? "تقارير المطابقة الدولية" : language === "fr" ? "Rapports de Conformité" : "Compliance Reports"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SECTION ADMIN: 🛡️ ADMIN PANEL */}
                    {(user?.email === "senoussi.s.t@gmail.com" || user?.email === "engineer.demo@sno-engineering.com" || user?.uid === "bypassed-demo-engineer-99") && (
                      <div className="space-y-1 mt-3 p-2 bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl border border-rose-500/10 mr-1 ml-1">
                        <div className="flex items-center gap-1.5 w-full text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest font-mono select-none">
                          <ShieldAlert size={12} className="text-rose-505 shrink-0" />
                          <span>{language === "ar" ? "تحكم المدير" : "Admin Panel"}</span>
                        </div>
                        <div className="flex flex-col">
                          <button 
                            onClick={() => {
                              setViewMode("workspace");
                              setActiveSidebarTab("admin");
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-rose-500/10 rounded transition-all w-full cursor-pointer ${activeSidebarTab === "admin" ? "text-rose-600 dark:text-rose-400 font-extrabold bg-rose-500/10" : "text-slate-600 dark:text-slate-355 hover:text-rose-500"}`}
                          >
                            <span className="text-[11px] font-black truncate">
                              🔑 {language === "ar" ? "تفعيل حسابات المستخدمين" : "Activate User Accounts"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 7. KNOWLEDGE CENTER GROUP */}
                    <div className="border-b border-slate-105 dark:border-slate-800/40 pb-1.5 animate-fade-in">
                      <button 
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, knowledge: !prev.knowledge }))}
                        className="flex items-center justify-between w-full text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono select-none hover:text-slate-600"
                      >
                        <span className="flex items-center gap-1.5">
                          <BookOpen size={11} />
                          <span>{language === "ar" ? "مركز المعرفة الهندسي" : "KNOWLEDGE CENTER"}</span>
                        </span>
                        {collapsedGroups.knowledge ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                      </button>

                      {!collapsedGroups.knowledge && (
                        <div className="flex flex-col pr-2 pl-1 space-y-0.5 mt-1 border-r border-slate-100 dark:border-slate-800/25 mr-1 animate-fade-in">
                          <button 
                            onClick={() => { setViewMode("workspace"); setActiveSidebarTab("methodology"); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${viewMode === "workspace" && activeSidebarTab === "methodology" ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-355 hover:text-blue-500"}`}
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┤" : "├─"}
                            </span>
                            <span className="text-[11px] truncate">🇫🇷 {language === "ar" ? "موسوعة دروكس-غوريس" : "Dreux-Gorisse Encyclopedia"}</span>
                          </button>
                          <button 
                            disabled
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded transition-all w-full cursor-not-allowed text-slate-400 opacity-60"
                          >
                            <span className="font-mono text-slate-300 dark:text-slate-700 select-none shrink-0">
                              {language === "ar" ? "─┘" : "└─"}
                            </span>
                            <span className="text-[11px] truncate">🇺🇸 ACI 211.1 Reference <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1 rounded">Soon</span></span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SECTION 8: 🎓 ACADEMIC LAB */}
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center gap-1.5 w-full text-[10px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-widest font-mono select-none">
                        <GraduationCap size={12} className="text-violet-505 shrink-0" />
                        <span>{t("materials_lab")}</span>
                      </div>
                      <div className="flex flex-col pl-2 pr-1.5 space-y-0.5">
                        <button 
                          onClick={() => {
                            setActiveSidebarTab("journal");
                          }}
                          className="flex items-center gap-1 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-355 hover:text-violet-550 rounded transition-all w-full cursor-pointer"
                        >
                          <span className="font-mono text-slate-300 dark:text-slate-655 select-none shrink-0">
                            {language === "ar" ? "─┤" : "├─"}
                          </span>
                          <span className="text-[11px] font-bold truncate">
                            {t("calculation_journal")}
                          </span>
                        </button>
                        <button 
                          onClick={() => {
                            setActiveSidebarTab("materials_lab");
                          }}
                          className={`flex items-center gap-1 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded transition-all w-full cursor-pointer ${activeSidebarTab === "academic_lab" ? "text-violet-600 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-950/20" : "text-slate-600 dark:text-slate-355 hover:text-violet-550"}`}
                        >
                          <span className="font-mono text-slate-300 dark:text-slate-655 select-none shrink-0">
                            {language === "ar" ? "─┤" : "├─"}
                          </span>
                          <span className="text-[11px] font-black truncate">
                            {language === "ar" ? "مختبر الهندسة المدنية الأكاديمي" : language === "fr" ? "Labo Académique Génie Civil" : "Civil Engineering Academic Lab"}
                          </span>
                        </button>
                        <button 
                          onClick={() => {
                            setActiveSidebarTab("journal");
                          }}
                          className="flex items-center gap-1 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-355 hover:text-violet-550 rounded transition-all w-full cursor-pointer"
                        >
                          <span className="font-mono text-slate-300 dark:text-slate-655 select-none shrink-0">
                            {language === "ar" ? "─┘" : "└─"}
                          </span>
                          <span className="text-[11px] font-bold truncate">
                            {t("student_mode")}
                          </span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </nav>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
                {!isSidebarCollapsed && <span className="animate-fade-in">{language === "ar" ? "ثيم المنصة:" : language === "fr" ? "Thème :" : "Theme:"}</span>}
                <button
                  onClick={() => setThemeSetting(prev => prev === "dark" ? "light" : prev === "light" ? "system" : "dark")}
                  className={`flex items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 ${isSidebarCollapsed ? "mx-auto" : ""}`}
                  title={
                    themeSetting === "dark" 
                      ? (language === "ar" ? "الوضع الداكن (نشط)" : language === "fr" ? "Mode sombre (actif)" : "Dark Mode (Active)") 
                      : themeSetting === "light" 
                      ? (language === "ar" ? "الوضع المضيء (نشط)" : language === "fr" ? "Mode clair (actif)" : "Light Mode (Active)") 
                      : (language === "ar" ? "وضع النظام المتكيف (نشط)" : language === "fr" ? "Mode système (actif)" : "System Adaptive Mode (Active)")
                  }
                >
                  {themeSetting === "dark" ? (
                    <Moon size={12} className="text-indigo-400" />
                  ) : themeSetting === "light" ? (
                    <Sun size={12} className="text-amber-500" />
                  ) : (
                    <Monitor size={12} className="text-emerald-500" />
                  )}
                  {!isSidebarCollapsed && (
                    <span className="text-[10px] font-bold">
                      {themeSetting === "dark" ? (language === "ar" ? "ليل" : language === "fr" ? "sombre" : "dark") : themeSetting === "light" ? (language === "ar" ? "نهار" : language === "fr" ? "clair" : "light") : (language === "ar" ? "نظام" : language === "fr" ? "système" : "system")}
                    </span>
                  )}
                </button>
              </div>

            </div>

            {/* CENTRAL ENGINEERING SESSION WORKFLOW STATE COCKPIT */}
            {!isSidebarCollapsed && (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-655 dark:text-slate-400 font-sans text-[11px] leading-relaxed space-y-3 shadow-lg animate-fade-in animate-rtl-flip">
                <span className="font-extrabold text-blue-600 dark:text-blue-400 block text-xs border-b border-slate-250 dark:border-slate-800 pb-1.5 text-right" dir={language === "ar" ? "rtl" : "ltr"}>
                  {language === "ar" ? "⚙️ الحالة الهندسية للخلطة:" : "⚙️ SnoLab Engineering State:"}
                </span>
                <div className="space-y-2">
                  {Object.entries(activeSession.validationState.engineeringState).map(([key, item]: [string, any]) => {
                    const stepName = key === "materials" ? (language === "ar" ? "المواد والخصائص" : "Materials & Props") :
                                     key === "granular" ? (language === "ar" ? "التدرج والتحسين الحبيبي" : "Granular Engine") :
                                     key === "validation" ? (language === "ar" ? "التحقق بوابات القبول" : "Validation Gates") :
                                     key === "mixDesign" ? (language === "ar" ? "صياغة وتصميم الخلطة" : "Mix Design Engine") :
                                     key === "trialMix" ? (language === "ar" ? "المحاكاة والخلطة التجريبية" : "Trial Mix Engine") :
                                     (language === "ar" ? "التقرير النهائي والشهادة" : "Final Report Engine");

                    let statusBg = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                    if (item.status === "Approved") statusBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20";
                    else if (item.status === "Completed") statusBg = "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20";
                    else if (item.status === "Needs Review") statusBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20";
                    else if (item.status === "In Progress") statusBg = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 animate-pulse";

                    // Map engine workflow step to sidebar tab
                    const navigateToTab = () => {
                      setViewMode("workspace");
                      if (key === "materials") setActiveSidebarTab("materials_library");
                      else if (key === "granular") setActiveSidebarTab("optimization");
                      else if (key === "validation") setActiveSidebarTab("materials_lab");
                      else if (key === "mixDesign") setActiveSidebarTab("calculator");
                      else if (key === "trialMix") setActiveSidebarTab("materials_lab");
                      else if (key === "report") setActiveSidebarTab("reports");
                    };

                    return (
                      <div 
                        key={key} 
                        onClick={navigateToTab}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all duration-150"
                        dir={language === "ar" ? "rtl" : "ltr"}
                      >
                        <span className="font-semibold">{stepName}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full ${statusBg}`}>
                          {language === "ar" ? 
                            (item.status === "Approved" ? "موافق عليه" : item.status === "Completed" ? "مكتمل" : item.status === "Needs Review" ? "يحتاج مراجعة" : item.status === "In Progress" ? "قيد العمل" : "لم يبدأ") : 
                            item.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUICK STATS FOR EASY MONITORING */}
            {!isSidebarCollapsed && (
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-605 dark:text-slate-400 font-sans text-[11px] leading-relaxed space-y-2.5 shadow-lg animate-fade-in animate-rtl-flip">
                <span className="font-extrabold text-blue-600 block text-xs border-b border-slate-200 dark:border-slate-800 pb-1.5 text-right" dir={language === "ar" ? "rtl" : "ltr"}>
                  {language === "ar" ? "معايرة الفحص السريع ومستوى الضبط:" : language === "fr" ? "Étalonnage rapide & niveau d'ajustement :" : "Quick Calibration & Control Level:"}
                </span>
                <div className="flex justify-between" dir={language === "ar" ? "rtl" : "ltr"}>
                  <span>{language === "ar" ? "مياه الخلط الفعلية:" : language === "fr" ? "Eau de gâchée réelle :" : "Actual Mixing Water:"}</span> 
                  <span className="font-mono text-slate-900 dark:text-white font-bold">
                    {`${Math.round(results.waterContentActual)} L/m³`}
                  </span>
                </div>
              </div>
            )}
          </aside>

          {/* MAIN WORKSPACE CONTENT PANEL (RIGHT - occupies 9 to 11 columns depending on isSidebarCollapsed) */}
          <main className={`${isSidebarCollapsed ? "lg:col-span-11" : "lg:col-span-9"} transition-all duration-300 space-y-6`} id="mixwizard-main-workspace">

            {/* WORKFLOW ENFORCEMENT & STEPPER HEADER */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl text-right flex flex-col gap-5 font-sans select-none" dir="rtl">
              <div className="flex justify-between items-center border-b border-indigo-50 dark:border-indigo-950/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
                    Core Engineering Workflow
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                    {t("calculator.workflowHeaderTitle")}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono font-bold bg-slate-50 dark:bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800/40">
                  STEP {activeStep} / 6
                </div>
              </div>

              {/* Horizontal steps deck */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { num: 1, label: t("workflow.step1.label"), desc: t("workflow.step1.desc"), icon: Folder, tab: "saved_projects" },
                  { num: 2, label: t("workflow.step2.label"), desc: t("workflow.step2.desc"), icon: Database, tab: "materials_library" },
                  { num: 3, label: t("workflow.step3.label"), desc: t("workflow.step3.desc"), icon: Calculator, tab: "calculator" },
                  { num: 4, label: t("workflow.step4.label"), desc: t("workflow.step4.desc"), icon: Sliders, tab: "optimization" },
                  { num: 5, label: t("workflow.step5.label"), desc: t("workflow.step5.desc"), icon: TrendingUp, tab: "cost" },
                  { num: 6, label: t("workflow.step6.label"), desc: t("workflow.step6.desc"), icon: FileText, tab: "reports" },
                ].map((st) => {
                  const IconComp = st.icon;
                  const isDone = st.num < activeStep;
                  const isActive = st.num === activeStep;

                  return (
                    <button
                      key={st.num}
                      type="button"
                      id={`workflow-step-btn-${st.num}`}
                      onClick={() => handleStepClick(st.num)}
                      className={`p-3 rounded-2xl border transition-all text-right flex flex-col gap-2 focus:outline-none relative overflow-hidden group cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-700 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/30 scale-[1.02]"
                          : isDone
                          ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/25 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                          isActive 
                            ? "bg-white text-blue-600" 
                            : isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {st.num}
                        </span>
                        <IconComp size={13} className={isActive ? "text-white animate-pulse" : isDone ? "text-emerald-500" : "text-slate-400"} />
                      </div>
                      <div className="mt-0.5">
                        <span className={`text-[11.5px] font-black block leading-none mb-0.5 ${isActive ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                          {st.label}
                        </span>
                        <span className={`text-[9px] font-medium block truncate ${isActive ? "text-blue-100" : "text-slate-400 dark:text-slate-500"}`}>
                          {st.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Engineering Data Flow Pipeline Visualizer */}
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 font-sans relative overflow-hidden mt-1">
                <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-br-3xl pointer-events-none"></div>
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Cpu size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {language === "ar" ? "منظومة تدفق ومعايرة البيانات الهندسية المؤتمتة" : language === "fr" ? "Pipeline Automatisé de Données d'Ingénierie" : "Automated Engineering Data Flow & Calibration Pipeline"}
                      </h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">
                        {language === "ar" ? "ربط فوري ومباشر لمكتبة المواد ومركز الغربلة بمحرك الحسابات الرئيسي SNO" : language === "fr" ? "Liaison directe de la base de matériaux et granulométrie au moteur de calcul" : "Direct telemetry linking materials library and sieve granulometry to the core calculation engine"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[9px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono uppercase animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {language === "ar" ? "البث المؤتمت: نشط" : language === "fr" ? "Pipeline: Actif" : "Pipeline: Live"}
                    </span>
                  </div>
                </div>

                {/* Pipeline Flowchart Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative z-10">
                  
                  {/* Column 1: Source A - Materials Library Link (4 Cols) */}
                  <div className="lg:col-span-4 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-4 flex flex-col gap-3 shadow-sm relative group hover:border-blue-500/45 dark:hover:border-blue-500/40 transition-all duration-300">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900/60">
                      <span className="text-[9.5px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-md font-mono">
                        {language === "ar" ? "المصدر الأول: مستودع المواد" : language === "fr" ? "Source A: Base Matériaux" : "Source A: Materials Repository"}
                      </span>
                      <Database size={13} className="text-blue-550 dark:text-blue-400" />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {/* Cement Material Telemetry */}
                      <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-100/80 dark:border-slate-800/40 text-right">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] text-slate-400 font-bold">
                            {inputs.selectedCementId ? `🟢 ID: ${inputs.selectedCementId.substring(0, 12)}...` : "⚠️ DEFAULT FALLBACK"}
                          </span>
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                            {language === "ar" ? "الأسمنت المعتمد" : language === "fr" ? "Ciment Sélectionné" : "Selected Cement"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono text-slate-500 mt-1 pt-1 border-t border-slate-100/40 dark:border-slate-800/20">
                          <div className="text-left">
                            <span className="text-slate-400">{language === "ar" ? "كثافة:" : "Density:"}</span> <strong className="text-slate-700 dark:text-slate-200">{normalizedInputsForCalc.cementDensity || inputs.cementDensity}</strong> kg/m³
                          </div>
                          <div>
                            <span className="text-slate-400">{language === "ar" ? "رتبة:" : "Class:"}</span> <strong className="text-slate-700 dark:text-slate-200">{normalizedInputsForCalc.cementClassStrength || inputs.cementClassStrength}</strong> MPa
                          </div>
                        </div>
                      </div>

                      {/* Sand & Gravel Density Telemetry */}
                      <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-100/80 dark:border-slate-800/40 text-right">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] text-slate-400 font-bold">
                            {inputs.selectedSandId ? `🟢 ID: ${inputs.selectedSandId.substring(0, 10)}...` : "⚠️ DEFAULT"}
                          </span>
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                            {language === "ar" ? "الركام الطبيعي والمكسر" : language === "fr" ? "Sable & Gravier" : "Sand & Gravel Specs"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono text-slate-500 mt-1 pt-1 border-t border-slate-100/40 dark:border-slate-800/20">
                          <div className="text-left">
                            <span className="text-slate-400">{language === "ar" ? "رمل:" : "Sand:"}</span> <strong className="text-slate-700 dark:text-slate-200">{normalizedInputsForCalc.sandRelativeDensity || inputs.sandRelativeDensity}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">{language === "ar" ? "حصى:" : "Gravel:"}</span> <strong className="text-slate-700 dark:text-slate-200">{normalizedInputsForCalc.gravelRelativeDensity || inputs.gravelRelativeDensity}</strong>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono text-slate-500 mt-1">
                          <div className="text-left">
                            <span className="text-slate-400">{language === "ar" ? "امتصاص رمل:" : "Sand Abs:"}</span> <strong className="text-slate-700 dark:text-slate-200">{normalizedInputsForCalc.sandAbsorption || inputs.sandAbsorption}%</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">{language === "ar" ? "امتصاص حصى:" : "Gravel Abs:"}</span> <strong className="text-slate-700 dark:text-slate-200">{normalizedInputsForCalc.gravelAbsorption || inputs.gravelAbsorption}%</strong>
                          </div>
                        </div>
                      </div>

                      {/* Chemical Admixtures */}
                      {inputs.selectedAdmixtureId && (
                        <div className="bg-amber-500/5 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-500/15 text-right">
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-bold text-amber-600 dark:text-amber-400">
                              {normalizedInputsForCalc.selectedAdmixtureWaterReduction ? `-%${normalizedInputsForCalc.selectedAdmixtureWaterReduction} Water` : "Linked"}
                            </span>
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-300">
                              🧪 {language === "ar" ? "المضافات الكيميائية الفعالة" : "Admixture telemetry"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Source B - Laboratory QC & Characterization (4 Cols) */}
                  <div className="lg:col-span-4 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-4 flex flex-col gap-3 shadow-sm relative group hover:border-indigo-500/45 dark:hover:border-indigo-500/40 transition-all duration-300">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900/60">
                      <span className="text-[9.5px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded-md font-mono">
                        {language === "ar" ? "المصدر الثاني: بيانات التحقق والتحكم المخبري" : language === "fr" ? "Source B: Contrôle & Vérification Labo" : "Source B: Laboratory QC & Verification"}
                      </span>
                      <FlaskConical size={13} className="text-indigo-500 dark:text-indigo-400" />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {/* QC Stream Info */}
                      <div className="bg-indigo-500/5 dark:bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/15 text-right flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-300 font-mono">
                            {inputs.finenessModulus ? `FM: ${inputs.finenessModulus}` : "FM: 2.65"}
                          </span>
                          <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-200">
                            {language === "ar" ? "خصائص وتوصيف المواد المخبرية" : "Material Lab Specifications"}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                          {language === "ar" ? "تُربط نتائج الفحوصات المخبرية (الكثافة، الامتصاص، النعومة، الغربلة، المكافئ الرملي) بالمواد وتُغذى تلقائياً لمحرك الحساب دون إقحامها كخطوة في مخطط العمليات." : "Material test data (density, absorption, fineness, granulometry, sand equivalent) feeds into the engine automatically without being a workflow step."}
                        </p>
                      </div>

                      {/* Blending Optimization Target */}
                      <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100/80 dark:border-slate-800/40 text-right flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                          {language === "ar" ? "الخصائص الحبيبية المستهدفة" : "Target Physical Properties"}
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-500">
                          <div>
                            <span className="text-slate-400">{language === "ar" ? "أقصى قطر Dmax:" : "Max aggregate Dmax:"}</span> <strong className="text-slate-700 dark:text-slate-200">{normalizedInputsForCalc.dMax || inputs.dMax} mm</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">{language === "ar" ? "نوع الركام:" : "Shape:"}</span> <strong className="text-slate-700 dark:text-slate-200">{inputs.aggregateType === "CONCASSE" ? (language === "ar" ? "مكسر" : "Crushed") : (language === "ar" ? "مدور" : "Rounded")}</strong>
                          </div>
                        </div>
                        <div className="text-[8.5px] font-bold text-blue-600 dark:text-blue-400 border-t border-slate-100/40 dark:border-slate-800/20 pt-1 mt-1 text-left">
                          {language === "ar" ? "← تغذية محرك الخلطات تلقائياً" : "← Auto-fed to calculation engine"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: The Brain - Mix Calculation Engine (4 Cols) */}
                  <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-[#1E293B] dark:from-slate-950 dark:to-slate-900 rounded-xl border border-blue-500/25 p-4 flex flex-col gap-3 shadow-md text-white">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-[9.5px] font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
                        {language === "ar" ? "محرك الحساب والتحسين SNO" : language === "fr" ? "Moteur de Calcul" : "SNO Core Mix Engine"}
                      </span>
                      <Settings size={13} className="text-emerald-400 animate-spin-slow" />
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Active Recipe Synthesis */}
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-right flex flex-col gap-1">
                        <span className="text-[8.5px] text-emerald-400 font-bold font-mono tracking-wide">
                          {language === "ar" ? "تخليق النسب الحجمية فائق الدقة" : "VOLUMETRIC SYNTHESIS ENGINES"}
                        </span>
                        <div className="text-[11px] font-black text-slate-100">
                          {activeStep === 1 && (language === "ar" ? "سجل المشاريع الهندسي" : "Project specifications processor")}
                          {activeStep === 2 && (language === "ar" ? "تصفية وفرز قاعدة الخامات والمواد" : "Materials DB live querying")}
                          {activeStep === 3 && (language === "ar" ? "صياغة وتحضير الخلطة الخرسانية" : "Mix Proportioning & Formulation Engine")}
                          {activeStep === 4 && (language === "ar" ? "معايرة الخلطة وضبط الخلطات التجريبية" : "Mix Calibration & Trial Batches")}
                          {activeStep === 5 && (language === "ar" ? "تحليل النفقات والميزانية والجدوى الكلفية" : "Expense & Budget Analysis Engine")}
                          {activeStep === 6 && (language === "ar" ? "توليد التقرير النهائي ووثيقة الاعتماد PDF" : "Certified PDF Compiler")}
                        </div>
                      </div>

                      {/* Outflowing Telemetry Result Snapshot */}
                      <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-right">
                        <div className="flex justify-between items-center text-[10.5px] font-black text-emerald-400 mb-1">
                          <span>{results?.cementWeightDry ? `${Math.round(results.cementWeightDry)} kg` : "Pending..."}</span>
                          <span>{language === "ar" ? "الأسمنت الفعلي الجاف" : "Cement Weight"}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10.5px] font-black text-indigo-400">
                          <span>{results?.sandWeightDry ? `${Math.round(results.sandWeightDry)} kg` : "Pending..."}</span>
                          <span>{language === "ar" ? "الرمل الفعلي الجاف" : "Sand Weight"}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10.5px] font-black text-slate-300 mt-1 pt-1 border-t border-slate-800">
                          <span>{results?.waterContentActual ? `${Math.round(results.waterContentActual)} L` : "Pending..."}</span>
                          <span>{language === "ar" ? "مياه الخلط الفعلية" : "Actual Mix Water"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Animated progress indicators representing flow */}
                <div className="mt-4 flex items-center justify-between text-[9px] font-black tracking-wider uppercase font-mono text-slate-400 dark:text-slate-500 select-none">
                  <span>{language === "ar" ? "تتبع سريان تدفق البيانات الهندسية" : "Process Flow Telemetry"}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold">{language === "ar" ? "المشروع والمواد" : "Setup & Materials"}</span>
                    <span className="w-4 h-[1px] bg-slate-300 dark:bg-slate-800"></span>
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">{language === "ar" ? "التحضير والمعايرة" : "Formulation & Calibration"}</span>
                    <span className="w-4 h-[1px] bg-slate-300 dark:bg-slate-800"></span>
                    <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold">{language === "ar" ? "النتائج والتقرير" : "Results & Report"}</span>
                  </div>
                  <span>{language === "ar" ? "اعتماد كودي متكامل 100%" : "SNO COMPLIANCE 100%"}</span>
                </div>
              </div>
            </div>

            {activeSidebarTab === "dashboard" && null}
            {aggregateValidation.isBlocked && [
              "calculator", "cost", "reports", "simulation", "sieve",
              "optimization", "journal", "academic_lab", "compliance_reports",
              "lab_validation", "plant"
            ].includes(activeSidebarTab) ? (
              <div className="bg-white dark:bg-[#0F172A] border-2 border-dashed border-rose-200 dark:border-rose-900/40 rounded-3xl p-8 shadow-xl text-center flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto my-12 animate-fade-in" dir="rtl">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center animate-bounce">
                  <ShieldAlert size={36} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
                    {language === "ar" ? "بوابة التحقق الهندسي: الركام غير مكتمل أو غير نشط" : "Engineering Gate: Aggregates Incomplete or Inactive"}
                  </h2>
                  <p className="text-sm text-slate-505 leading-relaxed font-sans max-w-lg">
                    {language === "ar" 
                      ? "لا يمكن المتابعة لخطوات الحساب أو المعايرة لأن الركام المطلوب (الرمل أو الحصى) غير متوفر في مستودع المواد أو لم يتم تنشيطه واعتماده بشكل كامل. يرجى تهيئة الركام أولاً في مستودع المواد وتنشيطه."
                      : "Cannot proceed to calculations or calibration because the required aggregate materials (Sand or Gravel) are not present in the repository, or have not been fully completed, activated, and validated. Please configure the aggregates first."}
                  </p>
                </div>

                <div className="w-full border-t border-b border-slate-150/60 dark:border-slate-800/60 py-4 my-2 text-right space-y-3" dir="rtl">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">
                    {language === "ar" ? "تفاصيل حالة الركام الهندسية" : "Aggregate Engineering Status Details"}
                  </h3>
                  
                  {/* Sand Status Card */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100/60 dark:border-slate-850">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🏖️</span>
                      <div>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                          {language === "ar" ? "الركام الناعم (الرمل)" : "Fine Aggregate (Sand)"}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {aggregateValidation.hasSand 
                            ? (language === "ar" ? "موجود في المستودع" : "Present in repository") 
                            : (language === "ar" ? "غير موجود في المستودع" : "Missing from repository")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {aggregateValidation.hasActiveSand ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider">
                          {language === "ar" ? "🟢 معتمد ونشط" : "Validated & Active"}
                        </span>
                      ) : aggregateValidation.hasSand ? (
                        <>
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-450 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider">
                            {language === "ar" ? "⚠️ مسودة / غير معتمد" : "Draft / Unvalidated"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSidebarTab("materials_library");
                              setTimeout(() => {
                                const sand = (materialsDatabase || []).find(m => m.id === inputs.selectedSandId) || (materialsDatabase || []).find(m => m.category === "رمال");
                                if (sand) {
                                  const triggerEdit = new CustomEvent("trigger-edit-material", { detail: { materialId: sand.id } });
                                  window.dispatchEvent(triggerEdit);
                                }
                              }, 100);
                            }}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            {language === "ar" ? "✏️ تعديل وتفعيل" : "Edit & Activate"}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider">
                            {language === "ar" ? "🔴 مفقود" : "Missing"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSidebarTab("materials_library");
                              setTimeout(() => {
                                const triggerAdd = new CustomEvent("trigger-add-material");
                                window.dispatchEvent(triggerAdd);
                              }, 100);
                            }}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            {language === "ar" ? "➕ إضافة جديد" : "Add New"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Gravel Status Card */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100/60 dark:border-slate-850">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🪨</span>
                      <div>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                          {language === "ar" ? "الركام الخشن (الحصى)" : "Coarse Aggregate (Gravel)"}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {aggregateValidation.hasGravel 
                            ? (language === "ar" ? "موجود في المستودع" : "Present in repository") 
                            : (language === "ar" ? "غير موجود في المستودع" : "Missing from repository")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {aggregateValidation.hasActiveGravel ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider">
                          {language === "ar" ? "🟢 معتمد ونشط" : "Validated & Active"}
                        </span>
                      ) : aggregateValidation.hasGravel ? (
                        <>
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-455 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider">
                            {language === "ar" ? "⚠️ مسودة / غير معتمد" : "Draft / Unvalidated"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSidebarTab("materials_library");
                              setTimeout(() => {
                                const gravel = (materialsDatabase || []).find(m => m.id === inputs.selectedGravelId) || (materialsDatabase || []).find(m => m.category === "حصى" || m.category === "ركام خفيف" || m.category === "ركام ثقيل");
                                if (gravel) {
                                  const triggerEdit = new CustomEvent("trigger-edit-material", { detail: { materialId: gravel.id } });
                                  window.dispatchEvent(triggerEdit);
                                }
                              }, 100);
                            }}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            {language === "ar" ? "✏️ تعديل وتفعيل" : "Edit & Activate"}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-455 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider">
                            {language === "ar" ? "🔴 مفقود" : "Missing"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSidebarTab("materials_library");
                              setTimeout(() => {
                                const triggerAdd = new CustomEvent("trigger-add-material");
                                window.dispatchEvent(triggerAdd);
                              }, 100);
                            }}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            {language === "ar" ? "➕ إضافة جديد" : "Add New"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSidebarTab("materials_library")}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {language === "ar" ? "📂 الانتقال إلى مستودع المواد والركام" : "Go to Material & Aggregate Repository"}
                </button>
              </div>
            ) : (
              <>
            {false && (
              <div className="space-y-6 animate-fade-in" id="mixwizard-dashboard-screen">
                {/* Central Calculation Validation Gate Panel */}
                <CalculationValidationGatePanel 
                  validation={validationGate} 
                  onNavigateToInputs={() => setActiveSidebarTab("calculator")} 
                  language={language}
                  setActiveSidebarTab={setActiveSidebarTab}
                  materialsDatabase={materialsDatabase}
                  inputs={inputs}
                />

                {/* 1. SaaS Dashboard Welcome Banner with Project Details */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-blue-600 via-indigo-600 to-slate-900 text-white p-6 md:p-8 shadow-xl animate-fade-in" id="dashboard-saas-hero">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="text-right w-full md:w-auto">
                      <div className="flex items-center gap-2 justify-end mb-2">
                        <span className="text-[10px] font-black tracking-widest text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                          {language === "ar" ? "نشط" : "ACTIVE"}
                        </span>
                        <span className="text-[10px] font-black tracking-widest text-blue-200 bg-white/10 px-2 py-0.5 rounded-full font-mono uppercase">
                          SNO PORTAL HUB
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black font-sans leading-tight text-right w-full block">
                        {language === "ar" ? "لوحة التحكم الرئيسية للمشروع" : "Central Project Workspace Hub"}
                      </h2>
                      <p className="text-sm text-blue-100/90 mt-1 max-w-2xl font-sans font-bold text-right w-full block">
                        {language === "ar" 
                          ? "مرحباً بك في المركز الاستشاري الهندسي المعتمد لتصميم ومعايرة الخلطات الخرسانية وإدارة المشاريع بشكل متكامل وبكفاءة عالية."
                          : "Welcome to the central certified engineering hub for concrete recipe design and integrated project management."}
                      </p>
                    </div>
                    {/* Left side actions */}
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setActiveSidebarTab("calculator")}
                        className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/10 transition-all select-none cursor-pointer shadow-lg"
                      >
                        {language === "ar" ? "بدأ تصميم خلطة ⚙" : "Start New Design ⚙"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    
                    {/* 1. Mix Design Card */}
                    <div 
                      onClick={() => setActiveSidebarTab("calculator")}
                      className="group cursor-pointer relative overflow-hidden bg-white dark:bg-[#1E293B] border border-slate-205/80 dark:border-slate-805 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-500 text-right flex flex-col justify-between"
                      id="card-portal-mix-design"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 dark:bg-blue-500/10 rounded-bl-3xl pointer-events-none transition-all group-hover:scale-150"></div>
                      <div>
                        {/* icon block */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-4">
                          <Sliders size={20} />
                        </div>
                        {/* title */}
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full font-mono uppercase">
                            {language === "ar" ? `مقاومة: ${inputs.fck28} MPa` : `fck: ${inputs.fck28}`}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white font-sans font-black">
                            {language === "ar" ? "معايرة وتصميم الخلطة" : "Mix Design"}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-sans">
                          {language === "ar" 
                            ? "تصميم وصياغة التركيبة الخرسانية وتحصين تدرج الركام بطرق درو-غوريس المتكاملة."
                            : "Formulate concrete recipes and evaluate sieve grading matching Dreux-Gorisse norms."}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-blue-600 dark:text-blue-400 font-bold">
                        <ChevronLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        <span>{language === "ar" ? "فتح المعايرة والتصميم ⚙" : "Open Workspace ⚙"}</span>
                      </div>
                    </div>

                    {/* 2. Optimization Card */}
                    <div 
                      onClick={() => setActiveSidebarTab("optimization")}
                      className="group cursor-pointer relative overflow-hidden bg-white dark:bg-[#1E293B] border border-slate-205/80 dark:border-slate-805 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500 text-right flex flex-col justify-between"
                      id="card-portal-optimization"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-bl-3xl pointer-events-none transition-all group-hover:scale-150"></div>
                      <div>
                        {/* icon block */}
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit mb-4">
                          <Sparkles size={20} />
                        </div>
                        {/* title */}
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono uppercase font-sans">
                            {language === "ar" ? "دقة كودية تلقائية" : "AI Optimal"}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white font-sans font-black">
                            {language === "ar" ? "تحسين الخلطة الخرسانية" : "Formula Optimization"}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-sans">
                          {language === "ar" 
                            ? "تحسين استهلاك الأسمنت البورتلاندي، توفير كلفة خلطة المواد، وتقليص البصمة الكربونية CO2."
                            : "Minimize Portland cement dosage and carbon emissions via automated volumetric algorithm."}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400 font-bold">
                        <ChevronLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        <span>{language === "ar" ? "تحسين الخلطة كودياً ✦" : "Run Optimization ✦"}</span>
                      </div>
                    </div>

                    {/* 3. Prediction Card */}
                    <div 
                      onClick={() => setActiveSidebarTab("forecasting")}
                      className="group cursor-pointer relative overflow-hidden bg-white dark:bg-[#1E293B] border border-slate-205/80 dark:border-slate-805 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-amber-500 text-right flex flex-col justify-between"
                      id="card-portal-prediction"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 dark:bg-amber-500/10 rounded-bl-3xl pointer-events-none transition-all group-hover:scale-150"></div>
                      <div>
                        {/* icon block */}
                        <div className="p-3 bg-amber-50 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 rounded-xl w-fit mb-4">
                          <Activity size={20} />
                        </div>
                        {/* title */}
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[9px] font-black text-amber-655 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono uppercase font-sans">
                            {language === "ar" ? `7 أيام: ${Math.round(inputs.fck28 * 0.7)} MPa` : `7-Day predict`}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white font-sans font-black">
                            {language === "ar" ? "خوارزمية التنبؤ الإنشائي" : "Prediction Model"}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-sans">
                          {language === "ar" 
                            ? "توقع حركية مقاومة الخرسانة (t)fck، منحنى تفاعل إماهة غرويات الأسمنت وتجنب حرارة التشققات."
                            : "Map strength maturation kinetics and simulate critical hydration thermal crack prevention."}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-amber-600 dark:text-amber-400 font-bold">
                        <ChevronLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        <span>{language === "ar" ? "نمذجة وتوقع السلوك 📈" : "Model Predictions 📈"}</span>
                      </div>
                    </div>

                    {/* 4. Materials Library Card */}
                    <div 
                      onClick={() => setActiveSidebarTab("materials_library")}
                      className="group cursor-pointer relative overflow-hidden bg-white dark:bg-[#1E293B] border border-slate-205/80 dark:border-slate-805 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-500 text-right flex flex-col justify-between"
                      id="card-portal-materials"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-bl-3xl pointer-events-none transition-all group-hover:scale-150"></div>
                      <div>
                        {/* icon block */}
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit mb-4">
                          <Database size={20} />
                        </div>
                        {/* title */}
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full font-mono uppercase font-sans font-bold">
                            D_max {inputs.dMax} mm
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white font-sans font-black">
                            {language === "ar" ? "مستودع وركام المحاجر" : "Materials Library"}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-sans">
                          {language === "ar" 
                            ? "إدارة بنك رمال وديان المحاجر ومعايرات الغربال، مصانع الأسمنت، والوظائف المضافة الفعالة."
                            : "Maintain quarry sand gradation registries, cement varieties, and chemical admixtures."}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-indigo-600 dark:text-indigo-400 font-bold">
                        <ChevronLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        <span>{language === "ar" ? "استشارة قاعدة البيانات 📁" : "View Database 📁"}</span>
                      </div>
                    </div>

                    {/* 5. Cost Analysis Card */}
                    <div 
                      onClick={() => setActiveSidebarTab("cost")}
                      className="group cursor-pointer relative overflow-hidden bg-white dark:bg-[#1E293B] border border-slate-205/80 dark:border-slate-805 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-rose-500 text-right flex flex-col justify-between"
                      id="card-portal-cost"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 dark:bg-rose-500/10 rounded-bl-3xl pointer-events-none transition-all group-hover:scale-150"></div>
                      <div>
                        {/* icon block */}
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl w-fit mb-4">
                          <Coins size={20} />
                        </div>
                        {/* title */}
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[9px] font-black text-rose-505 bg-rose-500/10 px-2 py-0.5 rounded-full font-mono uppercase font-sans font-bold">
                            {formatCurrency(costBreakdown.grandTotalCost)}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white font-sans font-black">
                            {language === "ar" ? "حساب وتحليل التكاليف" : "Cost Analysis"}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-sans">
                          {language === "ar" 
                            ? "تقدير الكلفة الاقتصادية التفصيلية للمتر المكعب الخرساني وجدوى نسب ومواد الخليط."
                            : "Calculate direct financial cost breakdown and volumetric yield of concrete recipes."}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-rose-600 dark:text-rose-400 font-bold">
                        <ChevronLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        <span>{language === "ar" ? "دفتر التكاليف والمالية 💸" : "Open Cost Ledger 💸"}</span>
                      </div>
                    </div>

                    {/* 6. Reports Center Card */}
                    <div 
                      onClick={() => setActiveSidebarTab("reports")}
                      className="group cursor-pointer relative overflow-hidden bg-white dark:bg-[#1E293B] border border-slate-205/80 dark:border-slate-850 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-violet-500 text-right flex flex-col justify-between"
                      id="card-portal-reports"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 dark:bg-violet-500/10 rounded-bl-3xl pointer-events-none transition-all group-hover:scale-150"></div>
                      <div>
                        {/* icon block */}
                        <div className="p-3 bg-violet-50 dark:bg-violet-950/40 text-violet-605 dark:text-violet-400 rounded-xl w-fit mb-4">
                          <FileText size={20} />
                        </div>
                        {/* title */}
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[9px] font-black text-violet-505 bg-violet-500/10 px-2 py-0.5 rounded-full font-mono uppercase font-sans font-bold">
                            PDF EXPORT
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white font-sans font-black">
                            {language === "ar" ? "مركز إصدار التقارير" : "Reports Center"}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-sans">
                          {language === "ar" 
                            ? "توليد الملفات والتقارير الاستشارية الرسمية المعتمدة لتقديمها مباشرة للجهات الفنية المختصة."
                            : "Generate enterprise-grade engineering reports with executive summaries & cover sheets."}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-violet-650 dark:text-violet-400 font-bold">
                        <ChevronLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        <span>{language === "ar" ? "عرض مركز التقارير الفنية 📄" : "Open Reports Center 📄"}</span>
                      </div>
                    </div>

                    {/* 7. AI Assistant Card */}
                    <div 
                      onClick={() => setActiveSidebarTab("engineering_assistant")}
                      className="group cursor-pointer relative overflow-hidden bg-white dark:bg-[#1E293B] border border-slate-205/80 dark:border-slate-850 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-purple-500 text-right flex flex-col justify-between"
                      id="card-portal-ai-assistant"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 dark:bg-purple-500/10 rounded-bl-3xl pointer-events-none transition-all group-hover:scale-150"></div>
                      <div>
                        {/* icon block */}
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl w-fit mb-4">
                          <Cpu size={20} />
                        </div>
                        {/* title */}
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[9px] font-black text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full font-mono uppercase font-sans font-bold animate-pulse">
                            GEMINI POWERED
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white font-sans font-black">
                            {language === "ar" ? "مساعد الذكاء الاصطناعي" : "AI Assistant"}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-sans">
                          {language === "ar" 
                            ? "تحليل الخلطة الحالية واقتراح التعديلات والتوجيهات التقنية استناداً لأفضل الممارسات الإنشائية."
                            : "Analyze context-aware recipes and generate real-time structural optimizations."}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-purple-600 dark:text-purple-400 font-bold">
                        <ChevronLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        <span>{language === "ar" ? "استشارة رفيق الخرسانة الذكي ✦" : "Consult AI Assistant ✦"}</span>
                      </div>
                    </div>

                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                      <span className="text-[10px] font-black text-slate-440 dark:text-slate-550 font-mono tracking-widest uppercase">REAL-TIME PORTAL METRICS</span>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 justify-end">
                        {language === "ar" ? "معلومات الخلطة النشطة حالياً" : language === "fr" ? "Paramètres de la Formule Active" : "Active Recipe Parameters & Status"}
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 animate-fade-in-up">
                      {/* Card 1: W/C Ratio */}
                      <div className="relative bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205/65 dark:border-slate-800 hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-950/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between group cursor-help"
                        title="Water to Cement Ratio"
                      >
                        <div className="absolute top-2 left-2 text-blue-500/10 group-hover:text-blue-500/25 transition-colors"><Droplet size={24} /></div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 block uppercase font-mono tracking-wider text-right">W/C CORRECTION RATIO</span>
                          <InteractiveTooltip termKey="wc_ratio" language={language}>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-black text-right mt-0.5 font-sans font-bold cursor-help">
                              {language === "ar" ? "نسبة الماء إلى الأسمنت" : language === "fr" ? "Rapport E/C" : "Water-Cement Ratio (W/C)"}
                            </span>
                          </InteractiveTooltip>
                        </div>
                        <div className="mt-4 text-right">
                          <strong className="text-2xl font-black block font-mono text-slate-900 dark:text-white leading-none">
                            {(results.wcRatioAdjusted || results.wcRatio || 0.50).toFixed(2)}
                          </strong>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {language === "ar" ? "النسبة المصححة للخلط" : language === "fr" ? "Rapport corrigé" : "Corrected mixing ratio"}
                          </span>
                        </div>
                      </div>

                      {/* Card 2: Compressive Strength */}
                      <div className="relative bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205/65 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-950/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between group cursor-help"
                        title="Target Compressive Strength fck28"
                      >
                        <div className="absolute top-2 left-2 text-emerald-500/10 group-hover:text-emerald-500/25 transition-colors"><ShieldCheck size={24} /></div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 block uppercase font-mono tracking-wider text-right">TARGET STRENGTH</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-black text-right mt-0.5 font-sans font-bold">
                            {language === "ar" ? "المقاومة المميزة المستهدفة" : language === "fr" ? "Résistance visée fc28" : "Target fck28 Strength"}
                          </span>
                        </div>
                        <div className="mt-4 text-right">
                          <strong className="text-2xl font-black block font-mono text-slate-900 dark:text-white leading-none">
                            {inputs.fck28} <span className="text-xs font-sans font-normal text-slate-550">MPa</span>
                          </strong>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {language === "ar" ? "عند عمر 28 يوماً" : language === "fr" ? "à l'âge de 28 jours" : "at 28 days age"}
                          </span>
                        </div>
                      </div>

                      {/* Card 3: Consistency Slump */}
                      <div className="relative bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205/65 dark:border-slate-800 hover:border-amber-500/50 hover:bg-white dark:hover:bg-slate-950/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between group cursor-help"
                        title="Target Slump Value"
                      >
                        <div className="absolute top-2 left-2 text-amber-500/10 group-hover:text-amber-500/25 transition-colors"><Activity size={24} /></div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 block uppercase font-mono tracking-wider text-right">TARGET CONSISTENCY (SLUMP)</span>
                          <span className="text-[10px] text-amber-600 dark:text-[#E2E8F0] block font-black text-right mt-0.5 font-sans font-bold">
                            {language === "ar" ? "هبوط القوام المستهدف" : language === "fr" ? "Affaissement visé" : "Target Slump / Consistency"}
                          </span>
                        </div>
                        <div className="mt-4 text-right">
                          <strong className="text-2xl font-black block font-mono text-slate-900 dark:text-white leading-none">
                            {inputs.slump * 10} <span className="text-xs font-sans font-normal text-slate-550">mm</span>
                          </strong>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {language === "ar" ? `قوام ${inputs.slump < 5 ? "جاف" : inputs.slump < 10 ? "لدن" : "مائع"}` : language === "fr" ? "Affaissement d'Abrams" : "Abrams cone slump"}
                          </span>
                        </div>
                      </div>

                      {/* Card 4: Cement Content */}
                      <div className="relative bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205/65 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-950/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between group cursor-help"
                        title="Cement Dosage"
                      >
                        <div className="absolute top-2 left-2 text-indigo-500/10 group-hover:text-indigo-500/25 transition-colors"><Layers size={24} /></div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 block uppercase font-mono tracking-wider text-right">CEMENT DOSAGE WEIGHT</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-black text-right mt-0.5 font-sans font-bold">
                            {language === "ar" ? "جرعة ومحتوى الأسمنت" : language === "fr" ? "Dosage en Ciment" : "Cement Dosage Weight"}
                          </span>
                        </div>
                        <div className="mt-4 text-right">
                          <strong className="text-2xl font-black block font-mono text-slate-900 dark:text-white leading-none">
                            {Math.round(results.cementWeight)} <span className="text-xs font-sans font-normal text-slate-550">kg/m³</span>
                          </strong>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {language === "ar" ? `الوجبة الكلية: ${Math.round(results.cementWeight * inputs.batchVolume)} kg` : `Total batch: ${Math.round(results.cementWeight * inputs.batchVolume)} kg`}
                          </span>
                        </div>
                      </div>

                      {/* Card 5: Finance Cost */}
                      <div className="relative bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205/65 dark:border-slate-800 hover:border-violet-500/50 hover:bg-white dark:hover:bg-slate-950/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between group cursor-help"
                        title="Estimated Batch Finance"
                      >
                        <div className="absolute top-2 left-2 text-violet-500/10 group-hover:text-violet-500/25 transition-colors"><Coins size={24} /></div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 block uppercase font-mono tracking-wider text-right">ESTIMATED BATCH FINANCE</span>
                          <span className="text-[10px] text-violet-600 dark:text-violet-400 block font-black text-right mt-0.5 font-sans font-bold">
                            {language === "ar" ? "الكلفة المالية للصبة" : language === "fr" ? "Coût estimé du béton" : "Estimated Batch Cost"}
                          </span>
                        </div>
                        <div className="mt-4 text-right">
                          <strong className="text-[19px] font-black block font-mono text-violet-650 dark:text-violet-400 leading-none truncate" title={formatCurrency(costBreakdown.grandTotalCost)}>
                            {formatCurrency(costBreakdown.grandTotalCost)}
                          </strong>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {language === "ar" ? "لكامل تشغيلة الوجبة" : language === "fr" ? "pour la gâchée complète" : "for the complete volume"}
                          </span>
                        </div>
                      </div>

                      {/* Card 6: Quality Assessment Score */}
                      <div className="relative bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205/65 dark:border-slate-800 hover:border-pink-500/50 hover:bg-white dark:hover:bg-slate-950/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between group cursor-help"
                        title="Quality Compliance Index"
                      >
                        <div className="absolute top-2 left-2 text-pink-500/10 group-hover:text-pink-500/25 transition-colors"><ShieldCheck size={24} /></div>
                        <div>
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 block uppercase font-mono tracking-wider text-right">MIX QUALITY ASSESSMENT</span>
                          <span className="text-[10px] text-pink-600 dark:text-pink-400 block font-black text-right mt-0.5 font-sans font-bold">
                            {language === "ar" ? "تقييم جودة الخليط" : language === "fr" ? "Score de qualité" : "Mix Quality Score"}
                          </span>
                        </div>
                        <div className="mt-4 text-right">
                          <strong className="text-2xl font-black block font-mono text-pink-600 dark:text-pink-400 leading-none">
                            {mixQualityScoreVal}<span className="text-xs font-sans font-normal text-slate-550">/100</span>
                          </strong>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {mixQualityScoreVal >= 80 ? (language === "ar" ? "ممتاز جداً" : "Excellent") : mixQualityScoreVal >= 55 ? (language === "ar" ? "مقبول" : "Acceptable") : (language === "ar" ? "تحت المعايرة" : "Substandard")}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Input Summary Grid: Left Column Summary, Right Column Results */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
                    {/* Left Column Summary (5 cols) */}
                    <div className="lg:col-span-5 backdrop-blur-md bg-white dark:bg-[#111827]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
                      <div className="border-b border-slate-100 dark:border-white/10 pb-2.5">
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest font-mono">Input Specification Panel</span>
                        <h4 className="text-xs font-bold text-slate-705 dark:text-slate-350 mt-0.5 text-right font-sans font-bold">{t("calculator.currentDesignCriteria")}</h4>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-white/[0.03]">
                          <span className="text-slate-600 dark:text-slate-400 text-right">{t("fck28_label") || (language === "ar" ? "المقاومة المميزة المطلوبة (fck28):" : "Required Compressive Strength (fck28):")}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-105 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{inputs.fck28} MPa</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-white/[0.03]">
                          <span className="text-slate-600 dark:text-slate-400 text-right">{t("calculator.slumpClass")}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-105 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{inputs.slump * 10} mm</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-white/[0.03]">
                          <span className="text-slate-600 dark:text-slate-400 text-right">{t("calculator.dmax")}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-105 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{inputs.dMax} mm</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-white/[0.03]">
                          <span className="text-slate-600 dark:text-slate-400 text-right">{t("calculator.controlQuality")}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-105 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            {inputs.controlClass === "high" ? t("calculator.controlExcellent") : inputs.controlClass === "normal" ? t("calculator.controlAverage") : t("calculator.controlStandard")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-white/[0.03]">
                          <span className="text-slate-600 dark:text-slate-400 font-sans text-right">{t("calculator.aggregateShape")}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-105 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            {inputs.aggregateType === AggregateType.ROULE ? (language === "ar" ? "حصى مدور / مستدير" : language === "fr" ? "Roulé" : "Rounded") : (language === "ar" ? "حصى مكسر / زاوي" : language === "fr" ? "Concassé" : "Crushed")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Constituents/Water Speciation Panel (7 Cols) */}
                    <div className="lg:col-span-7 backdrop-blur-md bg-white dark:bg-[#111827]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
                      <div className="border-b border-slate-100 dark:border-white/10 pb-2.5">
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest font-mono">WATER & ADMIXTURE ANALYSIS</span>
                        <h4 className="text-xs font-bold text-slate-705 dark:text-slate-350 mt-0.5 text-right font-sans font-bold">
                          {language === "ar" ? "تفاصيل المياه والركامات للوجبة" : language === "fr" ? "Analyse de l'eau et des adjuvants" : "Water & Aggregate Batch Distribution"}
                        </h4>
                      </div>

                      <div className="space-y-4">
                        {/* 1. Water Speciation Panel */}
                        <div className="bg-slate-50/50 dark:bg-[#111827]/20 p-4 rounded-xl border border-slate-150/50 dark:border-[#1e293b]/50 space-y-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-400" id="moisture-water-breakdown">
                          <div className="flex justify-between items-center bg-white dark:bg-[#111827]/50 p-2 rounded-lg border border-slate-100 dark:border-white/5 shadow-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{language === "ar" ? "ماء التصميم (Design Water)" : language === "fr" ? "Eau de calcul (Design)" : "Design Water"}:</span>
                            <strong className="font-mono text-blue-600 dark:text-blue-400 text-sm">
                              {`${Math.round((results.designWater !== undefined ? results.designWater : results.waterContentActual) * inputs.batchVolume)} L`}
                            </strong>
                          </div>

                          <div className="flex justify-between items-center bg-white dark:bg-[#111827]/50 p-2 rounded-lg border border-slate-100 dark:border-white/5 shadow-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{language === "ar" ? "إجمالي ماء الرطوبة داخل الركام (Total Moisture Water)" : language === "fr" ? "Eau d'humidité totale" : "Total Moisture Water"}:</span>
                            <strong className="font-mono text-amber-600 dark:text-yellow-500 text-sm">
                              {`${Math.round((results.totalAggregateMoistureWater !== undefined ? results.totalAggregateMoistureWater : 0) * inputs.batchVolume)} L`}
                            </strong>
                          </div>

                          <div className="flex justify-between items-center bg-white dark:bg-[#111827]/50 p-2 rounded-lg border border-slate-100 dark:border-white/5 shadow-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{language === "ar" ? "ماء الامتصاص داخل الركام (Absorption Water)" : language === "fr" ? "Eau d'absorption" : "Absorption Water"}:</span>
                            <strong className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                              {`${Math.round((results.totalAbsorptionWater !== undefined ? results.totalAbsorptionWater : 0) * inputs.batchVolume)} L`}
                            </strong>
                          </div>

                          <div className="flex justify-between items-center bg-white dark:bg-[#111827]/50 p-2 rounded-lg border border-slate-100 dark:border-white/5 shadow-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{language === "ar" ? "الماء الحر القابل للخصم (Free Surface Water)" : language === "fr" ? "Eau libre de surface" : "Free Surface Water"}:</span>
                            <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                              {`${Math.round((results.totalFreeSurfaceWater !== undefined ? results.totalFreeSurfaceWater : 0) * inputs.batchVolume)} L`}
                            </strong>
                          </div>

                          {results.totalAbsorptionDeficit !== undefined && results.totalAbsorptionDeficit > 0 && (
                            <div className="flex justify-between items-center bg-rose-50/40 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100/50 dark:border-rose-950/50 shadow-xs text-rose-600 dark:text-rose-455">
                              <span className="font-black">{language === "ar" ? "عجز الامتصاص المطلوب إضافته (Absorption Deficit)" : language === "fr" ? "Déficit d'absorption" : "Absorption Deficit"}:</span>
                              <strong className="font-mono text-sm">
                                +{`${Math.round(results.totalAbsorptionDeficit * inputs.batchVolume)} L`}
                              </strong>
                            </div>
                          )}

                          <div className="flex justify-between items-center bg-blue-50/40 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/50 shadow-xs text-blue-700 dark:text-blue-400 font-extrabold text-sm">
                            <span>{language === "ar" ? "الماء الذي يجب إضافته فعلياً (Water to Add)" : language === "fr" ? "Eau réelle à ajouter" : "Water to Add"}:</span>
                            <strong className="font-mono text-sm">
                              {`${Math.round((results.waterToAdd !== undefined ? results.waterToAdd : results.waterContentActual) * inputs.batchVolume)} L`}
                            </strong>
                          </div>
                        </div>

                        {/* 2. Dry / Wet Aggregate Weights Panel */}
                        <strong className="text-[10px] font-black text-slate-455 uppercase tracking-widest font-mono block pt-1">
                          {language === "ar" ? "أوزان الركامات وتفاصيل التشغيلة (Aggregate Weights & Batch Summary)" : language === "fr" ? "Masses des granulats et synthèse de gâchée" : "Aggregate Weights & Batch Summary"}
                        </strong>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          <div className="space-y-1.5 bg-slate-50/50 dark:bg-[#111827]/20 p-3 rounded-xl border border-slate-150/50 dark:border-[#1e293b]/50">
                            <div className="flex justify-between items-center">
                              <span>{language === "ar" ? "وزن الرمل الجاف (Dry Sand)" : language === "fr" ? "Masse du Sable Sec" : "Dry Sand"}:</span>
                              <strong className="font-mono text-slate-800 dark:text-slate-200">
                                {`${Math.round(results.sandWeightDry * inputs.batchVolume).toLocaleString()} kg`}
                              </strong>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>{language === "ar" ? "وزن الرمل الرطب (Wet Sand)" : language === "fr" ? "Masse du Sable Humide" : "Wet Sand"}:</span>
                              <strong className="font-mono text-amber-600 dark:text-yellow-500 font-bold">
                                {`${Math.round(results.sandWeightWet * inputs.batchVolume).toLocaleString()} kg`}
                              </strong>
                            </div>
                          </div>

                          <div className="space-y-1.5 bg-slate-50/50 dark:bg-[#111827]/20 p-3 rounded-xl border border-slate-150/50 dark:border-[#1e293b]/50">
                            <div className="flex justify-between items-center">
                              <span>{language === "ar" ? "وزن الحصى الجاف (Dry Gravel)" : language === "fr" ? "Masse du Gravier Sec" : "Dry Gravel"}:</span>
                              <strong className="font-mono text-slate-800 dark:text-slate-200">
                                {`${Math.round(results.gravelWeightDry * inputs.batchVolume).toLocaleString()} kg`}
                              </strong>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>{language === "ar" ? "وزن الحصى الرطب (Wet Gravel)" : language === "fr" ? "Masse du Gravier Humide" : "Wet Gravel"}:</span>
                              <strong className="font-mono text-slate-705 dark:text-slate-350 font-bold">
                                {`${Math.round(results.gravelWeightWet * inputs.batchVolume).toLocaleString()} kg`}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* 3. Real Total Batch Weight */}
                        <div className="bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/50 rounded-xl p-3.5 flex justify-between items-center">
                          <div>
                            <span className="text-xs font-black text-teal-850 dark:text-teal-300 block">
                              {language === "ar" ? "الوزن الإجمالي الحقيقي للتشغيلة (Real Total Batch Weight)" : language === "fr" ? "Masse Totale Réelle de la Gâchée" : "Real Total Batch Weight"}
                            </span>
                            <span className="text-[9.5px] text-slate-500 block mt-0.5">
                              {language === "ar" ? "يشمل جميع الروابط، الركامات الرطبة، مياه الإضافة الفعلية، والإضافات الكيميائية للتشغيلة الكلية المحسوبة." : language === "fr" ? "Comprend tous les liants, granulats humides, eau réelle et adjuvants chimiques pour la gâchée." : "Includes all binders, wet aggregates, actual added water, and chemical admixtures for the total batch."}
                            </span>
                          </div>
                          <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-lg font-black">
                            {totalBatchWeight.toLocaleString()} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">kg</span>
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>


                {!isBasicMode && (
                  <>
                    {/* 4. Score Gauge and Engineering Insights Side-by-Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Quality Ring (4 cols) */}
                  <div className="lg:col-span-4 block">
                    <MixQualityScore 
                      wcRatio={results.wcRatioAdjusted} 
                      fck28={inputs.fck28} 
                      controlClass={inputs.controlClass} 
                      aggregateQuality={inputs.aggregateQuality} 
                      hasPumping={inputs.hasPumping}
                      admixturesCount={results?.admixtureWeights?.length ?? 0}
                      exposureClass={inputs.exposureClass}
                      sandAbsorption={activeResolvedMats.sand?.absorption}
                      gravelAbsorption={activeResolvedMats.gravel?.absorption}
                      sandFineness={activeResolvedMats.sand?.finenessModulus}
                      admixtureRatio={inputs.dosageSuper}
                      codeCompliance={results.standardsCompliance?.every(item => item.status === "compliant")}
                      finalDensity={results.totalFreshDensity}
                    />
                  </div>

                  {/* Insights (8 cols) */}
                  <div className="lg:col-span-8 block">
                    <EngineeringInsights 
                      inputs={inputs}
                      result={results}
                    />
                  </div>
                </div>

                {/* 4.1 Real-time Interactive Slump & Consistency Rheology Visualizer (12 columns) */}
                <div className="block mt-6" id="concrete-rheology-visualizer-section">
                  <ConcreteSlumpVisualizer 
                    slumpValue={inputs.slump}
                    waterContent={results.waterContentActual}
                    cementWeight={results.cementWeight}
                    airContent={inputs.airContent}
                    sandRatio={Math.round(results.sandPercent)}
                    gravelRatio={Math.round(results.gravelPercent)}
                  />
                </div>

                {/* 4.2 Real-time AI / Procedural Mix Texture Imaging (12 columns) */}
                <div className="block mt-6" id="concrete-image-visualizer-section">
                  <ConcreteImageVisualizer 
                    slumpValue={inputs.slump}
                    waterContent={results.waterContentActual}
                    cementWeight={results.cementWeight}
                    aggregateType={inputs.aggregateType}
                    airContent={inputs.airContent}
                  />
                </div>

                {/* 4.3 2D thermal distribution heat map and cracking prediction simulation (d3 based) */}
                <div className="block mt-6" id="concrete-thermal-heatmap-section">
                  <ConcreteHeatMap 
                    cementWeight={Math.round(results.cementWeight)}
                    cementType={inputs.cementType}
                  />
                </div>
              </>
            )}

          </div>
        )}

            {/* TAB CONTENT: 2. CALCULATOR WITH CARDS */}
            {activeSidebarTab === "calculator" && (
              <div className="space-y-6 animate-fade-in" id="mixwizard-calculator-screen">

                {/* ENGINEERING DATA IMPORT STATUS PANEL */}
                <div className="bg-[#FAFBFD] dark:bg-[#1A2333] border border-blue-150/40 dark:border-blue-900/30 rounded-xl p-5 shadow-sm space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 dark:bg-blue-950/50 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
                        <ArrowLeftRight size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans text-left">
                          {language === "ar" ? "مركز استيراد ومزامنة البيانات الهندسية" : language === "fr" ? "Centre d'Importation & Synchronisation" : "Engineering Data Import & Sync Center"}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 text-left">
                          {language === "ar" ? "مراقبة تدفق البيانات من مستودع المواد والتحسين الحبيبي" : "Monitor live data flow from the Material Library & Granular Engineering Center"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${inputs.isGranularOptimizedApproved ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>
                      {inputs.isGranularOptimizedApproved ? (language === "ar" ? "نشط ومقفل" : "ACTIVE & LOCKED") : (language === "ar" ? "قيد الانتظار" : "AWAITING APPROVAL")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Col 1: Materials & Properties */}
                    <div className="p-3 bg-white dark:bg-[#121A2A] rounded-lg border border-slate-100 dark:border-slate-800 space-y-2 text-left">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{language === "ar" ? "المواد المستوردة" : "Materials Imported"}</span>
                        <span className="text-blue-500 font-mono">
                          {[inputs.selectedCementId, inputs.selectedSandId, inputs.selectedGravelId, inputs.selectedWaterId].filter(Boolean).length}/4
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{language === "ar" ? "الخصائص المحملة" : "Properties Loaded"}</span>
                        <span className="text-emerald-500 font-mono font-bold">
                          ✓ {countLoadedProperties} {language === "ar" ? "خاصية" : "Properties"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {language === "ar" ? "مستورد مباشرة من مستودع المواد" : "Imported directly from Material Library"}
                      </div>
                    </div>

                    {/* Col 2: Granular Center Approval */}
                    <div className="p-3 bg-white dark:bg-[#121A2A] rounded-lg border border-slate-100 dark:border-slate-800 space-y-2 text-left">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{language === "ar" ? "التحسين الحبيبي" : "Granular Optimization"}</span>
                        {inputs.isGranularOptimizedApproved ? (
                          <span className="text-emerald-500 font-black flex items-center gap-1">
                            ✓ {language === "ar" ? "معتمد" : "Approved"}
                          </span>
                        ) : (
                          <span className="text-amber-500 font-black flex items-center gap-1">
                            ⚠️ {language === "ar" ? "قيد الانتظار" : "Awaiting"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{language === "ar" ? "نسب خلط الأركام" : "Mix Ratios"}</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {inputs.isGranularOptimizedApproved ? "Sand 0/3 + Gravel G1, G2, G3" : (language === "ar" ? "غير منقول" : "Not Transferred")}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {language === "ar" ? "تاريخ الإصدار:" : "Revision Date:"} <span className="font-mono">{inputs.granularApprovedAt ? new Date(inputs.granularApprovedAt).toLocaleString() : "N/A"}</span>
                      </div>
                    </div>

                    {/* Col 3: Calculation Gate Status */}
                    <div className="p-3 bg-white dark:bg-[#121A2A] rounded-lg border border-slate-100 dark:border-slate-800 space-y-2 text-left">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{language === "ar" ? "بوابة التحقق الهندسية" : "Validation Gate"}</span>
                        {validationGate.isValidForReport ? (
                          <span className="text-emerald-500 font-black flex items-center gap-1">
                            ✓ {language === "ar" ? "جاهز" : "Ready"}
                          </span>
                        ) : (
                          <span className="text-red-500 font-black flex items-center gap-1">
                            ❌ {language === "ar" ? "محظور" : "Blocked"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{language === "ar" ? "حالة المزامنة" : "Sync Status"}</span>
                        <span className="text-emerald-500 font-bold">
                          {language === "ar" ? "نشط ومزامن" : "Live Sync active"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {validationGate.criticalErrors.length > 0 
                          ? `${validationGate.criticalErrors.length} ${language === "ar" ? "مشكلة تمنع الحساب" : "issues blocking calculation"}`
                          : (language === "ar" ? "جاهز تماماً للتصميم الفني" : "Ready for Dreux-Gorisse Calculations")
                        }
                      </div>
                    </div>
                  </div>

                  {/* Detailed list of issues if materials are missing or unselected */}
                  {(() => {
                    const cList = materialsDatabase.filter(m => (m.category === "إسمنت" || m.category === "مجلدات خاصة") && isApprovedAndActive(m));
                    const sList = materialsDatabase.filter(m => m.category === "رمال" && isApprovedAndActive(m));
                    const gList = materialsDatabase.filter(m => (m.category === "حصى" || m.category === "ركام خفيف" || m.category === "ركام ثقيل") && isApprovedAndActive(m));
                    const wList = materialsDatabase.filter(m => (m.category === "ماء" || m.type === "water") && isApprovedAndActive(m));

                    const hasMissingOrUnselected = !inputs.selectedCementId || !inputs.selectedSandId || !inputs.selectedGravelId || !inputs.selectedWaterId || cList.length === 0 || sList.length === 0 || gList.length === 0 || wList.length === 0;

                    if (!hasMissingOrUnselected) return null;

                    return (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-right">
                        <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 justify-start">
                          <ShieldAlert size={14} className="text-rose-600 shrink-0" />
                          <span>{language === "ar" ? "تنبيه: يجب استيراد المواد والركام من المستودع لتفعيل الحسابات" : "Alert: Materials & aggregates must be imported from the repository"}</span>
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                          {language === "ar" 
                            ? "النظام يقوم الآن بالاستيراد الحقيقي لخصائص الركام والمكونات من المستودع لضمان جودة الحسابات الهندسية وربطها بالمصدر. يرجى تفعيل واختيار المواد المطلوبة." 
                            : "The system now performs real property imports of aggregates and constituents from the repository to ensure engineering precision. Please activate and select the required materials."}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1 justify-start">
                          {cList.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSidebarTab("materials_library");
                                setTimeout(() => {
                                  window.dispatchEvent(new CustomEvent("trigger-add-material", { detail: { category: "إسمنت" } }));
                                }, 100);
                              }}
                              className="text-[10px] bg-red-500/15 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-lg font-black hover:bg-red-500/25 transition-all border border-red-500/20 flex items-center gap-1 cursor-pointer"
                              title={language === "ar" ? "انقر لإضافة إسمنت" : "Click to add cement"}
                            >
                              ⚠️ {language === "ar" ? "الإسمنت ناقص (انقر لإضافته بمستودع المواد)" : "Cement missing (Click to add in repository)"}
                            </button>
                          ) : !inputs.selectedCementId ? (
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById("step3-materials-selection");
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  el.classList.add("ring-4", "ring-amber-500/30", "transition-all");
                                  setTimeout(() => el.classList.remove("ring-4", "ring-amber-500/30"), 2000);
                                }
                              }}
                              className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg font-black hover:bg-amber-500/25 transition-all border border-amber-500/20 flex items-center gap-1 cursor-pointer"
                            >
                              ⚙️ {language === "ar" ? "يرجى تحديد الإسمنت بالخلطة" : "Please select cement (Click to select)"}
                            </button>
                          ) : null}

                          {sList.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSidebarTab("materials_library");
                                setTimeout(() => {
                                  window.dispatchEvent(new CustomEvent("trigger-add-material", { detail: { category: "رمال" } }));
                                }, 100);
                              }}
                              className="text-[10px] bg-red-500/15 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-lg font-black hover:bg-red-500/25 transition-all border border-red-500/20 flex items-center gap-1 cursor-pointer"
                              title={language === "ar" ? "انقر لإضافة رمل" : "Click to add sand"}
                            >
                              ⚠️ {language === "ar" ? "الرمل ناقص (انقر لإضافته بمستودع المواد)" : "Sand missing (Click to add in repository)"}
                            </button>
                          ) : !inputs.selectedSandId ? (
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById("step3-materials-selection");
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  el.classList.add("ring-4", "ring-amber-500/30", "transition-all");
                                  setTimeout(() => el.classList.remove("ring-4", "ring-amber-500/30"), 2000);
                                }
                              }}
                              className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg font-black hover:bg-amber-500/25 transition-all border border-amber-500/20 flex items-center gap-1 cursor-pointer"
                            >
                              ⚙️ {language === "ar" ? "يرجى تحديد الرمل بالخلطة" : "Please select sand (Click to select)"}
                            </button>
                          ) : null}

                          {gList.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSidebarTab("materials_library");
                                setTimeout(() => {
                                  window.dispatchEvent(new CustomEvent("trigger-add-material", { detail: { category: "حصى" } }));
                                }, 100);
                              }}
                              className="text-[10px] bg-red-500/15 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-lg font-black hover:bg-red-500/25 transition-all border border-red-500/20 flex items-center gap-1 cursor-pointer"
                              title={language === "ar" ? "انقر لإضافة حصى" : "Click to add gravel"}
                            >
                              ⚠️ {language === "ar" ? "الحصى ناقص (انقر لإضافته بمستودع المواد)" : "Gravel missing (Click to add in repository)"}
                            </button>
                          ) : !inputs.selectedGravelId ? (
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById("step3-materials-selection");
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  el.classList.add("ring-4", "ring-amber-500/30", "transition-all");
                                  setTimeout(() => el.classList.remove("ring-4", "ring-amber-500/30"), 2000);
                                }
                              }}
                              className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg font-black hover:bg-amber-500/25 transition-all border border-amber-500/20 flex items-center gap-1 cursor-pointer"
                            >
                              ⚙️ {language === "ar" ? "يرجى تحديد الحصى بالخلطة" : "Please select gravel (Click to select)"}
                            </button>
                          ) : null}

                          {wList.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSidebarTab("materials_library");
                                setTimeout(() => {
                                  window.dispatchEvent(new CustomEvent("trigger-add-material", { detail: { category: "ماء" } }));
                                }, 100);
                              }}
                              className="text-[10px] bg-red-500/15 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-lg font-black hover:bg-red-500/25 transition-all border border-red-500/20 flex items-center gap-1 cursor-pointer"
                              title={language === "ar" ? "انقر لإضافة ماء" : "Click to add water"}
                            >
                              ⚠️ {language === "ar" ? "الماء ناقص (انقر لإضافته بمستودع المواد)" : "Water missing (Click to add in repository)"}
                            </button>
                          ) : !inputs.selectedWaterId ? (
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById("step3-materials-selection");
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  el.classList.add("ring-4", "ring-amber-500/30", "transition-all");
                                  setTimeout(() => el.classList.remove("ring-4", "ring-amber-500/30"), 2000);
                                }
                              }}
                              className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg font-black hover:bg-amber-500/25 transition-all border border-amber-500/20 flex items-center gap-1 cursor-pointer"
                            >
                              ⚙️ {language === "ar" ? "يرجى تحديد الماء بالخلطة" : "Please select water (Click to select)"}
                            </button>
                          ) : null}
                        </div>
                        <div className="pt-1 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveSidebarTab("materials_library")}
                            className="text-xs font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 justify-start"
                          >
                            📁 {language === "ar" ? "انقر هنا للذهاب لمستودع المواد وإضافتها" : "Click here to manage materials in the repository"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* HEAD DETAILS WITH CUSTOM AREA & VOLUME ESTIMATION CONTROLS */}
                <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-5 text-right">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-grow">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white font-sans flex items-center gap-1.5 justify-start">
                        <Sliders size={16} className="text-blue-500" />
                        <span>{t("calculator.smartCalibrationTitle")}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-sans">
                        {t("calculator.smartCalibrationDescription")}
                      </p>
                    </div>

                    {/* Mode Selector for Batch Volume Input */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 self-stretch lg:self-auto shrink-0 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setInputs(prev => ({ ...prev, volumeInputMode: "volume" }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${(!inputs.volumeInputMode || inputs.volumeInputMode === "volume") ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-800" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                      >
                        {language === "ar" ? "حجم مباشر (م³)" : language === "fr" ? "Volume Direct (m³)" : "Direct Volume (m³)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const area = inputs.areaM2 || 10;
                          const thick = inputs.thicknessCm || 10;
                          setInputs(prev => ({ 
                            ...prev, 
                            volumeInputMode: "area",
                            batchVolume: Math.max(0.01, parseFloat((area * (thick / 100)).toFixed(3)) || 1.0)
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${inputs.volumeInputMode === "area" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-800" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                      >
                        {language === "ar" ? "بالمساحة والسمك (م²)" : language === "fr" ? "Par Surface & Épaisseur" : "By Area & Thickness"}
                      </button>
                    </div>
                  </div>

                  {/* Volume Inputs Container */}
                  <div className="bg-slate-50/55 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {(!inputs.volumeInputMode || inputs.volumeInputMode === "volume") ? (
                      // 1. Direct Volume Input
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full justify-between">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{t("calculator.batchVolumeScale")}</span>
                          <span className="text-[10px] text-slate-500 font-sans block mt-0.5">{language === "ar" ? "أدخل حجم الوجبة الكلي مباشرة بالمتر المكعب" : "Enter the total batch volume directly in cubic meters (m³)"}</span>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <input
                            type="number"
                            min="0.1"
                            max="100.0"
                            step="0.1"
                            value={inputs.batchVolume}
                            onChange={(e) => setInputs({ ...inputs, batchVolume: Math.max(0.1, parseFloat(e.target.value) || 1.0) })}
                            className="w-24 text-center text-sm font-bold p-2 rounded-lg border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                          />
                          <span className="text-xs font-black text-slate-600 dark:text-slate-300 font-mono">m³</span>
                        </div>
                      </div>
                    ) : (
                      // 2. Calculated by Area and Thickness
                      <div className="flex flex-col w-full gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Area Field */}
                          <div className="flex flex-col gap-1.5 text-right">
                            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-start gap-1">
                              <span>{language === "ar" ? "المساحة المطلوبة (م²)" : language === "fr" ? "Surface Requise (m²)" : "Required Area (m²)"}</span>
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                              <input
                                type="number"
                                min="0.1"
                                max="10000"
                                step="1"
                                value={inputs.areaM2 || 10}
                                onChange={(e) => {
                                  const area = parseFloat(e.target.value) || 0;
                                  const thick = inputs.thicknessCm || 10;
                                  setInputs(prev => ({
                                    ...prev,
                                    areaM2: area,
                                    batchVolume: Math.max(0.01, parseFloat((area * (thick / 100)).toFixed(3)) || 1.0)
                                  }));
                                }}
                                className="w-full text-center text-sm font-bold p-2.5 rounded-lg border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                              />
                              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <span className="text-xs font-bold text-slate-500">m²</span>
                              </div>
                            </div>
                          </div>

                          {/* Thickness Field */}
                          <div className="flex flex-col gap-1.5 text-right">
                            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-start gap-1">
                              <span>{language === "ar" ? "سمك الصب (سم)" : language === "fr" ? "Épaisseur du coulage (cm)" : "Pour Thickness (cm)"}</span>
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                              <input
                                type="number"
                                min="1"
                                max="200"
                                step="1"
                                value={inputs.thicknessCm || 10}
                                onChange={(e) => {
                                  const thick = parseFloat(e.target.value) || 0;
                                  const area = inputs.areaM2 || 10;
                                  setInputs(prev => ({
                                    ...prev,
                                    thicknessCm: thick,
                                    batchVolume: Math.max(0.01, parseFloat((area * (thick / 100)).toFixed(3)) || 1.0)
                                  }));
                                }}
                                className="w-full text-center text-sm font-bold p-2.5 rounded-lg border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                              />
                              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <span className="text-xs font-bold text-slate-500">cm</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Resulting Calculation Formula Summary */}
                        <div className="bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/10 dark:border-blue-900/40 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                          <div className="text-slate-600 dark:text-slate-300 font-medium">
                            {language === "ar" ? (
                              <span>📊 حساب الحجم تلقائياً: <strong>{inputs.areaM2 || 0} م²</strong> (مساحة) × <strong>{inputs.thicknessCm || 0} سم</strong> (سمك)</span>
                            ) : language === "fr" ? (
                              <span>📊 Calcul auto du volume : <strong>{inputs.areaM2 || 0} m²</strong> (Surface) × <strong>{inputs.thicknessCm || 0} cm</strong> (Épaisseur)</span>
                            ) : (
                              <span>📊 Automatic volume estimation: <strong>{inputs.areaM2 || 0} m²</strong> (Area) × <strong>{inputs.thicknessCm || 0} cm</strong> (Thickness)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 bg-blue-500/15 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md font-black font-mono text-sm">
                            {inputs.batchVolume} m³
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* OPERATING MODE SELECTOR (وضعان للتشغيل) */}
                <div className="bg-gradient-to-l from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-blue-500 block font-mono">SYSTEM CONFIGURATION MODE</span>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{t("calculator.systemModeTitle")}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{t("calculator.systemModeDescription")}</p>
                  </div>
                  <div className="flex gap-1.5 bg-slate-1050 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setDesignerMode("normal")}
                      className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${designerMode === "normal" ? "bg-blue-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                    >
                      {t("calculator.autoMode")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesignerMode("expert")}
                      className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${designerMode === "expert" ? "bg-amber-500 text-slate-950 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                    >
                      {t("calculator.manualExpertMode")}
                    </button>
                  </div>
                </div>

                {/* THE REDESIGNED STEPWISE GRID */}
                <div className="space-y-6" id="calculator-input-cards-grid">
                  
                  {/* STEP 1: PROJECT REQUIREMENTS & SPECS */}
                  <div className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 ${isRtl ? "text-right" : "text-left"}`} id="step1-project-requirements">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">1</span>
                        <span>{t("step1_header")}</span>
                      </h4>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-sans">{t("essential_step")}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      
                      {/* Compressive Strength fck28 */}
                      <div className={`p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 ${isFieldDisabled("fck28") ? "opacity-35 pointer-events-none select-none grayscale" : ""}`}>
                        <div className="flex justify-between items-center text-xs">
                          <InteractiveTooltip termKey="fck28" language={language}>
                            <label className="font-extrabold text-slate-700 dark:text-slate-200 cursor-help">{t("fck28_label")}</label>
                          </InteractiveTooltip>
                          <span className="font-mono text-xs text-blue-500 font-bold">{language === "ar" ? "ميجاباسكال (MPa)" : "MPa"}</span>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            step="0.1"
                            value={inputs.fck28 ?? ""}
                            disabled={isFieldDisabled("fck28")}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                              setInputs(prev => ({ ...prev, fck28: val }));
                            }}
                            className={`w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 px-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-colors ${language === "ar" ? "pl-14 text-right" : "pr-14 text-left"}`}
                            placeholder="e.g. 30"
                          />
                          <span className={`absolute text-[10px] font-extrabold text-blue-500 font-mono ${language === "ar" ? "left-3" : "right-3"}`}>MPa</span>
                        </div>
                        
                        {/* Real-time Engineering Validation Feedback */}
                        {(() => {
                          const fckVal = inputs.fck28 || 0;
                          const concreteCode = (inputs.concreteType || "NSC").toUpperCase();
                          let minRec = 10;
                          let maxRec = 35;
                          let typeLabel = "NSC";

                          if (concreteCode === "NSC") {
                            minRec = 10; maxRec = 35; typeLabel = language === "ar" ? "عادية المقاومة (NSC)" : "Normal Strength Concrete (NSC)";
                          } else if (concreteCode === "HSC") {
                            minRec = 40; maxRec = 100; typeLabel = language === "ar" ? "عالية المقاومة (HSC)" : "High Strength Concrete (HSC)";
                          } else if (concreteCode === "HPC") {
                            minRec = 40; maxRec = 100; typeLabel = language === "ar" ? "عالية الأداء (HPC)" : "High Performance Concrete (HPC)";
                          } else if (concreteCode === "SCC") {
                            minRec = 25; maxRec = 60; typeLabel = language === "ar" ? "ذاتية الرص (SCC)" : "Self-Consolidating Concrete (SCC)";
                          } else if (concreteCode === "LWC") {
                            minRec = 15; maxRec = 35; typeLabel = language === "ar" ? "خفيفة الوزن (LWC)" : "Lightweight Concrete (LWC)";
                          } else if (concreteCode === "HWC") {
                            minRec = 25; maxRec = 60; typeLabel = language === "ar" ? "ثقيلة الوزن (HWC)" : "Heavyweight Concrete (HWC)";
                          } else if (concreteCode === "FRC") {
                            minRec = 20; maxRec = 60; typeLabel = language === "ar" ? "المسلحة بالألياف (FRC)" : "Fiber-Reinforced Concrete (FRC)";
                          } else if (concreteCode === "UHPC" || concreteCode === "BFUP") {
                            minRec = 100; maxRec = 250; typeLabel = language === "ar" ? "فائقة الأداء (UHPC)" : "Ultra-High Performance Concrete (UHPC)";
                          }

                          const isWarn = fckVal < minRec || fckVal > maxRec;
                          if (fckVal > 0 && isWarn) {
                            return (
                              <p className="text-[9.5px] leading-snug text-amber-600 dark:text-amber-450 bg-amber-500/5 p-1.5 rounded-lg border border-amber-500/10 text-right">
                                ⚠ {language === "ar" 
                                  ? `تنبيه: المقاومة الموصى بها لخرسانة ${typeLabel} هي بين ${minRec} و ${maxRec} MPa.`
                                  : `Note: Recommended strength range for ${typeLabel} is ${minRec} to ${maxRec} MPa.`}
                              </p>
                            );
                          }
                          return (
                            <p className="text-[9px] text-slate-450 text-right">
                              ✓ {language === "ar"
                                ? `ضمن النطاق الموصى به لـ ${typeLabel} (${minRec} - ${maxRec} MPa).`
                                : `Within recommended range for ${typeLabel} (${minRec} - ${maxRec} MPa).`}
                            </p>
                          );
                        })()}
                      </div>

                      {/* Concrete Type Selection */}
                      <div className={`p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1.5 ${isRtl ? "text-right" : "text-left"} font-sans`}>
                        <label className="text-xs font-black text-slate-850 dark:text-slate-200 block">{t("concrete_type_label")}</label>
                        <select
                          value={inputs.concreteType || "NSC"}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            const activeConfig = CONCRETE_TYPE_CONFIGS[val];
                            setInputs(prev => {
                              let next = { ...prev, concreteType: val };

                              // Reset any selected materials that are incompatible with the new Concrete Type!
                              const materialsList = materialsDatabase || [];
                              
                              // Check selected cement
                              if (next.selectedCementId) {
                                const cementMat = materialsList.find(m => m.id === next.selectedCementId);
                                if (!cementMat || !activeConfig || !activeConfig.isMaterialCompatible(cementMat)) {
                                  next.selectedCementId = "";
                                  next.cementType = "";
                                  next.cementDensity = 0;
                                  next.priceCement = 0;
                                }
                              }
                              // Check selected sand
                              if (next.selectedSandId) {
                                const sandMat = materialsList.find(m => m.id === next.selectedSandId);
                                if (!sandMat || !activeConfig || !activeConfig.isMaterialCompatible(sandMat)) {
                                  next.selectedSandId = "";
                                  next.sandType = "";
                                  next.sandRelativeDensity = 0;
                                  next.priceSand = 0;
                                  next.sandAbsorption = 0;
                                  next.moistureSand = 0;
                                }
                              }
                              // Check selected gravel
                              if (next.selectedGravelId) {
                                const gravelMat = materialsList.find(m => m.id === next.selectedGravelId);
                                if (!gravelMat || !activeConfig || !activeConfig.isMaterialCompatible(gravelMat)) {
                                  next.selectedGravelId = "";
                                  next.gravelType = "";
                                  next.gravelRelativeDensity = 0;
                                  next.priceGravel = 0;
                                  next.gravelAbsorption = 0;
                                  next.moistureGravel = 0;
                                }
                              }
                              // Check selected water
                              if (next.selectedWaterId) {
                                const waterMat = materialsList.find(m => m.id === next.selectedWaterId);
                                if (!waterMat || !activeConfig || !activeConfig.isMaterialCompatible(waterMat)) {
                                  next.selectedWaterId = "";
                                  next.waterType = "";
                                  next.priceWater = 0;
                                }
                              }
                              // Check SCM
                              if (next.selectedScmId) {
                                const scmMat = materialsList.find(m => m.id === next.selectedScmId);
                                if (!scmMat || !activeConfig || !activeConfig.isMaterialCompatible(scmMat)) {
                                  next.selectedScmId = "";
                                  next.scmType = "";
                                  next.priceScm = 0;
                                  next.scmDensity = 0;
                                }
                              }
                              // Check Fiber
                              if (next.selectedFiberId) {
                                const fiberMat = materialsList.find(m => m.id === next.selectedFiberId);
                                if (!fiberMat || !activeConfig || !activeConfig.isMaterialCompatible(fiberMat)) {
                                  next.selectedFiberId = "";
                                  next.fiberType = "";
                                  next.priceFiber = 0;
                                  next.fiberDensity = 0;
                                }
                              }
                              // Check Special Binder
                              if (next.selectedSpecialBinderId) {
                                const specialBinderMat = materialsList.find(m => m.id === next.selectedSpecialBinderId);
                                if (!specialBinderMat || !activeConfig || !activeConfig.isMaterialCompatible(specialBinderMat)) {
                                  next.selectedSpecialBinderId = "";
                                  next.specialBinderType = "";
                                  next.priceSpecialBinder = 0;
                                  next.specialBinderDensity = 0;
                                }
                              }

                              // Pre-populate required SCM or other defaults if required
                              if (activeConfig) {
                                // If GPC, automatically switch cement to preset-geopolymer-binder if compatible
                                if (val === "GPC") {
                                  const geoBinder = materialsList.find(m => m.id === "preset-geopolymer-binder");
                                  if (geoBinder && activeConfig.isMaterialCompatible(geoBinder)) {
                                    next.selectedCementId = geoBinder.id;
                                    next.cementType = geoBinder.name;
                                    next.cementDensity = geoBinder.density;
                                    next.priceCement = geoBinder.price || 30;
                                    next.cementClassStrength = 42.5;
                                  }
                                }

                                // Auto-select first compatible material for required categories if nothing is selected
                                activeConfig.requiredCategories.forEach(cat => {
                                  if (cat === "إسمنت" && !next.selectedCementId) {
                                    const compatibleCement = materialsList.find(m => (m.category === "إسمنت" || m.category === "مجلدات خاصة") && isApprovedAndActive(m) && activeConfig.isMaterialCompatible(m));
                                    if (compatibleCement) {
                                      next.selectedCementId = compatibleCement.id;
                                      next.cementType = compatibleCement.name;
                                      next.cementDensity = compatibleCement.density;
                                      next.priceCement = compatibleCement.price || 17;
                                      const strClass = compatibleCement.strengthClass || compatibleCement.cementClassStrength;
                                      next.cementClassStrength = strClass ? parseFloat(strClass) : 42.5;
                                    }
                                  }
                                  if (cat === "رمال" && !next.selectedSandId) {
                                    const compatibleSand = materialsList.find(m => m.category === "رمال" && isApprovedAndActive(m) && activeConfig.isMaterialCompatible(m));
                                    if (compatibleSand) {
                                      next.selectedSandId = compatibleSand.id;
                                      next.sandType = compatibleSand.name;
                                      next.sandRelativeDensity = compatibleSand.density || compatibleSand.specificGravity || 0;
                                      next.priceSand = compatibleSand.price || 2.5;
                                      next.sandAbsorption = compatibleSand.absorption || 0;
                                      next.moistureSand = compatibleSand.moisture || 0;
                                      next.finenessModulus = compatibleSand.finenessModulus || 0;
                                    }
                                  }
                                  if ((cat === "حصى" || cat === "ركام خفيف" || cat === "ركام ثقيل") && !next.selectedGravelId) {
                                    const compatibleGravel = materialsList.find(m => (m.category === "حصى" || m.category === "ركام خفيف" || m.category === "ركام ثقيل") && isApprovedAndActive(m) && activeConfig.isMaterialCompatible(m));
                                    if (compatibleGravel) {
                                      next.selectedGravelId = compatibleGravel.id;
                                      next.gravelType = compatibleGravel.name;
                                      next.gravelRelativeDensity = compatibleGravel.density || compatibleGravel.specificGravity || 0;
                                      next.priceGravel = compatibleGravel.price || 3.5;
                                      next.gravelAbsorption = compatibleGravel.absorption || 0;
                                      next.moistureGravel = compatibleGravel.moisture || 0;
                                      next.dMax = compatibleGravel.dMax || 20;
                                    }
                                  }
                                  if (cat === "ماء" && !next.selectedWaterId) {
                                    const compatibleWater = materialsList.find(m => m.category === "ماء" && isApprovedAndActive(m) && activeConfig.isMaterialCompatible(m));
                                    if (compatibleWater) {
                                      next.selectedWaterId = compatibleWater.id;
                                      next.waterType = compatibleWater.name;
                                      next.priceWater = compatibleWater.price || 0.1;
                                    }
                                  }
                                  if (cat === "إضافات معدنية" && !next.selectedScmId) {
                                    const compatibleScm = materialsList.find(m => (m.category === "إضافات معدنية" || m.category === "مواد مالئة") && isApprovedAndActive(m) && activeConfig.isMaterialCompatible(m));
                                    if (compatibleScm) {
                                      next.selectedScmId = compatibleScm.id;
                                      next.scmType = compatibleScm.name;
                                      next.priceScm = compatibleScm.price || 5;
                                      next.scmDensity = compatibleScm.density || 2200;
                                    }
                                  }
                                  if (cat === "ألياف" && !next.selectedFiberId) {
                                    const compatibleFiber = materialsList.find(m => m.category === "ألياف" && isApprovedAndActive(m) && activeConfig.isMaterialCompatible(m));
                                    if (compatibleFiber) {
                                      next.selectedFiberId = compatibleFiber.id;
                                      next.fiberType = compatibleFiber.name;
                                      next.priceFiber = compatibleFiber.price || 25;
                                      next.fiberDensity = compatibleFiber.density || 7850;
                                    }
                                  }
                                  if (cat === "مجلدات خاصة" && !next.selectedSpecialBinderId) {
                                    const compatibleSB = materialsList.find(m => m.category === "مجلدات خاصة" && isApprovedAndActive(m) && activeConfig.isMaterialCompatible(m));
                                    if (compatibleSB) {
                                      next.selectedSpecialBinderId = compatibleSB.id;
                                      next.specialBinderType = compatibleSB.name;
                                      next.priceSpecialBinder = compatibleSB.price || 30;
                                      next.specialBinderDensity = compatibleSB.density || 1400;
                                    }
                                  }
                                });
                              }

                              return next;
                            });
                          }}
                          className="w-full text-xs p-2.5 rounded border border-amber-300/30 dark:border-amber-700/40 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="NSC">{t("type_NSC")}</option>
                          <option value="HSC">{t("type_HSC")}</option>
                          <option value="HPC">{t("type_HPC")}</option>
                          <option value="SCC">{t("type_SCC")}</option>
                          <option value="FRC">{t("type_FRC")}</option>
                          <option value="LWC">{t("type_LWC")}</option>
                          <option value="HWC">{t("type_HWC")}</option>
                          <option value="RCC">{t("type_RCC")}</option>
                          <option value="SHOTCRETE">{t("type_SHOTCRETE")}</option>
                          <option value="GPC">{t("type_GPC")}</option>
                          <option value="SHC">{t("type_SHC")}</option>
                          <option value="RAC">{t("type_RAC")}</option>
                          <option value="PERVIOUS">{t("type_PERVIOUS")}</option>
                          <option value="UHPC">{t("type_UHPC")}</option>
                          <option value="BFUP">{t("type_BFUP")}</option>
                        </select>

                        {(() => {
                          const meta = CONCRETE_TYPES_CATALOG.find(t => t.code === (inputs.concreteType || "NSC"));
                          if (!meta) return null;
                          const details = getConcreteTypeDetails(meta.code, language);
                          return (
                            <div className="mt-3 p-3 bg-white dark:bg-slate-900/60 rounded-lg border border-amber-500/10 space-y-2 text-xs font-sans shadow-sm leading-relaxed text-right">
                              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold flex-row-reverse">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>
                                  {language === "ar" ? "خصائص ومميزات صنف الخرسانة المحدد:" : "Characteristics of selected concrete type:"}
                                </span>
                              </div>
                              <div className="space-y-2 text-right">
                                <div>
                                  <strong className="text-slate-800 dark:text-slate-200 block text-[11px] font-black mb-0.5">
                                    {language === "ar" ? "✦ بماذا تتميز:" : "✦ Key Features:"}
                                  </strong>
                                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                    {details.description}
                                  </p>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1"></div>
                                <div>
                                  <strong className="text-slate-800 dark:text-slate-200 block text-[11px] font-black mb-0.5">
                                    {language === "ar" ? "✦ أين تُستعمل:" : "✦ Standard Applications:"}
                                  </strong>
                                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                    {details.usage}
                                  </p>
                                </div>
                                {details.materials && (
                                  <>
                                    <div className="border-t border-slate-100 dark:border-slate-800/80 my-1"></div>
                                    <div>
                                      <strong className="text-slate-800 dark:text-slate-200 block text-[11px] font-black mb-0.5">
                                        {language === "ar" ? "✦ المواد المستخدمة:" : "✦ Materials Used:"}
                                      </strong>
                                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                        {details.materials}
                                      </p>
                                    </div>
                                  </>
                                )}
                                {details.mixing && (
                                  <>
                                    <div className="border-t border-slate-100 dark:border-slate-800/80 my-1"></div>
                                    <div>
                                      <strong className="text-slate-800 dark:text-slate-200 block text-[11px] font-black mb-0.5">
                                        {language === "ar" ? "✦ طريقة التحضير والخلط:" : "✦ Preparation & Mixing:"}
                                      </strong>
                                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                        {details.mixing}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Design Method: Dreux-Gorisse exclusively */}
                      <div className={`p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20 space-y-2 ${isRtl ? "text-right" : "text-left"} font-sans`}>
                        <label className="text-xs font-black text-slate-855 dark:text-slate-200 block border-b border-indigo-500/10 pb-1.5">{t("selected_method_label")}</label>
                        <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed">
                          {t("selected_method_desc")}
                        </p>

                        {/* Structural Element Selection */}
                        <div className={`mt-3 p-3.5 bg-sky-500/5 rounded-xl border border-sky-500/15 space-y-2 ${isRtl ? "text-right" : "text-left"} font-sans`}>
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                              {language === "ar" ? "العنصر الإنشائي المراد صبه:" : language === "fr" ? "Élément Structural :" : "Target Structural Element:"}
                            </label>
                            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded font-bold">
                              {STRUCTURAL_ELEMENTS.length} {language === "ar" ? "عناصر معتمدة" : "Elements"}
                            </span>
                          </div>

                          <select
                            value={inputs.structuralElement || "column"}
                            onChange={(e) => {
                              const elemId = e.target.value;
                              const elemConfig = getStructuralElementById(elemId);
                              setInputs(prev => ({
                                ...prev,
                                structuralElement: elemId,
                                slump: elemConfig.recommendedSlump.target,
                                dMax: elemConfig.recommendedDmax,
                                exposureClass: elemConfig.defaultExposureClass
                              }));
                            }}
                            className="w-full text-xs p-2.5 rounded border border-sky-300/30 dark:border-sky-700/40 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                          >
                            {STRUCTURAL_ELEMENTS.map(elem => (
                              <option key={elem.id} value={elem.id}>
                                {language === "ar" ? elem.nameAr : language === "fr" ? elem.nameFr : elem.nameEn}
                              </option>
                            ))}
                          </select>

                          {/* Active Structural Element Engineering Specs & Advice Badge */}
                          {(() => {
                            const curElem = getStructuralElementById(inputs.structuralElement || "column");
                            if (!curElem) return null;
                            return (
                              <div className="p-3 bg-white dark:bg-slate-900/70 rounded-lg border border-sky-500/20 text-xs space-y-2 text-right">
                                <div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300">
                                  <span>{language === "ar" ? curElem.nameAr : curElem.nameEn}</span>
                                  <span className="bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded font-mono text-[10px]">
                                    {language === "ar" ? "المواصفات الموصى بها" : "Recommended Specs"}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-snug">
                                  {curElem.descriptionAr}
                                </p>
                                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-center font-mono text-[10px]">
                                  <div className="bg-sky-50 dark:bg-slate-800 p-1.5 rounded">
                                    <span className="text-slate-400 block text-[9px] font-sans">{language === "ar" ? "الهبوط Slump" : "Slump"}</span>
                                    <span className="font-bold text-sky-600">{curElem.recommendedSlump.min}-{curElem.recommendedSlump.max} cm</span>
                                  </div>
                                  <div className="bg-sky-50 dark:bg-slate-800 p-1.5 rounded">
                                    <span className="text-slate-400 block text-[9px] font-sans">{language === "ar" ? "الركام Dmax" : "Dmax"}</span>
                                    <span className="font-bold text-sky-600">{curElem.recommendedDmax} mm</span>
                                  </div>
                                  <div className="bg-sky-50 dark:bg-slate-800 p-1.5 rounded">
                                    <span className="text-slate-400 block text-[9px] font-sans">{language === "ar" ? "أدنى إسمنت" : "Min Cement"}</span>
                                    <span className="font-bold text-sky-600">{curElem.minCementKgM3} kg/m³</span>
                                  </div>
                                </div>
                                <div className="bg-amber-500/10 dark:bg-amber-500/5 p-2 rounded text-[10px] text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  <strong>💡 {language === "ar" ? "توصية هندسية:" : "Advice:"}</strong> {curElem.engineeringAdviceAr}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="mt-2.5">
                          <MethodReadinessChecklist 
                            methodId="dreux-gorisse"
                            inputs={normalizedInputsForCalc}
                            language={language}
                            materialsDatabase={materialsDatabase}
                            setActiveSidebarTab={setActiveSidebarTab}
                          />
                        </div>
                      </div>

                      {/* Slump consistency */}
                      <div className={`p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850 ${isRtl ? "text-right" : "text-left"} ${isFieldDisabled("slump") ? "opacity-35 pointer-events-none select-none grayscale" : ""}`}>
                        <InteractiveTooltip termKey="slump" language={language}>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 cursor-help">
                            {t("slump_label")}
                          </label>
                        </InteractiveTooltip>
                        <select
                          value={inputs.slump}
                          disabled={isFieldDisabled("slump")}
                          onChange={(e) => setInputs(prev => ({ ...prev, slump: parseInt(e.target.value) }))}
                          className="w-full text-xs p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white_important cursor-pointer text-slate-800 dark:text-slate-200"
                        >
                          <option value="2">
                            {language === "fr" ? "Terre Humide (0-20 mm - Béton démoulé immédiat)" : language === "en" ? "Very Dry (0-20 mm - precast/road paving)" : "جاف متماسك جداً (0-20 mm - دك ميكانيكي مسبق الصنع)"}
                          </option>
                          <option value="4">
                            {language === "fr" ? "Ferme (30-50 mm - fondations et dalles)" : language === "en" ? "Semi-dry / Abram's (30-50 mm - bridges / base)" : "بلاستيكي معتدل (30-50 mm - لدن عادي صب الجسور)"}
                          </option>
                          <option value="8">
                            {language === "fr" ? "Plastique (60-90 mm - structures courantes)" : language === "en" ? "Standard Plastic (60-90 mm - general columns / slabs)" : "لدن انسيابي عياري (60-90 mm - صب الهياكل العادية بالأعمدة)"}
                          </option>
                          <option value="12">
                            {language === "fr" ? "Très Plastique (100-150 mm - bétonnage par pompe)" : language === "en" ? "Very Plastic / Pumpable (100-150 mm - pump concrete)" : "لدن جداً / للتوصيل بالمضخة (100-150 mm - صب خرسانة بمضخة)"}
                          </option>
                          <option value="17">
                            {language === "fr" ? "Fluide (≥160 mm - béton autoplaçant)" : language === "en" ? "Fluid / Self-Leveling (≥160 mm - highly reinforced / no vibration)" : "سائل ذاتي التسوية (≥160 mm - صب مكثف حديدي بلا هزاز)"}
                          </option>
                        </select>
                      </div>

                      {/* Dmax size */}
                      <div className={`p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850 ${isRtl ? "text-right" : "text-left"} ${isFieldDisabled("dMax") ? "opacity-35 pointer-events-none select-none grayscale" : ""}`}>
                        <div className="flex justify-between items-center mb-1">
                          <InteractiveTooltip termKey="dmax" language={language}>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block cursor-help">{t("dmax_dropdown_label")}</label>
                          </InteractiveTooltip>
                          {inputs.labOverrides?.dMax ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveOverride("dMax")}
                              className="text-[10px] text-red-500 hover:underline"
                            >
                              {language === "ar" ? "إلغاء التجاوز" : "Cancel Override"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenOverrideForm("dMax", inputs.dMax)}
                              className="text-[10px] text-amber-600 hover:underline"
                            >
                              {language === "ar" ? "تجاوز مخبري" : "Lab Override"}
                            </button>
                          )}
                        </div>
                        <select
                          value={inputs.dMax}
                          disabled={isFieldDisabled("dMax") || !inputs.labOverrides?.dMax}
                          onChange={(e) => setInputs(prev => ({ ...prev, dMax: parseFloat(e.target.value) }))}
                          className={`w-full text-xs p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer text-slate-800 dark:text-slate-200 ${!inputs.labOverrides?.dMax ? "opacity-75 bg-slate-100 dark:bg-slate-800" : ""}`}
                        >
                          <option value="8">{t("dmax_8")}</option>
                          <option value="12.5">12.5 mm</option>
                          <option value="16">16 mm</option>
                          <option value="20">{t("dmax_20")}</option>
                          <option value="25">25 mm</option>
                          <option value="31.5">31.5 mm</option>
                          <option value="40">{t("dmax_40")}</option>
                        </select>
                        {inputs.labOverrides?.dMax && (
                          <div className="text-[9px] text-amber-600 mt-1 leading-normal p-1 bg-amber-500/5 rounded border border-amber-500/10">
                            ⚠️ {language === "ar" ? `معدل مخبرياً: الأصل (${inputs.labOverrides.dMax.originalMaterialValue} mm). السبب: ${inputs.labOverrides.dMax.reason}` : `Overridden: Original (${inputs.labOverrides.dMax.originalMaterialValue} mm). Reason: ${inputs.labOverrides.dMax.reason}`}
                          </div>
                        )}
                      </div>

                      {/* Site Quality Control */}
                      <div className={`p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850 ${isRtl ? "text-right" : "text-left"}`}>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">{t("control_class_label")}</label>
                        <select
                          value={inputs.controlClass}
                          onChange={(e) => setInputs(prev => ({ ...prev, controlClass: e.target.value as any }))}
                          className="w-full text-xs p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                        >
                          <option value="high">{t("qc_high")}</option>
                          <option value="normal">{t("qc_normal")}</option>
                          <option value="low">{t("qc_low")}</option>
                        </select>
                      </div>

                    </div>

                    {/* Pumpability and details */}
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 font-sans">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{t("pumping_title")}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{t("pumping_desc")}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={inputs.hasPumping}
                        onChange={(e) => setInputs({ ...inputs, hasPumping: e.target.checked })}
                        className="w-4 h-4 cursor-pointer accent-blue-500 rounded"
                      />
                    </div>
                  </div>

                  {/* STEP 2: SMART SUGGESTIONS AND RECOMMENDATIONS CARD */}
                  <Suspense fallback={
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 text-center text-xs text-amber-600 font-semibold flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري تحميل المساعد الذكي لاقتراح المواد...</span>
                    </div>
                  }>
                    <SmartMaterialsSuggester
                      concreteType={inputs.concreteType || "NSC"}
                      fck28={inputs.fck28 || 25}
                      materialsDatabase={materialsDatabase}
                      onApplySuggestions={handleApplySmartSuggestions}
                      language={language}
                    />
                  </Suspense>

                  {/* STEP 2: MATERIALS USER SELECTION */}
                  <div className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 ${isRtl ? "text-right" : "text-left"}`} id="step3-materials-selection">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">2</span>
                        <span>{t("step3_header")}</span>
                      </h4>
                      <span className="text-[10px] bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded font-black">{t("ready_for_matching")}</span>
                    </div>

                    {(() => {
                      const concreteCode = (inputs.concreteType || "NSC").toUpperCase();
                      const activeConfig = CONCRETE_TYPE_CONFIGS[concreteCode];
                      const isCementAllowed = activeConfig ? activeConfig.allowedCategories.includes("إسمنت") || activeConfig.allowedCategories.includes("مجلدات خاصة") : true;
                      const isSandAllowed = activeConfig ? activeConfig.allowedCategories.includes("رمال") : true;
                      const isGravelAllowed = activeConfig ? activeConfig.allowedCategories.some(cat => ["حصى", "ركام خفيف", "ركام ثقيل"].includes(cat)) : true;
                      const isWaterAllowed = activeConfig ? activeConfig.allowedCategories.includes("ماء") : true;
                      const isAdmixtureAllowed = activeConfig ? activeConfig.allowedCategories.includes("إضافات كيميائية") : true;
                      const isScmAllowed = activeConfig ? activeConfig.allowedCategories.includes("إضافات معدنية") : true;
                      const isFiberAllowed = activeConfig ? activeConfig.allowedCategories.includes("ألياف") : true;
                      const isSpecialBinderAllowed = activeConfig ? activeConfig.allowedCategories.includes("مجلدات خاصة") : true;

                      const cementList = materialsDatabase.filter(m => (m.category === "إسمنت" || m.category === "مجلدات خاصة") && isApprovedAndActive(m));
                      const sandList = materialsDatabase.filter(m => m.category === "رمال" && isApprovedAndActive(m));
                      const gravelList = materialsDatabase.filter(m => (m.category === "حصى" || m.category === "ركام خفيف" || m.category === "ركام ثقيل") && isApprovedAndActive(m));
                      const waterList = materialsDatabase.filter(m => (m.category === "ماء" || m.type === "water") && isApprovedAndActive(m));

                      return (
                        <>
                          {/* Section A: Basic Constituents */}
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>{language === "ar" ? "المكونات الأساسية للخلطة الخرسانية (Base Constituents)" : language === "fr" ? "Constituants de Base du Béton" : "Basic Concrete Constituents"}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            
                            {/* Cement selection */}
                            {isCementAllowed && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800 space-y-2.5">
                                <div className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800 pb-1 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  <span>{t("cement_calibration")}</span>
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-500 block mb-1">{t("cement_type_available")}</label>
                                  <select
                                    value={inputs.selectedCementId || ""}
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      if (!selectedId) {
                                        setInputs(prev => ({
                                          ...prev,
                                          selectedCementId: "",
                                          cementType: "",
                                          cementDensity: 0,
                                          priceCement: 0
                                        }));
                                        return;
                                      }
                                      const matchedMat = materialsDatabase.find(m => m.id === selectedId);
                                      const dens = matchedMat ? matchedMat.density : 0;
                                      const price = matchedMat?.price || 17;
                                      const strClass = matchedMat ? parseFloat(matchedMat.strengthClass || matchedMat.cementClassStrength) : undefined;
                                      setInputs(prev => ({ 
                                        ...prev, 
                                        cementType: matchedMat ? matchedMat.name : prev.cementType,
                                        cementDensity: dens,
                                        priceCement: price,
                                        cementClassStrength: strClass || prev.cementClassStrength,
                                        selectedCementId: selectedId
                                      }));
                                    }}
                                    className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                  >
                                    <option value="">{language === "ar" ? "اختر مادة من المستودع" : language === "fr" ? "Choisir un matériau du dépôt" : "Select material from repository"}</option>
                                    {materialsDatabase.filter(m => {
                                      return (m.category === "إسمنت" || m.category === "مجلدات خاصة") && isApprovedAndActive(m) && activeConfig && activeConfig.isMaterialCompatible(m);
                                    }).map(m => (
                                      <option key={m.id} value={m.id} className={isUserMaterial(m) ? "text-amber-600 font-semibold" : "text-slate-600"}>
                                        {getMaterialOptionLabel(m)}
                                      </option>
                                    ))}
                                  </select>
                                  {renderMaterialSourceBadge(inputs.selectedCementId)}
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-500 block mb-1">{t("cement_class_strength_label")}</label>
                                  <select
                                    value={inputs.cementClassStrength}
                                    onChange={(e) => setInputs(prev => ({ ...prev, cementClassStrength: parseFloat(e.target.value) }))}
                                    className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                  >
                                    <option value="32.5">{t("cem_32")}</option>
                                    <option value="42.5">{t("cem_42")}</option>
                                    <option value="52.5">{t("cem_52")}</option>
                                  </select>
                                </div>
                                {cementList.length === 0 && (
                                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-600 dark:text-red-400 font-bold space-y-1">
                                    <p>⚠️ {language === "ar" ? "مستودع المواد فارغ من الإسمنت المعتمد!" : "No approved cement in the repository!"}</p>
                                    <button 
                                      type="button" 
                                      onClick={() => setActiveSidebarTab("materials_library")}
                                      className="underline hover:text-red-700 dark:hover:text-red-300 font-black block"
                                    >
                                      {language === "ar" ? "اضغط هنا لإضافة الإسمنت المطلوب للمستودع 📁" : "Click here to add the required cement to the repository 📁"}
                                    </button>
                                  </div>
                                )}
                                {cementList.length > 0 && !inputs.selectedCementId && (
                                  <div className="mt-1.5 p-1.5 bg-amber-500/5 border border-amber-500/15 rounded text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    ⚠️ {language === "ar" ? "الرجاء اختيار الإسمنت المعتمد من القائمة." : "Please select approved cement."}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Sand Selection */}
                            {isSandAllowed && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800 space-y-2.5">
                                <div className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800 pb-1 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                  <span>{t("sand_calibration")}</span>
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-500 block mb-1">{t("sand_types_available")}</label>
                                  <select
                                    value={inputs.selectedSandId || ""}
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      if (!selectedId) {
                                        setInputs(prev => ({
                                          ...prev,
                                          selectedSandId: "",
                                          sandType: "",
                                          sandRelativeDensity: 0,
                                          priceSand: 0,
                                          sandAbsorption: 0,
                                          moistureSand: 0,
                                          finenessModulus: 0
                                        }));
                                        return;
                                      }
                                      const matchedMat = materialsDatabase.find(m => m.id === selectedId);
                                      const dens = matchedMat ? (matchedMat.density || matchedMat.specificGravity || 0) : 0;
                                      const price = matchedMat?.price || 2.5;
                                      const abs = matchedMat ? (matchedMat.absorption !== undefined ? matchedMat.absorption : 0) : 0;
                                      const moist = matchedMat ? (matchedMat.moisture !== undefined ? matchedMat.moisture : 0) : 0;
                                      setInputs(prev => ({
                                        ...prev,
                                        sandType: matchedMat ? matchedMat.name : prev.sandType,
                                        sandRelativeDensity: dens,
                                        priceSand: price,
                                        sandAbsorption: abs,
                                        moistureSand: moist,
                                        finenessModulus: matchedMat?.finenessModulus || prev.finenessModulus,
                                        selectedSandId: selectedId
                                      }));
                                      if (matchedMat) {
                                        setSelectedMaterialForInfo(matchedMat.name);
                                      }
                                    }}
                                    className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                  >
                                    <option value="">{language === "ar" ? "اختر مادة من المستودع" : language === "fr" ? "Choisir un matériau du dépôt" : "Select material from repository"}</option>
                                    {materialsDatabase.filter(m => m.category === "رمال" && isApprovedAndActive(m) && activeConfig && activeConfig.isMaterialCompatible(m)).map(m => (
                                      <option key={m.id} value={m.id} className={isUserMaterial(m) ? "text-amber-600 font-semibold" : "text-slate-600"}>
                                        {getMaterialOptionLabel(m)}
                                      </option>
                                    ))}
                                  </select>
                                  {renderMaterialSourceBadge(inputs.selectedSandId)}
                                </div>
                                <p className="text-[9px] text-slate-400 font-sans leading-normal">
                                  {t("sand_influence_tip")}
                                </p>
                                {sandList.length === 0 && (
                                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-600 dark:text-red-400 font-bold space-y-1">
                                    <p>⚠️ {language === "ar" ? "مستودع الركام فارغ من الرمل المعتمد!" : "No approved sand in the repository!"}</p>
                                    <button 
                                      type="button" 
                                      onClick={() => setActiveSidebarTab("materials_library")}
                                      className="underline hover:text-red-700 dark:hover:text-red-300 font-black block text-right"
                                    >
                                      {language === "ar" ? "اضغط هنا لإضافة الرمل المطلوب للمستودع 📁" : "Click here to add the required sand to the repository 📁"}
                                    </button>
                                  </div>
                                )}
                                {sandList.length > 0 && !inputs.selectedSandId && (
                                  <div className="mt-1.5 p-1.5 bg-amber-500/5 border border-amber-500/15 rounded text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    ⚠️ {language === "ar" ? "الرجاء اختيار الرمل المعتمد من القائمة." : "Please select approved sand."}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Coarse aggregates */}
                            {isGravelAllowed && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800 space-y-2.5">
                                <div className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800 pb-1 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                  <span>{t("gravel_calibration")}</span>
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-500 block mb-1">{t("gravel_types_available")}</label>
                                  <select
                                    value={inputs.selectedGravelId || ""}
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      if (!selectedId) {
                                        setInputs(prev => ({
                                          ...prev,
                                          selectedGravelId: "",
                                          gravelType: "",
                                          gravelRelativeDensity: 0,
                                          priceGravel: 0,
                                          gravelAbsorption: 0,
                                          moistureGravel: 0,
                                          dMax: 20
                                        }));
                                        return;
                                      }
                                      const matchedMat = materialsDatabase.find(m => m.id === selectedId);
                                      const dens = matchedMat ? (matchedMat.density || matchedMat.specificGravity || 0) : 0;
                                      const price = matchedMat?.price || 2.8;
                                      const abs = matchedMat ? (matchedMat.absorption !== undefined ? matchedMat.absorption : 0) : 0;
                                      const moist = matchedMat ? (matchedMat.moisture !== undefined ? matchedMat.moisture : 0) : 0;
                                      const maxS = matchedMat?.dMax || inputs.dMax || 20;
                                      const shape = matchedMat?.particleShape === "مكسر" || matchedMat?.particleShape === "زاوي" ? AggregateType.CONCASSE : AggregateType.ROULE;
                                      
                                      let qualityVal = AggregateQuality.STANDARD;
                                      if (matchedMat) {
                                        if (matchedMat.aggregateQuality === "excellent") {
                                          qualityVal = AggregateQuality.EXCELLENT;
                                        } else if (matchedMat.aggregateQuality === "poor") {
                                          qualityVal = AggregateQuality.POOR;
                                        } else if (matchedMat.aggregateQuality === "standard") {
                                          qualityVal = AggregateQuality.STANDARD;
                                        } else {
                                          const qStr = String(matchedMat.quality || "").toLowerCase();
                                          if (qStr.includes("excellent") || qStr.includes("ممتاز") || qStr.includes("عالي")) {
                                            qualityVal = AggregateQuality.EXCELLENT;
                                          } else if (qStr.includes("poor") || qStr.includes("ضعيف") || qStr.includes("متوسط")) {
                                            qualityVal = AggregateQuality.POOR;
                                          } else {
                                            qualityVal = AggregateQuality.STANDARD;
                                          }
                                          
                                          if (matchedMat.losAngelesAbrasion !== undefined) {
                                            const la = matchedMat.losAngelesAbrasion;
                                            if (la < 15) qualityVal = AggregateQuality.EXCELLENT;
                                            else if (la > 30) qualityVal = AggregateQuality.POOR;
                                          }
                                        }
                                      }

                                      setInputs(prev => ({
                                        ...prev,
                                        gravelType: matchedMat ? matchedMat.name : prev.gravelType,
                                        gravelRelativeDensity: dens,
                                        priceGravel: price,
                                        gravelAbsorption: abs,
                                        moistureGravel: moist,
                                        dMax: maxS,
                                        aggregateType: shape,
                                        aggregateQuality: qualityVal,
                                        selectedGravelId: selectedId
                                      }));
                                      if (matchedMat) {
                                        setSelectedMaterialForInfo(matchedMat.name);
                                      }
                                    }}
                                    className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                  >
                                    <option value="">{language === "ar" ? "اختر مادة من المستودع" : language === "fr" ? "Choisir un matériau du dépôt" : "Select material from repository"}</option>
                                    {materialsDatabase.filter(m => (m.category === "حصى" || m.category === "ركام خفيف" || m.category === "ركام ثقيل") && isApprovedAndActive(m) && activeConfig && activeConfig.isMaterialCompatible(m)).map(m => (
                                      <option key={m.id} value={m.id} className={isUserMaterial(m) ? "text-amber-600 font-semibold" : "text-slate-600"}>
                                        {getMaterialOptionLabel(m)}
                                      </option>
                                    ))}
                                  </select>
                                  {renderMaterialSourceBadge(inputs.selectedGravelId)}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 bg-slate-100/50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/60">
                                  <div>
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mb-0.5">{t("grain_shape")}</span>
                                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                      <span>
                                        {inputs.aggregateType === AggregateType.CONCASSE 
                                          ? (language === "ar" ? "مكسر / زاوي (آلي)" : "Crushed / Angular (Auto)")
                                          : (language === "ar" ? "مستدير (آلي)" : "Rounded (Auto)")}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mb-0.5">{t("grading_quality")}</span>
                                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                      <span>
                                        {inputs.aggregateQuality === AggregateQuality.EXCELLENT 
                                          ? (language === "ar" ? "ممتاز (آلي)" : "Excellent (Auto)")
                                          : inputs.aggregateQuality === AggregateQuality.POOR
                                          ? (language === "ar" ? "ضعيف (آلي)" : "Poor (Auto)")
                                          : (language === "ar" ? "عادي / قياسي (آلي)" : "Standard (Auto)")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {gravelList.length === 0 && (
                                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-600 dark:text-red-400 font-bold space-y-1">
                                    <p>⚠️ {language === "ar" ? "مستودع الركام فارغ من الحصى المعتمد!" : "No approved gravel in the repository!"}</p>
                                    <button 
                                      type="button" 
                                      onClick={() => setActiveSidebarTab("materials_library")}
                                      className="underline hover:text-red-700 dark:hover:text-red-300 font-black block text-right"
                                    >
                                      {language === "ar" ? "اضغط هنا لإضافة الحصى المطلوب للمستودع 📁" : "Click here to add the required gravel to the repository 📁"}
                                    </button>
                                  </div>
                                )}
                                {gravelList.length > 0 && !inputs.selectedGravelId && (
                                  <div className="mt-1.5 p-1.5 bg-amber-500/5 border border-amber-500/15 rounded text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    ⚠️ {language === "ar" ? "الرجاء اختيار الحصى المعتمد من القائمة." : "Please select approved gravel."}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Water Selection */}
                            {isWaterAllowed && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800 space-y-2.5">
                                <div className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800 pb-1 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  <span>{language === "ar" ? "معايرة مياه الخلط" : language === "fr" ? "Calibrage de l'eau" : "Water Calibration"}</span>
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-500 block mb-1">
                                    {language === "ar" ? "مياه الخلط المتوفرة في المستودع" : language === "fr" ? "Eaux de gâchage disponibles" : "Available mixing waters"}
                                  </label>
                                  <select
                                    value={inputs.selectedWaterId || ""}
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      if (!selectedId) {
                                        setInputs(prev => ({
                                          ...prev,
                                          selectedWaterId: "",
                                          selectedWaterName: "",
                                          priceWater: 0,
                                          selectedWaterPH: 7,
                                          selectedWaterChlorideContent: 0,
                                          selectedWaterSulphateContent: 0,
                                          selectedWaterTemperature: 20
                                        }));
                                        return;
                                      }
                                      const matchedMat = materialsDatabase.find(m => m.id === selectedId);
                                      const pH = matchedMat?.engineeringData?.pH || (matchedMat as any)?.pH || 7;
                                      const chloride = matchedMat?.engineeringData?.chloride || (matchedMat as any)?.chlorideContent || 0;
                                      const sulphate = matchedMat?.engineeringData?.sulphate || (matchedMat as any)?.sulphateContent || 0;
                                      const temp = matchedMat?.engineeringData?.temperature || (matchedMat as any)?.temperature || 20;
                                      setInputs(prev => ({
                                        ...prev,
                                        selectedWaterId: selectedId,
                                        selectedWaterName: matchedMat ? matchedMat.name : "",
                                        priceWater: matchedMat?.price || prev.priceWater,
                                        selectedWaterPH: pH,
                                        selectedWaterChlorideContent: chloride,
                                        selectedWaterSulphateContent: sulphate,
                                        selectedWaterTemperature: temp
                                      }));
                                    }}
                                    className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                  >
                                    <option value="">{language === "ar" ? "اختر مادة من المستودع" : language === "fr" ? "Choisir un matériau du dépôt" : "Select material from repository"}</option>
                                    {materialsDatabase.filter(m => (m.category === "ماء" || m.type === "water") && isApprovedAndActive(m) && activeConfig && activeConfig.isMaterialCompatible(m)).map(m => (
                                      <option key={m.id} value={m.id} className={isUserMaterial(m) ? "text-amber-600 font-semibold" : "text-slate-600"}>
                                        {getMaterialOptionLabel(m)}
                                      </option>
                                    ))}
                                  </select>
                                  {renderMaterialSourceBadge(inputs.selectedWaterId)}
                                </div>
                                <p className="text-[9px] text-slate-400 font-sans leading-normal">
                                  {language === "ar" ? "مياه خلط خرسانية معالجة ومطابقة لمعايير المتانة الكيميائية." : language === "fr" ? "Eau traitée conforme aux normes de durabilité chimique." : "Treated mixing water complying with chemical durability standards."}
                                </p>
                                {waterList.length === 0 && (
                                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-600 dark:text-red-400 font-bold space-y-1">
                                    <p>⚠️ {language === "ar" ? "مستودع المواد فارغ من مياه الخلط المعتمدة!" : "No approved water in the repository!"}</p>
                                    <button 
                                      type="button" 
                                      onClick={() => setActiveSidebarTab("materials_library")}
                                      className="underline hover:text-red-700 dark:hover:text-red-300 font-black block text-right"
                                    >
                                      {language === "ar" ? "اضغط هنا لإضافة مياه الخلط المطلوبة للمستودع 📁" : "Click here to add the required water to the repository 📁"}
                                    </button>
                                  </div>
                                )}
                                {waterList.length > 0 && !inputs.selectedWaterId && (
                                  <div className="mt-1.5 p-1.5 bg-amber-500/5 border border-amber-500/15 rounded text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    ⚠️ {language === "ar" ? "الرجاء اختيار مياه الخلط المعتمدة." : "Please select approved water."}
                                  </div>
                                )}
                              </div>
                            )}

                          </div>

                          {/* Section B: Specialized Materials & Additions */}
                          {(isAdmixtureAllowed || isScmAllowed || isFiberAllowed || isSpecialBinderAllowed) && (
                            <>
                              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>{language === "ar" ? "الإضافات المتخصصة والمحسنات والألياف (Advanced Materials)" : language === "fr" ? "Adjuvants Spéciaux & Matériaux Avancés" : "Specialized Admixtures & Advanced Materials"}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                {/* Chemical Admixtures Selection */}
                                {isAdmixtureAllowed && (
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800 space-y-2.5">
                                    <div className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800 pb-1 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      <span>{language === "ar" ? "المضافات الكيميائية:" : language === "fr" ? "Adjuvants chimiques :" : "Chemical Admixtures:"}</span>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-1">
                                        {language === "ar" ? "المضافات المتاحة في المستودع" : language === "fr" ? "Adjuvants du dépôt" : "Admixtures from warehouse"}
                                      </label>
                                      <select
                                        value={inputs.selectedAdmixtureId || ""}
                                        onChange={(e) => {
                                          const selectedId = e.target.value;
                                          if (!selectedId) {
                                            setInputs(prev => ({
                                              ...prev,
                                              selectedAdmixtureId: "",
                                              dosageSuper: 0,
                                              dosageAir: 0,
                                              dosageRetarder: 0,
                                              dosageAccelerator: 0
                                            }));
                                            return;
                                          }
                                          const matchedMat = materialsDatabase.find(m => m.id === selectedId);
                                          if (matchedMat) {
                                            const recDos = matchedMat.recommendedDosage || 1.0;
                                            let dosSuper = 0;
                                            let dosAir = 0;
                                            let dosRetarder = 0;
                                            let dosAcc = 0;

                                            if (matchedMat.admixtureType === "superplasticizer") dosSuper = recDos;
                                            else if (matchedMat.admixtureType === "air_entraining") dosAir = recDos;
                                            else if (matchedMat.admixtureType === "retarder") dosRetarder = recDos;
                                            else if (matchedMat.admixtureType === "accelerator") dosAcc = recDos;

                                            setInputs(prev => ({
                                              ...prev,
                                              selectedAdmixtureId: selectedId,
                                              dosageSuper: dosSuper || prev.dosageSuper,
                                              dosageAir: dosAir || prev.dosageAir,
                                              dosageRetarder: dosRetarder || prev.dosageRetarder,
                                              dosageAccelerator: dosAcc || prev.dosageAccelerator,
                                              priceSuper: matchedMat.admixtureType === "superplasticizer" ? (matchedMat.price || prev.priceSuper) : prev.priceSuper,
                                              priceAir: matchedMat.admixtureType === "air_entraining" ? (matchedMat.price || prev.priceAir) : prev.priceAir,
                                              priceRetarder: matchedMat.admixtureType === "retarder" ? (matchedMat.price || prev.priceRetarder) : prev.priceRetarder,
                                              priceAccelerator: matchedMat.admixtureType === "accelerator" ? (matchedMat.price || prev.priceAccelerator) : prev.priceAccelerator
                                            }));
                                          }
                                        }}
                                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                      >
                                        <option value="">{language === "ar" ? "اختر مادة من المستودع" : language === "fr" ? "Choisir un adjuvant" : "Select from repository"}</option>
                                        {materialsDatabase.filter(m => m.category === "إضافات كيميائية" && isApprovedAndActive(m) && activeConfig && activeConfig.isMaterialCompatible(m)).map(m => (
                                          <option key={m.id} value={m.id} className={isUserMaterial(m) ? "text-amber-600 font-semibold" : "text-slate-600"}>
                                            {getMaterialOptionLabel(m)}
                                          </option>
                                        ))}
                                      </select>
                                      {renderMaterialSourceBadge(inputs.selectedAdmixtureId)}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-sans leading-normal">
                                      {language === "ar" ? "تتحكم في قوام وتشغيلية المزيج وزمن الشك ونسبة الماء إلى الإسمنت." : language === "fr" ? "Contrôle la plasticité, la maniabilité et le temps de prise." : "Controls mix consistency, fluidity, workability, and setting time."}
                                    </p>
                                  </div>
                                )}

                                {/* Mineral Admixtures (SCM) & Fillers Selection */}
                                {isScmAllowed && (
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800 space-y-2.5">
                                    <div className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800 pb-1 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                      <span>{language === "ar" ? "الإضافات المعدنية والمالئة:" : language === "fr" ? "Additions minérales & Fillers :" : "Mineral Additions & Fillers:"}</span>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-1">
                                        {language === "ar" ? "المحسنات الميتالوجية والمالئة" : language === "fr" ? "Additions et fillers du dépôt" : "SCMs & fillers from repository"}
                                      </label>
                                      <select
                                        value={inputs.selectedScmId || ""}
                                        onChange={(e) => {
                                          const selectedId = e.target.value;
                                          if (!selectedId) {
                                            setInputs(prev => ({
                                              ...prev,
                                              selectedScmId: "",
                                              selectedScmName: "",
                                              selectedScmDensity: undefined,
                                              dosageSilicaFume: 0,
                                              dosageFlyAsh: 0,
                                              dosageSlag: 0
                                            }));
                                            return;
                                          }
                                          const matchedMat = materialsDatabase.find(m => m.id === selectedId);
                                          if (matchedMat) {
                                            const dens = matchedMat.density || 2200;
                                            const recDos = matchedMat.recommendedDosage || 15;
                                            const price = matchedMat.price || 0;
                                            
                                            const scmNameLower = (matchedMat.name || "").toLowerCase();
                                            const scmEngLower = (matchedMat.englishName || "").toLowerCase();

                                            let isSilica = scmNameLower.includes("سيليكا") || scmEngLower.includes("silica");
                                            let isFlyAsh = scmNameLower.includes("رماد") || scmEngLower.includes("fly ash") || scmEngLower.includes("fly_ash");
                                            let isSlag = scmNameLower.includes("خبث") || scmEngLower.includes("slag");

                                            setInputs(prev => ({
                                              ...prev,
                                              selectedScmId: selectedId,
                                              selectedScmName: matchedMat.name,
                                              selectedScmDensity: dens,
                                              dosageSilicaFume: isSilica ? recDos : prev.dosageSilicaFume,
                                              dosageFlyAsh: isFlyAsh ? recDos : prev.dosageFlyAsh,
                                              dosageSlag: isSlag ? recDos : prev.dosageSlag,
                                              priceSilicaFume: isSilica ? (price || prev.priceSilicaFume) : prev.priceSilicaFume,
                                              priceFlyAsh: isFlyAsh ? (price || prev.priceFlyAsh) : prev.priceFlyAsh,
                                              priceSlag: isSlag ? (price || prev.priceSlag) : prev.priceSlag
                                            }));
                                          }
                                        }}
                                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                      >
                                        <option value="">{language === "ar" ? "اختر مادة من المستودع" : language === "fr" ? "Choisir une addition" : "Select from repository"}</option>
                                        {materialsDatabase.filter(m => (m.category === "إضافات معدنية" || m.category === "مواد مالئة") && isApprovedAndActive(m) && activeConfig && activeConfig.isMaterialCompatible(m)).map(m => (
                                          <option key={m.id} value={m.id} className={isUserMaterial(m) ? "text-amber-600 font-semibold" : "text-slate-600"}>
                                            {getMaterialOptionLabel(m)}
                                          </option>
                                        ))}
                                      </select>
                                      {renderMaterialSourceBadge(inputs.selectedScmId)}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-sans leading-normal">
                                      {language === "ar" ? "تغلق الفراغات المجهرية للخرسانة وتزيد من متانتها الكيميائية ومقاومتها طويلة المدى." : language === "fr" ? "Améliore la compacité et la résistance aux attaques chimiques." : "Improves concrete compacity, density, and chemical attack resistance."}
                                    </p>
                                  </div>
                                )}

                                {/* Fiber Reinforcement Selection */}
                                {isFiberAllowed && (
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800 space-y-2.5">
                                    <div className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800 pb-1 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      <span>{language === "ar" ? "ألياف التسليح الخرساني:" : language === "fr" ? "Fibres de renforcement :" : "Structural Fibers:"}</span>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-1">
                                        {language === "ar" ? "ألياف الصلب والبوليمر" : language === "fr" ? "Fibres du dépôt" : "Fibers from repository"}
                                      </label>
                                      <select
                                        value={inputs.selectedFiberId || ""}
                                        onChange={(e) => {
                                          const selectedId = e.target.value;
                                          if (!selectedId) {
                                            setInputs(prev => ({
                                              ...prev,
                                              selectedFiberId: "",
                                              selectedFiberName: "",
                                              fiberDensity: undefined,
                                              fiberDosageKgM3: 0,
                                              priceFiber: 0
                                            }));
                                            return;
                                          }
                                          const matchedMat = materialsDatabase.find(m => m.id === selectedId);
                                          if (matchedMat) {
                                            const dens = matchedMat.density || 7850;
                                            const recDos = matchedMat.recommendedDosage || (matchedMat as any).fiberDosageKgM3 || 25;
                                            const price = matchedMat.price || 250;
                                            const fType = matchedMat.fiberType || (matchedMat as any).type || "steel";

                                            setInputs(prev => ({
                                              ...prev,
                                              selectedFiberId: selectedId,
                                              selectedFiberName: matchedMat.name,
                                              fiberDensity: dens,
                                              fiberDosageKgM3: recDos,
                                              priceFiber: price,
                                              fiberType: fType,
                                              concreteType: prev.concreteType === "NSC" ? "FRC" : prev.concreteType
                                            }));
                                          }
                                        }}
                                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                      >
                                        <option value="">{language === "ar" ? "اختر مادة من المستودع" : language === "fr" ? "Choisir des fibres" : "Select from repository"}</option>
                                        {materialsDatabase.filter(m => m.category === "ألياف" && isApprovedAndActive(m) && activeConfig && activeConfig.isMaterialCompatible(m)).map(m => (
                                          <option key={m.id} value={m.id} className={isUserMaterial(m) ? "text-amber-600 font-semibold" : "text-slate-600"}>
                                            {getMaterialOptionLabel(m)}
                                          </option>
                                        ))}
                                      </select>
                                      {renderMaterialSourceBadge(inputs.selectedFiberId)}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-sans leading-normal">
                                      {language === "ar" ? "تمنع شروخ الانكماش اللدن في السطح وتزيد من مرونة وتحمل المزيج." : language === "fr" ? "Prévient la fissuration et améliore la ductilité du béton." : "Prevents early cracking and improves structural ductility and toughness."}
                                    </p>
                                  </div>
                                )}

                                {/* Special Binders Selection */}
                                {isSpecialBinderAllowed && (
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800 space-y-2.5">
                                    <div className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800 pb-1 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      <span>{language === "ar" ? "الروابط والمجلدات الخاصة:" : language === "fr" ? "Liants spéciaux :" : "Special Binders:"}</span>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-1">
                                        {language === "ar" ? "روابط تخصصية وجيوبوليمر" : language === "fr" ? "Liants spéciaux du dépôt" : "Special binders from repository"}
                                      </label>
                                      <select
                                        value={inputs.selectedSpecialBinderId || ""}
                                        onChange={(e) => {
                                          const selectedId = e.target.value;
                                          if (!selectedId) {
                                            setInputs(prev => ({
                                              ...prev,
                                              selectedSpecialBinderId: "",
                                              selectedSpecialBinderName: "",
                                              specialBinderDensity: undefined,
                                              priceSpecialBinder: 0
                                            }));
                                            return;
                                          }
                                          const matchedMat = materialsDatabase.find(m => m.id === selectedId);
                                          if (matchedMat) {
                                            const dens = matchedMat.density || 2900;
                                            const price = matchedMat.price || 35;
                                            setInputs(prev => ({
                                              ...prev,
                                              selectedSpecialBinderId: selectedId,
                                              selectedSpecialBinderName: matchedMat.name,
                                              specialBinderDensity: dens,
                                              priceSpecialBinder: price,
                                              concreteType: matchedMat.name?.includes("جيوبوليمر") || matchedMat.name?.includes("Geopolymer") ? "GPC" : prev.concreteType
                                            }));
                                          }
                                        }}
                                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                      >
                                        <option value="">{language === "ar" ? "اختر مادة من المستودع" : language === "fr" ? "Choisir un liant" : "Select from repository"}</option>
                                        {materialsDatabase.filter(m => m.category === "مجلدات خاصة" && isApprovedAndActive(m) && activeConfig && activeConfig.isMaterialCompatible(m)).map(m => (
                                          <option key={m.id} value={m.id} className={isUserMaterial(m) ? "text-amber-600 font-semibold" : "text-slate-600"}>
                                            {getMaterialOptionLabel(m)}
                                          </option>
                                        ))}
                                      </select>
                                      {renderMaterialSourceBadge(inputs.selectedSpecialBinderId)}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-sans leading-normal">
                                      {language === "ar" ? "للروابط الصديقة للبيئة والخرسانة ذاتية الالتئام وبدائل الإسمنت البورتلاندي." : language === "fr" ? "Pour le béton géopolymère et les liants écologiques." : "For eco-friendly binders, self-healing mixes, and green concretes."}
                                    </p>
                                  </div>
                                )}

                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}

                    {/* Chemical and Pozollanic Admixtures Presets Footnote Alert */}
                    <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-[10px] leading-relaxed text-slate-755 dark:text-emerald-350 flex items-start gap-2 mt-3 font-sans">
                      <span className="bg-emerald-500 text-white font-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 mt-0.5 font-mono">i</span>
                      <div>
                        <strong>{t("active_chemical_additives")}: </strong>
                        <span>{getChemicalSuggestionsNote()}</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">{t("adjust_dosages_tip")}</span>
                      </div>
                    </div>

                  </div>

                  {/* STEP 3: PHYSICAL MATERIAL PROPERTIES CARD (AUTOMATIC IN NORMAL MODE, AUTO-DENSITIES) */}
                  <div className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 ${isRtl ? "text-right" : "text-left"}`} id="step4-material-properties">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">3</span>
                        <span>{t("step4_header")}</span>
                      </h4>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-sans">
                        {designerMode === "normal" ? t("smart_auto_generation") : t("expert_manual_input")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-normal">
                      {t("step4_desc")}
                    </p>

                    {/* Render standard properties card specifying inputs and handlers */}
                    <div>
                      <MaterialPropertiesCard
                        inputs={inputs}
                        setInputs={setInputs}
                        materials={materialsDatabase}
                        language={language}
                        onOpenLibrary={(category, materialId) => {
                          setViewMode("workspace");
                          setActiveSidebarTab("materials_library");
                          if (materialId) {
                            setTimeout(() => {
                              const triggerEdit = new CustomEvent("trigger-edit-material", { detail: { materialId } });
                              window.dispatchEvent(triggerEdit);
                            }, 100);
                          }
                        }}
                      />
                    </div>

                    {/* Lab Override Form Card */}
                    {activeOverrideProperty && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3 animate-fade-in my-3 text-right">
                        <div className="flex justify-between items-center border-b border-amber-500/25 pb-1.5">
                          <strong className="text-xs text-amber-800 dark:text-amber-400">
                            {language === "ar" ? "تسجيل تجاوز مخبري للمواصفات" : "Register Engineering Lab Override"}
                          </strong>
                          <button
                            type="button"
                            onClick={() => setActiveOverrideProperty(null)}
                            className="text-amber-800 hover:text-amber-950 font-bold text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-[11px] text-amber-700 leading-normal">
                          {language === "ar" 
                            ? `أنت تقوم بتعديل خاصية "${activeOverrideProperty}" يدويًا. لضمان الموثوقية والمطابقة الفنية، يجب توثيق أسباب هذا التعديل المخبري.` 
                            : `You are manually overriding the property "${activeOverrideProperty}". To ensure engineering traceability, you must document the reason.`}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">{language === "ar" ? "القيمة الجديدة المقترحة" : "New Override Value"}</label>
                            <input
                              type="number"
                              step="any"
                              value={overrideForm.overrideValue}
                              onChange={(e) => setOverrideForm(prev => ({ ...prev, overrideValue: parseFloat(e.target.value) || 0 }))}
                              className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">{language === "ar" ? "سبب التعديل الفني" : "Technical Reason"}</label>
                            <input
                              type="text"
                              required
                              placeholder={language === "ar" ? "مثال: نتائج فحص ميكانيكي لدفعة محددة" : "e.g. specific batch lab test results"}
                              value={overrideForm.reason}
                              onChange={(e) => setOverrideForm(prev => ({ ...prev, reason: e.target.value }))}
                              className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">{language === "ar" ? "اسم الفني / المخبر" : "Technician / Lab Name"}</label>
                            <input
                              type="text"
                              value={overrideForm.technician}
                              onChange={(e) => setOverrideForm(prev => ({ ...prev, technician: e.target.value }))}
                              className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">{language === "ar" ? "التاريخ" : "Date"}</label>
                            <input
                              type="date"
                              value={overrideForm.date}
                              onChange={(e) => setOverrideForm(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveOverrideProperty(null)}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded text-xs"
                          >
                            {language === "ar" ? "إلغاء" : "Cancel"}
                          </button>
                          <button
                            type="button"
                            disabled={!overrideForm.reason}
                            onClick={handleSaveOverride}
                            className={`px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-xs ${!overrideForm.reason ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {language === "ar" ? "تأكيد وحفظ التجاوز" : "Confirm and Save Override"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Extra manual density overrides visible ONLY in expert mode (تعديل الأوزان النوعية يدوياً) */}
                    {designerMode === "expert" && (
                      <div className={`p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3 animate-fade-in ${isRtl ? "text-right" : "text-left"}`}>
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <strong className="text-xs text-amber-700 dark:text-amber-400">{t("expert_density_overrides")}</strong>
                          <span className="text-[9px] bg-amber-500/15 text-amber-600 px-1.5 py-0.5 rounded font-black">{t("expert_mode_active")}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <div className="flex justify-between text-[11px] font-bold mb-1">
                              <span>{t("cement_abs_density")}</span>
                              <span className="text-blue-500">{inputs.cementDensity} kg/m³</span>
                            </div>
                            <input
                              type="range"
                              min="2900"
                              max="3250"
                              step="50"
                              disabled={!inputs.labOverrides?.cementDensity}
                              value={inputs.cementDensity}
                              onChange={(e) => setInputs(prev => ({ ...prev, cementDensity: parseInt(e.target.value) }))}
                              className={`w-full h-1 accent-amber-500 ${!inputs.labOverrides?.cementDensity ? "opacity-55 cursor-not-allowed" : ""}`}
                            />
                            <div className="mt-1 flex justify-between items-center text-[10px]">
                              {inputs.labOverrides?.cementDensity ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOverride("cementDensity")}
                                  className="text-red-500 hover:underline"
                                >
                                  {language === "ar" ? "إلغاء التجاوز المخبري" : "Cancel Override"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenOverrideForm("cementDensity", inputs.cementDensity)}
                                  className="text-amber-600 hover:underline"
                                >
                                  {language === "ar" ? "تجاوز مخبري (Lab Override)" : "Lab Override"}
                                </button>
                              )}
                            </div>
                            {inputs.labOverrides?.cementDensity && (
                              <div className="text-[9px] text-amber-600 mt-1 leading-normal p-1 bg-amber-500/5 rounded border border-amber-500/10">
                                ⚠️ {language === "ar" ? `معدل: الأصل (${inputs.labOverrides.cementDensity.originalMaterialValue}). السبب: ${inputs.labOverrides.cementDensity.reason}` : `Overridden: Original (${inputs.labOverrides.cementDensity.originalMaterialValue}). Reason: ${inputs.labOverrides.cementDensity.reason}`}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] font-bold mb-1">
                              <span>{t("sand_abs_density")}</span>
                              <span className="text-blue-500">{inputs.sandRelativeDensity} kg/m³</span>
                            </div>
                            <input
                              type="range"
                              min="2400"
                              max="2800"
                              step="10"
                              disabled={!inputs.labOverrides?.sandRelativeDensity}
                              value={inputs.sandRelativeDensity}
                              onChange={(e) => setInputs(prev => ({ ...prev, sandRelativeDensity: parseInt(e.target.value) }))}
                              className={`w-full h-1 accent-amber-500 ${!inputs.labOverrides?.sandRelativeDensity ? "opacity-55 cursor-not-allowed" : ""}`}
                            />
                            <div className="mt-1 flex justify-between items-center text-[10px]">
                              {inputs.labOverrides?.sandRelativeDensity ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOverride("sandRelativeDensity")}
                                  className="text-red-500 hover:underline"
                                >
                                  {language === "ar" ? "إلغاء التجاوز المخبري" : "Cancel Override"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenOverrideForm("sandRelativeDensity", inputs.sandRelativeDensity)}
                                  className="text-amber-600 hover:underline"
                                >
                                  {language === "ar" ? "تجاوز مخبري (Lab Override)" : "Lab Override"}
                                </button>
                              )}
                            </div>
                            {inputs.labOverrides?.sandRelativeDensity && (
                              <div className="text-[9px] text-amber-600 mt-1 leading-normal p-1 bg-amber-500/5 rounded border border-amber-500/10">
                                ⚠️ {language === "ar" ? `معدل: الأصل (${inputs.labOverrides.sandRelativeDensity.originalMaterialValue}). السبب: ${inputs.labOverrides.sandRelativeDensity.reason}` : `Overridden: Original (${inputs.labOverrides.sandRelativeDensity.originalMaterialValue}). Reason: ${inputs.labOverrides.sandRelativeDensity.reason}`}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] font-bold mb-1">
                              <span>{t("gravel_abs_density")}</span>
                              <span className="text-blue-500">{inputs.gravelRelativeDensity} kg/m³</span>
                            </div>
                            <input
                              type="range"
                              min="2400"
                              max="2900"
                              step="10"
                              disabled={!inputs.labOverrides?.gravelRelativeDensity}
                              value={inputs.gravelRelativeDensity}
                              onChange={(e) => setInputs(prev => ({ ...prev, gravelRelativeDensity: parseInt(e.target.value) }))}
                              className={`w-full h-1 accent-amber-500 ${!inputs.labOverrides?.gravelRelativeDensity ? "opacity-55 cursor-not-allowed" : ""}`}
                            />
                            <div className="mt-1 flex justify-between items-center text-[10px]">
                              {inputs.labOverrides?.gravelRelativeDensity ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOverride("gravelRelativeDensity")}
                                  className="text-red-500 hover:underline"
                                >
                                  {language === "ar" ? "إلغاء التجاوز المخبري" : "Cancel Override"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenOverrideForm("gravelRelativeDensity", inputs.gravelRelativeDensity)}
                                  className="text-amber-600 hover:underline"
                                >
                                  {language === "ar" ? "تجاوز مخبري (Lab Override)" : "Lab Override"}
                                </button>
                              )}
                            </div>
                            {inputs.labOverrides?.gravelRelativeDensity && (
                              <div className="text-[9px] text-amber-600 mt-1 leading-normal p-1 bg-amber-500/5 rounded border border-amber-500/10">
                                ⚠️ {language === "ar" ? `معدل: الأصل (${inputs.labOverrides.gravelRelativeDensity.originalMaterialValue}). السبب: ${inputs.labOverrides.gravelRelativeDensity.reason}` : `Overridden: Original (${inputs.labOverrides.gravelRelativeDensity.originalMaterialValue}). Reason: ${inputs.labOverrides.gravelRelativeDensity.reason}`}
                              </div>
                            )}
                          </div>
 

 
                        </div>
                      </div>
                    )}
                  </div>

{/* STEP 4: SITE Moisture levels AND ACTUAL FIELDS CONDITIONS */}
                  <div className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 ${isRtl ? "text-right" : "text-left"}`} id="step5-field-conditions">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">4</span>
                        <span>{t("step5_header")}</span>
                      </h4>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{t("scale_weights_calibration")}</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-normal">
                      {t("step5_desc")}
                    </p>

                    {inputs.isGranularOptimizedApproved && (
                      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-350 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <div className="bg-blue-500 text-white p-1 rounded-md mt-0.5">
                            <ArrowLeftRight size={14} />
                          </div>
                          <div className="text-left">
                            <h5 className="font-bold text-slate-900 dark:text-white">
                              {language === "ar" ? "الخصائص الفيزيائية وقيم الرطوبة مستوردة وتلقائية" : "Imported Engineering Physical & Moisture Properties"}
                            </h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {language === "ar" 
                                ? "يتم إدارة هذه القيم بالكامل بواسطة مستودع المواد والتحسين في مركز الهندسة الحبيبية لمنع التكرار وضمان تطابق البيانات." 
                                : "These physical, absorption and moisture parameters are managed by the Material Library or the Granular Engineering Center to prevent data duplication and maintain engineering traceability."}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-200/30 justify-start">
                          <button
                            type="button"
                            onClick={() => setActiveSidebarTab("materials")}
                            className="text-[10px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/40 flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                          >
                            <span>📁 {language === "ar" ? "فتح مستودع المواد" : "Open Material Library"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveSidebarTab("sieve")}
                            className="text-[10px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/40 flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                          >
                            <span>📐 {language === "ar" ? "فتح الهندسة الحبيبية" : "Open Granular Engineering"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sand moisture & absorption */}
                      <div className={`p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-500/10 ${isRtl ? "text-right" : "text-left"} space-y-4`}>
                        <div>
                          <div className="flex justify-between items-center text-xs mb-2">
                            <label className="font-extrabold text-slate-700 dark:text-slate-250 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                              <span>{t("sand_moisture_label")}</span>
                            </label>
                            <strong className="text-yellow-600 dark:text-yellow-400 font-mono text-xs">{inputs.moistureSand}%</strong>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="8"
                            step="0.5"
                            disabled={inputs.isGranularOptimizedApproved}
                            value={inputs.moistureSand}
                            onChange={(e) => setInputs(prev => ({ ...prev, moistureSand: parseFloat(e.target.value) }))}
                            className={`w-full h-1 accent-yellow-500 bg-slate-200 dark:bg-slate-800 cursor-pointer ${inputs.isGranularOptimizedApproved ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                          <span className="text-[9px] text-slate-400 block mt-1.5">
                            {t("sand_moisture_range")}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-amber-500/10">
                          <div className="flex justify-between items-center text-xs mb-2">
                            <label className="font-extrabold text-slate-700 dark:text-slate-250 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                              <span>{t("sand_absorption_label")}</span>
                            </label>
                            <strong className="text-orange-600 dark:text-orange-400 font-mono text-xs">{inputs.sandAbsorption !== undefined ? inputs.sandAbsorption : 0}%</strong>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="4"
                            step="0.1"
                            disabled={inputs.isGranularOptimizedApproved || !inputs.labOverrides?.sandAbsorption}
                            value={inputs.sandAbsorption !== undefined ? inputs.sandAbsorption : 0}
                            onChange={(e) => setInputs(prev => ({ ...prev, sandAbsorption: parseFloat(e.target.value) }))}
                            className={`w-full h-1 accent-orange-500 bg-slate-200 dark:bg-slate-800 cursor-pointer ${(inputs.isGranularOptimizedApproved || !inputs.labOverrides?.sandAbsorption) ? "opacity-55 cursor-not-allowed" : ""}`}
                          />
                          <div className="mt-1 flex justify-between items-center text-[10px]">
                            {inputs.labOverrides?.sandAbsorption ? (
                              <button
                                type="button"
                                disabled={inputs.isGranularOptimizedApproved}
                                onClick={() => handleRemoveOverride("sandAbsorption")}
                                className={`text-red-500 hover:underline cursor-pointer font-semibold ${inputs.isGranularOptimizedApproved ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                {language === "ar" ? "إلغاء التجاوز المخبري" : "Cancel Override"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={inputs.isGranularOptimizedApproved}
                                onClick={() => handleOpenOverrideForm("sandAbsorption", inputs.sandAbsorption || 0)}
                                className={`text-amber-600 hover:underline cursor-pointer font-semibold ${inputs.isGranularOptimizedApproved ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                {language === "ar" ? "تجاوز مخبري (Lab Override)" : "Lab Override"}
                              </button>
                            )}
                          </div>
                          {inputs.labOverrides?.sandAbsorption && (
                            <div className="text-[9px] text-amber-600 mt-1 leading-normal p-1 bg-amber-500/5 rounded border border-amber-500/10 text-right">
                              ⚠️ {language === "ar" ? `معدل: الأصل (${inputs.labOverrides.sandAbsorption.originalMaterialValue}%). السبب: ${inputs.labOverrides.sandAbsorption.reason}` : `Overridden: Original (${inputs.labOverrides.sandAbsorption.originalMaterialValue}%). Reason: ${inputs.labOverrides.sandAbsorption.reason}`}
                            </div>
                          )}
                          <span className="text-[9px] text-slate-400 block mt-1.5">
                            {t("sand_absorption_range")}
                          </span>
                        </div>
                      </div>

                      {/* Gravel moisture & absorption */}
                      <div className={`p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800 ${isRtl ? "text-right" : "text-left"} space-y-4`}>
                        <div>
                          <div className="flex justify-between items-center text-xs mb-2">
                            <label className="font-extrabold text-slate-700 dark:text-slate-250 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                              <span>{t("gravel_moisture_label")}</span>
                            </label>
                            <strong className="text-slate-600 dark:text-slate-400 font-mono text-xs">{inputs.moistureGravel}%</strong>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="4"
                            step="0.1"
                            disabled={inputs.isGranularOptimizedApproved}
                            value={inputs.moistureGravel}
                            onChange={(e) => setInputs(prev => ({ ...prev, moistureGravel: parseFloat(e.target.value) }))}
                            className={`w-full h-1 accent-slate-500 bg-slate-200 dark:bg-slate-800 cursor-pointer ${inputs.isGranularOptimizedApproved ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                          <span className="text-[9px] text-slate-400 block mt-1.5">
                            {t("gravel_moisture_range")}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                          <div className="flex justify-between items-center text-xs mb-2">
                            <label className="font-extrabold text-slate-700 dark:text-slate-250 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              <span>{t("gravel_absorption_label")}</span>
                            </label>
                            <strong className="text-slate-600 dark:text-slate-400 font-mono text-xs">{inputs.gravelAbsorption !== undefined ? inputs.gravelAbsorption : 0}%</strong>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            disabled={inputs.isGranularOptimizedApproved || !inputs.labOverrides?.gravelAbsorption}
                            value={inputs.gravelAbsorption !== undefined ? inputs.gravelAbsorption : 0}
                            onChange={(e) => setInputs(prev => ({ ...prev, gravelAbsorption: parseFloat(e.target.value) }))}
                            className={`w-full h-1 accent-slate-500 bg-slate-200 dark:bg-slate-800 cursor-pointer ${(inputs.isGranularOptimizedApproved || !inputs.labOverrides?.gravelAbsorption) ? "opacity-55 cursor-not-allowed" : ""}`}
                          />
                          <div className="mt-1 flex justify-between items-center text-[10px]">
                            {inputs.labOverrides?.gravelAbsorption ? (
                              <button
                                type="button"
                                disabled={inputs.isGranularOptimizedApproved}
                                onClick={() => handleRemoveOverride("gravelAbsorption")}
                                className={`text-red-500 hover:underline cursor-pointer font-semibold ${inputs.isGranularOptimizedApproved ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                {language === "ar" ? "إلغاء التجاوز المخبري" : "Cancel Override"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenOverrideForm("gravelAbsorption", inputs.gravelAbsorption || 0)}
                                className="text-amber-600 hover:underline cursor-pointer font-semibold"
                              >
                                {language === "ar" ? "تجاوز مخبري (Lab Override)" : "Lab Override"}
                              </button>
                            )}
                          </div>
                          {inputs.labOverrides?.gravelAbsorption && (
                            <div className="text-[9px] text-amber-600 mt-1 leading-normal p-1 bg-amber-500/5 rounded border border-amber-500/10 text-right">
                              ⚠️ {language === "ar" ? `معدل: الأصل (${inputs.labOverrides.gravelAbsorption.originalMaterialValue}%). السبب: ${inputs.labOverrides.gravelAbsorption.reason}` : `Overridden: Original (${inputs.labOverrides.gravelAbsorption.originalMaterialValue}%). Reason: ${inputs.labOverrides.gravelAbsorption.reason}`}
                            </div>
                          )}
                          <span className="text-[9px] text-slate-400 block mt-1.5">
                            {t("gravel_absorption_range")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 5: DYNAMIC METHOD DESIGN PARAMETERS (NORMAL AUTO VS EXPERT SLIDERS) */}
                  <div className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 ${isRtl ? "text-right" : "text-left"}`} id="step6-design-coefficients">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">5</span>
                        <span>{t("step6_header")}</span>
                      </h4>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-sans">
                        {designerMode === "normal" ? t("auto_coeffs_active") : t("manual_experimental_adjust")}
                      </span>
                    </div>

                    {designerMode === "normal" ? (
                      /* Readonly Elegant Grid for Normal Auto mode (الوضع العادي يبسط عرض المعاملات ببطاقات) */
                      <div className={`space-y-3 animate-fade-in ${isRtl ? "text-right" : "text-left"}`}>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2">
                          <span className="p-1 px-1.5 bg-emerald-500 text-slate-950 font-black rounded text-[9px]">ACTIVE</span>
                          <p className="text-xs text-emerald-800 dark:text-emerald-350">
                            <strong>{t("intelligent_hydrological_integration_active")} ({inputs.selectedMethod?.toUpperCase()}) {t("intelligent_hydrological_integration_active_end")}</strong>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">{t("wc_ratio_label")}</span>
                            <strong className="text-sm font-mono text-blue-500 block mt-1">{inputs.internalWcOverride}</strong>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">{t("packing_index_label")}</span>
                            <strong className="text-sm font-mono text-blue-500 block mt-1">{inputs.packingFactor}</strong>
                          </div>

                        </div>
                      </div>
                    ) : (
                      /* Active Sliders for Expert Mode (وضع الخبير يطلق يد المهندس للتعديل المباشر) */
                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-3 animate-fade-in ${isRtl ? "text-right" : "text-left"}`}>
                        
                        {/* W/C slider */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                            <span>{t("wc_ratio_label")}</span>
                            <strong className="text-blue-500 font-mono">{inputs.internalWcOverride}</strong>
                          </div>
                          <input
                            type="range"
                            min="0.30"
                            max="0.75"
                            step="0.01"
                            value={inputs.internalWcOverride || 0.45}
                            onChange={(e) => setInputs(prev => ({ ...prev, internalWcOverride: parseFloat(e.target.value) }))}
                            className="w-full h-1 accent-amber-500 cursor-pointer"
                          />
                        </div>

                        {/* packing factor */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                            <span>{t("packing_index_label")}</span>
                            <strong className="text-blue-500 font-mono">{inputs.packingFactor}</strong>
                          </div>
                          <input
                            type="range"
                            min="0.70"
max="0.95"
                            step="0.01"
                            value={inputs.packingFactor}
                            onChange={(e) => setInputs(prev => ({ ...prev, packingFactor: parseFloat(e.target.value) }))}
                            className="w-full h-1 accent-amber-500 cursor-pointer"
                          />
                        </div>

                      </div>
                    )}
                  </div>

                  {/* STEP 6: CHEMICAL MODIFIERS AND ADDITIONS DOSAGES */}
                  <div className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 ${isRtl ? "text-right" : "text-left"}`} id="step7-chemical-additions">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">6</span>
                        <span>{t("step7_header")}</span>
                      </h4>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-sans">{t("independent_chemical_lab")}</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-sans mt-1">
                      {t("step7_desc")}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* dosageSuper */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>{t("superplasticizer_label")}</span>
                          <span className="text-emerald-500">{inputs.dosageSuper}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="3.0"
                          step="0.1"
                          value={inputs.dosageSuper}
                          onChange={(e) => setInputs(prev => ({ ...prev, dosageSuper: parseFloat(e.target.value) }))}
                          className="w-full h-1 accent-emerald-500 cursor-pointer"
                        />
                        <span className="text-[9px] text-slate-400 block mt-1">{t("superplasticizer_desc")}</span>
                      </div>

                      {/* dosageSilicaFume */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-bold mb-1 col-span-1">
                          <span>{t("silica_fume_label")}</span>
                          <span className="text-blue-500">{inputs.dosageSilicaFume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="12"
                          step="1"
                          value={inputs.dosageSilicaFume}
                          onChange={(e) => setInputs(prev => ({ ...prev, dosageSilicaFume: parseFloat(e.target.value) }))}
                          className="w-full h-1 accent-blue-500 cursor-pointer"
                        />
                        <span className="text-[9px] text-slate-400 block mt-1">{t("silica_fume_desc")}</span>
                      </div>

                      {/* dosageFlyAsh */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>{t("fly_ash_label")}</span>
                          <span className="text-indigo-500">{inputs.dosageFlyAsh}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={inputs.dosageFlyAsh}
                          onChange={(e) => setInputs(prev => ({ ...prev, dosageFlyAsh: parseFloat(e.target.value) }))}
                          className="w-full h-1 accent-indigo-500 cursor-pointer"
                        />
                        <span className="text-[9px] text-slate-400 block mt-1">{t("fly_ash_desc")}</span>
                      </div>

                    </div>

                    {/* Dosage Alarm system monitor */}
                    <div className={`p-4 rounded-xl transition-colors duration-200 ${
                      themeMode === "dark" 
                        ? "bg-slate-900 text-white" 
                        : "bg-slate-100/70 border border-slate-200 text-slate-800"
                    }`}>
                      <ChemicalDosageMonitor 
                        fck28={inputs.fck28} 
                        dosageSuper={inputs.dosageSuper} 
                        dosageSilicaFume={inputs.dosageSilicaFume} 
                        dosageFlyAsh={inputs.dosageFlyAsh} 
                        selectedAdmixtureId={inputs.selectedAdmixtureId}
                        materialsDatabase={materialsDatabase}
                        dosageRetarder={inputs.dosageRetarder}
                        dosageAccelerator={inputs.dosageAccelerator}
                        dosageAir={inputs.dosageAir}
                      />
                    </div>
                  </div>

                </div>

                {/* LOGICAL ENGINEERING SEQUENCE RESULTS SUMMARY */}
                <div className="pt-2 space-y-4">
                  <LogicalResultsSummary 
                    inputs={inputs}
                    results={results}
                    language={language}
                    materialsDatabase={materialsDatabase}
                    setActiveSidebarTab={setActiveSidebarTab}
                  />
                </div>

                {/* DYNAMIC FORMULATION RESULTS ROW PREVIEW */}
                <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 ${isRtl ? "text-right" : "text-left"}`}>
                  <h4 className="text-xs font-black text-white mb-3">
                    {language === "fr" ? "📄 Aperçu de la formulation pour l'unité de volume (1 m³) :" : language === "en" ? "📄 Recipe Formulation Preview (per 1 m³) :" : "📄 معاينة نتائج الصياغة لوحدة الحجم (1 متر مكعب - 1 م³):"}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="p-3 bg-slate-850 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">{language === "fr" ? "Ciment Pur" : language === "en" ? "Pure Cement" : "الإسمنت المصفي"}</span>
                      <strong className="text-lg font-mono text-white block mt-1">
                        {Math.round(results.cementWeight)} 
                        <span className="text-[10px] mr-1">kg</span>
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-850 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">{language === "fr" ? "Eau Net Additionnelle" : language === "en" ? "Net Added Water" : "مياه الإضافة الصافية"}</span>
                      <strong className="text-lg font-mono text-blue-400 block mt-1">
                        {Math.round(results.waterContentActual)} 
                        <span className="text-[10px] mr-1">L</span>
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-850 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">{language === "fr" ? "Sable Sec de Base" : language === "en" ? "Base Dry Sand" : "الرمل الجاف الأساسي"}</span>
                      <strong className="text-lg font-mono text-white block mt-1">
                        {Math.round(results.sandWeightDry)} 
                        <span className="text-[10px] mr-1">kg</span>
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-850 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">{language === "fr" ? "Gravier Sec de Base" : language === "en" ? "Base Dry Gravel" : "الحصى الجاف الأساسي"}</span>
                      <strong className="text-lg font-mono text-white block mt-1">
                        {Math.round(results.gravelWeightDry)} 
                        <span className="text-[10px] mr-1">kg</span>
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-850 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">{language === "fr" ? "Masse Volumique du Béton Frais" : language === "en" ? "Fresh Wet Density" : "كثافة الخرسانة الرطبة"}</span>
                      <strong className="text-lg font-mono text-emerald-400 block mt-1">
                        {Math.round(results.totalFreshDensity)} 
                        <span className="text-[10px] mr-1">kg/m³</span>
                      </strong>
                    </div>
                  </div>
                </div>

              </div>
            )}



{activeSidebarTab === "cost" && (
              <div className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6 animate-fade-in ${isRtl ? "text-right" : "text-left"}`} id="cost-analysis-screen">
                
                {/* Save Feedback Banner */}
                {showSavedFeedback && (
                  <div className={`bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl flex items-center justify-between gap-3 animate-fade-in ${language === "ar" ? "flex-row-reverse" : ""}`}>
                    <span className="text-xs font-bold font-sans">
                      {language === "ar" 
                        ? "تم حفظ الأسعار الحالية كتعريفات افتراضية بنجاح وسيتم تحميلها تلقائيًا في الجلسات القادمة!"
                        : language === "fr"
                          ? "Les prix actuels ont été enregistrés avec succès comme tarifs par défaut et seront chargés automatiquement lors des prochaines sessions !"
                          : "Current prices have been successfully saved as default and will be loaded automatically in future sessions!"}
                    </span>
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  </div>
                )}

                {/* Header Controls */}
                <div className={`border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 ${language === "ar" ? "" : "flex-row-reverse"}`}>
                  <div className={language === "ar" ? "text-right" : "text-left"}>
                    <h3 className={`text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 ${language === "ar" ? "justify-end" : "justify-start"}`}>
                      {language === "ar" && <Coins size={16} className="text-[#10B981]" />}
                      <span>
                        {language === "ar" 
                          ? "الكلفة المالية وجرعات الموازين للوجبة" 
                          : language === "fr" 
                            ? "Évaluation financière et dosages de gâchée" 
                            : "Concrete Valuation & Batch Scale Dosages"}
                      </span>
                      {language !== "ar" && <Coins size={16} className="text-[#10B981]" />}
                    </h3>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                      {language === "ar"
                        ? "عدل أسعار الشراء المحلية ومستحقات اليد العاملة لحساب التكلفة الإجمالية بالعملة المفضلة."
                        : language === "fr"
                          ? "Ajustez les prix d'achat locaux et les coûts de main-d'œuvre pour calculer le coût total dans votre devise préférée."
                          : "Adjust local purchase prices and labor costs to calculate the total cost in your preferred currency."}
                    </p>
                  </div>

                  <div className={`flex flex-wrap items-center gap-3 ${language === "ar" ? "justify-end" : "justify-start"}`}>
                    {/* Reset Prices Button */}
                    <button
                      onClick={resetPricesToZero}
                      className="px-3.5 py-1.5 text-xs font-bold text-red-500 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1.5 cursor-pointer select-none transition-all"
                    >
                      <span>
                        {language === "ar" ? "تصفير الأسعار" : language === "fr" ? "Réinitialiser" : "Reset Prices"}
                      </span>
                      <RotateCcw size={13} />
                    </button>

                    {/* Save Default Button */}
                    <button
                      onClick={savePricesAsDefault}
                      className="px-3.5 py-1.5 text-xs font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1.5 cursor-pointer select-none transition-all"
                    >
                      <span>
                        {language === "ar" ? "حفظ كقيم افتراضية" : language === "fr" ? "Enregistrer" : "Save Default"}
                      </span>
                      <Save size={13} />
                    </button>

                    {/* CURRENCY SELECTOR (DYNAMIC) */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                      <button
                        onClick={() => handleCurrencyChange("DZD")}
                        className={`px-3 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                          currency === "DZD" 
                            ? "bg-[#10B981] text-white shadow-sm font-extrabold" 
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
                        }`}
                      >
                        د.ج (DA)
                      </button>
                      <button
                        onClick={() => handleCurrencyChange("USD")}
                        className={`px-3 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                          currency === "USD" 
                            ? "bg-[#10B981] text-white shadow-sm font-extrabold" 
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
                        }`}
                      >
                        $ (USD)
                      </button>
                      <button
                        onClick={() => handleCurrencyChange("EUR")}
                        className={`px-3 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                          currency === "EUR" 
                            ? "bg-[#10B981] text-white shadow-sm font-extrabold" 
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
                        }`}
                      >
                        € (EUR)
                      </button>
                      <button
                        onClick={() => handleCurrencyChange("GBP")}
                        className={`px-3 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                          currency === "GBP" 
                            ? "bg-[#10B981] text-white shadow-sm font-extrabold" 
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
                        }`}
                      >
                        £ (GBP)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1. Price Configuration Form */}
                <div className="space-y-6 bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800">
                  
                  {/* Costing Basis Selector */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-teal-50/40 dark:bg-teal-950/20 rounded-2xl border border-teal-100/50 dark:border-teal-900/40 mb-2 ${language === "ar" ? "" : "flex-row-reverse"}`}>
                    <div className={language === "ar" ? "text-right" : "text-left"}>
                      <h4 className="text-xs font-bold text-teal-850 dark:text-teal-300">
                        {language === "ar" 
                          ? "طريقة احتساب كلفة الركام" 
                          : language === "fr" 
                            ? "Mode d'évaluation du sable/gravier" 
                            : "Aggregate Costing Basis (Sand/Gravel)"}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {language === "ar"
                          ? "تحديد ما إذا كانت الأسعار تعتمد على الأوزان الجافة الناتجة من تصميم الخلطة أو الأوزان الرطبة المستلمة فعلياً."
                          : language === "fr"
                            ? "Déterminez si les coûts sont basés sur les poids secs de la formulation ou sur les poids humides reçus."
                            : "Determine whether costs are based on mix design dry weights or actually received wet weights."}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-150 dark:border-slate-800 self-start sm:self-auto shadow-sm animate-fade-in">
                      <button
                        type="button"
                        onClick={() => setInputs(prev => ({ ...prev, costBasis: "wet" }))}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                          (inputs.costBasis || "wet") === "wet"
                            ? "bg-teal-600 text-white shadow-sm font-extrabold"
                            : "text-slate-600 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200"
                        }`}
                      >
                        {language === "ar" ? "الوزن الرطب المستلم (Wet)" : language === "fr" ? "Poids humide reçu" : "Received Wet Weight"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputs(prev => ({ ...prev, costBasis: "dry" }))}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                          inputs.costBasis === "dry"
                            ? "bg-teal-600 text-white shadow-sm font-extrabold"
                            : "text-slate-600 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200"
                        }`}
                      >
                        {language === "ar" ? "الوزن الجاف التصميمي (Dry)" : language === "fr" ? "Poids sec théorique" : "Theoretical Dry Weight"}
                      </button>
                    </div>
                  </div>

                  {/* Category A: Base Materials */}
                  <div className="space-y-2">
                    <h4 className={`text-[11px] font-black text-slate-400 uppercase tracking-wider ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "أولاً: أسعار المواد الأساسية" : language === "fr" ? "I. Prix des matériaux de base" : "I. Base Materials Prices"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <PriceInput 
                        label={localizedLabel("سعر الإسمنت", "Prix du ciment", "Cement Unit Cost")}
                        unit={getUnitForMaterial("priceCement")}
                        value={inputs.priceCement}
                        onChange={(val) => setInputs({ ...inputs, priceCement: val })}
                        step={1}
                        currencySymbol={getCurrencySymbol()}
                      />
                      <PriceInput 
                        label={localizedLabel("سعر الرمل", "Prix du sable", "Sand Unit Cost")}
                        unit={getUnitForMaterial("priceSand")}
                        value={inputs.priceSand}
                        onChange={(val) => setInputs({ ...inputs, priceSand: val })}
                        step={0.1}
                        currencySymbol={getCurrencySymbol()}
                      />
                      <PriceInput 
                        label={localizedLabel("سعر الحصى", "Prix du gravier", "Gravel Unit Cost")}
                        unit={getUnitForMaterial("priceGravel")}
                        value={inputs.priceGravel}
                        onChange={(val) => setInputs({ ...inputs, priceGravel: val })}
                        step={0.1}
                        currencySymbol={getCurrencySymbol()}
                      />
                      <PriceInput 
                        label={localizedLabel("سعر الماء", "Prix de l'eau", "Water Unit Cost")}
                        unit={getUnitForMaterial("priceWater")}
                        value={inputs.priceWater}
                        onChange={(val) => setInputs({ ...inputs, priceWater: val })}
                        step={0.1}
                        currencySymbol={getCurrencySymbol()}
                      />
                    </div>
                  </div>

                  {/* Category B: Admixtures */}
                  <div className="space-y-2">
                    <h4 className={`text-[11px] font-black text-slate-400 uppercase tracking-wider ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "ثانياً: أسعار الإضافات والملدنات" : language === "fr" ? "II. Prix des adjuvants et additions" : "II. Admixtures & Additions Prices"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <PriceInput 
                        label={localizedLabel("الملدن الفائق (Super)", "Superplastifiant (Super)", "Superplasticizer (Super)")}
                        unit={getUnitForMaterial("priceSuper")}
                        value={inputs.priceSuper}
                        onChange={(val) => setInputs({ ...inputs, priceSuper: val })}
                        step={5}
                        currencySymbol={getCurrencySymbol()}
                      />
                      <PriceInput 
                        label={localizedLabel("حابس الهواء (Air)", "Entraîneur d'air (Air)", "Air Entraining (Air)")}
                        unit={getUnitForMaterial("priceAir")}
                        value={inputs.priceAir}
                        onChange={(val) => setInputs({ ...inputs, priceAir: val })}
                        step={5}
                        currencySymbol={getCurrencySymbol()}
                      />
                      <PriceInput 
                        label={localizedLabel("مؤخر الشك (Retarder)", "Retardateur (Retarder)", "Set Retarder (Retarder)")}
                        unit={getUnitForMaterial("priceRetarder")}
                        value={inputs.priceRetarder}
                        onChange={(val) => setInputs({ ...inputs, priceRetarder: val })}
                        step={5}
                        currencySymbol={getCurrencySymbol()}
                      />
                      <PriceInput 
                        label={localizedLabel("مسرع التصلد (Accel)", "Accélérateur (Accel)", "Set Accelerator (Accel)")}
                        unit={getUnitForMaterial("priceAccelerator")}
                        value={inputs.priceAccelerator}
                        onChange={(val) => setInputs({ ...inputs, priceAccelerator: val })}
                        step={5}
                        currencySymbol={getCurrencySymbol()}
                      />
                      <PriceInput 
                        label={localizedLabel("غبار السيليكا (Silica)", "Fumée de silice (Silica)", "Silica Fume (Silica)")}
                        unit={getUnitForMaterial("priceSilicaFume")}
                        value={inputs.priceSilicaFume}
                        onChange={(val) => setInputs({ ...inputs, priceSilicaFume: val })}
                        step={5}
                        currencySymbol={getCurrencySymbol()}
                      />
                      <PriceInput 
                        label={localizedLabel("الرماد المتطاير (Fly Ash)", "Cendres volantes (Fly Ash)", "Fly Ash (Fly Ash)")}
                        unit={getUnitForMaterial("priceFlyAsh")}
                        value={inputs.priceFlyAsh}
                        onChange={(val) => setInputs({ ...inputs, priceFlyAsh: val })}
                        step={5}
                        currencySymbol={getCurrencySymbol()}
                      />
                      <PriceInput 
                        label={localizedLabel("خبث الأفران (Slag)", "Laitier de haut fourneau (Slag)", "Ground Granulated Slag (Slag)")}
                        unit={getUnitForMaterial("priceSlag")}
                        value={inputs.priceSlag}
                        onChange={(val) => setInputs({ ...inputs, priceSlag: val })}
                        step={5}
                        currencySymbol={getCurrencySymbol()}
                      />
                    </div>
                  </div>

                  {/* Category C: Labor Options */}
                  <div className="space-y-2">
                    <h4 className={`text-[11px] font-black text-slate-400 uppercase tracking-wider ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "ثالثاً: كلفة اليد العاملة والتشغيل" : language === "fr" ? "III. Main d'œuvre et fonctionnement" : "III. Labor & Operations Cost"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-1">
                        <PriceInput 
                          label={localizedLabel("أجور اليد العاملة الفنية", "Coût de la main d'œuvre", "Technical Labor Cost")}
                          unit={getUnitForMaterial("priceLabor")}
                          value={inputs.priceLabor}
                          onChange={(val) => setInputs({ ...inputs, priceLabor: val })}
                          step={100}
                          currencySymbol={getCurrencySymbol()}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  
                  {/* Card 1: Cost per m³ */}
                  <div className={`p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1 ${language === "ar" ? "text-right" : "text-left"}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {localizedLabel("كلفة المتر المكعب الأساسي", "Coût unitaire du béton", "Base Concrete Cost per m³")}
                    </span>
                    <h5 className={`text-xl font-black text-slate-800 dark:text-white font-mono`}>
                      {formatCurrency(costBreakdown.totalMaterialCost / (inputs.batchVolume || 1.0) + inputs.priceLabor)}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {localizedLabel("شامل المواد والماء واليد العاملة / م³", "Incluant matériaux, eau et main d'œuvre / m³", "Includes materials, water, and labor / m³")}
                    </p>
                  </div>

                  {/* Card 2: Total Batch Cost */}
                  <div className={`p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1 ${language === "ar" ? "text-right" : "text-left"}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {localizedLabel("إجمالي كلفة الوجبة المحققة", "Coût total de la gâchée", "Total Batch Valuation")}
                    </span>
                    <h5 className="text-xl font-black text-emerald-500 font-mono">
                      {formatCurrency(costBreakdown.grandTotalCost)}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {localizedLabel("لحجم تشغيلة إجمالي يعادل ", "Pour un volume de gâchée de ", "For a total batch volume of ")}
                      {(inputs.batchVolume || 1.0)}
                      {localizedLabel(" م³", " m³", " m³")}
                    </p>
                  </div>

                  {/* Card 3: Most Expensive Material */}
                  <div className={`p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1 ${language === "ar" ? "text-right" : "text-left"}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {localizedLabel("أغلى مادة في الخلطة الحالية", "Composant le plus cher", "Most Expensive Component")}
                    </span>
                    <h5 className={`text-sm font-black text-red-500 dark:text-red-400 flex items-center gap-1.5 ${language === "ar" ? "justify-end" : "justify-start"}`}>
                      {language !== "ar" && <span>{localizedLabel(costBreakdown.mostExpensive.arName, costBreakdown.mostExpensive.frName, costBreakdown.mostExpensive.enName)}</span>}
                      <span className="font-mono text-xs text-slate-400">({formatCurrency(costBreakdown.mostExpensive.cost)})</span>
                      {language === "ar" && <span>{localizedLabel(costBreakdown.mostExpensive.arName, costBreakdown.mostExpensive.frName, costBreakdown.mostExpensive.enName)}</span>}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                      {localizedLabel("أكثر عنصر مستحوذ على الكلفة المالية للوجبة", "Élément représentant la part de coût la plus élevée", "Highest contributor to the batch raw material costs")}
                    </p>
                  </div>

                  {/* Card 4: Cheapest Material */}
                  <div className={`p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1 ${language === "ar" ? "text-right" : "text-left"}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {localizedLabel("أرخص مادة مضافة بالوجبة", "Composant le moins cher", "Cheapest Active Component")}
                    </span>
                    <h5 className={`text-sm font-black text-blue-500 dark:text-blue-400 flex items-center gap-1.5 ${language === "ar" ? "justify-end" : "justify-start"}`}>
                      {language !== "ar" && <span>{localizedLabel(costBreakdown.cheapest.arName, costBreakdown.cheapest.frName, costBreakdown.cheapest.enName)}</span>}
                      <span className="font-mono text-xs text-slate-400">({formatCurrency(costBreakdown.cheapest.cost)})</span>
                      {language === "ar" && <span>{localizedLabel(costBreakdown.cheapest.arName, costBreakdown.cheapest.frName, costBreakdown.cheapest.enName)}</span>}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                      {localizedLabel("أقل عنصر تكلفة فعالة من العناصر الداخلة", "Composant ayant le coût d'acquisition le plus bas", "Lowest contributor to the batch raw material costs")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  
                  {/* Table Box (7 Cols) */}
                  <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <div className={`p-3 bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center ${language === "ar" ? "flex-row-reverse" : "flex-row"}`}>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Interactive Bill of Quantities</span>
                        <span>
                          {language === "ar"
                            ? `جدول كلفة المواد م³ والوجبة ${inputs.batchVolume} م³`
                            : language === "fr"
                              ? `Tableau des coûts par m³ et gâchée de ${inputs.batchVolume} m³`
                              : `Materials Unit Cost & Batch of ${inputs.batchVolume} m³`}
                        </span>
                      </div>
                      
                      <table className={`w-full text-xs ${language === "ar" ? "text-right" : "text-left"}`}>
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-850/20 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3 font-bold">
                              {localizedLabel("المادة الخام", "Matériau brut", "Raw Material")}
                            </th>
                            <th className="p-3 text-center font-bold">
                              {localizedLabel("الكمية", "Quantité", "Quantity")}
                            </th>
                            <th className="p-3 text-center font-bold">
                              {localizedLabel("سعر الوحدة", "Prix unitaire", "Unit Price")}
                            </th>
                            <th className="p-3 text-center font-bold">
                              {localizedLabel("التكلفة الإجمالية", "Coût total", "Total Cost")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          
                           {/* Row 1: Cement */}
                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                              {language === "fr" ? "Ciment Pur" : language === "en" ? "Pure Cement" : "الإسمنت المصفي"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {`${Math.round(results.cementWeight * inputs.batchVolume).toLocaleString()} kg`}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-500">
                              {formatCurrency(inputs.priceCement)}/kg
                            </td>
                            <td className="p-3 text-center font-mono text-blue-500 font-bold">
                              {formatCurrency(costBreakdown.cementCost)}
                            </td>
                          </tr>

                          {/* Row 2: Sand */}
                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                              {language === "fr" ? "Sable de Base" : language === "en" ? "Base Sand" : "الرمل الجاف الأساسي"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {`${Math.round((inputs.costBasis === "wet" ? results.sandWeightWet : results.sandWeightDry) * inputs.batchVolume).toLocaleString()} kg`}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-500">
                              {formatCurrency(inputs.priceSand)}/kg
                            </td>
                            <td className="p-3 text-center font-mono text-blue-500 font-bold">
                              {formatCurrency(costBreakdown.sandCost)}
                            </td>
                          </tr>

                          {/* Row 3: Gravel */}
                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                              {language === "fr" ? "Gravier de Base" : language === "en" ? "Base Gravel" : "الحصى الجاف الأساسي"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {`${Math.round((inputs.costBasis === "wet" ? results.gravelWeightWet : results.gravelWeightDry) * inputs.batchVolume).toLocaleString()} kg`}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-500">
                              {formatCurrency(inputs.priceGravel)}/kg
                            </td>
                            <td className="p-3 text-center font-mono text-blue-500 font-bold">
                              {formatCurrency(costBreakdown.gravelCost)}
                            </td>
                          </tr>

                          {/* Row 4: Water */}
                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                              {language === "fr" ? "Eau Net Additionnelle" : language === "en" ? "Net Added Water" : "مياه الإضافة الصافية"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {`${Math.round((results.waterWeightWet !== undefined ? results.waterWeightWet : results.waterContentActual) * inputs.batchVolume).toLocaleString()} L`}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-500">
                              {formatCurrency(inputs.priceWater)}/L
                            </td>
                            <td className="p-3 text-center font-mono text-blue-500 font-bold">
                              {formatCurrency(costBreakdown.waterCost)}
                            </td>
                          </tr>

                          {/* Row 5: Mineral & Chemical Additions */}
                          {costBreakdown.additionsCost > 0 && (
                            <tr>
                              <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                                {language === "fr" ? "Adjuvants & Additions" : language === "en" ? "Admixtures & Additions" : "الإضافات المعدنية والكيميائية"}
                              </td>
                              <td className="p-3 text-center font-mono">
    x��}koG����5��DZ��%Y������,yEٙ�A7���f7��)K�X�=�..����v�`ǖǎ�8���o+����/�?�s��_��nJ�g�0[dwWuթ��~0���\���E��]g`�'[��s�q��\��F�m��c{q����ʾ���7|״;�S��Z����d����~���g�6kY��=�8�/�1�o���}���K=�v�U�2|^�?yr"�_������:p]n���3��T�$/ۦ�5[|jw�Z�O�ihN�zӱ�G���Z.O}��	7�	xE�ݝ�ck�uvz�-M�e8*�w�Y�ډO��v��v�����o�p�##k�?��އ�iȵ�b�2����p����&6�	�!��h�6k��_�2�t�[`�MO�p�G&�n|>|�������t������f������g��p��po�M��"0�c������^q�A���>���9�>�Z-@0���#8la�m�N{[�nM���>;�67?H��х���[_]�,��Տ���,tY�����y�섨@���ʙ�'�O�d �6wK��"n��G���������͍�R���9������{��]#W]�Bs��2�ו\�z����'v��j�� Hj��~Y�~Z|ß�v{}��`�B>��-oá�֤@}w�����"xp�����n�j|��C��5J$,�4�s��Xw|�b`���cm��u��lu��8�޲ʬ��Sت�����k�m&z���.g����t��&�v�N�����CU@�㙓��O�|J�sϰ�F��9豞_:Y��<�����%gಁ�6	#�ZC������W�8��\�5x��ʂK���>gp?B�������[h��A4$8���b$0��?�9y��33�H�k�kr�z��s;��h'e"ތq�1��b¥m��-v���5\��s���<p�7�A�#h��,�����A��i�qVaǢ��D�.mY�_:ż�0h�IX^>�=5�O��tXOK�;�{j�4+��/��`�~��-���z��X��f0S������t�g�}}
g�z�?��_qހ4l<�h���]�7:���^v���c-g�?|�#|��@l�~�i�uOi��e��$�>|8�%�����1ۻ�0��� �=F?�܃�����w jO�ٯ����� �����5�{���I�gH�D���XA�q�L�5���̴,جp�}�9-�t Rظ}��H�q���6�Mk�6����o�y���u�I���l��17 =#�rM�W��e`��ḫ5N#�ؒc�j)�fM�v���Y�4:�In(��;��0	Q�G${Q�!)?̐(�fQճk�냤����[�����������E���� b�\Y���ۆo,�|����-�@��p̿#��C��P�ٓ������	�i�,����n�m��	�c9.�ܟΝ;3{���=q�A=Cn��@Y@|���� fi'�r~����s�1�'���G~����-�x:t;1���S�9�V��xVc�>�m��u������N/�X`�|o��hUڿl��ď���\�iSiEX93?�=`��>)o��p��?`�2����Xkkqb�o���4m@k0�����|���6x�@�>���T��\~���a��)�2�E9oQ�[���r�=�?9	���>��ͷ��l�����r�b���\m��
���/^g-�P�e�.��?�S}�h�2#�c�f�	I潸3)!k��4��R����1{�kr�"uWIN[! �(idb������§G�L�
�uD��c�H2�F�s,��<�N&D��������K|~{%۱y{���� �~�
�Q�5*���z�Q9-&0Ed$ZSL��p�-��XtO�Ar�h��M?}�\~&E�Z�֑��B�<�L���ݛbY�O�b@�UJFL9�������r<F�� �?%��6�� ʿ���b�7#U�����@$?����F$ԖL�P��+| ȕ��!v��gq��]s�t$�`��Ό���ŧ��B����K�S'�Z%�l�'� vP�묩6�������ݕ�o4����R\�n����`�a�M�͎k�����+Ͳ��/mɿۥ��<)
XT�4��f��I��KsYک,��s�'X��'�*"O6�f��3�;Tlz��3��;\���>>F:w����}�lv����y��#C�|(�a��"p��|^�P����n�B\�oC��Gc�Pl�J2H�ߞ�z�S�\��ӟ�Ng��:��NqiI��w>���t�ßd�n>�udV��.L�7Ò=8on�������N��R��W ��YX�.��Y�༮k��J''��o��f�5���CUq
��t"�n���� �e�����:򯻎,A�(�����l�p��x�,�6�J]x���}�g�� �Ec�"_��dxݦc���YlZ���=�M��./J+s4@�ˇ��i�6X�����L_-�Y������bB|Hk�����v����ȥ�vꔄ��OM�,c�.I�\���9V]]Y���/��2[�U�R���M����zcdw�Zz R6w�h����"�D�d��ȵ8px��a�kFi�h�iO 2_T]�|�Y��	t��n�*���E����;ڗW������&v	;��̰Y�
�6)K�<���k����c� /Ӂ��ڸ�D�`�V`��h��8�F��Wdg����$/��U�TXtwF.���;���V0����*�w�5����ڇ�a��-��;��9�B4~3���R`ޠ�3�m��S��&�o��5�9i�B�O���a
?G� �K�\�Z���m�"�M�Ln@���c�,���o�}.�>�!3�%X�S���5o�ӱ��F� �k���.�,����FW5���ɾ�7���a�r��/�a��g��,��o���-�ыv�\���ԓ�Sϊ<�(���/_{z��uܲЭA�u��'/�w�2������k;�����A��1��iz ��W܏�ّ*M���Ogj��ϝ��(�Y��,E�������Xc�V��O�ޟ�����B�ዃ�Q�E��+�JwR�$���&q����&�=['��Es�U�t�mx��o��	���.�<�Dw�@��w�5��}Q)=3�+W�f9������<-n�]��>: ��e+C��� �@� � <����=���������.z�� ���MT�����{T���{�o�>�T[wH��J���<>]<�.nJ���������³/�����}��� �����#�5�ś�d��9+�@EU�>"^�h��r��Y��(}��п�t���2.�e���7���� ��n`<�L���+E����a�R�|a�CX��D9Sg��'�QC���( ��o����@{�s�M�3��{�����	9�Qo�/�练����W�{m���І��lra܀�Ė�߅���g�@A9�í��qy�л��b�N���w��{����%<á�_����I�-�mtE�hر,���}g�a�y�]cc�{B�}i0 Y�Gy���#� ֽ�s ]u���+�3��]nln�a� �ua\޶��1n{Ԫ8�d�Z�hm��]�opY�xo�"��gЕa]7�=xP"$@�O�@���ό 2p�'��hɮ���f0�.�A���mb���G�ФE���w$���uǽ�eXD��vc��Τ��[�꺎G����ӥ���R�ӍY^�Ţ���Ƨc�C	�\�pf��ʭtDG�� @�"H#��xF?	m>�w%A=�'vi���=��B8����,K��M�$�t	_F~1�ޢ.D1��Oт�5��/�B��?!����F����^筮Mb�-��F�\�j|,�h�������M ���\߁����m��&�,mC{��0��/$Q�u\��>��[vT�w8���2�Ro\�,���Zm������+��Օ�Z��ɩ��8�a��N3U>g���
e6�V�z�����zm�^Yn��Zc��r��Ö+�V�*�k�b�`�����_[].
� �
�8 tX�1*
�<+���Y:��*|5r�@����Ŵ6��Q�ȣ.}9��L�d?K8���A�c՝�?�Hu(*�G�j�uuq�H�w�_�K��e�^�lӞ���!�	��n��_dF�om# �5���	�k�����7lՕR%�N�-���cO+?Oi��e���ؗi�8�o��Y;�ۯ+m���ZƮ��a�3;f���"���޳H҇������gm���bY�8��tA�	���iXb�! ��T��*�-�'19D���2C�]�Z���X��Z��k�^�'6���!#�l���\,6|�
�c����0db���,L��2V^���XB�I	w�m� ���h�aW9�������P��݋jxi�G<�9T�T�eJ|+�	z˘�C�C��3�!�߁P�B����H�7����-��K��+\�R��K��U/�]��yz&�����QG��+u�Lp� ���M8����3A֨T�._tsVqi�v����k�FD�j���׫�bm��K�˫~�.\�/Ֆ�+�׶����v,��}+�v�`��4{�k��l���^j���N{dd��:�!���Bb��8���rUI��X���R),���6��Xψ"�$��^ш����#�d�B�C	x�7*p��O����f�5�c9D��+;��"ޑä����7�v���X{	V��b%��[	�x��t���NOM��C7�ŝ���~I6w��g1�p'�rƸ��<��`i7����5Ԕ���2�TA��=5�����U�nŲFZ��8>]�j�۪�e���{����^G]����]�o�mַ�eY�:�cA:������C wL�T����_�뵵��ǉ�&�1�J�>s����Ժ����(����+�o��|4��j+��ί�ժ�C����.�;Vt17c�o����;~��7��-B��Q���J��z��r��R����Ώ���2Ѫ��Ν;W��ǌQޚo�y�+x{I��j�';�h�Y���O_t:�|�r�	ad�_iг��( v4�ꂧ�C��_z�����<?��l尾=�Ҝ(�{��Z]ڕ�bV�pR#|f�7{v��5\� p+�"-���&���Y�6�h���*`֝�S�i<��r�ɱ4�C����,�j�v�_�8�	�%3�C�s'�)u_o�_����5y<�6���<Z�3�����Ow��̿����
8$�dx�M���h���9�e,���y�Rd�Ni��e�b��{��Zmr"��f��5����6��ǟDb�åe�*�Fn���@�DV�3)A6�8��
{�M�;ם����Y�o��ݘ�WN �xy�ޮ�_`�W*l��{3l��V����lRz��!�#�۷K�c_���ҹr�<[>����MZ�W�r�8������V˽��_���Lr����Je�W�z##fM���K_�2��M�Ǒ�����Zd%.�%��-�O��"� �X5�Q�	g�p�g���Y�(S]����b�+��I��҄��]�R<7�����*Hߵ+�˗I�Bw�/y
7�L&���gGC�#�Ҵ�f��d��B����7�ܧD��v�WÇ�g�[r���h]���F>K�2��fl�ŝ�3����y�'�Q�z��5z�K��;�xN���T%U�^~�2f���m����Sr�����,��Jq�$
x���@�U�׼�-�T��p����oW#<��M����p�d���b�0L���I�ζGLk؆��ށ6)���MTJP)�����ɻ����ǟh���'a���K��W��{�	���	����������ha��LL��~����sur+}��������Ln*����~��?���Q"��Kߎ�C~��2q7,�l�e��p1��XX?�ph<�>���a�C���+��$8|tI�=%S��rء���
�
ޫ�A `Q*�!zU��0�w����0�����U����O�&#��H���E���G��ciL��G\r`-�E���vy���C/.:��;�amO島0
91 ��$(�-$.`���m-��TP�rǪ�d�&ы�`�N��A�%�n����w	N ��mxI�=� �Q6Wx<>,w��+��0>����uǷ��`�����CQiz��	$c��=��$Lqn``�C������L<T�;|�y��6�9iǵ!���@;� �r;J��4 ��Z�� �HD���u�^x��2��َ���:n���L	�1�%n{���(��yq���a�i���}&��
�	�0�[��PFV;u�4-��A�'�7r�8omW�n�������o�׭���vH�G����QRt�)�q��5OLB]�k^i�`���!r'�s���mt\��������Zm���zc����.9.�*�����~
��b�7���������&L<��n�y�T-��T�K�Nk���96R3�Hf\�6�i7?) E��Ǵ�>���Rl9=*���pc���Iq��D�@MQ���B]��|+��R���rP��#"�&J#%&�"X�ù����zU?���YE�ka�ㄚM�NR���*V�aǔ�a���gJAVЯX���l��t˒V��B�+�Q�sʆ�*����E�.���@EE��sj��RA������_P�=�
�A��������PX�}�/U�wlx�����P	2����O�SZ�#���"Nw�"������̜R)�O�c7�ٗ�ݏ�K�m����l���r	�?�0v�5ET�.�Wإ�JqwB�G4N���I�>�a`�ۀ���#>P��;]f��::?6�����4Fx��7��&~s��tn�r��m���.Q�"͑���y�ulDC ����TQմ�[لE������&�I��_���h9kY����h]6��=�}���y�<���H����?��WO6���B}"�����(D�{>VZL7<��@�5�v�A0�A�#"�x;�Kw���^0�(�S�u��7ޑ+��S����@o��4	���żB��I�l�HGķ��ZX]*�	��Z��b�A�)e(��#pz��!V���LiS0Q	��س�	3�0������Z�:��F�Jm�]Z[�E��.Phc}u�r�6�D'5X�^�Ӿ���a?��i��-g��i hb�M�s!S��:�0K�n1^�ۙ2L�L�`u�m��::��P *༒�\��:=�Q��8�����ҫI L�4T�t�/۰�b�l��]H8*��N��	�XB[���f��J�J��uŝ�(�{a2ˡ-WT^Yi���T��R��~&>�T��Wj1��</9�Y)M�%��V#<��N<�{�
�q�= n!�����Q���gd���'�*b�>c$�P^?rUh�F��sp�P�ġ��g!K��]<ON�=0�����",ϣ�L܋0���dz�9v�Ty��
��>çl���S�§5E[�}�d� :�	K�	�Ã^�7"�@s(9zΓ";��$ߘ0�G����e��X� �3�x��V����1���<U����`>�8���9k��:@��	9or�:4º[������l �\�! V�G�C�Fs#��l�U]�#Q��y`F�2oJ՜�s��7�j��BK(� ,�s��5�۲��W�G�Ո�z���ș���"�]���ǔT2�Ȍ�s~���9�t!�յZe��Vj�F}�$��kK��?���:�Ad�  ��L�>>����^��A��c���H�Τ�Sh�bhaQ��Q8��Kc9H�C��>�l����N���'T����g�/�&/E=�o���R�Ϧ��u\��޴���/�Lr�|%l8��>��E�'�>c��qwU6l,y�=&����_Q�[hЧ��U)L^f�\C�7��mZ�*|1���0�5���(g�?F�#�Cg�[���:&c�=!f�Qz���G�M�������a6���pԭ�<ш��p��.��.�����A��d��D#��>O��3uLTB�>
������I�v�[�g2�9���C�O�м��o��7�1����X�7|����~�oo�ak|�����=b0�\O�&�v!�����k�g�	�m6�����9nIV4G�=#1/���Zw����-�o��N�dF<��Ts*��]"%@�-&�'m$F'�ˋv�8�@���x�\�-c�g��Q����zBo���P~�5�=��ɋ"�X,s?����������l�\׋��7.��iD%ri�3N�(�����͈�̐����7	�:�r0"*A��2k��Dͦ'Ms�[���1o��69�Lѫ��D��e��|qf�`Զ�J���4\?B���Yv� *�OQ��RrǠiD!.���WfN(/%Q]<#*�D'�e��,�8%��7zyN=�r�����ݫzFPO�����[5��q�N�o���i7fj�-x̉�1������ȫG�馄���>⚂ۣ�y�LJWiů��!�bVό �`����W%~�ł�XQ={~v�3�^�u��F!��)<l�6�̱R`�4�tG,2�j�xp~��!f��632����+U5&ܒ�]'�;%�����_+����3Z ��noO@�mu���s~gI�\0>��	͌�H�ӐC��KnBXF�k���
U�H*����$B��f��\8�.�8�5*����e�W"c):�(�;k��(��8�یڦ��N�%��lw���;Z5�*4��׽�r<��z�Y�1h�~�����%����?Ŏi
V�l�`V�AH�F��|
�>%�\f5>0Z����]V!�I�5�u!u���E
Y
��p%U�Vd�]ג�X�K�XB&K�S�1�;J?	���˗~�XU0g���ʜ�I�3�V���ױ͸�+�{3�A}�e˓j ����]����Fi`� �6m!�p6w.}˷�P��8��y��Z��؀��E�|����$ॻ���k����*-ӟW+F��Z�R_f��K�u��V�/`j��4��ܖ���\?�bXn~L�dU��B @�)��^#��<�����fa*<���/��{�}n{��Zt�/0ۖ��ҹc�@ce��t�mΕ痏yġz\�Y8��_3�+� �b�x�1�$v�<.:mB��5��&WrFЫ�^V�b�2�W���*�5�d>6\�u��x?7=��>���v�9P�I�-�j�Naʵ��t��
0X���3�J����0�`��E{�/��r�j@��fz�A�d<�u��F�#�E�Ӷi�B�S�����.��Qnv�==;�%�y`�*�Kb�(�{t��`Mt� UP���v�^��'�[oo����ޣ���#�76��PaHB�O���&qo^Q���O_��Q1p>������ܾ
���G>[;����ɹ�%-@>Ie�L����N;�����@Z�J'��e��ֵŝI�]r�YF
��Th��[���� ����	�> ��ܙ��
�"G����'	�~*�e�?���9�J���X�"�BQ��'�A�z,U_6=*^�qE)��
��8�O��F�(�5c=K΁�G@ξ�`_����!e4	rV�$c6��hS�����OT�+e	�� =�#!�Ra�����P�ǘrʆm;>k;�m�1��q�ۂMNQ���k�1�L���ȼЌak�\���wY$�O���y�}�%������uӆ�iZ��ƑZ`,��#��6�'�{�<4��j����<������KK�� "K8d�X0�W14�q��(þaZ��}���?Y�0�5��ė
�ǋ�0y�01C��� �e��a5�e�1��Y�5z���'㌤�(�����x��'8��ETK�]:��f�2����o�d�N��
 |?�9d�iu��D��}-ø�4� �I�:B�JftdΤFqxHx@TD�a�l>}u(+J{oNř���EdJ��4&;�?xzp���Ba���
lY��f�Ě���W䀏��Ch᪬�,�:���v1���&����b�����a�r��ŧ���a��9B�[��S���,���7[I'��'}��?����&��In�L��У��%.4I�iF����<����18;F{�,�0:���z�1��7Hw�>
$9��0Q��� �>y���2ok�n*!+��m:ķ�_S:ķ���]�6�`������������˕��1Y`��\�R�"r����6��W#Y1,�@�U�j����<=!VN��$��q�2�P�>�''��}�+�u3�I��j��0L����,�;��N��E8aX+��,���{Bݛ��Y̊G�f�v� �>7 ���@�-I^{���D��NHH(�Z��d��E�t�ՅA�����������O�{%'��лs����x�;�>�؝�/�ݩ�+�kwr��Ϗtw�����!v��?�ݩ�+Y����K˕_��+����,ի���56	 �[v���V��Օ�_M���wǔ� �l%��q"�sT����FAF\��4tH�I�+bc����|����F�O�!J7|��0��e���A�L[�A4Un诔&����d4ti.����CşO�{g��"�������+YاQ2X�]RԪmm��C�LY�9�Hq]�]�"P$�UNԷ>��&]�h��2:��f"yT�y<2�*wA�U�<O���H%�I�ǟ/n�rݏ��%H���U��z�����åq,�c��{����E5a�~�=����^���m<��}�]�1L�B\�R���Lw���o�/�=��=8�anzr$���`�x.�.�
�a�-��5Z���郳�`-.�7���u��=.�]|K��L�H��5�f�q�ȶ�<�2}T� 
�֠-���'��хC�L�ݙ��� {|È �b����%�T��|�����xC@<�w�Rs:�hW<%4�[r�`�t�qM��S��"�@Z�yp)���̓��B�Z���#X�o6y�E]�t����&�lU�kfZ��G�X��B��HOX�;Zd�������18dae�aX����Ә�d`�~���iuu�|�B��DN��'d���b��j��
u�n��˓k2	7�L&�RL&sڒ�&�Ŕ���%�-��hQ�И�k�oV�iNyY�#�N��rX��k�Z�0�a������P�;��)�L�X�H�a�s�������q\_F�p+�'&/TbD��g��R�~h�T�L��/�Y��&��$�ܩ��ܶ��эQ�S��*Iq^�5�k��Li�Yi~�]�Ԩڹ��ʳ�]8�h[5�Td/y�#�H1�H�[j2���V�m�n%V�]�Q����Y��4�}�"0#�	h[Ǵl�|'�7��0W��ă��#������� ��Q�4s�)||�|d��ug7�S���ґ�V�\2�>%�+UV�z�#�K��Ԩ�9;�R�=x%+:�����%I���`�?��$w3�~������y�T(������X�"�Hw��.ɤ���噘#�� �������^���\(H�(x�G����<N��&�<�;6"@�A�s#|Ǐ��P̾��"cF�V����� �i����Q����j��i)-S@9���U��߱F�ބ5�����o
�,<��E�����<b���`UK����bǰ~a��0�Z��Qzh��)�O����0P�}��_7�eݎ�X�q3��vwj2�ʤ�3:����:�tpc�� F0����a�A��#�N�
	�����\Ζ��4-��fU�TZ޵%^V���̐�._I�I�=�*ԩu1)�(EC�ǅd�Ů.=A��qV��Wc�_xO����\7̑��4��F����%�_�d%����c	,6����� }%#���}��B�I��Q� FL�Vzp���l_�� ��S�?�-x�C�u�W��gȺ��2"��"Z�C�E$�/��3��E���,l690���=�����ω�B�HvIp�w��A��a_�G�7��pTs)���KH��)�1��$���h���~MUn����>8���6��i��I��g����T*��,�%w(t��#��+�5��񘄗gs�%s`K��������۰Y`#�Utw���i��l�RFLE��;6�bK�ڱ������	J�Bm�-��P^ň�h��~ܓ�@6�r���Q��a���b}(d��jP�%�
�|�5�'�6� w��Ƭv���#h
������X�|5��Ɯ��0��v���C���VQʃ�Q$o�c�.� #Q��4�;cª��Y���s�H}��=�?]�o��y%
�
~O\��ޘoǕ������:��q�*sG��w�T$~}����Y�Ї�e�.�f�pM��aM+�n�0rKM�2.��	,6�����<M���x	�PzL�~����氓j��<��������S<\��GL��:ӽ�|>�R|�M=�\4��?�G^�1��w;���Я�/X$rB䊅M���t'�����آ�t:�-�5�q,q±�X��l�k��*~$���w5h���������ݸg�lL�����E$�vDă��;j���������ÌQ�,Od�D����\ݖ96��*f'z]��`>2��Y�x]�h��֎�a��(Tq�u�kl�bکC���
����:�TN|��t���T���j����M�l����u���nl���59�K��0���oyU���<���tv��,��]W�f�Drg���ގB���Z�䗄Y"v5��P�r��RtH��E^K��禴D,LY,��T㵣Q�;��*�X�6�
J�RF����)qp�o��t��^hET��3(P�K�cM]��[w�[o��c�C����Q�|���r?Hд֐�} 	���?�9y��33���`
QL�|3���,\�� �!&��L7vL��a�r+Rf�.o]������O<@;���� ��'�=.���E�JtJ.��#B7���Ə�}^�x�>�|���aDx��`fNV�0���H"���"uo���ˠ(G���X��r�E�cx�C6)�)a��Z��=���Q'�'�+���8Elqx)�T�����_"{�^����o�[��b�Y�N6s�=�<+YZŻ��2�����#���x� !"�`��T�Av�2�aD �-`X�މc�L�Ƈ	۶���b�;�^�1��*�(��<{10�Rg����_����
��r��^������jS��J�U����k#�K�MT��u9N��΍����,ݯ~$�v�`�S��u���H��52��)E�G��i�L�XΦ	O	rIF�S"N*H�?�0��rDM�\@��0����r&k��4��7���~>5�f�$'�D�� ��ә!C!�%D���������_����6k�;�9s��D� f�z�{m�@�zL&�h�E%g�r�p��=�Ń.%W��mLr�RD�;}�Q���
�Y�`��6/�s��R~�LR��ȷ���+l0{��ru�:��^��3��Wh�����2�����,m�ܝ�v="5)�'�0��[�+��C���hVh��A����#�-��`|ڦ��h!!7:��,��|84xp��@�>�b�;�+m9 C�D��TdC̖�U�
���*5ڰ���l{"�6lx��x%����ហ6?�E�e���a1�M$���#h�虿�e6`�p���t�ֵ��������Kޒ�q�aZ�~	�����Ώ
�E",��#r�(�(��x��`�� ����[_s��^?�j+�\����Wj�\my�#���|��F��N����M̙i�!���������g[�]�,��M�vv�q��E��[����&��� W�4��iM���y�YV������AJYZ��� LZ��M��Dv��\�z����K����?�4|���p����Ʉ�cr�riy �#��m�3ޣ��5b�ќa?�渙)��,Ni��H
�' �R�H�*�wP0x����{�;X�%{-gwk�GEcD����០�߱�J�����D(�$<(� ���Ty<�퇀nrx���$�ȁ�҈g� q7��?�Cߒ?u�h Qw��C�c`�a����h���D�	������ؐ[x��~�`z�
t�(��>�N%{�%��H��$�ꗨPW3�-IGKR�l��e�d��x��8�����̱������h#��XP5s���q��~K�,�%y*���N0��Уg���e��c�9mA0�E@$�9)v�h"����m�H�e���=����k��_\U��C���{�K��E�;^�t�+'�ă�Jm(��T�^$@ހ�s	muM�*��k <C���r��mc�6�|�T��X��
и���m ��&��Pt3�t<l�mr���-�N�N�.�W�߀؎o	�Z�l\�	�[LܠJ�"�U�W�^��q�r+E��K���t��9�JT�O*l=��-��|���7a��î�r$"�����W�
7����[6��U�����j�{�9�@arIBA���Z���=������T�b:�g�}K�+U�(!�ۈ������P���_��,|^_ �{*����C��7���0ţ����!�&��G�8 ����1�����*�~.�c$qfL� �\0 Dhn�9܏hE����b�����D�'��T�!|��B�Ч�$`���������F
�)���qJ4 �qb�ϡ�B�{�_PY����2�[Lp�/	DЃs/9�Nص��	��ق��/�]@��ْ;����36Lb{���w���tg��1�����z���0���!�����l$8H=@x0j�sl��ܸ���8�A�G�����;����9 ��@3�4�^%pQ&	@�oP�R�Nt�S�v���@�#eu�� �Y�QT��Z%���%!�
��O jbi c^��]�2t�ۮ1 ِ
��̳���� znItÙ�˦"r	�{�< �C-���N����Jc���`IX���������   �� ��c