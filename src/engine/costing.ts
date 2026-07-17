export interface CostItem {
  material: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  cost: number;
}

export interface CostingResult {
  costBreakdown: CostItem[];
  totalCost: number;
}

export function calculateCosting(params: {
  cementKg: number;
  flyAshKg: number;
  slagKg: number;
  silicaFumeKg: number;
  sandDryKg: number;
  gravelDryKg: number;
  sandWetKg?: number;
  gravelWetKg?: number;
  costBasis?: "dry" | "wet";
  batchWaterLiters: number;
  admixtureWeights: { admixtureId: string; name: string; weight: number }[];
  fiberKg?: number;
  specialBinderKg?: number;
  prices: {
    priceCement: number;
    priceFlyAsh: number;
    priceSlag: number;
    priceSilicaFume: number;
    priceSand: number;
    priceGravel: number;
    priceWater: number;
    priceSuper: number;
    priceAir: number;
    priceRetarder: number;
    priceAccelerator: number;
    priceLabor?: number;
    priceFiber?: number;
    priceSpecialBinder?: number;
  };
}): CostingResult {
  const p = params.prices;
  const costBasis = params.costBasis || "wet";
  const breakdown: CostItem[] = [];

  // 1. Cement
  breakdown.push({
    material: "الإسمنت (Cement)",
    quantity: params.cementKg,
    unit: "kg",
    unitPrice: p.priceCement,
    cost: params.cementKg * p.priceCement
  });

  // 2. Fly ash
  if (params.flyAshKg > 0) {
    breakdown.push({
      material: "الرماد المتطاير (Fly Ash)",
      quantity: params.flyAshKg,
      unit: "kg",
      unitPrice: p.priceFlyAsh,
      cost: params.flyAshKg * p.priceFlyAsh
    });
  }

  // 3. Slag
  if (params.slagKg > 0) {
    breakdown.push({
      material: "خبث الأفران (Slag)",
      quantity: params.slagKg,
      unit: "kg",
      unitPrice: p.priceSlag,
      cost: params.slagKg * p.priceSlag
    });
  }

  // 4. Silica Fume
  if (params.silicaFumeKg > 0) {
    breakdown.push({
      material: "غبار السيليكا (Silica Fume)",
      quantity: params.silicaFumeKg,
      unit: "kg",
      unitPrice: p.priceSilicaFume,
      cost: params.silicaFumeKg * p.priceSilicaFume
    });
  }

  // 5. Sand (determined by cost basis)
  const sandQty = costBasis === "wet" && params.sandWetKg !== undefined ? params.sandWetKg : params.sandDryKg;
  const sandLabel = costBasis === "wet" ? "الرمل الرطب (Sand Wet)" : "الرمل الجاف (Sand Dry)";
  breakdown.push({
    material: sandLabel,
    quantity: sandQty,
    unit: "kg",
    unitPrice: p.priceSand,
    cost: sandQty * p.priceSand
  });

  // 6. Gravel (determined by cost basis)
  const gravelQty = costBasis === "wet" && params.gravelWetKg !== undefined ? params.gravelWetKg : params.gravelDryKg;
  const gravelLabel = costBasis === "wet" ? "الحصى الرطب (Gravel Wet)" : "الحصى الجاف (Gravel Dry)";
  breakdown.push({
    material: gravelLabel,
    quantity: gravelQty,
    unit: "kg",
    unitPrice: p.priceGravel,
    cost: gravelQty * p.priceGravel
  });

  // 7. Water (utilizes batchWaterToAdd which is params.batchWaterLiters)
  breakdown.push({
    material: "مياه الخلط الفعلية المضافة (Batch Water)",
    quantity: params.batchWaterLiters,
    unit: "L",
    unitPrice: p.priceWater,
    cost: params.batchWaterLiters * p.priceWater
  });

  // 8. Admixtures
  params.admixtureWeights.forEach(a => {
    let price = p.priceSuper;
    if (a.admixtureId === "air") price = p.priceAir;
    else if (a.admixtureId === "retarder") price = p.priceRetarder;
    else if (a.admixtureId === "accelerator") price = p.priceAccelerator;

    breakdown.push({
      material: a.name,
      quantity: a.weight,
      unit: "kg",
      unitPrice: price,
      cost: a.weight * price
    });
  });

  // 9. Fibers
  if (params.fiberKg !== undefined && params.fiberKg > 0) {
    const priceFib = p.priceFiber || 0;
    breakdown.push({
      material: "الألياف المضافة (Fibers)",
      quantity: params.fiberKg,
      unit: "kg",
      unitPrice: priceFib,
      cost: params.fiberKg * priceFib
    });
  }

  // 10. Special Binder
  if (params.specialBinderKg !== undefined && params.specialBinderKg > 0) {
    const priceSB = p.priceSpecialBinder || 0;
    breakdown.push({
      material: "المجلد الخاص المضاف (Special Binder)",
      quantity: params.specialBinderKg,
      unit: "kg",
      unitPrice: priceSB,
      cost: params.specialBinderKg * priceSB
    });
  }

  const materialCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
  const laborCost = p.priceLabor || 0;

  if (laborCost > 0) {
    breakdown.push({
      material: "أجور اليد العاملة والتشغيل (Labor & Operation)",
      quantity: 1,
      unit: "m³",
      unitPrice: laborCost,
      cost: laborCost
    });
  }

  const totalCost = materialCost + laborCost;

  return {
    costBreakdown: breakdown,
    totalCost
  };
}
