import { EngineeringMaterial, MaterialBatchRecord, MaterialBatchStatus } from "../types";

const nowIso = () => new Date().toISOString();

export function createMaterialBatch(
  materialId: string,
  values: Partial<MaterialBatchRecord> & { batchNumber: string }
): MaterialBatchRecord {
  const now = nowIso();
  return {
    id: values.id || `BATCH-${materialId}-${Date.now().toString(36).toUpperCase()}`,
    materialId,
    batchNumber: values.batchNumber,
    supplierName: values.supplierName,
    supplierContact: values.supplierContact,
    quarryName: values.quarryName,
    sourceLocation: values.sourceLocation,
    receivedDate: values.receivedDate,
    sampledDate: values.sampledDate,
    expiryDate: values.expiryDate,
    quantity: values.quantity,
    quantityUnit: values.quantityUnit,
    status: values.status || "قيد الفحص",
    moisture: values.moisture,
    absorption: values.absorption,
    ssdDensity: values.ssdDensity,
    propertyOverrides: { ...(values.propertyOverrides || {}) },
    laboratoryTestIds: [...(values.laboratoryTestIds || [])],
    lastValidatedTestId: values.lastValidatedTestId,
    validationDate: values.validationDate,
    approvedBy: values.approvedBy,
    approvalNotes: values.approvalNotes,
    notes: values.notes,
    createdAt: values.createdAt || now,
    updatedAt: now
  };
}

export function upsertMaterialBatch(
  material: EngineeringMaterial,
  input: Partial<MaterialBatchRecord> & { batchNumber: string }
): EngineeringMaterial {
  const existing = material.materialBatches || [];
  const candidate = existing.find(batch => batch.id === input.id);
  const batch = candidate
    ? { ...candidate, ...input, updatedAt: nowIso() } as MaterialBatchRecord
    : createMaterialBatch(material.id, input);
  const batches = candidate
    ? existing.map(item => item.id === batch.id ? batch : item)
    : [...existing, batch];
  const accepted = batches.filter(item => item.status === "مقبولة" || item.status === "مقبولة بشروط");
  const latest = accepted.sort((a, b) => String(b.validationDate || b.updatedAt).localeCompare(String(a.validationDate || a.updatedAt)))[0];
  // A newly created batch is normally "قيد الفحص". It must not become the
  // governing batch until the laboratory has accepted it.
  const governingBatch = batch.status === "مقبولة" || batch.status === "مقبولة بشروط"
    ? batch
    : existing.find(item => item.id === material.activeBatchId && (item.status === "مقبولة" || item.status === "مقبولة بشروط"))
      || latest;
  return {
    ...material,
    materialBatches: batches,
    activeBatchId: governingBatch?.id,
    latestValidatedBatchId: latest?.id,
    updatedDate: nowIso().slice(0, 10),
    updatedAt: Date.now()
  };
}

export function getActiveMaterialBatch(material?: EngineeringMaterial): MaterialBatchRecord | undefined {
  if (!material) return undefined;
  return (material.materialBatches || []).find(batch => batch.id === material.activeBatchId)
    || (material.materialBatches || []).find(batch => batch.id === material.latestValidatedBatchId)
    || (material.materialBatches || []).find(batch => batch.status === "مقبولة" || batch.status === "مقبولة بشروط");
}

export function resolveMaterialBatchProperties(material: EngineeringMaterial, batch?: MaterialBatchRecord): EngineeringMaterial {
  if (!batch) return material;
  const overrides = batch.propertyOverrides || {};
  const patch: Record<string, any> = { ...overrides };
  if (batch.moisture !== undefined) patch.moisture = batch.moisture;
  if (batch.absorption !== undefined) patch.absorption = batch.absorption;
  if (batch.ssdDensity !== undefined) patch.ssdDensity = batch.ssdDensity;
  return {
    ...material,
    ...patch,
    engineeringData: { ...(material.engineeringData || {}), ...patch }
  };
}

export interface MaterialBatchValidationIssue {
  code: string;
  severity: "error" | "warning";
  field?: string;
  messageAr: string;
  messageEn: string;
}

export function validateMaterialBatchForConcreteType(
  material: EngineeringMaterial | undefined,
  concreteType: string,
  batch?: MaterialBatchRecord
): MaterialBatchValidationIssue[] {
  if (!material) return [{ code: "material_missing", severity: "error", messageAr: "المادة غير موجودة في مستودع المواد.", messageEn: "Material is missing from the material library." }];
  const active = batch || getActiveMaterialBatch(material);
  const issues: MaterialBatchValidationIssue[] = [];
  if (!active) {
    issues.push({ code: "batch_missing", severity: "warning", messageAr: `لا توجد دفعة موقع مرتبطة بالمادة «${material.name}». ستستخدم القيم المرجعية فقط.`, messageEn: `No site batch is linked to “${material.name}”. Reference values only will be used.` });
    return issues;
  }
  const status = String(active.status);
  if (status === "\u0645\u0631\u0641\u0648\u0636\u0629" || status === "\u0645\u0624\u0631\u0634\u0641\u0629") {
    issues.push({ code: "batch_rejected", severity: "error", field: "status", messageAr: `الدفعة ${active.batchNumber} مرفوضة أو مؤرشفة ولا تصلح للحساب.`, messageEn: `Batch ${active.batchNumber} is rejected or archived and cannot be used.` });
  } else if (status === "\u0642\u064a\u062f \u0627\u0644\u0641\u062d\u0635") {
    issues.push({ code: "batch_pending", severity: "error", field: "status", messageAr: `الدفعة ${active.batchNumber} ما زالت قيد الفحص المخبري ولا يمكن استخدامها للاعتماد.`, messageEn: `Batch ${active.batchNumber} is still pending laboratory verification and cannot be approved.` });
  }
  if (active.expiryDate && new Date(active.expiryDate).getTime() < Date.now()) {
    issues.push({ code: "batch_expired", severity: "error", field: "expiryDate", messageAr: `الدفعة ${active.batchNumber} منتهية الصلاحية ولا يمكن استخدامها.`, messageEn: `Batch ${active.batchNumber} is expired and cannot be used.` });
  }
  const role = String(material.category || material.type || "").toLowerCase();
  const isAggregate = /رمل|رمال|حصى|ركام|aggregate|sand|gravel/.test(role);
  if (isAggregate) {
    if (active.moisture === undefined && material.moisture === undefined) {
      issues.push({ code: "batch_moisture_missing", severity: "error", field: "moisture", messageAr: `رطوبة دفعة ${active.batchNumber} غير مدخلة؛ لا يمكن تصحيح ماء الموقع بدقة.`, messageEn: `Moisture for batch ${active.batchNumber} is missing; site water correction cannot be verified.` });
    }
    if (active.absorption === undefined && material.absorption === undefined) {
      issues.push({ code: "batch_absorption_missing", severity: "error", field: "absorption", messageAr: `امتصاص دفعة ${active.batchNumber} غير مدخل.`, messageEn: `Absorption for batch ${active.batchNumber} is missing.` });
    }
    if (active.ssdDensity === undefined && material.ssdDensity === undefined && material.density === undefined) {
      issues.push({ code: "batch_ssd_density_missing", severity: "error", field: "ssdDensity", messageAr: `كثافة SSD لدفعة ${active.batchNumber} غير مدخلة.`, messageEn: `SSD density for batch ${active.batchNumber} is missing.` });
    }
  }
  const code = String(concreteType || "NSC").toUpperCase();
  if (["SCC", "UHPC", "BFUP"].includes(code) && material.dMax !== undefined && material.dMax > 16) {
    issues.push({ code: "batch_dmax_incompatible", severity: "error", field: "dMax", messageAr: `Dmax للمادة يتجاوز 16 مم، وهو غير مناسب لهذه الفئة.`, messageEn: `The material Dmax exceeds 16 mm and is incompatible with this concrete type.` });
  }
  if (code === "RAC" && active.absorption !== undefined && active.absorption > 8) {
    issues.push({ code: "recycled_absorption_high", severity: "warning", field: "absorption", messageAr: "امتصاص الركام المعاد تدويره مرتفع؛ يجب اعتماد حالة SSD وتصحيح الماء قبل الخلط.", messageEn: "Recycled aggregate absorption is high; SSD conditioning and water correction are required." });
  }
  return issues;
}

export function batchStatusLabel(status: MaterialBatchStatus, language: "ar" | "en" = "ar"): string {
  if (language === "en") {
    return ({ "قيد الفحص": "Pending test", "مقبولة": "Accepted", "مقبولة بشروط": "Accepted with conditions", "مرفوضة": "Rejected", "مؤرشفة": "Archived" } as Record<MaterialBatchStatus, string>)[status];
  }
  return status;
}
