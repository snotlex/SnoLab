import React, { useState, useMemo } from "react";
import { 
  FlaskConical, 
  Play, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  TrendingUp, 
  Scale, 
  Info,
  Calendar,
  User,
  Building2,
  FileCheck
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import {
  calculateSieveAnalysis,
  calculateBulkDensity,
  calculateSpecificGravityAndAbsorption,
  calculateMoistureContent,
  calculateSandEquivalent,
  calculateSandBulking,
  calculateLosAngeles,
  calculateMicroDeval,
  calculateVoidContent,
  calculateParticleShapeAndFlakiness
} from "../../utils/materialTestingCalculators";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface TestModuleAggregatesProps {
  material: EngineeringMaterial;
  operator: string;
  projectName?: string;
  initialTestType?: AggregateTestType;
  onSaveTest: (test: MaterialTestRecord, updatedMaterialProps?: Record<string, any>) => void;
  onCancel: () => void;
}

export type AggregateTestType = 
  | "AGG_SIEVE"
  | "AGG_BULK_DENSITY"
  | "AGG_SPECIFIC_GRAVITY"
  | "AGG_MOISTURE_CONTENT"
  | "AGG_VOID_CONTENT"
  | "AGG_SHAPE_FLAKINESS"
  | "AGG_SAND_EQUIVALENT"
  | "AGG_BULKING_SAND"
  | "AGG_LOS_ANGELES"
  | "AGG_MICRO_DEVAL"
  | "AGG_METHYLENE_BLUE";

export const TestModuleAggregates: React.FC<TestModuleAggregatesProps> = ({
  material,
  operator,
  projectName = "مشروع الخرسانة النموذجي",
  initialTestType,
  onSaveTest,
  onCancel
}) => {
  const isSand = material.category === "رمال" || material.type?.includes("sand");
  const [activeTestType, setActiveTestType] = useState<AggregateTestType>(
    initialTestType || (isSand ? "AGG_SIEVE" : "AGG_LOS_ANGELES")
  );

  // Workflow Approval Status (Draft -> Calculated -> Pending Review -> Validated)
  const [approvalStatus, setApprovalStatus] = useState<"Draft" | "Calculated" | "Pending Review" | "Validated">("Validated");

  // General Metadata
  const [sampleId, setSampleId] = useState(`SMP-${material.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`);
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // 1. Sieve Analysis Inputs
  const [sieveTotalWeight, setSieveTotalWeight] = useState<number>(1000);
  const [sieveRows, setSieveRows] = useState<{ sieve: number; retained: number }[]>(
    isSand 
      ? [
          { sieve: 5.0, retained: 0 },
          { sieve: 4.0, retained: 25 },
          { sieve: 2.0, retained: 135 },
          { sieve: 1.0, retained: 220 },
          { sieve: 0.5, retained: 275 },
          { sieve: 0.25, retained: 215 },
          { sieve: 0.125, retained: 105 },
          { sieve: 0.063, retained: 20 },
          { sieve: 0.0, retained: 5 }
        ]
      : [
          { sieve: 25.0, retained: 0 },
          { sieve: 20.0, retained: 50 },
          { sieve: 16.0, retained: 320 },
          { sieve: 12.5, retained: 580 },
          { sieve: 8.0, retained: 850 },
          { sieve: 4.0, retained: 180 },
          { sieve: 0.0, retained: 20 }
        ]
  );

  // 2. Bulk Density Inputs
  const [containerVol, setContainerVol] = useState<number>(10); // 10 Liters
  const [emptyWeight, setEmptyWeight] = useState<number>(4.2); // kg
  const [filledWeight, setFilledWeight] = useState<number>(19.4); // kg
  const [isCompacted, setIsCompacted] = useState<boolean>(false);

  // 3. Specific Gravity & Absorption Inputs
  const [ovenDryG, setOvenDryG] = useState<number>(1000);
  const [ssdG, setSsdG] = useState<number>(1018);
  const [apparentInWaterG, setApparentInWaterG] = useState<number>(635);

  // 4. Moisture Content Inputs
  const [wetWeightG, setWetWeightG] = useState<number>(1045);
  const [dryWeightG, setDryWeightG] = useState<number>(1000);

  // 5. Sand Equivalent Inputs
  const [h1Visual, setH1Visual] = useState<number>(110);
  const [h2Sand, setH2Sand] = useState<number>(90);
  const [h2Piston, setH2Piston] = useState<number>(86);

  // 6. Sand Bulking Inputs
  const [dryVolCm3, setDryVolCm3] = useState<number>(1000);
  const [bulkingPoints, setBulkingPoints] = useState([
    { moisturePercent: 0, wetVolumeCm3: 1000 },
    { moisturePercent: 2, wetVolumeCm3: 1120 },
    { moisturePercent: 4, wetVolumeCm3: 1250 },
    { moisturePercent: 6, wetVolumeCm3: 1280 },
    { moisturePercent: 8, wetVolumeCm3: 1220 },
    { moisturePercent: 10, wetVolumeCm3: 1140 },
    { moisturePercent: 12, wetVolumeCm3: 1060 }
  ]);

  // 7. Los Angeles Inputs
  const [laInitialWeight, setLaInitialWeight] = useState<number>(5000);
  const [laRetained1_6, setLaRetained1_6] = useState<number>(3900);

  // 8. Micro-Deval Inputs
  const [mdeInitialWeight, setMdeInitialWeight] = useState<number>(500);
  const [mdeRetained1_6, setMdeRetained1_6] = useState<number>(420);

  // 9. Methylene Blue Inputs
  const [mbSampleWeightG, setMbSampleWeightG] = useState<number>(200);
  const [mbTotalMlAdded, setMbTotalMlAdded] = useState<number>(18);

  // 10. Void Content Inputs
  const [voidBulkDensity, setVoidBulkDensity] = useState<number>(material.bulkDensity || 1520);
  const [voidRealDensity, setVoidRealDensity] = useState<number>(material.density || 2650);

  // 11. Shape & Flakiness Inputs
  const [shapeTotalWeightG, setShapeTotalWeightG] = useState<number>(2000);
  const [passingBarSievesWeightG, setPassingBarSievesWeightG] = useState<number>(240); // Flakiness FI
  const [nonCubicalWeightG, setNonCubicalWeightG] = useState<number>(280); // Shape Index SI

  // Computed results based on activeTestType
  const computed = useMemo(() => {
    switch (activeTestType) {
      case "AGG_VOID_CONTENT": {
        const res = calculateVoidContent(voidBulkDensity, voidRealDensity);
        return {
          titleAr: "نسبة الفراغات البينية (Interstitial Void Content)",
          titleFr: "Taux de vides interstitiels",
          titleEn: "Void Content of Aggregates",
          standard: "NF EN 1097-3 / ASTM C29",
          results: res,
          status: res.status,
          score: res.status === "PASS" ? 95 : 75,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {
            voidRatio: res.voidPercent
          }
        };
      }
      case "AGG_SHAPE_FLAKINESS": {
        const res = calculateParticleShapeAndFlakiness(shapeTotalWeightG, passingBarSievesWeightG, nonCubicalWeightG);
        return {
          titleAr: "معامل الشكل والتفرطح (Particle Shape & Flakiness Index)",
          titleFr: "Forme des granulats (Coefficient d'aplatissement FI et d'élancement SI)",
          titleEn: "Flakiness Index (FI) & Shape Index (SI)",
          standard: "NF EN 933-3 (FI) / NF EN 933-4 (SI)",
          results: res,
          status: res.status,
          score: res.status === "PASS" ? 96 : res.status === "WARNING" ? 80 : 50,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {
            flakinessIndex: res.flakinessIndexFI,
            shapeIndex: res.shapeIndexSI
          }
        };
      }
      case "AGG_SIEVE": {
        const res = calculateSieveAnalysis(sieveTotalWeight, sieveRows, isSand ? "sand" : "gravel");
        return {
          titleAr: "التحليل الحبيبي بالغربلة (Sieve Analysis)",
          titleFr: "Analyse granulométrique par tamisage",
          titleEn: "Sieve Analysis of Aggregates",
          standard: "NF EN 933-1 / ASTM C136",
          results: res,
          status: res.status,
          score: res.status === "PASS" ? 98 : res.status === "WARNING" ? 82 : 55,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {
            finenessModulus: isSand ? res.finenessModulus : material.finenessModulus,
            dMax: res.dMax,
            finesContent: res.finesContent
          }
        };
      }
      case "AGG_BULK_DENSITY": {
        const res = calculateBulkDensity(containerVol, emptyWeight, filledWeight, isCompacted);
        return {
          titleAr: "الكتلة الحجمية الظاهرية (Bulk Density)",
          titleFr: "Masse volumique apparente",
          titleEn: "Bulk Density Test",
          standard: "NF EN 1097-3 / ASTM C29",
          results: res,
          status: res.status,
          score: res.status === "PASS" ? 95 : 75,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {
            bulkDensity: res.bulkDensityKgM3
          }
        };
      }
      case "AGG_SPECIFIC_GRAVITY": {
        const res = calculateSpecificGravityAndAbsorption(ovenDryG, ssdG, apparentInWaterG);
        return {
          titleAr: "الكثافة الحقيقية والامتصاصية (Specific Gravity & Absorption)",
          titleFr: "Densité relative et absorption d'eau",
          titleEn: "Specific Gravity & Water Absorption",
          standard: "NF EN 1097-6 / ASTM C127/C128",
          results: res,
          status: res.status,
          score: res.status === "PASS" ? 98 : 80,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {
            density: res.realDensityKgM3,
            ssdDensity: res.ssdDensityKgM3,
            absorption: res.waterAbsorptionPercent
          }
        };
      }
      case "AGG_MOISTURE_CONTENT": {
        const res = calculateMoistureContent(wetWeightG, dryWeightG);
        return {
          titleAr: "نسبة الرطوبة الطبيعية (Moisture Content)",
          titleFr: "Teneur en eau des granulats",
          titleEn: "Moisture Content Test",
          standard: "NF EN 1097-5 / ASTM C566",
          results: res,
          status: res.status,
          score: 100,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {
            moisture: res.moisturePercent
          }
        };
      }
      case "AGG_SAND_EQUIVALENT": {
        const res = calculateSandEquivalent(h1Visual, h2Sand, h2Piston);
        return {
          titleAr: "المكافئ الرملي (Sand Equivalent)",
          titleFr: "Équivalent de sable (ES)",
          titleEn: "Sand Equivalent Test",
          standard: "NF EN 933-8 / NF P 18-598",
          results: res,
          status: res.status,
          score: res.status === "PASS" ? 96 : 70,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {
            sandEquivalent: res.esPiston
          }
        };
      }
      case "AGG_BULKING_SAND": {
        const res = calculateSandBulking(dryVolCm3, bulkingPoints);
        return {
          titleAr: "منحنى انتفاخ الرمل الرطب (Sand Bulking Curve)",
          titleFr: "Foisonnement du sable humide",
          titleEn: "Sand Bulking vs Moisture",
          standard: "NF P 18-596",
          results: res,
          status: res.status,
          score: 100,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {}
        };
      }
      case "AGG_LOS_ANGELES": {
        const res = calculateLosAngeles(laInitialWeight, laRetained1_6);
        return {
          titleAr: "معامل لوس أنجلوس للتفتت (Los Angeles Abrasion)",
          titleFr: "Essai Los Angeles des gravillons",
          titleEn: "Los Angeles Abrasion Test",
          standard: "NF EN 1097-2 / ASTM C131",
          results: res,
          status: res.status,
          score: res.status === "PASS" ? 95 : 65,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {
            losAngelesAbrasion: res.laPercent
          }
        };
      }
      case "AGG_MICRO_DEVAL": {
        const res = calculateMicroDeval(mdeInitialWeight, mdeRetained1_6);
        return {
          titleAr: "معامل ميكرو-ديفال بالماء (Micro-Deval Abrasion)",
          titleFr: "Essai Micro-Deval en présence d'eau",
          titleEn: "Micro-Deval Abrasion Test",
          standard: "NF EN 1097-1",
          results: res,
          status: res.status,
          score: res.status === "PASS" ? 94 : 70,
          interpretation: res.interpretation,
          compliance: res.compliance,
          syncedProps: {
            microDeval: res.mdePercent
          }
        };
      }
      case "AGG_METHYLENE_BLUE": {
        const mbv = mbSampleWeightG > 0 ? parseFloat(((mbTotalMlAdded * 0.01 / mbSampleWeightG) * 1000).toFixed(2)) : 0.8;
        const isPass = mbv <= 1.5;
        return {
          titleAr: "اختبار أزرق الميثيلين ونسبة الطين (Methylene Blue Test)",
          titleFr: "Valeur au bleu de méthylène (MBV)",
          titleEn: "Methylene Blue Test for Fines",
          standard: "NF EN 933-9",
          results: { mbv },
          status: (isPass ? "PASS" : "FAIL") as any,
          score: isPass ? 96 : 50,
          interpretation: `قيمة أزرق الميثيلين MBV = ${mbv} g/kg. ${isPass ? "المادة نقية ومطابقة للخرسانات الإنشائية بدون حساسية طينية." : "نشاط طيني مرتفع يتطلب معالجة وغسل الركام."}`,
          compliance: [{
            parameter: "قيمة أزرق الميثيلين (MBV)",
            measured: `${mbv} g/kg`,
            limit: "≤ 1.5 g/kg (NF EN 933-9)",
            status: isPass ? "PASS" : "FAIL",
            note: isPass ? "ركام نقي من المعادن الغضارية المتمددة" : "طين متمدد ضار"
          }],
          syncedProps: {
            methyleneBlue: mbv
          }
        };
      }
    }
  }, [
    activeTestType,
    sieveTotalWeight,
    sieveRows,
    isSand,
    material,
    containerVol,
    emptyWeight,
    filledWeight,
    isCompacted,
    ovenDryG,
    ssdG,
    apparentInWaterG,
    wetWeightG,
    dryWeightG,
    h1Visual,
    h2Sand,
    h2Piston,
    dryVolCm3,
    bulkingPoints,
    laInitialWeight,
    laRetained1_6,
    mdeInitialWeight,
    mdeRetained1_6,
    mbSampleWeightG,
    mbTotalMlAdded
  ]);

  const handleSave = () => {
    const isValidated = approvalStatus === "Validated";
    const record: MaterialTestRecord = {
      id: `TEST-AGG-${Date.now().toString().slice(-6)}`,
      testType: activeTestType,
      testTitleAr: computed.titleAr,
      testTitleFr: computed.titleFr,
      testTitleEn: computed.titleEn,
      category: "aggregates",
      materialId: material.id,
      materialName: material.name,
      materialCategory: material.category,
      sampleId,
      projectId: "proj_active",
      projectName,
      operator,
      laboratoryName: "SnoLab Central Materials Laboratory",
      date: testDate,
      standard: computed.standard,
      inputs: { activeTestType },
      results: computed.results,
      status: computed.status,
      approvalStatus: approvalStatus,
      score: computed.score,
      interpretation: computed.interpretation,
      complianceDetails: computed.compliance,
      notes,
      syncedToMaterial: isValidated,
      syncedProperties: isValidated ? computed.syncedProps : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveTest(record, isValidated ? computed.syncedProps : undefined);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Test Selector Tabs */}
      <div className="bg-slate-50 dark:bg-slate-900/90 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTestType("AGG_SIEVE")}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTestType === "AGG_SIEVE" 
              ? "bg-blue-600 text-white shadow-md" 
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <span>تحليل الغربلة (Sieve)</span>
        </button>

        <button
          onClick={() => setActiveTestType("AGG_SPECIFIC_GRAVITY")}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTestType === "AGG_SPECIFIC_GRAVITY" 
              ? "bg-blue-600 text-white shadow-md" 
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <span>الكثافة الحقيقية والامتصاص</span>
        </button>

        <button
          onClick={() => setActiveTestType("AGG_MOISTURE_CONTENT")}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTestType === "AGG_MOISTURE_CONTENT" 
              ? "bg-blue-600 text-white shadow-md" 
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <span>نسبة الرطوبة (w%)</span>
        </button>

        <button
          onClick={() => setActiveTestType("AGG_BULK_DENSITY")}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTestType === "AGG_BULK_DENSITY" 
              ? "bg-blue-600 text-white shadow-md" 
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <span>الكثافة الظاهرية</span>
        </button>

        <button
          onClick={() => setActiveTestType("AGG_VOID_CONTENT")}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTestType === "AGG_VOID_CONTENT" 
              ? "bg-blue-600 text-white shadow-md" 
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <span>نسبة الفراغات (V%)</span>
        </button>

        {!isSand && (
          <button
            onClick={() => setActiveTestType("AGG_SHAPE_FLAKINESS")}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTestType === "AGG_SHAPE_FLAKINESS" 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <span>الشكل والتفرطح (FI/SI)</span>
          </button>
        )}

        {isSand && (
          <>
            <button
              onClick={() => setActiveTestType("AGG_SAND_EQUIVALENT")}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTestType === "AGG_SAND_EQUIVALENT" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>المكافئ الرملي (ES)</span>
            </button>
            <button
              onClick={() => setActiveTestType("AGG_BULKING_SAND")}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTestType === "AGG_BULKING_SAND" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>انتفاخ الرمل (Bulking)</span>
            </button>
          </>
        )}

        {!isSand && (
          <>
            <button
              onClick={() => setActiveTestType("AGG_LOS_ANGELES")}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTestType === "AGG_LOS_ANGELES" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>لوس أنجلوس (LA%)</span>
            </button>
            <button
              onClick={() => setActiveTestType("AGG_MICRO_DEVAL")}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTestType === "AGG_MICRO_DEVAL" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>ميكرو-ديفال (MDE%)</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTestType("AGG_METHYLENE_BLUE")}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTestType === "AGG_METHYLENE_BLUE" 
              ? "bg-blue-600 text-white shadow-md" 
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <span>أزرق الميثيلين (MBV)</span>
        </button>
      </div>

      {/* Header Info Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              {computed.standard}
            </span>
            <h2 className="text-base font-black">{computed.titleAr}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            المادة المفحوصة: <span className="text-white font-bold">{material.name}</span> ({material.category})
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-400">Sample: </span>
            <span className="text-emerald-400 font-bold">{sampleId}</span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-400">Date: </span>
            <span className="text-slate-200">{testDate}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Inputs on Left, Results/Validation/Charts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Data Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Scale size={16} className="text-blue-500" />
              <span>إدخال القياسات المخبرية (Measurements)</span>
            </h3>

            {/* Test Metadata Inputs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">رقم تعريف العينة</label>
                <input
                  type="text"
                  value={sampleId}
                  onChange={(e) => setSampleId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">تاريخ الفحص</label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* 1. Sieve Inputs */}
            {activeTestType === "AGG_SIEVE" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-600 dark:text-slate-400 font-bold">الوزن الكلي الجاف للعينة (g):</label>
                  <input
                    type="number"
                    value={sieveTotalWeight}
                    onChange={(e) => setSieveTotalWeight(Number(e.target.value))}
                    className="w-28 px-2.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-center">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="py-1.5 px-2">فتحة المنخل (mm)</th>
                        <th className="py-1.5 px-2">المتبقي (g)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sieveRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-1.5 px-2 font-mono font-bold">{r.sieve === 0 ? "قاع الوعاء (Fond)" : `${r.sieve} mm`}</td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              value={r.retained}
                              onChange={(e) => {
                                const next = [...sieveRows];
                                next[i].retained = Number(e.target.value);
                                setSieveRows(next);
                              }}
                              className="w-20 px-2 py-0.5 text-center font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Specific Gravity Inputs */}
            {activeTestType === "AGG_SPECIFIC_GRAVITY" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    وزن العينة المجففة بالفرن M1 (Oven Dry Weight g):
                  </label>
                  <input
                    type="number"
                    value={ovenDryG}
                    onChange={(e) => setOvenDryG(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    وزن العينة المشبعة جافة السطح M2 (SSD Weight g):
                  </label>
                  <input
                    type="number"
                    value={ssdG}
                    onChange={(e) => setSsdG(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الوزن الظاهري مغموراً في الماء M3 (Submerged Weight g):
                  </label>
                  <input
                    type="number"
                    value={apparentInWaterG}
                    onChange={(e) => setApparentInWaterG(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* 3. Moisture Inputs */}
            {activeTestType === "AGG_MOISTURE_CONTENT" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    وزن العينة الرطبة قبل التجفيف (Wet Weight g):
                  </label>
                  <input
                    type="number"
                    value={wetWeightG}
                    onChange={(e) => setWetWeightG(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    وزن العينة بعد التجفيف التام بالفرن 105°C (Dry Weight g):
                  </label>
                  <input
                    type="number"
                    value={dryWeightG}
                    onChange={(e) => setDryWeightG(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* 4. Sand Equivalent Inputs */}
            {activeTestType === "AGG_SAND_EQUIVALENT" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الارتفاع الكلي للمحلول والرمل h1 (mm):
                  </label>
                  <input
                    type="number"
                    value={h1Visual}
                    onChange={(e) => setH1Visual(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    ارتفاع رسوب الرمل البصري h2 (mm):
                  </label>
                  <input
                    type="number"
                    value={h2Sand}
                    onChange={(e) => setH2Sand(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    ارتفاع الرمل المقاس بالمكبس القياسي h'2 (mm):
                  </label>
                  <input
                    type="number"
                    value={h2Piston}
                    onChange={(e) => setH2Piston(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* 5. Los Angeles Inputs */}
            {activeTestType === "AGG_LOS_ANGELES" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الوزن الأولي للعينة M (Initial Weight g - typically 5000g):
                  </label>
                  <input
                    type="number"
                    value={laInitialWeight}
                    onChange={(e) => setLaInitialWeight(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الوزن المتبقي على منخل 1.6 مم بعد 500 دورة m (Retained Weight g):
                  </label>
                  <input
                    type="number"
                    value={laRetained1_6}
                    onChange={(e) => setLaRetained1_6(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* 6. Micro-Deval Inputs */}
            {activeTestType === "AGG_MICRO_DEVAL" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الوزن الأولي للعينة M (Initial Weight g - typically 500g):
                  </label>
                  <input
                    type="number"
                    value={mdeInitialWeight}
                    onChange={(e) => setMdeInitialWeight(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الوزن المتبقي على منخل 1.6 مم بعد دوران في الماء m (Retained g):
                  </label>
                  <input
                    type="number"
                    value={mdeRetained1_6}
                    onChange={(e) => setMdeRetained1_6(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* 7. Methylene Blue Inputs */}
            {activeTestType === "AGG_METHYLENE_BLUE" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    وزن عينة المواد الناعمة المفحوصة (Sample Weight g):
                  </label>
                  <input
                    type="number"
                    value={mbSampleWeightG}
                    onChange={(e) => setMbSampleWeightG(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الحجم الإجمالي لمحلول أزرق الميثيلين المستهلك (Total MB Added ml):
                  </label>
                  <input
                    type="number"
                    value={mbTotalMlAdded}
                    onChange={(e) => setMbTotalMlAdded(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* 8. Void Content Inputs */}
            {activeTestType === "AGG_VOID_CONTENT" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الكتلة الحجمية الظاهرية للركام (Bulk Density kg/m³):
                  </label>
                  <input
                    type="number"
                    value={voidBulkDensity}
                    onChange={(e) => setVoidBulkDensity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الكتلة الحجمية الحقيقية للحبيبات (Specific Gravity kg/m³):
                  </label>
                  <input
                    type="number"
                    value={voidRealDensity}
                    onChange={(e) => setVoidRealDensity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* 9. Shape & Flakiness Inputs */}
            {activeTestType === "AGG_SHAPE_FLAKINESS" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    الوزن الإجمالي للعينة المفحوصة M0 (Total Sample Weight g):
                  </label>
                  <input
                    type="number"
                    value={shapeTotalWeightG}
                    onChange={(e) => setShapeTotalWeightG(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    وزن الحبيبات المارة عبر مناخل القضبان M1 (Passing Bar Sieves g):
                  </label>
                  <input
                    type="number"
                    value={passingBarSievesWeightG}
                    onChange={(e) => setPassingBarSievesWeightG(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    وزن الحبيبات غير المكعبة / الإبرية M2 (Non-Cubical Particles g):
                  </label>
                  <input
                    type="number"
                    value={nonCubicalWeightG}
                    onChange={(e) => setNonCubicalWeightG(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* Approval Status Selector */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                حالة اعتماد وضبط جودة الفحص المخبري (Approval Status):
              </label>
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="Validated">معتمد وموثق مخبرياً (Validated) — يحدث خصائص المادة تلقائياً</option>
                <option value="Pending Review">قيد المراجعة والتدقيق (Pending Review)</option>
                <option value="Draft">مسودة فحص تجريبي (Draft)</option>
              </select>
              <p className="text-[10px] text-slate-400">
                {approvalStatus === "Validated"
                  ? "✓ سيتم حفظ التقرير وتحديث الخصائص الهندسية في بطاقة المادة فوراً مع تسجيل المرجع."
                  : "ⓘ سيتم حفظ السجل في المخبر فقط دون تعديل خصائص المادة حتى يتم اعتماده لاحقاً."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Save size={15} />
                <span>{approvalStatus === "Validated" ? "اعتماد النتيجة وتحديث بطاقة المادة" : "حفظ سجل الفحص المخبري"}</span>
              </button>
              <button
                onClick={onCancel}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>

        {/* Results, Compliance & Charts Column */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick Metrics Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck size={16} className="text-blue-500" />
                <span>النتائج الحسابية ومؤشرات المطابقة</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                computed.status === "PASS" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : computed.status === "WARNING" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              }`}>
                {computed.status === "PASS" && <CheckCircle size={12} />}
                {computed.status === "WARNING" && <AlertTriangle size={12} />}
                {computed.status === "FAIL" && <XCircle size={12} />}
                <span>{computed.status === "PASS" ? "مطابق ومعتمد" : computed.status === "WARNING" ? "تنبيه ومراقبة" : "غير مطابق"}</span>
              </span>
            </div>

            {/* Compliance Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2 px-3">المؤشر</th>
                    <th className="py-2 px-3">القيمة</th>
                    <th className="py-2 px-3">الحد القياسي</th>
                    <th className="py-2 px-3">التقييم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {computed.compliance.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{c.parameter}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{c.measured}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{c.limit}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          c.status === "PASS" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : c.status === "WARNING" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                        }`}>
                          {c.status === "PASS" ? "✓ مطابق" : c.status === "WARNING" ? "⚠ تنبيه" : "✕ مرفوض"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Engineering Interpretation */}
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="font-bold text-blue-700 dark:text-blue-300 mb-0.5">التفسير والتحليل الهندسي:</div>
              {computed.interpretation}
            </div>
          </div>

          {/* Interactive Live Chart (For Sieve and Bulking) */}
          {activeTestType === "AGG_SIEVE" && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>المنحنى الحبيبي للركام (Granulometric Curve)</span>
                <span className="font-mono text-blue-500 text-[11px]">NF EN 933-1</span>
              </div>
              <div className="h-56 w-full pt-2" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(computed.results as any).processedRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="sieve" unit=" mm" tick={{ fontSize: 10 }} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="passing" name="النسبة المارة %" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTestType === "AGG_BULKING_SAND" && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>منحنى انتفاخ الرمل مقابل الرطوبة (Bulking vs Moisture w%)</span>
                <span className="font-mono text-emerald-500 text-[11px]">+{(computed.results as any).maxBulkingPercent}% Peak</span>
              </div>
              <div className="h-56 w-full pt-2" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(computed.results as any).curvePoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="moisture" unit="%" tick={{ fontSize: 10 }} />
                    <YAxis unit="%" domain={[0, 40]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="bulkingPercent" name="الانتفاخ الحجمي %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
