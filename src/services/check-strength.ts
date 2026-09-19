import { calculateCementMortarStrength } from '/home/ubuntu/SnoLab/src/services/cementMortarStrength.ts';
import { executeDefinedLaboratoryTest } from '/home/ubuntu/SnoLab/src/services/laboratoryTestEngine.ts';
import { CEMENT_MORTAR_STRENGTH_DEFINITION } from '/home/ubuntu/SnoLab/src/services/laboratoryTestDefinitions.ts';
const input = { strength2dPrismsKn: [28.5,29.2,28.8,29.0,28.6,29.1], strength7dPrismsKn:[51.2,52.0,50.8,51.5,52.2,51.8], strength28dPrismsKn:[76.5,77.2,75.8,76.0,77.5,76.8], prismWidthMm:40, prismDepthMm:40 };
console.log(calculateCementMortarStrength(input));
console.log(executeDefinedLaboratoryTest(CEMENT_MORTAR_STRENGTH_DEFINITION,{runId:'x',materialId:'m',sampleId:'s',operator:'o',rawData:input,standard:{organization:'EN',code:'EN 196-1',version:'2026',status:'Active'},now:'2026-09-19T00:00:00.000Z'}));
