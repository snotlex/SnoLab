import { MixDesignInput, MixDesignResult, ValidationResult, ApplicabilityResult } from "../../core/types";
import { computeMoistureBatch, makeSpecializedResult, materialDensityKgM3, materialProperty, resolveSpecializedMaterials } from "../shared/specializedMixDesignUtils";

type UhpcType = "UHPC" | "BFUP";
const VERSION = "1.0.0";

function code(input: MixDesignInput): UhpcType | null {
  const value = String(input.concreteType || "").trim().toUpperCase();
  return value === "UHPC" || value === "BFUP" ? value : null;
}
function clamp(v: number, min: number, max: number): number { return Math.min(max, Math.max(min, v)); }
function materialText(m: any): string { return [m?.name,m?.englishName,m?.frenchName,m?.type,m?.materialType,m?.category,m?.admixtureType].filter(Boolean).join(" ").toLowerCase(); }
function isSteelFiber(m: any): boolean { const t=materialText(m); return m?.fiberType==="steel" || t.includes("steel") || t.includes("فولاذ"); }
function isSilicaFume(m: any): boolean { const t=materialText(m); return m?.type==="silica_fume" || m?.admixtureType==="silica_fume" || t.includes("silica fume") || t.includes("microsilica") || t.includes("silice") || t.includes("سيليكا"); }
function isSuperplasticizer(m: any): boolean { const t=materialText(m); return m?.admixtureType==="superplasticizer" || t.includes("superplasticizer") || t.includes("superplastifiant") || t.includes("ملدن فائق"); }
function isQuartz(m: any): boolean { const t=materialText(m); return t.includes("quartz") || t.includes("quartzite") || t.includes("كوارتز") || t.includes("silice") || t.includes("سيليسي"); }
function resolveFiber(input: MixDesignInput): any | undefined {
  const db=Array.isArray(input.materialsDatabase)?input.materialsDatabase:[];
  if(!db.length) return undefined;
  if(input.selectedFiberId){ const hit=db.find((m:any)=>String(m?.id)===String(input.selectedFiberId)); if(hit) return hit; }
  const n=String(input.selectedFiberName||"").trim().toLowerCase();
  return n ? db.find((m:any)=>[m?.name,m?.englishName,m?.frenchName].filter(Boolean).some((v:any)=>String(v).trim().toLowerCase()===n)) : undefined;
}

export function checkUhpcBfupApplicability(input: MixDesignInput): ApplicabilityResult {
  const t=code(input);
  if(!t) return {level:"not_applicable",reasons:["UHPC/BFUP engine requires concreteType UHPC or BFUP."],recommendations:["Select UHPC or BFUP before calculation."]};
  const fck=Number(input.fck28||0);
  const reasons:string[]=[]; const recommendations:string[]=[];
  if(fck<100){reasons.push("Current UHPC/BFUP starting envelope expects fck28 >= 100 MPa.");recommendations.push("Use HSC/HPC for lower high-strength targets.");}
  if(fck>180){reasons.push("Current UHPC/BFUP starting envelope is limited to fck28 <= 180 MPa.");recommendations.push("Use a project-specific research/design workflow above 180 MPa.");}
  return {level:reasons.length?"limited":"applicable",reasons,recommendations};
}

export function validateUhpcBfupInputs(input: MixDesignInput, _language:"ar"|"fr"|"en"="ar"): ValidationResult {
  const errors:any[]=[]; const warnings:any[]=[]; const t=code(input);
  if(!t){errors.push({code:"concrete_type",severity:"error",field:"concreteType",message:"UHPC/BFUP engine requires UHPC or BFUP."});return {isValid:false,errors,warnings};}
  const fck=Number(input.fck28); const dMax=Number(input.dMax);
  const wb=Number((input as any).uhpcWaterBinderRatio ?? (input as any).bfupWaterBinderRatio ?? NaN);
  const sf=Number(input.dosageSilicaFume||0); const sp=Number(input.dosageSuper||0);
  const vf=Number((input as any).uhpcFiberVolumePercent ?? (input as any).bfupFiberVolumePercent ?? 2);
  if(!Number.isFinite(fck)||fck<100||fck>180) errors.push({code:"strength_envelope",severity:"error",field:"fck28",message:"UHPC/BFUP target strength must be 100-180 MPa in the current engine."});
  if(!Number.isFinite(dMax)||dMax<=0||dMax>5) errors.push({code:"dmax",severity:"error",field:"dMax",message:"UHPC/BFUP Dmax must be <=5 mm."});
  if(Number.isFinite(wb)&&(wb<0.18||wb>0.28)) errors.push({code:"water_binder",severity:"error",field:"uhpcWaterBinderRatio",message:"UHPC/BFUP W/B must be 0.18-0.28."});
  if(sf<15||sf>25) errors.push({code:"silica_fume",severity:"error",field:"dosageSilicaFume",message:"Silica-fume replacement must be 15-25% of binder."});
  if(sp<1.5||sp>4) errors.push({code:"superplasticizer",severity:"error",field:"dosageSuper",message:"Superplasticizer dosage must be 1.5-4.0% of binder."});
  if(vf<1||vf>3) errors.push({code:"fiber_volume",severity:"error",field:"uhpcFiberVolumePercent",message:"Steel-fiber volume must be 1-3%."});
  warnings.push({code:"trial_mix",severity:"warning",field:"trial_mix",message:"Laboratory optimization is mandatory for UHPC/BFUP."});
  return {isValid:errors.length===0,errors,warnings};
}

export function calculateUhpcBfupMix(input: MixDesignInput, language:"ar"|"fr"|"en"="ar"): MixDesignResult {
  const t=code(input);
  const mats=resolveSpecializedMaterials(input,language,true,true,false);
  const fiber=resolveFiber(input);
  const name=t==="BFUP"?"BFUP / Ultra-High-Performance Fibre Concrete":"UHPC / Ultra-High-Performance Concrete";
  const blocked=(recommendations:string[],checks:any[])=>makeSpecializedResult(input,{methodId:"uhpc-specialized",methodName:name,version:VERSION,cementKg:0,waterKg:0,fineAggregateKg:0,coarseAggregateKg:0,admixtureKg:0,waterBinderRatio:0,freshDensityKgM3:0,absoluteVolumeL:0,warnings:[],assumptions:[],recommendations,trace:[],complianceChecks:checks,lifecycle:"blocked"});
  if(!t) return blocked(["Select UHPC or BFUP."],[{parameter:"concrete_type",requirement:"UHPC/BFUP",actual:"Unsupported concrete type",status:"non_compliant"}]);
  const validation=validateUhpcBfupInputs(input,language);
  if(mats.errors.length||!validation.isValid) return blocked([...mats.errors,...validation.errors.map((e:any)=>e.message)],[...validation.errors.map((e:any)=>({parameter:e.code,requirement:"Valid UHPC/BFUP input",actual:e.message,status:"non_compliant"})),...mats.errors.map((e:string)=>({parameter:"materials",requirement:"Approved material set",actual:e,status:"non_compliant"}))]);
  const db=Array.isArray(input.materialsDatabase)?input.materialsDatabase:[];
  if(db.length&&!fiber) return blocked(["Select an approved steel-fiber material."],[{parameter:"fiber_material",requirement:"Approved steel fiber",actual:"Fiber material not found.",status:"non_compliant"}]);
  if(db.length&&fiber&&!isSteelFiber(fiber)) return blocked(["Selected fiber must be steel for the current UHPC/BFUP engine."],[{parameter:"fiber_compatibility",requirement:"Steel fiber",actual:"Selected fiber is not steel.",status:"non_compliant"}]);
  if(db.length&&!isSilicaFume(mats.materials.scm)) return blocked(["Select an approved silica-fume SCM."],[{parameter:"scm_compatibility",requirement:"Silica fume",actual:"Selected SCM is not silica fume.",status:"non_compliant"}]);
  if(db.length&&!isSuperplasticizer(mats.materials.admixture)) return blocked(["Select an approved superplasticizer."],[{parameter:"admixture_compatibility",requirement:"Superplasticizer",actual:"Selected admixture is not a superplasticizer.",status:"non_compliant"}]);
  if(db.length&&!mats.materials.quartzPowder) return blocked(["Select an approved ultra-fine quartz powder material for UHPC/BFUP."],[{parameter:"quartz_powder_material",requirement:"Approved quartz powder",actual:"Quartz powder material not found in the active material repository.",status:"non_compliant"}]);
  const quartzOk=db.length?isQuartz(mats.materials.sand):true;
  if(!quartzOk) return blocked(["Select an approved high-purity quartz/siliceous fine aggregate for UHPC/BFUP."],[{parameter:"quartz_sand",requirement:"Quartz/siliceous fine aggregate",actual:"Selected sand is not identified as quartz/siliceous.",status:"non_compliant"}]);

  const cementDensity=materialDensityKgM3(mats.materials.cement,Number(input.cementDensity||3150));
  const sandDensity=materialDensityKgM3(mats.materials.sand,Number(input.sandRelativeDensity||2.65)*1000);
  const silicaDensity=materialDensityKgM3(mats.materials.scm,Number(input.selectedScmDensity||2200));
  const admixtureDensity=materialDensityKgM3(mats.materials.admixture,Number(input.selectedAdmixtureDensity||1080));
  const quartzDensity=materialDensityKgM3(mats.materials.quartzPowder,Number(input.quartzPowderDensity||2650));
  const fiberDensity=materialDensityKgM3(fiber,Number(input.fiberDensity||7850));
  const fck=Number(input.fck28);
  const vf=clamp(Number((input as any).uhpcFiberVolumePercent ?? (input as any).bfupFiberVolumePercent ?? (t==="BFUP"?2:1.5)),1,3);
  const defaultWb=t==="BFUP"?0.21:0.24;
  const requestedWb=Number((input as any).uhpcWaterBinderRatio ?? (input as any).bfupWaterBinderRatio);
  const wb=clamp(Number.isFinite(requestedWb)?requestedWb:clamp(defaultWb-(fck-100)*0.00015,0.18,0.26),0.18,0.28);
  const binder=clamp(760+Math.max(0,fck-100)*1.2,760,900);
  const sfPct=clamp(Number(input.dosageSilicaFume||(t==="BFUP"?20:18)),15,25);
  const sfKg=binder*sfPct/100; const cementKg=binder-sfKg;
  const water=binder*wb; const spPct=clamp(Number(input.dosageSuper||2.2),1.5,4); const spKg=binder*spPct/100;
  const quartzKg=clamp(Number((input as any).uhpcQuartzPowderKgM3 ?? (t==="BFUP"?binder*0.30:binder*0.25)),100,260);
  const fiberKg=vf/100*fiberDensity; const airPct=clamp(Number(input.airContent||1.5),0.5,3);
  const vC=cementKg/cementDensity*1000; const vSF=sfKg/silicaDensity*1000; const vQ=quartzKg/quartzDensity*1000; const vW=water; const vSP=spKg/admixtureDensity*1000; const vF=fiberKg/fiberDensity*1000; const vAir=airPct*10;
  const vSand=1000-vC-vSF-vQ-vW-vSP-vF-vAir; const sandKg=vSand/1000*sandDensity;
  const correction=computeMoistureBatch(sandKg,Number(input.moistureSand||0),Number(input.sandAbsorption||materialProperty(mats.materials.sand,["absorption","Absorption"],0)||0));
  const waterToAdd=Math.max(0,water-correction.freeSurfaceWater+correction.absorptionDeficit);
  const filled=vC+vSF+vQ+vW+vSP+vF+vAir+vSand;
  const density=cementKg+sfKg+quartzKg+sandKg+fiberKg+waterToAdd+spKg;
  const checks:any[]=[
    {parameter:"strength",requirement:"100-180 MPa",actual:String(fck),status:fck>=100&&fck<=180?"compliant":"non_compliant"},
    {parameter:"water_binder",requirement:"0.18-0.28",actual:wb.toFixed(3),status:wb>=0.18&&wb<=0.28?"compliant":"non_compliant"},
    {parameter:"silica_fume",requirement:"15-25%",actual:sfPct.toFixed(1)+"%",status:"compliant"},
    {parameter:"superplasticizer",requirement:"1.5-4.0%",actual:spPct.toFixed(2)+"%",status:"compliant"},
    {parameter:"fiber_volume",requirement:"1-3 vol%",actual:vf.toFixed(2)+"%",status:"compliant"},
    {parameter:"dmax",requirement:"<=5 mm",actual:String(input.dMax),status:Number(input.dMax)<=5?"compliant":"non_compliant"},
    {parameter:"absolute_volume",requirement:"1000 L/m3",actual:filled.toFixed(2)+" L/m3",status:Math.abs(filled-1000)<=2?"compliant":"non_compliant"},
    {parameter:"trial_mix",requirement:"mandatory laboratory trial",actual:"Required",status:"warning"}
  ];
  if(vSand<=0) checks.push({parameter:"fine_aggregate_volume",requirement:">0 L/m3",actual:vSand.toFixed(2)+" L/m3",status:"non_compliant"});
  if(fiberKg<70||fiberKg>240) checks.push({parameter:"fiber_mass",requirement:"70-240 kg/m3 starting envelope",actual:fiberKg.toFixed(1)+" kg/m3",status:"non_compliant"});
  const blockedLifecycle=!isFinite(vSand)||vSand<=0||Math.abs(filled-1000)>2||fiberKg<70||fiberKg>240;
  const result:any=makeSpecializedResult(input,{
    methodId:"uhpc-specialized",methodName:name,version:VERSION,cementKg,waterKg:water,fineAggregateKg:sandKg,coarseAggregateKg:0,admixtureKg:spKg,admixtureName:String(mats.materials.admixture?.name||input.selectedAdmixtureName||"Superplasticizer"),scmKg:sfKg,fiberKg,waterBinderRatio:wb,freshDensityKgM3:density,absoluteVolumeL:filled,
    warnings:["UHPC/BFUP is a starting proportioning design, not a production certification.","Laboratory optimization of mixing energy, rheology, fiber dispersion and curing is mandatory."],
    assumptions:["Total binder="+binder.toFixed(1)+" kg/m3; cement="+cementKg.toFixed(1)+" kg/m3; silica fume="+sfKg.toFixed(1)+" kg/m3.","Quartz powder="+quartzKg.toFixed(1)+" kg/m3.","Steel fiber="+fiberKg.toFixed(1)+" kg/m3 ("+vf.toFixed(2)+" vol%).","No coarse aggregate is used in this starting UHPC/BFUP formulation."],
    recommendations:["Use the approved material-library records for silica fume, quartz/siliceous sand, superplasticizer and steel fiber.","Verify fresh rheology and fiber dispersion by laboratory trial batches.","Verify compressive and flexural/residual performance at the project curing regime.","For BFUP, include post-cracking fiber performance verification."],
    trace:[
      {stepId:"uhpc-1",label:"Set total binder from starting envelope.",formula:"B = strength-dependent starting binder envelope",inputs:{fck,type:t},output:binder,unit:"kg/m3"},
      {stepId:"uhpc-2",label:"Split binder into cement and silica fume.",formula:"SF=B·SF%; Cement=B-SF",inputs:{sfPct},output:{cementKg,sfKg},unit:"kg/m3"},
      {stepId:"uhpc-3",label:"Set water from W/B.",formula:"W=B·(W/B)",inputs:{wb},output:water,unit:"kg/m3"},
      {stepId:"uhpc-4",label:"Set superplasticizer.",formula:"SP=B·SP%",inputs:{spPct},output:spKg,unit:"kg/m3"},
      {stepId:"uhpc-5",label:"Set quartz powder and steel-fiber content.",formula:"Mf=Vf·rho_fiber",inputs:{quartzKg,vf,fiberDensity},output:{quartzKg,fiberKg},unit:"kg/m3"},
      {stepId:"uhpc-6",label:"Close absolute volume with fine aggregate.",formula:"V_sand=1000-ΣV_constituents",inputs:{vC,vSF,vQ,vW,vSP,vF,vAir},output:vSand,unit:"L/m3"},
      {stepId:"uhpc-7",label:"Correct batching water for fine aggregate moisture.",formula:"Wadd=W-Wfree+Wdeficit",inputs:{freeSurfaceWater:correction.freeSurfaceWater,absorptionDeficit:correction.absorptionDeficit},output:waterToAdd,unit:"kg/m3"}
    ],
    complianceChecks:checks,lifecycle:blockedLifecycle?"blocked":"needs_trial_mix"
  });
  result.waterToAdd=waterToAdd; result.batchWaterToAdd=waterToAdd; result.sandWeightWet=correction.wetKg; result.sandTotalMoistureWater=correction.moistureWater; result.totalFreeSurfaceWater=correction.freeSurfaceWater; result.totalAbsorptionDeficit=correction.absorptionDeficit;
  result.quartzPowderKg=quartzKg; result.quartzPowderDensity=quartzDensity; result.steelFiberKg=fiberKg; result.steelFiberVolumePercent=vf; result.steelFiberDensity=fiberDensity;
  result.engineeringAudit={specializedMethod:t,framework:"ACI 239R-18 / AFGC-oriented UHPC/BFUP starting proportioning",targetStrengthMPa:fck,binderKgM3:binder,waterBinderRatio:wb,silicaFumePercent:sfPct,quartzPowderKgM3:quartzKg,steelFiberKgM3:fiberKg,steelFiberVolumePercent:vf,coarseAggregateUsed:false,mandatoryTrialMix:true};
  result.materialSuitability={status:blockedLifecycle?"blocked":"approved",missingMaterials:[],invalidMaterials:[],incompatibleMaterials:blockedLifecycle?["UHPC/BFUP numerical envelope or volume closure"]:[],warnings:[],recommendations:["Laboratory trial-mix verification is mandatory."]};
  return result as MixDesignResult;
}
