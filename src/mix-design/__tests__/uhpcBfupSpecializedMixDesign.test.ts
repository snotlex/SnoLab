import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../engine/calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";
import { validateUhpcBfupInputs } from "../methods/uhpc/uhpcBfupMixDesign";

const uhpcMaterials: any[] = [
  { id:"cem-uhpc",name:"CEM I 52.5 R",englishName:"CEM I 52.5 R",category:"إسمنت",type:"cementitious",density:3150,strengthClass:52.5,status:"نشط",approvalStatus:"Approved" },
  { id:"sand-uhpc",name:"Rhyad Quartz Sand 0/2",englishName:"High Purity Quartz Sand",category:"رمال",type:"sand",density:2650,absorption:0.5,moisture:0.2,finenessModulus:1.6,status:"نشط",approvalStatus:"Approved" },
  { id:"sf-uhpc",name:"Silica Fume",englishName:"Densified Silica Fume",category:"إضافات معدنية",type:"silica_fume",admixtureType:"silica_fume",density:2200,status:"نشط",approvalStatus:"Approved" },
  { id:"qp-uhpc",name:"Ultra-Fine Quartz Powder",englishName:"Ultra-Fine Quartz Powder",category:"إضافات معدنية",type:"quartz_powder",density:2650,status:"نشط",approvalStatus:"Approved" },
  { id:"sp-uhpc",name:"PCE Superplasticizer",englishName:"Polycarboxylate Superplasticizer",category:"إضافات كيميائية",type:"superplasticizer",admixtureType:"superplasticizer",density:1080,status:"نشط",approvalStatus:"Approved" },
  { id:"fib-uhpc",name:"Steel Fibers",englishName:"Steel Fibers",category:"ألياف",type:"fiber",fiberType:"steel",density:7850,fiberDensity:7850,status:"نشط",approvalStatus:"Approved" },
  { id:"water-uhpc",name:"Mixing Water",englishName:"Mixing Water",category:"ماء",type:"water",density:1000,status:"نشط",approvalStatus:"Approved" }
];

function input(overrides: Record<string, any> = {}) {
  return createTestInput({
    concreteType:"UHPC",fck28:120,dMax:2,slump:2,cementType:"CEM I 52.5 R",sandType:"Rhyad Quartz Sand 0/2",
    selectedCementId:"cem-uhpc",selectedSandId:"sand-uhpc",selectedScmId:"sf-uhpc",selectedScmName:"Silica Fume",
    selectedQuartzPowderId:"qp-uhpc",selectedQuartzPowderName:"Ultra-Fine Quartz Powder",
    selectedAdmixtureId:"sp-uhpc",selectedAdmixtureName:"PCE Superplasticizer",selectedFiberId:"fib-uhpc",selectedFiberName:"Steel Fibers",selectedWaterId:"water-uhpc",selectedWaterName:"Mixing Water",
    dosageSilicaFume:18,dosageSuper:2.2,uhpcWaterBinderRatio:0.22,uhpcFiberVolumePercent:1.8,uhpcQuartzPowderKgM3:180,
    materialsDatabase:uhpcMaterials,moistureSand:0.2,sandAbsorption:0.5, ...overrides
  });
}

describe("UHPC/BFUP specialized mix-design engine",()=>{
  it("routes UHPC automatically to the specialized engine and produces a preliminary mix",()=>{
    const r:any=calculateMixDesign(input());
    expect(r.methodId).toBe("uhpc-specialized");
    expect(r.status).toBe("success");
    expect(r.isValid).toBe(true);
    expect(r.calculationStatus).toBe("needs_trial_mix");
    expect(r.cementKg).toBeGreaterThan(0);
    expect(r.scmKg).toBeGreaterThan(0);
    expect(r.steelFiberKg).toBeGreaterThan(70);
    expect(r.quartzPowderKg).toBe(180);
    expect(r.engineeringAudit?.specializedMethod).toBe("UHPC");
  });

  it("routes BFUP to the same specialized engine with fiber-specific identity",()=>{
    const r:any=calculateMixDesign(input({concreteType:"BFUP",fck28:140,bfupFiberVolumePercent:2.1}));
    expect(r.methodId).toBe("uhpc-specialized");
    expect(r.status).toBe("success");
    expect(r.isValid).toBe(true);
    expect(r.calculationStatus).toBe("needs_trial_mix");
    expect(r.steelFiberVolumePercent).toBeCloseTo(2.1,6);
    expect(r.engineeringAudit?.specializedMethod).toBe("BFUP");
  });


  it("validates BFUP-specific W/B rather than a conflicting UHPC field", () => {
    const validation = validateUhpcBfupInputs(input({
      concreteType: "BFUP",
      fck28: 140,
      dMax: 2,
      bfupWaterBinderRatio: 0.15,
      uhpcWaterBinderRatio: 0.22,
      bfupFiberVolumePercent: 2.0,
      uhpcFiberVolumePercent: 1.5
    }));

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((error) => error.code === "water_binder")).toBe(true);
  });

  it("rejects explicit quartz-powder values that calculation would otherwise clamp", () => {
    const validation = validateUhpcBfupInputs(input({
      concreteType: "UHPC",
      fck28: 120,
      dMax: 2,
      uhpcWaterBinderRatio: 0.22,
      uhpcFiberVolumePercent: 1.8,
      uhpcQuartzPowderKgM3: 280
    }));

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((error) => error.code === "quartz_powder")).toBe(true);
  });

  it("uses the documented UHPC/BFUP defaults only when dosage fields are omitted", () => {
    const validation = validateUhpcBfupInputs(input({
      dosageSilicaFume: undefined,
      dosageSuper: undefined
    }));
    expect(validation.isValid).toBe(true);

    const explicitZero = validateUhpcBfupInputs(input({
      dosageSilicaFume: 0,
      dosageSuper: 0
    }));
    expect(explicitZero.isValid).toBe(false);
    expect(explicitZero.errors.some((error) => error.code === "silica_fume")).toBe(true);
    expect(explicitZero.errors.some((error) => error.code === "superplasticizer")).toBe(true);
  });

  it("blocks UHPC when the selected material library contains no quartz powder",()=>{
    const db=uhpcMaterials.filter((m)=>m.id!=="qp-uhpc");
    const r:any=calculateMixDesign(input({materialsDatabase:db,selectedQuartzPowderId:undefined,selectedQuartzPowderName:undefined}));
    expect(r.isValid).toBe(false);
    expect(r.status).toBe("not-supported");
    expect(r.calculationStatus).toBe("blocked");
  });

  it("does not route UHPC through Dreux-Gorisse",()=>{
    const r:any=calculateMixDesign(input());
    expect(r.methodId).not.toBe("dreux-gorisse");
  });
});
