import React, { useState, useMemo } from "react";
import { 
  X, 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  FileText, 
  Sparkles,
  Layers,
  Activity,
  BarChart3,
  Calendar,
  User,
  Building2,
  Bookmark,
  Search,
  Check
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import { EngineeringMaterial } from "../../types";
import { 
  LabCategory, 
  LabTestDefinition, 
  MaterialTestRecord, 
  TestStatus 
} from "../../types/laboratoryTypes";
import { 
  MASTER_TEST_CATALOG, 
  LAB_CATEGORIES_INFO, 
  executeLaboratoryTest, 
  TestExecutionResult 
} from "../../services/materialsLabEngine";
import { runSieveAnalysisPhase2 } from "../../services/laboratoryTestDefinitions";
import { createSieveMaterialUpdateProposals, createSpecificGravityMaterialUpdateProposals, createBulkDensityMaterialUpdateProposals, createMoistureMaterialUpdateProposals, createSandEquivalentMaterialUpdateProposals, createSandBulkingMaterialUpdateProposals, createLosAngelesMaterialUpdateProposals, createMicroDevalMaterialUpdateProposals, createFlakinessMaterialUpdateProposals, createMethyleneBlueMaterialUpdateProposals, createCementSpecificGravityMaterialUpdateProposals, createBlaineMaterialUpdateProposals, createCementSettingTimeMaterialUpdateProposals, createCementSoundnessMaterialUpdateProposals, createCementMortarStrengthMaterialUpdateProposals, createCementNormalConsistencyMaterialUpdateProposals } from "../../services/laboratoryMaterialUpdateProposals";
import { runAggregateSpecificGravityPhase2, runAggregateBulkDensityPhase2, runAggregateMoisturePhase2, runSandEquivalentPhase2, runSandBulkingPhase2, runLosAngelesPhase2, runMicroDevalPhase2, runFlakinessPhase2, runMethyleneBluePhase2, runCementSpecificGravityPhase2, runBlaineFinenessPhase2, runCementSettingTimePhase2, runCementSoundnessPhase2, runCementMortarStrengthPhase2, runCementNormalConsistencyPhase2 } from "../../services/laboratoryTestDefinitions";
import { getCompatibleMaterials, validateTestMaterialCompatibility, compatibilityMessage } from "../../services/laboratoryMaterialCompatibility";
import { createBlankLaboratoryInputs, getLaboratoryFieldLabel, getLaboratoryFieldUnit, localizeLaboratoryIssue, validateLaboratoryInputs } from "../../services/laboratoryInputValidation";

interface NewTestWizardProps {
  isOpen: boolean;
  onClose: () => void;
  materials: EngineeringMaterial[];
  initialCategory?: LabCategory;
  initialTestId?: string;
  initialMaterialId?: string;
  initialDraft?: MaterialTestRecord | null;
  existingTestRecords?: MaterialTestRecord[];
  onNavigateToMaterialsLibrary?: () => void;
  onSaveTest: (testRecord: MaterialTestRecord, syncedProps: Record<string, any>) => void;
  language?: "ar" | "fr" | "en";
}

const labText = (language: "ar" | "fr" | "en", ar: string, fr: string, en: string) =>
  language === "ar" ? ar : language === "fr" ? fr : en;

const isBlockedOrFailed = (status: TestStatus) => status === "FAIL" || status === "BLOCKED";

function blankFromExample(value: any): any {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, blankFromExample(nested)]));
  if (typeof value === "number") return undefined;
  return value;
}

export const NewTestWizard: React.FC<NewTestWizardProps> = ({
  isOpen,
  onClose,
  materials,
  initialCategory = "aggregates",
  initialTestId,
  initialMaterialId,
  initialDraft,
  existingTestRecords = [],
  onNavigateToMaterialsLibrary,
  onSaveTest,
  language = "ar"
}: NewTestWizardProps) => {
  // Wizard State
  const initialTest = initialDraft?.testType || initialTestId || "AGG_SIEVE";
  const [hasRun, setHasRun] = useState(false);
  const [wizardStep, setWizardStep] = useState(initialDraft ? (initialDraft.sampleId?.trim() && initialDraft.sampleDate && initialDraft.sampleSource?.trim() && initialDraft.operator?.trim() ? 2 : 1) : 0);
  const [runAttempted, setRunAttempted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LabCategory | "all">(initialDraft?.category || initialCategory);
  const [selectedTestDefId, setSelectedTestDefId] = useState<string>(initialTest);
  const [selectedMaterialId, setSelectedMaterialIdRaw] = useState<string>(initialDraft?.materialId || initialMaterialId || getCompatibleMaterials(initialTest, materials)[0]?.id || "");
  const setSelectedMaterialId = (value: string) => {
    setHasRun(false);
    setSelectedMaterialIdRaw(value);
  };
  const [matSearchQuery, setMatSearchQuery] = useState<string>("");
  const [matCategoryFilter, setMatCategoryFilter] = useState<string>("all");
  const [testSearchQuery, setTestSearchQuery] = useState<string>("");
  
  // Test Metadata
  const [sampleId, setSampleId] = useState<string>(initialDraft?.sampleId || "");
  const [sampleDate, setSampleDate] = useState<string>(initialDraft?.sampleDate || "");
  const [sampleSource, setSampleSource] = useState<string>(initialDraft?.sampleSource || "");
  const [sampleDuplicateConfirmed, setSampleDuplicateConfirmed] = useState(false);
  const [operator, setOperator] = useState<string>(initialDraft?.operator || "");
  const [labName, setLabName] = useState<string>(initialDraft?.laboratoryName || "");
  const [testDate, setTestDate] = useState<string>(initialDraft?.date || new Date().toISOString().split("T")[0]);
  const [sampleDescription, setSampleDescription] = useState<string>(initialDraft?.sampleDescription || "");
  const [notes, setNotes] = useState<string>(initialDraft?.notes || "");

  // Test Definition
  const currentTestDef = useMemo(() => {
    return MASTER_TEST_CATALOG.find(t => t.id === selectedTestDefId) || MASTER_TEST_CATALOG[0];
  }, [selectedTestDefId]);

  // Selected Material (Any material from the library)
  const currentMaterial = useMemo(() => materials.find(m => m.id === selectedMaterialId), [materials, selectedMaterialId]);
  const compatibility = useMemo(
    () => currentMaterial
      ? validateTestMaterialCompatibility(selectedTestDefId, currentMaterial)
      : { compatible: false, testId: selectedTestDefId, materialId: "", missingProperties: [], reason: "Select a material that is compatible with this test." },
    [selectedTestDefId, currentMaterial]
  );

  // Inputs State
  const [inputsState, setInputsStateRaw] = useState<Record<string, any>>(() => ({ ...createBlankLaboratoryInputs(currentTestDef), ...(initialDraft?.inputs || {}) }));
  const setInputsState: React.Dispatch<React.SetStateAction<Record<string, any>>> = (next) => {
    setHasRun(false);
    setInputsStateRaw(next);
  };
  const inputIssues = useMemo(
    () => validateLaboratoryInputs(selectedTestDefId, currentTestDef, inputsState),
    [selectedTestDefId, currentTestDef, inputsState]
  );
  const duplicateSampleExists = Boolean(sampleId.trim() && existingTestRecords.some(record => record.id !== initialDraft?.id && record.sampleId.trim().toLowerCase() === sampleId.trim().toLowerCase()));
  const sampleDateValid = Boolean(sampleDate && !Number.isNaN(Date.parse(sampleDate)) && sampleDate <= testDate && sampleDate <= new Date().toISOString().slice(0, 10));
  const testDateValid = Boolean(testDate && !Number.isNaN(Date.parse(testDate)) && testDate <= new Date().toISOString().slice(0, 10));

  const getSampleIssues = () => {
    const issues: string[] = [];
    if (!sampleId.trim()) issues.push(language === "ar" ? "رقم العينة مطلوب." : language === "fr" ? "Le numéro d'échantillon est requis." : "Sample ID is required.");
    if (!sampleDateValid) issues.push(language === "ar" ? "أدخل تاريخ أخذ عينة صحيحًا لا يتجاوز تاريخ الاختبار أو تاريخ اليوم." : language === "fr" ? "Saisissez une date de prélèvement valide antérieure à l'essai et à aujourd'hui." : "Enter a valid sample date no later than the test date or today.");
    if (!testDateValid) issues.push(language === "ar" ? "تاريخ الاختبار غير صحيح أو يقع في المستقبل." : language === "fr" ? "La date d'essai est invalide ou future." : "Test date is invalid or in the future.");
    if (!sampleSource.trim()) issues.push(language === "ar" ? "مصدر العينة مطلوب." : language === "fr" ? "La source de l'échantillon est requise." : "Sample source is required.");
    if (!operator.trim()) issues.push(language === "ar" ? "اسم المختبر أو الفني مطلوب." : language === "fr" ? "Le nom du laboratoire ou du technicien est requis." : "Laboratory or technician name is required.");
    if (duplicateSampleExists && !sampleDuplicateConfirmed) issues.push(language === "ar" ? "رقم العينة مستخدم سابقًا؛ أكّد صراحةً إعادة الاستخدام للمتابعة." : language === "fr" ? "Ce numéro existe déjà ; confirmez explicitement sa réutilisation." : "This sample ID already exists; explicitly confirm reuse to continue.");
    return issues;
  };

  const advanceWizard = () => {
    if (wizardStep === 0) {
      if (!currentMaterial || !compatibility.compatible) return;
      setWizardStep(1);
      return;
    }
    if (wizardStep === 1) {
      const sampleIssues = getSampleIssues();
      if (sampleIssues.length) return;
      setWizardStep(2);
      return;
    }
    if (wizardStep === 2) {
      if (getSampleIssues().length > 0) {
        setWizardStep(1);
        return;
      }
      setRunAttempted(true);
      if (!currentMaterial || !compatibility.compatible || inputIssues.length) return;
      setHasRun(true);
      setWizardStep(3);
    }
  };

  // When test definition changes, reset inputs
  const handleSelectTest = (testDef: LabTestDefinition) => {
    setSelectedTestDefId(testDef.id);
    setSelectedCategory(testDef.category);
    setInputsState(createBlankLaboratoryInputs(testDef));
    setHasRun(false);
    setRunAttempted(false);
    setWizardStep(0);
    const compatible = getCompatibleMaterials(testDef.id, materials);
    setSelectedMaterialId(compatible.find(material => material.id === selectedMaterialId)?.id || compatible[0]?.id || "");
  };

  // Filter tests by category and search
  const filteredTests = useMemo(() => {
    return MASTER_TEST_CATALOG.filter(t => {
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
      if (testSearchQuery.trim()) {
        const q = testSearchQuery.toLowerCase();
        const matchAr = t.titleAr.toLowerCase().includes(q);
        const matchEn = t.titleEn.toLowerCase().includes(q);
        const matchStd = t.standard.toLowerCase().includes(q);
        if (!matchAr && !matchEn && !matchStd) return false;
      }
      return true;
    });
  }, [selectedCategory, testSearchQuery]);

  // Filter materials for picker
  const filteredMaterials = useMemo(() => {
    return getCompatibleMaterials(selectedTestDefId, materials).filter(m => {
      if (matCategoryFilter !== "all" && m.category !== matCategoryFilter) return false;
      if (matSearchQuery.trim()) {
        const q = matSearchQuery.toLowerCase();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchCat = m.category?.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [materials, selectedTestDefId, matCategoryFilter, matSearchQuery]);

  const sievePhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_SIEVE") return null;
    return runSieveAnalysisPhase2({
      totalSampleMassG: Number(inputsState.totalWeight),
      finesSieveMm: 0.063,
      massBalanceToleranceG: Number(inputsState.massBalanceToleranceG ?? 1),
      sieves: (inputsState.sieves || []).map((row: { sieve: number; retained: number }) => ({
        sieveMm: Number(row.sieve),
        retainedMassG: Number(row.retained)
      }))
    });
  }, [selectedTestDefId, inputsState, hasRun]);

  const specificGravityPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_SPECIFIC_GRAVITY") return null;
    try {
      return runAggregateSpecificGravityPhase2({
        ovenDryMassG: Number(inputsState.ovenDryMassG),
        ssdMassG: Number(inputsState.ssdMassG),
        pycnometerSampleWaterMassG: Number(inputsState.pycnometerSampleWaterMassG),
        pycnometerWaterMassG: Number(inputsState.pycnometerWaterMassG)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const bulkDensityPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_BULK_DENSITY") return null;
    try {
      return runAggregateBulkDensityPhase2({
        containerVolumeLiters: Number(inputsState.containerVolumeLiters),
        containerEmptyWeightKg: Number(inputsState.containerEmptyWeightKg),
        looseFilledWeightKg: Number(inputsState.looseFilledWeightKg),
        compactedWeightKg: Number(inputsState.compactedWeightKg)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const moisturePhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_MOISTURE_CONTENT") return null;
    try {
      return runAggregateMoisturePhase2({
        wetMassG: Number(inputsState.wetMassG),
        dryMassG: Number(inputsState.dryMassG),
        tareMassG: Number(inputsState.tareMassG),
        absorptionPercent: inputsState.absorptionPercent === undefined ? undefined : Number(inputsState.absorptionPercent),
        designAggregateDryMassKg: inputsState.designAggregateDryMassKg === undefined ? undefined : Number(inputsState.designAggregateDryMassKg),
        designWaterKg: inputsState.designWaterKg === undefined ? undefined : Number(inputsState.designWaterKg)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const sandEquivalentPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_SAND_EQUIVALENT") return null;
    try {
      return runSandEquivalentPhase2({
        totalHeightMm: Number(inputsState.h1TotalHeightMm),
        sandHeightMm: Number(inputsState.h2SandHeightMm),
        method: inputsState.testMethod === "visual" ? "visual" : "piston"
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const sandBulkingPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_BULKING_SAND") return null;
    try {
      return runSandBulkingPhase2({
        dryVolumeCm3: Number(inputsState.dryVolumeCm3),
        moistureSteps: Array.isArray(inputsState.moistureSteps)
          ? inputsState.moistureSteps.map((step: { moisturePercent: number; volumeCm3: number }) => ({
              moisturePercent: Number(step.moisturePercent),
              volumeCm3: Number(step.volumeCm3)
            }))
          : []
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const losAngelesPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_LOS_ANGELES") return null;
    try {
      return runLosAngelesPhase2({
        initialMassG: Number(inputsState.initialMassG),
        retainedMassOn1_6mmG: Number(inputsState.retainedMassOn1_6mmG),
        finesMassG: inputsState.finesMassG === undefined ? undefined : Number(inputsState.finesMassG),
        massBalanceToleranceG: inputsState.massBalanceToleranceG === undefined ? undefined : Number(inputsState.massBalanceToleranceG)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const microDevalPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_MICRO_DEVAL") return null;
    try {
      return runMicroDevalPhase2({
        initialMassG: Number(inputsState.initialMassG),
        retainedMassOn1_6mmG: Number(inputsState.retainedMassOn1_6mmG),
        waterVolumeMl: Number(inputsState.waterVolumeMl),
        gradingFraction: inputsState.gradingFraction === undefined ? undefined : String(inputsState.gradingFraction),
        abrasiveChargeG: inputsState.abrasiveChargeG === undefined ? undefined : Number(inputsState.abrasiveChargeG)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const flakinessPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_SHAPE_FLAKINESS") return null;
    try {
      return runFlakinessPhase2({
        totalSampleMassG: Number(inputsState.totalSampleMassG),
        passingBarSievesMassG: Number(inputsState.passingBarSievesMassG),
        fractions: Array.isArray(inputsState.fractions)
          ? inputsState.fractions.map((fraction: { sizeRange: string; totalMassG: number; passingMassG: number }) => ({
              sizeRange: String(fraction.sizeRange),
              totalMassG: Number(fraction.totalMassG),
              passingMassG: Number(fraction.passingMassG)
            }))
          : undefined,
        massBalanceToleranceG: inputsState.massBalanceToleranceG === undefined ? undefined : Number(inputsState.massBalanceToleranceG)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const methyleneBluePhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "AGG_METHYLENE_BLUE") return null;
    try {
      return runMethyleneBluePhase2({
        fraction0_2MassG: Number(inputsState.fraction0_2MassG),
        dyeSolutionInjectedMl: Number(inputsState.dyeSolutionInjectedMl),
        dyeConcentrationGPerL: Number(inputsState.dyeConcentrationGPerL),
        endpointConfirmed: inputsState.endpointConfirmed === undefined ? undefined : Boolean(inputsState.endpointConfirmed)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const cementSpecificGravityPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "CEM_SPECIFIC_GRAVITY") return null;
    try {
      return runCementSpecificGravityPhase2({
        cementMassG: Number(inputsState.cementMassG),
        initialVolumeMl: Number(inputsState.initialVolumeMl),
        finalVolumeMl: Number(inputsState.finalVolumeMl)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const blainePhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "CEM_FINENESS_BLAINE") return null;
    try {
      return runBlaineFinenessPhase2({
        airFlowTimeSeconds: Number(inputsState.airFlowTimeSeconds),
        apparatusConstantK: Number(inputsState.apparatusConstantK),
        bedPorosityE: Number(inputsState.bedPorosityE),
        cementDensityGPerCm3: Number(inputsState.cementDensityGPerCm3),
        airViscosityMicroPaS: Number(inputsState.airViscosityMicroPaS),
        airTemperatureC: inputsState.airTemperatureC === undefined ? undefined : Number(inputsState.airTemperatureC)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const cementSettingTimePhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "CEM_SETTING_TIME") return null;
    try {
      return runCementSettingTimePhase2({
        waterPercent: Number(inputsState.waterPercent),
        roomTempC: Number(inputsState.roomTempC),
        humidityPercent: Number(inputsState.humidityPercent),
        timeReadings: Array.isArray(inputsState.timeReadings)
          ? inputsState.timeReadings.map((reading: { timeMinutes: number; penetrationMm: number }) => ({ timeMinutes: Number(reading.timeMinutes), penetrationMm: Number(reading.penetrationMm) }))
          : [],
        initialSetThresholdMm: inputsState.initialSetThresholdMm === undefined ? undefined : Number(inputsState.initialSetThresholdMm),
        finalSetThresholdMm: inputsState.finalSetThresholdMm === undefined ? undefined : Number(inputsState.finalSetThresholdMm)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const cementSoundnessPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "CEM_SOUNDNESS") return null;
    try {
      return runCementSoundnessPhase2({
        pointerDistanceBeforeBoilingMm: Number(inputsState.pointerDistanceBeforeBoilingA),
        pointerDistanceAfterBoilingMm: Number(inputsState.pointerDistanceAfterBoilingB)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const cementMortarStrengthPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "CEM_COMPRESSIVE_STRENGTH") return null;
    try {
      const toNumbers = (value: unknown) => Array.isArray(value) ? value.map(Number) : [];
      return runCementMortarStrengthPhase2({
        strength2dPrismsKn: toNumbers(inputsState.strength2dPrismsKn),
        strength7dPrismsKn: toNumbers(inputsState.strength7dPrismsKn),
        strength28dPrismsKn: toNumbers(inputsState.strength28dPrismsKn),
        prismWidthMm: inputsState.prismWidthMm === undefined ? undefined : Number(inputsState.prismWidthMm),
        prismDepthMm: inputsState.prismDepthMm === undefined ? undefined : Number(inputsState.prismDepthMm)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  const cementNormalConsistencyPhase2Result = useMemo(() => {
    if (!hasRun || selectedTestDefId !== "CEM_NORMAL_CONSISTENCY") return null;
    try {
      return runCementNormalConsistencyPhase2({
        cementMassG: Number(inputsState.cementMassG),
        waterVolumeMl: Number(inputsState.waterVolumeMl),
        plungerPenetrationMm: Number(inputsState.plungerPenetrationMm)
      });
    } catch {
      return null;
    }
  }, [selectedTestDefId, inputsState, hasRun]);

  // Execute Calculation Real-time
  const calculationResult: TestExecutionResult = useMemo(() => {
    if (!hasRun || inputIssues.length > 0 || !currentMaterial || !compatibility.compatible) {
      return {
        results: {},
        status: "FAIL",
        score: 0,
        interpretation: language === "ar" ? "أكمل القياسات المطلوبة واختر مادة متوافقة ثم شغّل الاختبار لعرض نتيجة محسوبة." : language === "fr" ? "Complétez les mesures requises, choisissez un matériau compatible, puis lancez l'essai." : "Complete the required measurements, select a compatible material, then run the test to calculate a result.",
        complianceDetails: [],
        syncedProperties: {}
      };
    }
    const legacyResult = executeLaboratoryTest(selectedTestDefId, inputsState, currentMaterial);
    if (selectedTestDefId === "AGG_SIEVE" && !sievePhase2Result) return legacyResult;
    if (selectedTestDefId === "AGG_SIEVE" && !sievePhase2Result.validation.valid) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد تحليل التدرج قبل إصلاح أخطاء البيانات أو توازن الكتلة.",
        complianceDetails: sievePhase2Result.validation.issues.map(item => ({
          parameter: item.field || item.code,
          measured: "—",
          limit: "بيانات صالحة ومتوازنة",
          status: "FAIL" as TestStatus,
          note: item.message
        })),
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_SPECIFIC_GRAVITY" && !specificGravityPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد اختبار الكثافة النوعية قبل إصلاح كتل العينة والبيكنومتر.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_BULK_DENSITY" && !bulkDensityPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد الكثافة الظاهرية قبل إصلاح حجم الوعاء والأوزان الصافية.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_MOISTURE_CONTENT" && !moisturePhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد رطوبة الركام قبل إصلاح أوزان العينة والوعاء.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_SAND_EQUIVALENT" && !sandEquivalentPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد المكافئ الرملي قبل إصلاح ارتفاعات التعليق وطبقة الرمل.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_BULKING_SAND" && !sandBulkingPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد منحنى انتفاخ الرمل قبل إصلاح الحجم الجاف وتسلسل نقاط الرطوبة.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_LOS_ANGELES" && !losAngelesPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد اختبار Los Angeles قبل إصلاح الكتل المدخلة وتوازن الكتلة.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_MICRO_DEVAL" && !microDevalPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد Micro-Deval قبل إدخال حجم الماء والتحقق من كتل الاختبار.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_SHAPE_FLAKINESS" && !flakinessPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد مؤشر التسطح قبل التحقق من أوزان العينة والكسور الحبيبية.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "AGG_METHYLENE_BLUE" && !methyleneBluePhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد قيمة أزرق الميثيلين قبل التحقق من جرعة الصبغة وكتلة الجزء الناعم.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "CEM_SPECIFIC_GRAVITY" && !cementSpecificGravityPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد كثافة الإسمنت قبل التحقق من كتلة الإسمنت وقراءات لوشاتيليه.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "CEM_FINENESS_BLAINE" && !blainePhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد نعومة بلين قبل التحقق من ثابت الجهاز والمسامية وزمن النفاذية.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "CEM_SETTING_TIME" && !cementSettingTimePhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد زمن الشك قبل إدخال قراءات فيكات مرتبة وتحقيق عتبات الشك الابتدائي والنهائي.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "CEM_SOUNDNESS" && !cementSoundnessPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد ثبات الإسمنت قبل التحقق من قراءتي المؤشرين قبل الغليان وبعده.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "CEM_COMPRESSIVE_STRENGTH" && !cementMortarStrengthPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد مقاومة المونة قبل التحقق من قوى الكسر وأبعاد موشورات الاختبار.",
        syncedProperties: {}
      };
    }
    if (selectedTestDefId === "CEM_NORMAL_CONSISTENCY" && !cementNormalConsistencyPhase2Result) {
      return {
        ...legacyResult,
        status: "FAIL",
        score: 0,
        interpretation: "لا يمكن اعتماد القوام القياسي قبل التحقق من كتلة الإسمنت والماء وقراءة مسبار فيكات.",
        syncedProperties: {}
      };
    }
    return legacyResult;
  }, [hasRun, inputIssues, compatibility.compatible, language, selectedTestDefId, inputsState, currentMaterial, sievePhase2Result, specificGravityPhase2Result, bulkDensityPhase2Result, moisturePhase2Result, sandEquivalentPhase2Result, sandBulkingPhase2Result, losAngelesPhase2Result, microDevalPhase2Result, flakinessPhase2Result, methyleneBluePhase2Result, cementSpecificGravityPhase2Result, blainePhase2Result, cementSettingTimePhase2Result, cementSoundnessPhase2Result, cementMortarStrengthPhase2Result, cementNormalConsistencyPhase2Result]);

  if (!isOpen) return null;

  const handleSaveDraft = () => {
    const now = new Date().toISOString();
    const readyToRun = Boolean(currentMaterial && compatibility.compatible && getSampleIssues().length === 0 && inputIssues.length === 0);
    const draft: MaterialTestRecord = {
      id: initialDraft?.id || `DRAFT-${currentTestDef.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      testType: currentTestDef.id,
      testTitleAr: currentTestDef.titleAr,
      testTitleFr: currentTestDef.titleFr,
      testTitleEn: currentTestDef.titleEn,
      category: currentTestDef.category,
      materialId: currentMaterial?.id || "",
      materialName: currentMaterial?.name || "",
      materialCategory: currentMaterial?.category || "",
      sampleId: sampleId.trim(),
      sampleDate: sampleDate || undefined,
      sampleSource: sampleSource.trim() || undefined,
      sampleDescription: sampleDescription || undefined,
      operator: operator.trim(),
      laboratoryName: labName.trim(),
      date: testDate || new Date().toISOString().slice(0, 10),
      standard: currentTestDef.standard,
      inputs: JSON.parse(JSON.stringify(inputsState)),
      results: {},
      status: readyToRun ? "READY" : "DRAFT",
      approvalStatus: "Draft",
      score: 0,
      interpretation: readyToRun
        ? language === "ar" ? "المدخلات مكتملة وجاهزة للتشغيل؛ لم يتم تنفيذ الحساب بعد." : language === "fr" ? "Les données sont complètes et prêtes à être exécutées ; aucun calcul n'a encore été lancé." : "Inputs are complete and ready to run; calculation has not been executed yet."
        : language === "ar" ? "مسودة غير منفذة؛ لا توجد نتيجة محسوبة." : language === "fr" ? "Brouillon non exécuté ; aucun résultat calculé." : "Unrun draft; no calculated result.",
      complianceDetails: [],
      notes: notes || undefined,
      syncedToMaterial: false,
      syncedProperties: {},
      createdAt: initialDraft?.createdAt || now,
      updatedAt: now
    };
    onSaveTest(draft, {});
    onClose();
  };

  const handleSave = () => {
    if (!hasRun || inputIssues.length > 0 || getSampleIssues().length > 0 || !currentMaterial || !compatibility.compatible) return;
    const testRecordId = initialDraft?.id || `TEST-${currentTestDef.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;
    const updateProposals = isBlockedOrFailed(calculationResult.status) ? [] : selectedTestDefId === "AGG_SIEVE" && sievePhase2Result
      ? createSieveMaterialUpdateProposals({
          material: currentMaterial,
          testRunId: testRecordId,
          result: sievePhase2Result
        })
      : selectedTestDefId === "AGG_SPECIFIC_GRAVITY" && specificGravityPhase2Result
        ? createSpecificGravityMaterialUpdateProposals({
            material: currentMaterial,
            testRunId: testRecordId,
            result: specificGravityPhase2Result
          })
        : selectedTestDefId === "AGG_BULK_DENSITY" && bulkDensityPhase2Result
          ? createBulkDensityMaterialUpdateProposals({
              material: currentMaterial,
              testRunId: testRecordId,
              result: bulkDensityPhase2Result
            })
          : selectedTestDefId === "AGG_MOISTURE_CONTENT" && moisturePhase2Result
            ? createMoistureMaterialUpdateProposals({
                material: currentMaterial,
                testRunId: testRecordId,
                result: moisturePhase2Result
              })
            : selectedTestDefId === "AGG_SAND_EQUIVALENT" && sandEquivalentPhase2Result
              ? createSandEquivalentMaterialUpdateProposals({
                  material: currentMaterial,
                  testRunId: testRecordId,
                  result: sandEquivalentPhase2Result
                })
              : selectedTestDefId === "AGG_BULKING_SAND" && sandBulkingPhase2Result
                ? createSandBulkingMaterialUpdateProposals({
                    material: currentMaterial,
                    testRunId: testRecordId,
                    result: sandBulkingPhase2Result
                  })
                : selectedTestDefId === "AGG_LOS_ANGELES" && losAngelesPhase2Result
                  ? createLosAngelesMaterialUpdateProposals({
                      material: currentMaterial,
                      testRunId: testRecordId,
                      result: losAngelesPhase2Result
                    })
                  : selectedTestDefId === "AGG_MICRO_DEVAL" && microDevalPhase2Result
                    ? createMicroDevalMaterialUpdateProposals({
                        material: currentMaterial,
                        testRunId: testRecordId,
                        result: microDevalPhase2Result
                      })
                    : selectedTestDefId === "AGG_SHAPE_FLAKINESS" && flakinessPhase2Result
                      ? createFlakinessMaterialUpdateProposals({
                          material: currentMaterial,
                          testRunId: testRecordId,
                          result: flakinessPhase2Result
                        })
                      : selectedTestDefId === "AGG_METHYLENE_BLUE" && methyleneBluePhase2Result
                        ? createMethyleneBlueMaterialUpdateProposals({
                            material: currentMaterial,
                            testRunId: testRecordId,
                            result: methyleneBluePhase2Result
                          })
                        : selectedTestDefId === "CEM_SPECIFIC_GRAVITY" && cementSpecificGravityPhase2Result
                          ? createCementSpecificGravityMaterialUpdateProposals({
                              material: currentMaterial,
                              testRunId: testRecordId,
                              result: cementSpecificGravityPhase2Result
                            })
                          : selectedTestDefId === "CEM_FINENESS_BLAINE" && blainePhase2Result
                            ? createBlaineMaterialUpdateProposals({
                                material: currentMaterial,
                                testRunId: testRecordId,
                                result: blainePhase2Result
                              })
                            : selectedTestDefId === "CEM_SETTING_TIME" && cementSettingTimePhase2Result
                              ? createCementSettingTimeMaterialUpdateProposals({
                                  material: currentMaterial,
                                  testRunId: testRecordId,
                                  result: cementSettingTimePhase2Result
                                })
                              : selectedTestDefId === "CEM_SOUNDNESS" && cementSoundnessPhase2Result
                                ? createCementSoundnessMaterialUpdateProposals({
                                    material: currentMaterial,
                                    testRunId: testRecordId,
                                    result: cementSoundnessPhase2Result
                                  })
                                : selectedTestDefId === "CEM_COMPRESSIVE_STRENGTH" && cementMortarStrengthPhase2Result
                                  ? createCementMortarStrengthMaterialUpdateProposals({
                                      material: currentMaterial,
                                      testRunId: testRecordId,
                                      result: cementMortarStrengthPhase2Result
                                    })
                                  : selectedTestDefId === "CEM_NORMAL_CONSISTENCY" && cementNormalConsistencyPhase2Result
                                    ? createCementNormalConsistencyMaterialUpdateProposals({
                                        material: currentMaterial,
                                        testRunId: testRecordId,
                                        result: cementNormalConsistencyPhase2Result
                                      })
      : undefined;
    const hasPendingProposals = Boolean(updateProposals?.length);
    const newRecord: MaterialTestRecord = {
      id: testRecordId,
      testType: currentTestDef.id,
      testTitleAr: currentTestDef.titleAr,
      testTitleFr: currentTestDef.titleFr,
      testTitleEn: currentTestDef.titleEn,
      category: currentTestDef.category,
      laboratoryArea: "materials",
      materialId: currentMaterial.id,
      materialName: currentMaterial.name,
      materialCategory: currentMaterial.category,
      sampleId,
      sampleDate,
      sampleSource,
      sampleDescription,
      operator,
      laboratoryName: labName,
      date: testDate,
      standard: currentTestDef.standard,
      inputs: inputsState,
      results: calculationResult.results,
      status: calculationResult.status,
      approvalStatus: isBlockedOrFailed(calculationResult.status) ? "Rejected" : "Pending Review",
      score: calculationResult.score,
      interpretation: calculationResult.interpretation,
      complianceDetails: calculationResult.complianceDetails,
      chartData: calculationResult.chartData,
      granulometricCurve: calculationResult.granulometricCurve,
      notes,
      syncedToMaterial: false,
      syncedProperties: {},
      updateProposals: updateProposals,
      createdAt: initialDraft?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveTest(newRecord, {});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {labText(language, "إجراء تجربة مخبرية جديدة ومطابقة الجودة", "Réaliser un nouvel essai sur matériau et contrôler sa qualité", "Run a new material test and quality check")}
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {currentTestDef.standard}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === "ar" ? currentTestDef.titleAr : language === "fr" ? currentTestDef.titleFr : currentTestDef.titleEn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2" aria-label={language === "ar" ? "مراحل الاختبار" : language === "fr" ? "Étapes de l'essai" : "Test steps"}>
            {(language === "ar" ? ["اختيار الاختبار والمادة", "بيانات العينة", "القياسات", "النتائج"] : language === "fr" ? ["Essai et matériau", "Échantillon", "Mesures", "Résultats"] : ["Test & material", "Sample details", "Measurements", "Results"]).map((label, index) => (
              <button key={label} type="button" onClick={() => { if (index < wizardStep) setWizardStep(index); }} disabled={index >= wizardStep} className={`rounded-xl border px-3 py-2 text-xs font-bold text-start ${wizardStep === index ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : wizardStep > index ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900"}`}>
                <span className="me-2 font-mono">0{index + 1}</span>{label}
              </button>
            ))}
          </div>
          {/* 1. Category & Test Selection Toolbar */}
          <div className={wizardStep === 0 ? "space-y-3" : "hidden"}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-500" />
                {labText(language, "1. تصنيف مادة التجربة ومجال الفحص", "1. Catégorie de matériau", "1. Material category")}
              </label>
              <span className="text-[11px] text-slate-400">
                {labText(language, "اختر تصنيفاً أو اعرض جميع الاختبارات (28 فحصاً معيارياً)", "Choisissez une catégorie ou affichez les 28 essais normalisés", "Select a category or view all 28 standard tests")}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-black"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span className="text-lg">🧪</span>
                <span className="text-xs font-bold truncate">{labText(language, "جميع الاختبارات (28)", "Tous les essais (28)", "All tests (28)")}</span>
              </button>

              {(Object.keys(LAB_CATEGORIES_INFO) as LabCategory[]).map(catKey => {
                const info = LAB_CATEGORIES_INFO[catKey];
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(catKey);
                      const firstTestInCat = MASTER_TEST_CATALOG.find(t => t.category === catKey);
                      if (firstTestInCat) {
                        handleSelectTest(firstTestInCat);
                      }
                    }}
                    className={`flex items-center gap-1.5 p-2.5 rounded-2xl border text-right transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm ring-2 ring-blue-500/20 font-black"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-xs font-bold truncate">
                      {language === "ar" ? info.nameAr : language === "fr" ? info.nameFr : info.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Target Material & Specific Test Picker */}
          <div className={wizardStep === 0 ? "grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800" : "hidden"}>
            {/* Pick Test */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                  <span>{labText(language, "الاختبار المعياري المطلوب:", "Essai normalisé requis :", "Required standard test:")}</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {labText(language, `${filteredTests.length} فحص متاح`, `${filteredTests.length} essais disponibles`, `${filteredTests.length} tests available`)}
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={testSearchQuery}
                  onChange={(e) => setTestSearchQuery(e.target.value)}
                  placeholder={labText(language, "بحث في اسم الاختبار أو المواصفة...", "Rechercher par nom d'essai ou norme…", "Search test name or standard…")}
                  className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedTestDefId}
                onChange={(e) => {
                  const found = MASTER_TEST_CATALOG.find(t => t.id === e.target.value);
                  if (found) handleSelectTest(found);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {filteredTests.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {language === "ar" ? t.titleAr : language === "fr" ? t.titleFr : t.titleEn} ({t.standard})
                  </option>
                ))}
              </select>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{language === "ar" ? currentTestDef.titleAr : language === "fr" ? currentTestDef.titleFr : currentTestDef.titleEn}</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 font-mono font-bold text-blue-700 dark:text-blue-300 text-[10px]">
                    {currentTestDef.standard}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {labText(language, "خصائص مقترحة للمراجعة: ", "Propriétés proposées à examiner : ", "Proposed properties for review: ")}<strong className="text-blue-600 dark:text-blue-400 font-mono">{currentTestDef.syncedPropertyKeys.join(", ")}</strong>
                </div>
              </div>
            </div>

            {/* Pick Material to Test */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{labText(language, "المادة المراد اختبارها من المكتبة:", "Matériau à tester dans la bibliothèque :", "Material to test from the library:")}</span>
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{labText(language, "التحديث بعد المراجعة فقط", "Mise à jour après examen uniquement", "Update only after review")}</span>
                </span>
              </div>

              {/* Material Search & Category filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={matSearchQuery}
                    onChange={(e) => setMatSearchQuery(e.target.value)}
                    placeholder={labText(language, "بحث عن أي مادة في المكتبة...", "Rechercher un matériau dans la bibliothèque…", "Search materials in the library…")}
                    className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <select
                  value={matCategoryFilter}
                  onChange={(e) => setMatCategoryFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">{labText(language, `كل المواد (${materials.length})`, `Tous les matériaux (${materials.length})`, `All materials (${materials.length})`)}</option>
                  <option value="رمال">{labText(language, "رمال", "Sables", "Sand")}</option>
                  <option value="حصى">{labText(language, "حصى", "Graviers", "Gravel")}</option>
                  <option value="إسمنت">{labText(language, "إسمنت", "Ciment", "Cement")}</option>
                  <option value="ماء">{labText(language, "ماء", "Eau", "Water")}</option>
                  <option value="إضافات وملدنات">{labText(language, "إضافات", "Adjuvants", "Admixtures")}</option>
                </select>
              </div>

                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {filteredMaterials.length === 0 && <option value="">{language === "ar" ? "لا توجد مادة متوافقة مع هذا الاختبار" : language === "fr" ? "Aucun matériau compatible" : "No compatible material available"}</option>}
                  {filteredMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    📦 {m.name} ({m.category || "عام"}){m.density !== undefined ? ` • ${m.density} t/m³` : ""}
                  </option>
                ))}
              </select>

              {!compatibility.compatible && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs font-bold text-red-700 dark:text-red-300">
                  {compatibilityMessage(compatibility, language === "fr" ? "fr" : language === "ar" ? "ar" : "en")}
                  {filteredMaterials.length === 0 && onNavigateToMaterialsLibrary && <button type="button" onClick={onNavigateToMaterialsLibrary} className="ms-3 underline underline-offset-2">{language === "ar" ? "إضافة مادة متوافقة من المكتبة" : language === "fr" ? "Ajouter un matériau compatible" : "Add a compatible material"}</button>}
                </div>
              )}

              {/* Selected Material Preview Card */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {currentMaterial?.name || (language === "ar" ? "لا توجد مادة محددة" : "No material selected")}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                    {currentMaterial?.category || (language === "ar" ? "غير محدد" : "Not selected")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                  <span>الكثافة: <strong>{currentMaterial?.density ?? "—"} t/m³</strong></span>
                  <span>• الامتصاص: <strong>{currentMaterial?.absorption ?? "—"}%</strong></span>
                  <span>• المعرف: <strong>{currentMaterial?.id || "—"}</strong></span>
                  <span>• الاعتماد: <strong>{currentMaterial?.approvalStatus || (currentMaterial?.isApproved ? "Approved" : language === "ar" ? "غير معتمد" : "Unapproved")}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sample & Traceability Information */}
          <div className={wizardStep === 1 ? "space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800" : "hidden"}>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              {labText(language, "بيانات العينة وضبط الجودة والتتبع", "Identification de l'échantillon et traçabilité", "Sample identification & traceability")}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {labText(language, "كود العينة", "Identifiant de l'échantillon", "Sample ID")}
                </label>
                <input
                  type="text"
                  value={sampleId}
                  onChange={(e) => { setSampleId(e.target.value); setSampleDuplicateConfirmed(false); }}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{language === "ar" ? "تاريخ أخذ العينة" : language === "fr" ? "Date de prélèvement" : "Sample collection date"}</label>
                <input type="date" max={testDate || new Date().toISOString().slice(0, 10)} value={sampleDate} onChange={(e) => setSampleDate(e.target.value)} className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200" />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {labText(language, "تاريخ التجربة", "Date de l'essai", "Test date")}
                </label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {labText(language, "المهندس / الفني المخبري", "Opérateur / ingénieur", "Operator / engineer")}
                </label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {labText(language, "اسم المخبر / الهيئة", "Laboratoire / organisme", "Laboratory facility")}
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{language === "ar" ? "مصدر العينة" : language === "fr" ? "Source de l'échantillon" : "Sample source"}</label>
                <input type="text" value={sampleSource} onChange={(e) => setSampleSource(e.target.value)} placeholder={language === "ar" ? "الموقع أو المورد أو رقم الدفعة" : language === "fr" ? "Site, fournisseur ou lot" : "Site, supplier, or batch"} className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200" />
              </div>
            </div>
            {duplicateSampleExists && <label className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"><input type="checkbox" checked={sampleDuplicateConfirmed} onChange={(e) => setSampleDuplicateConfirmed(e.target.checked)} /><span>{language === "ar" ? "رقم العينة مسجل مسبقًا في المشروع. أؤكد إعادة استخدام الرقم عمدًا." : language === "fr" ? "Ce numéro est déjà utilisé dans le projet. Je confirme explicitement sa réutilisation." : "This sample ID already exists in the project. I explicitly confirm reusing it."}</span></label>}
            {wizardStep === 1 && getSampleIssues().length > 0 && <ul className="list-disc ps-5 text-xs text-rose-700 dark:text-rose-300">{getSampleIssues().map(issue => <li key={issue}>{issue}</li>)}</ul>}
          </div>

          {/* 4. Live Test Input & Form Controls */}
          <div className={wizardStep === 2 ? "space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800" : "hidden"}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                {labText(language, "المدخلات والقياسات المخبرية المباشرة", "Mesures et données primaires de l'essai", "Test measurements & primary inputs")}
              </h4>
              <button
                type="button"
                onClick={() => setInputsState(createBlankLaboratoryInputs(currentTestDef))}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                {language === "ar" ? "مسح القياسات" : language === "fr" ? "Effacer les mesures" : "Clear measurements"}
              </button>
            </div>

            {/* Dynamic input render according to test type */}
            {selectedTestDefId === "AGG_SIEVE" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {labText(language, "وزن العينة الكلية الجافة (غرام):", "Masse totale sèche de l'échantillon (g) :", "Total dry sample mass (g):")}
                    </label>
                    <input
                      type="number"
                      value={inputsState.totalWeight ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        setInputsState(prev => ({ ...prev, totalWeight: val }));
                      }}
                      className="w-28 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    />
                    {runAttempted && inputIssues.some(issue => issue.path === "totalWeight") && <span className="block text-[10px] text-rose-600">{localizeLaboratoryIssue(inputIssues.find(issue => issue.path === "totalWeight")!, language)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">نوع الركام:</span>
                    <button
                      type="button"
                      onClick={() => setInputsState(prev => ({ ...prev, materialType: "sand" }))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        (inputsState.materialType || "sand") === "sand" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600"
                      }`}
                    >
                      رمل (Sand 0/4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputsState(prev => ({ ...prev, materialType: "gravel" }))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        inputsState.materialType === "gravel" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600"
                      }`}
                    >
                      حصى (Gravel 4/20)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">فتحة المنخل (mm)</th>
                        <th className="p-2.5">الوزن المحتجز الجزئي (g)</th>
                        <th className="p-2.5">النسبة المحتجزة (%)</th>
                        <th className="p-2.5">المحتجز التراكمي (%)</th>
                        <th className="p-2.5">المار التراكمي (%)</th>
                        <th className="p-2.5">{language === "ar" ? "إجراء" : language === "fr" ? "Action" : "Action"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {(inputsState.sieves || []).map((s: any, idx: number) => {
                        const stepRes = calculationResult.results.sieveTable?.[idx];
                        return (
                          <tr key={idx} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20">
                            <td className="p-2.5">
                              <input aria-label={`Sieve ${idx + 1} aperture in mm`} type="number" min={0} step="any" value={s.sieve ?? ""} onChange={(e) => { const rows = [...inputsState.sieves]; rows[idx] = { ...rows[idx], sieve: e.target.value === "" ? undefined : Number(e.target.value) }; setInputsState(prev => ({ ...prev, sieves: rows })); }} className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 font-mono font-bold text-blue-600 dark:border-slate-700 dark:bg-slate-900" />
                              <span className="ms-1 text-[10px] text-slate-400">mm</span>
                              {runAttempted && inputIssues.some(issue => issue.path === `sieves.${idx}.sieve`) && <span className="block text-[10px] text-rose-600">{localizeLaboratoryIssue(inputIssues.find(issue => issue.path === `sieves.${idx}.sieve`)!, language)}</span>}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={s.retained ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value.trim() === "" ? undefined : Number(e.target.value);
                                  const newSieves = [...inputsState.sieves];
                                  newSieves[idx] = { ...newSieves[idx], retained: val };
                                  setInputsState(prev => ({ ...prev, sieves: newSieves }));
                                }}
                                className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                              />
                              {runAttempted && inputIssues.some(issue => issue.path === `sieves.${idx}.retained`) && <span className="block text-[10px] text-rose-600">{language === "ar" ? "الكتلة مطلوبة وغير سالبة" : "Required; non-negative"}</span>}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                              {stepRes?.percentRetained ?? "—"}{stepRes ? "%" : ""}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                              {stepRes?.cumulativePercentRetained ?? "—"}{stepRes ? "%" : ""}
                            </td>
                            <td className="p-2.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {stepRes?.percentPassing ?? "—"}{stepRes ? "%" : ""}
                            </td>
                            <td className="p-2.5"><div className="flex gap-1"><button type="button" aria-label={`Copy sieve row ${idx + 1}`} onClick={() => { const rows = [...inputsState.sieves]; rows.splice(idx + 1, 0, { ...rows[idx] }); setInputsState(prev => ({ ...prev, sieves: rows })); }} className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50">⧉</button><button type="button" aria-label={`Delete sieve row ${idx + 1}`} onClick={() => setInputsState(prev => ({ ...prev, sieves: prev.sieves.filter((_: any, index: number) => index !== idx) }))} className="rounded px-2 py-1 text-rose-600 hover:bg-rose-50">×</button></div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={() => setInputsState(prev => ({ ...prev, sieves: [...prev.sieves, { sieve: undefined, retained: undefined }] }))} className="rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-900 dark:text-blue-300">{language === "ar" ? "+ إضافة منخل" : language === "fr" ? "+ Ajouter un tamis" : "+ Add sieve row"}</button>
              </div>
            )}

            {selectedTestDefId === "AGG_BULK_DENSITY" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">سعة الوعاء المعياري (Litre)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.containerVolumeLiters ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, containerVolumeLiters: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">وزن الوعاء فارغاً (kg)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={inputsState.containerEmptyWeightKg ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, containerEmptyWeightKg: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">الوزن الكلي سائب (kg)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={inputsState.looseFilledWeightKg ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, looseFilledWeightKg: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">الوزن الكلي مدموك (kg)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={inputsState.compactedWeightKg ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, compactedWeightKg: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedTestDefId === "AGG_SPECIFIC_GRAVITY" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">الكتلة المجففة في الفرن M4 (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.ovenDryMassG ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, ovenDryMassG: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">الكتلة المشبعة جافة السطح M1 (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.ssdMassG ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, ssdMassG: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">البيكنومتر + العينة + الماء M2 (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.pycnometerSampleWaterMassG ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, pycnometerSampleWaterMassG: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">البيكنومتر مملوء بالماء فقط M3 (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputsState.pycnometerWaterMassG ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setInputsState(p => ({ ...p, pycnometerWaterMassG: val }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedTestDefId === "CEM_SETTING_TIME" && (
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">نسبة ماء العجينة (%):</span>
                    <input
                      type="number"
                      step={0.1}
                      value={inputsState.waterPercent ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        setInputsState(p => ({ ...p, waterPercent: val }));
                      }}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">درجة حرارة الغرفة (°C):</span>
                    <input
                      type="number"
                      step={0.5}
                      value={inputsState.roomTempC ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        setInputsState(p => ({ ...p, roomTempC: val }));
                      }}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between"><span className="text-xs font-bold">{language === "ar" ? "قراءات الزمن والاختراق" : language === "fr" ? "Temps et pénétration" : "Time and penetration readings"}</span><button type="button" onClick={() => setInputsState(prev => ({ ...prev, timeReadings: [...prev.timeReadings, { timeMinutes: undefined, penetrationMm: undefined }] }))} className="rounded-lg border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-900 dark:text-blue-300">{language === "ar" ? "+ صف قراءة" : language === "fr" ? "+ Ajouter une lecture" : "+ Add reading"}</button></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {(inputsState.timeReadings || []).map((r: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">{language === "ar" ? "الزمن (دقيقة)" : language === "fr" ? "Temps (min)" : "Time (min)"}</label>
                      <input type="number" min={0} step={1} aria-label={`Reading ${idx + 1} time in minutes`} value={r.timeMinutes ?? ""} onChange={(e) => {
                        const newReadings = [...inputsState.timeReadings];
                        newReadings[idx] = { ...newReadings[idx], timeMinutes: e.target.value === "" ? undefined : Number(e.target.value) };
                        setInputsState(prev => ({ ...prev, timeReadings: newReadings }));
                      }} className="w-full text-center px-1 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono" />
                      <input
                        type="number"
                        min={0}
                        max={40}
                        step={0.5}
                        value={r.penetrationMm ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                          const newReadings = [...inputsState.timeReadings];
                          newReadings[idx] = { ...newReadings[idx], penetrationMm: val };
                          setInputsState(prev => ({ ...prev, timeReadings: newReadings }));
                        }}
                        className="w-full text-center px-1 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-black text-blue-600"
                      />
                      <span className="text-[9px] text-slate-400">مم من القاعدة</span>
                      {runAttempted && inputIssues.some(issue => issue.path.startsWith(`timeReadings.${idx}.`)) && <span className="block text-[9px] text-rose-600">{language === "ar" ? "أكمل القيمة وصحّح ترتيب الوقت" : "Complete values and order"}</span>}
                      <div className="flex justify-center gap-1"><button type="button" aria-label={`Copy reading ${idx + 1}`} onClick={() => { const rows = [...inputsState.timeReadings]; rows.splice(idx + 1, 0, { ...rows[idx] }); setInputsState(prev => ({ ...prev, timeReadings: rows })); }} className="rounded px-2 py-0.5 text-blue-600 hover:bg-blue-50">⧉</button><button type="button" aria-label={`Delete reading ${idx + 1}`} onClick={() => setInputsState(prev => ({ ...prev, timeReadings: prev.timeReadings.filter((_: any, index: number) => index !== idx) }))} className="rounded px-2 py-0.5 text-rose-600 hover:bg-rose-50">×</button></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generic Fallback Form for any other test */}
            {!(["AGG_SIEVE", "AGG_BULK_DENSITY", "AGG_SPECIFIC_GRAVITY", "CEM_SETTING_TIME"].includes(selectedTestDefId)) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.keys(inputsState).filter(k => !Array.isArray(inputsState[k]) && (inputsState[k] === null || typeof inputsState[k] !== "object")).map(key => {
                    const isNumeric = typeof currentTestDef.defaultInputs[key] === "number" || key === "waterVolumeMl";
                    const unit = getLaboratoryFieldUnit(key);
                    return <div key={key} className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{getLaboratoryFieldLabel(key, language)}{unit && <span className="ms-1 text-[10px] text-slate-400">({unit})</span>}</label>
                      <input type={isNumeric ? "number" : "text"} inputMode={isNumeric ? "decimal" : undefined} step="any" value={inputsState[key] ?? ""} aria-invalid={runAttempted && inputIssues.some(issue => issue.path === key)} onChange={(e) => {
                        const raw = e.target.value;
                        const val = isNumeric ? (raw.trim() === "" ? undefined : Number.isFinite(Number(raw.replace(/,/g, ".")) ) ? Number(raw.replace(/,/g, ".")) : raw) : raw;
                        setInputsState(prev => ({ ...prev, [key]: val }));
                      }} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono" />
                      {runAttempted && inputIssues.some(issue => issue.path === key) && <span className="block text-[10px] text-rose-600">{localizeLaboratoryIssue(inputIssues.find(issue => issue.path === key)!, language)}</span>}
                    </div>;
                  })}
                </div>
                {Object.keys(inputsState).filter(key => Array.isArray(inputsState[key])).map(key => {
                  const exampleRows = currentTestDef.defaultInputs[key] as any[];
                  const rows = inputsState[key] as any[];
                  const isObjectRows = Boolean(exampleRows?.[0] && typeof exampleRows[0] === "object");
                  const columns = isObjectRows ? Object.keys(exampleRows[0]) : ["value"];
                  return <div key={key} className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-3 py-2">
                      <span className="text-xs font-bold">{getLaboratoryFieldLabel(key, language)}</span>
                      <button type="button" onClick={() => setInputsState(prev => ({ ...prev, [key]: [...(prev[key] || []), blankFromExample(exampleRows?.[0] ?? 0)] }))} className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">{language === "ar" ? "إضافة صف" : language === "fr" ? "Ajouter une ligne" : "Add row"}</button>
                    </div>
                    <table className="min-w-full text-xs">
                      <thead><tr>{columns.map(column => { const fieldKey = isObjectRows ? `${key}[].${column}` : key; const unit = getLaboratoryFieldUnit(column); return <th key={column} className="p-2 text-start">{getLaboratoryFieldLabel(fieldKey, language)}{unit ? ` (${unit})` : ""}</th>; })}<th className="p-2">{language === "ar" ? "إجراءات" : language === "fr" ? "Actions" : "Actions"}</th></tr></thead>
                      <tbody>{rows.map((row, rowIndex) => <tr key={`${key}-${rowIndex}`} className="border-t border-slate-100 dark:border-slate-800">
                        {columns.map(column => {
                          const sample = isObjectRows ? exampleRows[0]?.[column] : exampleRows?.[0];
                          const value = isObjectRows ? row?.[column] : row;
                          const fieldPath = isObjectRows ? `${key}.${rowIndex}.${column}` : `${key}.${rowIndex}`;
                          const fieldIssue = inputIssues.find(issue => issue.path === fieldPath);
                          return <td key={column} className="p-2"><input type={typeof sample === "number" ? "number" : "text"} step="any" value={value ?? ""} aria-invalid={runAttempted && Boolean(fieldIssue)} onChange={(e) => {
                            const updated = [...rows];
                            const nextValue = typeof sample === "number" ? (e.target.value.trim() === "" ? undefined : Number(e.target.value)) : e.target.value;
                            updated[rowIndex] = isObjectRows ? { ...updated[rowIndex], [column]: nextValue } : nextValue;
                            setInputsState(prev => ({ ...prev, [key]: updated }));
                          }} className="min-w-24 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono dark:border-slate-700 dark:bg-slate-900" />{runAttempted && fieldIssue && <span className="mt-1 block text-[9px] text-rose-600">{localizeLaboratoryIssue(fieldIssue, language)}</span>}</td>;
                        })}
                        <td className="p-2"><div className="flex gap-1"><button type="button" aria-label={`Copy ${key} row ${rowIndex + 1}`} onClick={() => { const updated = [...rows]; updated.splice(rowIndex + 1, 0, structuredClone(row)); setInputsState(prev => ({ ...prev, [key]: updated })); }} className="rounded-lg px-2 py-1 text-blue-600 hover:bg-blue-50">⧉</button><button type="button" aria-label={`Delete ${key} row ${rowIndex + 1}`} onClick={() => setInputsState(prev => ({ ...prev, [key]: rows.filter((_, index) => index !== rowIndex) }))} className="rounded-lg px-2 py-1 text-rose-600 hover:bg-rose-50">×</button></div></td>
                      </tr>)}</tbody>
                    </table>
                  </div>;
                })}
              </div>
            )}
            {runAttempted && inputIssues.length > 0 && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><strong>{language === "ar" ? "لم يُشغّل الاختبار. أصلح القياسات التالية:" : language === "fr" ? "Essai non lancé. Corrigez les mesures suivantes :" : "Test not run. Fix these measurements:"}</strong><ul className="mt-2 list-disc ps-5 space-y-1">{inputIssues.map((issue, index) => <li key={`${issue.path}-${index}`}>{localizeLaboratoryIssue(issue, language === "ar" ? "ar" : language === "fr" ? "fr" : "en")}</li>)}</ul></div>}
          </div>

          {wizardStep === 3 && <section className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-black">{labText(language, "مراجعة التنفيذ قبل الحفظ", "Vérification avant enregistrement", "Review before saving")}</h4><p className="text-xs text-slate-500">{language === "ar" ? currentTestDef.titleAr : language === "fr" ? currentTestDef.titleFr : currentTestDef.titleEn} · {currentTestDef.standard}</p></div><button type="button" onClick={() => setWizardStep(2)} className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-800 dark:text-blue-300">{labText(language, "تعديل المدخلات", "Modifier les mesures", "Edit measurements")}</button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"><div className="rounded-xl bg-white/80 p-3 dark:bg-slate-900"><span className="block text-slate-500">{labText(language, "المادة", "Matériau", "Material")}</span><strong>{currentMaterial?.name} · {currentMaterial?.category}</strong></div><div className="rounded-xl bg-white/80 p-3 dark:bg-slate-900"><span className="block text-slate-500">{labText(language, "العينة", "Échantillon", "Sample")}</span><strong>{sampleId} · {sampleDate}</strong></div><div className="rounded-xl bg-white/80 p-3 dark:bg-slate-900"><span className="block text-slate-500">{labText(language, "المصدر / الفني", "Source / opérateur", "Source / operator")}</span><strong>{sampleSource} · {operator}</strong></div><div className="rounded-xl bg-white/80 p-3 dark:bg-slate-900"><span className="block text-slate-500">{labText(language, "تاريخ الاختبار", "Date de l'essai", "Test date")}</span><strong>{testDate}</strong></div></div>
            <details className="rounded-xl bg-white/80 p-3 text-xs dark:bg-slate-900"><summary className="cursor-pointer font-bold">{language === "ar" ? "عرض جميع المدخلات الخام" : language === "fr" ? "Afficher toutes les données brutes" : "Show all raw inputs"}</summary><pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px]">{JSON.stringify(inputsState, null, 2)}</pre></details>
            <div className="overflow-x-auto rounded-xl border border-blue-200 dark:border-blue-900"><table className="min-w-full text-xs"><thead className="bg-white/80 dark:bg-slate-900"><tr><th className="p-2 text-start">{labText(language, "الخاصية المقترحة", "Propriété proposée", "Proposed property")}</th><th className="p-2 text-start">{labText(language, "القيمة الحالية", "Valeur actuelle", "Current value")}</th><th className="p-2 text-start">{labText(language, "قيمة الاختبار", "Valeur mesurée", "Test value")}</th></tr></thead><tbody>{Object.entries(calculationResult.syncedProperties).map(([key, value]) => <tr key={key} className="border-t border-blue-100 dark:border-blue-900"><td className="p-2 font-bold">{key}</td><td className="p-2 font-mono">{currentMaterial?.[key as keyof EngineeringMaterial] === undefined ? "—" : String(currentMaterial?.[key as keyof EngineeringMaterial])}</td><td className="p-2 font-mono">{typeof value === "object" ? JSON.stringify(value) : String(value)}</td></tr>)}</tbody></table>{Object.keys(calculationResult.syncedProperties).length === 0 && <p className="p-3 text-xs text-slate-600">{labText(language, "لا توجد خاصية قابلة للتحديث المقترح لهذه النتيجة.", "Aucune propriété à proposer pour cette analyse.", "No material property is eligible for a proposed update from this result.")}</p>}</div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">{language === "ar" ? "الحفظ يضيف النتيجة إلى سجل المشروع ويضع أي تحديث مقترح قيد المراجعة؛ لا تُعدّل مكتبة المواد من هذه الشاشة." : language === "fr" ? "L'enregistrement ajoute le résultat à l'historique et soumet les changements proposés à examen ; la bibliothèque n'est pas modifiée ici." : "Saving archives the result and records any proposed update for review; this screen does not mutate the material library."}</p>
          </section>}

          {/* 5. Results & Compliance / Quality Control Gauge */}
          <div className={wizardStep === 3 ? "grid grid-cols-1 lg:grid-cols-12 gap-6" : "hidden"}>
            {/* Left Box: Key Metric Results */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {labText(language, "النتائج والخواص الفيزيائية المحسوبة", "Résultats et propriétés calculées", "Calculated results and engineering properties")}
                  </h4>
                  <span className={`px-2.5 py-1 text-xs font-black rounded-full flex items-center gap-1 ${
                    calculationResult.status === "PASS"
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : calculationResult.status === "WARNING"
                      ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                  }`}>
                    {calculationResult.status === "PASS" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {calculationResult.status === "WARNING" && <AlertTriangle className="w-3.5 h-3.5" />}
                    {(calculationResult.status === "FAIL" || calculationResult.status === "BLOCKED") && <XCircle className="w-3.5 h-3.5" />}
                    {calculationResult.status === "PASS" ? labText(language, "مطابق للمواصفة", "Conforme", "Compliant") : calculationResult.status === "WARNING" ? labText(language, "تنبيه وتحذير", "Avertissement", "Warning") : calculationResult.status === "BLOCKED" ? labText(language, "محظور لعدم توافق المادة", "Bloqué : matériau incompatible", "Blocked: incompatible material") : labText(language, "مرفوض غير مطابق", "Non conforme", "Non-compliant")} ({calculationResult.status})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(calculationResult.results).filter(k => typeof calculationResult.results[k] !== "object").slice(0, 6).map(resKey => (
                    <div key={resKey} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 block capitalize">
                        {resKey.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {calculationResult.results[resKey]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                  <strong>{labText(language, "التقرير والتفسير الهندسي: ", "Interprétation technique : ", "Engineering interpretation: ")}</strong>
                  {calculationResult.interpretation}
                </div>
              </div>

              {/* Compliance Checklist */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  {labText(language, "جدول التحقق من الحدود المعيارية والمطابقة:", "Vérification des seuils normatifs et de la conformité :", "Standard limits & compliance check:")}
                </h5>
                <div className="space-y-1.5">
                  {calculationResult.complianceDetails.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{c.parameter}</span>
                        <span className="text-[10px] text-slate-400">{labText(language, `الحد القياسي: ${c.limit} | المقاس: ${c.measured}`, `Limite normative : ${c.limit} | Mesure : ${c.measured}`, `Standard limit: ${c.limit} | Measured: ${c.measured}`)}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                        c.status === "PASS" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Box: Interactive Chart */}
            <div className="lg:col-span-6 flex flex-col p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  {labText(language, "التمثيل البياني المعياري للتجربة", "Courbe normalisée de l'essai", "Standard test chart")}
                </h4>
                <span className="text-[10px] font-mono text-slate-400">{labText(language, "رسم تفاعلي", "Graphique interactif", "Interactive chart")}</span>
              </div>

              <div className="flex-1 min-h-[260px] w-full">
                {selectedTestDefId === "AGG_SIEVE" && calculationResult.chartData && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={calculationResult.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="sieve" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} unit="%" />
                      <Tooltip />
                      <Line type="monotone" dataKey="passing" name="المار التراكمي (%)" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="cumRetained" name="المحتجز التراكمي (%)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {selectedTestDefId === "CEM_SETTING_TIME" && calculationResult.chartData && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={calculationResult.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={[0, 45]} stroke="#94a3b8" fontSize={10} unit="mm" />
                      <Tooltip />
                      <Line type="monotone" dataKey="penetration" name="انغراس الإبرة (mm)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="limitInitial" name="حد الشك الابتدائي (4mm)" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {selectedTestDefId === "CEM_COMPRESSIVE_STRENGTH" && calculationResult.chartData && (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={calculationResult.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="MPa" />
                      <Tooltip />
                      <Bar dataKey="strength" name="المقاومة الفعلية (MPa)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {selectedTestDefId === "AGG_BULKING_SAND" && calculationResult.chartData && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={calculationResult.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="moisture" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                      <Tooltip />
                      <Line type="monotone" dataKey="expansionPct" name="نسبة الانتفاخ الحجمي (%)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {!["AGG_SIEVE", "CEM_SETTING_TIME", "CEM_COMPRESSIVE_STRENGTH", "AGG_BULKING_SAND"].includes(selectedTestDefId) && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FlaskConical className="w-12 h-12 text-blue-500/50 mb-2" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === "ar" ? currentTestDef.titleAr : language === "fr" ? currentTestDef.titleFr : currentTestDef.titleEn}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {language === "ar" ? "لا يتطلب هذا الاختبار رسمًا بيانيًا. القيم المعروضة مستمدة من القياسات المدخلة." : language === "fr" ? "Aucun graphique n'est défini pour cet essai. Les résultats proviennent des mesures saisies." : "No chart is defined for this test. Results are derived from the entered measurements."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer: Save & Sync Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
              {wizardStep === 3 && !isBlockedOrFailed(calculationResult.status) && Object.keys(calculationResult.syncedProperties).length > 0
                ? language === "ar" ? `خصائص مقترحة للمراجعة فقط: ${Object.keys(calculationResult.syncedProperties).join("، ")} ← ${currentMaterial?.name}. لن تُعدّل المكتبة تلقائيًا.` : language === "fr" ? `Propriétés proposées pour examen : ${Object.keys(calculationResult.syncedProperties).join(", ")} — aucune mise à jour automatique.` : `Properties proposed for review only: ${Object.keys(calculationResult.syncedProperties).join(", ")}. The library will not be changed automatically.`
                : language === "ar" ? "النتيجة تبقى في السجل؛ لا مزامنة تلقائية لخصائص المادة." : language === "fr" ? "Le résultat reste dans l'historique ; aucune synchronisation automatique." : "The result is archived; material properties are not synced automatically."}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {wizardStep > 0 && <button type="button" onClick={() => setWizardStep(wizardStep - 1)} className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl">{language === "ar" ? "السابق" : language === "fr" ? "Précédent" : "Back"}</button>}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              {labText(language, "إلغاء", "Annuler", "Cancel")}
            </button>
            <button type="button" onClick={handleSaveDraft} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{language === "ar" ? "حفظ كمسودة" : language === "fr" ? "Enregistrer comme brouillon" : "Save draft"}</button>
            {wizardStep < 3 ? <button type="button" onClick={advanceWizard} disabled={wizardStep === 0 && (!currentMaterial || !compatibility.compatible)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-xs font-black rounded-2xl">{wizardStep === 2 ? language === "ar" ? "تشغيل الاختبار" : language === "fr" ? "Lancer l'essai" : "Run test" : language === "ar" ? "متابعة" : language === "fr" ? "Continuer" : "Continue"}<ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={handleSave} disabled={!hasRun || inputIssues.length > 0 || getSampleIssues().length > 0 || !currentMaterial || !compatibility.compatible} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/20"><Save className="w-4 h-4" />{language === "ar" ? "حفظ النتيجة في السجل" : language === "fr" ? "Enregistrer le résultat" : "Save result to history"}</button>}
          </div>
        </div>
      </div>
    </div>
  );
};
