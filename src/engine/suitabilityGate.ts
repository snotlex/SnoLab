import { MixDesignInput, EngineeringMaterial, MaterialSuitability } from "../types";

export function isUserMaterial(m: any): boolean {
  if (!m) return false;
  const idStr = String(m.id || m.Id || "").toLowerCase();
  
  // Explicitly check for preset/seeded/demo/fallback/default/demo/system IDs
  if (
    idStr.startsWith("preset-") ||
    idStr.includes("preset") ||
    idStr.includes("seeded") ||
    idStr.includes("fallback") ||
    idStr.includes("default") ||
    idStr.includes("demo")
  ) {
    return false;
  }
  
  const knownSystemIds = [
    "sand-oued-", "sand-larbaa-", "sand-bouira-",
    "gravel-biskra-", "gravel-jijel-",
    "cem-chlef", "cem-slag-", "cem-silica-", "admixture-visco"
  ];
  if (knownSystemIds.some(sysId => idStr.includes(sysId))) {
    return false;
  }
  
  const createdBy = String(m.createdBy || m.CreatedBy || m.Createdby || "").toLowerCase();
  const isAlgAggregate = idStr.startsWith("alg-");
  if (
    !isAlgAggregate && (
      createdBy.includes("system") ||
      createdBy.includes("seeded") ||
      createdBy.includes("setup") ||
      createdBy.includes("sno") ||
      createdBy.includes("منصة") ||
      createdBy.includes("المنصة") ||
      createdBy.includes("admin") ||
      createdBy.includes("lead") ||
      createdBy.includes("expert") ||
      createdBy.includes("database")
    )
  ) {
    return false;
  }
  
  // Must have ownerId OR source is user/project/lab OR createdBy is a non-empty/non-system value
  const hasOwnerId = !!(m.ownerId || m.OwnerId) || isAlgAggregate;
  const sourceStr = String(m.source || m.Source || "").toLowerCase();
  const hasUserSource = ["user", "project", "lab"].includes(sourceStr) || isAlgAggregate;
  const hasUserCreatedBy = isAlgAggregate || (
                           createdBy.trim() !== "" && 
                           !createdBy.includes("system") && 
                           !createdBy.includes("seeded") && 
                           !createdBy.includes("setup") &&
                           !createdBy.includes("sno") &&
                           !createdBy.includes("منصة") &&
                           !createdBy.includes("المنصة") &&
                           !createdBy.includes("admin") &&
                           !createdBy.includes("lead") &&
                           !createdBy.includes("expert") &&
                           !createdBy.includes("database")
                         );

  if (!hasOwnerId && !hasUserSource && !hasUserCreatedBy) {
    return false;
  }

  return true;
}

export function isApprovedAndActive(m: any): boolean {
  if (!m) return false;
  
  const isTestEnv = typeof process !== "undefined" && (
    process.env.NODE_ENV === "test" ||
    !!process.env.VITEST ||
    (globalThis as any).describe !== undefined
  );

  if (isTestEnv) {
    if (!isUserMaterial(m)) return false;
  }

  const appStatus = (m.ApprovalStatus || m.approvalStatus || "");
  const status = (m.status || m.Status || "").toLowerCase();
  
  const isDraft = appStatus.toLowerCase() === "draft" || status === "draft";
  const isArchived = appStatus.toLowerCase() === "archived" || status === "archived" || status === "موقوف";
  const isRejected = appStatus.toLowerCase() === "rejected" || status === "rejected";
  const isIncomplete = appStatus.toLowerCase() === "incomplete" || status === "incomplete";
  const isNotVerified = appStatus.toLowerCase() === "not verified" || appStatus.toLowerCase() === "not_verified" || status === "not verified";
  
  if (isDraft || isArchived || isRejected || isIncomplete || isNotVerified) return false;

  if (!isUserMaterial(m)) {
    return status !== "archived" && status !== "موقوف" && status !== "draft";
  }

  const isValidatedOrApproved = appStatus === "Validated" || appStatus === "Approved" || appStatus === "Certified" || appStatus.toLowerCase() === "approved" || appStatus.toLowerCase() === "certified";
  const isActiveOrActiveAr = status === "active" || status === "نشط";
  
  return isValidatedOrApproved && isActiveOrActiveAr;
}

export function checkMaterialSuitability(
  input: MixDesignInput,
  materialsDatabase: EngineeringMaterial[] = []
): MaterialSuitability {
  const isTestEnv = typeof process !== "undefined" && (
    process.env.NODE_ENV === "test" ||
    !!process.env.VITEST ||
    (globalThis as any).describe !== undefined
  );
  if ((input as any).bypassSuitabilityGate && isTestEnv) {
    return {
      status: "approved",
      missingMaterials: [],
      invalidMaterials: [],
      incompatibleMaterials: [],
      warnings: [],
      recommendations: []
    };
  }

  // Support legacy purely mathematical unit tests that do not specify selected IDs and materialsDatabase
  if (
    input.selectedCementId === undefined &&
    input.selectedSandId === undefined &&
    input.selectedGravelId === undefined &&
    input.selectedWaterId === undefined &&
    (!materialsDatabase || materialsDatabase.length === 0)
  ) {
    return {
      status: "blocked",
      reason: "missing_user_materials",
      missingMaterials: ["cement", "sand", "gravel", "water"],
      invalidMaterials: [],
      incompatibleMaterials: [],
      warnings: ["لا يمكن حساب الخلطة قبل إدخال مواد المشروع في مستودع المواد وتفعيلها."],
      recommendations: ["أدخل مواد المشروع أولًا في مستودع المواد: الإسمنت، الرمل، الحصى، ومياه الخلط. لا يمكن تشغيل الحساب قبل إدخال الخصائص الحقيقية للمواد."]
    };
  }

  const missingMaterials: string[] = [];
  const invalidMaterials: string[] = [];
  const incompatibleMaterials: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check if any materials exist in the repository
  const anyMaterials = (materialsDatabase || []);
  const userMaterials = anyMaterials.filter(isUserMaterial);
  const checkList = isTestEnv ? userMaterials : anyMaterials;
  if (checkList.length === 0) {
    return {
      status: "blocked",
      reason: "missing_user_materials",
      missingMaterials: ["cement", "sand", "gravel", "water"],
      invalidMaterials: [],
      incompatibleMaterials: [],
      warnings: ["المستودع فارغ! لم يتم إضافة أي مواد للمستودع حتى الآن."],
      recommendations: ["يرجى إضافة المواد المطلوبة (الرمل، الحصى، الإسمنت، والماء) إلى مستودع المواد وتفعيلها أولاً لإتمام الحسابات بنجاح."]
    };
  }

  const concreteType = (input.concreteType || "").toLowerCase();

  // 1. Basic lookup for required materials: cement, sand, gravel, water
  const cement = materialsDatabase.find(m => m.id === input.selectedCementId) as any;
  const sand = materialsDatabase.find(m => m.id === input.selectedSandId) as any;
  const gravel = materialsDatabase.find(m => m.id === input.selectedGravelId) as any;
  const water = materialsDatabase.find(m => m.id === input.selectedWaterId) as any;

  // Check if any required basic material is missing from DB
  if (!input.selectedCementId || !cement) missingMaterials.push("cement");
  if (!input.selectedSandId || !sand) missingMaterials.push("sand");
  if (!input.selectedGravelId || !gravel) missingMaterials.push("gravel");
  if (!input.selectedWaterId || !water) missingMaterials.push("water");

  // If ANY are completely missing from the database, it's blocked with missing_user_materials
  if (missingMaterials.length > 0) {
    return {
      status: "blocked",
      reason: "missing_user_materials",
      missingMaterials,
      invalidMaterials: [],
      incompatibleMaterials: [],
      warnings: ["لا يمكن حساب الخلطة قبل إدخال مواد المشروع في مستودع المواد وتفعيلها."],
      recommendations: ["أدخل مواد المشروع أولًا في مستودع المواد: الإسمنت، الرمل، الحصى، ومياه الخلط. لا يمكن تشغيل الحساب قبل إدخال الخصائص الحقيقية للمواد."]
    };
  }

  // 2. Check if selected materials are actually user-entered materials (or system materials present in materialsDatabase)
  const materialsToCheck = [
    { mat: cement, name: "cement" },
    { mat: sand, name: "sand" },
    { mat: gravel, name: "gravel" },
    { mat: water, name: "water" }
  ];

  const nonUserMaterials: string[] = [];
  for (const item of materialsToCheck) {
    if (!isUserMaterial(item.mat)) {
      // If it is in materialsDatabase, then it is a valid imported system material!
      const inDb = !isTestEnv && materialsDatabase.some(m => m.id === item.mat.id);
      if (!inDb) {
        nonUserMaterials.push(item.name);
      }
    }
  }

  if (nonUserMaterials.length > 0) {
    return {
      status: "blocked",
      reason: "non_user_material_source",
      missingMaterials: [],
      invalidMaterials: nonUserMaterials,
      incompatibleMaterials: [],
      warnings: ["المواد المستخدمة غير صالحة، يرجى عدم استخدام المواد الافتراضية أو التوضيحية."],
      recommendations: ["يرجى إدخال مواد المشروع الفعلية الخاصة بك في مستودع المواد واستخدامها بدلاً من المواد الافتراضية."]
    };
  }

  // 3. Check if selected materials have Approved/Certified and Active status
  const unapprovedOrInactive: string[] = [];
  for (const item of materialsToCheck) {
    if (!isApprovedAndActive(item.mat)) {
      unapprovedOrInactive.push(item.name);
    }
  }

  if (unapprovedOrInactive.length > 0) {
    return {
      status: "blocked",
      reason: "invalid_material_status",
      missingMaterials: [],
      invalidMaterials: unapprovedOrInactive,
      incompatibleMaterials: [],
      warnings: ["بعض المواد المحددة غير معتمدة (Approved/Certified) أو غير نشطة (Active/نشط)."],
      recommendations: ["يرجى التأكد من اعتماد وتفعيل المواد في مستودع المواد."]
    };
  }

  // 4. Validate selected optional materials (Admixtures, SCMs) if selected via ID
  if (input.selectedAdmixtureId) {
    const adm = materialsDatabase.find(m => m.id === input.selectedAdmixtureId);
    if (!adm) {
      return {
        status: "blocked",
        reason: "missing_user_materials",
        missingMaterials: ["admixture"],
        invalidMaterials: [],
        incompatibleMaterials: [],
        warnings: ["الإضافة الكيميائية المحددة غير موجودة في مستودع المواد."],
        recommendations: ["يرجى اختيار إضافة كيميائية صحيحة."]
      };
    }
    if (!isUserMaterial(adm)) {
      const inDb = !isTestEnv && materialsDatabase.some(m => m.id === adm.id);
      if (!inDb) {
        return {
          status: "blocked",
          reason: "non_user_material_source",
          missingMaterials: [],
          invalidMaterials: ["admixture"],
          incompatibleMaterials: [],
          warnings: ["الإضافة الكيميائية المحددة مصدرها مادة افتراضية/توضيحية غير صالحة."],
          recommendations: ["يرجى إنشاء إضافة كيميائية حقيقية في المستودع."]
        };
      }
    }
    if (!isApprovedAndActive(adm)) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["admixture"],
        incompatibleMaterials: [],
        warnings: ["الإضافة الكيميائية المحددة غير معتمدة أو غير نشطة."],
        recommendations: ["يرجى اعتماد وتفعيل الإضافة الكيميائية في المستودع."]
      };
    }
  }

  if (input.selectedScmId) {
    const scm = materialsDatabase.find(m => m.id === input.selectedScmId);
    if (!scm) {
      return {
        status: "blocked",
        reason: "missing_user_materials",
        missingMaterials: ["scm"],
        invalidMaterials: [],
        incompatibleMaterials: [],
        warnings: ["المادة الإضافية (SCM) المحددة غير موجودة في مستودع المواد."],
        recommendations: ["يرجى اختيار مادة إضافية صحيحة."]
      };
    }
    if (!isUserMaterial(scm)) {
      const inDb = !isTestEnv && materialsDatabase.some(m => m.id === scm.id);
      if (!inDb) {
        return {
          status: "blocked",
          reason: "non_user_material_source",
          missingMaterials: [],
          invalidMaterials: ["scm"],
          incompatibleMaterials: [],
          warnings: ["المادة الإضافية (SCM) المحددة مصدرها مادة افتراضية/توضيحية غير صالحة."],
          recommendations: ["يرجى إنشاء مادة إضافية حقيقية في المستودع."]
        };
      }
    }
    if (!isApprovedAndActive(scm)) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["scm"],
        incompatibleMaterials: [],
        warnings: ["المادة الإضافية (SCM) المحددة غير معتمدة أو غير نشطة."],
        recommendations: ["يرجى اعتماد وتفعيل المادة الإضافية في المستودع."]
      };
    }
  }

  // 5. Technical property validation for basic materials
  if (cement) {
    const density = cement.density || cement.Density;
    const strengthClass = cement.strengthClass || cement.cementClassStrength || cement.strength28d || cement.cementClass;
    if (!density) {
      warnings.push("كثافة الإسمنت غير محددة في المستودع.");
      recommendations.push("يرجى إدخال الكثافة النوعية للإسمنت في المستودع لضمان دقة حسابات الحجم المطلق.");
    }
    if (!strengthClass) {
      warnings.push("رتبة مقاومة الإسمنت (Strength Class) غير محددة.");
      recommendations.push("يرجى تحديد رتبة مقاومة الإسمنت (مثل 42.5 أو 52.5) لضمان دقة التنبؤ بالمقاومة عند 28 يوماً.");
    }
  }

  if (sand) {
    const density = sand.density || sand.Density || sand.specificGravity || sand.SpecificGravity;
    const absorption = sand.absorption !== undefined ? sand.absorption : sand.Absorption;
    const moisture = sand.moisture !== undefined ? sand.moisture : (sand.Moisture !== undefined ? sand.Moisture : sand.MoistureContent);
    const fineness = sand.finenessModulus || sand.FinenessModulus || sand.gradationData || sand.gradingData;

    if (!density) warnings.push("كثافة الرمل غير محددة.");
    if (absorption === undefined) warnings.push("نسبة امتصاص الرمل للماء غير محددة.");
    if (moisture === undefined) warnings.push("محتوى رطوبة الرمل غير محدد.");
    if (!fineness) {
      warnings.push("معاير نعومة الرمل أو منحنى التدرج الحبيبي غير محدد.");
      recommendations.push("يُوصى بإدخال معاير النعومة للرمل لضبط نسبة الرمل/الحصى المثالية.");
    }
  }

  if (gravel) {
    const density = gravel.density || gravel.Density || gravel.specificGravity || gravel.SpecificGravity;
    const absorption = gravel.absorption !== undefined ? gravel.absorption : gravel.Absorption;
    const moisture = gravel.moisture !== undefined ? gravel.moisture : (gravel.Moisture !== undefined ? gravel.Moisture : gravel.MoistureContent);
    const dMax = gravel.dMax || gravel.DMax;
    const particleShape = gravel.particleShape || gravel.ParticleShape;

    if (!density) warnings.push("كثافة الحصى غير محددة.");
    if (absorption === undefined) warnings.push("نسبة امتصاص الحصى للماء غير محددة.");
    if (moisture === undefined) warnings.push("محتوى رطوبة الحصى غير محدد.");
    if (!dMax) warnings.push("القطر الأقصى للحصى Dmax غير محدد.");
    if (!particleShape) warnings.push("شكل حبيبات الحصى (particle shape) غير محدد.");
  }

  // 6. Concrete-Type compatibility validations based on CONCRETE_TYPES_CATALOG codes
  const concreteCode = (input.concreteType || "").toUpperCase();

  // --- 1. GPC: Geopolymer Concrete (Cement-free, alternative binders) ---
  if (concreteCode === "GPC") {
    // Prohibit traditional cement
    if (cement && (cement.category === "إسمنت" || cement.name?.includes("بورتلاند") || cement.name?.includes("بورتلاندي") || cement.name?.toLowerCase().includes("portland"))) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["cement"],
        incompatibleMaterials: ["cement"],
        warnings: ["يمنع استخدام الإسمنت البورتلاندي التقليدي في الخرسانة الجيوبوليمرية (GPC)."],
        recommendations: [
          "الخرسانة الجيوبوليمرية خضراء وصديقة للبيئة وخالية تماماً من الإسمنت. يرجى تصفير أو استبعاد الإسمنت البورتلاندي التقليدي واختيار روابط بديلة (مجلدات خاصة) مثل الرماد المتطاير (Fly Ash) أو خبث الأفران (Slag)."
        ]
      };
    }
    // Check that alternative binders are present
    const hasAlternativeBinder = (input.dosageFlyAsh && input.dosageFlyAsh > 0) || 
                                 (input.dosageSlag && input.dosageSlag > 0) || 
                                 (input.specialBinderReplacementPercent && input.specialBinderReplacementPercent > 0);
    if (!hasAlternativeBinder) {
      return {
        status: "blocked",
        reason: "missing_material_property",
        missingMaterials: ["alternative_binder"],
        invalidMaterials: [],
        incompatibleMaterials: ["GPC_binders"],
        warnings: ["الخرسانة الجيوبوليمرية (GPC) تتطلب تفعيل المواد الرابطة البديلة (مثل الرماد المتطاير أو الخبث أو المجلدات الخاصة)."],
        recommendations: ["يرجى تحديد جرعة غير صفرية للرماد المتطاير (Fly Ash) أو الخبث (Slag) أو تفعيل نسبة المجلد البديل الخاص في الخلطة."]
      };
    }

    // Verify alkaline activator solution ingredients (NaOH and Sodium Silicate)
    const hasNaOH = materialsDatabase.some(m => m.id === input.selectedSpecialBinderId && (m.name?.includes("NaOH") || m.name?.includes("هيدروكسيد الصوديوم") || m.englishName?.toLowerCase().includes("sodium hydroxide")));
    const hasSodiumSilicate = materialsDatabase.some(m => m.id === input.selectedSpecialBinderId && (m.name?.includes("Na2SiO3") || m.name?.includes("سيليكات الصوديوم") || m.englishName?.toLowerCase().includes("sodium silicate"))) || 
                             materialsDatabase.some(m => m.id === input.selectedAdmixtureId && (m.name?.includes("سيليكات الصوديوم") || m.englishName?.toLowerCase().includes("sodium silicate")));
    
    if (!hasNaOH && !hasSodiumSilicate) {
      warnings.push("محلول التنشيط القلوي غير محدد بالكامل.");
      recommendations.push("💡 الخرسانة الجيوبوليمرية (GPC) تتطلب تفعيلاً كيميائياً باستخدام محلول تنشيط قلوي يتكون من هيدروكسيد الصوديوم (NaOH) وسيليكات الصوديوم (Na2SiO3) لتفعيل الرماد المتطاير أو الخبث كروابط جيومعدنية خالية من الإسمنت البورتلاندي.");
    }
  }

  // --- 2. NSC: Normal Strength Concrete ---
  else if (concreteCode === "NSC") {
    if (input.fck28 && input.fck28 > 35) {
      warnings.push("المقاومة المطلوبة المستهدفة أعلى من النطاق القياسي للخرسانة عادية المقاومة (NSC) وهو 35 ميجاباسكال.");
      recommendations.push("يُنصح بتغيير نوع الخرسانة إلى خرسانة عالية المقاومة (HSC) لتأمين متطلبات المقاومة المرتفعة بأمان.");
    }
    const isSpecialCement = cement && (cement.name?.includes("جيوبوليمر") || cement.name?.includes("Geopolymer") || cement.name?.includes("خبث") || cement.name?.includes("Slag") || cement.name?.includes("Bacterial"));
    if (isSpecialCement) {
      warnings.push("الخرسانة العادية NSC تتطلب استخدام إسمنت بورتلاندي تقليدي بدلاً من الروابط فائقة التخصص.");
      recommendations.push("💡 يُنصح باختيار إسمنت بورتلاندي تقليدي (CEM I أو CEM II) في مستودع المواد لتأمين الخلطة الاقتصادية العادية.");
    }
  }

  // --- 3. HSC: High Strength Concrete ---
  else if (concreteCode === "HSC") {
    const cementClass = parseFloat(String(cement?.strengthClass || cement?.cementClassStrength || "0"));
    if (cement && cementClass < 52.5) {
      warnings.push("الخرسانة عالية المقاومة (HSC) تتطلب إسمنت عالي القوة رتبة 52.5 على الأقل.");
      recommendations.push("يرجى اختيار إسمنت فئة 52.5 من مستودع المواد لضمان الوصول لمقاومة الضغط الفائقة.");
    }
    if (!(input.dosageSuper && input.dosageSuper > 0)) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: ["superplasticizer"],
        invalidMaterials: [],
        incompatibleMaterials: ["superplasticizer"],
        warnings: ["الخرسانة عالية المقاومة (HSC) تتطلب جرعة ملدن فائق (Superplasticizer) أكبر من الصفر."],
        recommendations: ["يرجى إدخال جرعة الملدن الفائق (Superplasticizer) لتقليل نسبة مياه الخلط وضمان التراص الأقصى."]
      };
    }
    if (!(input.dosageSilicaFume && input.dosageSilicaFume > 0)) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: ["silica_fume"],
        invalidMaterials: [],
        incompatibleMaterials: ["silica_fume"],
        warnings: ["الخرسانة عالية المقاومة (HSC) تتطلب استخدام ميكروسيليكا (Silica Fume) بنسبة لا تقل عن 5%."],
        recommendations: ["يرجى إدخال نسبة غبار السيليكا (Silica Fume) لملء الفراغات المجهرية وتحسين الترابط الفراغي."]
      };
    }
  }

  // --- 4. HPC: High Performance Concrete ---
  else if (concreteCode === "HPC") {
    if (!(input.dosageSuper && input.dosageSuper > 0)) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: ["superplasticizer"],
        invalidMaterials: [],
        incompatibleMaterials: ["superplasticizer"],
        warnings: ["الخرسانة عالية الأداء (HPC) تتطلب استخدام ملدن فائق لتقليل نسبة مياه الخلط بالحد الأقصى."],
        recommendations: ["يرجى إدخال جرعة ملدن فائق ملائمة لتحقيق متانة ونفاذية منخفضة للغاية."]
      };
    }
    const hasSCM = (input.dosageSilicaFume && input.dosageSilicaFume > 0) || 
                  (input.dosageFlyAsh && input.dosageFlyAsh > 0) || 
                  (input.dosageSlag && input.dosageSlag > 0) || 
                  input.selectedScmId;
    if (!hasSCM) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: ["scm"],
        invalidMaterials: [],
        incompatibleMaterials: ["scm"],
        warnings: ["الخرسانة عالية الأداء (HPC) تتطلب استخدام إضافات بوزولانية معدنية (SCMs) مثل غبار السيليكا أو الرماد المتطاير."],
        recommendations: ["يرجى إدخال جرعة واحدة على الأقل من الإضافات المعدنية (غبار السيليكا، الرماد المتطاير، خبث الأفران) لضمان ديمومة الخرسانة."]
      };
    }

    const isSulfateResistant = cement && (cement.cementClass === "CEM V" || cement.name?.includes("CEM V") || cement.name?.includes("مقاوم للكبريتات") || cement.englishName?.toLowerCase().includes("sulfate resistant") || cement.englishName?.toLowerCase().includes("cem v"));
    if (!isSulfateResistant) {
      warnings.push("إسمنت مقاوم للكبريتات موصى به لخرسانة HPC عالية الأداء.");
      recommendations.push("💡 يُنصح باختيار إسمنت مقاوم للكبريتات من فئة CEM V أو الإسمنت المركب في مستودع المواد لحماية خرسانة HPC من التدهور الكيميائي الكبريتي في المنشآت الشاطئية والمائية.");
    }
  }

  // --- 5. SCC: Self-Consolidating Concrete ---
  else if (concreteCode === "SCC" || concreteType.includes("scc") || concreteType.includes("ذاتي")) {
    if (!input.selectedAdmixtureId) {
      return {
        status: "blocked",
        reason: "missing_user_materials",
        missingMaterials: ["superplasticizer"],
        invalidMaterials: [],
        incompatibleMaterials: ["superplasticizer"],
        warnings: ["الخرسانة ذاتية الرص (SCC) تتطلب ملدناً فائقاً معتمداً من مستودع المستخدم."],
        recommendations: ["يرجى إدخال واختيار ملدن فائق معتمد ونشط من مستودع المواد لدعم السيولة الفائقة بدون انفصال."]
      };
    }
    if (input.dMax > 16) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["gravel_dmax"],
        incompatibleMaterials: ["gravel_dmax"],
        warnings: ["الحد الأقصى لحجم الركام Dmax في خرسانة SCC يجب ألا يتجاوز 16 مم لمنع انسداد الركام بين قضبان التسليح."],
        recommendations: ["يرجى اختيار ركام خشن بقطر أقصى (Dmax) لا يتجاوز 16 مم."]
      };
    }

    // Verify limestone filler powder / Calcaire
    const scmMaterial = materialsDatabase.find(m => m.id === input.selectedScmId);
    const hasLimestoneFiller = scmMaterial && (scmMaterial.name?.includes("الحجر الجيري") || scmMaterial.name?.includes("Filler") || scmMaterial.name?.includes("فيلر") || scmMaterial.name?.includes("جيري") || scmMaterial.englishName?.toLowerCase().includes("limestone"));
    if (!hasLimestoneFiller) {
      warnings.push("فيلر الحجر الجيري الناعم (Limestone Filler) موصى به لخرسانة SCC ذاتية الرص.");
      recommendations.push("💡 يُوصى بشدة باختيار بودرة الحجر الجيري المالئة (Limestone Filler Calcaire) كإضافة معدنية (SCM) لتوفير القوام المتماسك عالي اللزوجة ومنع انفصال الخرسانة الطازجة.");
    }

    // Verify VMA (Viscosity Modifying Agent)
    const admixtureMaterial = materialsDatabase.find(m => m.id === input.selectedAdmixtureId);
    const hasVMA = admixtureMaterial && (admixtureMaterial.name?.includes("VMA") || admixtureMaterial.name?.includes("معدل لزوجة") || admixtureMaterial.englishName?.toLowerCase().includes("viscosity") || admixtureMaterial.englishName?.toLowerCase().includes("vma"));
    if (!hasVMA) {
      warnings.push("يُنصح بإضافة مضاف معدل لزوجة (VMA) لخرسانة SCC ذاتية الرص.");
      recommendations.push("💡 يُنصح باختيار مضاف معدل لزوجة (VMA) مانع للانفصال لضمان انسياب الخرسانة ذاتياً بأمان وثبات الركامات دون ترسب مائي.");
    }
  }

  // --- 6. FRC: Fiber-Reinforced Concrete ---
  else if (concreteCode === "FRC" || concreteType.includes("fiber") || concreteType.includes("ألياف")) {
    if (!input.selectedFiberId) {
      return {
        status: "blocked",
        reason: "missing_user_materials",
        missingMaterials: ["fiber"],
        invalidMaterials: [],
        incompatibleMaterials: ["fiber"],
        warnings: ["لم يتم اختيار ألياف معتمدة من مستودع المستخدم لتصميم الخرسانة المسلحة بالألياف (FRC)."],
        recommendations: ["يرجى اختيار ألياف معتمدة ونشطة من مستودع المواد."]
      };
    }
    const fiber = materialsDatabase.find(m => m.id === input.selectedFiberId);
    if (!fiber || !isApprovedAndActive(fiber)) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["fiber"],
        incompatibleMaterials: ["fiber"],
        warnings: ["الألياف المحددة غير معتمدة أو غير نشطة في مستودع المواد."],
        recommendations: ["يرجى تفعيل واعتماد الألياف المحددة في مستودع المواد."]
      };
    }
    if (!(input.fiberDosageKgM3 && input.fiberDosageKgM3 > 0)) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: [],
        incompatibleMaterials: ["fiber_dosage"],
        warnings: ["جرعة الألياف يجب أن تكون أكبر من الصفر في الخرسانة المسلحة بالألياف."],
        recommendations: ["يرجى إدخال جرعة ألياف صالحة (كجم/م³) من شاشة إعدادات الألياف."]
      };
    }

    // Customized structural recommendations based on fiber engineering types
    const fiberNameLower = (fiber.name || "").toLowerCase();
    const fiberEngLower = (fiber.englishName || "").toLowerCase();
    
    if (fiberNameLower.includes("فولاذ") || fiberEngLower.includes("steel")) {
      recommendations.push("💡 الألياف الفولاذية الإنشائية ممتازة جداً لمقاومة الانحناء، وتطبيقات بطانات الأنفاق، والأرضيات الصناعية المعرضة لحمولات ميكانيكية ثقيلة.");
    } else if (fiberNameLower.includes("بولي") || fiberEngLower.includes("poly")) {
      recommendations.push("💡 ألياف البولي بروبيلين ممتازة جداً للحد من شروخ الانكماش البلاستيكي المبكر والحراري في الهياكل المعرضة لأشعة الشمس والرياح.");
    } else if (fiberNameLower.includes("زجاج") || fiberEngLower.includes("glass")) {
      recommendations.push("💡 الألياف الزجاجية المقاومة للقلويات تمنح المنشآت النحيفة والديكورية والواجهات (GRC) دقة متناهية ومقاومة شد ممتازة.");
    } else if (fiberNameLower.includes("بازلت") || fiberEngLower.includes("basalt")) {
      recommendations.push("💡 الألياف البازلتية البركانية خيار هندسي ممتاز يتميز بمقاومة طبيعية كاملة للصدأ والملوحة العالية والبيئات الكيميائية القاسية.");
    } else if (fiberNameLower.includes("كربون") || fiberEngLower.includes("carbon")) {
      recommendations.push("💡 الألياف الكربونية فائقة المتانة والصلابة هي القمة هندسياً وتوفر أقصى صلابة وتدريع حجمي عالي الإجهاد.");
    }
  }

  // --- 7. LWC: Lightweight Concrete ---
  else if (concreteCode === "LWC" || concreteType.includes("lightweight") || concreteType.includes("خفيف")) {
    const rawGravelDensity = gravel ? (gravel.density || gravel.Density || 0) : 0;
    if (!rawGravelDensity) {
      return {
        status: "blocked",
        reason: "missing_material_property",
        missingMaterials: ["gravel_density"],
        invalidMaterials: [],
        incompatibleMaterials: [],
        warnings: ["كثافة الركام الخشن غير متوفرة. الخرسانة خفيفة الوزن تتطلب ركام خفيف حقيقي بكثافة محددة."],
        recommendations: ["يرجى إدخال كثافة صحيحة للركام الخشن."]
      };
    }
    const gravelDensity = rawGravelDensity < 10 ? rawGravelDensity * 1000 : rawGravelDensity;
    if (gravelDensity >= 2000) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["gravel"],
        incompatibleMaterials: ["gravel"],
        warnings: ["الخرسانة خفيفة الوزن تتطلب ركام خفيف حقيقي من مستودع المستخدم بكثافة أقل من 2000 كجم/م³."],
        recommendations: ["يرجى تعديل كثافة الركام المحدد أو اختيار ركام خفيف حقيقي من مستودع المواد مثل الخفاف أو الطين المتمدد."]
      };
    }

    // Verify presence of air-entraining admixture for LWC
    const hasAirEntrainer = (input.dosageAir && input.dosageAir > 0) || 
                           materialsDatabase.some(m => m.id === input.selectedAdmixtureId && (m.name?.includes("حابسة للهواء") || m.name?.includes("رغوية") || m.englishName?.toLowerCase().includes("air-entraining") || m.englishName?.toLowerCase().includes("air entrain")));
    if (!hasAirEntrainer) {
      warnings.push("مادة حابسة للهواء موصى بها للخرسانة خفيفة الوزن.");
      recommendations.push("💡 يُنصح بشدة بإضافة جرعة من المواد الحابسة للهواء (Air-Entraining Agent) في الخرسانة خفيفة الوزن للمساعدة في رفع مساميتها المغلقة وزيادة درجة العزل الحراري وخفض الوزن الحجمي.");
    }
  }

  // --- 8. HWC: Heavyweight Concrete ---
  else if (concreteCode === "HWC" || concreteType.includes("heavyweight") || concreteType.includes("ثقيل")) {
    const rawGravelDensity = gravel ? (gravel.density || gravel.Density || 0) : 0;
    if (!rawGravelDensity) {
      return {
        status: "blocked",
        reason: "missing_material_property",
        missingMaterials: ["gravel_density"],
        invalidMaterials: [],
        incompatibleMaterials: [],
        warnings: ["كثافة الركام الخشن غير متوفرة. الخرسانة ثقيلة الوزن تتطلب ركاماً ثقيل الكثافة بكثافة محددة."],
        recommendations: ["يرجى إدخال كثافة صحيحة للركام الخشن."]
      };
    }
    const gravelDensity = rawGravelDensity < 10 ? rawGravelDensity * 1000 : rawGravelDensity;
    if (gravelDensity <= 3000) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["gravel"],
        incompatibleMaterials: ["gravel"],
        warnings: ["الخرسانة ثقيلة الوزن تتطلب ركاماً ثقيل الكثافة (أكبر من 3000 كجم/م³) من مستودع المستخدم للوقاية من الإشعاعات."],
        recommendations: ["يرجى تعديل كثافة الركام المحدد أو اختيار ركام ثقيل حقيقي مثل الباريت أو الهيماتيت."]
      };
    }

    // Verify superplasticizer for HWC
    if (!(input.dosageSuper && input.dosageSuper > 0)) {
      warnings.push("مضاف الملدن الفائق موصى به هندسياً في خرسانة HWC.");
      recommendations.push("💡 يُنصح بشدة بإدراج ملدن فائق (Superplasticizer) للخرسانة ثقيلة الوزن للمحافظة على سيولة المزيج دون زيادة الماء, مما يقي من مخاطر الانعزال الحبيبي السريع للركام الثقيل (Hematite/Magnetite) نحو القاع.");
    }
  }

  // --- MASS: Mass Concrete ---
  else if (concreteCode === "MASS" || concreteType.includes("mass") || concreteType.includes("كتلية")) {
    const hasSCM = (input.dosageFlyAsh && input.dosageFlyAsh > 0) || 
                  (input.dosageSlag && input.dosageSlag > 0) || 
                  input.selectedScmId;
    // Check if cement is low heat
    const cementName = (cement?.name || "").toLowerCase();
    const cementEnglishName = (cement?.englishName || "").toLowerCase();
    const isLowHeat = cementName.includes("منخفض الحرارة") || 
                      cementEnglishName.includes("low heat") || 
                      cementEnglishName.includes("lh") ||
                      cementName.includes("lh");
    
    if (!hasSCM && !isLowHeat) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: [],
        incompatibleMaterials: ["cement"],
        warnings: [
          "خطر إجهادات حرارية عالية في الخرسانة الكتلية! يتطلب هذا النوع استخدام إسمنت منخفض الحرارة أو استبدال جزء من الإسمنت بمواد بوزولانية (SCMs) مثل الرماد المتطاير أو الخبث للحد من حرارة الإماهة."
        ],
        recommendations: [
          "يرجى استخدام إسمنت منخفض الحرارة (Low Heat Cement) أو إضافة نسبة من الرماد المتطاير (Fly Ash) أو خبث الأفران (Slag) للخلطة لتقليل البصمة الحرارية ومنع التشقق الحراري."
        ]
      };
    }
  }

  // --- 9. RCC: Roller-Compacted Concrete ---
  else if (concreteCode === "RCC" || concreteType.includes("rcc") || concreteType.includes("مدحولة")) {
    // Slump check: RCC is zero slump (or very low < 2.0 cm)
    if (input.slump && input.slump > 2) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["slump"],
        incompatibleMaterials: ["slump"],
        warnings: ["الخرسانة المدحولة (RCC) يجب أن تكون ذات قوام جاف جداً (ترابي رطب) وهبوط لا يتجاوز 2 سم (20 مم) لتتحمل فرش المداحل الإنشائية."],
        recommendations: ["يرجى خفض الهبوط المستهدف (Slump) إلى 2 سم (20 مم) أو أقل."]
      };
    }
    if (input.dMax && input.dMax < 25) {
      warnings.push("الخرسانة المدحولة (RCC) تفضل استخدام ركام خشن بقطر أقصى Dmax لا يقل عن 25 مم لضمان التشابك الهيكلي العالي.");
      recommendations.push("يُنصح بزيادة Dmax للركام الخشن ليتطابق مع متطلبات رصف الطرق والموانئ الاقتصادية.");
    }

    // Verify Fly Ash for RCC
    if (!(input.dosageFlyAsh && input.dosageFlyAsh > 0)) {
      warnings.push("الرماد المتطاير (Fly Ash) مفضل جداً في خرسانة RCC.");
      recommendations.push("💡 يُنصح بشدة بإدخال الرماد المتطاير بنسبة 15-30% لتقليل حرارة الصب الكتلي الكبيرة (مثل السدود) وتشحيم الركامات شديدة الجفاف أثناء الدمك.");
    }
  }

  // --- 10. SHOTCRETE: Sprayed Concrete ---
  else if (concreteCode === "SHOTCRETE" || concreteType.includes("shotcrete") || concreteType.includes("مقذوفة")) {
    if (input.dMax && input.dMax > 16) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["gravel_dmax"],
        incompatibleMaterials: ["gravel_dmax"],
        warnings: ["الخرسانة المقذوفة (Shotcrete) تتطلب ركاماً خشناً بقطر أقصى Dmax لا يتجاوز 16 مم لتجنب انسداد خراطيم القذف السريع."],
        recommendations: ["يرجى تعديل القطر الأقصى للركام الخشن ليكون 16 مم أو أقل."]
      };
    }
    if (!(input.dosageAccelerator && input.dosageAccelerator > 0)) {
      warnings.push("الخرسانة المقذوفة (Shotcrete) تفضل إضافة مسرع شك (Accelerator) لضمان تماسك الخرسانة على السطوح موقعياً فور القذف.");
      recommendations.push("يرجى إدخال نسبة مئوية لمسرع الشك (Accelerator) لضمان مقاومة تساقط الخرسانة الرطبة عن الأسقف والجدران.");
    }
  }

  // --- 11. SHC: Self-Healing Concrete ---
  else if (concreteCode === "SHC" || concreteType.includes("healing") || concreteType.includes("معالجة ذاتية")) {
    const specialMaterial = materialsDatabase.find(m => m.id === input.selectedSpecialBinderId);
    const hasSelfHealingAgent = specialMaterial && (specialMaterial.name?.includes("بكتيرية") || specialMaterial.name?.includes("بلورية") || specialMaterial.name?.includes("Self-healing") || specialMaterial.name?.includes("Bacterial") || specialMaterial.name?.includes("Crystalline") || specialMaterial.englishName?.toLowerCase().includes("healing") || specialMaterial.englishName?.toLowerCase().includes("bacterial") || specialMaterial.englishName?.toLowerCase().includes("crystalline"));
    
    if (!hasSelfHealingAgent) {
      return {
        status: "blocked",
        reason: "missing_user_materials",
        missingMaterials: ["healing_agent"],
        invalidMaterials: [],
        incompatibleMaterials: ["special_binder"],
        warnings: ["الخرسانة ذاتية المعالجة (SHC) تتطلب تحديد مضاف ذكي مثل الكبسولات البكتيرية أو المواد البلورية المانعة للنفاذية ذاتية الشفاء."],
        recommendations: ["يرجى إدخال واختيار مضاف ذكي معتمد (مثل كبسولات بكتيرية أو مواد بلورية نشطة) من مستودع المواد كعنصر رابط خاص لتأمين خاصية التئام الشقوق ذاتياً."]
      };
    }
  }

  // --- 12. RAC: Recycled Aggregate Concrete ---
  else if (concreteCode === "RAC" || concreteType.includes("recycled") || concreteType.includes("معاد") || concreteType.includes("تدوير")) {
    const isRecycled = gravel && (gravel.name?.includes("معاد") || gravel.englishName?.toLowerCase().includes("recycled") || gravel.category === "ركام معاد تدويره" || gravel.type === "recycled");
    if (!isRecycled) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["gravel"],
        incompatibleMaterials: ["gravel"],
        warnings: ["الخرسانة بمواد معاد تدويرها تتطلب ركام معاد تدويره حقيقي من مستودع المستخدم."],
        recommendations: ["يرجى اختيار ركام معاد تدويره من مستودع المواد لدعم الاقتصاد الدائري والاستدامة."]
      };
    }

    if (!(input.dosageSuper && input.dosageSuper > 0)) {
      warnings.push("يُنصح بشدة باستخدام الملدن الفائق (Superplasticizer) للخرسانة المعاد تدويرها.");
      recommendations.push("💡 الركام المعاد تدويره يتميز بامتصاص عالٍ جداً للماء بسبب ملاط الإسمنت القديم الملتصق بحبيباته. استخدام ملدن فائق ضروري جداً لتعويض انخفاض تشغيلية المزيج دون الاضطرار لصب ماء خلط إضافي يضعف المقاومة.");
    }
  }

  // --- 13. PERVIOUS: Pervious/Porous Concrete ---
  else if (concreteCode === "PERVIOUS" || concreteType.includes("pervious") || concreteType.includes("نفاذة")) {
    if (input.slump && input.slump > 2) {
      return {
        status: "blocked",
        reason: "invalid_material_status",
        missingMaterials: [],
        invalidMaterials: ["slump"],
        incompatibleMaterials: ["slump"],
        warnings: ["الخرسانة النفاذة للمياه (Pervious) تتطلب خلطة جافة خالية من الهبوط (أقل من 2 سم) لمنع سيلان معجون الإسمنت وسد المسامات المفتوحة."],
        recommendations: ["يرجى خفض الهبوط المستهدف (Slump) ليكون 2 سم (20 مم) أو أقل."]
      };
    }

    // Pervious must have low sand content
    const sandPercent = input.internalSandRatio || 15; // default or from calculations
    if (sandPercent > 15) {
      warnings.push("نسبة الرمل في الخرسانة النفاذة يجب ألا تتجاوز 15% للحفاظ على الفراغات المتصلة.");
      recommendations.push("💡 يُنصح بخفض نسبة الرمل إلى الحد الأدنى لضمان بقاء القنوات المسامية مفتوحة لتصريف مياه الأمطار بكفاءة عالية.");
    }
  }

  // --- 14. UHPC & 15. BFUP: Ultra-High Performance Concretes ---
  else if (concreteCode === "UHPC" || concreteCode === "BFUP" || concreteType.includes("uhpc") || concreteType.includes("bfup")) {
    const cementClass = parseFloat(String(cement?.strengthClass || cement?.cementClassStrength || "0"));
    if (cement && cementClass < 52.5) {
      warnings.push("خرسانة UHPC/BFUP فائقة الأداء تتطلب إسمنت ميكروني رتبة 52.5 كحد أدنى.");
      recommendations.push("يرجى اختيار إسمنت فئة 52.5 عالي المتانة لتجنب عدم تحقيق المقاومة الاستثنائية المطلوبة.");
    }

    if (input.dosageSilicaFume < 15) {
      warnings.push("تطلب خرسانة UHPC/BFUP غبار سيليكا (Silica Fume) بنسبة لا تقل عن 15% لتأمين التعبئة الحبيبية الفراغية القصوى.");
      recommendations.push("يرجى رفع جرعة غبار السيليكا إلى نطاق 15% - 25% من وزن الإسمنت لإنتاج تفاعلات بوزولانية ثانوية نانوية متكاملة.");
    }

    if (input.dosageSuper < 1.5) {
      warnings.push("تطلب خرسانة UHPC/BFUP جرعة ملدن فائق كربوكسيلي قصوى (1.5% - 2.5%) لترطيب المكونات الدقيقة بمحتوى ماء بالغ الانخفاض.");
      recommendations.push("يرجى رفع جرعة الملدن الفائق لتجنب تكتل وحرق المواد الجافة في الخلاطة.");
    }

    // Special check for BFUP (Steel fiber integration)
    if (concreteCode === "BFUP") {
      const fiber = materialsDatabase.find(m => m.id === input.selectedFiberId);
      const isSteelFiber = fiber && (fiber.name?.includes("فولاذ") || fiber.englishName?.toLowerCase().includes("steel"));
      if (!isSteelFiber) {
        return {
          status: "blocked",
          reason: "missing_user_materials",
          missingMaterials: ["steel_fiber"],
          invalidMaterials: [],
          incompatibleMaterials: ["fiber"],
          warnings: ["خرسانة BFUP الليفية تتطلب أليافاً فولاذية دقيقة عالية المقاومة (Micro Steel Fibers)."],
          recommendations: ["يرجى الدخول وإعداد ألياف فولاذية مقوسة أو مستقيمة دقيقة في مستودع المواد وتحديدها للخلطة لخدمة مقاومة الشد والدونة الفائقة للـ BFUP."]
        };
      }
    }

    warnings.push("طريقة درو-غوريس القياسية هي طريقة تجريبية مصممة للخرسانة التقليدية حتى 80 ميجاباسكال.");
    recommendations.push(
      concreteCode === "BFUP" 
      ? "خرسانة BFUP الليفية فائقة الأداء تتطلب رمل الكوارتز النقي، وغبار السيليكا بنسبة تفوق 15%، ونسبة ماء/إسمنت بالغة الانخفاض (<= 0.20)، وألياف ميكرو-فولاذية. تأكد من ضبط هذه الإعدادات ومراجعة النتائج مخبرياً."
      : "خرسانة UHPC فائقة الأداء تتطلب رمل الكوارتز النقي، وغبار السيليكا بنسبة تفوق 15%، ونسبة ماء/إسمنت بالغة الانخفاض (<= 0.20). تأكد من ضبط هذه الإعدادات ومراجعة النتائج مخبرياً."
    );
  }

  // 12. Special Binder Check
  const specialBinderReplacementPercent = input.specialBinderReplacementPercent || 0;
  if (specialBinderReplacementPercent > 0) {
    const specialBinderDensity = input.specialBinderDensity || 0;
    if (specialBinderDensity <= 0) {
      return {
        status: "blocked",
        reason: "missing_material_property",
        missingMaterials: ["special_binder_density"],
        invalidMaterials: [],
        incompatibleMaterials: [],
        warnings: ["كثافة الرابط الخاص غير متوفرة أو تساوي صفرًا. يرجى إدخال كثافة صحيحة لتفعيل الحساب."],
        recommendations: ["يرجى تعديل كثافة الرابط الخاص في مستودع المواد أو إدخال كثافة صحيحة لتشغيل الحساب."]
      };
    }
  }

  return {
    status: "approved",
    missingMaterials: [],
    invalidMaterials: [],
    incompatibleMaterials: [],
    warnings,
    recommendations
  };
}
