import { SEEDED_MATERIALS } from './src/data/seededMaterials.ts';
import { auditMaterialLibrary } from './src/services/materialAuditEngine.ts';
import { normalizeMaterialRole } from './src/services/materialPropertySchema.ts';

const materials = SEEDED_MATERIALS;
const ids = new Map(), names = new Map();
const duplicates = [];
for (const m of materials) {
  const id = String(m.id || '').trim();
  const name = String(m.name || '').trim().toLowerCase();
  if (ids.has(id)) duplicates.push({kind:'id', value:id, first:ids.get(id), second:m.name}); else ids.set(id,m.name);
  if (names.has(name)) duplicates.push({kind:'name', value:name, first:names.get(name), second:m.id}); else names.set(name,m.id);
}
const roles = {};
for (const m of materials) { const r=normalizeMaterialRole(m); roles[r]=(roles[r]||0)+1; }
const report = auditMaterialLibrary(materials, 'dreux', 'standard');
const topInvalid = report.results.filter(r => r.invalidRequiredCount || r.invalidOptionalCount).slice(0,50).map(r=>({id:r.materialId,name:r.materialName,role:r.role,readiness:r.readinessStatus,score:r.completenessScore,missingRequired:r.missingRequiredProperties.map(p=>p.key),invalid:r.invalidProperties.map(p=>({key:p.definition.key,value:p.value,error:p.errorEn}))}));
const out={count:materials.length,duplicates,roles,health:report.overallHealthScore,ready:report.readyMaterialsCount,incomplete:report.incompleteMaterialsCount,needsReview:report.needsReviewMaterialsCount,topMissing:report.topMissingProperties.slice(0,20),invalidMaterials:topInvalid,allIdsUnique:duplicates.filter(d=>d.kind==='id').length===0};
console.log(JSON.stringify(out,null,2));
