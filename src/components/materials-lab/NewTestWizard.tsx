import React, { useState, useMemo } from "react";
import {
  FlaskConical,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  Info,
  Building2,
  User,
  Calendar,
  ShieldCheck,
  FileCheck,
  Award,
  Play,
  RotateCcw,
  Scale,
  Save,
  Check,
  Filter,
  HelpCircle,
  Tag,
  Gauge
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { 
  MaterialTestRecord, 
  LabCategory, 
  TestApprovalStatus,
  TestStatus,
  ComplianceDetail 
} from "../../types/laboratoryTypes";
import { isDemoMaterial, isDemoTestRecord, getMaterialSourceInfo } from "../../services/materialLabSync";
import { isUserMaterial } from "../../engine/suitabilityGate";

// Import testing sub-modules
import { TestModuleAggregates, AggregateTestType } from "./TestModuleAggregates";
import { TestModuleCement } from "./TestModuleCement";
import { TestModuleWater } from "./TestModuleWater";
import { TestModuleAdmixtures } from "./TestModuleAdmixtures";
import { TestModuleSCM } from "./TestModuleSCM";
import { TestModuleFibers } from "./TestModuleFibers";

export interface TestTypeOption {
  id: string;
  category: LabCategory;
  materialCategories: string[]; // matching categories like "رمال", "حصى", "إسمنت", etc.
  titleAr: string;
  titleEn: string;
  titleFr: string;
  standard: string;
  descriptionAr: string;
  targetProperties: string[];
  durationMinutes: number;
  iconName: "sieve" | "density" | "moisture" | "crush" | "flask" | "droplet" | "gauge";
  badge: string;
}

export const AVAILABLE_TEST_DEFINITIONS: TestTypeOption[] = [
  // -------------------------------------------------------------
  // SAND / FINE AGGREGATE TESTS
  // -------------------------------------------------------------
  {
    id: "AGG_SIEVE",
    category: "aggregates",
    materialCategories: ["رمال", "sand", "fine_aggregate", "حصى", "gravel", "coarse_aggregate", "ركام"],
    titleAr: "التحليل الحبيبي بالغربلة (Sieve Analysis)",
    titleEn: "Grading & Sieve Analysis",
    titleFr: "Analyse granulométrique par tamisage",
    standard: "NF EN 933-1 / ASTM C136",
    descriptionAr: "فحص التدرج الحبيبي، حساب معامل النعومة (FM)، القطر الأقصى (Dmax)، ونسبة المواد الدقيقة والناعمة.",
    targetProperties: ["granulometricCurve", "finenessModulus", "dMax", "dMin", "finesContent"],
    durationMinutes: 45,
    iconName: "sieve",
    badge: "أساسي للتصميم"
  },
  {
    id: "AGG_SAND_EQUIVALENT",
    category: "aggregates",
    materialCategories: ["رمال", "sand", "fine_aggregate"],
    titleAr: "المكافئ الرملي (Sand Equivalent ES / ESV)",
    titleEn: "Sand Equivalent Test",
    titleFr: "Équivalent de sable visuel et au piston",
    standard: "NF EN 933-8 / ASTM D2419",
    descriptionAr: "قياس نقاء الرمال ونسبة الطين والغضار والمواد الطميية الضارة للخرسانة.",
    targetProperties: ["sandEquivalent", "clayContent"],
    durationMinutes: 30,
    iconName: "flask",
    badge: "نقاء الرمل"
  },
  {
    id: "AGG_SPECIFIC_GRAVITY",
    category: "aggregates",
    materialCategories: ["رمال", "sand", "fine_aggregate", "حصى", "gravel", "coarse_aggregate", "ركام"],
    titleAr: "الكثافة الحقيقية والامتصاص (Density & Water Absorption)",
    titleEn: "Specific Gravity & Absorption",
    titleFr: "Masse volumique réelle et absorption d'eau",
    standard: "NF EN 1097-6 / ASTM C128 / C127",
    descriptionAr: "تحديد الكثافة المطلقة، كثافة مشبع جاف السطح (SSD)، ونسبة امتصاص الماء (WA24%).",
    targetProperties: ["density", "ssdDensity", "absorption", "specificGravity"],
    durationMinutes: 60,
    iconName: "density",
    badge: "كثافة وامتصاص"
  },
  {
    id: "AGG_BULK_DENSITY",
    category: "aggregates",
    materialCategories: ["رمال", "sand", "fine_aggregate", "حصى", "gravel", "coarse_aggregate", "ركام"],
    titleAr: "الكثافة الظاهرية السائبة والمرصوصة (Bulk Density)",
    titleEn: "Loose & Compacted Bulk Density",
    titleFr: "Masse volumique apparente en vrac et tassée",
    standard: "NF EN 1097-3 / ASTM C29",
    descriptionAr: "قياس الكتلة الحجمية الظاهرية للركام في الحالة السائبة والمرصوصة وحساب الفراغات البينية.",
    targetProperties: ["bulkDensity", "compactedBulkDensity", "voidContent"],
    durationMinutes: 20,
    iconName: "density",
    badge: "حجم وفراغات"
  },
  {
    id: "AGG_MOISTURE_CONTENT",
    category: "aggregates",
    materialCategories: ["رمال", "sand", "fine_aggregate", "حصى", "gravel", "coarse_aggregate", "ركام"],
    titleAr: "نسبة الرطوبة الحقلية وتصحيح ماء الخلط (Moisture Content)",
    titleEn: "Field Moisture & Water Correction",
    titleFr: "Teneur en eau et correction du gâchage",
    standard: "NF EN 1097-5 / ASTM C566",
    descriptionAr: "قياس نسبة الرطوبة الحرة والمحتوى المائي في الركام لإجراء تصحيح كميات ماء الخلط الفعلي في المحطة.",
    targetProperties: ["moisture"],
    durationMinutes: 25,
    iconName: "moisture",
    badge: "تصحيح الخلطة"
  },
  {
    id: "AGG_BULKING_SAND",
    category: "aggregates",
    materialCategories: ["رمال", "sand", "fine_aggregate"],
    titleAr: "انتفاخ الرمل بالرطوبة (Foisonnement / Sand Bulking)",
    titleEn: "Bulking of Sand Curve",
    titleFr: "Foisonnement du sable sous humidité",
    standard: "BS 812 / NF P 18-598",
    descriptionAr: "رسم منحنى زيادة الحجم الظاهري للرمل بفعل الرطوبة السطحية لتعديل نسب الكيل الحجمي.",
    targetProperties: ["foisonnement", "optimalMoistureBulking"],
    durationMinutes: 40,
    iconName: "gauge",
    badge: "كيل حجمي"
  },
  {
    id: "AGG_METHYLENE_BLUE",
    category: "aggregates",
    materialCategories: ["رمال", "sand", "fine_aggregate"],
    titleAr: "قيمة أزرق الميثيلين للمواد الناعمة (Methylene Blue MB)",
    titleEn: "Methylene Blue Value",
    titleFr: "Valeur au bleu de méthylène MB",
    standard: "NF EN 933-9",
    descriptionAr: "تقييم نشاط الغضار والطين في كسر الحبيبات الناعمة (<0.125 mm).",
    targetProperties: ["methyleneBlue", "clayContent"],
    durationMinutes: 35,
    iconName: "flask",
    badge: "نشاط الغضار"
  },
  {
    id: "AGG_VOID_CONTENT",
    category: "aggregates",
    materialCategories: ["رمال", "sand", "fine_aggregate", "حصى", "gravel", "coarse_aggregate", "ركام"],
    titleAr: "نسبة الفراغات البينية (Interstitial Void Content)",
    titleEn: "Void Content of Aggregates",
    titleFr: "Taux de vides interstitiels",
    standard: "NF EN 1097-3 / ASTM C29",
    descriptionAr: "حساب نسبة الفراغات بين حبيبات الركام لتحديد كمية العجينة الإسمنتية اللازمة لملئها.",
    targetProperties: ["voidContent"],
    durationMinutes: 20,
    iconName: "gauge",
    badge: "فراغات"
  },

  // -------------------------------------------------------------
  // COARSE AGGREGATE (GRAVEL) TESTS
  // -------------------------------------------------------------
  {
    id: "AGG_LOS_ANGELES",
    category: "aggregates",
    materialCategories: ["حصى", "gravel", "coarse_aggregate", "ركام"],
    titleAr: "معامل لوس أنجلوس لمقاومة التفتت والصدم (Los Angeles LA)",
    titleEn: "Los Angeles Abrasion Resistance",
    titleFr: "Coefficient Los Angeles (Résistance à la fragmentation)",
    standard: "NF EN 1097-2 / ASTM C131",
    descriptionAr: "اختبار الصلابة ومقاومة التفتت الحركي والصدم للركام الخشن تحت الكرات الفولاذية.",
    targetProperties: ["losAngelesAbrasion"],
    durationMinutes: 60,
    iconName: "crush",
    badge: "صلابة الحصى"
  },
  {
    id: "AGG_MICRO_DEVAL",
    category: "aggregates",
    materialCategories: ["حصى", "gravel", "coarse_aggregate", "ركام"],
    titleAr: "معامل ميكرو ديفال للتآكل الرطب (Micro-Deval MDE)",
    titleEn: "Micro-Deval Wear Resistance",
    titleFr: "Coefficient Micro-Deval en présence d'eau",
    standard: "NF EN 1097-1",
    descriptionAr: "قياس مقاومة الركام للتآكل الاحتكاكي الرطب بين الحبيبات بوجود الماء والكرات الدقيقة.",
    targetProperties: ["microDeval"],
    durationMinutes: 75,
    iconName: "crush",
    badge: "مقاومة الاحتكاك"
  },
  {
    id: "AGG_SHAPE_FLAKINESS",
    category: "aggregates",
    materialCategories: ["حصى", "gravel", "coarse_aggregate", "ركام"],
    titleAr: "معامل التفرطح والشكل الإبري (Flakiness & Shape Index)",
    titleEn: "Flakiness & Shape Index",
    titleFr: "Coefficient d'aplatissement et indice de forme",
    standard: "NF EN 933-3 / NF EN 933-4",
    descriptionAr: "قياس نسبة الحبيبات المفلطحة والإبرية غير المكعبة باستخدام الغرابيل ذات القضبان والمقياس المتناسب.",
    targetProperties: ["flakinessIndex", "shapeIndex"],
    durationMinutes: 40,
    iconName: "sieve",
    badge: "شكل الحبيبات"
  },

  // -------------------------------------------------------------
  // CEMENT TESTS
  // -------------------------------------------------------------
  {
    id: "CEM_CHARACTERIZATION",
    category: "cement",
    materialCategories: ["إسمنت", "cement", "liant"],
    titleAr: "فحوصات الإسمنت الشاملة والمقاومة المعيارية (Cement Standards)",
    titleEn: "Standard Cement Characterization & Compressive Strength",
    titleFr: "Essais mécaniques et physiques du ciment",
    standard: "NF EN 196 (1, 3, 6) / NF EN 197-1",
    descriptionAr: "مقاومة المونة المعيارية (2d, 7d, 28d)، قوام فيكات، زمن الشك، نعومة بلين، والثبات الحجمي بلشاتولييه.",
    targetProperties: ["strengthClass", "blaineFineness", "density", "specificGravity", "initialSetting", "finalSetting"],
    durationMinutes: 90,
    iconName: "flask",
    badge: "توصيف شامل"
  },

  // -------------------------------------------------------------
  // WATER TESTS
  // -------------------------------------------------------------
  {
    id: "WATER_QUALITY",
    category: "water",
    materialCategories: ["ماء", "water", "eau"],
    titleAr: "مطابقة مياه الخلط والمعالجة (Mixing Water Quality EN 1008)",
    titleEn: "Mixing Water Quality & Chemical Conformity",
    titleFr: "Conformité chimique de l'eau de gâchage",
    standard: "NF EN 1008 / ISO 10523",
    descriptionAr: "التحليل الكيميائي لـ pH، الكلوريدات (Cl-)، الكبريتات (SO4 2-)، المواد العضوية، والمقارنة الزمنية لقوام الشك.",
    targetProperties: ["pH", "chlorides", "sulfates"],
    durationMinutes: 45,
    iconName: "droplet",
    badge: "مطابقة معيارية"
  },

  // -------------------------------------------------------------
  // ADMIXTURE TESTS
  // -------------------------------------------------------------
  {
    id: "ADMIX_PERFORMANCE",
    category: "admixtures",
    materialCategories: ["إضافات كيميائية", "مضافات", "admixture", "adjuvant", "admixtures"],
    titleAr: "توصيف المضاف الكيميائي وتخفيض الماء (Admixture Characterization)",
    titleEn: "Admixture Characterization & Water Reduction",
    titleFr: "Caractérisation et réduction d'eau selon NF EN 934-2",
    standard: "NF EN 934-2 / ASTM C494",
    descriptionAr: "قياس نسبة تخفيض ماء الخلط الفعالة، المحتوى الصلب الجاف (Extrait Sec)، الكثافة، والـ pH.",
    targetProperties: ["waterReduction", "density", "solidContent", "pH"],
    durationMinutes: 50,
    iconName: "flask",
    badge: "فعالية الملدن"
  },

  // -------------------------------------------------------------
  // SCM / MINERAL ADDITIVES TESTS
  // -------------------------------------------------------------
  {
    id: "SCM_ACTIVITY",
    category: "additives",
    materialCategories: ["إضافات معدنية", "scm", "غبار السيليكا", "خبث", "رماد متطاير", "mineral_addition"],
    titleAr: "معامل النشاط البوزولاني والنعومة (SCM Pozzolanic Activity)",
    titleEn: "Pozzolanic Activity Index & Fineness",
    titleFr: "Indice d'activité pouzzolanique et finesse BET",
    standard: "NF EN 450 / ASTM C618 / NF EN 13263",
    descriptionAr: "تحديد مؤشر النشاط الميكانيكي للبوزولان والغبار السيليسي، نعومة BET، والكثافة النوعية.",
    targetProperties: ["pozzolanicIndex", "fineness", "density", "specificGravity"],
    durationMinutes: 60,
    iconName: "flask",
    badge: "نشاط بوزولاني"
  },

  // -------------------------------------------------------------
  // FIBERS TESTS
  // -------------------------------------------------------------
  {
    id: "FIBERS_CHARACTERIZATION",
    category: "fibers",
    materialCategories: ["ألياف", "fibers", "fibres"],
    titleAr: "توصيف ومقاومة ألياف التسليح (Fiber Characterization)",
    titleEn: "Fiber Tensile & Aspect Ratio",
    titleFr: "Caractérisation des fibres selon NF EN 14889",
    standard: "NF EN 14889-1 / 14889-2",
    descriptionAr: "قياس النسبة الباعية (L/d)، مقاومة الشد الميكانيكي للألياف الفولاذية والبوليمرية، ومعامل المرونة.",
    targetProperties: ["tensileStrength", "aspectRatio", "density"],
    durationMinutes: 35,
    iconName: "gauge",
    badge: "تسليح الألياف"
  }
];

export function getApplicableTestsForMaterial(material: EngineeringMaterial): TestTypeOption[] {
  if (!material) return [];
  const cat = (material.category || "").toLowerCase();
  const subCat = (material.SubCategory || "").toLowerCase();
  const matType = (material.materialType || material.type || "").toLowerCase();
  const name = (material.name || "").toLowerCase();

  return AVAILABLE_TEST_DEFINITIONS.filter(test => {
    return test.materialCategories.some(testCat => {
      const lower = testCat.toLowerCase();
      return (
        cat.includes(lower) || 
        subCat.includes(lower) || 
        matType.includes(lower) || 
        name.includes(lower) ||
        (test.category === "aggregates" && (cat === "رمال" || cat === "حصى" || cat.includes("ركام"))) ||
        (test.category === "cement" && (cat === "إسمنت" || cat.includes("cement") || cat.includes("ciment"))) ||
        (test.category === "water" && (cat === "ماء" || cat.includes("water") || cat.includes("eau"))) ||
        (test.category === "admixtures" && (cat.includes("إضافات") || cat.includes("مضاف") || cat.includes("admix"))) ||
        (test.category === "additives" && (cat.includes("معدنية") || cat.includes("scm") || cat.includes("سيليكا"))) ||
        (test.category === "fibers" && (cat.includes("ألياف") || cat.includes("fiber") || cat.includes("fibre")))
      );
    });
  });
}

export interface NewTestWizardProps {
  materials: EngineeringMaterial[];
  operator?: string;
  projectName?: string;
  initialMaterial?: EngineeringMaterial | null;
  onSaveCompletedTest: (test: MaterialTestRecord, updatedMaterialProps?: Record<string, any>) => void;
  onCancel: () => void;
  onQuickAddMaterial?: (newMaterial: EngineeringMaterial) => void;
}

export type WizardStep = 
  | "select_material"
  | "select_test"
  | "session_setup"
  | "execute_test";

export const NewTestWizard: React.FC<NewTestWizardProps> = ({
  materials,
  operator = "م. سفيان زوبير (رئيس مخبر مراقبة الجودة)",
  projectName = "مشروع الخرسانة النموذجي",
  initialMaterial = null,
  onSaveCompletedTest,
  onCancel,
  onQuickAddMaterial
}) => {
  // Step navigation
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    initialMaterial ? "select_test" : "select_material"
  );

  // Selected state
  const [selectedMaterial, setSelectedMaterial] = useState<EngineeringMaterial | null>(initialMaterial);
  const [selectedTestOption, setSelectedTestOption] = useState<TestTypeOption | null>(null);

  // Filter & Search inside Step 1 (Material Selection)
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<string>("ALL");
  const [materialSourceFilter, setMaterialSourceFilter] = useState<"user_only" | "all">("user_only");

  // Session Setup Metadata (Step 3)
  const [sessionTestId, setSessionTestId] = useState<string>("");
  const [sessionSampleId, setSessionSampleId] = useState<string>("");
  const [sessionOperator, setSessionOperator] = useState<string>(operator);
  const [sessionProjectName, setSessionProjectName] = useState<string>(projectName);
  const [sessionLabName, setSessionLabName] = useState<string>("SnoLab Central Materials Laboratory");
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [sessionStandard, setSessionStandard] = useState<string>("");
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [sessionSampleDesc, setSessionSampleDesc] = useState<string>("");

  // Quick Add Material Modal State (for Zero materials or on-demand add)
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [newMatName, setNewMatName] = useState("");
  const [newMatCategory, setNewMatCategory] = useState("رمال");
  const [newMatDensity, setNewMatDensity] = useState(2650);
  const [newMatAbsorption, setNewMatAbsorption] = useState(1.2);
  const [newMatMoisture, setNewMatMoisture] = useState(3.5);

  // Separate user materials from demo materials
  const userMaterials = useMemo(() => materials.filter(m => isUserMaterial(m)), [materials]);
  const demoMaterials = useMemo(() => materials.filter(m => !isUserMaterial(m)), [materials]);

  // Filtered materials for Step 1
  const displayedMaterials = useMemo(() => {
    const baseList = materialSourceFilter === "user_only" ? userMaterials : materials;
    return baseList.filter(mat => {
      // Category filter
      if (materialCategoryFilter !== "ALL") {
        if (materialCategoryFilter === "aggregates" && !(mat.category === "رمال" || mat.category === "حصى" || mat.category?.includes("ركام"))) return false;
        if (materialCategoryFilter === "cement" && !(mat.category === "إسمنت" || mat.category?.includes("cement"))) return false;
        if (materialCategoryFilter === "water" && !(mat.category === "ماء" || mat.category?.includes("water"))) return false;
        if (materialCategoryFilter === "admixtures" && !(mat.category?.includes("إضافات") || mat.category?.includes("مضاف"))) return false;
        if (materialCategoryFilter === "additives" && !(mat.category?.includes("معدنية") || mat.category?.includes("scm"))) return false;
        if (materialCategoryFilter === "fibers" && !(mat.category?.includes("ألياف") || mat.category?.includes("fiber"))) return false;
      }

      // Search query
      if (materialSearchQuery.trim() !== "") {
        const q = materialSearchQuery.toLowerCase();
        const match = 
          mat.name.toLowerCase().includes(q) ||
          (mat.englishName && mat.englishName.toLowerCase().includes(q)) ||
          mat.id.toLowerCase().includes(q) ||
          mat.category.toLowerCase().includes(q) ||
          (mat.source && mat.source.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [materials, userMaterials, materialSourceFilter, materialCategoryFilter, materialSearchQuery]);

  // Applicable tests for currently selected material
  const applicableTests = useMemo(() => {
    if (!selectedMaterial) return [];
    return getApplicableTestsForMaterial(selectedMaterial);
  }, [selectedMaterial]);

  // Handler to generate session ID and prepare Step 3
  const handleProceedToSessionSetup = (testOpt: TestTypeOption) => {
    setSelectedTestOption(testOpt);
    const prefix = testOpt.id.replace("AGG_", "").replace("CEM_", "").replace("WATER_", "WAT_").slice(0, 4);
    const idCode = `TEST-${prefix}-${Date.now().toString().slice(-6)}`;
    const smpCode = `SMP-${(selectedMaterial?.name || "MAT").slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    setSessionTestId(idCode);
    setSessionSampleId(smpCode);
    setSessionStandard(testOpt.standard);
    setSessionSampleDesc(`عينة مأخوذة من مادة [${selectedMaterial?.name}] لغرض فحص [${testOpt.titleAr}]`);
    setCurrentStep("session_setup");
  };

  // Handler to start actual execution
  const handleStartExecution = () => {
    setCurrentStep("execute_test");
  };

  // Quick Add Material Submit
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    const newId = `usr-mat-${Date.now().toString().slice(-6)}`;
    const newMaterial: EngineeringMaterial = {
      id: newId,
      name: newMatName.trim(),
      englishName: newMatName.trim(),
      type: newMatCategory,
      category: newMatCategory,
      density: Number(newMatDensity) || 2650,
      absorption: Number(newMatAbsorption) || 1.0,
      moisture: Number(newMatMoisture) || 2.0,
      quality: "مطابقة للمعايير الوطنية والدولية",
      uses: "استخدامات خرسانية عامة وفحوص مخبرية",
      desc: `مادة مضافة من قبل المستخدم لإجراء فحص مخبري (${newMatCategory})`,
      rating: 5,
      provenance: "مخبر التحاليل وضبط الجودة",
      image: "",
      status: "نشط",
      ApprovalStatus: "Draft",
      isDemo: false,
      sourceType: "user_created",
      source: "مخبر المستخدم",
      sourceLabel: "مادة المستخدم الخاصة",
      createdBy: sessionOperator,
      createdDate: new Date().toISOString()
    };

    if (onQuickAddMaterial) {
      onQuickAddMaterial(newMaterial);
    }
    
    // Select this material immediately and advance to Step 2
    setSelectedMaterial(newMaterial);
    setIsQuickAddModalOpen(false);
    setNewMatName("");
    setCurrentStep("select_test");
  };

  // Helper step indicators
  const stepsList = [
    { key: "select_material", label: "1. اختيار المادة", icon: Layers },
    { key: "select_test", label: "2. نوع الفحص المعياري", icon: FlaskConical },
    { key: "session_setup", label: "3. بيانات جلسة الاختبار", icon: FileCheck },
    { key: "execute_test", label: "4. إدخال القياسات والحساب", icon: Play }
  ];

  const currentStepIndex = stepsList.findIndex(s => s.key === currentStep);

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-l from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/30 shadow-inner">
              <FlaskConical size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black tracking-tight">
                  محرك إجراء الفحوصات المخبرية المعيارية
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  NF EN / ASTM Workflow
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                دورة اختبار متكاملة: اختيار المادة ← تحديد المعيار ← إدخال القياسات والمنحنيات ← التحقق الرقابي ← الاعتماد ومزامنة الخصائص
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              إلغاء والعودة للوحة السجلات
            </button>
          </div>
        </div>

        {/* Step Indicator Progress */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-2">
          {stepsList.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-xl flex items-center gap-2.5 transition-all ${
                  isCurrent
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-1 ring-blue-400"
                    : isDone
                    ? "bg-slate-800/80 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800/40 text-slate-400 border border-slate-800 opacity-60"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isCurrent ? "bg-white/20" : isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                  {isDone ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black">{step.label}</div>
                  <div className="text-[9px] opacity-75 font-mono">
                    {idx === 0 && (selectedMaterial ? selectedMaterial.name : "لم تُحدد")}
                    {idx === 1 && (selectedTestOption ? selectedTestOption.standard : "المعيار")}
                    {idx === 2 && (sessionTestId ? sessionTestId : "الجلسة")}
                    {idx === 3 && "القياسات والحساب"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: SELECT MATERIAL */}
      {/* ========================================================================= */}
      {currentStep === "select_material" && (
        <div className="space-y-6">
          
          {/* Action Bar & Source Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMaterialSourceFilter("user_only")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  materialSourceFilter === "user_only"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <User size={14} />
                <span>مواد مشروعي ومكتبتي الخاصة ({userMaterials.length})</span>
              </button>

              <button
                onClick={() => setMaterialSourceFilter("all")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  materialSourceFilter === "all"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <Layers size={14} />
                <span>عرض جميع المواد بما فيها النماذج القياسية ({materials.length})</span>
              </button>
            </div>

            <button
              onClick={() => setIsQuickAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Plus size={15} />
              <span>+ إضافة مادة جديدة للاختبار</span>
            </button>
          </div>

          {/* Search & Category Tabs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن مادة باسمها، كودها، أو تصنيفها..."
                value={materialSearchQuery}
                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "جميع الأصناف" },
                { id: "aggregates", label: "الركام والرمال" },
                { id: "cement", label: "الإسمنت" },
                { id: "water", label: "مياه الخلط" },
                { id: "admixtures", label: "المضافات" },
                { id: "additives", label: "إضافات معدنية" },
                { id: "fibers", label: "الألياف" }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setMaterialCategoryFilter(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    materialCategoryFilter === cat.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ZERO STATE (No materials in User Library) */}
          {displayedMaterials.length === 0 && (
            <div className="p-10 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border-2 border-dashed border-amber-500/30 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  لا توجد مواد متاحة للاختبار في مكتبتك الخاصة
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  لإجراء فحص مخبري حقيقي، يمكنك إضافة رمل، حصى، إسمنت أو مادة جديدة الآن، أو استعراض النماذج القياسية المعدة مسبقاً.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsQuickAddModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <Plus size={16} />
                  <span>إضافة مادة جديدة الآن</span>
                </button>

                <button
                  onClick={() => setMaterialSourceFilter("all")}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  استخدام مادة من النماذج القياسية
                </button>
              </div>
            </div>
          )}

          {/* Material Cards Grid */}
          {displayedMaterials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedMaterials.map((mat) => {
                const isUser = isUserMaterial(mat);
                const isSelected = selectedMaterial?.id === mat.id;

                return (
                  <div
                    key={mat.id}
                    onClick={() => setSelectedMaterial(mat)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-right relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-400/40"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isUser 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                          {isUser ? "مادة المستخدم الخاصة" : "نموذج قياسي"}
                        </span>
                        
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {mat.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {mat.name}
                      </h4>
                      {mat.englishName && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {mat.englishName}
                        </div>
                      )}

                      {/* Key Engineering Properties Pills */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-400 text-[10px] block">الكثافة:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {mat.density || 2650} kg/m³
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-400 text-[10px] block">الامتصاص:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {mat.absorption !== undefined ? `${mat.absorption}%` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {mat.id.slice(0, 10)}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMaterial(mat);
                          setCurrentStep("select_test");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span>اختيار والمتابعة</span>
                        <ArrowLeft size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Bottom Actions */}
          {selectedMaterial && (
            <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-xl flex items-center justify-between gap-4 animate-slide-up">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-blue-200" />
                <div>
                  <div className="text-xs font-bold text-blue-100">المادة المختارة حالياً:</div>
                  <div className="text-sm font-black">{selectedMaterial.name} ({selectedMaterial.category})</div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep("select_test")}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-black text-xs shadow-md transition cursor-pointer"
              >
                <span>الانتقال لاختيار نوع الفحص المخبري</span>
                <ArrowLeft size={16} />
              </button>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: SELECT LABORATORY TEST TYPE */}
      {/* ========================================================================= */}
      {currentStep === "select_test" && selectedMaterial && (
        <div className="space-y-6">
          
          {/* Material Context Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                <Layers size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-400">المادة المحددة للاختبار:</div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedMaterial.name}</span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {selectedMaterial.category}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep("select_material")}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw size={12} />
              <span>تغيير المادة</span>
            </button>
          </div>

          {/* Test Category Intro */}
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              الاختبارات المخبرية المعيارية المتاحة لصنف ({selectedMaterial.category})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تمت تصفية الاختبارات بدقة لعرض الفحوصات المتوافقة مع طبيعة هذه المادة وفق مواصفات NF EN و ASTM.
            </p>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applicableTests.map((testOpt) => {
              const isSelected = selectedTestOption?.id === testOpt.id;

              return (
                <div
                  key={testOpt.id}
                  onClick={() => setSelectedTestOption(testOpt)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-400/40"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {testOpt.badge}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {testOpt.standard}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {testOpt.titleAr}
                    </h4>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {testOpt.titleFr}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                      {testOpt.descriptionAr}
                    </p>

                    {/* Properties Updated upon Validation */}
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">الخصائص التي يتم تحديثها في المادة عند الاعتماد:</div>
                      <div className="flex flex-wrap gap-1">
                        {testOpt.targetProperties.map(prop => (
                          <span key={prop} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                            +{prop}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <span>المدة التقديرية: ~{testOpt.durationMinutes} دقيقة</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProceedToSessionSetup(testOpt);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>بدء جلسة الفحص</span>
                      <ArrowLeft size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {applicableTests.length === 0 && (
            <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
              <Info size={24} className="text-amber-500 mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                لم يتم العثور على فحوصات مطابقة لصنف ({selectedMaterial.category})
              </div>
              <p className="text-xs text-slate-400">
                يرجى التحقق من صنف المادة في مكتبة المواد.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: TEST SESSION SETUP */}
      {/* ========================================================================= */}
      {currentStep === "session_setup" && selectedMaterial && selectedTestOption && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  إنشاء وتوثيق جلسة الاختبار المخبري (Test Session Setup)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  توثيق المرجعية المعيارية وهوية العينة والمشروع وفق متطلبات الجودة ISO/IEC 17025
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {sessionTestId}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Test ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>كود الاختبار (Test ID):</span>
                </label>
                <input
                  type="text"
                  value={sessionTestId}
                  onChange={(e) => setSessionTestId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold"
                />
              </div>

              {/* Sample ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>كود العينة (Sample ID):</span>
                </label>
                <input
                  type="text"
                  value={sessionSampleId}
                  onChange={(e) => setSessionSampleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold"
                />
              </div>

              {/* Material */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  المادة المفحوصة (Material):
                </label>
                <input
                  type="text"
                  disabled
                  value={`${selectedMaterial.name} (${selectedMaterial.category})`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 font-bold text-xs text-slate-600 dark:text-slate-300 cursor-not-allowed"
                />
              </div>

              {/* Project */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  اسم المشروع (Project):
                </label>
                <input
                  type="text"
                  value={sessionProjectName}
                  onChange={(e) => setSessionProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              {/* Operator */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  المهندس القائم بالفحص (Operator):
                </label>
                <input
                  type="text"
                  value={sessionOperator}
                  onChange={(e) => setSessionOperator(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  تاريخ إجراء التجربة (Test Date):
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono"
                />
              </div>

              {/* Standard */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  المعيار القياسي المعتمد (Standard / Method):
                </label>
                <input
                  type="text"
                  value={sessionStandard}
                  onChange={(e) => setSessionStandard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>

              {/* Lab Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  المخبر المخول (Testing Laboratory):
                </label>
                <input
                  type="text"
                  value={sessionLabName}
                  onChange={(e) => setSessionLabName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              {/* Sample Description */}
              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  وصف العينة وظروف أخذها (Sample Source & Condition):
                </label>
                <input
                  type="text"
                  value={sessionSampleDesc}
                  onChange={(e) => setSessionSampleDesc(e.target.value)}
                  placeholder="مثال: عينة مجلوبة من مقلع الجلفة، مغسولة ومجففة بالفرن عند 105°C..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ملاحظات مخبرية وظروف المحيط (Notes & Ambient Conditions):
                </label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="درجة الحرارة المخبرية 20°C ± 2°C، الرطوبة النسبية 65%..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentStep("select_test")}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight size={14} />
                <span>العودة لاختيار الفحص</span>
              </button>

              <button
                onClick={handleStartExecution}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Play size={15} />
                <span>فتح نموذج إدخال القياسات والحساب الفعلي</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: INTERACTIVE TEST EXECUTION & LIVE COMPUTATIONS */}
      {/* ========================================================================= */}
      {currentStep === "execute_test" && selectedMaterial && selectedTestOption && (
        <div className="space-y-6">
          
          {/* Submodule router matching category */}
          {selectedTestOption.category === "aggregates" && (
            <TestModuleAggregates
              material={selectedMaterial}
              operator={sessionOperator}
              projectName={sessionProjectName}
              initialTestType={selectedTestOption.id as AggregateTestType}
              onSaveTest={(record, updatedProps) => {
                // Ensure session metadata is persisted
                const completeRecord: MaterialTestRecord = {
                  ...record,
                  id: sessionTestId || record.id,
                  sampleId: sessionSampleId || record.sampleId,
                  projectId: "proj_active",
                  projectName: sessionProjectName,
                  operator: sessionOperator,
                  laboratoryName: sessionLabName,
                  date: sessionDate,
                  standard: sessionStandard || record.standard,
                  sampleDescription: sessionSampleDesc,
                  notes: sessionNotes || record.notes,
                  isDemo: false,
                  sourceType: "user_created",
                  sourceLabel: "User Test"
                };
                onSaveCompletedTest(completeRecord, updatedProps);
              }}
              onCancel={() => setCurrentStep("session_setup")}
            />
          )}

          {selectedTestOption.category === "cement" && (
            <TestModuleCement
              material={selectedMaterial}
              operator={sessionOperator}
              projectName={sessionProjectName}
              onSaveTest={(record, updatedProps) => {
                const completeRecord: MaterialTestRecord = {
                  ...record,
                  id: sessionTestId || record.id,
                  sampleId: sessionSampleId || record.sampleId,
                  projectName: sessionProjectName,
                  operator: sessionOperator,
                  laboratoryName: sessionLabName,
                  date: sessionDate,
                  standard: sessionStandard || record.standard,
                  sampleDescription: sessionSampleDesc,
                  notes: sessionNotes || record.notes,
                  isDemo: false,
                  sourceType: "user_created",
                  sourceLabel: "User Test"
                };
                onSaveCompletedTest(completeRecord, updatedProps);
              }}
              onCancel={() => setCurrentStep("session_setup")}
            />
          )}

          {selectedTestOption.category === "water" && (
            <TestModuleWater
              material={selectedMaterial}
              operator={sessionOperator}
              projectName={sessionProjectName}
              onSaveTest={(record, updatedProps) => {
                const completeRecord: MaterialTestRecord = {
                  ...record,
                  id: sessionTestId || record.id,
                  sampleId: sessionSampleId || record.sampleId,
                  projectName: sessionProjectName,
                  operator: sessionOperator,
                  laboratoryName: sessionLabName,
                  date: sessionDate,
                  standard: sessionStandard || record.standard,
                  sampleDescription: sessionSampleDesc,
                  notes: sessionNotes || record.notes,
                  isDemo: false,
                  sourceType: "user_created",
                  sourceLabel: "User Test"
                };
                onSaveCompletedTest(completeRecord, updatedProps);
              }}
              onCancel={() => setCurrentStep("session_setup")}
            />
          )}

          {selectedTestOption.category === "admixtures" && (
            <TestModuleAdmixtures
              material={selectedMaterial}
              operator={sessionOperator}
              projectName={sessionProjectName}
              onSaveTest={(record, updatedProps) => {
                const completeRecord: MaterialTestRecord = {
                  ...record,
                  id: sessionTestId || record.id,
                  sampleId: sessionSampleId || record.sampleId,
                  projectName: sessionProjectName,
                  operator: sessionOperator,
                  laboratoryName: sessionLabName,
                  date: sessionDate,
                  standard: sessionStandard || record.standard,
                  sampleDescription: sessionSampleDesc,
                  notes: sessionNotes || record.notes,
                  isDemo: false,
                  sourceType: "user_created",
                  sourceLabel: "User Test"
                };
                onSaveCompletedTest(completeRecord, updatedProps);
              }}
              onCancel={() => setCurrentStep("session_setup")}
            />
          )}

          {selectedTestOption.category === "additives" && (
            <TestModuleSCM
              material={selectedMaterial}
              operator={sessionOperator}
              projectName={sessionProjectName}
              onSaveTest={(record, updatedProps) => {
                const completeRecord: MaterialTestRecord = {
                  ...record,
                  id: sessionTestId || record.id,
                  sampleId: sessionSampleId || record.sampleId,
                  projectName: sessionProjectName,
                  operator: sessionOperator,
                  laboratoryName: sessionLabName,
                  date: sessionDate,
                  standard: sessionStandard || record.standard,
                  sampleDescription: sessionSampleDesc,
                  notes: sessionNotes || record.notes,
                  isDemo: false,
                  sourceType: "user_created",
                  sourceLabel: "User Test"
                };
                onSaveCompletedTest(completeRecord, updatedProps);
              }}
              onCancel={() => setCurrentStep("session_setup")}
            />
          )}

          {selectedTestOption.category === "fibers" && (
            <TestModuleFibers
              material={selectedMaterial}
              operator={sessionOperator}
              projectName={sessionProjectName}
              onSaveTest={(record, updatedProps) => {
                const completeRecord: MaterialTestRecord = {
                  ...record,
                  id: sessionTestId || record.id,
                  sampleId: sessionSampleId || record.sampleId,
                  projectName: sessionProjectName,
                  operator: sessionOperator,
                  laboratoryName: sessionLabName,
                  date: sessionDate,
                  standard: sessionStandard || record.standard,
                  sampleDescription: sessionSampleDesc,
                  notes: sessionNotes || record.notes,
                  isDemo: false,
                  sourceType: "user_created",
                  sourceLabel: "User Test"
                };
                onSaveCompletedTest(completeRecord, updatedProps);
              }}
              onCancel={() => setCurrentStep("session_setup")}
            />
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK ADD MATERIAL MODAL */}
      {/* ========================================================================= */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="p-5 bg-gradient-to-l from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black">إضافة مادة جديدة للاختبار</h3>
                  <p className="text-xs text-slate-300">أدخل معلومات المادة الأساسية لتبدأ فحصها فوراً</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  اسم المادة (Material Name) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: رمل سيليسي مغسول 0/4 - وادي سوف"
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  صنف المادة (Category):
                </label>
                <select
                  value={newMatCategory}
                  onChange={(e) => setNewMatCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="رمال">رمال (Sand / Fine Aggregate)</option>
                  <option value="حصى">حصى وركام خشن (Gravel / Coarse Aggregate)</option>
                  <option value="إسمنت">إسمنت ورابط هيدروليكي (Cement)</option>
                  <option value="ماء">ماء الخلط (Mixing Water)</option>
                  <option value="إضافات كيميائية">إضافات كيميائية وملدنات (Admixtures)</option>
                  <option value="إضافات معدنية">إضافات معدنية وبوزولان (SCM)</option>
                  <option value="ألياف">ألياف تسليح (Fibers)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    الكثافة (kg/m³):
                  </label>
                  <input
                    type="number"
                    value={newMatDensity}
                    onChange={(e) => setNewMatDensity(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    الامتصاص (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMatAbsorption}
                    onChange={(e) => setNewMatAbsorption(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    الرطوبة (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMatMoisture}
                    onChange={(e) => setNewMatMoisture(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer"
                >
                  إنشاء المادة وبدء الاختبار فوراً
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
