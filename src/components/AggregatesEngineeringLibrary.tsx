import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Heart, 
  RefreshCw, 
  Layers, 
  MapPin, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  FileText, 
  CheckCircle, 
  HelpCircle, 
  Info, 
  ArrowLeftRight, 
  Calendar, 
  User, 
  ShieldAlert, 
  Award,
  BookOpen,
  Database,
  Sparkles
} from "lucide-react";
import { EngineeringMaterial, MixDesignInput } from "../types";

// Standard Aggregate Types (Knowledge Base Templates)
export interface AggregateTypeTemplate {
  code: string;
  nameAr: string;
  nameEn: string;
  aggregateClass: "Fine" | "Coarse";
  type: string;
  geologicalOrigin: string;
  rockType: string;
}

export const FINE_AGGREGATE_TYPES: AggregateTypeTemplate[] = [
  { code: "SND-RIV", nameAr: "رمل الوديان (River Sand)", nameEn: "River Sand", aggregateClass: "Fine", type: "sand", geologicalOrigin: "Alluvial / Fluvial", rockType: "Quartzite / Siliceous" },
  { code: "SND-CRU", nameAr: "الرمل المصنع (Crushed Sand)", nameEn: "Crushed Sand (Manufactured Sand)", aggregateClass: "Fine", type: "sand", geologicalOrigin: "Quarry Crushing", rockType: "Limestone / Granite" },
  { code: "SND-LMS", nameAr: "الرمل الجيري (Limestone Sand)", nameEn: "Limestone Sand", aggregateClass: "Fine", type: "sand", geologicalOrigin: "Sedimentary Limestone", rockType: "Calcite" },
  { code: "SND-SIL", nameAr: "الرمل السيليسي (Silica Sand)", nameEn: "Silica Sand", aggregateClass: "Fine", type: "sand", geologicalOrigin: "High-purity Quartz Deposit", rockType: "Quartz" },
  { code: "SND-SEA", nameAr: "رمل البحر المغسول (Sea Sand)", nameEn: "Sea Sand (Washed)", aggregateClass: "Fine", type: "sand", geologicalOrigin: "Marine / Coastal", rockType: "Quartz / Shell fragment" },
  { code: "SND-DES", nameAr: "الرمل الصحراوي (Desert Sand)", nameEn: "Desert Sand", aggregateClass: "Fine", type: "sand", geologicalOrigin: "Desert Eolian Deposit", rockType: "Quartz Siliceous" },
  { code: "SND-DUN", nameAr: "رمل الكثبان الرملية (Dune Sand)", nameEn: "Dune Sand", aggregateClass: "Fine", type: "sand", geologicalOrigin: "Windblown Dune", rockType: "Quartzite" },
  { code: "SND-REC", nameAr: "الركام الناعم المعاد تدويره (Recycled Fine)", nameEn: "Recycled Fine Aggregate", aggregateClass: "Fine", type: "sand", geologicalOrigin: "Demolition Crushing", rockType: "Concrete / Masonry" },
  { code: "SND-MIX", nameAr: "مزيج الرمل العياري (Sand Mixture)", nameEn: "Sand Mixture", aggregateClass: "Fine", type: "sand", geologicalOrigin: "Blended Fine aggregates", rockType: "Mixed" }
];

export const COARSE_AGGREGATE_TYPES: AggregateTypeTemplate[] = [
  { code: "GRV-LMS", nameAr: "حصى الحجر الجيري المكسر (Crushed Limestone)", nameEn: "Crushed Limestone", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Sedimentary Quarry", rockType: "Limestone" },
  { code: "GRV-GRN", nameAr: "حصى الغرانيت المكسر (Crushed Granite)", nameEn: "Crushed Granite", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Igneous Plutonic Quarry", rockType: "Granite" },
  { code: "GRV-BAS", nameAr: "حصى البازلت المكسر (Crushed Basalt)", nameEn: "Crushed Basalt", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Igneous Volcanic Quarry", rockType: "Basalt" },
  { code: "GRV-DOL", nameAr: "حصى الدولوميت المكسر (Crushed Dolomite)", nameEn: "Crushed Dolomite", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Sedimentary Carbonate Quarry", rockType: "Dolomitic Limestone" },
  { code: "GRV-QTZ", nameAr: "حصى الكوارتزيت المكسر (Crushed Quartzite)", nameEn: "Crushed Quartzite", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Metamorphic Quarry", rockType: "Quartzite" },
  { code: "GRV-RIV", nameAr: "حصى الوديان المستدير (River Gravel)", nameEn: "River Gravel", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Alluvial bed", rockType: "Siliceous / Gravel" },
  { code: "GRV-NAT", nameAr: "الحصى الطبيعي غير المكسر (Natural Gravel)", nameEn: "Natural Gravel", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Natural Deposits", rockType: "Mixed Siliceous" },
  { code: "GRV-REC", nameAr: "الركام الخشن المعاد تدويره (Recycled Coarse)", nameEn: "Recycled Coarse Aggregate", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Demolition waste crushing", rockType: "Recycled Concrete" },
  { code: "GRV-HVY", nameAr: "الركام الثقيل - الباريت (Heavy Aggregate)", nameEn: "Heavy Aggregate", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Barite / Magnetite Deposit", rockType: "High Density Ore" },
  { code: "GRV-LGT", nameAr: "الركام الخفيف - الطين المتمدد (Lightweight Aggregate)", nameEn: "Lightweight Aggregate", aggregateClass: "Coarse", type: "gravel", geologicalOrigin: "Expanded Clay / Pumice", rockType: "Porous Silicate" }
];

export const ALL_AGGREGATE_TYPES = [...FINE_AGGREGATE_TYPES, ...COARSE_AGGREGATE_TYPES];

// Algerian Presets (Seed Compilation Samples with realistic data)
export const ALGERIAN_COMPILATION_SEEDS: Partial<EngineeringMaterial>[] = [
  {
    id: "alg-river-sand-chlef",
    name: "رمل الوديان - الشلف",
    englishName: "River sand - Chlef",
    category: "رمال",
    type: "sand",
    density: 2600,
    ssdDensity: 2630,
    absorption: 1.2,
    moisture: 1.5,
    finenessModulus: 2.65,
    dMax: 5,
    provenance: "الشلف",
    region: "Chlef",
    sourceQuarry: "مقلع وادي الشلف الرئيسي",
    status: "نشط",
    createdBy: "SnoLab Algeria Lab",
    createdDate: "2026-01-10",
    updatedDate: "2026-06-18",
    specificGravity: 2.60,
    particleShape: "مستدير",
    clayContent: 0.6,
    organicContent: "سليم",
    gradationData: [
      { sieve: 5.0, passing: 100 },
      { sieve: 2.5, passing: 92 },
      { sieve: 1.25, passing: 76 },
      { sieve: 0.63, passing: 54 },
      { sieve: 0.315, passing: 26 },
      { sieve: 0.16, passing: 8 },
      { sieve: 0.08, passing: 1.2 }
    ],
    MaterialCode: "AGG-SND-CHLEF",
    ApprovalStatus: "Approved",
    laboratory: "المخبر المركزي للأشغال العمومية - LNTP Chlef",
    standard: "NA 5099 (Algerian Standard)",
    notes: "رمل وديان عالي الجودة ومعاير، ممتاز لتطبيقات الخرسانة المسلحة ومطابقة منحنيات دروكس.",
    EngineeringNotes: "Optimal fineness modulus for structural concrete. Low clay content ensures excellent cement paste bond.",
    MethyleneBlue: 0.5,
    SandEquivalent: 82,
    Chlorides: 0.008,
    Sulfates: 0.012,
    SpecificGravity: 2.60,
    Density: 2600,
    Absorption: 1.2,
    MoistureContent: 1.5,
    FinenessModulus: 2.65,
    quarryName: "محجرة أولاد فارس - الشلف",
    supplierName: "شركة الرمال الجزائرية فرع الغرب"
  },
  {
    id: "alg-river-sand-mostaganem",
    name: "رمل الوديان - مستغانم",
    englishName: "River sand - Mostaganem",
    category: "رمال",
    type: "sand",
    density: 2580,
    ssdDensity: 2610,
    absorption: 1.4,
    moisture: 2.0,
    finenessModulus: 2.30,
    dMax: 4,
    provenance: "مستغانم",
    region: "Mostaganem",
    sourceQuarry: "مجرى وادي الشلف بمستغانم",
    status: "نشط",
    createdBy: "SnoLab Algeria Lab",
    createdDate: "2026-02-15",
    updatedDate: "2026-06-20",
    specificGravity: 2.58,
    particleShape: "مستدير",
    clayContent: 0.8,
    organicContent: "مقبول",
    gradationData: [
      { sieve: 5.0, passing: 100 },
      { sieve: 2.5, passing: 96 },
      { sieve: 1.25, passing: 82 },
      { sieve: 0.63, passing: 62 },
      { sieve: 0.315, passing: 30 },
      { sieve: 0.16, passing: 10 },
      { sieve: 0.08, passing: 1.8 }
    ],
    MaterialCode: "AGG-SND-MOST",
    ApprovalStatus: "Approved",
    laboratory: "مخبر التحاليل والرقابة الفنية للغرب CTRG Mostaganem",
    standard: "NA 5099",
    notes: "رمل ناعم إلى متوسط، يحتاج توازن حشو إضافي عند استخدامه في بيتون عالي المقاومة.",
    MethyleneBlue: 0.9,
    SandEquivalent: 78,
    Chlorides: 0.015,
    Sulfates: 0.018,
    SpecificGravity: 2.58,
    Density: 2580,
    Absorption: 1.4,
    MoistureContent: 2.0,
    FinenessModulus: 2.30,
    quarryName: "محجرة سيدي علي - مستغانم"
  },
  {
    id: "alg-river-sand-mascara",
    name: "رمل الوديان - معسكر",
    englishName: "River sand - Mascara",
    category: "رمال",
    type: "sand",
    density: 2620,
    ssdDensity: 2650,
    absorption: 1.1,
    moisture: 1.2,
    finenessModulus: 2.80,
    dMax: 5,
    provenance: "معسكر",
    region: "Mascara",
    sourceQuarry: "وادي هبرة - معسكر",
    status: "نشط",
    createdBy: "SnoLab Algeria Lab",
    createdDate: "2026-03-01",
    updatedDate: "2026-06-15",
    specificGravity: 2.62,
    particleShape: "غير منتظم",
    clayContent: 0.5,
    organicContent: "سليم",
    gradationData: [
      { sieve: 5.0, passing: 100 },
      { sieve: 2.5, passing: 88 },
      { sieve: 1.25, passing: 70 },
      { sieve: 0.63, passing: 48 },
      { sieve: 0.315, passing: 20 },
      { sieve: 0.16, passing: 6 },
      { sieve: 0.08, passing: 0.9 }
    ],
    MaterialCode: "AGG-SND-MASCARA",
    ApprovalStatus: "Approved",
    laboratory: "مخبر هندسة المواد معسكر LabMascara",
    standard: "NA 5099",
    MethyleneBlue: 0.4,
    SandEquivalent: 85,
    Chlorides: 0.005,
    Sulfates: 0.010,
    SpecificGravity: 2.62,
    Density: 2620,
    Absorption: 1.1,
    MoistureContent: 1.2,
    FinenessModulus: 2.80
  },
  {
    id: "alg-limestone-sand-setif",
    name: "رمل جيري مكسر - سطيف",
    englishName: "Limestone sand - Setif",
    category: "رمال",
    type: "sand",
    density: 2650,
    ssdDensity: 2680,
    absorption: 1.8,
    moisture: 0.8,
    finenessModulus: 2.95,
    dMax: 5,
    provenance: "سطيف",
    region: "Setif",
    sourceQuarry: "محجرة جبل يوسف - سطيف",
    status: "نشط",
    createdBy: "SnoLab Algeria Lab",
    createdDate: "2026-04-12",
    updatedDate: "2026-06-25",
    specificGravity: 2.65,
    particleShape: "مكسر",
    clayContent: 1.5,
    organicContent: "سليم",
    gradationData: [
      { sieve: 5.0, passing: 100 },
      { sieve: 2.5, passing: 82 },
      { sieve: 1.25, passing: 60 },
      { sieve: 0.63, passing: 40 },
      { sieve: 0.315, passing: 18 },
      { sieve: 0.16, passing: 7 },
      { sieve: 0.08, passing: 4.5 }
    ],
    MaterialCode: "AGG-SND-SETIF",
    ApprovalStatus: "Approved",
    laboratory: "مخبر الشرق للأشغال والرقابة LTPE Setif",
    standard: "NA 5099",
    notes: "رمل جيري مكسر ذو زوايا حادة، يرفع من الطلب على ماء الخلط لكن يعزز التداخل الحبيبي والصلابة الميكانيكية للبيتون.",
    MethyleneBlue: 1.2,
    SandEquivalent: 74,
    Chlorides: 0.009,
    Sulfates: 0.014,
    SpecificGravity: 2.65,
    Density: 2650,
    Absorption: 1.8,
    MoistureContent: 0.8,
    FinenessModulus: 2.95
  },
  {
    id: "alg-basalt-gravel-jijel",
    name: "ركام بازلت مكسر - جيجل",
    englishName: "Basalt gravel - Jijel",
    category: "حصى",
    type: "gravel",
    density: 2850,
    ssdDensity: 2880,
    absorption: 0.5,
    moisture: 0.4,
    dMax: 20,
    provenance: "جيجل",
    region: "Jijel",
    sourceQuarry: "مقلع صخور البازلت بزيامة منصورية",
    status: "نشط",
    createdBy: "SnoLab Algeria Lab",
    createdDate: "2026-05-02",
    updatedDate: "2026-06-28",
    specificGravity: 2.85,
    particleShape: "زاوي",
    losAngelesAbrasion: 12,
    gradationData: [
      { sieve: 25.0, passing: 100 },
      { sieve: 20.0, passing: 95 },
      { sieve: 16.0, passing: 78 },
      { sieve: 12.5, passing: 45 },
      { sieve: 10.0, passing: 22 },
      { sieve: 8.0, passing: 10 },
      { sieve: 5.0, passing: 1.5 }
    ],
    MaterialCode: "AGG-GRV-BASALT",
    ApprovalStatus: "Approved",
    laboratory: "مخبر الهندسة المدنية للشرق - Jijel Lab",
    standard: "EN 12620 / NA 5112",
    notes: "ركام مكسر من الصخور البركانية البازلتية، مقاومة استثنائية للاحتكاك والصدمات (Los Angeles = 12). مثالي للخرسانة عالية القوة والخرسانة الأسفلتية للطرق السريعة.",
    LosAngeles: 12,
    flakinessIndex: 8,
    elongationIndex: 6,
    crushingValue: 10,
    SpecificGravity: 2.85,
    Density: 2850,
    Absorption: 0.5,
    MoistureContent: 0.4
  },
  {
    id: "alg-granite-gravel-tamanrasset",
    name: "ركام غرانيت مكسر - تمنراست",
    englishName: "Granite gravel - Tamanrasset",
    category: "حصى",
    type: "gravel",
    density: 2700,
    ssdDensity: 2720,
    absorption: 0.6,
    moisture: 0.3,
    dMax: 25,
    provenance: "تمنراست",
    region: "Tamanrasset",
    sourceQuarry: "محجرة الغرانيت جبال الهقار",
    status: "نشط",
    createdBy: "SnoLab Algeria Lab",
    createdDate: "2026-03-22",
    updatedDate: "2026-06-22",
    specificGravity: 2.70,
    particleShape: "زاوي",
    losAngelesAbrasion: 15,
    gradationData: [
      { sieve: 31.5, passing: 100 },
      { sieve: 25.0, passing: 98 },
      { sieve: 20.0, passing: 80 },
      { sieve: 12.5, passing: 35 },
      { sieve: 8.0, passing: 15 },
      { sieve: 5.0, passing: 0.8 }
    ],
    MaterialCode: "AGG-GRV-GRANITE",
    ApprovalStatus: "Approved",
    laboratory: "المخبر الجهوي للجنوب الكبير LNTP Tamanrasset",
    standard: "EN 12620",
    notes: "ركام غرانيتي ناري ممتاز للمشاريع الكبرى والبنية التحتية الصلبة بصحراء الجزائر.",
    LosAngeles: 15,
    flakinessIndex: 10,
    elongationIndex: 8,
    crushingValue: 12,
    SpecificGravity: 2.70,
    Density: 2700,
    Absorption: 0.6,
    MoistureContent: 0.3
  },
  {
    id: "alg-desert-sand-adrar",
    name: "الرمل الصحراوي - أدرار",
    englishName: "Desert sand - Adrar",
    category: "رمال",
    type: "sand",
    density: 2550,
    ssdDensity: 2570,
    absorption: 1.6,
    moisture: 0.4,
    finenessModulus: 1.25,
    dMax: 2,
    provenance: "أدرار",
    region: "Adrar",
    sourceQuarry: "عرق شاش الرملي أدرار",
    status: "نشط",
    createdBy: "SnoLab Algeria Lab",
    createdDate: "2026-05-10",
    updatedDate: "2026-06-29",
    specificGravity: 2.55,
    particleShape: "مستدير",
    clayContent: 0.3,
    organicContent: "سليم",
    gradationData: [
      { sieve: 2.0, passing: 100 },
      { sieve: 1.0, passing: 99 },
      { sieve: 0.5, passing: 92 },
      { sieve: 0.25, passing: 68 },
      { sieve: 0.125, passing: 18 },
      { sieve: 0.08, passing: 4.8 }
    ],
    MaterialCode: "AGG-SND-DESERT",
    ApprovalStatus: "Approved",
    laboratory: "مخبر الجنوب للرقابة التقنية والبناء Adrar Lab",
    standard: "NA 5099",
    notes: "رمل ريح ناعم جداً ذو حبيبات كروية ملساء، ممتاز للخلط مع الرمل المكسر الخشن لتلافي الفراغات بالمزيج الخرساني.",
    MethyleneBlue: 0.3,
    SandEquivalent: 86,
    Chlorides: 0.010,
    Sulfates: 0.008,
    SpecificGravity: 2.55,
    Density: 2550,
    Absorption: 1.6,
    MoistureContent: 0.4,
    FinenessModulus: 1.25
  },
  {
    id: "alg-river-gravel-skikda",
    name: "ركام وديان طبيعي - سكيكدة",
    englishName: "River gravel - Skikda",
    category: "حصى",
    type: "gravel",
    density: 2630,
    ssdDensity: 2660,
    absorption: 0.9,
    moisture: 1.0,
    dMax: 16,
    provenance: "سكيكدة",
    region: "Skikda",
    sourceQuarry: "وادي الصفصاف - سكيكدة",
    status: "نشط",
    createdBy: "SnoLab Algeria Lab",
    createdDate: "2026-04-05",
    updatedDate: "2026-06-12",
    specificGravity: 2.63,
    particleShape: "مستدير",
    losAngelesAbrasion: 20,
    gradationData: [
      { sieve: 20.0, passing: 100 },
      { sieve: 16.0, passing: 94 },
      { sieve: 12.5, passing: 68 },
      { sieve: 10.0, passing: 42 },
      { sieve: 8.0, passing: 20 },
      { sieve: 5.0, passing: 2.0 }
    ],
    MaterialCode: "AGG-GRV-SKIKDA",
    ApprovalStatus: "Approved",
    laboratory: "مخبر الأشغال والمنشآت البحرية بسكيكدة LEM Skikda",
    standard: "EN 12620 / NA 5112",
    notes: "حصى وديان طبيعي مغسول ومستدير، يقلل الاحتكاك الداخلي ويسهل صب وضخ الخرسانة الإنشائية.",
    LosAngeles: 20,
    flakinessIndex: 5,
    elongationIndex: 4,
    crushingValue: 18,
    SpecificGravity: 2.63,
    Density: 2630,
    Absorption: 0.9,
    MoistureContent: 1.0
  },
  {
    id: "alg-natural-gravel-annaba",
    name: "حصى طبيعي معاير - عنابة",
    englishName: "Natural gravel - Annaba",
    category: "حصى",
    type: "gravel",
    density: 2650,
    ssdDensity: 2680,
    absorption: 0.8,
    moisture: 0.9,
    dMax: 20,
    provenance: "عنابة",
    region: "Annaba",
    sourceQuarry: "محجرة وادي العنب - عنابة",
    status: "نشط",
    createdBy: "SnoLab Algeria Lab",
    createdDate: "2026-02-18",
    updatedDate: "2026-06-10",
    specificGravity: 2.65,
    particleShape: "غير منتظم",
    losAngelesAbrasion: 18,
    gradationData: [
      { sieve: 25.0, passing: 100 },
      { sieve: 20.0, passing: 96 },
      { sieve: 16.0, passing: 74 },
      { sieve: 12.5, passing: 48 },
      { sieve: 8.0, passing: 18 },
      { sieve: 5.0, passing: 1.0 }
    ],
    MaterialCode: "AGG-GRV-ANNABA",
    ApprovalStatus: "Approved",
    laboratory: "المخبر الوطني للسكن والبناء LNHC Annaba",
    standard: "EN 12620",
    notes: "حصى طبيعي شبه مكسر ممتاز لكافة المباني السكنية والخرسانة التقليدية للأسقف والأعمدة بالشرق الجزائري.",
    LosAngeles: 18,
    flakinessIndex: 7,
    elongationIndex: 6,
    crushingValue: 15,
    SpecificGravity: 2.65,
    Density: 2650,
    Absorption: 0.8,
    MoistureContent: 0.9
  }
];

interface AggregatesEngineeringLibraryProps {
  inputs: MixDesignInput;
  setInputs: (inputs: any) => void;
  materials: EngineeringMaterial[];
  onUpdateMaterials?: (updated: EngineeringMaterial[]) => void;
}

export function AggregatesEngineeringLibrary({
  inputs,
  setInputs,
  materials,
  onUpdateMaterials
}: AggregatesEngineeringLibraryProps) {
  // Localization helper
  const [lang, setLang] = useState<"ar" | "en" | "fr">("ar");
  useEffect(() => {
    // Attempt to match global html lang or local preferences
    const isRtl = document.documentElement.dir === "rtl" || window.location.href.includes("lang=ar");
    setLang(isRtl ? "ar" : "en");
  }, []);

  const isRtl = lang === "ar";

  const t = {
    title: { ar: "مستودع رمال وحصى الهندسي الوطني", en: "National Aggregates Engineering Repository Library", fr: "Médiathèque Nationale des Granulats" },
    subtitle: { ar: "المرجع العلمي الموحد لمواصفات ومقالع ركام الخرسانة في الجزائر والمقاييس الهندسية", en: "Unified Scientific Reference for Concrete Aggregates, Quarries, and Labs", fr: "Référence Scientifique Unifiée des Granulats et Carrières" },
    searchPlace: { ar: "ابحث عن طريق الاسم، الكود، المحجرة، الولاية أو التشكيل الجيولوجي...", en: "Search by name, code, quarry, state, geological formation...", fr: "Recherche par nom, code, carrière..." },
    fine: { ar: "الركام الناعم (الرمال)", en: "Fine Aggregates (Sands)", fr: "Granulats Fins (Sables)" },
    coarse: { ar: "الركام الخشن (الحصى)", en: "Coarse Aggregates (Gravels)", fr: "Granulats Cours (Graviers)" },
    compare: { ar: "مقارنة الركام", en: "Compare Aggregates", fr: "Comparer les Granulats" },
    all: { ar: "الكل", en: "All", fr: "Tous" },
    approved: { ar: "معتمد ومطابق", en: "Approved & Validated", fr: "Approuvé" },
    pending: { ar: "تحت التدقيق", en: "Under Review", fr: "En cours" },
    newInst: { ar: "إضافة عينة ركام مخبرية جديدة", en: "Add New Lab Aggregate Sample", fr: "Nouvelle Échantillon de Granulat" },
    compareTitle: { ar: "المقارنة الهندسية الثنائية والثلاثية للركام", en: "Double & Triple Engineering Aggregate Comparison", fr: "Comparaison des Granulats" },
    mandatoryLabel: { ar: "الخصائص الإلزامية للصب الهندسي", en: "Mandatory Structural Casting Properties", fr: "Propriétés Obligatoires" },
    validationAlert: { ar: "تحذير أمان ميكانيكي هندسي:", en: "Mechanical Safety Engineering Warning:", fr: "Avertissement de Sécurité Mécanique :" },
    validationMsg: {
      ar: "لا يمكن استخدام هذا التجميع (الركام) في الحسابات حتى يتم استكمال جميع الخصائص الهندسية الإلزامية والتحقق من صحتها من قبل المختبر المعتمد وحالته معتمدة (Approved).",
      en: "This assembler cannot be used until all mandatory engineering properties have been completed and verified by an authorized testing lab and approved.",
      fr: "Ce granulat ne peut pas être utilisé pour les calculs tant que toutes les propriétés obligatoires n'ont pas été validées par le laboratoire agréé."
    },
    quarryInfo: { ar: "معلومات المحجرة والموقع الجغرافي", en: "Quarry & Location Information", fr: "Informations sur la Carrière" },
    labResults: { ar: "بيانات فحص المختبر المعتمد للركام", en: "Authorized Testing Laboratory Data", fr: "Données de Laboratoire Agréé" },
    gradationCurve: { ar: "المنحنى الحبيبي والتحليل بالمناخل", en: "Gradation & Sieve Analysis Curve", fr: "Courbe Granulométrique" },
    compareSelect: { ar: "اختر ركام للمقارنة", en: "Select aggregate to compare", fr: "Sélectionner un granulat" },
    save: { ar: "حفظ العينة", en: "Save Aggregate", fr: "Enregistrer" }
  };

  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<"all" | "Fine" | "Coarse">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Approved" | "Pending">("all");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const favs = localStorage.getItem("snolab_preferred_aggregates");
      return favs ? JSON.parse(favs) : ["alg-river-sand-chlef", "alg-basalt-gravel-jijel"];
    } catch {
      return ["alg-river-sand-chlef", "alg-basalt-gravel-jijel"];
    }
  });

  // Editor Form State
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formState, setFormState] = useState<any>(null);

  // Load recently used aggregates
  useEffect(() => {
    try {
      const rec = localStorage.getItem("snolab_recent_aggregates");
      if (rec) setRecentlyUsed(JSON.parse(rec));
    } catch {}
  }, []);

  // Manual Loading of Standard Algerian Aggregates
  const handleLoadDefaultAggregates = () => {
    if (!onUpdateMaterials) return;
    const listToInject = ALGERIAN_COMPILATION_SEEDS.map(s => {
      const shapeMap: any = { "مستدير": "مستدير", "مكسر": "مكسر", "زاوي": "زاوي", "غير منتظم": "غير منتظم" };
      const shape = s.particleShape ? shapeMap[s.particleShape] : "مستدير";
      return {
        id: s.id!,
        name: s.name!,
        englishName: s.englishName!,
        category: s.category!,
        type: s.type!,
        density: s.density || 2600,
        ssdDensity: s.ssdDensity || 2630,
        absorption: s.absorption || 1.5,
        moisture: s.moisture || 0.5,
        finenessModulus: s.finenessModulus,
        dMax: s.dMax,
        provenance: s.provenance || "الجزائر",
        region: s.region || "Alger",
        sourceQuarry: s.sourceQuarry || "مقلع وطني",
        status: "نشط",
        createdBy: "SnoLab Setup",
        createdDate: s.createdDate || "2026-01-01",
        updatedDate: "2026-07-01",
        specificGravity: s.specificGravity || 2.60,
        particleShape: shape,
        clayContent: s.clayContent || 0.5,
        organicContent: s.organicContent || "سليم",
        gradationData: s.gradationData || [],
        MaterialCode: s.MaterialCode || `MAT-AGG-${s.id?.toUpperCase()}`,
        ApprovalStatus: s.ApprovalStatus || "Approved",
        laboratory: s.laboratory || "المخبر الوطني للمواد",
        standard: s.standard || "Algerian Standard",
        notes: s.notes || "",
        MethyleneBlue: s.MethyleneBlue,
        SandEquivalent: s.SandEquivalent,
        Chlorides: s.Chlorides,
        Sulfates: s.Sulfates,
        SpecificGravity: s.specificGravity || 2.60,
        Density: s.density || 2600,
        Absorption: s.absorption || 1.5,
        MoistureContent: s.moisture || 0.5,
        FinenessModulus: s.finenessModulus,
        quarryName: s.quarryName,
        supplierName: s.supplierName,
        ownerId: "system_preset",
        source: "lab"
      } as EngineeringMaterial;
    });

    // Avoid duplicates
    const existingIds = new Set(materials.map(m => m.id));
    const nonDuplicates = listToInject.filter(item => !existingIds.has(item.id));
    onUpdateMaterials([...nonDuplicates, ...materials]);
  };

  // Aggregate Listing (filter sands & gravels)
  const aggregatesList = useMemo(() => {
    return materials.filter(m => m.category === "رمال" || m.category === "حصى" || m.category === "ركام خفيف" || m.category === "ركام ثقيل");
  }, [materials]);

  // Handle auto-selection of first aggregate if none selected
  useEffect(() => {
    if (aggregatesList.length > 0 && !selectedMaterialId) {
      setSelectedMaterialId(aggregatesList[0].id);
    }
  }, [aggregatesList, selectedMaterialId]);

  // Track recently used
  const recordRecentUse = (id: string) => {
    const updated = [id, ...recentlyUsed.filter(x => x !== id)].slice(0, 5);
    setRecentlyUsed(updated);
    localStorage.setItem("snolab_recent_aggregates", JSON.stringify(updated));
  };

  const selectedAgg = useMemo(() => {
    return aggregatesList.find(m => m.id === selectedMaterialId) || null;
  }, [aggregatesList, selectedMaterialId]);

  // Toggle favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(x => x !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("snolab_preferred_aggregates", JSON.stringify(updated));
  };

  // Filter & Search Logic
  const filteredAggregates = useMemo(() => {
    return aggregatesList.filter(m => {
      const label = `${m.name} ${m.englishName || ""} ${m.MaterialCode || ""} ${m.provenance || ""} ${m.sourceQuarry || ""} ${m.quarryName || ""}`.toLowerCase();
      const matchesSearch = label.includes(searchQuery.toLowerCase());

      const isFine = m.category === "رمال";
      const matchesClass = classFilter === "all" || 
        (classFilter === "Fine" && isFine) || 
        (classFilter === "Coarse" && !isFine);

      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "Approved" && m.ApprovalStatus === "Approved") || 
        (statusFilter === "Pending" && (m.ApprovalStatus === "Pending Review" || m.ApprovalStatus === "Draft" || !m.ApprovalStatus));

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [aggregatesList, searchQuery, classFilter, statusFilter]);

  // Verification Checker
  const checkAggregateVerification = (m: EngineeringMaterial | null) => {
    if (!m) return { valid: false, errors: ["No material provided"] };
    const errs: string[] = [];
    
    // 1. Mandatory Physical Properties
    const sg = m.SpecificGravity || m.specificGravity;
    if (sg === undefined || sg <= 0) errs.push("Specific Gravity (الوزن النوعي) is required");
    const abs = m.Absorption || m.absorption;
    if (abs === undefined || abs < 0) errs.push("Water Absorption (نسبة الامتصاص) is required");
    
    // 2. Grainage
    if (m.category === "رمال") {
      const fm = m.FinenessModulus || m.finenessModulus;
      if (fm === undefined || fm <= 0) errs.push("Fineness Modulus (معامل النعومة) is required for sands");
    } else {
      const dMax = m.dMax;
      if (dMax === undefined || dMax <= 0) errs.push("Dmax (المقاس الأقصى للركام) is required for coarse aggregates");
    }

    // 3. Laboratory Data
    if (!m.laboratory) errs.push("Testing Laboratory (مخبر الفحص) is required");
    if (!m.standard) errs.push("Test Standard (مواصفة الفحص العيارية) is required");
    if (!m.gradationData || m.gradationData.length === 0) errs.push("Sieve gradation analysis data (التحليل بالمناخل) is required");

    // 4. Status Check
    if (m.ApprovalStatus !== "Approved") errs.push("Verification Status must be Approved (معتمد ومطابق)");

    return {
      valid: errs.length === 0,
      errors: errs
    };
  };

  const validationResult = useMemo(() => {
    return checkAggregateVerification(selectedAgg);
  }, [selectedAgg]);

  // Form Editor Initialization
  const handleEditClick = () => {
    if (!selectedAgg) return;
    setFormState({ ...selectedAgg });
    setIsEditing(true);
    setIsAddingNew(false);
  };

  const handleAddNewClick = () => {
    const freshId = `agg-custom-${Date.now()}`;
    setFormState({
      id: freshId,
      name: "ركام عينة مخبرية - جديدة",
      englishName: "New Lab Aggregate Sample",
      category: "رمال",
      type: "sand",
      density: 2600,
      ssdDensity: 2630,
      absorption: 1.5,
      moisture: 0.5,
      finenessModulus: 2.5,
      dMax: 5,
      provenance: "الشلف",
      region: "Chlef",
      sourceQuarry: "محجرة وادي سلي",
      status: "نشط",
      createdBy: "User Lab Inspector",
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0],
      specificGravity: 2.60,
      particleShape: "مستدير",
      clayContent: 0.5,
      organicContent: "سليم",
      gradationData: [
        { sieve: 5.0, passing: 100 },
        { sieve: 2.5, passing: 90 },
        { sieve: 1.25, passing: 75 },
        { sieve: 0.63, passing: 50 },
        { sieve: 0.315, passing: 20 },
        { sieve: 0.16, passing: 5 },
        { sieve: 0.08, passing: 1.0 }
      ],
      MaterialCode: `AGG-USR-${Math.floor(1000 + Math.random() * 9000)}`,
      ApprovalStatus: "Draft",
      laboratory: "مخبر الرقابة الفنية للبناء CTC",
      standard: "NA 5099 / NF EN 12620",
      notes: "عينة مخبرية للتحقق من التدرج والخواص الجيوتقنية والكيميائية.",
      SandEquivalent: 80,
      MethyleneBlue: 0.5,
      Chlorides: 0.01,
      Sulfates: 0.01,
      SpecificGravity: 2.60,
      Density: 2600,
      Absorption: 1.5,
      MoistureContent: 0.5,
      FinenessModulus: 2.5
    });
    setIsAddingNew(true);
    setIsEditing(true);
  };

  const handleSaveForm = () => {
    if (!onUpdateMaterials || !formState) return;

    // Synchronize redundant uppercase/lowercase properties
    const updatedMat = {
      ...formState,
      SpecificGravity: Number(formState.specificGravity || formState.SpecificGravity || 2.60),
      Density: Number(formState.density || formState.Density || 2600),
      Absorption: Number(formState.absorption || formState.Absorption || 1.5),
      MoistureContent: Number(formState.moisture || formState.MoistureContent || 0.5),
      FinenessModulus: formState.category === "رمال" ? Number(formState.finenessModulus || formState.FinenessModulus || 2.5) : undefined,
      dMax: formState.category === "حصى" ? Number(formState.dMax || 20) : 5,
      updatedDate: new Date().toISOString().split("T")[0],
      ownerId: "user_added",
      source: "lab"
    };

    let nextList;
    if (isAddingNew) {
      nextList = [updatedMat, ...materials];
      setSelectedMaterialId(updatedMat.id);
    } else {
      nextList = materials.map(m => m.id === updatedMat.id ? updatedMat : m);
    }

    onUpdateMaterials(nextList);
    setIsEditing(false);
    setIsAddingNew(false);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateMaterials) return;
    if (window.confirm(isRtl ? "هل أنت متأكد من حذف هذه المادة الإنشائية نهائياً؟" : "Are you sure you want to delete this aggregate from the library?")) {
      const nextList = materials.filter(m => m.id !== id);
      onUpdateMaterials(nextList);
      if (selectedMaterialId === id) {
        setSelectedMaterialId(nextList[0]?.id || null);
      }
    }
  };

  const handleAggregateSelect = (id: string) => {
    setSelectedMaterialId(id);
    recordRecentUse(id);
  };

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(x => x !== id));
    } else {
      if (compareIds.length >= 3) {
        alert(isRtl ? "يمكنك مقارنة 3 ركامات كحد أقصى!" : "You can compare up to 3 aggregates side-by-side!");
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir={isRtl ? "rtl" : "ltr"}>
      {/* SECTION HEADER */}
      <div className="bg-gradient-to-l from-slate-900 to-slate-850 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden text-right">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono border border-blue-500/20">
              {isRtl ? "مستودع ركام الخرسانة الهندسي" : "SnoLab Aggregates Repository"}
            </span>
            <h2 className="text-xl font-black text-white mt-2 leading-tight">
              {isRtl ? t.title.ar : t.title.en}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isRtl ? t.subtitle.ar : t.subtitle.en}
            </p>
          </div>
          <button 
            onClick={handleAddNewClick}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/20 cursor-pointer"
          >
            <Plus size={14} strokeWidth={3} />
            <span>{isRtl ? t.newInst.ar : t.newInst.en}</span>
          </button>
        </div>
      </div>

      {/* THREE COLUMN BENTO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: FILTER & ACCUMULATORS LIST (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md flex flex-col h-[750px]">
          
          {/* SEARCH */}
          <div className="relative mb-3">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder={isRtl ? t.searchPlace.ar : t.searchPlace.en}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pr-9 pl-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-right font-sans"
            />
          </div>

          {/* FILTERS TABS */}
          <div className="flex gap-1 mb-3 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
            <button 
              onClick={() => setClassFilter("all")}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer ${classFilter === "all" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {isRtl ? t.all.ar : t.all.en}
            </button>
            <button 
              onClick={() => setClassFilter("Fine")}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer ${classFilter === "Fine" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {isRtl ? "رمل (Sands)" : "Sands"}
            </button>
            <button 
              onClick={() => setClassFilter("Coarse")}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer ${classFilter === "Coarse" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {isRtl ? "حصى (Gravels)" : "Gravels"}
            </button>
          </div>

          <div className="flex gap-1.5 justify-between items-center text-[10px] text-slate-400 font-bold mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>{isRtl ? "العينات المسجلة" : "Registered Samples"} ({filteredAggregates.length})</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setStatusFilter(statusFilter === "Approved" ? "all" : "Approved")}
                className={`px-2 py-0.5 rounded cursor-pointer ${statusFilter === "Approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
              >
                ✓ {isRtl ? "معتمد فقط" : "Approved Only"}
              </button>
            </div>
          </div>

          {/* LIST BOX */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredAggregates.length > 0 ? (
              filteredAggregates.map(agg => {
                const isFav = favorites.includes(agg.id);
                const isSelected = agg.id === selectedMaterialId;
                const isApproved = agg.ApprovalStatus === "Approved";
                const isFine = agg.category === "رمال";
                
                return (
                  <div 
                    key={agg.id}
                    onClick={() => handleAggregateSelect(agg.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                      isSelected 
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/40 shadow-sm" 
                        : "bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200/60 dark:border-slate-800/60"
                    }`}
                  >
                    <div className="space-y-1 text-right flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 justify-start flex-row-reverse">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isFine ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700" : "bg-teal-100 dark:bg-teal-950/40 text-teal-700"}`}>
                          {isFine ? (isRtl ? "رمل" : "Sand") : (isRtl ? "حصى" : "Gravel")}
                        </span>
                        {isApproved ? (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 rounded flex items-center gap-0.5">
                            ✓ {isRtl ? "معتمد" : "Approved"}
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 px-1.5 rounded">
                            ⚠️ {isRtl ? "مسودة" : "Draft"}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-black text-slate-800 dark:text-white truncate">
                        {isRtl ? agg.name : (agg.englishName || agg.name)}
                      </h4>
                      
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 flex-row-reverse justify-end">
                        <MapPin size={10} />
                        <span className="truncate">{agg.provenance || agg.region || "الجزائر"}</span>
                        {agg.sourceQuarry && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="truncate max-w-[100px]">{agg.sourceQuarry}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 self-center mr-2">
                      <button 
                        onClick={(e) => toggleFavorite(agg.id, e)}
                        className="text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-all p-1"
                      >
                        <Heart size={14} fill={isFav ? "#EF4444" : "none"} className={isFav ? "text-red-500" : ""} />
                      </button>
                      <button 
                        onClick={() => toggleCompare(agg.id)}
                        className={`text-slate-300 hover:text-blue-500 cursor-pointer transition-all p-1 rounded ${compareIds.includes(agg.id) ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30" : ""}`}
                      >
                        <ArrowLeftRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-950/20 space-y-3">
                <Database className="mx-auto text-slate-400 dark:text-slate-600" size={32} />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  {isRtl 
                    ? "لا توجد مواد ركام متوفرة في قاعدة البيانات." 
                    : "No aggregate materials found in the database."}
                </p>
                {onUpdateMaterials && (
                  <button
                    onClick={handleLoadDefaultAggregates}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10.5px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Sparkles size={12} />
                    <span>{isRtl ? "تحميل الركام القياسي" : "Load Standard Aggregates"}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RECENTLY USED SECTION */}
          {recentlyUsed.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
              <span className="text-[9px] text-slate-400 block font-bold mb-1">{isRtl ? "المستخدمة مؤخراً" : "Recently Visited"}</span>
              <div className="flex gap-1.5 overflow-x-auto flex-row-reverse">
                {recentlyUsed.map(id => {
                  const item = aggregatesList.find(x => x.id === id);
                  if (!item) return null;
                  return (
                    <button 
                      key={id}
                      onClick={() => handleAggregateSelect(id)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-950 hover:bg-blue-50 hover:text-blue-600 text-[9px] font-bold rounded text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-pointer transition-all"
                    >
                      {isRtl ? item.name.split("-")[1] || item.name : item.englishName || item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE & RIGHT PANEL (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* COMPARATIVE TOOL VIEW IF COMPARING */}
          {compareIds.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <ArrowLeftRight size={16} className="text-blue-500" />
                  <span>{isRtl ? t.compareTitle.ar : t.compareTitle.en}</span>
                </h3>
                <button 
                  onClick={() => setCompareIds([])}
                  className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                >
                  {isRtl ? "إلغاء المقارنة" : "Clear Comparison"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {compareIds.map(id => {
                  const m = aggregatesList.find(x => x.id === id);
                  if (!m) return null;
                  const isFine = m.category === "رمال";
                  return (
                    <div key={id} className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 relative space-y-3">
                      <button 
                        onClick={() => toggleCompare(id)}
                        className="absolute top-2 left-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                      <div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${isFine ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"}`}>
                          {isFine ? "Fine" : "Coarse"}
                        </span>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1.5">{isRtl ? m.name : m.englishName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{m.MaterialCode}</span>
                      </div>

                      {/* PHYSICAL */}
                      <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                        <span className="text-[10px] text-slate-400 block font-bold">{isRtl ? "الخواص الفيزيائية" : "Physical"}</span>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-500">S.G (الوزن النوعي)</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{m.SpecificGravity || m.specificGravity || "—"}</span>
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-500">Absorption %</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{m.Absorption || m.absorption || "—"}%</span>
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-500">Moisture %</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{m.MoistureContent ?? m.moisture ?? "—"}%</span>
                        </div>
                      </div>

                      {/* GRAINAGE */}
                      <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                        <span className="text-[10px] text-slate-400 block font-bold">{isRtl ? "الخواص الحبيبية" : "Gradation"}</span>
                        {isFine ? (
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="text-slate-500">Fineness Modulus</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{m.FinenessModulus || m.finenessModulus || "—"}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="text-slate-500">Dmax (mm)</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{m.dMax || "—"} mm</span>
                          </div>
                        )}
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-500">{isFine ? "Sand Equiv. %" : "Los Angeles %"}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {isFine ? (m.SandEquivalent || "—") : (m.LosAngeles || m.losAngelesAbrasion || "—")}%
                          </span>
                        </div>
                      </div>

                      {/* QUARRY */}
                      <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                        <span className="text-[10px] text-slate-400 block font-bold">{isRtl ? "الموقع والولاية" : "Location"}</span>
                        <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold truncate">
                          {m.provenance} - {m.region || m.provenance}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {m.sourceQuarry || "محجرة عيادية"}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FORM EDITOR / VIEW MODE PANEL */}
          {isEditing && formState ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Edit3 size={16} className="text-blue-500" />
                  <span>{isAddingNew ? (isRtl ? "إضافة عينة ركام جديدة" : "Add New Aggregate") : (isRtl ? "تعديل بيانات الركام المخبرية" : "Edit Aggregate Lab Record")}</span>
                </h3>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* TWO COLUMN FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">اسم الركام (عربي):</label>
                  <input 
                    type="text" 
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">Material Name (English):</label>
                  <input 
                    type="text" 
                    value={formState.englishName}
                    onChange={(e) => setFormState({ ...formState, englishName: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-left"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">تصنيف الركام (Class):</label>
                  <select 
                    value={formState.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setFormState({ 
                        ...formState, 
                        category: cat,
                        type: cat === "رمال" ? "sand" : "gravel"
                      });
                    }}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                  >
                    <option value="رمال">ركام ناعم - رمال (Fine Aggregate)</option>
                    <option value="حصى">ركام خشن - حصى (Coarse Aggregate)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">كود المادة (Material Code):</label>
                  <input 
                    type="text" 
                    value={formState.MaterialCode}
                    onChange={(e) => setFormState({ ...formState, MaterialCode: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                </div>

                {/* GEOGRAPHY & ALGERIAN COMPILATIONS */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 md:col-span-2">
                  <h4 className="text-[11px] font-black text-blue-600 mb-2">{isRtl ? "بيانات الموقع ومقالع الجزائر" : "Algerian Quarry Location Info"}</h4>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">الولاية (Wilaya):</label>
                  <select
                    value={formState.provenance}
                    onChange={(e) => setFormState({ ...formState, provenance: e.target.value, region: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                  >
                    <option value="الشلف">الشلف (Chlef)</option>
                    <option value="مستغانم">مستغانم (Mostaganem)</option>
                    <option value="معسكر">معسكر (Mascara)</option>
                    <option value="سطيف">سطيف (Setif)</option>
                    <option value="جيجل">جيجل (Jijel)</option>
                    <option value="تمنراست">تمنراست (Tamanrasset)</option>
                    <option value="أدرار">أدرار (Adrar)</option>
                    <option value="سكيكدة">سكيكدة (Skikda)</option>
                    <option value="عنابة">عنابة (Annaba)</option>
                    <option value="الجزائر العاصمة">الجزائر العاصمة (Alger)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">اسم المحجرة / المقلع (Quarry Name):</label>
                  <input 
                    type="text" 
                    value={formState.sourceQuarry}
                    onChange={(e) => setFormState({ ...formState, sourceQuarry: e.target.value, quarryName: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                  />
                </div>

                {/* PHYSICAL LAB VALUES */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 md:col-span-2">
                  <h4 className="text-[11px] font-black text-blue-600 mb-2">{isRtl ? "بيانات التحليل والخواص الهندسية" : "Mechanical & Gradation Values"}</h4>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">الوزن النوعي الحقيقي (Specific Gravity):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formState.specificGravity}
                    onChange={(e) => setFormState({ ...formState, specificGravity: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">نسبة الامتصاص المائي % (Water Absorption):</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={formState.absorption}
                    onChange={(e) => setFormState({ ...formState, absorption: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right font-mono"
                  />
                </div>

                {formState.category === "رمال" ? (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1">معامل النعومة (Fineness Modulus):</label>
                    <input 
                      type="number" 
                      step="0.05"
                      value={formState.finenessModulus}
                      onChange={(e) => setFormState({ ...formState, finenessModulus: parseFloat(e.target.value) })}
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1">المقاس الأقصى للركام (Dmax mm):</label>
                    <input 
                      type="number" 
                      value={formState.dMax}
                      onChange={(e) => setFormState({ ...formState, dMax: parseInt(e.target.value) })}
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">نسبة رطوبة الركام الموقعية % (Moisture):</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={formState.moisture}
                    onChange={(e) => setFormState({ ...formState, moisture: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right font-mono"
                  />
                </div>

                {/* TEST LAB AND CERTIFICATION */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 md:col-span-2">
                  <h4 className="text-[11px] font-black text-blue-600 mb-2">{isRtl ? "بيانات مخبر الفحص والتحقق" : "Testing Lab & Certification"}</h4>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">اسم مخبر الفحص (Laboratory):</label>
                  <input 
                    type="text" 
                    value={formState.laboratory}
                    onChange={(e) => setFormState({ ...formState, laboratory: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">مواصفة الفحص المعتمدة (Test Standard):</label>
                  <input 
                    type="text" 
                    value={formState.standard}
                    onChange={(e) => setFormState({ ...formState, standard: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">حالة الاعتماد والتحقق (Verification Status):</label>
                  <select 
                    value={formState.ApprovalStatus}
                    onChange={(e) => setFormState({ ...formState, ApprovalStatus: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right"
                  >
                    <option value="Approved">معتمد ومطابق مخبرياً (Approved)</option>
                    <option value="Pending Review">قيد المراجعة الفنية (Under Review)</option>
                    <option value="Draft">مسودة فحص غير مكتملة (Draft)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 block mb-1">ملاحظات هندسية تكميلية (Engineering Notes):</label>
                  <textarea 
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right h-16"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button 
                  onClick={handleSaveForm}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-md cursor-pointer"
                >
                  <Save size={13} />
                  <span>{isRtl ? t.save.ar : t.save.en}</span>
                </button>
              </div>
            </div>
          ) : selectedAgg ? (
            
            /* ACTIVE DETAILED AGGREGATE DISPLAY */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
              
              {/* HEADER ROW */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-row-reverse justify-end">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                      CODE: {selectedAgg.MaterialCode || `AGG-${selectedAgg.id.substring(4, 9).toUpperCase()}`}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedAgg.category === "رمال" ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"}`}>
                      {selectedAgg.category === "رمال" ? (isRtl ? "ركام ناعم - رمل" : "Fine Aggregate") : (isRtl ? "ركام خشن - حصى" : "Coarse Aggregate")}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-tight">
                    {isRtl ? selectedAgg.name : (selectedAgg.englishName || selectedAgg.name)}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-row-reverse justify-end">
                    <MapPin size={12} className="text-blue-500" />
                    <span className="font-bold">{selectedAgg.provenance || selectedAgg.region}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-[11px]">{selectedAgg.sourceQuarry || "مقلع وطني معتمد"}</span>
                  </div>
                </div>

                <div className="flex gap-2 self-end md:self-center">
                  <button 
                    onClick={handleEditClick}
                    className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{isRtl ? "تعديل البيانات" : "Edit"}</span>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteClick(selectedAgg.id, e)}
                    className="p-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer"
                    title={isRtl ? "حذف الركام" : "Delete Aggregate"}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* INTEGRATION VERIFICATION GATE BANNER */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 flex-row-reverse ${
                validationResult.valid 
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-800 dark:text-emerald-400" 
                  : "bg-amber-500/5 border-amber-500/10 text-amber-800 dark:text-amber-400"
              }`}>
                <div className="mt-0.5">
                  {validationResult.valid ? (
                    <CheckCircle className="text-emerald-600 shrink-0" size={18} />
                  ) : (
                    <ShieldAlert className="text-amber-600 shrink-0" size={18} />
                  )}
                </div>
                <div className="space-y-1 text-right flex-1">
                  <span className="text-xs font-black block">
                    {validationResult.valid 
                      ? (isRtl ? "✓ تم التحقق والمطابقة الهندسية الكاملة - المادة صالحة للاستخدام" : "✓ Material verification approved & complete - Ready for mix calculation")
                      : (isRtl ? t.validationAlert.ar : t.validationAlert.en)}
                  </span>
                  {!validationResult.valid ? (
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {isRtl ? t.validationMsg.ar : t.validationMsg.en}
                    </p>
                  ) : (
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {isRtl ? "لقد تم مطابقة تدرج العينة وتحليل المناخل وجميع الخواص الميكانيكية والكيميائية مع المواصفة القياسية بنجاح." : "Sieve analysis and geomechanical results comply fully with standards."}
                    </p>
                  )}
                  {/* List validation errors if any */}
                  {!validationResult.valid && (
                    <ul className="text-[10px] text-red-600 dark:text-red-400 list-disc list-inside mt-1.5 space-y-0.5 font-sans font-semibold">
                      {validationResult.errors.map((e, idx) => (
                        <li key={idx}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* BENTO PROPERTY SECTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* TECHNICAL STORE CARD 1: Physical & Mechanical */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-850 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                    <Info size={14} className="text-blue-500" />
                    <span>{isRtl ? "الخواص الفيزيائية والميكانيكية" : "Physical & Mechanical"}</span>
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <span className="text-slate-500">{isRtl ? "الوزن النوعي (Specific Gravity)" : "Specific Gravity"}</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedAgg.SpecificGravity || selectedAgg.specificGravity || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <span className="text-slate-500">{isRtl ? "كثافة السطح الجاف SSD (kg/m³)" : "SSD Density"}</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedAgg.ssdDensity || selectedAgg.Density || "—"} kg/m³</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <span className="text-slate-500">{isRtl ? "نسبة الامتصاص المائي (Absorption)" : "Water Absorption"}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{selectedAgg.Absorption || selectedAgg.absorption || 0}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <span className="text-slate-500">{isRtl ? "مقاومة التآكل لوس أنجلوس % (LA)" : "Los Angeles Abrasion"}</span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {selectedAgg.LosAngeles || selectedAgg.losAngelesAbrasion || (selectedAgg.category === "رمال" ? "N/A" : "— %")}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <span className="text-slate-500">{isRtl ? "شكل الحبيبة الجيولوجي" : "Particle Shape"}</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedAgg.particleShape || "زاوي"}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500">{isRtl ? "مكافئ الرمل % (SE)" : "Sand Equivalent"}</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedAgg.SandEquivalent || "—"}%</span>
                    </div>
                  </div>
                </div>

                {/* TECHNICAL STORE CARD 2: Gradation & Sieve Properties */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-850 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                    <Layers size={14} className="text-amber-500" />
                    <span>{isRtl ? "مواصفات التدرج الحبيبي والمنحنى" : "Gradation & Particle Sizing"}</span>
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    {selectedAgg.category === "رمال" ? (
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                        <span className="text-slate-500">{isRtl ? "معامل النعومة (Fineness Modulus)" : "Fineness Modulus"}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{selectedAgg.FinenessModulus || selectedAgg.finenessModulus || "—"}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                        <span className="text-slate-500">{isRtl ? "المقاس الحبيبي الأقصى (Dmax)" : "Dmax Size"}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{selectedAgg.dMax || "—"} mm</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <span className="text-slate-500">{isRtl ? "مكافئ أزرق الميثيلين MB (g/kg)" : "Methylene Blue Value"}</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedAgg.MethyleneBlue || "—"} g/kg</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <span className="text-slate-500">{isRtl ? "محتوى الطين الناعم %" : "Clay Content"}</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedAgg.clayContent || "—"}%</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500">{isRtl ? "مؤشر التسطح والقرصنة %" : "Flakiness Index"}</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedAgg.flakinessIndex || "—"}%</span>
                    </div>
                  </div>
                </div>

                {/* LAB TESTING INFORMATION */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 md:col-span-2 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-850 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                    <BookOpen size={14} className="text-emerald-500" />
                    <span>{isRtl ? t.labResults.ar : t.labResults.en}</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-right">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] text-slate-400 block font-bold">{isRtl ? "مخبر الفحص الهندسي" : "Testing Laboratory"}</span>
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{selectedAgg.laboratory || "مخبر سيتك لولاية الشلف"}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] text-slate-400 block font-bold">{isRtl ? "مواصفة الفحص المعتمدة" : "Testing Standard"}</span>
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{selectedAgg.standard || "Algerian NA Standard"}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] text-slate-400 block font-bold">{isRtl ? "تاريخ اعتماد الفحص" : "Approval Date"}</span>
                      <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">{selectedAgg.createdDate || "2026-06-15"}</span>
                    </div>
                  </div>

                  {/* Sieve Passing data representation */}
                  {selectedAgg.gradationData && selectedAgg.gradationData.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-850 text-right mt-2">
                      <span className="text-[10px] text-slate-400 block font-bold mb-1.5">{isRtl ? "نتائج تدرج المناخل الفعلي" : "Sieve Gradation Results"}</span>
                      <div className="flex flex-wrap gap-2 justify-end flex-row-reverse">
                        {selectedAgg.gradationData.map((g: any, i: number) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded text-[10px] font-mono border border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400">{g.sieve}mm:</span> <span className="font-bold text-blue-600 dark:text-blue-400">{g.passing}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* FORMAL CERTIFIED REPORT PREVIEW */}
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 md:col-span-2 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-850 pb-1.5 flex items-center gap-1.5 flex-row-reverse">
                    <FileText size={14} className="text-rose-500" />
                    <span>{isRtl ? "شهادة فحص المختبر المعتمدة - PDF" : "Certified Laboratory Sieve Report Certificate"}</span>
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 font-sans text-right relative overflow-hidden">
                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/5 rounded-full pointer-events-none"></div>
                    <div className="flex justify-between items-start">
                      <div className="text-left font-mono text-[9px] text-slate-400">
                        <span>REP-NUM: LNTP-DZ-90184</span>
                        <br />
                        <span>DATE: {selectedAgg.createdDate || "2026-06-15"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-800 dark:text-white block">الجمهورية الجزائرية الديمقراطية الشعبية</span>
                        <span className="text-[9px] text-slate-400 block">وزارة الأشغال العمومية والري والمنشآت القاعدة</span>
                      </div>
                    </div>

                    <div className="my-3 text-center border-y border-slate-200 dark:border-slate-850 py-2">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase block">شهادة فحص وتدرج حبيبي للركام</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{selectedAgg.englishName || "Aggregate Engineering Evaluation"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span>المادة: <strong>{selectedAgg.category}</strong></span>
                      </div>
                      <div className="text-left">
                        <span>كود العينة: <strong>{selectedAgg.MaterialCode || "AGG-SE-109"}</strong></span>
                      </div>
                      <div>
                        <span>الموقع/المحجرة: <strong>{selectedAgg.sourceQuarry || "مقلع معتمد"}</strong></span>
                      </div>
                      <div className="text-left">
                        <span>مخبر الفحص: <strong>{selectedAgg.laboratory || "المخبر الجهوي"}</strong></span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-[10px]">
                      <div className="text-left">
                        <span className="text-[9px] text-slate-400">توقيع وختم رئيس المختبر</span>
                        <div className="h-6 w-20 border-b border-dashed border-slate-400 mt-1"></div>
                        <span className="font-bold text-slate-600">Ing. S. Senoussi</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/15 px-2.5 py-1 rounded">
                          ✓ CERTIFIED COMPLIANCE (مطابق فئوي)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-600">
              <Info size={36} className="mx-auto mb-2 opacity-50" />
              <span>{isRtl ? "اختر ركام من القائمة لعرض التفاصيل المخبرية الكاملة" : "Select an aggregate from the sidebar to view full laboratory properties"}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
