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
import { calculateMixDesign } from "./engine/calculateMixDesign";
import { selectConcreteMixDesignRoute } from "./mix-design/core/concreteMixDesignSelector";
import { getMixDesignContract } from "./mix-design/core/mixDesignContracts";
import { getSpecializedInputDefinition, validateSpecializedInputValue, specializedInputErrorMessage } from "./mix-design/core/specializedInputDefinitions";
import { MixVersioningPanel } from "./components/MixVersioningPanel";
import { LandingPage } from "./components/LandingPage";
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
import { BatchMaterialPropertiesModal } from "./components/BatchMaterialPropertiesModal";
import { SmartMaterialRecommendationPanel } from "./components/materials/SmartMaterialRecommendationPanel";
import { MaterialsIntegrationAudit } from "./components/MaterialsIntegrationAudit";
import { validateCalculationLogic } from "./engine/validationGate";
import { EngineeringCore, ProjectSession } from "./engine/EngineeringCore";
import { CalculationValidationGatePanel } from "./components/CalculationValidationGatePanel";
import type { MixLifecycleStatus } from "./components/MixLifecyclePanel";
import { CONCRETE_TYPES_CATALOG, getConcreteTypeDetails, CONCRETE_TYPE_CONFIGS } from "./concreteTypes";
import { LogicalResultsSummary } from "./components/LogicalResultsSummary";
import { isUserMaterial } from "./engine/suitabilityGate";
import {
  getEligibleMaterials,
  getAvailableMaterialsForRole,
  validateMaterialSelection,
  isMaterialEligible
} from "./services/materialEligibilityService";
import { DreuxInputResolver, DreuxResolvedInputs } from "./services/dreuxInputResolver";
import { DreuxPreCalculationValidator, DreuxPreCalculationReport } from "./services/dreuxPreCalculationValidator";
import { inspectMixMaterialProperties } from "./services/materialPropertySchema";
import { evaluateEngineeringGate } from "./services/engineeringVerificationEngine";
import { SnoLabLogo } from "./components/SnoLabLogo";
import { STRUCTURAL_ELEMENTS, getStructuralElementById } from "./data/structuralElements";
import { SEEDED_MATERIALS } from "./data/seededMaterials";
import { useProjectStorage } from "./services/storage/ProjectContext";
import { useProjectWorkflow, ProjectStageNumber } from "./services/workflow/ProjectWorkflowController";
import { ProjectTopBarControls } from "./components/ProjectTopBarControls";
import { ProjectFileManagerModal } from "./components/ProjectFileManagerModal";
import { LocalProjectVault } from "./components/LocalProjectVault";
import { SettingsPanel } from "./components/SettingsPanel";
import { SidebarShell } from "./components/SidebarShell";
import { BatchPreparationCenter } from "./components/BatchPreparationCenter";
const QualityControlDashboard = React.lazy(() => import("./components/QualityControlDashboard").then(m => ({ default: m.QualityControlDashboard })));
const ProductionBatchTicket = React.lazy(() => import("./components/ProductionBatchTicket").then(m => ({ default: m.ProductionBatchTicket })));
const QualityAssetsDashboard = React.lazy(() => import("./components/QualityAssetsDashboard").then(m => ({ default: m.QualityAssetsDashboard })));

// Lazy-loaded heavy panels for core bundle size optimization
const LaboratoryDashboard = React.lazy(() => import("./components/materials-lab/LaboratoryDashboard").then(m => ({ default: m.LaboratoryDashboard })));
const EngineeringAIAdvisor = React.lazy(() => import("./components/EngineeringAIAdvisor").then(m => ({ default: m.EngineeringAIAdvisor })));
import { INITIAL_MATERIAL_TESTS } from "./data/seedMaterialTests";
import { MaterialTestRecord, TestApprovalStatus } from "./types/laboratoryTypes";
import { applyTestToMaterial } from "./services/materialLabSync";
import { evaluateProductionRelease } from "./services/productionReleaseGate";
import { can, resolveUserRole, separationOfDuties, UserRole } from "./services/permissions";
import type { CalibrationRecord, SampleRecord, TestDeviceRecord } from "./types/qualityDomain";
import type { LaboratorySession } from "./types/laboratorySessionTypes";
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
const MixOptimizationPanel = React.lazy(() => import("./components/MixOptimizationPanel").then(m => ({ default: m.MixOptimizationPanel })));
const CalculationJournal = React.lazy(() => import("./components/CalculationJournal").then(m => ({ default: m.CalculationJournal })));
const ReportCompliance = React.lazy(() => import("./components/ReportCompliance").then(m => ({ default: m.ReportCompliance })));
const ReportThermalAnalysis = React.lazy(() => import("./components/ReportThermalAnalysis").then(m => ({ default: m.ReportThermalAnalysis })));
import { WorkspaceWorkflowHeader } from "./components/WorkspaceWorkflowHeader";
import { WorkspaceTopBar } from "./components/WorkspaceTopBar";
import { WorkspaceLayout } from "./components/WorkspaceLayout";
import { WorkspaceEmptyState } from "./components/WorkspaceEmptyState";
import { ProjectRequirementsPanel } from "./components/ProjectRequirementsPanel";
import type { OnboardingRole } from "./services/workflow/onboarding";
import { EngineeringVerificationGate } from "./components/EngineeringVerificationGate";
import { CalculatorScreenFrame } from "./components/CalculatorScreenFrame";
import { CalculatorSectionHeader } from "./components/CalculatorSectionHeader";
import { CalculatorModeSelector } from "./components/CalculatorModeSelector";
import { CompressiveStrengthField } from "./components/CompressiveStrengthField";
import { ConcreteTypeSelector } from "./components/ConcreteTypeSelector";
import { DesignMethodStructuralSelector } from "./components/DesignMethodStructuralSelector";
import { BasicMixConditionsFields } from "./components/BasicMixConditionsFields";
import { SpecializedConcreteInputs } from "./components/SpecializedConcreteInputs";
import { CementSelectionCard } from "./components/CementSelectionCard";
import { SandSelectionCard } from "./components/SandSelectionCard";
import { GravelSelectionCard } from "./components/GravelSelectionCard";
import { WaterSelectionCard } from "./components/WaterSelectionCard";
import { ChemicalAdmixtureSelectionCard } from "./components/ChemicalAdmixtureSelectionCard";
import { MineralAdditionSelectionCard } from "./components/MineralAdditionSelectionCard";
import { FiberSelectionCard } from "./components/FiberSelectionCard";
import { SpecialBinderSelectionCard } from "./components/SpecialBinderSelectionCard";
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
  BookOpen,
  AlertCircle,
  FolderPlus,
  FolderOpen,
  FolderX,
  ChevronRight
} from "lucide-react";

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
  const rawConcrete = typeof inputs.concreteType === "string"
    ? inputs.concreteType
    : (inputs.concreteType as any)?.code || (inputs.concreteType as any)?.type || "NSC";
  return {
    ...inputs,
    concreteType: rawConcrete || "NSC",
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
    } else if (m.id && (m.id.startsWith("SYS-") || m.id.startsWith("preset-") || m.id.startsWith("standard-"))) {
      finalId = m.id;
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

    const isSystemMat =
      m.isSystem === true ||
      (m as any).sourceType === "SYSTEM" ||
      (m as any).sourceType === "system_demo" ||
      (m.id && (m.id.startsWith("SYS-") || m.id.startsWith("preset-") || m.id.startsWith("standard-")));

    let supplierName = m.supplierName;
    let quarryName = m.quarryName;
    let supplierContact = m.supplierContact;
    let certificationStatus = m.certificationStatus;

    // Map status accurately to one of the allowed union types
    let approvalStatus: any = "Approved";
    if (isSystemMat) {
      approvalStatus = "Approved";
    } else {
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

    const isPreset = isSystemMat || (m.id && (m.id.startsWith("preset-") || m.id.includes("seeded") || m.id.includes("fallback") || m.id.includes("default") || m.id.includes("demo")));
    const extraProps: Partial<EngineeringMaterial> = {};

    if (isSystemMat) {
      (extraProps as any).isSystem = true;
      (extraProps as any).sourceType = "SYSTEM";
      (extraProps as any).dataProvenance = "REFERENCE";
      (extraProps as any).validationStatus = "VALIDATED";
      (extraProps as any).readinessStatus = "READY";
      (extraProps as any).usableInMixDesign = true;
      (extraProps as any).requiredPropertiesComplete = true;
      (extraProps as any).approvalStatus = "Approved";
      (extraProps as any).ApprovalStatus = "Approved";
      (extraProps as any).certificationStatus = "Certified";

      if (m.category === "رمال") {
        const seVal = m.sandEquivalent !== undefined ? m.sandEquivalent : ((m as any).SandEquivalent !== undefined ? (m as any).SandEquivalent : (m.name.includes("ناعم") ? 72 : 84));
        extraProps.sandEquivalent = seVal;
        (extraProps as any).SandEquivalent = seVal;
      } else if (m.category === "حصى") {
        const laVal = (m as any).losAngelesAbrasion !== undefined ? (m as any).losAngelesAbrasion : ((m as any).LosAngeles !== undefined ? (m as any).LosAngeles : ((m as any).losAngeles !== undefined ? (m as any).losAngeles : 20));
        (extraProps as any).losAngelesAbrasion = laVal;
        (extraProps as any).LosAngeles = laVal;
        (extraProps as any).losAngeles = laVal;
      }
    }

    if (isPreset) {
      if (m.category === "رمال") {
        const se = (extraProps as any).SandEquivalent !== undefined ? (extraProps as any).SandEquivalent : (m.SandEquivalent !== undefined ? m.SandEquivalent : (m.name.includes("ناعم") ? 72 : 84));
        extraProps.SandEquivalent = se;
        extraProps.sandEquivalent = se;
        extraProps.MethyleneBlue = m.MethyleneBlue !== undefined ? m.MethyleneBlue : (m.name.includes("ناعم") ? 1.4 : 0.8);
        extraProps.Chlorides = m.Chlorides !== undefined ? m.Chlorides : 0.012;
        extraProps.Sulfates = m.Sulfates !== undefined ? m.Sulfates : 0.015;
      } else if (m.category === "حصى") {
        const la = (extraProps as any).LosAngeles !== undefined ? (extraProps as any).LosAngeles : (m.LosAngeles !== undefined ? m.LosAngeles : (m.name.includes("بسكرة") ? 16 : 22));
        extraProps.LosAngeles = la;
        (extraProps as any).losAngelesAbrasion = la;
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

/** Keep the built-in system catalogue visible even when an older local database exists. */
const mergeSeededMaterials = (stored: EngineeringMaterial[], deletedMap: Record<string, number> = {}) => {
  const existing = enrichMaterials(stored);
  const existingIds = new Set(existing.map(material => material.id));
  const seeded = enrichMaterials(SEEDED_MATERIALS).filter(material => {
    return !existingIds.has(material.id) && deletedMap[material.id] === undefined;
  });
  return [...existing, ...seeded];
};

export default function App() {
  const { language, setLanguage, t, isRtl, dir } = useLanguage();
  const {
    project: storageProject,
    fileName: storageFileName,
    saveStatus: storageSaveStatus,
    hasUnsavedChanges: storageHasUnsavedChanges,
    saveProject: saveCurrentProject,
    saveProjectAs: saveCurrentProjectAs,
    openProject: openProjectFile,
    backupProject: backupCurrentProject,
    exportProject: exportCurrentProject,
    importProjectFile: importCurrentProjectFile,
    updateMaterials: updateProjectMaterials,
    updateLaboratoryTests: updateProjectLaboratoryTests,
    updateMixInputs: updateProjectMixInputs,
    updateMixResults: updateProjectMixResults,
    saveNamedMix: saveNamedMixToProject,
    deleteNamedMix: deleteNamedMixFromProject,
    updateProjectMetadata
  } = useProjectStorage();

  // Central Six-Stage Project Workflow Controller
  const workflow = useProjectWorkflow();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showProjectPropertiesModal, setShowProjectPropertiesModal] = useState(false);
  const [isBatchPropertiesModalOpen, setIsBatchPropertiesModalOpen] = useState(false);



  // Local-only identity used for UI ownership labels; no remote account is created.
  const [user] = useState<any>({
    uid: "local-user",
    email: "local@device",
    displayName: "المستخدم المحلي",
    emailVerified: true,
    photoURL: null,
    role: resolveUserRole(typeof window !== "undefined" ? window.localStorage.getItem("snolab_user_role") : undefined)
  });
  const currentUserRole = resolveUserRole(user.role);

  const localizedLabel = (ar: string, fr: string, en: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };

  const getMaterialOptionLabel = (m: any) => {
    const isUser = isUserMaterial(m);
    const prefix = isUser
      ? (language === "ar" ? "👤 [مستودع مخصّص - معتمد من المهندس ✅] " : "👤 [Custom - Eng. Approved ✅] ")
      : (language === "ar" ? "⚙️ [مستودع النظام - مرجع قياسي ⚙️] " : "⚙️ [System - Standard Ref ⚙️] ");
    const name = language === "ar" ? m.name : (m.englishName || m.name);
    return `${prefix}${name}`;
  };

  const { themeSetting, setThemeSetting, themeMode } = useTheme();
  const [showThemeDropdown, setShowThemeDropdown] = useState<boolean>(false);

  // Sidebar navigation switcher tabs
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    | "calculator"
    | "batch_preparation"
    | "quality_control"
    | "batch_ticket"
    | "quality_assets"
    | "versions"
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
    let deletedMap: Record<string, number> = {};
    try {
      const saved = localStorage.getItem("mixwizard_materials_db");
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
          return mergeSeededMaterials(parsed, deletedMap).filter(m => {
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
    return mergeSeededMaterials([], deletedMap);
  });

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

  const handleSaveTestRecord = (testRecord: MaterialTestRecord, _syncedProps?: Record<string, any>) => {
    setMaterialTestRecords(prev => {
      const existingIndex = prev.findIndex(t => t.id === testRecord.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = testRecord;
        return updated;
      }
      return [testRecord, ...prev];
    });

    // Note: Laboratory test records are preserved exclusively in the lab archive/history
    // and do NOT mutate materialsDatabase or mix formulation inputs, ensuring they
    // do not interfere with calculation results.
  };

  const handleDeleteTestRecord = (testId: string) => {
    setMaterialTestRecords(prev => prev.filter(t => t.id !== testId));
  };

  const updateActiveProjectLabAssets = (patch: Partial<Pick<ActiveProject, "samples" | "testDevices" | "calibrations" | "laboratorySessions">>, message: string) => {
    if (!activeProjectId) return;
    const now = new Date().toISOString();
    setProjects(prev => prev.map(project => project.id === activeProjectId ? {
      ...project,
      ...patch,
      auditTrail: {
        ...project.auditTrail,
        lastModifiedAt: now,
        lastModifiedBy: user.uid,
        revisionHistory: [...(project.auditTrail?.revisionHistory || []), message],
        events: [...(project.auditTrail?.events || []), { id: `AUD-${Date.now()}`, type: "updated" as const, timestamp: now, actor: user.uid, entityId: project.id, message }]
      }
    } : project));
  };

  const handleAddLabSample = (sample: SampleRecord) => {
    updateActiveProjectLabAssets({ samples: [sample, ...(activeProject?.samples || [])] }, `Laboratory sample ${sample.sampleNumber} registered.`);
  };

  const handleAddLabDevice = (device: TestDeviceRecord) => {
    updateActiveProjectLabAssets({ testDevices: [device, ...(activeProject?.testDevices || [])] }, `Laboratory device ${device.name} registered.`);
  };

  const handleAddLabCalibration = (calibration: CalibrationRecord) => {
    const devices = (activeProject?.testDevices || []).map(device => device.id === calibration.deviceId ? {
      ...device,
      calibrationStatus: calibration.result === "fail" ? "expired" as const : "valid" as const,
      calibrationDueAt: calibration.dueAt
    } : device);
    updateActiveProjectLabAssets({ calibrations: [calibration, ...(activeProject?.calibrations || [])], testDevices: devices }, `Calibration certificate ${calibration.certificateNumber} registered.`);
  };

  const handleLaboratorySessionsChange = (sessions: LaboratorySession[]) => {
    updateActiveProjectLabAssets({ laboratorySessions: sessions }, `Laboratory request register updated (${sessions.length} session(s)).`);
  };

  const handleExportBackup = () => {
    const data = {
      version: "2.0",
      exportDate: new Date().toISOString(),
      materials: materialsDatabase,
      tests: materialTestRecords,
      activeProject,
      inputs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SnoLab_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.materials && Array.isArray(json.materials)) {
          setMaterialsDatabase(json.materials);
        }
        if (json.tests && Array.isArray(json.tests)) {
          setMaterialTestRecords(json.tests);
        }
        if (json.inputs) {
          setInputs(json.inputs);
        }
        alert(language === "ar" ? "تم استيراد البيانات بنجاح!" : "Data imported successfully!");
      } catch (err) {
        alert(language === "ar" ? "فشل قراءة الملف!" : "Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetDatabase = () => {
    if (window.confirm(language === "ar" ? "هل أنت متأكد من إعادة تعيين قاعدة المواد؟" : "Are you sure you want to reset the materials database?")) {
      setMaterialsDatabase([]);
      setMaterialTestRecords(INITIAL_MATERIAL_TESTS || []);
      localStorage.removeItem("mixwizard_materials_db");
      localStorage.removeItem("snolab_material_tests_v1");
    }
  };

  // Keep track of the current materialsDatabase to avoid stale closures in local updates
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

  // Load custom materials from the user's local browser storage.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mixwizard_materials_db");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = mergeSeededMaterials(parsed, Object.fromEntries(deletedMaterialIdsRef.current)).filter(m => {
            const delTime = deletedMaterialIdsRef.current.get(m.id);
            if (delTime !== undefined) {
              const updatedAt = m.updatedAt ? (typeof m.updatedAt === "number" ? m.updatedAt : new Date(m.updatedAt).getTime()) : 0;
              if (updatedAt < delTime) return false;
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
    setMaterialsDatabase(mergeSeededMaterials([], Object.fromEntries(deletedMaterialIdsRef.current)));
  }, []);

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

    localStorage.setItem("mixwizard_materials_seeded", "true");
  };

  const handleClearAllMaterials = async () => {
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

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return (workflow.projectIsOpen && storageProject?.metadata?.id) || "";
  });
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
    // If no project is open or storageProject has no metadata id, there is no active engineering project
    if (!workflow.projectIsOpen || !storageProject?.metadata?.id) {
      return null;
    }
    const meta = storageProject.metadata;
    // Strictly locate matching project by authoritative storageProject.metadata.id without fallback to projects[0]
    const base = projects.find(p => p.id === meta.id);
    return {
      ...(base || {}),
      id: meta.id,
      name: meta.name || currentProject || base?.name || "Untitled Project",
      client: meta.client || currentClient || base?.client || "",
      plant: meta.plant || currentPlant || base?.plant || "",
      createdDate: meta.createdDate || base?.createdDate || new Date().toISOString().split("T")[0],
      notes: storageProject.notes?.map((n: any) => n.content) || (base as any)?.notes || []
    };
  }, [workflow.projectIsOpen, projects, storageProject, currentProject, currentClient, currentPlant]);

  // Synchronize storageProject with local states when an external project is opened or created
  const lastLoadedProjectIdRef = useRef<string>("");
  useEffect(() => {
    if (storageProject?.metadata?.id && storageProject.metadata.id !== lastLoadedProjectIdRef.current) {
      lastLoadedProjectIdRef.current = storageProject.metadata.id;
      setActiveProjectId(storageProject.metadata.id);
      if (storageProject.metadata.name) setCurrentProject(storageProject.metadata.name);
      if (storageProject.metadata.client) setCurrentClient(storageProject.metadata.client);
      if (storageProject.metadata.plant) setCurrentPlant(storageProject.metadata.plant);
      if (storageProject.materials && storageProject.materials.length > 0) {
        setMaterialsDatabase(storageProject.materials);
      }
      if (storageProject.laboratoryTests && storageProject.laboratoryTests.length > 0) {
        setMaterialTestRecords(storageProject.laboratoryTests);
      }
      if (storageProject.mixDesigns?.currentInputs) {
        setInputs(prev => ({
          ...prev,
          ...storageProject.mixDesigns.currentInputs
        }));
      }
    }
  }, [storageProject?.metadata?.id]);

  // Synchronize activeProjectId strictly when project is closed or opened
  useEffect(() => {
    if (!workflow.projectIsOpen) {
      lastLoadedProjectIdRef.current = "";
      setActiveProjectId("");
    } else if (storageProject?.metadata?.id) {
      setActiveProjectId(storageProject.metadata.id);
    }
  }, [workflow.projectIsOpen, storageProject?.metadata?.id]);

  // Single Source of Truth for current project stage (1..7)
  const activeStep = workflow.currentStage;

  const handleStepClick = (stepNum: number) => {
    const success = workflow.goToStage(stepNum as ProjectStageNumber);
    if (success) {
      const targetTab = workflow.getTabForStage(stepNum as ProjectStageNumber);
      setActiveSidebarTab(targetTab);
    }
  };

  const handleRequirementsInputChange = (patch: Partial<MixDesignInput>) => {
    setInputs(prev => {
      const next = { ...prev, ...patch };
      updateProjectMixInputs(next);
      return next;
    });
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



  const [savedMixes, setSavedMixes] = useState<any[]>([]);
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const mixLifecycleStatus: MixLifecycleStatus = activeProject?.mixLifecycleStatus || "draft";

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

  // Restore saved mixes from the user's local browser storage.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("snolab_saved_mixes");
      const mixes = stored ? JSON.parse(stored) : [];
      setSavedMixes(Array.isArray(mixes) ? mixes : []);
    } catch {
      setSavedMixes([]);
    }
  }, []);

  // Draft persistence is intentionally independent from final approval.
  const handleSaveMix = async (nameOverride?: string, lifecycleStatus: MixLifecycleStatus = "draft", e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const requestedName = (nameOverride || saveName).trim();
    if (!requestedName) {
      setSaveError(localizedLabel("الرجاء إدخال اسم مميز للخلطة", "Veuillez entrer un nom unique pour la formule", "Please enter a unique name for the mix design"));
      return;
    }
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      saveNamedMixToProject(requestedName, inputs, results, currency);
      const newMix = {
        id: "mix_" + Date.now(),
        name: requestedName,
        inputs: { ...inputs },
        results: results ? { ...results } : undefined,
        currency: currency,
        createdAt: new Date().toISOString(),
        lifecycleStatus,
        criticalErrors: validationGate.criticalErrors.length,
        warnings: validationGate.warnings.length
      };
      setSavedMixes(prev => [newMix, ...prev.filter(m => m.id !== newMix.id)]);
      localStorage.setItem("snolab_saved_mixes", JSON.stringify([newMix, ...savedMixes.filter(m => m.id !== newMix.id)]));
      setSaveName("");
      setSaveSuccess(localizedLabel("تم حفظ الخلطة كمسودة قابلة للمراجعة.", "Formule enregistrée comme brouillon révisable.", "Mix design saved as a reviewable draft."));
      setTimeout(() => setSaveSuccess(""), 4000);
    } catch (err) {
      console.error("Error saving mix: ", err);
      setSaveError(localizedLabel("فشلت عملية الحفظ. الرجاء المحاولة ثانية.", "Échec de la sauvegarde. Veuillez réessayer.", "Save operation failed. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTrialMix = (trial: { slump: number; freshDensity: number; concreteTemp: number; strength28d: number; notes: string; status: "PASSED" | "WARNING" | "FAILED" }) => {
    if (!can(currentUserRole, "record-trial-mix")) {
      setSaveError(localizedLabel("دور المستخدم الحالي لا يسمح بتسجيل Trial Mix.", "Le rôle actuel ne permet pas d'enregistrer une gâchée d'essai.", "The current role cannot record a trial mix."));
      return;
    }
    const now = new Date().toISOString();
    const record = {
      id: `TRIAL-${Date.now()}`,
      name: `Trial Mix ${new Date().toLocaleDateString("en-CA")}`,
      date: now,
      testingDate: now,
      supervisor: user.displayName,
      location: activeProject?.plant || "",
      inputsSnapshot: { ...inputs },
      resultsSnapshot: { ...results },
      labInputs: {
        slump: trial.slump, slumpFlow: 0, freshDensity: trial.freshDensity, airContent: Number(inputs.airContent || 0), concreteTemp: trial.concreteTemp,
        strength1d: 0, strength3d: 0, strength7d: 0, strength28d: trial.strength28d, strength56d: 0, strength90d: 0,
        waterAbsorption: 0, permeabilityIndex: 0, chloridePenetration: "Not tested", sulfateResistanceRating: "Not tested",
        schmidtHammer: 0, upvSpeed: 0, coreTestResult: 0
      },
      validationScore: trial.status === "PASSED" ? 100 : null,
      rating: trial.status === "PASSED" ? "Acceptable" : trial.status === "FAILED" ? "Failed" : "N/A",
      status: trial.status,
      engineeringComments: [trial.notes || "Trial mix record entered from batch preparation center."],
      engineerNotes: trial.notes,
      materialSnapshots: activeProject?.materialSnapshots,
      createdAt: now
    } as any;
    setProjects(prev => prev.map(project => project.id === activeProjectId ? {
      ...project,
      validationRecords: [record, ...(project.validationRecords || [])],
      mixLifecycleStatus: trial.status === "PASSED" ? "performance-verified" : "trial-mix-required",
      auditTrail: {
        ...project.auditTrail,
        lastModifiedAt: now,
        lastModifiedBy: user.uid,
        revisionHistory: [...(project.auditTrail?.revisionHistory || []), `Trial mix ${record.id} recorded with status ${trial.status}.`],
        events: [...(project.auditTrail?.events || []), { id: `AUD-${Date.now()}`, type: "trial-mix-recorded", timestamp: now, actor: user.uid, entityId: record.id, message: `Trial mix recorded with status ${trial.status}.`, metadata: { strength28d: trial.strength28d } }]
      }
    } : project));
    setSaveSuccess(localizedLabel("تم حفظ سجل الخلطة التجريبية. لا يزال الاعتماد يتطلب اجتياز جميع البوابات.", "La gâchée d'essai a été enregistrée; les autres portes restent obligatoires.", "Trial mix record saved; all other release gates remain mandatory."));
  };

  const handleApproveMix = () => {
    if (!can(currentUserRole, "approve-production")) {
      setSaveError(localizedLabel("لا يملك المستخدم صلاحية اعتماد الإنتاج. يلزم دور Approver مستقل.", "Le rôle actuel ne peut pas libérer la production. Un approbateur indépendant est requis.", "The current role cannot approve production. An independent approver role is required."));
      return;
    }
    if (!separationOfDuties(activeProject?.auditTrail?.createdBy, user.uid)) {
      setSaveError(localizedLabel("فشل فصل المهام: يجب أن يكون المعتمد مختلفًا عن منشئ المشروع.", "Séparation des tâches impossible: l'approbateur doit être différent du créateur.", "Separation of duties failed: the approver must differ from the project creator."));
      return;
    }
    if (!validationGate.isValidForReport || validationGate.criticalErrors.length > 0 || validationGate.warnings.length > 0) {
      setSaveError(localizedLabel("لا يمكن اعتماد الخلطة مع وجود أخطاء حرجة أو تحذيرات هندسية؛ احفظها للمراجعة أولاً.", "Le mélange ne peut pas être approuvé avec des erreurs ou avertissements d'ingénierie ; enregistrez-le pour revue.", "The mix cannot be approved while critical errors or engineering warnings remain; save it for review first."));
      return;
    }
    const release = evaluateProductionRelease(activeProject, results, validationGate);
    if (!release.canRelease) {
      setSaveError(localizedLabel(
        "لا يمكن إصدار الخلطة للإنتاج قبل توثيق خلطة تجريبية ناجحة واعتماد جميع بوابات التحقق.",
        "La libération en production exige une gâchée d'essai réussie et la validation de toutes les portes techniques.",
        "Production release requires a passed documented trial mix and all engineering gates to pass."
      ));
      return;
    }
    const approvedAt = new Date().toISOString();
    const approvedBy = "local-engineer";
    setProjects(prev => prev.map(project => project.id === activeProjectId ? {
      ...project,
      mixLifecycleStatus: "approved",
      mixApprovedAt: approvedAt,
      mixApprovedBy: approvedBy,
      auditTrail: {
        ...project.auditTrail,
        lastModifiedAt: approvedAt,
        lastModifiedBy: approvedBy,
        revisionHistory: [...(project.auditTrail?.revisionHistory || []), "Mix approved after validation gate passed."],
        events: [...(project.auditTrail?.events || []), { id: `AUD-${Date.now()}`, type: "approved", timestamp: approvedAt, actor: approvedBy, entityId: project.id, message: "Mix approved for production after all release gates passed.", metadata: { lifecycleStatus: "approved" } }]
      }
    } : project));
    setSaveSuccess(localizedLabel("تم اعتماد الخلطة وتسجيل عملية الاعتماد.", "Formule approuvée et action enregistrée.", "Mix approved and approval action recorded."));
  };

  // Action: Delete a saved mix
  const handleDeleteMix = async (mixId: string) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا التصميم من ملف المشروع؟")) return;
    try {
      deleteNamedMixFromProject(mixId);
      setSavedMixes(prev => prev.filter(m => m.id !== mixId));
      localStorage.setItem("snolab_saved_mixes", JSON.stringify(savedMixes.filter(m => m.id !== mixId)));
    } catch (err) {
      console.error("Error deleting mix: ", err);
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

  const [specializedInputErrors, setSpecializedInputErrors] = useState<Record<string, string>>({});
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

  // Central Engineering Session - Single Source of Truth
  const isApprovedAndActive = (m: any) => {
    if (!m) return false;
    // Centralized strict engineering governance check
    const evalRes = isMaterialEligible(m, inputs?.selectedMethod || "dreux", inputs?.concreteType || "NSC", activeProject);
    return evalRes.eligible;
  };

  const renderMaterialSourceBadge = (materialId: string | null | undefined, roleName?: string) => {
    if (!materialId) return null;
    const mat = materialsDatabase.find(m => m.id === materialId);
    if (!mat) return null;
    const isUser = isUserMaterial(mat);
    const evalRes = isMaterialEligible(mat, inputs?.selectedMethod || "dreux", inputs?.concreteType || "NSC", activeProject);

    if (!evalRes.eligible) {
      return (
        <div className="mt-1.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[9.5px] text-amber-800 dark:text-amber-300 space-y-1">
          <div className="flex items-center justify-between gap-1 font-black">
            <div className="flex items-center gap-1">
              <span>⚠️</span>
              <span>{language === "ar" ? "توجد خصائص هندسية ناقصة لهذه المادة" : "Missing material properties"}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsBatchPropertiesModalOpen(true)}
              className="text-[9px] px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all cursor-pointer shrink-0"
            >
              {language === "ar" ? "إكمال الخصائص" : "Complete"}
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            {evalRes.reasonsAr && evalRes.reasonsAr.length > 0
              ? (language === "ar" ? evalRes.reasonsAr[0] : (evalRes.reasonsEn[0] || evalRes.reasonsAr[0]))
              : (language === "ar" ? "توجد خصائص ناقصة يمكن إكمالها مباشرة من هنا." : "Missing required properties.")}
          </p>
        </div>
      );
    }

    return (
      <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border w-fit ${
        isUser
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
          : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isUser ? "bg-emerald-500" : "bg-blue-500"}`}></span>
        <span>
          {isUser
            ? (language === "ar" ? "مستودع المستخدم (معتمد رسمياً من المهندس ✅)" : "User Material (Engineer Approved ✅)")
            : (language === "ar" ? "مستودع النظام (مرجع قياسي معتمد ⚙️)" : "System Material (Standard & Verified ⚙️)")}
        </span>
      </div>
    );
  };

  const engineeringGate = useMemo(() => {
    return evaluateEngineeringGate(inputs, activeSidebarTab, materialsDatabase, activeProject);
  }, [inputs, activeSidebarTab, materialsDatabase, activeProject]);

  const activeSession = useMemo(() => {
    // Construct a project snap combining active details and current edited inputs
    const projectWithCurrentInputs = {
      ...(activeProject || {}),
      inputs: { ...inputs },
    };
    return EngineeringCore.createSession(projectWithCurrentInputs, materialsDatabase);
  }, [activeProject, inputs, materialsDatabase]);

  const activeMixMaterialsList = useMemo(() => {
    const list: { role: string; material: EngineeringMaterial }[] = [];
    const db = materialsDatabase || storageProject.materials || [];
    const addIf = (id: string | undefined, role: string) => {
      if (id) {
        const found = db.find((m: any) => m.id === id);
        if (found) list.push({ role, material: found });
      }
    };
    addIf(inputs.selectedCementId, "cement");
    addIf(inputs.selectedSandId, "sand");
    addIf(inputs.selectedGravelId, "gravel");
    addIf(inputs.selectedAdmixtureId, "admixture");
    addIf(inputs.selectedScmId, "scm");
    addIf(inputs.selectedWaterId, "water");
    addIf(inputs.selectedFiberId, "fiber");
    addIf(inputs.selectedSpecialBinderId, "specialBinder");
    return list;
  }, [
    inputs.selectedCementId,
    inputs.selectedSandId,
    inputs.selectedGravelId,
    inputs.selectedAdmixtureId,
    inputs.selectedScmId,
    inputs.selectedWaterId,
    inputs.selectedFiberId,
    inputs.selectedSpecialBinderId,
    materialsDatabase,
    storageProject.materials
  ]);

  const mixMaterialsPropertiesSummary = useMemo(() => {
    return inspectMixMaterialProperties(
      activeMixMaterialsList,
      inputs.selectedMethod || (inputs as any).method || "dreux",
      inputs.concreteType || "NSC",
      language as any
    );
  }, [activeMixMaterialsList, inputs.selectedMethod, (inputs as any).method, inputs.concreteType, language]);

  const handleBatchPropertiesSave = (updatedMats: EngineeringMaterial[], updatedInp: MixDesignInput) => {
    setMaterialsDatabase(updatedMats);
    setInputs(updatedInp);
    updateProjectMaterials(updatedMats);
    updateProjectMixInputs(updatedInp);
    setIsBatchPropertiesModalOpen(false);
    setNotifications(prev => [
      {
        id: String(Date.now()),
        textAr: "✓ تم تحديث وحفظ جميع خصائص المواد بنجاح في الخلطة والمستودع.",
        textFr: "✓ Toutes les caractéristiques des matériaux ont été enregistrées avec succès.",
        textEn: "✓ All material properties have been successfully updated and saved.",
        read: false
      },
      ...prev
    ]);
  };

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
      return mat?.density ?? Number.NaN;
    }
    if (property === "sandRelativeDensity") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedSandId);
      return mat?.density ?? mat?.specificGravity ?? Number.NaN;
    }
    if (property === "gravelRelativeDensity") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedGravelId);
      return mat?.density ?? mat?.specificGravity ?? Number.NaN;
    }
    if (property === "sandAbsorption") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedSandId);
      return mat?.absorption ?? Number.NaN;
    }
    if (property === "gravelAbsorption") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedGravelId);
      return mat?.absorption ?? Number.NaN;
    }
    if (property === "dMax") {
      const mat = materialsDatabase.find(m => m.id === inputs.selectedGravelId);
      return mat?.dMax !== undefined ? mat.dMax : 0;
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
    if (designerMode === "normal" && inputs.fck28) {
      const recs = getRecommendedCoefficients(
        inputs.concreteType || "NSC",
        inputs.selectedMethod || "dreux",
        inputs.fck28,
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
      const absorption = matched.absorption !== undefined ? matched.absorption : 0;
      const moisture = matched.moisture !== undefined ? matched.moisture : 0;
      const maxS = matched.dMax !== undefined ? matched.dMax : inputs.dMax;
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

  // Centralized Dreux-Gorisse Input Resolution
  const resolvedDreuxInputs = useMemo<DreuxResolvedInputs>(() => {
    return DreuxInputResolver.resolve(inputs, materialsDatabase, language);
  }, [inputs, materialsDatabase, language]);

  // Centralized Dreux-Gorisse Pre-Calculation Validation Gate
  const dreuxPreCalcReport = useMemo<DreuxPreCalculationReport>(() => {
    return DreuxPreCalculationValidator.validate(resolvedDreuxInputs);
  }, [resolvedDreuxInputs]);

  // Generate an inputs copy where all prices are normalized to DZD and physical properties are derived from DreuxInputResolver
  const normalizedInputsForCalc = useMemo(() => {
    const copy = { ...inputs };

    // 1. Cement
    copy.cementDensity = resolvedDreuxInputs.cement.density;
    copy.cementClassStrength = resolvedDreuxInputs.cement.strengthClass;
    if (resolvedDreuxInputs.cement.materialId) {
      const mat = materialsDatabase.find(m => m.id === resolvedDreuxInputs.cement.materialId);
      if (mat?.price !== undefined && mat?.price !== null) copy.priceCement = mat.price;
    }

    // 2. Sand
    copy.sandRelativeDensity = resolvedDreuxInputs.fineAggregate.density;
    copy.sandAbsorption = resolvedDreuxInputs.fineAggregate.absorption;
    copy.moistureSand = resolvedDreuxInputs.fineAggregate.moisture;
    copy.finenessModulus = resolvedDreuxInputs.finenessModulus;
    if (resolvedDreuxInputs.fineAggregate.materialId) {
      const mat = materialsDatabase.find(m => m.id === resolvedDreuxInputs.fineAggregate.materialId);
      if (mat?.price !== undefined && mat?.price !== null) copy.priceSand = mat.price;
    }

    // 3. Gravel
    copy.gravelRelativeDensity = resolvedDreuxInputs.coarseAggregate.density;
    copy.gravelAbsorption = resolvedDreuxInputs.coarseAggregate.absorption;
    copy.moistureGravel = resolvedDreuxInputs.coarseAggregate.moisture;
    copy.dMax = resolvedDreuxInputs.dMax;
    copy.aggregateType = resolvedDreuxInputs.aggregateType;
    copy.aggregateQuality = resolvedDreuxInputs.aggregateQuality;
    if (resolvedDreuxInputs.coarseAggregate.materialId) {
      const mat = materialsDatabase.find(m => m.id === resolvedDreuxInputs.coarseAggregate.materialId);
      if (mat?.price !== undefined && mat?.price !== null) copy.priceGravel = mat.price;
    }

    // 4. Water
    if (resolvedDreuxInputs.water.ph !== undefined) copy.selectedWaterPH = resolvedDreuxInputs.water.ph;
    if (resolvedDreuxInputs.water.chlorides !== undefined) copy.selectedWaterChlorideContent = resolvedDreuxInputs.water.chlorides;
    if (resolvedDreuxInputs.water.sulfates !== undefined) copy.selectedWaterSulphateContent = resolvedDreuxInputs.water.sulfates;
    if (resolvedDreuxInputs.water.materialId) {
      const mat = materialsDatabase.find(m => m.id === resolvedDreuxInputs.water.materialId);
      if (mat?.price !== undefined && mat?.price !== null) copy.priceWater = mat.price;
    }

    // 5. Admixture
    if (resolvedDreuxInputs.admixture) {
      copy.selectedAdmixtureWaterReduction = resolvedDreuxInputs.admixture.waterReduction;
      copy.selectedAdmixtureDensity = resolvedDreuxInputs.admixture.density;
      if (inputs.dosageSuper <= 0) copy.dosageSuper = resolvedDreuxInputs.admixture.dosagePercent;
      const mat = materialsDatabase.find(m => m.id === resolvedDreuxInputs.admixture.materialId);
      if (mat?.price !== undefined && mat?.price !== null) copy.priceSuper = mat.price;
    }

    // 6. SCM
    if (resolvedDreuxInputs.scm) {
      copy.selectedScmDensity = resolvedDreuxInputs.scm.density;
      copy.selectedScmWaterDemandFactor = resolvedDreuxInputs.scm.waterDemandFactor;
      copy.selectedScmPozzolanicIndex = resolvedDreuxInputs.scm.pozzolanicIndex;
      const mat = materialsDatabase.find(m => m.id === resolvedDreuxInputs.scm.materialId);
      if (mat?.price !== undefined && mat?.price !== null) {
        const scmTypeStr = String(mat.category || mat.type || "").toLowerCase();
        if (scmTypeStr.includes("silica") || scmTypeStr.includes("سيليكا")) copy.priceSilicaFume = mat.price;
        else if (scmTypeStr.includes("fly") || scmTypeStr.includes("رماد")) copy.priceFlyAsh = mat.price;
        else if (scmTypeStr.includes("slag") || scmTypeStr.includes("خبث")) copy.priceSlag = mat.price;
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
  }, [inputs, currency, materialsDatabase, resolvedDreuxInputs]);

  // Live calculated results routed by concrete type. Dreux remains the baseline
  // for NSC/structural hybrid routes; specialized types use their registered engine.
  const results = useMemo(() => {
    const route = selectConcreteMixDesignRoute(normalizedInputsForCalc, "auto");

    if (route.mode === "specialized") {
      const specializedResult = calculateMixDesign({
        ...normalizedInputsForCalc,
        enforceInputContract: true
      }) as any;
      const calculationSteps = Array.isArray(specializedResult.calculationSteps)
        ? specializedResult.calculationSteps.map((step: any) => step.label || step.message || String(step))
        : [];
      return {
        ...specializedResult,
        detailedSteps: specializedResult.detailedSteps || calculationSteps,
        gradingCurve: specializedResult.gradingCurve || [],
        strengthEvolution: specializedResult.strengthEvolution || [],
        standardsCompliance: specializedResult.standardsCompliance || specializedResult.compliance?.checks || [],
        cementitiousMaterials: specializedResult.cementitiousMaterials || {
          cement: specializedResult.cementKg || 0,
          flyAsh: 0,
          slag: 0,
          silicaFume: specializedResult.scmKg || 0
        },
        costBreakdown: specializedResult.costBreakdown || [],
        calculationMode: "specialized",
        dreuxPreCalcReport,
        dreuxInputTrace: resolvedDreuxInputs.trace
      };
    }

    // If Dreux pre-calculation validation blocked the run, return structured diagnostic report
    if (!dreuxPreCalcReport.canCalculate) {
      const errorMsg = language === "ar"
        ? dreuxPreCalcReport.summaryAr
        : language === "fr"
          ? (dreuxPreCalcReport as any).summaryFr || dreuxPreCalcReport.summaryEn
          : dreuxPreCalcReport.summaryEn;

      return {
        valid: false,
        isValid: false,
        errors: dreuxPreCalcReport.missingOrInvalidItems.map(i =>
          language === "ar"
            ? `${i.propertyAr}: ${i.statusAr} - ${i.actionAr}`
            : language === "fr"
              ? `${(i as any).propertyFr || i.property}: ${(i as any).statusFr || i.status} - ${(i as any).actionFr || i.action}`
              : `${i.property}: ${i.status} - ${i.action}`
        ),
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
        dreuxPreCalcReport,
        dreuxInputTrace: resolvedDreuxInputs.trace,
        materialSuitability: {
          status: "blocked",
          missingMaterials: dreuxPreCalcReport.missingOrInvalidItems.map(i => i.materialRole),
          invalidMaterials: [],
          incompatibleMaterials: [],
          warnings: [errorMsg],
          recommendations: dreuxPreCalcReport.missingOrInvalidItems.map(i =>
            language === "ar" ? `${i.propertyAr}: ${i.actionAr}` : language === "fr" ? `${(i as any).propertyFr || i.property}: ${(i as any).actionFr || i.action}` : `${i.property}: ${i.action}`
          )
        }
      };
    }

    const calcResult = calculateDreuxGorisse(normalizedInputsForCalc);
    if (calcResult.materialSuitability && (calcResult.materialSuitability.status as string) === "diagnostic_only") {
      calcResult.materialSuitability.status = "blocked";
    }
    (calcResult as any).dreuxPreCalcReport = dreuxPreCalcReport;
    (calcResult as any).dreuxInputTrace = resolvedDreuxInputs.trace;
    return calcResult;
  }, [normalizedInputsForCalc, dreuxPreCalcReport, resolvedDreuxInputs, language]);

  // Central Calculation Validation Gate
  const validationGate = useMemo(() => {
    return validateCalculationLogic({
      ...inputs,
      currentProject,
      currentClient,
      currentPlant,
      materialsDatabase
    }, results, language);
  }, [inputs, results, language, currentProject, currentClient, currentPlant]);

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

  // Helper versions management; a saved copy is not silently certified.
  const handleSaveVersion = (name: string, isOptimized?: boolean, lifecycleStatus: MixLifecycleStatus = "draft") => {
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
    const revisionStr = `Saved ${lifecycleStatus} mix version "${name}" (ID: ${currentMixId}).`;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const oldVersions = p.mixVersions || [];
        const priorApproved = oldVersions.find(version => version.lifecycleStatus === "approved" || version.lifecycleStatus === "performance-verified");
        const revisionNumber = oldVersions.reduce((max, version) => Math.max(max, Number(version.revisionNumber || 0)), 0) + 1;
        const serializedSnapshot = JSON.stringify({ inputs, results, materialIds });
        let snapshotHash = 0;
        for (let index = 0; index < serializedSnapshot.length; index++) snapshotHash = ((snapshotHash << 5) - snapshotHash + serializedSnapshot.charCodeAt(index)) | 0;
        const immutableHash = `sha1-lite-${Math.abs(snapshotHash).toString(16)}`;
        const revisionHistory = [...(p.auditTrail?.revisionHistory || []), revisionStr];

        const newVer = {
          id: `VER-${Date.now()}`,
          name,
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          lifecycleStatus,
          inputs: JSON.parse(JSON.stringify(inputs)),
          results: JSON.parse(JSON.stringify(results)),
          isOptimized,
          materialSnapshots: versionSnapshots,
          projectId: p.id,
          mixId: currentMixId,
          revisionNumber,
          revisionOf: priorApproved?.id,
          immutableHash,
          isImmutable: lifecycleStatus === "approved" || lifecycleStatus === "performance-verified",
          materialIds,
          calculationVersion: "SNO-v3.5L",
          auditTrail: {
            createdBy: p.auditTrail?.createdBy || "senoussi.s.t@gmail.com",
            createdAt: p.auditTrail?.createdAt || p.createdDate || new Date().toISOString().split('T')[0],
            lastModifiedBy: "senoussi.s.t@gmail.com",
            lastModifiedAt: new Date().toISOString(),
            revisionHistory,
            events: [{ id: `AUD-${Date.now()}`, type: "revision-created", timestamp: new Date().toISOString(), actor: "senoussi.s.t@gmail.com", entityId: currentMixId, message: `Revision ${revisionNumber} created from current engineering snapshot.`, metadata: { revisionNumber, immutable: lifecycleStatus === "approved" || lifecycleStatus === "performance-verified" } }]
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
            revisionHistory,
            events: [...(p.auditTrail?.events || []), { id: `AUD-${Date.now()}`, type: "revision-created", timestamp: new Date().toISOString(), actor: "senoussi.s.t@gmail.com", entityId: currentMixId, message: `Revision ${revisionNumber} created from current engineering snapshot.`, metadata: { revisionNumber, immutable: lifecycleStatus === "approved" || lifecycleStatus === "performance-verified" } }]
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
    if (!can(currentUserRole, "delete-version")) {
      setSaveError(localizedLabel("لا يملك المستخدم صلاحية حذف الإصدارات.", "Le rôle actuel ne peut pas supprimer les versions.", "The current role cannot delete versions."));
      return;
    }
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
    const aVol = (results.admixtureWeights || []).reduce((s, a) => s + (a?.weight || 0), 0) / 1.1; // estimate chemistry density as 1.1 kg/L
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
    const wcRatio = results.wcRatioAdjusted ?? results.wcRatio;
    const controlClass = inputs.controlClass;
    const aggregateQuality = inputs.aggregateQuality;
    const admixturesCount = results.admixtureWeights?.length || 0;
    const hasPumping = inputs.hasPumping;
    const exposureClass = inputs.exposureClass;
    const sandAbsorption = activeResolvedMats.sand?.absorption;
    const gravelAbsorption = activeResolvedMats.gravel?.absorption;
    const sandFineness = activeResolvedMats.sand?.finenessModulus;
    const admixtureRatio = inputs.dosageSuper || 0;
    const codeCompliance = results.standardsCompliance?.every(item => item.status === "compliant") ?? true;
    const finalDensity = results.totalFreshDensity;

    // 1. W/C Ratio (max 15 pt)
    if (wcRatio !== undefined) {
      if (wcRatio >= 0.40 && wcRatio <= 0.48) {
        score += 15;
      } else if (wcRatio > 0.48 && wcRatio <= 0.55) {
        score += 8;
      } else {
        score -= 5;
      }
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
    const isAggressiveExp = exposureClass ? ["XD1", "XD2", "XD3", "XS1", "XS2", "XS3", "XA1", "XA2", "XA3"].includes(exposureClass) : false;
    if (exposureClass) {
      if (isAggressiveExp && wcRatio !== undefined && wcRatio <= 0.45) {
        score += 10;
      } else if (!isAggressiveExp) {
        score += 8;
      } else {
        score -= 3;
      }
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
    if (sandAbsorption !== undefined) {
      if (sandAbsorption <= 1.2) {
        score += 8;
      } else if (sandAbsorption <= 2.2) {
        score += 5;
      } else {
        score += 1;
      }
    }

    // 6. Gravel Absorption (max 7 pt)
    if (gravelAbsorption !== undefined) {
      if (gravelAbsorption <= 0.8) {
        score += 7;
      } else if (gravelAbsorption <= 1.5) {
        score += 4;
      } else {
        score += 0;
      }
    }

    // 7. Sand Fineness Modulus (max 10 pt)
    if (sandFineness !== undefined) {
      if (sandFineness >= 2.4 && sandFineness <= 2.9) {
        score += 10;
      } else {
        score += 5;
      }
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
    if (finalDensity !== undefined) {
      if (finalDensity >= 2380) {
        score += 10;
      } else if (finalDensity >= 2300) {
        score += 7;
      } else {
        score += 3;
      }
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
       (results.admixtureWeights || []).reduce((s, a) => s + (a?.weight || 0), 0)) * vol
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
      cementPercent,
      sandPercent,
      gravelPercent,
      waterPercent,
      additionsPercent,
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

  if (viewMode === "landing") {
    return (
      <LandingPage
        onStartProject={async () => {
          await workflow.startNewProject();
          setActiveSidebarTab("saved_projects");
          setViewMode("workspace");
        }}
        onOpenProject={async () => {
          try {
            const success = await workflow.openExistingProject();
            if (success) {
              setActiveSidebarTab("saved_projects");
              setViewMode("workspace");
            }
          } catch (e) {
            console.error("Open project from landing failed", e);
            setActiveSidebarTab("saved_projects");
            setViewMode("workspace");
          }
        }}
        themeMode={themeMode}
        themeSetting={themeSetting}
        setThemeSetting={setThemeSetting}
      />
    );
  }

  const selectedAdmixtureMaterial = materialsDatabase.find((material) => material.id === inputs.selectedAdmixtureId);
  const selectedScmMaterial = materialsDatabase.find((material) => material.id === inputs.selectedScmId);
  const selectedFiberMaterial = materialsDatabase.find((material) => material.id === inputs.selectedFiberId);
  const selectedSpecialBinderMaterial = materialsDatabase.find((material) => material.id === inputs.selectedSpecialBinderId);
  const selectedAdmixtureName = (selectedAdmixtureMaterial?.name || "").toLowerCase();
  const selectedScmName = (selectedScmMaterial?.name || "").toLowerCase();
  const selectedAdmixtureDoseKind = /retard|مؤخر|مبطئ/.test(selectedAdmixtureName)
    ? "retarder"
    : /acceler|معجل|مسرع/.test(selectedAdmixtureName)
      ? "accelerator"
      : /air|هواء|تهوية/.test(selectedAdmixtureName)
        ? "air"
        : "superplasticizer";
  const selectedScmDoseKind = /silica|fume|سيليكا|دخان/.test(selectedScmName)
    ? "silica"
    : /fly|ash|رماد|متطاير/.test(selectedScmName)
      ? "flyAsh"
      : /slag|خبث/.test(selectedScmName)
        ? "slag"
        : "other";
  const hasSelectedMixModifiers = Boolean(
    inputs.selectedAdmixtureId || inputs.selectedScmId || inputs.selectedFiberId || inputs.selectedSpecialBinderId
  );

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

      <WorkspaceTopBar
        language={language as "ar" | "fr" | "en"}
        themeMode={themeMode}
        activeSidebarTab={activeSidebarTab}
        notifications={notifications}
        notificationOpen={showNotificationDropdown}
        user={user}
        fck28={inputs.fck28}
        selectedMethod={inputs.selectedMethod}
        currentClient={currentClient}
        onToggleNotification={() => {
          setShowNotificationDropdown(!showNotificationDropdown);
          setShowPlantDropdown(false);
          setShowProjectDropdown(false);
        }}
        onMarkAllNotificationsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onCloseNotifications={() => setShowNotificationDropdown(false)}
        onOpenSettings={() => setActiveSidebarTab("settings")}
        onOpenProjectProperties={() => setShowProjectPropertiesModal(true)}
        onOpenNewProjectModal={() => setShowNewProjectModal(true)}
        onNavigateLanding={() => setViewMode("landing")}
        onReset={handleReset}
      />

      {/* PRIMARY CONTAINER BLOCK WITH SIDEBAR & ACTIVE AREA */}
      <WorkspaceLayout isSidebarCollapsed={isSidebarCollapsed}>

          <SidebarShell
            language={language as "ar" | "fr" | "en"}
            themeMode={themeMode}
            isCollapsed={isSidebarCollapsed}
            activeTab={activeSidebarTab}
            viewMode={viewMode}
            projectName={storageProject?.metadata?.name || currentProject}
            projectCode={storageProject?.metadata?.code || storageProject?.metadata?.id}
            projectStatus={mixLifecycleStatus}
            unreadAlerts={notifications.filter(n => !n.read).length}
            readyTests={materialTestRecords.filter(test => test.status === "READY").length}
            blockedTests={materialTestRecords.filter(test => test.status === "BLOCKED").length}
            draftCount={materialTestRecords.filter(test => test.status === "DRAFT").length}
            onToggleCollapsed={toggleSidebarCollapsed}
            onToggleTheme={() => setThemeSetting(themeSetting === "dark" ? "light" : "dark")}
            onNavigate={(target) => {
              if (target === "landing") {
                setViewMode("landing");
                return;
              }
              setViewMode("workspace");
              setActiveSidebarTab(target as typeof activeSidebarTab);
              workflow.syncStageWithTab(target);
            }}
          />

          {/* MAIN WORKSPACE CONTENT PANEL (RIGHT - occupies 9 to 11 columns depending on isSidebarCollapsed) */}
          <main className={`${isSidebarCollapsed ? "lg:col-span-11" : "lg:col-span-9"} transition-all duration-300 space-y-6`} id="mixwizard-main-workspace">

            <WorkspaceWorkflowHeader
              language={language as "ar" | "fr" | "en"}
              isRtl={isRtl}
              activeStep={activeStep}
              projectName={storageProject?.metadata?.name || currentProject || "Untitled Project"}
              projectCode={storageProject?.metadata?.code || storageProject?.metadata?.id || "N/A"}
              clientName={storageProject?.metadata?.client || currentClient}
              projectIsOpen={workflow.projectIsOpen}
              stageName={t(workflow.activeStageInfo.nameKey)}
              stageDescription={t(workflow.activeStageInfo.descKey)}
              steps={workflow.allStages.map(stage => {
                const gate = workflow.getStageGate(stage.number);
                const icons = {
                  project_setup: Folder,
                  requirements: Briefcase,
                  materials_verification: Database,
                  mix_calculation: Calculator,
                  trial_mix: FlaskConical,
                  lab_review: ShieldCheck,
                  release_report: FileText,
                } as Record<string, typeof Folder>;
                return {
                  num: stage.number,
                  label: t(stage.nameKey),
                  desc: t(stage.descKey),
                  icon: icons[stage.id] || Folder,
                  ready: gate.ready,
                  gateReason: gate.reasons.join(", "),
                };
              })}
              onStepClick={handleStepClick}
              onCloseProject={async () => { await workflow.closeProject(); setViewMode("landing"); }}
              onPrevious={() => handleStepClick((activeStep - 1) as ProjectStageNumber)}
              onNext={() => handleStepClick((activeStep + 1) as ProjectStageNumber)}
              projectLabel={language === "ar" ? "المشروع:" : "Project:"}
              codeLabel={language === "ar" ? "الرمز:" : "Code:"}
              clientLabel={language === "ar" ? "العميل:" : "Client:"}
              brandLabel="SnoLab Project"
              stageLabel="STAGE"
              closeLabel={language === "ar" ? "إغلاق المشروع" : language === "fr" ? "Fermer" : "Close Project"}
              closeTitle={language === "ar" ? "إغلاق المشروع الحالي والعودة للبوابة" : "Close active project and return to landing"}
              previousLabel={language === "ar" ? "المرحلة السابقة" : language === "fr" ? "Étape précédente" : "Previous Stage"}
              nextLabel={language === "ar" ? "المرحلة التالية" : language === "fr" ? "Étape suivante" : "Next Stage"}
            />

            {activeSidebarTab === "dashboard" && null}
            {!workflow.projectIsOpen ? (
              <WorkspaceEmptyState
                language={language as "ar" | "fr" | "en"}
                onStartNewProject={async (role: OnboardingRole) => {
                  await workflow.startNewProject();
                  setActiveSidebarTab(role === "lab-quality" ? "materials_library" : "saved_projects");
                }}
                onOpenExistingProject={async () => { const ok = await workflow.openExistingProject(); if (ok) setActiveSidebarTab("saved_projects"); }}
                onOpenAdvanced={async () => { await workflow.startNewProject(); setActiveSidebarTab("calculator"); }}
                onHome={() => setViewMode("landing")}
              />
            ) : engineeringGate.isBlocked && [
              "cost", "reports", "simulation", "sieve",
              "optimization", "journal", "compliance_reports"
            ].includes(activeSidebarTab) ? (
              <EngineeringVerificationGate
                language={language as "ar" | "fr" | "en"}
                engineeringGate={engineeringGate}
                inputs={inputs}
                onNavigateToCalculator={() => setActiveSidebarTab("calculator")}
                onOpenBatchProperties={() => setIsBatchPropertiesModalOpen(true)}
              />
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
                  onOpenBatchModal={() => setIsBatchPropertiesModalOpen(true)}
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
                            {(results.wcRatioAdjusted || results.wcRatio) !== undefined ? (results.wcRatioAdjusted || results.wcRatio)!.toFixed(2) : "---"}
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

            {/* TAB CONTENT: SAVED PROJECTS & LOCAL STORAGE VAULT */}
            {activeSidebarTab === "saved_projects" && (
              <LocalProjectVault
                onLoadMixToCalculator={(loadedInputs) => {
                  setInputs(loadedInputs);
                  setActiveSidebarTab("calculator");
                }}
              />
            )}

            {/* TAB CONTENT: PROJECT REQUIREMENTS GATE */}
            {activeSidebarTab === "cloud_storage" && (
              <ProjectRequirementsPanel
                language={language as "ar" | "fr" | "en"}
                metadata={workflow.activeProjectMeta}
                inputs={inputs}
                onMetadataChange={updateProjectMetadata}
                onInputsChange={handleRequirementsInputChange}
                onContinue={() => handleStepClick(3)}
              />
            )}

            {/* TAB CONTENT: TRACEABLE BATCH PREPARATION */}
            {activeSidebarTab === "batch_preparation" && (
              <BatchPreparationCenter
                input={inputs}
                result={results as any}
                materials={materialsDatabase}
                language={language as "ar" | "fr" | "en"}
                onNavigateToDesign={() => setActiveSidebarTab("calculator")}
                onSaveTrialMix={handleSaveTrialMix}
              />
            )}
            {activeSidebarTab === "quality_control" && (
              <QualityControlDashboard
                language={language as "ar" | "fr" | "en"}
                records={(activeProject?.validationRecords || []) as any}
                ncrRecords={(activeProject?.ncrRecords || []) as any}
                input={inputs}
                result={results}
                onCreateNcr={(record) => { if (!can(currentUserRole, "open-ncr")) { setSaveError(localizedLabel("لا يملك المستخدم صلاحية فتح NCR.", "Le rôle actuel ne peut pas ouvrir une NCR.", "The current role cannot open an NCR.")); return; } setProjects(prev => prev.map(project => project.id === (activeProjectId || activeProject?.id) ? { ...project, ncrRecords: [record, ...(project.ncrRecords || [])], auditTrail: { ...project.auditTrail, lastModifiedAt: new Date().toISOString(), lastModifiedBy: user.uid, events: [...(project.auditTrail?.events || []), { id: `AUD-${Date.now()}`, type: "updated", timestamp: new Date().toISOString(), actor: user.uid, entityId: record.id, message: `NCR opened: ${record.title}.` }] } } : project)); }}
                onUpdateNcr={(id, status) => { if (!can(currentUserRole, "open-ncr")) { setSaveError(localizedLabel("لا يملك المستخدم صلاحية تعديل NCR.", "Le rôle actuel ne peut pas modifier la NCR.", "The current role cannot update an NCR.")); return; } const now = new Date().toISOString(); setProjects(prev => prev.map(project => project.id === (activeProjectId || activeProject?.id) ? { ...project, ncrRecords: (project.ncrRecords || []).map(ncr => ncr.id === id ? { ...ncr, status, ...(status === "closed" ? { closedAt: now } : {}) } : ncr), auditTrail: { ...project.auditTrail, lastModifiedAt: now, lastModifiedBy: user.uid, events: [...(project.auditTrail?.events || []), { id: `AUD-${Date.now()}`, type: status === "closed" ? "updated" : "updated", timestamp: now, actor: user.uid, entityId: id, message: `NCR status changed to ${status}.` }] } } : project)); }}
                onNavigateToTrial={() => setActiveSidebarTab("batch_preparation")}
              />
            )}
            {activeSidebarTab === "batch_ticket" && (
              <ProductionBatchTicket
                language={language as "ar" | "fr" | "en"}
                input={inputs}
                result={results as any}
                project={activeProject}
                blocked={!evaluateProductionRelease(activeProject || undefined, results, validationGate).canRelease}
                onNavigateToPreparation={() => setActiveSidebarTab("batch_preparation")}
              />
            )}
            {activeSidebarTab === "quality_assets" && (
              <QualityAssetsDashboard
                language={language as "ar" | "fr" | "en"}
                samples={activeProject?.samples || []}
                tests={materialTestRecords}
                devices={activeProject?.testDevices || []}
                calibrations={activeProject?.calibrations || []}
                onAddSample={handleAddLabSample}
                onAddDevice={handleAddLabDevice}
                onAddCalibration={handleAddLabCalibration}
              />
            )}
            {activeSidebarTab === "versions" && (activeProject || projects.find(project => project.id === activeProjectId)) && (
              <MixVersioningPanel
                activeProject={(activeProject || projects.find(project => project.id === activeProjectId)) as ActiveProject}
                inputs={inputs}
                results={results}
                onSaveVersion={(name) => handleSaveVersion(name, false, "draft")}
                onRestoreVersion={handleRestoreVersion}
                onDeleteVersion={handleDeleteVersion}
              />
            )}

            {/* TAB CONTENT: 2. CALCULATOR WITH CARDS */}
            {activeSidebarTab === "calculator" && (
              <CalculatorScreenFrame language={language as "ar" | "fr" | "en"} isRtl={isRtl}>

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

                <CalculatorModeSelector
                  language={language as "ar" | "fr" | "en"}
                  mode={designerMode}
                  onModeChange={setDesignerMode}
                  translate={t}
                />

                <div className="space-y-6 animate-fade-in" id="stage3-sequential-page" dir={isRtl ? "rtl" : "ltr"}>
                  <CalculatorSectionHeader language={language as "ar" | "fr" | "en"} />
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

                      <CompressiveStrengthField
                        language={language as "ar" | "fr" | "en"}
                        value={inputs.fck28}
                        concreteType={typeof inputs.concreteType === "string" ? inputs.concreteType : (inputs.concreteType as any)?.code}
                        disabled={isFieldDisabled("fck28")}
                        translate={t}
                        onChange={(value) => setInputs(prev => ({ ...prev, fck28: value }))}
                      />

                      <ConcreteTypeSelector
                        language={language as "ar" | "fr" | "en"}
                        value={String(inputs.concreteType || "NSC")}
                        translate={t}
                        isRtl={isRtl}
                        onChange={(val) => {
                          const current = String(inputs.concreteType || "NSC").toUpperCase();
                          const hasTypeSpecificData = Object.keys(specializedInputErrors).length > 0 || Object.entries(inputs as any).some(([key, value]) => key !== "concreteType" && (key.startsWith("hsc") || key.startsWith("scc") || key.startsWith("uhpc") || key.startsWith("gpc") || key.startsWith("frc") || key.startsWith("lwc") || key.startsWith("hwc") || key.startsWith("fiber")) && value !== undefined && value !== "");
                          if (val !== current && hasTypeSpecificData && !window.confirm(language === "ar" ? "سيتم تغيير النوع مع الاحتفاظ بالمدخلات الخاصة الحالية. قد تصبح بعض الحقول غير مطلوبة لهذا النوع. هل تريد المتابعة؟" : language === "fr" ? "Le type va changer et les données spécifiques seront conservées. Certains champs peuvent devenir non requis. Continuer ?" : "The type will change while current specialized inputs are preserved. Some fields may no longer apply. Continue?")) return;
                          setInputs(prev => ({ ...prev, concreteType: val }));
                        }}
                      />

                      <DesignMethodStructuralSelector
                        language={language as "ar" | "fr" | "en"}
                        isRtl={isRtl}
                        translate={t}
                        structuralElement={String(inputs.structuralElement || "column")}
                        normalizedInputs={normalizedInputsForCalc}
                        materialsDatabase={materialsDatabase}
                        onNavigateToTab={(tab) => setActiveSidebarTab(tab as typeof activeSidebarTab)}
                        onOpenBatchModal={() => setIsBatchPropertiesModalOpen(true)}
                        onStructuralElementChange={(elemId) => {
                          const elemConfig = getStructuralElementById(elemId);
                          setInputs(prev => ({
                            ...prev,
                            structuralElement: elemId,
                            slump: elemConfig.recommendedSlump.target,
                            dMax: elemConfig.recommendedDmax,
                            exposureClass: elemConfig.defaultExposureClass
                          }));
                        }}
                      />

                      <BasicMixConditionsFields
                        language={language as "ar" | "fr" | "en"}
                        isRtl={isRtl}
                        translate={t}
                        slump={inputs.slump}
                        dMax={inputs.dMax}
                        controlClass={inputs.controlClass}
                        slumpDisabled={isFieldDisabled("slump")}
                        dMaxDisabled={isFieldDisabled("dMax")}
                        labOverride={inputs.labOverrides?.dMax}
                        onSlumpChange={(value) => setInputs(prev => ({ ...prev, slump: value }))}
                        onDmaxChange={(value) => setInputs(prev => ({ ...prev, dMax: value }))}
                        onControlClassChange={(value) => setInputs(prev => ({ ...prev, controlClass: value as any }))}
                        onOpenDmaxOverride={() => handleOpenOverrideForm("dMax", inputs.dMax)}
                        onRemoveDmaxOverride={() => handleRemoveOverride("dMax")}
                      />

                    </div>

                    <SpecializedConcreteInputs
                      language={language as "ar" | "fr" | "en"}
                      concreteType={String(inputs.concreteType || "NSC")}
                      inputs={inputs as Record<string, any>}
                      errors={specializedInputErrors}
                      translate={t}
                      onFieldChange={(field, nextValue, error) => {
                        setSpecializedInputErrors(prev => {
                          const next = { ...prev };
                          if (error) next[field] = error;
                          else delete next[field];
                          return next;
                        });
                        if (!error) setInputs(prev => ({ ...prev, [field]: nextValue }));
                      }}
                    />

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
                      const rawCode = typeof inputs.concreteType === "string" ? inputs.concreteType : (inputs.concreteType as any)?.code || "NSC";
                      const concreteCode = String(rawCode || "NSC").toUpperCase();
                      const activeConfig = CONCRETE_TYPE_CONFIGS[concreteCode];
                      const isCementAllowed = activeConfig ? activeConfig.allowedCategories.includes("إسمنت") || activeConfig.allowedCategories.includes("مجلدات خاصة") : true;
                      const isSandAllowed = activeConfig ? activeConfig.allowedCategories.includes("رمال") : true;
                      const isGravelAllowed = activeConfig ? activeConfig.allowedCategories.some(cat => ["حصى", "ركام خفيف", "ركام ثقيل"].includes(cat)) : true;
                      const isWaterAllowed = activeConfig ? activeConfig.allowedCategories.includes("ماء") : true;
                      const isAdmixtureAllowed = activeConfig ? activeConfig.allowedCategories.includes("إضافات كيميائية") : true;
                      const isScmAllowed = activeConfig ? activeConfig.allowedCategories.includes("إضافات معدنية") : true;
                      const isFiberAllowed = activeConfig ? activeConfig.allowedCategories.includes("ألياف") : true;
                      const isSpecialBinderAllowed = activeConfig ? activeConfig.allowedCategories.includes("مجلدات خاصة") : true;

                      const currentMethod = inputs.selectedMethod || "dreux";
                      const currentConcrete = inputs.concreteType || "NSC";

                      // Get all materials matching the role so user can select and complete missing properties directly
                      const materialFilterContext = [currentMethod, currentConcrete, activeProject] as const;
                      const cementList = getAvailableMaterialsForRole(materialsDatabase, "cement", ...materialFilterContext);
                      const sandList = getAvailableMaterialsForRole(materialsDatabase, "sand", ...materialFilterContext);
                      const gravelList = getAvailableMaterialsForRole(materialsDatabase, "gravel", ...materialFilterContext);
                      const waterList = getAvailableMaterialsForRole(materialsDatabase, "water", ...materialFilterContext);
                      const admixtureList = getAvailableMaterialsForRole(materialsDatabase, "admixture", ...materialFilterContext);
                      const scmList = getAvailableMaterialsForRole(materialsDatabase, "scm", ...materialFilterContext);
                      const fiberList = getAvailableMaterialsForRole(materialsDatabase, "fiber", ...materialFilterContext);
                      const specialBinderList = getAvailableMaterialsForRole(materialsDatabase, "specialBinder", ...materialFilterContext);

                      return (
                        <>
                          <SmartMaterialRecommendationPanel
                            inputs={inputs}
                            setInputs={setInputs}
                            materials={materialsDatabase}
                            activeProject={activeProject}
                            language={language}
                          />


                          {/* قسم حالة/تحقق المواد في مرحلة تحضير الخلطة */}
                          <div className={`p-4 rounded-2xl border transition-all ${
                            mixMaterialsPropertiesSummary.totalMissingRequired > 0
                              ? "bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/10 border-amber-500/30 dark:border-amber-500/25 shadow-sm"
                              : activeMixMaterialsList.length > 0
                              ? "bg-emerald-500/10 border-emerald-500/25 dark:border-emerald-500/20"
                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                          }`} id="mix-materials-status-verification-panel">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {mixMaterialsPropertiesSummary.totalMissingRequired > 0 ? (
                                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20 shrink-0">
                                    <AlertCircle size={22} className="animate-pulse" />
                                  </div>
                                ) : activeMixMaterialsList.length > 0 ? (
                                  <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 shrink-0">
                                    <CheckCircle2 size={22} />
                                  </div>
                                ) : (
                                  <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20 shrink-0">
                                    <Layers size={22} />
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center gap-2">
                                    {mixMaterialsPropertiesSummary.totalMissingRequired > 0 ? (
                                      <>
                                        <strong className="text-xs md:text-sm font-black text-amber-900 dark:text-amber-300">
                                          {language === "ar"
                                            ? `⚠ توجد ${mixMaterialsPropertiesSummary.totalMissingRequired} خصائص ناقصة في المواد المختارة.`
                                            : `⚠ ${mixMaterialsPropertiesSummary.totalMissingRequired} missing properties in selected materials.`}
                                        </strong>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-full border border-rose-500/20">
                                          {language === "ar" ? "مطلوبة للحسابات" : "Required"}
                                        </span>
                                      </>
                                    ) : activeMixMaterialsList.length > 0 ? (
                                      <>
                                        <strong className="text-xs md:text-sm font-black text-emerald-900 dark:text-emerald-300">
                                          {language === "ar" ? "✓ بيانات المواد مكتملة" : language === "fr" ? "✓ Données des matériaux complètes" : "✓ Material Data Complete"}
                                        </strong>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-500/30 font-mono">
                                          100% READY
                                        </span>
                                      </>
                                    ) : (
                                      <strong className="text-xs font-black text-slate-800 dark:text-slate-200">
                                        {language === "ar" ? "يرجى تحديد مواد الخلطة من القوائم أدناه" : "Please select mix constituents from dropdowns below"}
                                      </strong>
                                    )}
                                  </div>

                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                    {mixMaterialsPropertiesSummary.totalMissingRequired > 0
                                      ? (language === "ar"
                                          ? "توجد خصائص هندسية لم تُسجل بعد للمواد المستخدمة فعليًا في الخلطة. يمكنك إكمال جميع الخصائص الناقصة دفعة واحدة من هنا دون الانتقال للمكتبة."
                                          : "Some selected materials have missing properties. You can complete all missing properties directly from here.")
                                      : activeMixMaterialsList.length > 0
                                      ? (language === "ar"
                                          ? "جميع خصائص المواد المختارة محققة وجاهزة بنسبة 100% للحسابات والمعادلات الهندسية."
                                          : "All material properties in current mix are verified and ready for calculation.")
                                      : (language === "ar"
                                          ? "اختر الإسمنت، الرمل، الحصى، ومياه الخلط لبدء تدقيق الخصائص الهندسية للخلطة."
                                          : "Select cement, sand, gravel, and water to begin material property audit.")}
                                  </p>
                                </div>
                              </div>

                              {/* زر إكمال خصائص المواد الناقصة: يظهر فقط عند وجود خصائص ناقصة فعلًا */}
                              {mixMaterialsPropertiesSummary.totalMissingRequired > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setIsBatchPropertiesModalOpen(true)}
                                  className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                                  id="btn-complete-missing-properties-step2"
                                >
                                  <Sliders size={15} />
                                  <span>{language === "ar" ? "إكمال خصائص المواد الناقصة" : language === "fr" ? "Compléter les caractéristiques manquantes" : "Complete Missing Material Properties"}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Section A: Basic Constituents */}
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>{language === "ar" ? "المكونات الأساسية للخلطة الخرسانية (Base Constituents - معتمدة ومكتملة 100%)" : language === "fr" ? "Constituants de Base du Béton (100% Validés)" : "Basic Concrete Constituents (100% Validated & Approved)"}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                            {isCementAllowed && (
                              <CementSelectionCard
                                language={language as "ar" | "fr" | "en"}
                                translate={t}
                                materials={cementList}
                                selectedId={inputs.selectedCementId}
                                cementClassStrength={inputs.cementClassStrength}
                                materialOptionLabel={getMaterialOptionLabel}
                                isUserMaterial={isUserMaterial}
                                materialBadge={renderMaterialSourceBadge(inputs.selectedCementId)}
                                onClassStrengthChange={(value) => setInputs(prev => ({ ...prev, cementClassStrength: value }))}
                                onSelect={(selectedId) => {
                                  if (!selectedId) {
                                    setInputs(prev => ({ ...prev, selectedCementId: "", cementType: "", cementDensity: 0, priceCement: 0 }));
                                    return;
                                  }
                                  const validation = validateMaterialSelection(selectedId, materialsDatabase, currentMethod, currentConcrete, activeProject);
                                  if (!validation.isValid) {
                                    alert(language === "ar" ? validation.errorAr : validation.errorEn);
                                    return;
                                  }
                                  const matchedMat = validation.material;
                                  const dens = matchedMat ? matchedMat.density : 0;
                                  const price = matchedMat?.price || 17;
                                  const strClass = matchedMat ? parseFloat(matchedMat.strengthClass || (matchedMat as any).cementClassStrength) : undefined;
                                  setInputs(prev => ({ ...prev, cementType: matchedMat ? matchedMat.name : prev.cementType, cementDensity: dens, priceCement: price, cementClassStrength: strClass || prev.cementClassStrength, selectedCementId: selectedId }));
                                }}
                              />
                            )}

                            {isSandAllowed && (
                              <SandSelectionCard
                                language={language as "ar" | "fr" | "en"}
                                translate={t}
                                materials={sandList}
                                selectedId={inputs.selectedSandId}
                                materialOptionLabel={getMaterialOptionLabel}
                                isUserMaterial={isUserMaterial}
                                materialBadge={renderMaterialSourceBadge(inputs.selectedSandId)}
                                onSelect={(selectedId) => {
                                  if (!selectedId) {
                                    setInputs(prev => ({ ...prev, selectedSandId: "", sandType: "", sandRelativeDensity: 0, priceSand: 0, sandAbsorption: 0, moistureSand: 0, finenessModulus: 0 }));
                                    return;
                                  }
                                  const validation = validateMaterialSelection(selectedId, materialsDatabase, currentMethod, currentConcrete, activeProject);
                                  if (!validation.isValid) {
                                    alert(language === "ar" ? validation.errorAr : validation.errorEn);
                                    return;
                                  }
                                  const matchedMat = validation.material;
                                  const dens = matchedMat?.density ?? matchedMat?.specificGravity;
                                  const price = matchedMat?.price;
                                  const abs = matchedMat?.absorption;
                                  const moist = matchedMat?.moisture;
                                  if (!matchedMat || typeof dens !== "number" || !Number.isFinite(dens) || dens <= 0 || typeof abs !== "number" || !Number.isFinite(abs) || abs < 0 || typeof moist !== "number" || !Number.isFinite(moist) || moist < 0 || typeof matchedMat.finenessModulus !== "number" || !Number.isFinite(matchedMat.finenessModulus)) {
                                    alert(language === "ar" ? "لا يمكن اختيار هذا الرمل: الكثافة والامتصاص والرطوبة ومعامل النعومة يجب أن تكون مسجلة في مكتبة المواد." : "This sand cannot be selected: density, absorption, moisture, and fineness modulus must be recorded in the material library.");
                                    return;
                                  }
                                  setInputs(prev => ({ ...prev, sandType: matchedMat.name, sandRelativeDensity: dens, ...(price !== undefined ? { priceSand: price } : {}), sandAbsorption: abs, moistureSand: moist, finenessModulus: matchedMat.finenessModulus || prev.finenessModulus, selectedSandId: selectedId }));
                                  setSelectedMaterialForInfo(matchedMat.name);
                                }}
                              />
                            )}

                            {isGravelAllowed && (
                              <GravelSelectionCard
                                language={language as "ar" | "fr" | "en"}
                                translate={t}
                                materials={gravelList}
                                selectedId={inputs.selectedGravelId}
                                aggregateType={inputs.aggregateType}
                                aggregateQuality={inputs.aggregateQuality}
                                materialOptionLabel={getMaterialOptionLabel}
                                isUserMaterial={isUserMaterial}
                                materialBadge={renderMaterialSourceBadge(inputs.selectedGravelId)}
                                onSelect={(selectedId) => {
                                  if (!selectedId) {
                                    setInputs(prev => ({ ...prev, selectedGravelId: "", gravelType: "", gravelRelativeDensity: 0, priceGravel: 0, gravelAbsorption: 0, moistureGravel: 0, dMax: 20 }));
                                    return;
                                  }
                                  const validation = validateMaterialSelection(selectedId, materialsDatabase, currentMethod, currentConcrete, activeProject);
                                  if (!validation.isValid) {
                                    alert(language === "ar" ? validation.errorAr : validation.errorEn);
                                    return;
                                  }
                                  const matchedMat = validation.material;
                                  const dens = matchedMat?.density ?? matchedMat?.specificGravity;
                                  const price = matchedMat?.price;
                                  const abs = matchedMat?.absorption;
                                  const moist = matchedMat?.moisture;
                                  if (!matchedMat || typeof dens !== "number" || !Number.isFinite(dens) || dens <= 0 || typeof abs !== "number" || !Number.isFinite(abs) || abs < 0 || typeof moist !== "number" || !Number.isFinite(moist) || moist < 0 || typeof matchedMat.dMax !== "number" || !Number.isFinite(matchedMat.dMax) || matchedMat.dMax <= 0) {
                                    alert(language === "ar" ? "لا يمكن اختيار هذا الركام: الكثافة والامتصاص والرطوبة وDmax يجب أن تكون مسجلة في مكتبة المواد." : "This aggregate cannot be selected: density, absorption, moisture, and Dmax must be recorded in the material library.");
                                    return;
                                  }
                                  const maxS = matchedMat.dMax;
                                  const shape = matchedMat.particleShape === "مكسر" || matchedMat.particleShape === "زاوي" ? AggregateType.CONCASSE : AggregateType.ROULE;
                                  let qualityVal = AggregateQuality.STANDARD;
                                  if (matchedMat.aggregateQuality === "excellent") qualityVal = AggregateQuality.EXCELLENT;
                                  else if (matchedMat.aggregateQuality === "poor") qualityVal = AggregateQuality.POOR;
                                  else if (matchedMat.aggregateQuality === "standard") qualityVal = AggregateQuality.STANDARD;
                                  else {
                                    const qStr = String(matchedMat.quality || "").toLowerCase();
                                    if (qStr.includes("excellent") || qStr.includes("ممتاز") || qStr.includes("عالي")) qualityVal = AggregateQuality.EXCELLENT;
                                    else if (qStr.includes("poor") || qStr.includes("ضعيف") || qStr.includes("متوسط")) qualityVal = AggregateQuality.POOR;
                                    if (matchedMat.losAngelesAbrasion !== undefined) {
                                      if (matchedMat.losAngelesAbrasion < 15) qualityVal = AggregateQuality.EXCELLENT;
                                      else if (matchedMat.losAngelesAbrasion > 30) qualityVal = AggregateQuality.POOR;
                                    }
                                  }
                                  setInputs(prev => ({ ...prev, gravelType: matchedMat.name, gravelRelativeDensity: dens, ...(price !== undefined ? { priceGravel: price } : {}), gravelAbsorption: abs, moistureGravel: moist, dMax: maxS, aggregateType: shape, aggregateQuality: qualityVal, selectedGravelId: selectedId }));
                                  setSelectedMaterialForInfo(matchedMat.name);
                                }}
                              />
                            )}

                            {isWaterAllowed && (
                              <WaterSelectionCard
                                language={language as "ar" | "fr" | "en"}
                                materials={waterList}
                                selectedId={inputs.selectedWaterId}
                                materialOptionLabel={getMaterialOptionLabel}
                                isUserMaterial={isUserMaterial}
                                materialBadge={renderMaterialSourceBadge(inputs.selectedWaterId)}
                                onSelect={(selectedId) => {
                                  if (!selectedId) {
                                    setInputs(prev => ({ ...prev, selectedWaterId: "", selectedWaterName: "", priceWater: 0, selectedWaterPH: 7, selectedWaterChlorideContent: 0, selectedWaterSulphateContent: 0, selectedWaterTemperature: 20 }));
                                    return;
                                  }
                                  const validation = validateMaterialSelection(selectedId, materialsDatabase, currentMethod, currentConcrete, activeProject);
                                  if (!validation.isValid) {
                                    alert(language === "ar" ? validation.errorAr : validation.errorEn);
                                    return;
                                  }
                                  const matchedMat = validation.material;
                                  const pH = matchedMat?.engineeringData?.pH || (matchedMat as any)?.pH || 7;
                                  const chloride = matchedMat?.engineeringData?.chloride || (matchedMat as any)?.chlorideContent || 0;
                                  const sulphate = matchedMat?.engineeringData?.sulphate || (matchedMat as any)?.sulphateContent || 0;
                                  const temp = matchedMat?.engineeringData?.temperature || (matchedMat as any)?.temperature || 20;
                                  setInputs(prev => ({ ...prev, selectedWaterId: selectedId, selectedWaterName: matchedMat ? matchedMat.name : "", priceWater: matchedMat?.price || prev.priceWater, selectedWaterPH: pH, selectedWaterChlorideContent: chloride, selectedWaterSulphateContent: sulphate, selectedWaterTemperature: temp }));
                                }}
                              />
                            )}

                          </div>

                          {/* Section B: Specialized Materials & Additions */}
                          {(isAdmixtureAllowed || isScmAllowed || isFiberAllowed || isSpecialBinderAllowed) && (
                            <>
                              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>{language === "ar" ? "الإضافات المتخصصة والمحسنات والألياف (Advanced Materials - معتمدة ومكتملة 100%)" : language === "fr" ? "Adjuvants Spéciaux & Matériaux Avancés" : "Specialized Admixtures & Advanced Materials (100% Validated)"}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                {isAdmixtureAllowed && (
                                  <ChemicalAdmixtureSelectionCard
                                    language={language as "ar" | "fr" | "en"}
                                    materials={admixtureList}
                                    selectedId={inputs.selectedAdmixtureId}
                                    materialOptionLabel={getMaterialOptionLabel}
                                    isUserMaterial={isUserMaterial}
                                    materialBadge={renderMaterialSourceBadge(inputs.selectedAdmixtureId)}
                                    onSelect={(selectedId) => {
                                      if (!selectedId) {
                                        setInputs(prev => ({ ...prev, selectedAdmixtureId: "", dosageSuper: 0, dosageAir: 0, dosageRetarder: 0, dosageAccelerator: 0 }));
                                        return;
                                      }
                                      const validation = validateMaterialSelection(selectedId, materialsDatabase, currentMethod, currentConcrete, activeProject);
                                      if (!validation.isValid) {
                                        alert(language === "ar" ? validation.errorAr : validation.errorEn);
                                        return;
                                      }
                                      const matchedMat = validation.material;
                                      if (matchedMat) {
                                        const recDos = matchedMat.recommendedDosage;
                                        if (typeof recDos !== "number" || !Number.isFinite(recDos) || recDos <= 0) {
                                          alert(language === "ar" ? "لا يمكن اختيار هذه المادة: الجرعة الموصى بها غير مسجلة في مكتبة المواد." : "This material cannot be selected: its recommended dosage is missing from the material library.");
                                          return;
                                        }
                                        let dosSuper = 0;
                                        let dosAir = 0;
                                        let dosRetarder = 0;
                                        let dosAcc = 0;
                                        if (matchedMat.admixtureType === "superplasticizer") dosSuper = recDos;
                                        else if (matchedMat.admixtureType === "air_entraining") dosAir = recDos;
                                        else if (matchedMat.admixtureType === "retarder") dosRetarder = recDos;
                                        else if (matchedMat.admixtureType === "accelerator") dosAcc = recDos;
                                        setInputs(prev => ({ ...prev, selectedAdmixtureId: selectedId, dosageSuper: dosSuper || prev.dosageSuper, dosageAir: dosAir || prev.dosageAir, dosageRetarder: dosRetarder || prev.dosageRetarder, dosageAccelerator: dosAcc || prev.dosageAccelerator, priceSuper: matchedMat.admixtureType === "superplasticizer" ? (matchedMat.price ?? prev.priceSuper) : prev.priceSuper, priceAir: matchedMat.admixtureType === "air_entraining" ? (matchedMat.price ?? prev.priceAir) : prev.priceAir, priceRetarder: matchedMat.admixtureType === "retarder" ? (matchedMat.price ?? prev.priceRetarder) : prev.priceRetarder, priceAccelerator: matchedMat.admixtureType === "accelerator" ? (matchedMat.price ?? prev.priceAccelerator) : prev.priceAccelerator }));
                                      }
                                    }}
                                  />
                                )}

                                {isScmAllowed && (
                                  <MineralAdditionSelectionCard
                                    language={language as "ar" | "fr" | "en"}
                                    materials={scmList}
                                    selectedId={inputs.selectedScmId}
                                    materialOptionLabel={getMaterialOptionLabel}
                                    isUserMaterial={isUserMaterial}
                                    materialBadge={renderMaterialSourceBadge(inputs.selectedScmId)}
                                    onSelect={(selectedId) => {
                                      if (!selectedId) {
                                        setInputs(prev => ({ ...prev, selectedScmId: "", selectedScmName: "", selectedScmDensity: undefined, dosageSilicaFume: 0, dosageFlyAsh: 0, dosageSlag: 0 }));
                                        return;
                                      }
                                      const validation = validateMaterialSelection(selectedId, materialsDatabase, currentMethod, currentConcrete, activeProject);
                                      if (!validation.isValid) {
                                        alert(language === "ar" ? validation.errorAr : validation.errorEn);
                                        return;
                                      }
                                      const matchedMat = validation.material;
                                      if (matchedMat) {
                                        const dens = matchedMat.density;
                                        const recDos = matchedMat.recommendedDosage;
                                        if (typeof dens !== "number" || !Number.isFinite(dens) || dens <= 0 || typeof recDos !== "number" || !Number.isFinite(recDos) || recDos <= 0) {
                                          alert(language === "ar" ? "لا يمكن اختيار هذه المادة: الكثافة والجرعة الموصى بها يجب أن تكونا مسجلتين في مكتبة المواد." : "This material cannot be selected: density and recommended dosage must be recorded in the material library.");
                                          return;
                                        }
                                        const price = matchedMat.price;
                                        const scmNameLower = (matchedMat.name || "").toLowerCase();
                                        const scmEngLower = (matchedMat.englishName || "").toLowerCase();
                                        const isSilica = scmNameLower.includes("سيليكا") || scmEngLower.includes("silica");
                                        const isFlyAsh = scmNameLower.includes("رماد") || scmEngLower.includes("fly ash") || scmEngLower.includes("fly_ash");
                                        const isSlag = scmNameLower.includes("خبث") || scmEngLower.includes("slag");
                                        setInputs(prev => ({ ...prev, selectedScmId: selectedId, selectedScmName: matchedMat.name, selectedScmDensity: dens, dosageSilicaFume: isSilica ? recDos : prev.dosageSilicaFume, dosageFlyAsh: isFlyAsh ? recDos : prev.dosageFlyAsh, dosageSlag: isSlag ? recDos : prev.dosageSlag, priceSilicaFume: isSilica ? (price ?? prev.priceSilicaFume) : prev.priceSilicaFume, priceFlyAsh: isFlyAsh ? (price ?? prev.priceFlyAsh) : prev.priceFlyAsh, priceSlag: isSlag ? (price ?? prev.priceSlag) : prev.priceSlag }));
                                      }
                                    }}
                                  />
                                )}

                                {isFiberAllowed && (
                                  <FiberSelectionCard
                                    language={language as "ar" | "fr" | "en"}
                                    materials={fiberList}
                                    selectedId={inputs.selectedFiberId}
                                    materialOptionLabel={getMaterialOptionLabel}
                                    isUserMaterial={isUserMaterial}
                                    materialBadge={renderMaterialSourceBadge(inputs.selectedFiberId)}
                                    onSelect={(selectedId) => {
                                      if (!selectedId) {
                                        setInputs(prev => ({ ...prev, selectedFiberId: "", selectedFiberName: "", fiberDensity: undefined, fiberDosageKgM3: 0, priceFiber: 0 }));
                                        return;
                                      }
                                      const validation = validateMaterialSelection(selectedId, materialsDatabase, currentMethod, currentConcrete, activeProject);
                                      if (!validation.isValid) {
                                        alert(language === "ar" ? validation.errorAr : validation.errorEn);
                                        return;
                                      }
                                      const matchedMat = validation.material;
                                      if (matchedMat) {
                                        const dens = matchedMat.density;
                                        const recDos = (matchedMat as any).fiberDosageKgM3 ?? matchedMat.recommendedDosage;
                                        if (typeof dens !== "number" || !Number.isFinite(dens) || dens <= 0 || typeof recDos !== "number" || !Number.isFinite(recDos) || recDos <= 0) {
                                          alert(language === "ar" ? "لا يمكن اختيار هذه المادة: كثافة الألياف وجرعتها يجب أن تكونا مسجلتين في مكتبة المواد." : "This material cannot be selected: fiber density and dosage must be recorded in the material library.");
                                          return;
                                        }
                                        const price = matchedMat.price;
                                        const fType = matchedMat.fiberType ?? (matchedMat as any).type;
                                        if (!fType) {
                                          alert(language === "ar" ? "لا يمكن اختيار هذه المادة: نوع الألياف غير مسجل في مكتبة المواد." : "This material cannot be selected: fiber type is missing from the material library.");
                                          return;
                                        }
                                        setInputs(prev => ({ ...prev, selectedFiberId: selectedId, selectedFiberName: matchedMat.name, fiberDensity: dens, fiberDosageKgM3: recDos, ...(price !== undefined ? { priceFiber: price } : {}), fiberType: fType, concreteType: prev.concreteType === "NSC" ? "FRC" : prev.concreteType }));
                                      }
                                    }}
                                  />
                                )}

                                {isSpecialBinderAllowed && (
                                  <SpecialBinderSelectionCard
                                    language={language as "ar" | "fr" | "en"}
                                    materials={specialBinderList}
                                    selectedId={inputs.selectedSpecialBinderId}
                                    materialOptionLabel={getMaterialOptionLabel}
                                    isUserMaterial={isUserMaterial}
                                    materialBadge={renderMaterialSourceBadge(inputs.selectedSpecialBinderId)}
                                    onSelect={(selectedId) => {
                                      if (!selectedId) {
                                        setInputs(prev => ({ ...prev, selectedSpecialBinderId: "", selectedSpecialBinderName: "", specialBinderDensity: undefined, priceSpecialBinder: 0 }));
                                        return;
                                      }
                                      const validation = validateMaterialSelection(selectedId, materialsDatabase, currentMethod, currentConcrete, activeProject);
                                      if (!validation.isValid) {
                                        alert(language === "ar" ? validation.errorAr : validation.errorEn);
                                        return;
                                      }
                                      const matchedMat = validation.material;
                                      if (matchedMat) {
                                        const dens = matchedMat.density ?? matchedMat.specificGravity;
                                        if (typeof dens !== "number" || !Number.isFinite(dens) || dens <= 0) {
                                          alert(language === "ar" ? "لا يمكن اختيار هذا الرابط: كثافته غير مسجلة في مكتبة المواد." : "This binder cannot be selected: its density is missing from the material library.");
                                          return;
                                        }
                                        const price = matchedMat.price;
                                        setInputs(prev => ({ ...prev, selectedSpecialBinderId: selectedId, selectedSpecialBinderName: matchedMat.name, specialBinderDensity: dens, ...(price !== undefined ? { priceSpecialBinder: price } : {}), concreteType: matchedMat.name?.includes("جيوبوليمر") || matchedMat.name?.includes("Geopolymer") ? "GPC" : prev.concreteType }));
                                      }
                                    }}
                                  />
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
                        onOpenBatchModal={() => setIsBatchPropertiesModalOpen(true)}
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

{/* STEP 5: DYNAMIC METHOD DESIGN PARAMETERS (NORMAL AUTO VS EXPERT SLIDERS) */}
                  <div className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 ${isRtl ? "text-right" : "text-left"}`} id="step6-design-coefficients">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">4</span>
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
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">5</span>
                        <span>{t("step7_header")}</span>
                      </h4>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-sans">{t("independent_chemical_lab")}</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-sans mt-1">
                      {t("step7_desc")}
                    </p>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {inputs.selectedAdmixtureId && (
                        <div className="rounded-xl border border-emerald-500/15 bg-slate-50 p-3 dark:bg-slate-900">
                          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold">
                            <span className="min-w-0 truncate">{selectedAdmixtureMaterial?.name || (language === "ar" ? "المضاف الكيميائي المختار" : "Selected chemical admixture")}</span>
                            <strong className="shrink-0 text-emerald-500">
                              {selectedAdmixtureDoseKind === "retarder" ? inputs.dosageRetarder : selectedAdmixtureDoseKind === "accelerator" ? inputs.dosageAccelerator : selectedAdmixtureDoseKind === "air" ? inputs.dosageAir : inputs.dosageSuper}%
                            </strong>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={selectedAdmixtureDoseKind === "air" ? "10" : "3"}
                            step="0.1"
                            value={selectedAdmixtureDoseKind === "retarder" ? inputs.dosageRetarder : selectedAdmixtureDoseKind === "accelerator" ? inputs.dosageAccelerator : selectedAdmixtureDoseKind === "air" ? inputs.dosageAir : inputs.dosageSuper}
                            onChange={(event) => {
                              const value = parseFloat(event.target.value);
                              if (selectedAdmixtureDoseKind === "retarder") setInputs((prev) => ({ ...prev, dosageRetarder: value }));
                              else if (selectedAdmixtureDoseKind === "accelerator") setInputs((prev) => ({ ...prev, dosageAccelerator: value }));
                              else if (selectedAdmixtureDoseKind === "air") setInputs((prev) => ({ ...prev, dosageAir: value }));
                              else setInputs((prev) => ({ ...prev, dosageSuper: value }));
                            }}
                            className="h-1 w-full cursor-pointer accent-emerald-500"
                          />
                          <span className="mt-1 block text-[9px] text-slate-400">
                            {language === "ar" ? "جرعة المادة الكيميائية المختارة من المستودع" : language === "fr" ? "Dosage de l’adjuvant sélectionné dans la bibliothèque" : "Dosage for the selected admixture from the library"}
                          </span>
                        </div>
                      )}

                      {inputs.selectedScmId && selectedScmDoseKind === "silica" && (
                        <div className="rounded-xl border border-blue-500/15 bg-slate-50 p-3 dark:bg-slate-900">
                          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold">
                            <span>{selectedScmMaterial?.name || (language === "ar" ? "غبار السيليكا المختار" : "Selected silica fume")}</span>
                            <strong className="text-blue-500">{inputs.dosageSilicaFume}%</strong>
                          </div>
                          <input type="range" min="0" max="12" step="1" value={inputs.dosageSilicaFume} onChange={(event) => setInputs((prev) => ({ ...prev, dosageSilicaFume: parseFloat(event.target.value) }))} className="h-1 w-full cursor-pointer accent-blue-500" />
                        </div>
                      )}

                      {inputs.selectedScmId && selectedScmDoseKind === "flyAsh" && (
                        <div className="rounded-xl border border-indigo-500/15 bg-slate-50 p-3 dark:bg-slate-900">
                          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold">
                            <span>{selectedScmMaterial?.name || (language === "ar" ? "الرماد المتطاير المختار" : "Selected fly ash")}</span>
                            <strong className="text-indigo-500">{inputs.dosageFlyAsh}%</strong>
                          </div>
                          <input type="range" min="0" max="20" step="1" value={inputs.dosageFlyAsh} onChange={(event) => setInputs((prev) => ({ ...prev, dosageFlyAsh: parseFloat(event.target.value) }))} className="h-1 w-full cursor-pointer accent-indigo-500" />
                        </div>
                      )}

                      {inputs.selectedScmId && selectedScmDoseKind === "slag" && (
                        <div className="rounded-xl border border-amber-500/15 bg-slate-50 p-3 dark:bg-slate-900">
                          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold">
                            <span>{selectedScmMaterial?.name || (language === "ar" ? "خبث الأفران المختار" : "Selected slag")}</span>
                            <strong className="text-amber-600">{inputs.dosageSlag}%</strong>
                          </div>
                          <input type="range" min="0" max="40" step="1" value={inputs.dosageSlag} onChange={(event) => setInputs((prev) => ({ ...prev, dosageSlag: parseFloat(event.target.value) }))} className="h-1 w-full cursor-pointer accent-amber-500" />
                        </div>
                      )}

                      {inputs.selectedScmId && selectedScmDoseKind === "other" && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                          <strong>{selectedScmMaterial?.name || inputs.selectedScmName}</strong>
                          <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                            {language === "ar" ? "خصائص هذه المادة مرتبطة بسجلها المختار في مكتبة المواد." : language === "fr" ? "Les propriétés de cet ajout sont liées à sa fiche dans la bibliothèque." : "Properties for this selected addition are linked to its material-library record."}
                          </p>
                        </div>
                      )}

                      {inputs.selectedFiberId && (
                        <div className="rounded-xl border border-violet-500/15 bg-slate-50 p-3 dark:bg-slate-900">
                          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold">
                            <span className="min-w-0 truncate">{inputs.selectedFiberName || selectedFiberMaterial?.name || (language === "ar" ? "الألياف المختارة" : "Selected fibers")}</span>
                            <strong className="shrink-0 text-violet-500">{inputs.fiberDosageKgM3 || 0} kg/m³</strong>
                          </div>
                          <input type="range" min="0" max="100" step="1" value={inputs.fiberDosageKgM3 || 0} onChange={(event) => setInputs((prev) => ({ ...prev, fiberDosageKgM3: parseFloat(event.target.value) }))} className="h-1 w-full cursor-pointer accent-violet-500" />
                        </div>
                      )}

                      {inputs.selectedSpecialBinderId && (
                        <div className="rounded-xl border border-rose-500/15 bg-slate-50 p-3 text-xs dark:bg-slate-900">
                          <strong>{inputs.selectedSpecialBinderName || selectedSpecialBinderMaterial?.name || (language === "ar" ? "الرابط الخاص المختار" : "Selected special binder")}</strong>
                          <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                            {language === "ar" ? "تظهر خصائص الرابط المختار فقط وتُدار نسبته ضمن متطلبات نوع الخرسانة." : language === "fr" ? "Seules les propriétés du liant sélectionné sont affichées; son dosage dépend du type de béton." : "Only the selected binder’s properties are shown; its dosage follows the concrete-type requirements."}
                          </p>
                        </div>
                      )}

                      {!hasSelectedMixModifiers && (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 md:col-span-2">
                          {language === "ar" ? "لم تُحدد إضافات كيميائية أو معدنية أو ألياف؛ لن تظهر هنا إلا خصائص المواد التي تختارها." : language === "fr" ? "Aucun ajout chimique, minéral ou fibre n’est sélectionné; seules les propriétés des matériaux choisis apparaîtront ici." : "No chemical, mineral or fiber additions are selected; only properties for materials you choose will appear here."}
                        </div>
                      )}
                    </div>

                    {/* Dosage Alarm system monitor */}
                    {(inputs.selectedAdmixtureId || inputs.selectedScmId) && (
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
                    )}

                  </div>

                  {/* STEP 4: SITE Moisture levels AND ACTUAL FIELDS CONDITIONS */}
                  <div className={`bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 ${isRtl ? "text-right" : "text-left"}`} id="step5-field-conditions">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">6</span>
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

                </div>
                <section className="space-y-4 rounded-2xl border border-indigo-500/15 bg-white p-4 shadow-sm dark:bg-slate-900/70" id="stage3-validation-gate">
                  <header className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">7</span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">{language === "ar" ? "بوابة التحقق الهندسية" : language === "fr" ? "Portail de validation technique" : "Engineering validation gate"}</h3>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{language === "ar" ? "راجع اكتمال المواد والمدخلات قبل الانتقال إلى النتائج." : language === "fr" ? "Vérifiez les matériaux et les données avant de consulter les résultats." : "Review material and input completeness before viewing results."}</p>
                  </div>
                  </header>
<CalculationValidationGatePanel
                            validation={validationGate}
                            onNavigateToInputs={() => setActiveSidebarTab("calculator")}
                            language={language}
                            setActiveSidebarTab={setActiveSidebarTab}
                            materialsDatabase={materialsDatabase}
                            inputs={inputs}
                            onOpenBatchModal={() => setIsBatchPropertiesModalOpen(true)}
                          />
                </section>

                <header className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3" id="stage3-final-results">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white">8</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{language === "ar" ? "النتائج والمخطط الهندسي المتكامل" : language === "fr" ? "Résultats et schéma d’ingénierie intégré" : "Results and integrated engineering diagram"}</h3>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{language === "ar" ? "تظهر هنا مخرجات الخلطة وملخصها بعد اجتياز بوابة التحقق." : language === "fr" ? "Les résultats et le résumé de la formulation suivent la validation." : "Mix outputs and their summary follow the validation gate."}</p>
                  </div>
                </header>
                <div className="pt-2 space-y-4" id="stage3-integrated-results">
                  <LogicalResultsSummary
                    inputs={inputs}
                    results={results}
                    language={language}
                    materialsDatabase={materialsDatabase}
                    setActiveSidebarTab={setActiveSidebarTab}
                    onOpenBatchModal={() => setIsBatchPropertiesModalOpen(true)}
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
            </CalculatorScreenFrame>
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
                      {language !== "ar" && <span>{localizedLabel(costBreakdown.mostExpensive?.arName || "", costBreakdown.mostExpensive?.frName || "", costBreakdown.mostExpensive?.enName || "")}</span>}
                      <span className="font-mono text-xs text-slate-400">({formatCurrency(costBreakdown.mostExpensive?.cost || 0)})</span>
                      {language === "ar" && <span>{localizedLabel(costBreakdown.mostExpensive?.arName || "", costBreakdown.mostExpensive?.frName || "", costBreakdown.mostExpensive?.enName || "")}</span>}
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
                      {language !== "ar" && <span>{localizedLabel(costBreakdown.cheapest?.arName || "", costBreakdown.cheapest?.frName || "", costBreakdown.cheapest?.enName || "")}</span>}
                      <span className="font-mono text-xs text-slate-400">({formatCurrency(costBreakdown.cheapest?.cost || 0)})</span>
                      {language === "ar" && <span>{localizedLabel(costBreakdown.cheapest?.arName || "", costBreakdown.cheapest?.frName || "", costBreakdown.cheapest?.enName || "")}</span>}
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
                              {language === "fr" ? "Eau de Gâchage" : language === "en" ? "Mixing Water" : "ماء الخلط الفعال"}
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

                          {/* Row 5: Additions */}
                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                              {language === "fr" ? "Adjuvants & Additions" : language === "en" ? "Admixtures & Additions" : "الإضافات والمحسنات"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {`${Math.round(((inputs.dosageSilicaFume > 0 ? results.cementWeight * (inputs.dosageSilicaFume / 100) : 0) + (inputs.dosageFlyAsh > 0 ? results.cementWeight * (inputs.dosageFlyAsh / 100) : 0) + (inputs.dosageSlag > 0 ? results.cementWeight * (inputs.dosageSlag / 100) : 0) + (results.admixtureWeights || []).reduce((s, a) => s + a.weight, 0)) * inputs.batchVolume).toLocaleString()} kg`}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-500">
                              {costBreakdown.avgAdditionsUnitPrice ? `${formatCurrency(costBreakdown.avgAdditionsUnitPrice)}/kg` : "-"}
                            </td>
                            <td className="p-3 text-center font-mono text-blue-500 font-bold">
                              {formatCurrency(costBreakdown.additionsCost)}
                            </td>
                          </tr>

                          {/* Row 6: Labor */}
                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                              {language === "fr" ? "Main d'œuvre & Opérations" : language === "en" ? "Labor & Operations" : "اليد العاملة والتشغيل"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {`${inputs.batchVolume} m³`}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-500">
                              {formatCurrency(inputs.priceLabor)}/m³
                            </td>
                            <td className="p-3 text-center font-mono text-blue-500 font-bold">
                              {formatCurrency(costBreakdown.laborCost)}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-black border-t border-slate-200 dark:border-slate-700">
                          <tr>
                            <td colSpan={3} className="p-3 text-slate-800 dark:text-slate-100 font-bold">
                              {language === "fr" ? "Coût Total de la Gâchée" : language === "en" ? "Total Batch Cost" : "التكلفة الإجمالية للوجبة"}
                            </td>
                            <td className="p-3 text-center font-mono text-emerald-500 font-black text-sm">
                              {formatCurrency(costBreakdown.grandTotalCost)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Chart Box */}
                  <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span>{language === "fr" ? "Répartition des Coûts" : language === "en" ? "Cost Distribution" : "توزيع هيكل التكاليف"}</span>
                      </h4>
                      <div className="space-y-3 pt-2">
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-600 dark:text-slate-300">{language === "fr" ? "Ciment" : language === "en" ? "Cement" : "الإسمنت"}</span>
                            <span className="font-bold text-blue-500">{((costBreakdown.cementPercent ?? costBreakdown.percentages?.cement) || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (costBreakdown.cementPercent ?? costBreakdown.percentages?.cement) || 0))}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-600 dark:text-slate-300">{language === "fr" ? "Sable" : language === "en" ? "Sand" : "الرمل"}</span>
                            <span className="font-bold text-amber-500">{((costBreakdown.sandPercent ?? costBreakdown.percentages?.sand) || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (costBreakdown.sandPercent ?? costBreakdown.percentages?.sand) || 0))}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-600 dark:text-slate-300">{language === "fr" ? "Gravier" : language === "en" ? "Gravel" : "الحصى"}</span>
                            <span className="font-bold text-red-500">{((costBreakdown.gravelPercent ?? costBreakdown.percentages?.gravel) || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (costBreakdown.gravelPercent ?? costBreakdown.percentages?.gravel) || 0))}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-600 dark:text-slate-300">{language === "fr" ? "Eau" : language === "en" ? "Water" : "الماء"}</span>
                            <span className="font-bold text-cyan-500">{((costBreakdown.waterPercent ?? costBreakdown.percentages?.water) || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (costBreakdown.waterPercent ?? costBreakdown.percentages?.water) || 0))}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-600 dark:text-slate-300">{language === "fr" ? "Adjuvants & Additions" : language === "en" ? "Additions" : "الإضافات"}</span>
                            <span className="font-bold text-purple-500">{((costBreakdown.additionsPercent ?? costBreakdown.percentages?.additions) || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (costBreakdown.additionsPercent ?? costBreakdown.percentages?.additions) || 0))}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profitability and Regional Analytics Dashboard Component */}
                <div className="pt-4">
                  <CostAnalysisDashboard
                    inputs={inputs}
                    setInputs={setInputs}
                    results={results}
                    costBreakdown={costBreakdown}
                    formatCurrency={formatCurrency}
                    getCurrencySymbol={getCurrencySymbol}
                    language={language}
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: MATERIALS LIBRARY & DATABASES */}
            {(activeSidebarTab === "materials_library" ||
              activeSidebarTab === "cement_database" ||
              activeSidebarTab === "aggregates_database" ||
              activeSidebarTab === "admixtures_database" ||
              activeSidebarTab === "materials") && (
              <div className="space-y-6 animate-fade-in" id="materials-library-screen">
                <MaterialEngineeringDatabase
                  inputs={inputs}
                  setInputs={setInputs}
                  materials={materialsDatabase}
                  onUpdateMaterials={setMaterialsDatabase}
                  onClearAllMaterials={() => setMaterialsDatabase([])}
                  testRecords={materialTestRecords}
                  onOpenMaterialLabTests={() => {
                    setActiveSidebarTab("materials_lab");
                  }}
                  selectedSandId={inputs.selectedSandId}
                  selectedGravelId={inputs.selectedGravelId}
                  selectedCementId={inputs.selectedCementId}
                  language={language}
                  customMaterialImages={customMaterialImages}
                  generatingMaterialKey={generatingMaterialKey}
                  handleGenerateMaterialImage={handleGenerateMaterialImage}
                  generationError={generationError}
                  defaultRepo={
                    activeSidebarTab === "cement_database" ? "cement" :
                    activeSidebarTab === "aggregates_database" ? "aggregates" :
                    activeSidebarTab === "admixtures_database" ? "admixtures" : undefined
                  }
                />
              </div>
            )}

            {/* TAB CONTENT: MATERIALS TESTING LAB & ACADEMIC LAB */}
            {(activeSidebarTab === "materials_lab" ||
              activeSidebarTab === "academic_lab" ||
              activeSidebarTab === "lab_validation") && (
              <div className="space-y-6 animate-fade-in" id="materials-lab-screen">
                <LaboratoryDashboard
                  materials={materialsDatabase}
                  laboratoryTests={materialTestRecords}
                  onSaveTestRecord={handleSaveTestRecord}
                  onDeleteTestRecord={handleDeleteTestRecord}
                  onNavigateToMaterialsLibrary={() => setActiveSidebarTab("materials_library")}
                  projectId={activeProject?.id}
                  projectName={activeProject?.name}
                  projectSessions={activeProject?.laboratorySessions}
                  onSessionsChange={handleLaboratorySessionsChange}
                  language={language as "ar" | "fr" | "en"}
                />
              </div>
            )}

            {/* TAB CONTENT: RECIPE & TECHNICAL REPORTS */}
            {activeSidebarTab === "reports" && (
              <div className="space-y-6 animate-fade-in" id="recipe-report-screen">
                <RecipeReport
                  input={inputs}
                  result={results}
                  materialsDatabase={materialsDatabase}
                  onChangeInputs={(up) => setInputs(prev => ({ ...prev, ...up }))}
                  activeProject={activeProject}
                />
              </div>
            )}

            {/* TAB CONTENT: MIX OPTIMIZATION */}
            {activeSidebarTab === "optimization" && (
              <div className="space-y-6 animate-fade-in" id="mix-optimization-screen">
                <MixOptimizationPanel
                  inputs={inputs}
                  setInputs={setInputs}
                  results={results}
                  currency={currency}
                />
              </div>
            )}

            {/* TAB CONTENT: KNOWLEDGE CENTER & METHODOLOGY */}
            {activeSidebarTab === "methodology" && (
              <div className="space-y-6 animate-fade-in" id="engineering-knowledge-screen">
                <EngineeringKnowledgeCenter
                  inputs={inputs}
                  results={results}
                  setActiveSidebarTab={setActiveSidebarTab}
                  language={language as any}
                />
              </div>
            )}

            {/* TAB CONTENT: CALCULATION JOURNAL */}
            {activeSidebarTab === "journal" && (
              <div className="space-y-6 animate-fade-in" id="calculation-journal-screen">
                <CalculationJournal
                  inputs={inputs}
                  result={results}
                />
              </div>
            )}

            {/* TAB CONTENT: COMPLIANCE AUDIT & STANDARDS REPORT */}
            {activeSidebarTab === "compliance_reports" && (
              <div className="space-y-6 animate-fade-in" id="compliance-reports-screen">
                <ReportCompliance
                  result={results}
                />
              </div>
            )}

            {/* TAB CONTENT: VISUAL & STRENGTH SIMULATION */}
            {activeSidebarTab === "simulation" && (
              <div className="space-y-6 animate-fade-in" id="simulation-screen">
                <div className="grid grid-cols-1 gap-6">
                  <VisualConcreteSimulation />
                  <StrengthSimulationPanel input={inputs} result={results} />
                </div>
              </div>
            )}

            {/* TAB CONTENT: SIEVE & GRADING CURVES */}
            {activeSidebarTab === "sieve" && (
              <div className="space-y-6 animate-fade-in" id="sieve-curves-screen">
                <SieveGradingCurves
                  inputs={inputs}
                  results={results}
                  materialsDatabase={materialsDatabase}
                />
              </div>
            )}

            {/* TAB CONTENT: AI ENGINEERING ADVISOR */}
            {activeSidebarTab === "engineering_assistant" && (
              <div className="space-y-6 animate-fade-in" id="engineering-ai-advisor-screen">
                <EngineeringAIAdvisor
                  input={inputs}
                  result={results}
                  reportLanguage={language === "ar" ? "ar" : "en"}
                  materialsDatabase={materialsDatabase}
                  resolvedMaterials={activeResolvedMats}
                />
              </div>
            )}

            {/* TAB CONTENT: SETTINGS & PREFERENCES */}
            {activeSidebarTab === "settings" && (
              <div className="space-y-6 animate-fade-in" id="settings-panel-screen">
                <SettingsPanel
                  currency={currency}
                  setCurrency={setCurrency}
                  currentPlant={currentPlant}
                  setCurrentPlant={setCurrentPlant}
                  currentProject={currentProject}
                  setCurrentProject={setCurrentProject}
                  onExportBackup={handleExportBackup}
                  onImportBackup={handleImportBackup}
                  onResetDatabase={handleResetDatabase}
                />
              </div>
            )}
            </>
            )}
          </main>
      </WorkspaceLayout>

      {/* Modals & Dialogs */}
      <BatchMaterialPropertiesModal
        isOpen={isBatchPropertiesModalOpen}
        onClose={() => setIsBatchPropertiesModalOpen(false)}
        materials={materialsDatabase}
        inputs={inputs}
        activeMaterials={activeMixMaterialsList}
        onSaveSuccess={handleBatchPropertiesSave}
        language={language as "ar" | "fr" | "en"}
        userId={user?.uid}
      />

      <ProjectFileManagerModal
        mode="new"
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />

      <ProjectFileManagerModal
        mode="properties"
        isOpen={showProjectPropertiesModal}
        onClose={() => setShowProjectPropertiesModal(false)}
      />

      {/* Bottom Status Bar */}
      <StatusBar
        fck28={inputs.fck28}
        selectedMethod={inputs.selectedMethod}
        exposureClass={inputs.exposureClass}
        slumpValue={inputs.targetSlump}
        isValid={true}
      />
    </Suspense>
  </div>
  );
}
