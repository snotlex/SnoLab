/**
 * Type declarations for the Dreux-Gorisse Concrete Mix Design App.
 */

export enum AggregateType {
  ROULE = "roule",         // Rounded / Gravel (حصى مستديرة/وديان)
  CONCASSE = "concasse"    // Crushed (حصى مكسرة/زاويّة)
}

export enum AggregateQuality {
  EXCELLENT = "excellent", // ممتازة (نقية للغاية وجيدة التدرج)
  STANDARD = "standard",   // عادية/قياسية (مطابقة للمواصفات الحبيبية القياسية)
  POOR = "poor"           // متوسطة/ضعيفة (تحتوي على نسبة من الأتربة أو الناعم)
}

export interface Admixture {
  id: string;
  name: string | { ar: string; en: string; fr: string };             // الاسم (e.g., Sika ViscoCrete, MasterGlenium)
  type: "superplasticizer" | "retarder" | "accelerator" | "air_entraining" | "silica_fume" | "custom";
  dosage: number;           // الجرعة بالمركبات (% من وزن الإسمنت، مثلاً 1.2%)
  waterReduction: number;   // نسبة تخفيض الماء (%، مثلاً 15% للملدنات)
  effect: string | { ar: string; en: string; fr: string };     // الأثر متعدد اللغات
}

export interface MixDesignInput {
  bypassSuitabilityGate?: boolean; // Bypass suitability check for legacy math unit tests
  fck28: number;            // المقاومة القياسية المميزة المطلوبة بعد 28 يوماً (MPa)
  controlClass: "high" | "normal" | "low"; // درجة التحكم بالموقع لحساب الانحراف المعياري (Margin)
  cementType: string;       // صنف الإسمنت (e.g., CEM I, CEM II)
  cementClassStrength: number; // المقاومة الاسمية للإسمنت (مثلاً 32.5، 42.5، 52.5)
  dMax: number;             // القطر الأقصى للركام D_max (mm) - مثلاً 20 مم
  slump: number;            // الهبوط المستهدف Slump (cm) قياساً بقمع Abrams
  aggregateType: AggregateType;
  aggregateQuality: AggregateQuality;
  hasPumping: boolean;      // هل سيتم ضخ الخرسانة بالروافع (تعديل طفيف للمنحنى)
  sandRelativeDensity: number; // الكثافة النوعية للرمل (مثلاً 2.65)
  gravelRelativeDensity: number; // الكثافة النوعية للحصى (مثلاً 2.68)
  cementDensity: number;     // الكثافة المطلقة للإسمنت (مثلاً 3100 كجم/م³)
  airContent: number;        // نسبة الهواء المحبوس (%)
  moistureSand: number;     // رطوبة الرمل (%، لتعديل ماء الخلط الفعلي)
  moistureGravel: number;   // رطوبة الحصى (%، لتعديل ماء الخلط الفعلي)
  sandAbsorption?: number;  // نسبة امتصاص الرمل للماء (%)
  gravelAbsorption?: number; // نسبة امتصاص الحصى للماء (%)
  finenessModulus?: number; // معيار النعومة للرمل
  admixtures: Admixture[];
  
  // Custom Admixtures Dosages (%) directly as shown in the video
  dosageSuper: number;       // نسبة الملدن الفائق (%)
  dosageAir: number;         // نسبة حابس الهواء (%)
  dosageRetarder: number;    // نسبة المؤخر (%)
  dosageAccelerator: number; // نسبة المسرع (%)

  // Mineral Admixtures (%)
  dosageSilicaFume: number;   // غبار السيليكا (%)
  dosageFlyAsh: number;       // الرماد المتطاير (%)
  dosageSlag: number;         // خبث الأفران (%)

  // Engineer Advanced settings
  selectedMethod: "dreux";
  exposureClass: string;      // فئة التعرض (X0, XC1, XC2, XD1, XS1, XF1, XA1)
  durabilityLevel: string;    // المتانة
  carbonationLevel: string;   // الكربنة
  chloridesLevel: string;     // الكلوريدات
  sulfatesLevel: string;      // الكبريتات

  // Algerian Cost Pricing (Dinar Algérien DA per kg)
  priceCement: number;
  priceSand: number;
  priceGravel: number;
  priceSuper: number;
  priceAir: number;
  priceRetarder: number;
  priceAccelerator: number;
  priceSilicaFume: number;
  priceFlyAsh: number;
  priceSlag: number;
  priceLabor: number;
  priceWater: number;
  costBasis?: "dry" | "wet";

  // Concrete type selection (Validation/Recommendation Layer)
  concreteType?: string; // e.g. "NSC", "HSC", "HPC", "SCC", "FRC", "LWC", "HWC", "RCC", "SHOTCRETE", "GPC", "SHC", "RAC", "PERVIOUS", "UHPC", "BFUP"

  // Preset labels
  sandType: string;
  gravelType: string;
  autoDensities: boolean;
  batchVolume?: number;      // Volume in m³
  areaM2?: number;           // Area in m²
  thicknessCm?: number;      // Thickness in cm
  volumeInputMode?: "volume" | "area";

  // Internal generic mathematical parameters
  internalUnitWeight?: number;   // Georges Dreux: الكثافة الجافة التقديرية للركام مرصوصاً بالاهتزاز (kg/m³)
  internalCoeffG?: number;       // Georges Dreux: معامل الركام الحبيبي المعتمد طبقاً للجداول (G)
  internalCurveCoeff?: number;   // Georges Dreux: معامل تصحيح منحنى تدرج الحصى
  internalSandRatio?: number;    // Georges Dreux: نسبة الرمل الأصلية المفترضة
  packingFactor?: number;        // Georges Dreux: معامل الرص الفعلي جاما (Compaction factor)
  internalWcOverride?: number;   // Georges Dreux: نسبة الماء إلى الإسمنت المعدلة مسبقاً

  // Unified Material ID selection keys (Single Source of Truth)
  selectedSandId?: string;
  selectedGravelId?: string;
  selectedCementId?: string;
  selectedAdmixtureId?: string;
  selectedScmId?: string;
  selectedWaterId?: string;
  selectedAdmixtureWaterReduction?: number;
  selectedAdmixtureDensity?: number;
  selectedAdmixtureName?: string;

  // Material Calculation Influence Layer properties
  selectedWaterName?: string;
  selectedWaterPH?: number;
  selectedWaterChlorideContent?: number;
  selectedWaterSulphateContent?: number;
  selectedWaterTemperature?: number;
  selectedLightweightAggregateId?: string;
  selectedLightweightAggregateName?: string;
  lightweightAggregateDensity?: number;
  lightweightAggregateAbsorption?: number;
  lightweightAggregateMoisture?: number;
  lightweightPorosityIndex?: number;
  selectedHeavyweightAggregateId?: string;
  selectedHeavyweightAggregateName?: string;
  heavyweightAggregateDensity?: number;
  heavyweightAggregateAbsorption?: number;
  heavyweightAggregateMoisture?: number;
  heavyweightType?: string;
  selectedFiberId?: string;
  selectedFiberName?: string;
  fiberType?: string;
  fiberDosageKgM3?: number;
  fiberDensity?: number;
  fiberLengthMm?: number;
  fiberDiameterMm?: number;
  fiberTensileStrengthMPa?: number;
  selectedAirContentMaterialId?: string;
  selectedAirContentMaterialName?: string;
  selectedAirPercentage?: number;
  selectedSpecialBinderId?: string;
  selectedSpecialBinderName?: string;
  specialBinderDensity?: number;
  specialBinderReplacementPercent?: number;
  specialBinderAlkalineRatio?: number;
  specialBinderStrengthClass?: string;
  selectedScmDensity?: number;
  selectedScmName?: string;
  selectedScmReplacementPercent?: number;
  selectedScmWaterDemandFactor?: number;
  selectedScmPozzolanicIndex?: number;
  priceFiber?: number;
  priceSpecialBinder?: number;
  materialsDatabase?: EngineeringMaterial[];
  labOverrides?: Record<string, LabOverride>;

  // Granular Engineering Center Integration Data Flow Fields
  isGranularOptimizedApproved?: boolean;
  granularApprovedAt?: string;
  approvedRatios?: Record<string, number>;
  approvedSandPercent?: number;
  approvedGravelPercent?: number;
  approvedFinenessModulus?: number;
  approvedVoidRatio?: number;
  approvedCompactionIndex?: number;
  approvedPackingDensity?: number;
  approvedBulkDensity?: number;
  approvedSsdDensity?: number;
  approvedRmse?: number;
  approvedGradingCurve?: Array<{ size: number; passing: number }>;
  approvedGradingStatus?: string;
  approvedDmax?: number;
  approvedMoistureSand?: number;
  approvedMoistureGravel?: number;
  approvedSandAbsorption?: number;
  approvedGravelAbsorption?: number;
  approvedSandRelativeDensity?: number;
  approvedGravelRelativeDensity?: number;
  approvedAggregateType?: string;
  approvedAggregateQuality?: string;
  approvedRecommendations?: string[];
}

export interface LabOverride {
  overriddenProperty: string;
  overrideValue: number;
  reason: string;
  date: string;
  technician: string;
  originalMaterialValue: number;
}

export interface SievePoint {
  size: number;             // قطر المنخل بالـ مم (e.g., 0.08, 0.16, 0.315, 0.63, 1.25, 2.5, 5, 10, 16, 20, 31.5, 40)
  targetPassing: number;    // النسبة المئوية التقريبية المطلوبة للمار على منحنى درو (%)
}

export interface MixDesignResult {
  // Intermediate Calculations
  fcm28: number;            // المقاومة المتوسطة المستهدفة (MPa)
  stdDev: number;           // الانحراف المعياري المعتمد (MPa)
  wcRatio: number;          // نسبة الماء إلى الإسمنت الأصلية (W/C)
  wcRatioAdjusted: number;  // نسبة الماء إلى الإسمنت بعد تعديل الإضافات كيميائياً
  dreuxAggregateFactor: number; // معامل الركام دروكس G
  compactorGamma: number;    // معامل رص الخرسانة (Compacted density factor gamma)
  
  // Custom side variables for mathematical parameters list
  waterBeforeCorrection: number; // ماء قبل التصحيح
  waterAfterDmax: number;        // ماء بعد تصحيح Dmax
  waterFromAdmixtures: number;   // ماء من الإضافات
  totalAggregateVolume: number;  // حجم الركام الكلي
  
  // Mix Proportions per 1 m³ (Dry state)
  cementWeight: number;     // وزن الإسمنت (kg)
  waterContentNeeded: number; // كمية الماء النظرية الصافية (Liters)
  waterContentActual: number; // كمية الماء الفعلية بعد خصم نسبة تخفيض الإضافات ورطوبة الركام (Liters)
  
  // Aggregates percentages
  sandPercent: number;      // نسبة الرمل من حجم الحبيبات المار (%)
  gravelPercent: number;    // نسبة الحصى من حجم الحبيبات المار (%)
  
  // Dry weights in kg
  sandWeightDry: number;    // وزن الرمل الجاف (kg)
  gravelWeightDry: number;  // وزن الحصى الجاف (kg)
  
  // Admixtures calculated weight
  admixtureWeights: {
    admixtureId: string;
    name: string;
    weight: number;         // الوزن بالكيلوغرام (kg) لكل م³
  }[];

  // Wet state adjusted weights (Corrected for aggregate moisture!)
  // In engineering, we adjust the actual scale weight on site due to moisture
  sandWeightWet: number;    // وزن الرمل الرطب الفعلي للموقع (kg)
  gravelWeightWet: number;  // وزن الحصى الرطب الفعلي للموقع (kg)
  waterWeightWet: number;   // ماء الخلط المضاف فعلياً بالخلاطة بعد حساب رطوبة الركامات الممتصة (kg)
  
  // Additional moisture calculations requested by user
  sandTotalMoistureWater?: number;
  gravelTotalMoistureWater?: number;
  totalAggregateMoistureWater?: number;

  sandAbsorptionWater?: number;
  gravelAbsorptionWater?: number;
  totalAbsorptionWater?: number;

  sandFreeSurfaceWater?: number;
  gravelFreeSurfaceWater?: number;
  totalFreeSurfaceWater?: number;

  waterToAdd?: number;
  sandAbsorptionDeficit?: number;
  gravelAbsorptionDeficit?: number;
  totalAbsorptionDeficit?: number;

  sandMoistureWater?: number;
  gravelMoistureWater?: number;
  
  designWater?: number;
  effectiveWater?: number;
  aggregateFreeWater?: number;
  batchWaterToAdd?: number;
  costBasis?: "dry" | "wet";
  costBreakdown?: any[];
  totalCost?: number;
  notes?: string[];

  // Totals
  totalFreshDensity: number; // الكثافة الرطبة التقريبية للخرسانة الطازجة (kg/m³)
  
  // Dreux-Gorisse Grading Curve pivot coordinate
  pivotPoint: {
    x: number; // D_max / 2 (or 5mm)
    y: number; // passing percentage Y
  };
  
  // Generated target points for drawing
  gradingCurve: SievePoint[];

  // Validation and potential engineering issues
  isValid?: boolean;
  valid?: boolean;
  errors?: string[];
  warnings?: string[];

  // Summary results for the Dreux formulation
  mixQuantitySummary?: {
    methodId: string;
    methodName: string;
    cement: number;
    water: number;
    sand: number;
    gravel: number;
    wcRatio: number;
    cost: number;
  }[];

  // Detailed step logs line-by-line
  detailedSteps?: string[];

  // Strength age evolution
  strengthEvolution?: {
    age: number;
    strength: number;
  }[];

  // Standards compliance checks
  standardsCompliance?: {
    standardName: string;
    status: "compliant" | "warning" | "non_compliant";
    parameter: string;
    requirement: string;
    actual: string;
    note: string;
  }[];

  absoluteVolumeCheck?: {
    isValid: boolean;
    totalAbsVolumeL: number;
    cementVolL: number;
    waterVolL: number;
    sandVolL: number;
    gravelVolL: number;
    airVolL: number;
    admixtureVolL: number;
    deviationPercent: number;
  };

  flyAshKg?: number;
  slagKg?: number;
  silicaFumeKg?: number;
  totalBinder?: number;
  activeCementWeight?: number;
  compliance?: {
    isCompliant: boolean;
    checks: {
      parameter: string;
      requirement: string;
      actual: string;
      status: "compliant" | "warning" | "non_compliant";
    }[];
  };
  methodApplicability?: MethodApplicability;
  recommendations?: string[];
  theoreticalCementDemand?: number;
  actualCementUsed?: number;
  cementLimitExceeded?: boolean;
  waterDemand?: number;
  waterCementRatio?: number;
  absoluteVolumeTotal?: number;
  volumeClosureError?: number;
  calculationNotes?: string[];
  validationSummary?: string;
  materialSuitability?: MaterialSuitability;
}

export interface MaterialSuitability {
  status: "approved" | "warning" | "blocked" | "diagnostic_only";
  missingMaterials: string[];
  invalidMaterials: string[];
  incompatibleMaterials: string[];
  warnings: string[];
  recommendations: string[];
  reason?: string;
}

export interface MethodApplicability {
  applicable: boolean;
  level: "applicable" | "limited" | "not_applicable";
  reasons: string[];
  recommendations: string[];
}

export interface EngineeringMaterial {
  id: string; // Material ID
  name: string; // Material Name Arabic
  englishName: string; // Material Name English
  type: string; // Base type
  category: string; // Unified structural category
  density?: number; // K-density kg/m³
  ssdDensity?: number; // kg/m³ (SSD Density)
  absorption?: number; // % water absorption
  moisture?: number; // % moisture content
  finenessModulus?: number; // fineness modulus (sands)
  dMax?: number; // max aggregate size (mm)
  quality: string; // Quality Rating/Technical Standard Status
  uses: string; // Applications
  desc: string; // Description text
  rating: number; // 1 to 5 stars rating
  provenance: string; // Region/quarry in Algeria
  image: string; // Image URL (can be blank or placeholder)
  wilaya?: string; // Wilaya index in Algeria
  source?: string; // Source Owner
  notes?: string; 
  price?: number; // Price per kg or ton
  engineeringData?: any; // Nested engineering data properties
  extraProperties?: Record<string, any>; // Extra unknown columns preserved from import
  ownerId?: string; // Owner UID for Firestore partition
  materialType?: string; // e.g., 'مادة رابطة' | 'ركام' | 'إضافات معدنية' | 'ألياف' | 'إضافات كيميائية' | 'ماء' | 'أخرى'

  // --- SOURCE OF TRUTH & PROVENANCE METADATA ---
  isDemo?: boolean; // True if this material is a system/demo preset and not created by the active user
  sourceType?: "system_demo" | "user_created" | "imported" | "lab_result";
  sourceLabel?: string; // "Demo Data" | "User Material" | "Imported" | "Laboratory Verified"
  region?: string; // Region / Wilaya string
  sourceQuarry?: string; // Source Quarry/Owner
  status: "نشط" | "موقوف" | "قيد المراجعة"; // Dynamic Status
  createdBy?: string; // Creator Username/Standard
  createdDate?: string; // Standard created timestamp
  updatedDate?: string; // Standard updated timestamp
  updatedAt?: number; // High-precision numeric update timestamp

  // --- AGGREGATES TECHNICAL PROPERTIES (الرمال والحصى) ---
  specificGravity?: number; // specific gravity (relative density)
  particleShape?: "مستدير" | "مكسر" | "زاوي" | "غير منتظم"; // Particle shape
  aggregateQuality?: "excellent" | "standard" | "poor" | string; // Grading Quality
  clayContent?: number; // clay content (%)
  organicContent?: "سليم" | "مقبول" | "مرتفع" | string; // Organic content index
  losAngelesAbrasion?: number; // Los Angeles abrasion loss (%)
  gradationData?: { sieve: number; passing: number }[]; // Sieve analysis array

  // --- CEMENT TECHNICAL PROPERTIES (الإسمنت) ---
  cementClass?: string; // e.g., CEM I, CEM II
  strengthClass?: "32.5" | "42.5" | "52.5" | string; // Strength rating
  hydrationClass?: "سريع" | "عادي" | "منخفض الحرارة" | string; // Hydration category
  heatOfHydration?: number; // Heat of hydration (J/g)

  // --- ADMIXTURES TECHNICAL PROPERTIES (المضافات الكيماوية والمعدنية) ---
  admixtureType?: "superplasticizer" | "retarder" | "accelerator" | "air_entraining" | "silica_fume" | "fly_ash" | "slag" | "custom" | string;
  recommendedDosage?: number; // recommended dosage (% of cement weight)
  waterReduction?: number; // reduction capabilities (%)
  settingModification?: "تسريع" | "تأخير" | "تعديل المسامات" | "لا يوجد"; // setting effect
  settingTimeImpact?: number; // Setting time impact in minutes (+ for delay, - for acceleration)
  compatibilityNotes?: string; // Compatibility warning

  // ==========================================
  // UNIFIED EMMS MODEL PROPERTIES (UPGRADE)
  // ==========================================
  MaterialID?: string;
  MaterialCode?: string;
  ArabicName?: string;
  EnglishName?: string;
  Category?: "SAND" | "GRAVEL" | "CEMENT" | "ADMIXTURE" | "SCM" | "WATER";
  SubCategory?: string;
  Region?: string;
  Source?: string;
  Supplier?: string;
  Status?: "Draft" | "Pending Review" | "Approved" | "Archived";
  
  Density?: number;
  SpecificGravity?: number;
  Absorption?: number;
  MoistureContent?: number;

  FinenessModulus?: number;
  SandEquivalent?: number;
  LosAngeles?: number;
  MethyleneBlue?: number;

  Chlorides?: number;
  Sulfates?: number;
  OrganicImpurities?: string;

  RecommendedUse?: string;
  EngineeringNotes?: string;
  Description?: string;
  ConcreteClasses?: string;
  Warnings?: string;

  CreatedAt?: string;
  UpdatedAt?: string;
  CreatedBy?: string;
  ApprovalStatus?: "Draft" | "Under Review" | "Pending Review" | "Approved" | "Archived" | "Rejected" | "Validated" | "Incomplete" | "Not Verified";

  // --- EXTENDED EMMS LABORATORY PROFILE FIELDS ---
  version?: number;
  quarryName?: string;
  supplierName?: string;
  supplierContact?: string;
  certificationStatus?: string;
  
  // --- EXPANDED EMMS LIFECYCLE MANAGEMENT PROFILE ---
  laboratory?: string;
  standard?: string;
  certificationNumber?: string;
  approvalDate?: string;
  
  // Coarse Aggregate indices
  flakinessIndex?: number; // %
  elongationIndex?: number; // %
  crushingValue?: number; // %
  
  // Cement properties
  initialSetting?: number; // minutes
  finalSetting?: number; // minutes
  blaineFineness?: number; // cm²/g
  strength2d?: number; // MPa
  strength28d?: number; // MPa
  
  // Admixture properties
  solidContent?: number; // %
  chlorideContent?: number; // %
  
  // New Intelligent Import / EMMS properties
  bulkDensity?: number;
  pozzolanicIndex?: number;
  waterDemandFactor?: number;
  pH?: number;
  chlorides?: number;
  sulfates?: number;
  fiberType?: string;
  fiberLength?: number;
  aspectRatio?: number;
  tensileStrength?: number;

  // Compatibility & Audit trace
  compatibilityMatrix?: { targetMaterialId: string; status: "compatible" | "warning" | "incompatible"; note: string }[];
  lifecycleHistory?: { date: string; version: number; author: string; changes: string; approvalStatus: string }[];

  // --- UNIFIED LABORATORY INTEGRATION & SINGLE SOURCE OF TRUTH ---
  propertySources?: Record<string, any>; // maps propertyKey -> MaterialPropertySource
  propertyHistory?: Record<string, any[]>; // maps propertyKey -> MaterialPropertyHistoryEntry[]
  laboratoryTests?: string[]; // IDs of laboratory tests linked to this material
  sieveAnalysisDetail?: any; // GranulometricCurveData
  foisonnement?: number; // % foisonnement (bulking factor)
  microDeval?: number; // % MDE coefficient
  methyleneBlue?: number; // MB value (g/kg)
}

export interface MixVersion {
  id: string;
  name: string;
  date: string;
  inputs: MixDesignInput;
  results: MixDesignResult;
  isOptimized?: boolean;
  materialSnapshots?: Record<string, EngineeringMaterial>;
  projectId?: string;
  mixId?: string;
  materialIds?: string[];
  calculationVersion?: string | number;
  auditTrail?: {
    createdBy?: string;
    createdAt?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: string;
    revisionHistory?: string[];
  };
}

export interface LabValidationInputs {
  slump: number;             // mm (lab slump)
  slumpFlow: number;         // mm
  freshDensity: number;      // kg/m³
  airContent: number;        // %
  concreteTemp: number;      // °C
  unitWeight?: number;       // kg/m³
  settingTimeInitial?: number; // mins
  settingTimeFinal?: number;   // mins

  // Hardened Strength Tests (MPa)
  strength1d: number;
  strength3d: number;
  strength7d: number;
  strength14d?: number;
  strength28d: number;
  strength56d: number;
  strength90d: number;

  // Specimens for statistical analysis
  specimens1d?: number[];
  specimens3d?: number[];
  specimens7d?: number[];
  specimens14d?: number[];
  specimens28d?: number[];
  specimens56d?: number[];
  specimens90d?: number[];

  // Durability Tests
  waterAbsorption: number;  // %
  permeabilityIndex: number; // e.g., mm depth or customized rating numerical value
  chloridePenetration: string; // "Low" | "Medium" | "High"
  sulfateResistanceRating: string; // "High" | "Moderate" | "Low"
  sorptivity?: number;       // mm/min^0.5
  rcptCoulombs?: number;     // Coulombs
  freezeThawRating?: number;  // Durability Factor %
  carbonationDepth?: number; // mm

  // NDT (Non Destructive Testing)
  schmidtHammer: number;    // Rebound number
  upvSpeed: number;         // m/s
  coreTestResult: number;   // MPa
  reboundNumber?: number;   // Rebound number
}

export interface LabValidationRecord {
  id: string;
  name: string;
  date: string; // casting date (تاريخ الصب)
  testingDate?: string; // testing date (تاريخ الفحص)
  supervisor?: string; // المشرف
  location?: string; // الموقع
  inputsSnapshot: MixDesignInput;
  resultsSnapshot: MixDesignResult;
  labInputs: LabValidationInputs;
  validationScore: number | null;   // null for N/A when waiting for data
  rating: "Excellent" | "Very Good" | "Acceptable" | "Needs Review" | "Needs Investigation" | "Failed" | "N/A";
  status: "PASSED" | "WARNING" | "FAILED" | "WAITING" | "PARTIAL";
  engineeringComments: string[];
  engineerNotes?: string;
  materialSnapshots?: Record<string, EngineeringMaterial>;
  createdAt: string; // formatted date or iso string
}

export interface ActiveProject {
  id: string;
  name: string;
  client: string;
  plant: string;
  createdDate: string;
  archived?: boolean; // archived flag for Phase 1
  inputs: MixDesignInput;
  results?: MixDesignResult;
  materialsCatalog?: EngineeringMaterial[]; // dynamic materials catalog for Phase 2/3
  mixVersions?: MixVersion[]; // mix version history for Phase 6
  versions?: MixVersion[]; // frozen engineering snapshots list for True Immutable Project History
  optimizationResults?: any;
  predictionResults?: any;
  costAnalysis?: any;
  generatedReports?: any[];
  aiHistory?: any[];
  materialSnapshots?: Record<string, EngineeringMaterial>;
  validationRecords?: LabValidationRecord[]; // Section 5 & 6 feedback learning database
  projectId?: string;
  mixId?: string;
  materialIds?: string[];
  calculationVersion?: string | number;
  auditTrail?: {
    createdBy?: string;
    createdAt?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: string;
    revisionHistory?: string[];
  };
}
