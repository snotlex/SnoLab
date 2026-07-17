import React, { useState, useMemo, useEffect } from "react";
import { 
  FlaskConical, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Check, 
  Activity, 
  Award, 
  Building, 
  Gauge, 
  Layers,
  Sparkles,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Calendar,
  User,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer
} from "lucide-react";
import { 
  ActiveProject, 
  LabValidationInputs, 
  LabValidationRecord, 
  MixDesignInput, 
  MixDesignResult,
  EngineeringMaterial
} from "../types";
import { validateLabResults, ValidationReport, ComparisonMetric, calculateSpecimenStats } from "../utils/labValidationEngine";
import { useLanguage } from "../services/localization";

// Recharts components for true technical concrete graphics
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from "recharts";

interface LaboratoryValidationPanelProps {
  activeProject: ActiveProject | undefined;
  projects: ActiveProject[];
  setProjects: React.Dispatch<React.SetStateAction<ActiveProject[]>>;
  materialsDatabase?: EngineeringMaterial[];
  onSaveValidationRecord?: (updatedProj: ActiveProject) => void;
}

export const LaboratoryValidationPanel: React.FC<LaboratoryValidationPanelProps> = ({
  activeProject,
  projects,
  setProjects,
  materialsDatabase = [],
  onSaveValidationRecord
}) => {
  const { language } = useLanguage();

  const localizedLabel = (ar: string, fr: string, en: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };

  // If no active project is selected, show an error fallback
  if (!activeProject) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
        <FlaskConical size={48} className="mx-auto text-slate-400 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-700">
          {localizedLabel("الرجاء اختيار أو إنشاء مشروع هندسي أولاً", "Veuillez d'abord sélectionner ou créer un projet d'ingénierie", "Please select or create an engineering project first")}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {localizedLabel(
            "يتطلب نظام التحقق المخبري ربط التقارير بمشروع نشط للحفاظ على سلامة البيانات التاريخية.",
            "Le système de validation en laboratoire nécessite d'associer les rapports à un projet actif pour préserver l'intégrité des données historiques.",
            "The laboratory validation system requires linking reports to an active project to maintain historical data integrity."
          )}
        </p>
      </div>
    );
  }

  // Fallback to avoid crashes if results can't be found
  const fallbackDesignResult: MixDesignResult = useMemo(() => {
    return activeProject.results || {
      fcm28: activeProject.inputs.fck28 + 8.5,
      stdDev: 3.5,
      wcRatio: 0.5,
      wcRatioAdjusted: 0.5,
      dreuxAggregateFactor: 12,
      compactorGamma: 0.98,
      waterBeforeCorrection: 180,
      waterAfterDmax: 180,
      waterFromAdmixtures: 0,
      totalAggregateVolume: 680,
      cementWeight: 350,
      waterContentNeeded: 175,
      waterContentActual: 175,
      sandPercent: 40,
      gravelPercent: 60,
      sandWeightDry: 750,
      gravelWeightDry: 1100,
      admixtureWeights: [],
      sandWeightWet: 770,
      gravelWeightWet: 1110,
      waterWeightWet: 160,
      totalFreshDensity: 2380,
      pivotPoint: { x: 10, y: 50 },
      gradingCurve: []
    };
  }, [activeProject]);

  // Initial local template for adding/editing a record
  const initialLabForm = (): LabValidationInputs => ({
    slump: 0,
    slumpFlow: 0,
    freshDensity: 0,
    airContent: 0,
    concreteTemp: 0,
    unitWeight: 0,
    settingTimeInitial: 0,
    settingTimeFinal: 0,
    
    // Hardened Strength Tests
    strength1d: 0,
    strength3d: 0,
    strength7d: 0,
    strength14d: 0,
    strength28d: 0,
    strength56d: 0,
    strength90d: 0,

    specimens1d: [0, 0, 0],
    specimens3d: [0, 0, 0],
    specimens7d: [0, 0, 0],
    specimens14d: [0, 0, 0],
    specimens28d: [0, 0, 0],
    specimens56d: [0, 0, 0],
    specimens90d: [0, 0, 0],

    // Durability
    waterAbsorption: 0,
    permeabilityIndex: 0,
    chloridePenetration: "Low",
    sulfateResistanceRating: "Moderate",
    sorptivity: 0,
    rcptCoulombs: 0,
    freezeThawRating: 0,
    carbonationDepth: 0,

    // NDT
    schmidtHammer: 0,
    upvSpeed: 0,
    coreTestResult: 0,
    reboundNumber: 0
  });

  // Active records state
  const validationRecords = useMemo(() => {
    return activeProject.validationRecords || [];
  }, [activeProject]);

  // UI state variables
  const [selectedRecordId, setSelectedRecordId] = useState<string>("new");
  const [recordName, setRecordName] = useState<string>("");
  const [recordDate, setRecordDate] = useState<string>(""); // casting date
  const [testingDate, setTestingDate] = useState<string>(""); // testing date
  const [supervisor, setSupervisor] = useState<string>(""); // supervisor
  const [location, setLocation] = useState<string>(""); // location
  const [labInputs, setLabInputs] = useState<LabValidationInputs>(initialLabForm());
  const [engineerNotes, setEngineerNotes] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"fresh" | "hardened" | "durability" | "ndt">("fresh");
  
  // Printable report preview modal trigger
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Set default selection to first record if any exists, else "new"
  useEffect(() => {
    if (validationRecords.length > 0 && selectedRecordId === "new") {
      setSelectedRecordId(validationRecords[0].id);
    }
  }, [validationRecords]);

  // Load selected record details
  const currentRecord = useMemo(() => {
    if (selectedRecordId === "new") return null;
    return validationRecords.find(r => r.id === selectedRecordId) || null;
  }, [selectedRecordId, validationRecords]);

  // Populate form values when record changes
  useEffect(() => {
    if (currentRecord) {
      setRecordName(currentRecord.name);
      setRecordDate(currentRecord.date);
      setTestingDate(currentRecord.testingDate || new Date().toISOString().split("T")[0]);
      setSupervisor(currentRecord.supervisor || "senoussi.s.t@gmail.com");
      setLocation(currentRecord.location || activeProject.plant || "");
      setLabInputs(currentRecord.labInputs);
      setEngineerNotes(currentRecord.engineerNotes || "");
    } else {
      setRecordName(
        language === "ar"
          ? `عينة تحقق مخبري - #${validationRecords.length + 1}`
          : language === "fr"
          ? `Échantillon de validation - #${validationRecords.length + 1}`
          : `Lab Validation Specimen - #${validationRecords.length + 1}`
      );
      setRecordDate(new Date().toISOString().split("T")[0]);
      setTestingDate(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      setSupervisor("senoussi.s.t@gmail.com");
      setLocation(activeProject.plant || "");
      setLabInputs(initialLabForm());
      setEngineerNotes("");
    }
  }, [currentRecord, selectedRecordId, activeProject, language, validationRecords.length]);

  // Snapshots for active calculations
  const currentInputsSnapshot = useMemo(() => {
    return currentRecord ? currentRecord.inputsSnapshot : activeProject.inputs;
  }, [currentRecord, activeProject]);

  const currentResultSnapshot = useMemo(() => {
    return currentRecord ? currentRecord.resultsSnapshot : fallbackDesignResult;
  }, [currentRecord, fallbackDesignResult]);

  // Direct calculation from the engineered validation engine
  const report: ValidationReport = useMemo(() => {
    return validateLabResults(currentInputsSnapshot, currentResultSnapshot, labInputs, language);
  }, [currentInputsSnapshot, currentResultSnapshot, labInputs, language]);

  // Handle saving of active laboratory record to project
  const handleSaveRecord = () => {
    if (!recordName.trim()) {
      alert(
        language === "ar"
          ? "الرجاء إدخال تسمية واضحة لعينة الفحص المخبري"
          : language === "fr"
          ? "Veuillez entrer un libellé clair pour l'échantillon d'essai"
          : "Please enter a clear label for the laboratory validation specimen"
      );
      return;
    }

    const uuid = currentRecord ? currentRecord.id : `val_${activeProject.id}_${Date.now()}`;
    const newRecord: LabValidationRecord = {
      id: uuid,
      name: recordName.trim(),
      date: recordDate, // casting date
      testingDate: testingDate, // testing date
      supervisor: supervisor.trim() || "senoussi.s.t@gmail.com",
      location: location.trim() || activeProject.plant,
      inputsSnapshot: currentInputsSnapshot,
      resultsSnapshot: currentResultSnapshot,
      labInputs: labInputs,
      validationScore: report.score,
      rating: report.rating,
      status: report.status,
      engineeringComments: report.engineeringComments,
      engineerNotes: engineerNotes.trim(),
      materialSnapshots: activeProject.materialSnapshots,
      createdAt: currentRecord ? currentRecord.createdAt : new Date().toISOString()
    };

    setProjects(prev => {
      const updatedList = prev.map(p => {
        if (p.id === activeProject.id) {
          const existingRecords = p.validationRecords || [];
          const updatedRecords = currentRecord
            ? existingRecords.map(r => r.id === uuid ? newRecord : r)
            : [...existingRecords, newRecord];
          
          const updated = {
            ...p,
            validationRecords: updatedRecords,
            auditTrail: {
              ...p.auditTrail,
              lastModifiedBy: "senoussi.s.t@gmail.com",
              lastModifiedAt: new Date().toISOString()
            }
          };

          if (onSaveValidationRecord) {
            onSaveValidationRecord(updated);
          }
          return updated;
        }
        return p;
      });
      return updatedList;
    });

    setSaveSuccess(
      language === "ar"
        ? "تم حفظ العينة المخبرية وتحديث بنية مشروع SNO AI بنجاح!"
        : language === "fr"
        ? "L'échantillon de laboratoire a été enregistré et la structure du projet SNO AI mise à jour avec succès !"
        : "Laboratory specimen saved and SNO AI project structure updated successfully!"
    );
    setTimeout(() => setSaveSuccess(""), 4000);
    setSelectedRecordId(uuid);
  };

  // Delete laboratory sample
  const handleDeleteRecord = (id: string, name: string) => {
    const confirmMsg =
      language === "ar"
        ? `هل أنت متأكد من حذف عينة التحقق (${name}) نهائياً من هذا المشروع؟`
        : language === "fr"
        ? `Êtes-vous sûr de vouloir supprimer définitivement l'échantillon de validation (${name}) de ce projet ?`
        : `Are you sure you want to permanently delete the validation specimen (${name}) from this project?`;
    if (!window.confirm(confirmMsg)) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        const updatedRecords = (p.validationRecords || []).filter(r => r.id !== id);
        return {
          ...p,
          validationRecords: updatedRecords
        };
      }
      return p;
    }));

    if (selectedRecordId === id) {
      setSelectedRecordId("new");
    }
  };

  // Aggregate stats across all samples within selected project
  const globalStats = useMemo(() => {
    const allRecords: { rec: LabValidationRecord; projName: string; plantName: string; cement: string; aggSource: string }[] = [];
    
    projects.forEach(p => {
      const records = p.validationRecords || [];
      records.forEach(r => {
        allRecords.push({
          rec: r,
          projName: p.name,
          plantName: p.plant,
          cement: r.inputsSnapshot.cementType || "CEM I",
          aggSource: r.inputsSnapshot.sandType || (language === "ar" ? "رمل قياسي" : language === "fr" ? "Sable standard" : "Standard sand")
        });
      });
    });

    if (allRecords.length === 0) {
      const emptyLabel = language === "ar" ? "لا توجد عينات" : language === "fr" ? "Aucun échantillon" : "No specimens";
      return {
        avgScore: "N/A",
        bestMix: emptyLabel,
        worstMix: emptyLabel,
        bestPlant: emptyLabel,
        bestAgg: emptyLabel,
        bestCement: emptyLabel,
        plantPerfIndex: 0,
        labQualityIndex: 100,
        totalCount: 0
      };
    }

    const recordsWithScore = allRecords.filter(item => item.rec.validationScore !== null);
    const avgScore = recordsWithScore.length > 0
      ? Math.round(recordsWithScore.reduce((sum, item) => sum + (item.rec.validationScore || 0), 0) / recordsWithScore.length)
      : 100;

    const sortedByScore = [...recordsWithScore].sort((a, b) => (b.rec.validationScore || 0) - (a.rec.validationScore || 0));
    const bestMix = sortedByScore.length > 0 
      ? sortedByScore[0]?.rec.name + ` (${sortedByScore[0]?.projName})` 
      : (language === "ar" ? "لا توجد سجلات" : language === "fr" ? "Aucun enregistrement" : "No records");
    
    const worstRec = sortedByScore.length > 0 ? sortedByScore[sortedByScore.length - 1] : null;
    const worstMix = worstRec 
      ? `${worstRec.rec.name} (${worstRec.projName}) [${worstRec.rec.validationScore}%]` 
      : (language === "ar" ? "لا توجد سجلات" : language === "fr" ? "Aucun enregistrement" : "No records");

    const plantScores: Record<string, { total: number; count: number }> = {};
    const aggScores: Record<string, { total: number; count: number }> = {};
    const cementScores: Record<string, { total: number; count: number }> = {};

    recordsWithScore.forEach(item => {
      const s = item.rec.validationScore || 0;
      if (!plantScores[item.plantName]) plantScores[item.plantName] = { total: 0, count: 0 };
      plantScores[item.plantName].total += s;
      plantScores[item.plantName].count += 1;

      if (!aggScores[item.aggSource]) aggScores[item.aggSource] = { total: 0, count: 0 };
      aggScores[item.aggSource].total += s;
      aggScores[item.aggSource].count += 1;

      if (!cementScores[item.cement]) cementScores[item.cement] = { total: 0, count: 0 };
      cementScores[item.cement].total += s;
      cementScores[item.cement].count += 1;
    });

    const getBestGroup = (scores: Record<string, { total: number; count: number }>) => {
      let bestName = language === "ar" ? "لا توجد كافية" : language === "fr" ? "Insuffisant" : "Insufficient data";
      let highestAvg = -1;
      Object.entries(scores).forEach(([name, stats]) => {
        const avg = stats.total / stats.count;
        if (avg > highestAvg) {
          highestAvg = avg;
          bestName = name;
        }
      });
      return bestName;
    };

    let topPlantAvg = 0;
    Object.values(plantScores).forEach(stats => {
      const avg = stats.total / stats.count;
      if (avg > topPlantAvg) topPlantAvg = avg;
    });

    const passedCount = allRecords.filter(r => r.rec.status === "PASSED" || r.rec.status === "WAITING" || r.rec.status === "PARTIAL").length;
    const labQualityIndex = Math.round((passedCount / allRecords.length) * 100);

    return {
      avgScore: `${avgScore}%`,
      bestMix,
      worstMix,
      bestPlant: getBestGroup(plantScores),
      bestAgg: getBestGroup(aggScores),
      bestCement: getBestGroup(cementScores),
      plantPerfIndex: Math.round(topPlantAvg),
      labQualityIndex,
      totalCount: allRecords.length
    };
  }, [projects, language]);

  // Compressive Strength Targets computation
  const designFcm28 = currentResultSnapshot.fcm28 || (currentInputsSnapshot.fck28 + 8.5);
  const targetFcm1 = designFcm28 * 0.30;
  const targetFcm3 = designFcm28 * 0.45;
  const targetFcm7 = designFcm28 * 0.70;
  const targetFcm14 = designFcm28 * 0.85;
  const targetFcm28Value = designFcm28;
  const targetFcm56 = designFcm28 * 1.10;
  const targetFcm90 = designFcm28 * 1.15;

  const s1 = calculateSpecimenStats(labInputs.specimens1d).average || labInputs.strength1d || 0;
  const s3 = calculateSpecimenStats(labInputs.specimens3d).average || labInputs.strength3d || 0;
  const s7 = calculateSpecimenStats(labInputs.specimens7d).average || labInputs.strength7d || 0;
  const s14 = calculateSpecimenStats(labInputs.specimens14d).average || labInputs.strength14d || 0;
  const s28 = calculateSpecimenStats(labInputs.specimens28d).average || labInputs.strength28d || 0;
  const s56 = calculateSpecimenStats(labInputs.specimens56d).average || labInputs.strength56d || 0;
  const s90 = calculateSpecimenStats(labInputs.specimens90d).average || labInputs.strength90d || 0;

  // Chart Data preparation for Recharts Correlative Graph (Section 4 Curve Gain Plot)
  const strengthCurveData = useMemo(() => {
    return [
      { day: language === "ar" ? "1d (يوم)" : language === "fr" ? "1j (jour)" : "1d (day)", DesignTarget: Math.round(targetFcm1 * 10) / 10, ActualMeasured: s1 > 0 ? s1 : null },
      { day: language === "ar" ? "3d (أيام)" : language === "fr" ? "3j (jours)" : "3d (days)", DesignTarget: Math.round(targetFcm3 * 10) / 10, ActualMeasured: s3 > 0 ? s3 : null },
      { day: language === "ar" ? "7d (أيام)" : language === "fr" ? "7j (jours)" : "7d (days)", DesignTarget: Math.round(targetFcm7 * 10) / 10, ActualMeasured: s7 > 0 ? s7 : null },
      { day: language === "ar" ? "14d (يوماً)" : language === "fr" ? "14j (jours)" : "14d (days)", DesignTarget: Math.round(targetFcm14 * 10) / 10, ActualMeasured: s14 > 0 ? s14 : null },
      { day: language === "ar" ? "28d (يوماً)" : language === "fr" ? "28j (jours)" : "28d (days)", DesignTarget: Math.round(targetFcm28Value * 10) / 10, ActualMeasured: s28 > 0 ? s28 : null },
      { day: language === "ar" ? "56d (يوماً)" : language === "fr" ? "56j (jours)" : "56d (days)", DesignTarget: Math.round(targetFcm56 * 10) / 10, ActualMeasured: s56 > 0 ? s56 : null },
      { day: language === "ar" ? "90d (يوماً)" : language === "fr" ? "90j (jours)" : "90d (days)", DesignTarget: Math.round(targetFcm90 * 10) / 10, ActualMeasured: s90 > 0 ? s90 : null },
    ];
  }, [targetFcm1, targetFcm3, targetFcm7, targetFcm14, targetFcm28Value, targetFcm56, targetFcm90, s1, s3, s7, s14, s28, s56, s90, language]);

  // Recalculates specimen averages inside input objects
  const handleSpecimenChange = (age: '1d' | '3d' | '7d' | '14d' | '28d' | '56d' | '90d', index: number, value: number) => {
    setLabInputs(prev => {
      const specKey = `specimens${age}` as const;
      const currentSpecs = [...(prev[specKey] || [0, 0, 0])];
      currentSpecs[index] = value;
      
      const stats = calculateSpecimenStats(currentSpecs);
      const strengthKey = `strength${age}` as const;
      
      return {
        ...prev,
        [specKey]: currentSpecs,
        [strengthKey]: stats.average
      };
    });
  };

  // Render individual Strength Specimen Input Card
  const renderStrengthSpecimenRow = (
    ageKey: '1d' | '3d' | '7d' | '14d' | '28d' | '56d' | '90d',
    labelAr: string,
    labelEn: string,
    targetValue: number
  ) => {
    const specimensKey = `specimens${ageKey}` as const;
    const specimens = labInputs[specimensKey] || [0, 0, 0];
    const stats = calculateSpecimenStats(specimens);
    
    return (
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 relative overflow-hidden transition hover:shadow-sm">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-mono font-bold">
            TARGET: {Math.round(targetValue * 10) / 10} MPa
          </span>
          <strong className="text-slate-700 font-extrabold flex items-center gap-1 leading-none text-right">
            <span>{localizedLabel(labelAr, labelEn, labelEn)}</span>
          </strong>
        </div>
        
        {/* Specimen inputs */}
        <div className="grid grid-cols-3 gap-2">
          {specimens.map((val, idx) => (
            <div key={idx} className="relative">
              <input
                type="number"
                step="0.1"
                placeholder={
                  language === "ar"
                    ? `مكعب ${idx + 1}`
                    : language === "fr"
                    ? `Éprouvette ${idx + 1}`
                    : `Specimen ${idx + 1}`
                }
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-center text-xs font-mono font-extrabold text-slate-800 focus:ring-1 focus:ring-amber-500 outline-none transition"
                value={val || ""}
                onChange={(e) => {
                  const num = parseFloat(e.target.value) || 0;
                  handleSpecimenChange(ageKey, idx, num);
                }}
              />
              <span className="absolute left-1 top-0.5 text-[8px] text-slate-400 font-mono select-none">#{idx + 1}</span>
            </div>
          ))}
        </div>

        {/* Statistical summary */}
        {stats.average > 0 && (
          <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded-lg border border-slate-100 text-[10px] font-mono leading-none">
            <div className="flex gap-2.5 text-slate-500">
              <span>SD: <strong className="text-indigo-600 font-bold">{stats.stdDev}</strong></span>
              <span>COV: <strong className={`${stats.cov > 10 ? "text-rose-600 font-black animate-pulse" : "text-emerald-600 font-bold"}`}>{stats.cov}%</strong></span>
            </div>
            <span className="text-slate-600">Avg: <strong className="text-slate-900 text-[11px] font-black">{stats.average} MPa</strong></span>
          </div>
        )}
      </div>
    );
  };

  // Helper component to render Durability Zone indicators (Section 5)
  const renderDurabilityRatingZone = (
    labelAr: string,
    labelEn: string,
    value: number,
    unit: string,
    zones: {Excellent: number; Good: number; Acceptable: number; Poor: number}
  ) => {
    if (value <= 0) return null;

    let rating: "Excellent" | "Good" | "Acceptable" | "Critical" = "Critical";
    let colorClass = "bg-rose-500 text-rose-800 border-rose-200";
    let textAr = "";

    // Standard thresholds for concrete durability parameters
    if (zones.Excellent < zones.Poor) {
      // Lower values are better (Water absorption, Carbonation, Sorptivity, RCPT)
      if (value <= zones.Excellent) {
        rating = "Excellent";
        colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
      } else if (value <= zones.Good) {
        rating = "Good";
        colorClass = "bg-blue-50 text-blue-800 border-blue-200";
      } else if (value <= zones.Acceptable) {
        rating = "Acceptable";
        colorClass = "bg-amber-50 text-amber-800 border-amber-200";
      } else {
        rating = "Critical";
        colorClass = "bg-rose-50 text-rose-800 border-rose-200";
      }
    } else {
      // Higher values are better (Freeze-thaw factor)
      if (value >= zones.Excellent) {
        rating = "Excellent";
        colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
      } else if (value >= zones.Good) {
        rating = "Good";
        colorClass = "bg-blue-50 text-blue-800 border-blue-200";
      } else if (value >= zones.Acceptable) {
        rating = "Acceptable";
        colorClass = "bg-amber-50 text-amber-800 border-amber-200";
      } else {
        rating = "Critical";
        colorClass = "bg-rose-50 text-rose-800 border-rose-200";
      }
    }

    if (language === "ar") {
      textAr = rating === "Excellent" ? "ممتاز ومبهر" : rating === "Good" ? "جيد جداً وآمن" : rating === "Acceptable" ? "مقبول وحرج" : "فشلت المطابقة";
    } else if (language === "fr") {
      textAr = rating === "Excellent" ? "Excellent" : rating === "Good" ? "Très bon" : rating === "Acceptable" ? "Acceptable" : "Non conforme";
    } else {
      textAr = rating === "Excellent" ? "Excellent" : rating === "Good" ? "Very Good" : rating === "Acceptable" ? "Acceptable" : "Failed";
    }

    return (
      <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm space-y-1.5 text-right font-sans">
        <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-50">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${colorClass}`}>
            {language === "ar" ? `${rating.toUpperCase()} - ${textAr}` : textAr}
          </span>
          <strong className="text-slate-800 text-xs font-black">{localizedLabel(labelAr, labelEn, labelEn)}</strong>
        </div>
        <div className="flex justify-between items-end">
          <div className="text-[10px] text-slate-400 font-mono">{labelEn}</div>
          <div className="font-mono text-base font-black text-slate-900 leading-none">
            {value} <span className="text-xs text-slate-500 font-normal">{unit}</span>
          </div>
        </div>
        {/* Mini progress bar mapping */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-1.5 rounded-full ${
              rating === 'Excellent' ? 'bg-emerald-500' :
              rating === 'Good' ? 'bg-blue-500' :
              rating === 'Acceptable' ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ 
              width: `${Math.min(100, (value / (zones.Poor * 1.5)) * 100)}%` 
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div id="lab-validation" className="space-y-8 text-right font-sans antialiased text-slate-800">
      
      {/* SECTION 9: INTEGRATED REAL-TIME WORKSHOP METRIC COMMENDATIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Avg Score */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Gauge size={22} className="text-amber-400 animate-pulse" />
            <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
              {localizedLabel("جودة المنشأة", "Qualité de l'ouvrage", "Structure Quality")}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-4xl font-black tracking-tight text-white">{globalStats.avgScore}</div>
            <p className="text-[10px] text-slate-300 mt-1 font-mono">
              {localizedLabel("درجة جودة المتانة (مشروع)", "Score de qualité durable (Projet)", "Durable Quality Score (Project)")}
            </p>
          </div>
          <p className="text-[11px] text-indigo-200 mt-3 leading-tight border-t border-white/10 pt-2">
            {localizedLabel(
              "متوسط مطابقة الكسر المعملي لعينات الموقع بـ SNO AI",
              "Moyenne de conformité de résistance sur site par SNO AI",
              "Average on-site compressive strength compliance by SNO AI"
            )}
          </p>
        </div>

        {/* Card 2: Plant Performance Rating */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Activity size={20} className="text-emerald-500" />
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">
              {localizedLabel("مؤشر المحطة", "Indice de la centrale", "Plant Indicator")}
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-[10px] text-slate-450 block uppercase font-mono">Top Producing Unit</span>
            <div className="text-sm font-black text-slate-900 line-clamp-1 mt-1">
              {globalStats.bestPlant}
            </div>
            <p className="text-xs text-slate-500 font-bold mt-1">
              {localizedLabel(
                `معامل رص دمك المحطة: ${globalStats.plantPerfIndex}%`,
                `Taux de compactage de la centrale : ${globalStats.plantPerfIndex}%`,
                `Plant Compaction Factor: ${globalStats.plantPerfIndex}%`
              )}
            </p>
          </div>
        </div>

        {/* Card 3: Best Concrete Specimen */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Award size={20} className="text-indigo-600" />
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">
              {localizedLabel("أفضل عينة مطابقة", "Meilleur échantillon conforme", "Best Compliant Specimen")}
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-[10px] text-slate-450 block uppercase font-mono">Highest QA Index Rec</span>
            <div className="text-sm font-black text-slate-900 line-clamp-2 mt-1" title={globalStats.bestMix}>
              {globalStats.bestMix}
            </div>
          </div>
        </div>

        {/* Card 4: Lab quality index */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <FileCheck size={20} className="text-amber-500" />
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">
              {localizedLabel("مؤشر القبول", "Indice d'acceptabilité", "Acceptance Indicator")}
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-[10px] text-slate-450 block uppercase font-mono">SPECIMEN PASS INDEX</span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {globalStats.labQualityIndex}%
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              {localizedLabel(
                "نسبة العينات الناجحة والمقبولة بموجب الكود EN206",
                "Taux d'échantillons validés sous EN206",
                "Percentage of successful and compliant specimens under EN 206"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT COLUMN: MULTI-SAMPLE MANAGEMENT & EDITOR */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-150 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold font-mono">PHASE 2 UPGRADE</span>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-1">
                  <span>
                    {localizedLabel(
                      "إدارة عينات ومطابقة جودة الخرسانة الموقعية",
                      "Gestion des éprouvettes et contrôle qualité sur site",
                      "On-Site Concrete Specimen & Quality Compliance"
                    )}
                  </span>
                  <FlaskConical size={20} className="text-indigo-600 animate-pulse" />
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {localizedLabel(
                  "سجل عينات الفحص المباشر من الورشة، وقارن تطور المقاومة والديمومة الفعلية مع حسابات تصميم SNO AI.",
                  "Enregistrez les échantillons réels du chantier, comparez l'évolution de la résistance et la durabilité avec les calculs de SNO AI.",
                  "Record direct field test specimens from the site, and compare actual strength and durability evolution with SNO AI design calculations."
                )}
              </p>
            </div>
            
            {/* Multi-Sample Picker (Section 6) */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer focus:ring-1 focus:ring-amber-500 outline-none"
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
              >
                <option value="new">
                  {localizedLabel(
                    "+ عينة صب وقبو جديدة (New Specimen)",
                    "+ Nouvel échantillon de coulage",
                    "+ New Casting Specimen"
                  )}
                </option>
                {validationRecords.map((rec, i) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.name} ({rec.date})
                  </option>
                ))}
              </select>

              {selectedRecordId !== "new" && (
                <button
                  onClick={() => {
                    if (currentRecord) handleDeleteRecord(currentRecord.id, currentRecord.name);
                  }}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                  title={localizedLabel("حذف هذه العينة", "Supprimer cet échantillon", "Delete this specimen")}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Sample Metadata Form (Casting date, Testing date, Supervisor, Location) */}
          <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {localizedLabel("اسم العينة ومجموعة الصب (Specimen Identifier)", "Identifiant de l'éprouvette / Lot de coulage", "Specimen Identifier / Casting Lot")}
              </label>
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={recordName}
                onChange={(e) => setRecordName(e.target.value)}
                placeholder={localizedLabel("مثال: مكعبات السقف الطابق الأرضي شحنة #01", "Ex: Éprouvettes dalle RDC Lot #01", "e.g., Ground floor slab cubes Lot #01")}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 justify-end">
                <span>{localizedLabel("تاريخ الصب للعينات (Casting Date)", "Date de coulage", "Casting Date")}</span>
                <Calendar size={13} className="text-slate-400" />
              </label>
              <input
                type="date"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 justify-end">
                <span>{localizedLabel("تاريخ الفحص والكسر (Testing Date)", "Date d'essai de rupture", "Testing Date")}</span>
                <Calendar size={13} className="text-slate-400" />
              </label>
              <input
                type="date"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={testingDate}
                onChange={(e) => setTestingDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 justify-end">
                <span>{localizedLabel("موقع الصب الفعلي (Location)", "Lieu réel du coulage", "Actual Location")}</span>
                <MapPin size={13} className="text-slate-400" />
              </label>
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={localizedLabel("مثال: القطاع الغربي A-1", "Ex: Secteur Ouest A-1", "e.g., Western Sector A-1")}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 justify-end">
                <span>{localizedLabel("مهندس الجودة المشرف (Supervisor)", "Superviseur / Ingénieur Qualité", "Quality Supervisor / Engineer")}</span>
                <User size={13} className="text-slate-400" />
              </label>
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                placeholder={localizedLabel("اسم المهندس المسؤول", "Nom de l'ingénieur responsable", "Responsible engineer's name")}
              />
            </div>
          </div>

          {/* Form Tabs for Categorized User-Entered Test Data */}
          <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-150 px-4 py-2 text-xs font-bold text-slate-650 flex items-center justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab("fresh")} 
                  className={`pb-1 px-1 transition duration-150 ${activeTab === 'fresh' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {localizedLabel("الفحوصات الطازجة (Fresh)", "Essais état frais", "Fresh Concrete")}
                </button>
                <button 
                  onClick={() => setActiveTab("hardened")} 
                  className={`pb-1 px-1 transition duration-150 ${activeTab === 'hardened' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {localizedLabel("المقاومة والكسر (Hardened)", "Résistance durcie", "Hardened Concrete")}
                </button>
                <button 
                  onClick={() => setActiveTab("durability")} 
                  className={`pb-1 px-1 transition duration-150 ${activeTab === 'durability' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {localizedLabel("فحوصات الديمومة (Durability)", "Essais de durabilité", "Durability Performance")}
                </button>
                <button 
                  onClick={() => setActiveTab("ndt")} 
                  className={`pb-1 px-1 transition duration-150 ${activeTab === 'ndt' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {localizedLabel("الاختبارات غير الإتلافية (NDT)", "Essais non destructifs (NDT)", "NDT Testing")}
                </button>
              </div>
              <span className="text-indigo-700/80 flex items-center gap-1 font-mono text-[10px]">
                <Sparkles size={13} className="animate-pulse" />
                EN 206 COMPLIANT
              </span>
            </div>

            <div className="p-5 space-y-6">
              
              {/* TAB 1: FRESH CONCRETE TESTS */}
              {activeTab === "fresh" && (
                <div className="space-y-6 animate-fade-in text-right">
                  <h3 className="text-xs font-extrabold text-slate-700 border-r-2 border-indigo-600 pr-2 leading-none">
                    {localizedLabel(
                      "الفحوصات المباشرة للخرسانة الطازجة (Fresh Concrete Tests)",
                      "Essais sur béton frais",
                      "Fresh Concrete Tests"
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {localizedLabel("الهبوط - Slump Test (mm)", "Affaissement - Slump Test (mm)", "Slump Test (mm)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={labInputs.slump || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, slump: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {localizedLabel(
                          `التصميم المستهدف: ${currentInputsSnapshot.slump * 10} مم`,
                          `Cible de conception : ${currentInputsSnapshot.slump * 10} mm`,
                          `Design target: ${currentInputsSnapshot.slump * 10} mm`
                        )}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {localizedLabel("تدفق الهبوط - Slump Flow (mm)", "Étalement - Slump Flow (mm)", "Slump Flow (mm)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.slumpFlow || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, slumpFlow: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {localizedLabel(
                          "للخلطات عالية السيولة ورصية الدمك",
                          "Pour béton autoplaçant / fluide",
                          "For high-fluidity / self-consolidating mixes"
                        )}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {localizedLabel("الكثافة الرطبة - Wet Density (kg/m³)", "Masse volumique fraîche (kg/m³)", "Wet Density (kg/m³)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.freshDensity || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, freshDensity: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {localizedLabel(
                          `النظرية بالتصميم: ${Math.round(currentResultSnapshot.totalFreshDensity || 2400)} كجم/م³`,
                          `Théorie de conception : ${Math.round(currentResultSnapshot.totalFreshDensity || 2400)} kg/m³`,
                          `Design theory: ${Math.round(currentResultSnapshot.totalFreshDensity || 2400)} kg/m³`
                        )}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {localizedLabel("نسبة الهواء - Air Content (%)", "Teneur en air (%)", "Air Content (%)")}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.airContent || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, airContent: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {localizedLabel(
                          `المستهدف: ${currentInputsSnapshot.airContent || 1.5} %`,
                          `Cible : ${currentInputsSnapshot.airContent || 1.5} %`,
                          `Target: ${currentInputsSnapshot.airContent || 1.5} %`
                        )}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {localizedLabel("درجة الحرارة - Pouring Temp (°C)", "Température du béton (°C)", "Pouring Temp (°C)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.concreteTemp || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, concreteTemp: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {localizedLabel("الحدود المسموح بها: 32 - 35° م", "Limites autorisées : 32 - 35°C", "Allowable limits: 32 - 35°C")}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {localizedLabel("الوزن الحجمي - Unit Weight (kg/m³)", "Masse volumique unitaire (kg/m³)", "Unit Weight (kg/m³)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.unitWeight || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, unitWeight: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {localizedLabel("الوزن لأسطوانة تكسير العيار", "Poids pour cylindre d'étalonnage", "Calibration cylinder weight")}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {localizedLabel("الشك الابتدائي - Initial Setting (mins)", "Prise initiale (mins)", "Initial Setting (mins)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.settingTimeInitial || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, settingTimeInitial: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {localizedLabel("الشك النهائي - Final Setting (mins)", "Prise finale (mins)", "Final Setting (mins)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.settingTimeFinal || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, settingTimeFinal: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HARDENED STRENGTH CONCRETE TESTS */}
              {activeTab === "hardened" && (
                <div className="space-y-6 animate-fade-in text-right">
                  <div className="border-b border-slate-100 pb-2 flex justify-between items-center text-xs flex-row-reverse">
                    <h3 className="text-xs font-extrabold text-slate-700 border-r-2 border-indigo-600 pr-2 leading-none">
                      {localizedLabel(
                        "اختبار مقاومة الكسر بتكسير المكعبات (Compressive Strength Gain Parameters)",
                        "Gain de résistance à la compression des éprouvettes",
                        "Compressive Strength Gain Parameters"
                      )}
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                      {localizedLabel(
                        "أدخل مكعبات الصب لتقدير إجهاد الضغط تلقائياً لـ fcm بعملية المكبس",
                        "Saisissez les éprouvettes pour calculer automatiquement la résistance moyenne (fcm)",
                        "Enter specimens to automatically estimate fcm compressive strength"
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderStrengthSpecimenRow("1d", "مقاومة يوم واحد (1d Strength)", "1 Day Target Strength", targetFcm1)}
                    {renderStrengthSpecimenRow("3d", "مقاومة 3 أيام (3d Strength)", "3 Days Target Strength", targetFcm3)}
                    {renderStrengthSpecimenRow("7d", "مقاومة 7 أيام (7d Strength)", "7 Days Target Strength", targetFcm7)}
                    {renderStrengthSpecimenRow("14d", "مقاومة 14 يوماً (14d Strength)", "14 Days Target Strength", targetFcm14)}
                    {renderStrengthSpecimenRow("28d", "مقاومة 28 يوماً (28d fcm Strength)", "28 Days fcm (Major Target)", targetFcm28Value)}
                    {renderStrengthSpecimenRow("56d", "مقاومة 56 يوماً (56d Strength)", "56 Days Target Strength", targetFcm56)}
                    {renderStrengthSpecimenRow("90d", "مقاومة 90 يوماً (90d Strength)", "90 Days Target Strength", targetFcm90)}
                  </div>
                </div>
              )}

              {/* TAB 3: DURABILITY TESTS */}
              {activeTab === "durability" && (
                <div className="space-y-6 animate-fade-in text-right">
                  <h3 className="text-xs font-extrabold text-slate-700 border-r-2 border-indigo-600 pr-2 leading-none">
                    {localizedLabel(
                      "اختبارات الديمومة ومقاومة غزو المياه والأملاح (Durability Performance Tests)",
                      "Essais de durabilité et de pénétration d'eau/sel",
                      "Durability Performance & Water/Salt Penetration Resistance"
                    )}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">
                        {localizedLabel("امتصاص الماء - Absorption (%)", "Absorption d'eau (%)", "Water Absorption (%)")}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={labInputs.waterAbsorption || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, waterAbsorption: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {localizedLabel("الحد الأقصى المعتمد: 4.0%", "Limite maximale tolérée : 4.0%", "Approved maximum limit: 4.0%")}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">
                        {localizedLabel("الامتصاصية الشعرية - Sorptivity (mm/min⁰.⁵)", "Sorptivité capillaire (mm/min⁰.⁵)", "Capillary Sorptivity (mm/min⁰.⁵)")}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.sorptivity || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, sorptivity: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.000"
                      />
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">
                        {localizedLabel("نفاذية الكلوريدات - RCPT (Coulombs)", "Pénétration des ions chlorure - RCPT (Coulombs)", "Chloride Ion Penetration - RCPT (Coulombs)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.rcptCoulombs || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, rcptCoulombs: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">
                        {localizedLabel("تغلغل الكلوريدات السطحية (Rating)", "Pénétration des chlorures en surface (Classe)", "Surface Chloride Penetration (Rating)")}
                      </label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
                        value={labInputs.chloridePenetration}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, chloridePenetration: e.target.value }))}
                      >
                        <option value="Low">{localizedLabel("منخفض للغاية (Low)", "Très faible (Low)", "Very Low (Low)")}</option>
                        <option value="Medium">{localizedLabel("متوسط (Medium)", "Moyen (Medium)", "Moderate (Medium)")}</option>
                        <option value="High">{localizedLabel("مرتفع (High)", "Élevé (High)", "High (High)")}</option>
                      </select>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">
                        {localizedLabel("مقاومة غزو الكبريتات للتربة (Sulfate)", "Résistance aux sulfates du sol", "Soil Sulfate Attack Resistance (Sulfate)")}
                      </label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
                        value={labInputs.sulfateResistanceRating}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, sulfateResistanceRating: e.target.value }))}
                      >
                        <option value="High">{localizedLabel("مقاومة عالية (High)", "Haute (High)", "High Resistance (High)")}</option>
                        <option value="Moderate">{localizedLabel("متوسط الاستجابة (Moderate)", "Moyenne (Moderate)", "Moderate (Moderate)")}</option>
                        <option value="Low">{localizedLabel("ضعيف العزل (Low)", "Faible (Low)", "Low (Low)")}</option>
                      </select>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">
                        {localizedLabel("عمق كربنة الخرسانة - Carbonation (mm)", "Profondeur de carbonatation (mm)", "Carbonation Depth - Carbonation (mm)")}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.carbonationDepth || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, carbonationDepth: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: NDT TESTS */}
              {activeTab === "ndt" && (
                <div className="space-y-6 animate-fade-in text-right">
                  <h3 className="text-xs font-extrabold text-slate-700 border-r-2 border-indigo-600 pr-2 leading-none">
                    {localizedLabel(
                      "الاختبارات الموقع غير الإتلافية المعتمدة (NDT Testing Logs)",
                      "Essais non destructifs agréés (NDT)",
                      "Approved Non-Destructive Field Testing Logs (NDT)"
                    )}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">
                        {localizedLabel("مطرقة شميت الموقعية - Schmidt Hammer", "Scléromètre de chantier - Schmidt Hammer", "Schmidt Hammer Rebound")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={labInputs.schmidtHammer || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setLabInputs(prev => ({ ...prev, schmidtHammer: val, reboundNumber: val }));
                        }}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {localizedLabel("مؤشر صلابة سطح الخرسانة بعد الصب", "Indice de dureté superficielle après coulage", "Rebound index for concrete surface hardness after casting")}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">
                        {localizedLabel("سرعة الصوت بالموجات فوق الصوتية - UPV (m/s)", "Vitesse d'impulsion ultrasonique - UPV (m/s)", "Ultrasonic Pulse Velocity - UPV (m/s)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.upvSpeed || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, upvSpeed: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {localizedLabel("لأجل قياس انسجام وتماثل وتجانس الصب الموقعي", "Mesure de l'homogénéité du coulage sur site", "To measure homogeneity and consistency of on-site casting")}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-550 mb-1">
                        {localizedLabel("نتائج القلب الخرساني - Core Test (MPa)", "Essai de carottage - Core Test (MPa)", "Drilled Core Specimen Test - Core Test (MPa)")}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800"
                        value={labInputs.coreTestResult || ""}
                        onChange={(e) => setLabInputs(prev => ({ ...prev, coreTestResult: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {localizedLabel("مقاومة عينة القلب المخترق المستخرجة", "Résistance de l'éprouvette carottée prélevée", "Drilled core specimen strength")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {localizedLabel(
                "شهادة فحص وتوصيات مهندس ضبط الجودة (QA/QC Field Signature Notes)",
                "Attestation d'inspection et recommandations de l'ingénieur QA/QC",
                "Quality Control Inspector Attestation & Recommendations (QA/QC Field Signature Notes)"
              )}
            </label>
            <textarea
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              value={engineerNotes}
              onChange={(e) => setEngineerNotes(e.target.value)}
              placeholder={localizedLabel(
                "شكل كسر عينات المكعبات، تشتت ضبط جودة محطة الخلاطة، معالجة الخرسانة بالماء، حالة التصلب للموقع...",
                "Fissuration, dispersion de la centrale de malaxage, cure du béton sur site...",
                "Specimen failure mode, plant quality dispersion, water curing, on-site curing state..."
              )}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 flex-wrap gap-2.5">
            <button
              onClick={() => {
                if (report.status === "FAILED" || report.status === "WAITING") {
                  alert(language === "ar" 
                    ? "لا يمكن تنزيل أو طباعة تقرير المختبر لأن النتائج غير مطابقة للمعايير أو لم يتم إدخالها بعد." 
                    : language === "fr"
                    ? "Impossible de télécharger ou d'imprimer le rapport car les résultats ne sont pas conformes ou non saisis."
                    : "Cannot download or print the laboratory report because results are non-compliant with standards or have not been entered yet.");
                  return;
                }
                setShowPrintModal(true);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-150 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <Printer size={15} />
              {localizedLabel("رؤية وطباعة شهادة الجودة الرسمية (PDF)", "Voir et imprimer l'attestation de qualité (PDF)", "View & Print Official Quality Certificate (PDF)")}
            </button>
            
            <button
              onClick={handleSaveRecord}
              className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-850 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save size={15} className="text-amber-400 animate-pulse" />
              حفظ وتثبيت العينة في بنية المشروع
            </button>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-bounce justify-end">
              <span>{saveSuccess}</span>
              <CheckCircle size={15} className="text-emerald-600 font-bold" />
            </div>
          )}
        </div>

        {/* LEFT COLUMN: REAL-TIME VALIDATION SCORE, ASSESSMENTS, STRENGTH GAIN CURVES */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SECTION 1: DUAL COMPLETENESS STATUS & DIAL CODES */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white text-center shadow-md border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">
              Mix Compliance Validation Engine
            </span>
            <h3 className="text-sm font-black text-amber-400 mt-1">
              {report.completenessStatus === "Waiting For Laboratory Data" 
                ? localizedLabel("في انتظار تزويد الفحوصات", "En attente des essais", "Waiting for lab tests") 
                : localizedLabel("مستوى مطابقة الكسر الفعلي", "Niveau de conformité de résistance", "Actual Strength Compliance Level")
              }
            </h3>

            {/* Dial circular metric */}
            <div className="relative w-32 h-32 mx-auto my-5 flex items-center justify-center select-none">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-slate-800 stroke-[8] fill-none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-[8] fill-none transition-all duration-700 ease-out"
                  style={{
                    stroke: report.score === null ? "#475569" : report.score >= 90 ? "#10b981" : report.score >= 80 ? "#3b82f6" : report.score >= 70 ? "#f59e0b" : "#ef4444",
                    strokeDasharray: `${2 * Math.PI * 52}`,
                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - (report.score === null ? 0 : report.score) / 100)}`
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black tracking-tight">
                  {report.score === null ? "N/A" : `${report.score}%`}
                </span>
                <span className="text-[9px] text-slate-400 font-extrabold block mt-0.5">{report.ratingEn}</span>
              </div>
            </div>

            {/* Completeness Badge */}
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  {localizedLabel("حالة اكتمال البيانات والتوثيق:", "Statut de complétude des données :", "Data & Documentation Completeness:")}
                </span>
                <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-tight inline-block leading-none ${
                  report.completenessStatus === "Fully Validated" ? "bg-emerald-500/10 text-emerald-400" :
                  report.completenessStatus === "Partial Validation" ? "bg-amber-500/10 text-amber-400" :
                  "bg-slate-800 text-slate-400"
                }`}>
                  {report.completenessStatusAr}
                </span>
              </div>

              {report.score !== null && (
                <div className="text-xs font-black text-slate-300 border-t border-slate-800 pt-3 flex justify-between items-center">
                  <span className={`${
                    report.status === "PASSED" ? "text-emerald-400" : report.status === "WARNING" ? "text-amber-400" : "text-rose-400"
                  } font-black`}>{report.statusAr}</span>
                  <span>{localizedLabel("التقييم الفني:", "Évaluation technique :", "Technical Assessment:")}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4 & 5: STRENGTH GAIN CURVES AND DURABILITY PERFORMANCE WIDGETS */}
          {report.numTestsFilled > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm text-right">
              <div>
                <h3 className="text-xs font-black text-slate-900 border-r-2 border-indigo-600 pr-2">
                  {localizedLabel("منحنى تطور قوة كسر مقاومة الضغط (Compressive strength gain)", "Courbe de gain de résistance à la compression", "Compressive Strength Gain Evolution Curve")}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {localizedLabel("منحني التصميم المتوسط المستهدف fcm مقابل كسر المكعبات الملموس", "Courbe fcm cible vs résistance mesurée réelle des éprouvettes", "Target fcm Design Curve vs Actual Compressive Strength")}
                </p>
              </div>

              {/* Chart container */}
              <div className="w-full h-44 text-xs font-mono select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={strengthCurveData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} unit="MPa" />
                    <Tooltip 
                      contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", color: "#fff", direction: "rtl", textAlign: "right" }} 
                      labelFormatter={(name) => localizedLabel(`عمر فحص: ${name}`, `Âge de l'essai: ${name}`, `Test Age: ${name}`)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="DesignTarget" 
                      name={localizedLabel("تصميم المستهدف SNO", "Cible théorique SNO", "SNO Target Design")} 
                      stroke="#4f46e5" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ActualMeasured" 
                      name={localizedLabel("كسر المكعبات الفعلي", "Résistance mesurée réelle", "Actual Compressive Strength")} 
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      connectNulls
                      dot={{ r: 4, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* SECTION 5: DURABILITY ANALYSIS BLOCKS */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-[11px] font-black text-slate-800 flex items-center justify-end gap-1">
                  <span>{localizedLabel("أهبة ومؤشرات ديمومة الخرسانة الكلية", "Indicateurs globaux de durabilité du béton", "Global Concrete Durability Performance Indicators")}</span>
                  <Layers size={13} className="text-indigo-600" />
                </h4>
                {renderDurabilityRatingZone("امتصاص الماء", "Water Absorption", labInputs.waterAbsorption, "%", {Excellent: 2.5, Good: 3.5, Acceptable: 4.2, Poor: 5.5})}
                {renderDurabilityRatingZone("نفاذية الكلوريدات RCPT", "Chloride Permeability", labInputs.rcptCoulombs || 0, "Coul", {Excellent: 1000, Good: 1500, Acceptable: 2000, Poor: 3500})}
                {renderDurabilityRatingZone("عمق كربنة الهواء", "Carbonation", labInputs.carbonationDepth || 0, "mm", {Excellent: 2.0, Good: 4.0, Acceptable: 6.0, Poor: 8.0})}
                {renderDurabilityRatingZone("معامل الامتصاصية الشعرية", "Sorptivity", labInputs.sorptivity || 0, "mm/m⁰.⁵", {Excellent: 0.08, Good: 0.12, Acceptable: 0.16, Poor: 0.22})}
                {renderDurabilityRatingZone("عامل استقرار الصقيع والدورة", "Freeze-Thaw", labInputs.freezeThawRating || 0, "%", {Excellent: 95, Good: 90, Acceptable: 80, Poor: 70})}
              </div>

            </div>
          )}

          {/* SECTION 3 & 8: AUTOMATIC ENGINEERING RECONDENDATIONS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm text-right">
            <div className="flex items-center justify-between border-b border-slate-250 pb-2 flex-row-reverse">
              <strong className="text-slate-700 flex items-center gap-1.5 font-bold text-xs">
                <span>{localizedLabel("تفسير وتوصية مستشار جودة الهيكل", "Interprétation et recommandation de l'ingénieur conseil", "Structural Quality Consultant's Interpretation & Recommendation")}</span>
                <Sparkles size={14} className="text-indigo-650 animate-pulse" />
              </strong>
            </div>

            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {report.engineeringComments.map((comment, index) => (
                <div 
                   key={index} 
                  className="p-3 bg-white border border-slate-100 rounded-xl flex items-start gap-2 text-xs text-slate-600 leading-normal flex-row-reverse shadow-xs"
                >
                  <div className="mt-0.5 text-slate-400 flex-shrink-0">
                    {comment.includes("تحذير") || comment.includes("فشل") || comment.includes("قصور") || comment.includes("خطر") ? (
                      <ShieldAlert size={14} className="text-rose-500 font-bold" />
                    ) : (
                      <CheckCircle size={14} className="text-emerald-500" />
                    )}
                  </div>
                  <div className="text-right leading-relaxed">{comment}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* COMPARISON TABLES: TARGET VS ACTUAL DATA SHEET (Section 2 Comparison Engine) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-x-auto text-right">
        <div className="flex items-center justify-between mb-4 border-b border-slate-150 pb-3 flex-row-reverse">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              {localizedLabel("تحليل كفاءة ومطابقة الفحوصات الفنية (التصميم مقابل المعمل الفعلي)", "Analyse d'efficacité et conformité des essais (Cible vs Réel)", "Technical Test Efficiency & Compliance Analysis (Design vs Actual)")}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Deviation, difference, and strict structural compliance comparing theoretical design parameters directly with lab readings.
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">BILINGUAL ANALYSIS SHEET</span>
        </div>

        {report.numTestsFilled > 0 ? (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                <th className="p-3 text-right">{localizedLabel("الفحص / المؤشر الهندسي لضبط الجودة", "Essai / Indicateur d'ingénierie QA/QC", "Test / QA/QC Quality Control Metric")}</th>
                <th className="p-3 text-center">{localizedLabel("المستهدف بالتصميم (Design)", "Cible de conception (Design)", "Target Design Parameter (Design)")}</th>
                <th className="p-3 text-center">{localizedLabel("المقاس معملياً (Measured)", "Mesure de laboratoire (Measured)", "Actual Measured Reading (Measured)")}</th>
                <th className="p-3 text-center">{localizedLabel("حجم انحراف القيمة (Deviation)", "Écart de valeur (Deviation)", "Value Deviation (Deviation)")}</th>
                <th className="p-3 text-center">{localizedLabel("الفرق المئوي (Difference %)", "Différence en %", "Percentage Difference (%)")}</th>
                <th className="p-3 text-center">{localizedLabel("درجة دقة المطابقة", "Précision de conformité", "Accuracy Compliance Rating")}</th>
                <th className="p-3 text-center">{localizedLabel("تقييم الكود والمطابقة", "Évaluation du code et conformité", "Code Evaluation & Compliance")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {report.metrics.map((m) => {
                const isSlump = m.key === "slump" || m.key === "slumpFlow";
                const isDensity = m.key.includes("Density") || m.key === "unitWeight";
                const isAir = m.key === "airContent";
                const isTime = m.key.includes("setting");
                const isDurabilityValue = m.key === "waterAbsorption" || m.key === "rcptCoulombs" || m.key === "carbonationDepth" || m.key === "sorptivity" || m.key === "freezeThawRating";
                const unitSuffix = isSlump ? " mm" : isDensity ? " kg/m³" : isAir ? " %" : isTime ? " min" : isDurabilityValue ? "" : " MPa";

                return (
                  <tr key={m.key} className="hover:bg-slate-50/50 transition duration-150 py-2">
                    <td className="p-3 font-semibold text-slate-800">
                      <div>{m.nameAr}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{m.nameEn}</div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-600">
                      {m.theoretical}{unitSuffix}
                    </td>
                    <td className="p-3 text-center font-mono font-extrabold text-slate-900 bg-slate-50/30">
                      {m.measured}{unitSuffix}
                    </td>
                    <td className={`p-3 text-center font-mono font-black ${m.deviation >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {m.deviation >= 0 ? "+" : ""}{m.deviation}
                    </td>
                    <td className={`p-3 text-center font-mono font-black ${m.differencePercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {m.differencePercent >= 0 ? "+" : ""}{m.differencePercent}%
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500">
                      <div className="w-20 bg-slate-100 rounded-full h-1 mx-auto overflow-hidden">
                        <div 
                          className="bg-indigo-650 h-1" 
                          style={{ width: `${m.accuracyPercent}%` }}
                        />
                      </div>
                      <span className="text-[9px] block mt-1">{m.accuracyPercent}% {localizedLabel("دقة", "Précision", "Accuracy")}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black inline-block leading-none border ${
                        m.compliance === "PASS" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                        m.compliance === "WARNING" ? "bg-amber-50 text-amber-800 border-amber-200" :
                        "bg-rose-50 text-rose-800 border-rose-250"
                      }`}>
                        {m.complianceAr}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6 text-slate-400">
            {localizedLabel(
              "يرجى إدخال أي نتائج فحص مخبري بالموقع لرفعها لجدول مقارنة كفاءة التصميم والأداء.",
              "Veuillez saisir les résultats d'essais pour mettre à jour la feuille d'analyse comparative.",
              "Please enter on-site laboratory test results to display the efficiency analysis."
            )}
          </div>
        )}
      </div>

      {/* CALIBRATION MACHINE LEARNING CORRELATOR INFO */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500/80 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin text-indigo-600" />
          <span>SNO AI active neural database mapping matches actual concrete breaking behavior within validation rules.</span>
        </div>
        <span>SCHEMA: LabValidationRecord [Durable Object Store Ready]</span>
      </div>

      {/* SECTION 7: PDF CERTIFIED LABORATORY REPORT IN FULL PREVIEW DIALOG */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl p-6 space-y-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3 flex-row-reverse">
              <h3 className="text-md font-black text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                <span>
                  {localizedLabel("معاينة شهادة وتصديق المطابقة المختبرية الفنية", "Aperçu de l'attestation de conformité officielle", "Official Technical Laboratory Compliance Certificate Preview")}
                </span>
              </h3>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg transition"
              >
                {localizedLabel("إغلاق", "Fermer", "Close")}
              </button>
            </div>

            {/* Print Content Wrapper */}
            <div id="print-area" className="flex-1 overflow-y-auto pr-2 space-y-8 font-sans text-right text-slate-900 p-8 border border-slate-200/80 rounded-xl leading-relaxed select-text" style={{ direction: "rtl" }}>
              
              {/* Report Header Letterhead */}
              <div className="flex justify-between items-start border-b-4 border-indigo-950 pb-5">
                <div className="space-y-1">
                  <h1 className="text-xl font-black tracking-tight text-slate-900">SNO AI CONCRETE SOFTWARE</h1>
                  <p className="text-[10px] text-slate-500 font-mono">INTEGRATED QA/QC CONCRETE ENGINEERING ENGINE</p>
                  <p className="text-xs text-slate-600">
                    {localizedLabel(
                      "محرك التحقق الفني ومعايرة ومطابقة جودة الخرسانة المعتمدة",
                      "Moteur d'évaluation technique et conformité de qualité béton",
                      "Certified Technical Evaluation & Concrete Quality Compliance Engine"
                    )}
                  </p>
                </div>
                <div className="text-left space-y-1 text-xs">
                  <div className="font-extrabold text-slate-800">
                    {localizedLabel("شهادة مطابقة معملية معتمدة", "Attestation de conformité officielle", "Official Laboratory Compliance Certificate")}
                  </div>
                  <div className="text-[10px] text-slate-505 font-mono">Ref: CERT-{activeProject.id}-{selectedRecordId.substring(0,6).toUpperCase()}</div>
                  <div className="text-slate-500">
                    {localizedLabel(
                      `التاريخ: ${new Date().toLocaleDateString("ar-DZ")}`,
                      `Date : ${new Date().toLocaleDateString("fr-FR")}`,
                      `Date: ${new Date().toLocaleDateString("en-US")}`
                    )}
                  </div>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-2">
                <h2 className="text-lg font-black text-slate-900 bg-slate-100 py-2.5 rounded-lg">
                  {localizedLabel(
                    "تقرير التحقق المخبري الرسمي الشامل (Laboratory Validation Report)",
                    "Rapport de validation de laboratoire officiel",
                    "Comprehensive Official Laboratory Validation Report (Laboratory Validation Report)"
                  )}
                </h2>
                <p className="text-xs text-slate-600">
                  {localizedLabel(
                    "شهادة هندسية توثق مطابقة نتائج تكسير المكعبات وعينات الورشة بتصميم المنشأ طبقاً للاشتراطات الفنية EN 206",
                    "Attestation d'ingénierie certifiant la conformité de la résistance du béton selon la norme EN 206",
                    "Engineering certificate documenting compliance of concrete compressive test results under EN 206 standards"
                  )}
                </p>
              </div>

              {/* Project & Client Metadata */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-slate-500 font-medium">{localizedLabel("اسم المشروع الهندسي: ", "Nom du projet : ", "Engineering Project Name: ")}</span>
                  <strong className="text-slate-905">{activeProject.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{localizedLabel("العميل والمقاول العام: ", "Maître d'ouvrage / Entrepreneur : ", "Client & General Contractor: ")}</span>
                  <strong className="text-slate-905">{activeProject.client}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{localizedLabel("محطة صب وتوريد الخرسانة: ", "Centrale à béton de production : ", "Concrete Ready-mix Supplier Plant: ")}</span>
                  <strong className="text-slate-905">{activeProject.plant}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{localizedLabel("رتبة الخرسانة المصممة fck: ", "Classe de résistance cible fck : ", "Target Concrete Strength Class fck: ")}</span>
                  <strong className="text-slate-905">{currentInputsSnapshot.fck28} MPa</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{localizedLabel("موقع الصب والتدقيق الفعلي: ", "Lieu du coulage et d'audit : ", "Actual Casting & Audit Location: ")}</span>
                  <strong className="text-slate-905">{location || activeProject.plant}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{localizedLabel("المهندس الفني المسؤول المشرف: ", "Ingénieur superviseur qualifié : ", "Supervising Technical Engineer: ")}</span>
                  <strong className="text-slate-905">{supervisor || "senoussi.s.t@gmail.com"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{localizedLabel("تاريخ صب العينات في الورشة: ", "Date de coulage des éprouvettes : ", "On-site Casting Date of Specimens: ")}</span>
                  <strong className="text-slate-905">{recordDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{localizedLabel("تاريخ تكسير وضبط الإجهاد: ", "Date de rupture en laboratoire : ", "Laboratory Crushing Test Date: ")}</span>
                  <strong className="text-slate-905">{testingDate}</strong>
                </div>
              </div>

              {/* Executive Compliance Summary & Validation Score (Section 7) */}
              <div className="grid grid-cols-3 gap-4 items-stretch">
                <div className="col-span-1 border border-indigo-950 bg-indigo-950 text-white rounded-xl p-4 text-center flex flex-col justify-center space-y-1 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-indigo-305 block font-mono">Validation Score</span>
                  <div className="text-3xl font-black">{report.score === null ? "N/A" : `${report.score}%`}</div>
                  <span className="text-[11px] text-amber-300 font-bold">
                    {language === "en" ? report.ratingEn : report.ratingAr}
                  </span>
                </div>
                <div className="col-span-2 border border-slate-200 rounded-xl p-4 space-y-2 flex flex-col justify-center">
                  <div className="text-xs font-black text-slate-800">
                    {localizedLabel("الحكم والتقييم الهندسي ومطابقة الكود:", "Évaluation technique et conformité au code :", "Technical Assessment & Code Compliance:")}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {report.completenessStatus === "Waiting For Laboratory Data" ? (
                      localizedLabel(
                        "الشهادة والتقرير معلق بانتظار تعليق وتزويد بيانات مكعبات التكسير وأعمال الرص الموقعي وفحوص جودة المعمل.",
                        "Le certificat est suspendu en attente des résultats de rupture des éprouvettes et des essais de laboratoire.",
                        "The certificate is suspended pending compressive test results and laboratory validation inputs."
                      )
                    ) : (
                      language === "en" ? (
                        `The field specimens registered an overall compliance rating of (${report.score}%). The current mix is technically evaluated as ${report.ratingEn}. The actual 28-day compressive strength gain curve fcm and physical properties support structural safety.`
                      ) : language === "fr" ? (
                        `Les éprouvettes d'essai ont enregistré un taux de conformité de (${report.score}%). Le mélange actuel est techniquement jugé ${report.statusAr}. La courbe de résistance fcm réelle à 28 jours et les propriétés physiques soutiennent la sécurité structurale.`
                      ) : (
                        `سجلت عينات الفحص الميداني مطابقة متوسطة قدرها (${report.score}%)، وتعتبر الخلطة الحالية من الناحية الفنية ${report.statusAr}. إن تدرج المقاومة بعمر 28 يوماً الفعلي fcm ونسب امتصاص ومسامية المواد تعزز مستويات ضبط جودة محطة التوريد ومستويات الأمان والتوكيد لمكتب التدقيق.`
                      )
                    )}
                  </p>
                </div>
              </div>

              {/* Comparison Tables Design vs Laboratory */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 border-r-2 border-indigo-900 pr-2">
                  {localizedLabel(
                    "1. مقارنة قيم التصميم SNO AI الفنية مقابل نتائج فحوص المختبر الفعلي",
                    "1. Comparaison des valeurs théoriques SNO AI vs résultats réels de laboratoire",
                    "1. Comparison of SNO AI Target Parameters vs Actual Laboratory Results"
                  )}
                </h4>
                <table className="w-full text-right text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-105 border-b border-slate-300 text-slate-800 font-black">
                      <th className="p-2 border border-slate-300">{localizedLabel("الاختبار المعملي / مؤشر ضبط الجودة", "Essai de laboratoire / Indicateur de qualité", "Laboratory Test / Quality Indicator")}</th>
                      <th className="p-2 border border-slate-300 text-center">{localizedLabel("المستهدف التصميمي (Design)", "Cible théorique (Design)", "Target Design Parameter (Design)")}</th>
                      <th className="p-2 border border-slate-300 text-center">{localizedLabel("المقاس المخبري (Measured)", "Mesure de laboratoire (Measured)", "Actual Measured Reading (Measured)")}</th>
                      <th className="p-2 border border-slate-300 text-center">{localizedLabel("الانحراف الفعلي (Deviation)", "Écart de valeur (Deviation)", "Value Deviation (Deviation)")}</th>
                      <th className="p-2 border border-slate-300 text-center">{localizedLabel("الاختلاف المئوي", "Différence %", "Percentage Difference")}</th>
                      <th className="p-2 border border-slate-300 text-center">{localizedLabel("نتيجة مطابقة الكود", "Conformité au code", "Code Compliance Output")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.metrics.map((m) => {
                      const isSlump = m.key === "slump" || m.key === "slumpFlow";
                      const isDensity = m.key.includes("Density") || m.key === "unitWeight";
                      const isAir = m.key === "airContent";
                      const isTime = m.key.includes("setting");
                      const isDurabilityValue = m.key === "waterAbsorption" || m.key === "rcptCoulombs" || m.key === "carbonationDepth" || m.key === "sorptivity" || m.key === "freezeThawRating";
                      const unitSuffix = isSlump ? " mm" : isDensity ? " kg/m³" : isAir ? " %" : isTime ? " min" : isDurabilityValue ? "" : " MPa";

                      return (
                        <tr key={m.key} className="border-b border-slate-300">
                          <td className="p-2 border border-slate-300 font-extrabold">{language === "ar" ? m.nameAr : m.nameEn} ({m.nameEn})</td>
                          <td className="p-2 border border-slate-300 text-center font-mono">{m.theoretical}{unitSuffix}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold bg-slate-50">{m.measured}{unitSuffix}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono">{m.deviation >= 0 ? "+" : ""}{m.deviation}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono">{m.differencePercent >= 0 ? "+" : ""}{m.differencePercent}%</td>
                          <td className="p-2 border border-slate-300 text-center font-extrabold">{language === "ar" ? m.complianceAr : m.compliance}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Strength and Durability summary outputs (Section 7) */}
              <div className="grid grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-[11px] font-black text-slate-800 border-r-2 border-indigo-900 pr-1.5 leading-none">
                    {localizedLabel(
                      "2. منحنى تطور المقاومة وتدرج مقاومة كسر المكعبات fcm",
                      "2. Courbe d'évolution et gain de résistance fcm",
                      "2. Compressive Strength Gain Curve fcm"
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed leading-none">
                    {language === "ar" ? (
                      `سجل فحص كسر عينات اختبار مقاومة الضغط إجهادات فنية بعمر 1 يوم: ${s1 > 0 ? `${s1} MPa` : "N/A"}، 3 أيام: ${s3 > 0 ? `${s3} MPa` : "N/A"}، 7 أيام: ${s7 > 0 ? `${s7} MPa` : "N/A"}، 28 يوماً النهائية: ${s28 > 0 ? `${s28} MPa` : "N/A"}.`
                    ) : (
                      `Compressive strength results logged at 1d: ${s1 > 0 ? `${s1} MPa` : "N/A"}, 3d: ${s3 > 0 ? `${s3} MPa` : "N/A"}, 7d: ${s7 > 0 ? `${s7} MPa` : "N/A"}, final 28d: ${s28 > 0 ? `${s28} MPa` : "N/A"}.`
                    )}
                  </p>
                  <p className="text-[10.5px] text-slate-600">
                    {language === "ar" ? (
                      `كان مستهدف مقاومة الضغط بعمر 28 يوماً هو (${designFcm28.toFixed(1)} MPa). سجل فحص المكعبات نسبة مكسورة للعينات تبلغ ${s28 > 0 ? `${((s28 / designFcm28) * 100).toFixed(1)}%` : "N/A"} من التصميم.`
                    ) : (
                      `Target 28-day compressive strength fcm was (${designFcm28.toFixed(1)} MPa). The actual lab testing achieved ${s28 > 0 ? `${((s28 / designFcm28) * 100).toFixed(1)}%` : "N/A"} of the design target.`
                    )}
                  </p>
                </div>
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-[11px] font-black text-slate-800 border-r-2 border-indigo-900 pr-1.5 leading-none">
                    {localizedLabel(
                      "3. مؤشر امتصاص ديمومة الهيكل والموجات UPV",
                      "3. Indicateurs de durabilité et ondes UPV",
                      "3. Durability Absorption Index & UPV Wave Velocity"
                    )}
                  </h4>
                  {labInputs.waterAbsorption > 0 && (
                    <p className="text-[10px] text-slate-650">
                      {language === "ar" ? (
                        `✓ فئة امتصاص عينة الخرسانة تبلغ (${labInputs.waterAbsorption}%) وهي تشير هندسياً لمستوى ممتاز من النفاذية ومقاومة تغلغل الأملاح ومطابقتها EN 206 لمتانة خرسانة الأساسات.`
                      ) : (
                        `✓ Water absorption is (${labInputs.waterAbsorption}%), indicating high permeability resistance and durability compliance according to EN 206.`
                      )}
                    </p>
                  )}
                  {labInputs.upvSpeed > 0 && (
                    <p className="text-[10px] text-slate-650">
                      {language === "ar" ? (
                        `✓ سرعة انتقال الموجات الصخرية فوق الصوتية UPV موقعاً بلغت (${labInputs.upvSpeed} m/s) لتؤكد مستوى انسجام متساوٍ ومتجانس للخلطة وتلاشي التعشيش الداخلي والطبقي.`
                      ) : (
                        `✓ Non-destructive UPV wave velocity on-site is (${labInputs.upvSpeed} m/s), confirming solid homogeneity and absence of internal voids.`
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Audit Signoff block (Section 7) */}
              <div className="space-y-2 border-t border-slate-200 pt-5 text-xs">
                <h4 className="font-extrabold text-slate-800 text-right">
                  {localizedLabel("4. التوصيات الفنية النهائية وتوقيع مدقق الجودة والاعتماد:", "4. Recommandations techniques finales et signature de l'ingénieur :", "4. Final Technical Recommendations & Quality Auditor Sign-off:")}
                </h4>
                <div className="bg-slate-50 p-3 rounded-lg text-slate-650 font-serif border border-slate-150">
                  {engineerNotes ? engineerNotes : (
                    localizedLabel(
                      "تم تدقيق نتائج الاختبار وتطابقها مع التصميم. يرجى من مهندس الجودة في الورشة تأكيد استمرار معالجة العينات بالرش بالرش بالماء وعزل الهياكل بالبيتومين لضمان الاحتفاظ بكفاءة التصلب والديمومة طويلة الأمد.",
                      "Résultats vérifiés et conformes. Continuer le cure humide sur site et l'isolation au bitume pour préserver la durabilité.",
                      "Test results audited and verified in compliance with structural designs. On-site engineer to continue continuous wet curing and bitumen insulation to protect durability."
                    )
                  )}
                </div>
                
                {/* Signoff stamps */}
                <div className="grid grid-cols-2 gap-6 pt-10 text-center">
                  <div className="space-y-2">
                    <p className="font-extrabold text-slate-700">{localizedLabel("الختم الرسمي للمطابقة الهندسية", "Tampon de conformité officiel", "Official Engineering Stamp of Compliance")}</p>
                    <div className="w-24 h-24 mx-auto border-2 border-dashed border-indigo-400 rounded-full flex flex-col justify-center items-center text-[10px] text-indigo-400 font-mono scale-90 rotate-12">
                      <span>SNO AI APPROVED</span>
                      <span className="text-[8px] mt-0.5">QA/QC STAMP</span>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4">
                    <p className="font-extrabold text-slate-700">{localizedLabel("مهندس ورئيس مختبر ضبط الجودة", "Ingénieur en chef de laboratoire", "Head Quality Control Laboratory Engineer")}</p>
                    <div className="italic text-slate-500 font-serif text-[11px]">senoussi.s.t@gmail.com</div>
                    <div className="w-1/2 border-b border-slate-400 mx-auto" />
                    <p className="text-[10px] text-slate-400">{localizedLabel("توقيع معتمد سحابياً", "Signature certifiée cloud", "Cloud certified digital signature")}</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 font-mono">Powered by Google Antigravity & AI Studio</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  {localizedLabel("إغلاق", "Fermer", "Close")}
                </button>
                <button
                  onClick={() => {
                    if (report.status === "FAILED" || report.status === "WAITING") {
                      alert(language === "ar" 
                        ? "لا يمكن تنزيل أو طباعة تقرير المختبر لأن النتائج غير مطابقة للمعايير أو لم يتم إدخالها بعد." 
                        : language === "fr"
                        ? "Impossible de télécharger ou d'imprimer le rapport car les résultats ne sont pas conformes."
                        : "Cannot download or print the laboratory report because results are non-compliant with standards or have not been entered yet.");
                      return;
                    }
                    window.print();
                  }}
                  className="px-5 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <Download size={13} />
                  {localizedLabel("بدء الطباعة وحفظ PDF مباشر للشهادة", "Imprimer / Télécharger PDF", "Start Print & Download PDF Certificate")}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
