import json

with open("scripts/seeded_materials.json", "r", encoding="utf-8") as f:
    existing_materials = json.load(f)

with open("scripts/schemas_dict.json", "r", encoding="utf-8") as f:
    schemas = json.load(f)

def get_role_robust(m):
    cat = (m.get('category') or '').lower()
    typ = (m.get('type') or '').lower()
    name = (m.get('name') or '').lower()
    
    # Priority 1: Check category keywords
    if any(x in cat for x in ['إضافات', 'admixture', 'adjuvant', 'ملدن']):
        return 'admixture'
    if any(x in cat for x in ['إسمنت', 'cement', 'ciment', 'أسمنت']):
        return 'cement'
    if any(x in cat for x in ['ماء', 'مياه', 'water', 'eau']):
        return 'water'
    if any(x in cat for x in ['رمل', 'sand', 'sable']):
        return 'sand'
    if any(x in cat for x in ['حصى', 'حصمة', 'gravel', 'gravier', 'ركام خشن', 'coarse']):
        return 'gravel'
    if any(x in cat for x in ['ركام خفيف', 'lightweight']):
        return 'lightweightAggregate'
    if any(x in cat for x in ['ركام ثقيل', 'heavyweight']):
        return 'heavyweightAggregate'
    if any(x in cat for x in ['معاد تدوير', 'recycled', 'rca']):
        return 'recycledAggregate'
    if any(x in cat for x in ['معدنية', 'scm', 'بوزولان', 'خبث', 'سيليكا', 'رماد']):
        return 'scm'
    if any(x in cat for x in ['مالئة', 'filler']):
        return 'filler'
    if any(x in cat for x in ['ألياف', 'fiber', 'fibre']):
        return 'fiber'
    if any(x in cat for x in ['هواء', 'air']):
        return 'airContent'
    if any(x in cat for x in ['تربة', 'soil', 'subbase']):
        return 'soil'
    if any(x in cat for x in ['بيتومين', 'زفت', 'إسفلت', 'bitumen', 'asphalt']):
        return 'bituminous'
    if any(x in cat for x in ['بناء', 'طوب', 'بلوك', 'maçonnerie', 'masonry', 'ملاط']):
        return 'masonry'
    if any(x in cat for x in ['جيوبوليمر', 'geopolymer', 'رابط خاص']):
        return 'specialBinder'

    comb = f'{cat} {typ} {name}'
    if any(x in comb for x in ['admixture', 'adjuvant', 'ملدن', 'superplasticizer', 'plasticizer']):
        return 'admixture'
    if any(x in comb for x in ['إسمنت', 'cement', 'ciment', 'أسمنت', 'cem i', 'cem ii']):
        return 'cement'
    if any(x in comb for x in ['ركام خفيف', 'lightweight', 'خفاف', 'طين ممتد']):
        return 'lightweightAggregate'
    if any(x in comb for x in ['ركام ثقيل', 'heavyweight', 'باريت', 'ماغنتيت']):
        return 'heavyweightAggregate'
    if any(x in comb for x in ['معاد تدوير', 'recycled', 'rca']):
        return 'recycledAggregate'
    if any(x in comb for x in ['رمل', 'sand', 'sable']):
        return 'sand'
    if any(x in comb for x in ['حصى', 'حصمة', 'gravel', 'gravier']):
        return 'gravel'
    if any(x in comb for x in ['معدنية', 'scm', 'بوزولان', 'خبث', 'سيليكا', 'رماد']):
        return 'scm'
    if any(x in comb for x in ['مالئة', 'filler']):
        return 'filler'
    if any(x in comb for x in ['ألياف', 'fiber', 'fibre']):
        return 'fiber'
    if any(x in comb for x in ['هواء', 'air']):
        return 'airContent'
    if any(x in comb for x in ['ماء', 'مياه', 'water', 'eau']):
        return 'water'
    if any(x in comb for x in ['تربة', 'soil']):
        return 'soil'
    if any(x in comb for x in ['زفت', 'بيتومين', 'asphalt', 'bitumen']):
        return 'bituminous'
    if any(x in comb for x in ['طوب', 'بلوك', 'masonry', 'آجر']):
        return 'masonry'
    return 'other'

enriched_materials = []

for m in existing_materials:
    role = get_role_robust(m)
    schema_props = schemas.get(role, [])
    
    m["engineeringData"] = {}
    m["propertyMetadata"] = {}
    m["isSystem"] = True
    m["isDemo"] = True
    m["approvalStatus"] = "Approved"
    
    for prop in schema_props:
        pkey, pid, l_ar, l_fr, l_en, unit, inp_type, cat_grp, std, def_val = prop[0:10]
        
        curr_val = m.get(pkey)
        if curr_val is None or curr_val == "":
            if pkey == "dMax":
                curr_val = m.get("Dmax")
            elif pkey == "dMin":
                curr_val = m.get("dmin")
            elif pkey == "absorption":
                curr_val = m.get("waterAbsorption")
            elif pkey == "moisture":
                curr_val = m.get("moistureContent")
            elif pkey == "finenessModulus":
                curr_val = m.get("fineness_modulus")
            elif pkey == "sandEquivalent":
                curr_val = m.get("sand_equivalent")
            elif pkey == "recommendedDosage":
                curr_val = m.get("dosage") or m.get("recommendedDosagePercent")
            elif pkey == "waterReduction":
                curr_val = m.get("waterReductionPercent")
            elif pkey == "pozzolanicIndex":
                curr_val = m.get("activityIndex")
            elif pkey == "tensileStrength":
                curr_val = m.get("fiberTensileStrength")
        
        final_val = curr_val if (curr_val is not None and curr_val != "") else def_val
        
        m[pkey] = final_val
        m["engineeringData"][pkey] = final_val
        
        m["propertyMetadata"][pkey] = {
            "key": pkey,
            "propertyId": pid,
            "value": final_val,
            "unit": unit,
            "sourceType": "reference",
            "sourceLabel": "Standard Specification Reference",
            "status": "default_reference",
            "testStandard": std,
            "isEditable": True,
            "originalDefaultValue": final_val,
            "confidence": "High (Standard Specification)",
            "notes": "القيمة المرجعية القياسية المعتمدة",
            "history": []
        }
        
    enriched_materials.append(m)

new_mats = [
  {
    "id": "sys-soil-gnt-a",
    "name": "حبات حصوية غير معالجة GNT 0/20 رتبة A (Grave Non Traitée)",
    "englishName": "Untreated Aggregate Mixture GNT 0/20 Class A",
    "category": "تربة هندسية وركام طبقات الرصف (Soil / Subbase)",
    "type": "GNT 0/20 Type A",
    "quality": "مطابقة للمواصفة الجزائرية والأوروبية لطبقات الأساس",
    "uses": "طبقات الأساس لشبكات الطرق السريعة والمطارات ومواقف الشاحنات",
    "desc": "ركام طبقة أساس للطرق السريعة ومشاريع البنية التحتية ذات قدرة تحمل عالية وتدرج كثيف مستمر.",
    "rating": 4.9,
    "provenance": "محجر الرويبة المركزي - الجزائر",
    "status": "نشط",
    "approvalStatus": "Approved",
    "role": "soil"
  },
  {
    "id": "sys-soil-clay",
    "name": "طين طميي طبيعي مضغوط (Compacted Silty Clay)",
    "englishName": "Compacted Natural Silty Clay",
    "category": "تربة هندسية وركام طبقات الرصف (Soil / Subbase)",
    "type": "Silty Clay CL",
    "quality": "تربة متماسكة مختبرة وفق أصول ميكانيكا التربة",
    "uses": "أعمال الردم الهندسي وسدود الحجز الترابية وقواعد التأسيس",
    "desc": "تربة تأسيس ناعمة متماسكة لمشاريع الردميات الهندسية والسدود الترابية وسدادات النفاذية.",
    "rating": 4.5,
    "provenance": "موقع أعمال الحفر - وادي الحراش",
    "status": "نشط",
    "approvalStatus": "Approved",
    "role": "soil"
  },
  {
    "id": "sys-bit-40-50",
    "name": "بيتومين نقي رصف درجات 40/50 (Paving Bitumen)",
    "englishName": "Pure Paving Grade Bitumen 40/50",
    "category": "مواد بيتومينية وخلطات إسفلتية (Bituminous Materials)",
    "type": "Bitumen 40/50",
    "quality": "مطابق لمعايير EN 12591 ومواصفات نفطال",
    "uses": "الخلطات الإسفلتية الساخنة للطبقات الرابطة والسطحية للأحمال الثقيلة",
    "desc": "بيتومين نقي صلد مخصص للطبقات الرابطة والسطحية في المناطق الحارة والحمولات المحورية الثقيلة.",
    "rating": 4.8,
    "provenance": "مصفاة نفطال - الجزائر",
    "status": "نشط",
    "approvalStatus": "Approved",
    "role": "bituminous"
  },
  {
    "id": "sys-bit-pmb",
    "name": "بيتومين معدل بالبوليمر عالي الأداء PmB 45/80-65 (SBS Polymer Modified)",
    "englishName": "Polymer Modified Bitumen PmB 45/80-65 SBS",
    "category": "مواد بيتومينية وخلطات إسفلتية (Bituminous Materials)",
    "type": "PmB 45/80-65 SBS",
    "quality": "فائق الأداء والمطاطية مع مقاومة فائقة للتشقق",
    "uses": "الطرق السريعة ذات الكثافة المرورية الشديدة وجسور المطارات",
    "desc": "بيتومين بوليمري ذو مرونة فائقة ومقاومة ممتازة للتخدد والتشققات الحرارية لحركة المرور الكثيفة.",
    "rating": 4.9,
    "provenance": "وحدة إنتاج البيتومين المعدل - وهران",
    "status": "نشط",
    "approvalStatus": "Approved",
    "role": "bituminous"
  },
  {
    "id": "sys-asphalt-bbsg",
    "name": "خرسانة بيتومينية شبه كثيفة BBSG 0/10 رتبة 3 (Béton Bitumineux)",
    "englishName": "Semi-Dense Asphalt Concrete BBSG 0/10 Class 3",
    "category": "مواد بيتومينية وخلطات إسفلتية (Bituminous Materials)",
    "type": "BBSG 0/10 Classe 3",
    "quality": "مقاومة عالية للنزف والتخدد ومطابقة للمواصفة الفرنسية NF EN 13108-1",
    "uses": "الطبقات السطحية للطرق الحضرية والسريعة",
    "desc": "خلطة إسفلتية ساخنة للطبقة السطحية ذات ملمس خشن ومقاومة عالية للانزلاق ومقاومة التخدد الدائم.",
    "rating": 4.8,
    "provenance": "محطة الخلط الإسفلتي الكبرى - الجزائر",
    "status": "نشط",
    "approvalStatus": "Approved",
    "role": "bituminous"
  },
  {
    "id": "sys-asphalt-bbme",
    "name": "خرسانة بيتومينية عالية المعامل BBME 0/14 (High Modulus Asphalt)",
    "englishName": "High Modulus Asphalt Concrete BBME 0/14",
    "category": "مواد بيتومينية وخلطات إسفلتية (Bituminous Materials)",
    "type": "BBME 0/14 Classe 1",
    "quality": "معامل جساءة هيكلية فائق يقلل سماكات الرصف",
    "uses": "طبقات الأساس الهيكلية الثقيلة وممرات هبوط الطائرات",
    "desc": "خلطة إسفلتية هيكلية ذات معامل مرونة عالٍ جداً للطبقات الأساسية في الطرق السريعة والمطارات.",
    "rating": 4.9,
    "provenance": "محطة الخرسانة الإسفلتية المركزية",
    "status": "نشط",
    "approvalStatus": "Approved",
    "role": "bituminous"
  },
  {
    "id": "sys-mas-block-20",
    "name": "بلوك خرساني مجوف قياسي 20x20x40 (Hollow Concrete Block)",
    "englishName": "Standard Hollow Concrete Masonry Block 20x20x40",
    "category": "عناصر البناء والملاط (Masonry Units & Mortars)",
    "type": "Hollow Block B40",
    "quality": "أبعاد دقيقة ومقاومة ضغط معتمدة EN 771-3",
    "uses": "الجدران الحاملة والستائر الخارجية والقواطع المعمارية",
    "desc": "وحدات بناء خرسانية مجوفة عالية المقاومة للجدران الحاملة والفواصل المعمارية مع عزل حراري وصوتي.",
    "rating": 4.7,
    "provenance": "مصنع المنتجات الإسمنتية الجاهزة - البليدة",
    "status": "نشط",
    "approvalStatus": "Approved",
    "role": "masonry"
  },
  {
    "id": "sys-mas-clay-brick",
    "name": "طوب أحمر فخاري مثقب 12 ثقب (Perforated Red Clay Brick)",
    "englishName": "12-Hole Perforated Red Clay Brick",
    "category": "عناصر البناء والملاط (Masonry Units & Mortars)",
    "type": "Perforated Clay Brick",
    "quality": "حرق عالي، مسامية مضبوطة، مقاومة للحريق",
    "uses": "الجدران المزدوجة المعزولة والواجهات المعمارية",
    "desc": "طوب طيني محروق ومثقب عالي الجودة للواجهات المعمارية وجدران العزل المزدوجة المقاومة للحريق.",
    "rating": 4.6,
    "provenance": "مصنع القرميد والآجر الطيني - سطيف",
    "status": "نشط",
    "approvalStatus": "Approved",
    "role": "masonry"
  },
  {
    "id": "sys-mas-mortar-m10",
    "name": "ملاط بناء جاهز جاف رتبة M10 (Ready-Mix Masonry Mortar)",
    "englishName": "Factory-Made Dry Masonry Mortar Class M10",
    "category": "عناصر البناء والملاط (Masonry Units & Mortars)",
    "type": "Factory-Made Mortar M10",
    "quality": "تجانس كيميائي فائق وقوة التصاق مبنية على EN 998-2",
    "uses": "بناء وحدات البلوك والآجر وأعمال التثبيت الإنشائي",
    "desc": "ملاط ربط وتثبيت صناعي جاف مخلوط مسبقاً ذو التصاق ممتاز وتوافق تام مع وحدات البلوك والآجر.",
    "rating": 4.7,
    "provenance": "مصنع الملاط الجاف الحديث - برج بوعريريج",
    "status": "نشط",
    "approvalStatus": "Approved",
    "role": "masonry"
  }
]

for nm in new_mats:
    role = nm["role"]
    schema_props = schemas.get(role, [])
    
    eng_data = {}
    prop_meta = {}
    
    nm["isSystem"] = True
    nm["isDemo"] = True
    
    for prop in schema_props:
        pkey, pid, l_ar, l_fr, l_en, unit, inp_type, cat_grp, std, def_val = prop[0:10]
        nm[pkey] = def_val
        eng_data[pkey] = def_val
        prop_meta[pkey] = {
            "key": pkey,
            "propertyId": pid,
            "value": def_val,
            "unit": unit,
            "sourceType": "reference",
            "sourceLabel": "Standard Specification Reference",
            "status": "default_reference",
            "testStandard": std,
            "isEditable": True,
            "originalDefaultValue": def_val,
            "confidence": "High (Standard Specification)",
            "notes": "القيمة المرجعية القياسية المعتمدة",
            "history": []
        }
    
    nm["engineeringData"] = eng_data
    nm["propertyMetadata"] = prop_meta
    del nm["role"]
    enriched_materials.append(nm)

print(f"Total materials after enrichment: {len(enriched_materials)}")

ts_content = "import { EngineeringMaterial } from '../types';\n\n"
ts_content += "export const SEEDED_MATERIALS: EngineeringMaterial[] = " + json.dumps(enriched_materials, ensure_ascii=False, indent=2) + ";\n"

with open("src/data/seededMaterials.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Saved src/data/seededMaterials.ts successfully!")
