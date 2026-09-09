import json

with open("scripts/schema_header.ts", "r", encoding="utf-8") as f:
    header = f.read()

with open("scripts/schemas_dict.json", "r", encoding="utf-8") as f:
    schemas = json.load(f)

lines = [header, "\nexport const MATERIAL_PROPERTY_SCHEMAS: Record<SupportedMaterialRole, MaterialPropertyDefinition[]> = {\n"]

for role, props in schemas.items():
    lines.append(f"  {role}: [\n")
    prop_entries = []
    for p in props:
        key, pid, l_ar, l_fr, l_en, unit, inp_type, cat_grp, std, def_val = p[0:10]
        extra = p[10] if len(p) > 10 else None
        
        entry = "    {\n"
        entry += f'      key: "{key}",\n'
        entry += f'      propertyId: "{pid}",\n'
        entry += f'      labelAr: "{l_ar}",\n'
        entry += f'      labelFr: "{l_fr}",\n'
        entry += f'      labelEn: "{l_en}",\n'
        entry += f'      unit: "{unit}",\n'
        entry += f'      inputType: "{inp_type}",\n'
        entry += f'      categoryGroup: "{cat_grp}",\n'
        entry += f'      requirementLevel: "required",\n'
        entry += f'      testStandard: "{std}",\n'
        
        if inp_type == "number":
            min_v, max_v = extra if extra else (0, 10000)
            entry += f'      min: {min_v},\n'
            entry += f'      max: {max_v},\n'
            entry += f'      defaultVal: {def_val},\n'
            entry += f'      placeholder: "{def_val}",\n'
            entry += f'      categoryKey: "{role}",\n'
            entry += '      isRequired: () => true,\n'
            allow_zero = "true" if min_v == 0 else "false"
            entry += f'      validate: (val) => validateNumericRange(val, {min_v}, {max_v}, "{l_ar}", "{l_fr}", "{l_en}", "{unit}", {allow_zero})\n'
        elif inp_type == "select":
            opts = extra if extra else []
            opts_str = "[\n" + ",\n".join([f'        {{ value: "{o[0]}", labelAr: "{o[1]}", labelFr: "{o[2]}", labelEn: "{o[3]}" }}' for o in opts]) + "\n      ]"
            entry += f'      options: {opts_str},\n'
            entry += f'      defaultVal: "{def_val}",\n'
            entry += f'      placeholder: "{def_val}",\n'
            entry += f'      categoryKey: "{role}",\n'
            entry += '      isRequired: () => true,\n'
            entry += f'      validate: (val) => (!val || String(val).trim() === "" ? {{ isValid: false, errorAr: "حقل {l_ar} مطلوب." }} : {{ isValid: true }})\n'
        else: # text
            entry += f'      defaultVal: "{def_val}",\n'
            entry += f'      placeholder: "{def_val}",\n'
            entry += f'      categoryKey: "{role}",\n'
            entry += '      isRequired: () => true,\n'
            entry += f'      validate: (val) => (!val || String(val).trim() === "" ? {{ isValid: false, errorAr: "حقل {l_ar} مطلوب." }} : {{ isValid: true }})\n'
        
        entry += "    }"
        prop_entries.append(entry)
    lines.append(",\n".join(prop_entries))
    lines.append("\n  ],\n")

lines.append("};\n\n")

trailer = """export const PROPERTY_DEFINITIONS: MaterialPropertyDefinition[] = Object.values(MATERIAL_PROPERTY_SCHEMAS).flat();

export function getMaterialPropValue(m: any, propKey: string): any {
  if (!m) return undefined;

  // Direct key lookup
  if (m[propKey] !== undefined && m[propKey] !== null && m[propKey] !== "") {
    return m[propKey];
  }

  // Nested in propertyMetadata
  if (m.propertyMetadata && m.propertyMetadata[propKey]) {
    const meta = m.propertyMetadata[propKey];
    if (meta.status === "not_applicable" || meta.value === "N/A" || meta.value === "NOT_APPLICABLE") {
      return "N/A";
    }
    if (meta.value !== undefined && meta.value !== null && meta.value !== "") {
      return meta.value;
    }
  }

  // Comprehensive aliases dictionary
  const aliasMap: Record<string, string[]> = {
    cementClass: ["cementType", "type", "Category", "cement_class", "classeCiment"],
    strengthClass: ["StrengthClass", "strength_class", "class", "classeResistance", "strength"],
    density: ["Density", "specificGravity", "relativeDensity", "relative_density", "ssdDensity", "masseVolumique", "mv"],
    ssdDensity: ["SSDDensity", "ssd_density", "masseVolumiqueSSD"],
    specificGravity: ["SpecificGravity", "specific_gravity", "densiteRelative"],
    bulkDensity: ["BulkDensity", "bulk_density", "masseVolumiqueApparente", "mva"],
    absorption: ["Absorption", "waterAbsorption", "water_absorption", "WA24", "absorptionDeau"],
    moisture: ["Moisture", "moistureContent", "moisture_content", "humidity", "teneurEnEau", "w"],
    finenessModulus: ["FinenessModulus", "fineness_modulus", "moduleDeFinesse", "FM", "mf"],
    sandEquivalent: ["SandEquivalent", "sand_equivalent", "ES", "SE", "sand_eq"],
    dMax: ["Dmax", "dmax", "DMax", "maxSize", "dimensionMaximale", "maxAggregateSize"],
    dMin: ["Dmin", "dmin", "DMin", "minSize", "dimensionMinimale"],
    particleShape: ["Shape", "shape", "forme", "grainShape", "aggregateShape"],
    losAngelesAbrasion: ["LosAngeles", "losAngeles", "los_angeles", "LA", "coefficientLosAngeles"],
    microDeval: ["MicroDeval", "microDeval", "MDE", "micro_deval"],
    flakinessIndex: ["FlakinessIndex", "flakiness_index", "FI", "indiceAplatissement"],
    elongationIndex: ["ElongationIndex", "elongation_index", "EI"],
    crushingValue: ["CrushingValue", "crushing_value", "ACV"],
    finesContent: ["FinesContent", "fines_content", "fines", "passant63um"],
    methyleneBlue: ["MethyleneBlue", "methylene_blue", "MB", "bleuDeMethylene"],
    recommendedDosage: ["dosage", "recommendedDosagePercent", "dosagePercent", "dosage_percent", "dose"],
    waterReduction: ["waterReductionPercent", "water_reduction", "reductionRatio", "water_reduction_ratio"],
    pozzolanicIndex: ["PozzolanicIndex", "pozzolanic_index", "activityIndex", "indicePouzzolanique"],
    fiberType: ["type", "fiber_type", "typeDeFibres"],
    tensileStrength: ["fiberTensileStrength", "resistanceTraction", "tensile_strength"],
    ph: ["pH", "PH", "waterPH", "valeurPH"],
    chlorides: ["Chlorides", "chlorideContent", "teneurChlorures"],
    sulfates: ["Sulfates", "sulfateContent", "teneurSulfates"],
    blaineFineness: ["BlaineFineness", "blaine_fineness", "surfaceBlaine"],
    initialSetting: ["InitialSetting", "initial_setting", "debutPrise"],
    finalSetting: ["FinalSetting", "final_setting", "finPrise"],
    airPercentage: ["airContent", "targetAirContent", "teneurAir"],
    foisonnement: ["Foisonnement", "foisonnementCoeff", "bulkingFactor"]
  };

  const aliases = aliasMap[propKey] || [];
  for (const alias of aliases) {
    if (m[alias] !== undefined && m[alias] !== null && m[alias] !== "") {
      return m[alias];
    }
  }

  // Nested in engineeringData
  if (m.engineeringData) {
    if (m.engineeringData[propKey] !== undefined && m.engineeringData[propKey] !== null && m.engineeringData[propKey] !== "") {
      return m.engineeringData[propKey];
    }
    for (const alias of aliases) {
      if (m.engineeringData[alias] !== undefined && m.engineeringData[alias] !== null && m.engineeringData[alias] !== "") {
        return m.engineeringData[alias];
      }
    }
  }

  return undefined;
}

export function inspectMixMaterialProperties(
  selectedMaterials: { role: string; material: EngineeringMaterial }[],
  mixMethod: string = "dreux",
  concreteType: string = "standard",
  language: "ar" | "fr" | "en" = "ar"
): BatchPropertiesSummary {
  const groups: MaterialPropertiesGroup[] = [];
  let totalMissingRequired = 0;
  let totalMissingOptional = 0;

  for (const { role, material } of selectedMaterials) {
    if (!material) continue;

    const roleKey: SupportedMaterialRole = normalizeMaterialRole(material.category || role);
    let catAr = "مادة";
    let catFr = "Matériau";
    let catEn = "Material";

    if (roleKey === "cement") { catAr = "إسمنت"; catFr = "Ciment"; catEn = "Cement"; }
    else if (roleKey === "sand") { catAr = "رمل (ركام ناعم)"; catFr = "Sable"; catEn = "Sand"; }
    else if (roleKey === "gravel") { catAr = "حصى (ركام خشن)"; catFr = "Gravillon"; catEn = "Gravel"; }
    else if (roleKey === "admixture") { catAr = "إضافات كيميائية"; catFr = "Adjuvants"; catEn = "Admixture"; }
    else if (roleKey === "scm") { catAr = "إضافات معدنية (SCM)"; catFr = "Ajouts Minéraux"; catEn = "Mineral Addition"; }
    else if (roleKey === "filler") { catAr = "مواد مالئة (Fillers)"; catFr = "Fillers"; catEn = "Fillers"; }
    else if (roleKey === "water") { catAr = "مياه الخلط"; catFr = "Eau de Gâchage"; catEn = "Water"; }
    else if (roleKey === "fiber") { catAr = "ألياف التسليح"; catFr = "Fibres"; catEn = "Fibers"; }
    else if (roleKey === "soil") { catAr = "تربة هندسية"; catFr = "Sol"; catEn = "Soil"; }
    else if (roleKey === "bituminous") { catAr = "بيتومين وزفت"; catFr = "Bitume"; catEn = "Bitumen"; }
    else if (roleKey === "masonry") { catAr = "مواد بناء وبلوك"; catFr = "Maçonnerie"; catEn = "Masonry"; }

    const schemas = MATERIAL_PROPERTY_SCHEMAS[roleKey] || [];
    const evaluatedProps: EvaluatedProperty[] = [];
    let matMissingReq = 0;
    let matMissingOpt = 0;

    for (const schema of schemas) {
      const isReq = schema.isRequired(material, mixMethod, concreteType);
      const val = getMaterialPropValue(material, schema.key);
      const meta = material.propertyMetadata?.[schema.key];
      const isNA = val === "N/A" || meta?.status === "not_applicable";
      const isRef = meta?.status === "default_reference" || material.isSystem;
      const hasVal = val !== undefined && val !== null && val !== "" && (val !== 0 || schema.key === "soundness" || schema.key === "chlorideContent");

      let display = "—";
      let status: EvaluatedProperty["status"] = "missing";

      if (isNA) {
        display = "N/A (غير منطبق)";
        status = "not_applicable";
      } else if (hasVal) {
        const valRes = schema.validate(val, material, mixMethod);
        display = `${val} ${schema.unit || ""}`.trim();
        if (valRes.isValid) {
          status = isRef ? "default_reference" : "valid";
        } else {
          status = "invalid";
        }
      } else {
        if (isReq) matMissingReq++;
        else matMissingOpt++;
      }

      evaluatedProps.push({
        definition: schema,
        key: schema.key,
        propertyId: schema.propertyId,
        labelAr: schema.labelAr,
        labelFr: schema.labelFr,
        labelEn: schema.labelEn,
        unit: schema.unit,
        currentValue: val,
        currentValueDisplay: display,
        hasCurrentValue: hasVal || isNA,
        isRequired: isReq,
        requirementLevel: schema.requirementLevel,
        categoryGroup: schema.categoryGroup,
        testStandard: schema.testStandard,
        source: meta?.sourceType || (material.isSystem ? "reference" : "laboratory"),
        sourceLabelAr: meta?.sourceLabel || (material.isSystem ? "قيمة مرجعية قياسية" : "مدخلات مخبرية"),
        sourceLabelFr: meta?.sourceLabel || (material.isSystem ? "Référence Standard" : "Laboratoire"),
        sourceLabelEn: meta?.sourceLabel || (material.isSystem ? "Standard Reference" : "Laboratory"),
        status,
        isEditable: true,
        originalDefaultValue: meta?.originalDefaultValue ?? schema.defaultVal,
        confidence: meta?.confidence || "High (Standard Specification)",
        notes: meta?.notes,
        history: meta?.history || []
      });
    }

    groups.push({
      material,
      role: roleKey,
      categoryAr: catAr,
      categoryFr: catFr,
      categoryEn: catEn,
      missingRequiredCount: matMissingReq,
      missingOptionalCount: matMissingOpt,
      totalMissingCount: matMissingReq + matMissingOpt,
      properties: evaluatedProps
    });

    totalMissingRequired += matMissingReq;
    totalMissingOptional += matMissingOpt;
  }

  return {
    totalMissingRequired,
    totalMissingOptional,
    totalMissing: totalMissingRequired + totalMissingOptional,
    groups
  };
}

export interface BatchUpdatePayload {
  materialId: string;
  propertyKey: string;
  newValue: any;
  userNote?: string;
}

export function applyBatchMaterialProperties(
  materials: EngineeringMaterial[],
  updates: BatchUpdatePayload[]
): EngineeringMaterial[] {
  return materials.map((m) => {
    const matUpdates = updates.filter((u) => u.materialId === m.id);
    if (matUpdates.length === 0) return m;

    const copy: any = { ...m, engineeringData: { ...(m.engineeringData || {}) }, propertyMetadata: { ...(m.propertyMetadata || {}) } };
    for (const update of matUpdates) {
      copy[update.propertyKey] = update.newValue;
      copy.engineeringData[update.propertyKey] = update.newValue;

      const currentMeta = copy.propertyMetadata[update.propertyKey] || {};
      const origVal = currentMeta.originalDefaultValue !== undefined ? currentMeta.originalDefaultValue : currentMeta.value;
      const history = [...(currentMeta.history || [])];

      history.push({
        timestamp: new Date().toISOString(),
        value: update.newValue,
        sourceType: "user_input",
        note: update.userNote || "Manual update by user"
      });

      copy.propertyMetadata[update.propertyKey] = {
        ...currentMeta,
        key: update.propertyKey,
        value: update.newValue,
        status: "user_edited",
        sourceType: "user_input",
        sourceLabel: "تعديل يدوي (User Edit)",
        isEditable: true,
        originalDefaultValue: origVal,
        history
      };
    }
    return copy as EngineeringMaterial;
  });
}
"""

lines.append(trailer)

with open("src/services/materialPropertySchema.ts", "w", encoding="utf-8") as f:
    f.write("".join(lines))

print("Updated src/services/materialPropertySchema.ts successfully!")
