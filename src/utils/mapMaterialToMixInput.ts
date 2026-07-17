import { MixDesignInput, AggregateType, AggregateQuality } from "../types";

export function readNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const parsed = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(parsed)) return undefined;
  if (parsed < 0) return undefined;
  return parsed;
}

export function normalizeDensityKgM3(val: any): number | undefined {
  const num = readNumber(val);
  if (num === undefined) return undefined;
  if (num > 0 && num < 10) {
    return num * 1000;
  }
  return num;
}

export function findRawValue(material: any, keys: string[]): any {
  if (!material) return undefined;

  // 1. Direct on material
  for (const key of keys) {
    if (material[key] !== undefined && material[key] !== null) {
      return material[key];
    }
  }

  // 2. Inside engineeringData
  if (material.engineeringData) {
    for (const key of keys) {
      if (material.engineeringData[key] !== undefined && material.engineeringData[key] !== null) {
        return material.engineeringData[key];
      }
    }
  }

  return undefined;
}

export function normalizeAggregateType(material: any): AggregateType | undefined {
  const shape = findRawValue(material, ["particleShape", "shapeIndex", "particle_shape"]);
  if (!shape) return undefined;
  const sStr = String(shape).toLowerCase();
  if (
    sStr.includes("concasse") ||
    sStr.includes("crushed") ||
    sStr.includes("angular") ||
    sStr.includes("مكسر") ||
    sStr.includes("زاوي")
  ) {
    return AggregateType.CONCASSE;
  }
  if (
    sStr.includes("roule") ||
    sStr.includes("rounded") ||
    sStr.includes("مستدير") ||
    sStr.includes("وديان")
  ) {
    return AggregateType.ROULE;
  }
  return undefined;
}

export function normalizeAggregateQuality(material: any): AggregateQuality | undefined {
  const quality = findRawValue(material, ["quality", "Quality", "quality_rating"]);
  const la = findRawValue(material, ["LosAngeles", "losAngeles", "losAngelesAbrasion", "la"]);
  const rating = findRawValue(material, ["rating", "Rating"]);

  // If explicit quality string is given
  if (quality) {
    const qStr = String(quality).toLowerCase();
    if (qStr.includes("excellent") || qStr.includes("ممتاز") || qStr.includes("عالي")) {
      return AggregateQuality.EXCELLENT;
    }
    if (qStr.includes("poor") || qStr.includes("ضعيف") || qStr.includes("متوسط")) {
      return AggregateQuality.POOR;
    }
    if (qStr.includes("standard") || qStr.includes("عادي") || qStr.includes("قياسي")) {
      return AggregateQuality.STANDARD;
    }
  }

  // Fallback to Los Angeles
  if (la !== undefined) {
    const laNum = typeof la === "number" ? la : parseFloat(String(la));
    if (!isNaN(laNum)) {
      if (laNum < 15) return AggregateQuality.EXCELLENT;
      if (laNum > 30) return AggregateQuality.POOR;
      return AggregateQuality.STANDARD;
    }
  }

  // Fallback to rating
  if (rating !== undefined) {
    const rNum = typeof rating === "number" ? rating : parseFloat(String(rating));
    if (!isNaN(rNum)) {
      if (rNum >= 4.5) return AggregateQuality.EXCELLENT;
      if (rNum < 3.5) return AggregateQuality.POOR;
      return AggregateQuality.STANDARD;
    }
  }

  return AggregateQuality.STANDARD; // Default
}

export function getMaterialCategory(material: any): string | undefined {
  const category = findRawValue(material, ["category", "Category", "type"]);
  if (!category) return undefined;
  
  const rawCat = String(category).trim();
  const catLower = rawCat.toLowerCase();
  
  // Normalization aliases
  if (catLower === "الركام الناعم") return "رمال";
  if (catLower === "الركام الخشن") return "حصى";
  if (catLower === "الأسمنت" || catLower === "الاسمنت") return "إسمنت";
  if (catLower === "الماء") return "ماء";
  
  if (
    catLower === "الملدنات" || 
    catLower === "الملدنات الفائقة" || 
    catLower === "المسرعات" || 
    catLower === "المبطيئات" || 
    catLower === "إضافات العزل"
  ) {
    return "إضافات كيميائية";
  }
  
  if (
    catLower === "الرماد المتطاير" || 
    catLower === "السيليكا فيوم" || 
    catLower === "خبث الأفران" ||
    catLower === "الميتاكاولين" ||
    catLower === "بودرة الحجر الجيري"
  ) {
    return "إضافات معدنية";
  }
  
  if (catLower === "الركام الخفيف") return "ركام خفيف";
  if (catLower === "الركام الثقيل") return "ركام ثقيل";
  
  if (
    catLower === "ألياف الصلب" || 
    catLower === "الألياف البوليمرية" ||
    catLower === "الألياف الزجاجية"
  ) {
    return "ألياف";
  }
  
  if (catLower === "حوابس الهواء") return "محتوى الهواء";
  
  if (
    catLower === "الجيوبوليمر" || 
    catLower === "الإيبوكسي" ||
    catLower === "المواد المتقدمة"
  ) {
    return "مجلدات خاصة";
  }
  
  return rawCat;
}

function getDensity(material: any): number | undefined {
  const raw = findRawValue(material, ["density", "Density", "specificGravity", "SpecificGravity", "specific_gravity"]);
  return normalizeDensityKgM3(raw);
}

function getAbsorption(material: any): number | undefined {
  const raw = findRawValue(material, ["absorption", "Absorption", "waterAbsorption", "water_absorption"]);
  return readNumber(raw);
}

function getMoisture(material: any): number | undefined {
  const raw = findRawValue(material, ["moisture", "Moisture", "moistureContent", "MoistureContent", "moisture_content"]);
  return readNumber(raw);
}

function getFinenessModulus(material: any): number | undefined {
  const raw = findRawValue(material, ["finenessModulus", "FinenessModulus", "fineness_modulus"]);
  return readNumber(raw);
}

function getDMax(material: any): number | undefined {
  const raw = findRawValue(material, ["dMax", "dmax", "DMax", "Dmax"]);
  return readNumber(raw);
}

function getPrice(material: any): number | undefined {
  const raw = findRawValue(material, ["price", "Price", "unitPrice", "unit_price"]);
  return readNumber(raw);
}

function getDosage(material: any): number | undefined {
  const raw = findRawValue(material, ["dosage", "Dosage", "recommendedDosage", "recommended_dosage"]);
  return readNumber(raw);
}

function getWaterReduction(material: any): number | undefined {
  const raw = findRawValue(material, ["waterReduction", "water_reduction", "waterReductionPercent"]);
  const val = readNumber(raw);
  if (val === undefined) return undefined;
  return Math.min(35, Math.max(0, val));
}

function getCementStrength(material: any): number | undefined {
  const raw = findRawValue(material, ["strengthClass", "strength_class", "cementClassStrength", "cementClass", "cement_class"]);
  if (!raw) return undefined;
  const match = String(raw).match(/[\d.]+/);
  if (match) {
    const val = parseFloat(match[0]);
    if (!isNaN(val) && val > 0) return val;
  }
  return undefined;
}

function getAdmixtureType(material: any): string | undefined {
  const raw = findRawValue(material, ["admixtureType", "admixture_type", "effectType", "effect_type", "type", "category"]);
  if (raw) {
    const rLower = String(raw).toLowerCase().trim();
    if (rLower === "superplasticizer" || rLower === "الملدنات" || rLower === "الملدنات الفائقة" || rLower.includes("ملدن")) return "superplasticizer";
    if (rLower === "air_entraining" || rLower === "حوابس الهواء" || rLower.includes("حابس") || rLower.includes("حبس")) return "air_entraining";
    if (rLower === "retarder" || rLower === "المبطيئات" || rLower.includes("مؤخر") || rLower.includes("مبط")) return "retarder";
    if (rLower === "accelerator" || rLower === "المسرعات" || rLower.includes("معجل") || rLower.includes("مسرع")) return "accelerator";
  }
  
  const nameLower = String(material.name || "").toLowerCase();
  if (nameLower.includes("ملدن") || nameLower.includes("superplasticizer")) return "superplasticizer";
  if (nameLower.includes("حابس") || nameLower.includes("air entrain") || nameLower.includes("air-entrain")) return "air_entraining";
  if (nameLower.includes("مؤخر") || nameLower.includes("retarder") || nameLower.includes("مبط")) return "retarder";
  if (nameLower.includes("معجل") || nameLower.includes("accelerator") || nameLower.includes("مسرع")) return "accelerator";

  return undefined;
}

function getScmType(material: any): string | undefined {
  const raw = findRawValue(material, ["admixtureType", "admixture_type", "scmType", "scm_type", "type", "category"]);
  if (raw) {
    const rLower = String(raw).toLowerCase();
    if (rLower.includes("silica_fume") || rLower.includes("silica fume") || rLower === "السيليكا فيوم") return "silica_fume";
    if (rLower.includes("fly_ash") || rLower.includes("fly ash") || rLower === "الرماد المتطاير") return "fly_ash";
    if (rLower.includes("slag") || rLower.includes("خبث") || rLower === "خبث الأفران") return "slag";
  }
  const nameLower = String(material.name || "").toLowerCase();
  const englishNameLower = String(material.englishName || "").toLowerCase();
  if (nameLower.includes("سيليكا") || englishNameLower.includes("silica")) return "silica_fume";
  if (nameLower.includes("رماد") || englishNameLower.includes("fly ash") || englishNameLower.includes("fly_ash")) return "fly_ash";
  if (nameLower.includes("خبث") || englishNameLower.includes("slag")) return "slag";

  return undefined;
}

export function mapMaterialToMixInput(material: any): Partial<MixDesignInput> {
  const cat = getMaterialCategory(material);
  if (!cat) return {};

  const catLower = cat.toLowerCase();

  // 1. SAND
  if (catLower === "رمال" || catLower === "sand") {
    const patch: Partial<MixDesignInput> = {
      sandType: material.name,
      selectedSandId: material.id,
    };
    const dens = getDensity(material);
    if (dens !== undefined) patch.sandRelativeDensity = dens;

    const moist = getMoisture(material);
    if (moist !== undefined) patch.moistureSand = moist;

    const abs = getAbsorption(material);
    if (abs !== undefined) patch.sandAbsorption = abs;

    const fm = getFinenessModulus(material);
    if (fm !== undefined) patch.finenessModulus = fm;

    const price = getPrice(material);
    if (price !== undefined) patch.priceSand = price;

    return patch;
  }

  // 2. GRAVEL
  if (catLower === "حصى" || catLower === "gravel" || catLower === "aggregate") {
    const patch: Partial<MixDesignInput> = {
      gravelType: material.name,
      selectedGravelId: material.id,
    };
    const dens = getDensity(material);
    if (dens !== undefined) patch.gravelRelativeDensity = dens;

    const moist = getMoisture(material);
    if (moist !== undefined) patch.moistureGravel = moist;

    const abs = getAbsorption(material);
    if (abs !== undefined) patch.gravelAbsorption = abs;

    const dmax = getDMax(material);
    if (dmax !== undefined) patch.dMax = dmax;

    const aggType = normalizeAggregateType(material);
    if (aggType !== undefined) patch.aggregateType = aggType;

    const aggQual = normalizeAggregateQuality(material);
    if (aggQual !== undefined) patch.aggregateQuality = aggQual;

    const price = getPrice(material);
    if (price !== undefined) patch.priceGravel = price;

    return patch;
  }

  // 3. CEMENT
  if (catLower === "إسمنت" || catLower === "cement") {
    const patch: Partial<MixDesignInput> = {
      cementType: material.name,
      selectedCementId: material.id,
    };
    const dens = getDensity(material);
    if (dens !== undefined) patch.cementDensity = dens;

    const strength = getCementStrength(material);
    if (strength !== undefined) patch.cementClassStrength = strength;

    const price = getPrice(material);
    if (price !== undefined) patch.priceCement = price;

    return patch;
  }

  // 4. CHEMICAL ADMIXTURES
  if (
    catLower === "إضافات كيميائية" ||
    catLower === "admixture" ||
    catLower === "chemical_admixture"
  ) {
    const admType = getAdmixtureType(material);
    const dosage = getDosage(material);
    const price = getPrice(material);

    if (admType === "superplasticizer") {
      const patch: Partial<MixDesignInput> = {
        selectedAdmixtureId: material.id,
        selectedAdmixtureName: material.name,
      };
      if (dosage !== undefined) patch.dosageSuper = dosage;
      if (price !== undefined) patch.priceSuper = price;

      const waterRed = getWaterReduction(material);
      if (waterRed !== undefined) patch.selectedAdmixtureWaterReduction = waterRed;

      const dens = getDensity(material);
      if (dens !== undefined) patch.selectedAdmixtureDensity = dens;

      return patch;
    } else if (admType === "air_entraining") {
      const patch: Partial<MixDesignInput> = {
        dosageAir: dosage !== undefined ? dosage : 0.1
      };
      if (price !== undefined) patch.priceAir = price;
      return patch;
    } else if (admType === "retarder") {
      const patch: Partial<MixDesignInput> = {
        dosageRetarder: dosage !== undefined ? dosage : 0.5
      };
      if (price !== undefined) patch.priceRetarder = price;
      return patch;
    } else if (admType === "accelerator") {
      const patch: Partial<MixDesignInput> = {
        dosageAccelerator: dosage !== undefined ? dosage : 1.0
      };
      if (price !== undefined) patch.priceAccelerator = price;
      return patch;
    }
  }

  // 5. MINERAL ADMIXTURES
  if (
    catLower === "إضافات معدنية" ||
    catLower === "scm" ||
    catLower === "silica_fume" ||
    catLower === "fly_ash" ||
    catLower === "slag" ||
    catLower === "mineral_admixture"
  ) {
    const scmType = getScmType(material) || catLower;
    const dosage = getDosage(material);
    const price = getPrice(material);

    const patch: Partial<MixDesignInput> = {
      selectedScmId: material.id,
      selectedScmName: material.name,
    };

    const dens = getDensity(material);
    if (dens !== undefined) patch.selectedScmDensity = dens;

    const repl = findRawValue(material, ["selectedScmReplacementPercent", "replacementPercent", "replacement_percent", "replacement"]);
    if (repl !== undefined) {
      patch.selectedScmReplacementPercent = readNumber(repl);
    } else if (dosage !== undefined) {
      patch.selectedScmReplacementPercent = dosage;
    }

    const wdf = findRawValue(material, ["selectedScmWaterDemandFactor", "waterDemandFactor", "water_demand_factor", "waterDemand"]);
    if (wdf !== undefined) patch.selectedScmWaterDemandFactor = readNumber(wdf);

    const pozz = findRawValue(material, ["selectedScmPozzolanicIndex", "pozzolanicIndex", "pozzolanic_index", "pozzolanic"]);
    if (pozz !== undefined) patch.selectedScmPozzolanicIndex = readNumber(pozz);

    if (scmType === "silica_fume") {
      if (dosage !== undefined) patch.dosageSilicaFume = dosage;
      if (price !== undefined) patch.priceSilicaFume = price;
    } else if (scmType === "fly_ash") {
      if (dosage !== undefined) patch.dosageFlyAsh = dosage;
      if (price !== undefined) patch.priceFlyAsh = price;
    } else if (scmType === "slag") {
      if (dosage !== undefined) patch.dosageSlag = dosage;
      if (price !== undefined) patch.priceSlag = price;
    }

    return patch;
  }

  // 6. WATER
  if (catLower === "ماء" || catLower === "water") {
    const patch: Partial<MixDesignInput> = {
      selectedWaterId: material.id,
      selectedWaterName: material.name,
    };
    const price = getPrice(material);
    if (price !== undefined) patch.priceWater = price;

    const ph = findRawValue(material, ["ph", "pH", "waterPH", "water_ph", "phValue"]);
    if (ph !== undefined) patch.selectedWaterPH = readNumber(ph);

    const chlorides = findRawValue(material, ["chlorideContent", "chlorides", "chloride", "chloride_content", "chlorideContentPpm"]);
    if (chlorides !== undefined) patch.selectedWaterChlorideContent = readNumber(chlorides);

    const sulphates = findRawValue(material, ["sulphateContent", "sulfateContent", "sulphates", "sulphate", "sulphate_content", "sulphateContentPpm"]);
    if (sulphates !== undefined) patch.selectedWaterSulphateContent = readNumber(sulphates);

    const temp = findRawValue(material, ["temperature", "waterTemp", "water_temp", "temp", "waterTemperature"]);
    if (temp !== undefined) patch.selectedWaterTemperature = readNumber(temp);

    return patch;
  }

  // 7. LIGHTWEIGHT AGGREGATE
  if (
    catLower === "ركام خفيف" ||
    catLower === "lightweight_aggregate" ||
    catLower === "lightweight aggregate" ||
    catLower === "lightweight_aggregates"
  ) {
    const patch: Partial<MixDesignInput> = {
      selectedLightweightAggregateId: material.id,
      selectedLightweightAggregateName: material.name,
      concreteType: "LWC",
    };
    const dens = getDensity(material);
    if (dens !== undefined) {
      patch.lightweightAggregateDensity = dens;
      patch.gravelRelativeDensity = dens;
    }
    const abs = getAbsorption(material);
    if (abs !== undefined) {
      patch.lightweightAggregateAbsorption = abs;
      patch.gravelAbsorption = abs;
    }
    const moist = getMoisture(material);
    if (moist !== undefined) {
      patch.lightweightAggregateMoisture = moist;
      patch.moistureGravel = moist;
    }
    const porosity = findRawValue(material, ["porosityIndex", "lightweightPorosityIndex", "porosity_index", "porosity"]);
    if (porosity !== undefined) patch.lightweightPorosityIndex = readNumber(porosity);

    const price = getPrice(material);
    if (price !== undefined) patch.priceGravel = price;

    return patch;
  }

  // 8. HEAVYWEIGHT AGGREGATE
  if (
    catLower === "ركام ثقيل" ||
    catLower === "heavyweight_aggregate" ||
    catLower === "heavyweight aggregate" ||
    catLower === "heavyweight_aggregates"
  ) {
    const patch: Partial<MixDesignInput> = {
      selectedHeavyweightAggregateId: material.id,
      selectedHeavyweightAggregateName: material.name,
      concreteType: "HWC",
    };
    const dens = getDensity(material);
    if (dens !== undefined) {
      patch.heavyweightAggregateDensity = dens;
      patch.gravelRelativeDensity = dens;
    }
    const abs = getAbsorption(material);
    if (abs !== undefined) {
      patch.heavyweightAggregateAbsorption = abs;
      patch.gravelAbsorption = abs;
    }
    const moist = getMoisture(material);
    if (moist !== undefined) {
      patch.heavyweightAggregateMoisture = moist;
      patch.moistureGravel = moist;
    }
    const hwType = findRawValue(material, ["heavyweightType", "hwType", "heavyweight_type", "type"]);
    if (hwType !== undefined) patch.heavyweightType = String(hwType);

    const price = getPrice(material);
    if (price !== undefined) patch.priceGravel = price;

    return patch;
  }

  // 9. FIBERS
  if (
    catLower === "ألياف" ||
    catLower === "fibers" ||
    catLower === "fiber" ||
    catLower === "fibres"
  ) {
    const patch: Partial<MixDesignInput> = {
      selectedFiberId: material.id,
      selectedFiberName: material.name,
      concreteType: "FRC",
    };
    const fType = findRawValue(material, ["fiberType", "type", "fiber_type", "category"]);
    if (fType !== undefined) {
      const fTypeStr = String(fType).toLowerCase();
      if (fTypeStr.includes("steel") || fTypeStr.includes("صلب") || fTypeStr.includes("حديد") || fTypeStr.includes("ألياف الصلب")) {
        patch.fiberType = "steel";
      } else if (fTypeStr.includes("polymer") || fTypeStr.includes("بوليمر") || fTypeStr.includes("synthetic") || fTypeStr.includes("زجاج") || fTypeStr.includes("الألياف البوليمرية")) {
        patch.fiberType = "synthetic";
      } else {
        patch.fiberType = String(fType);
      }
    }

    const dosage = findRawValue(material, ["fiberDosageKgM3", "dosage", "recommendedDosage", "fiberDosage", "dosage_kg_m3", "dosageKgM3"]);
    if (dosage !== undefined) patch.fiberDosageKgM3 = readNumber(dosage);

    const dens = findRawValue(material, ["fiberDensity", "density", "fiber_density"]);
    const normalizedDens = normalizeDensityKgM3(dens);
    if (normalizedDens !== undefined) patch.fiberDensity = normalizedDens;

    const length = findRawValue(material, ["fiberLengthMm", "length", "fiberLength", "lengthMm", "length_mm"]);
    if (length !== undefined) patch.fiberLengthMm = readNumber(length);

    const diameter = findRawValue(material, ["fiberDiameterMm", "diameter", "fiberDiameter", "diameterMm", "diameter_mm"]);
    if (diameter !== undefined) patch.fiberDiameterMm = readNumber(diameter);

    const tensile = findRawValue(material, ["fiberTensileStrengthMPa", "tensileStrength", "tensile_strength", "strength", "tensile"]);
    if (tensile !== undefined) patch.fiberTensileStrengthMPa = readNumber(tensile);

    const price = getPrice(material);
    if (price !== undefined) patch.priceFiber = price;

    return patch;
  }

  // 10. AIR CONTENT
  if (
    catLower === "محتوى الهواء" ||
    catLower === "air_content" ||
    catLower === "air content" ||
    catLower === "air_percentage"
  ) {
    const patch: Partial<MixDesignInput> = {
      selectedAirContentMaterialId: material.id,
      selectedAirContentMaterialName: material.name,
    };
    const pct = findRawValue(material, ["selectedAirPercentage", "airPercentage", "air_percentage", "percentage", "airContent", "air_content"]);
    if (pct !== undefined) {
      const parsedPct = readNumber(pct);
      if (parsedPct !== undefined) {
        patch.selectedAirPercentage = parsedPct;
      }
    }
    return patch;
  }

  // 11. SPECIAL BINDER
  if (
    catLower === "مجلدات خاصة" ||
    catLower === "special_binder" ||
    catLower === "special binder" ||
    catLower === "binders"
  ) {
    const patch: Partial<MixDesignInput> = {
      selectedSpecialBinderId: material.id,
      selectedSpecialBinderName: material.name,
    };
    const dens = getDensity(material);
    if (dens !== undefined) patch.specialBinderDensity = dens;

    const repl = findRawValue(material, ["specialBinderReplacementPercent", "replacementPercent", "replacement_percent", "replacement"]);
    if (repl !== undefined) patch.specialBinderReplacementPercent = readNumber(repl);

    const alk = findRawValue(material, ["specialBinderAlkalineRatio", "alkalineRatio", "alkaline_ratio", "alkalineRatioPercent"]);
    if (alk !== undefined) patch.specialBinderAlkalineRatio = readNumber(alk);

    const strClass = findRawValue(material, ["specialBinderStrengthClass", "strengthClass", "strength_class", "class"]);
    if (strClass !== undefined) patch.specialBinderStrengthClass = String(strClass);

    const price = getPrice(material);
    if (price !== undefined) patch.priceSpecialBinder = price;

    return patch;
  }

  return {};
}
