export interface EN206ExposureRule {
  exposureClass: string;
  maxWcRatio?: number;
  minCementKgM3?: number;
  minStrengthClass?: string;
  minFck?: number;
  notesAr?: string;
  notesEn?: string;
  notesFr?: string;
}

// هذه القيم جدول ضبط أولي ويجب معايرتها حسب الملحق الوطني أو المواصفة المعتمدة في البلد.
export const EN206_EXPOSURE_RULES: Record<string, EN206ExposureRule> = {
  X0: {
    exposureClass: "X0",
    maxWcRatio: 0.65,
    minCementKgM3: 240,
    minStrengthClass: "C12/15",
    minFck: 12,
    notesAr: "بيئة غير عدوانية تقريباً.",
    notesEn: "Almost non-aggressive environment.",
    notesFr: "Environnement presque non agressif."
  },
  XC1: {
    exposureClass: "XC1",
    maxWcRatio: 0.65,
    minCementKgM3: 260,
    minStrengthClass: "C20/25",
    minFck: 20,
    notesAr: "تآكل ناتج عن الكربنة في بيئة جافة أو رطبة دائماً.",
    notesEn: "Carbonation-induced corrosion, permanently dry or wet.",
    notesFr: "Corrosion induite par carbonatation, sec ou humide en permanence."
  },
  XC2: {
    exposureClass: "XC2",
    maxWcRatio: 0.60,
    minCementKgM3: 280,
    minStrengthClass: "C25/30",
    minFck: 25,
    notesAr: "بيئة رطبة ونادراً جافة.",
    notesEn: "Wet, rarely dry.",
    notesFr: "Humide, rarement sec."
  },
  XC3: {
    exposureClass: "XC3",
    maxWcRatio: 0.55,
    minCementKgM3: 300,
    minStrengthClass: "C30/37",
    minFck: 30,
    notesAr: "رطوبة متوسطة.",
    notesEn: "Moderate humidity.",
    notesFr: "Humidité modérée."
  },
  XC4: {
    exposureClass: "XC4",
    maxWcRatio: 0.50,
    minCementKgM3: 320,
    minStrengthClass: "C30/37",
    minFck: 30,
    notesAr: "تعاقب رطب وجاف.",
    notesEn: "Wet and dry cyclic.",
    notesFr: "Alternance humide et sec."
  },
  XD1: {
    exposureClass: "XD1",
    maxWcRatio: 0.55,
    minCementKgM3: 320,
    minStrengthClass: "C30/37",
    minFck: 30,
    notesAr: "كلوريدات غير بحرية.",
    notesEn: "Non-marine chlorides.",
    notesFr: "Chlorures non marins."
  },
  XD2: {
    exposureClass: "XD2",
    maxWcRatio: 0.50,
    minCementKgM3: 340,
    minStrengthClass: "C35/45",
    minFck: 35,
    notesAr: "كلوريدات غير بحرية مع رطوبة عالية.",
    notesEn: "Non-marine chlorides, high humidity.",
    notesFr: "Chlorures non marins, humidité élevée."
  },
  XD3: {
    exposureClass: "XD3",
    maxWcRatio: 0.45,
    minCementKgM3: 360,
    minStrengthClass: "C35/45",
    minFck: 35,
    notesAr: "كلوريدات غير بحرية مع تعاقب رطب وجاف.",
    notesEn: "Non-marine chlorides, wet and dry cyclic.",
    notesFr: "Chlorures non marins, alternance humide et sec."
  },
  XS1: {
    exposureClass: "XS1",
    maxWcRatio: 0.50,
    minCementKgM3: 340,
    minStrengthClass: "C30/37",
    minFck: 30,
    notesAr: "بيئة بحرية غير مغمورة مباشرة.",
    notesEn: "Marine environment, not directly submerged.",
    notesFr: "Environnement marin, non immergé directement."
  },
  XS2: {
    exposureClass: "XS2",
    maxWcRatio: 0.45,
    minCementKgM3: 360,
    minStrengthClass: "C35/45",
    minFck: 35,
    notesAr: "غمر دائم في مياه البحر.",
    notesEn: "Permanently submerged in sea water.",
    notesFr: "Immersion permanente dans l'eau de mer."
  },
  XS3: {
    exposureClass: "XS3",
    maxWcRatio: 0.45,
    minCementKgM3: 380,
    minStrengthClass: "C35/45",
    minFck: 35,
    notesAr: "مناطق رش أو مد وجزر بحرية.",
    notesEn: "Splash or tidal zone.",
    notesFr: "Zones d'éclaboussures ou de marée."
  }
};
