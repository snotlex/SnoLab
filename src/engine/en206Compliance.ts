export interface ComplianceCheckParams {
  exposureClass: string;
  cementType: string;
  cementKg: number;
  waterKg: number;
  wcRatio: number;
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  checks: {
    parameter: string;
    requirement: string;
    actual: string;
    status: "compliant" | "warning" | "non_compliant";
  }[];
}

export function checkEN206Compliance(params: ComplianceCheckParams): ComplianceCheckResult {
  const checks: ComplianceCheckResult["checks"] = [];
  let isCompliant = true;

  // Let's implement EN 206-1 standard limits for exposure classes on normal weight concrete
  switch (params.exposureClass) {
    case "XC1": {
      // Min cement: 260 kg/m3, Max W/C: 0.65
      const cementOk = params.cementKg >= 260;
      const wcOk = params.wcRatio <= 0.65;
      
      checks.push({
        parameter: "Minimum Cement Content (XC1)",
        requirement: ">= 260 kg/m³",
        actual: `${Math.round(params.cementKg)} kg/m³`,
        status: cementOk ? "compliant" : "non_compliant"
      });
      checks.push({
        parameter: "Maximum W/C Ratio (XC1)",
        requirement: "<= 0.65",
        actual: params.wcRatio.toFixed(2),
        status: wcOk ? "compliant" : "non_compliant"
      });
      
      if (!cementOk || !wcOk) isCompliant = false;
      break;
    }
    case "XC2":
    case "XC3": {
      // Min cement: 280 kg/m3, Max W/C: 0.60
      const cementOk = params.cementKg >= 280;
      const wcOk = params.wcRatio <= 0.60;
      
      checks.push({
        parameter: "Minimum Cement Content (XC2/XC3)",
        requirement: ">= 280 kg/m³",
        actual: `${Math.round(params.cementKg)} kg/m³`,
        status: cementOk ? "compliant" : "non_compliant"
      });
      checks.push({
        parameter: "Maximum W/C Ratio (XC2/XC3)",
        requirement: "<= 0.60",
        actual: params.wcRatio.toFixed(2),
        status: wcOk ? "compliant" : "non_compliant"
      });
      
      if (!cementOk || !wcOk) isCompliant = false;
      break;
    }
    case "XS1":
    case "XD1": {
      // Min cement: 300 kg/m3, Max W/C: 0.50
      const cementOk = params.cementKg >= 300;
      const wcOk = params.wcRatio <= 0.50;
      
      checks.push({
        parameter: "Minimum Cement Content (XS1/XD1)",
        requirement: ">= 300 kg/m³",
        actual: `${Math.round(params.cementKg)} kg/m³`,
        status: cementOk ? "compliant" : "non_compliant"
      });
      checks.push({
        parameter: "Maximum W/C Ratio (XS1/XD1)",
        requirement: "<= 0.50",
        actual: params.wcRatio.toFixed(2),
        status: wcOk ? "compliant" : "non_compliant"
      });
      
      if (!cementOk || !wcOk) isCompliant = false;
      break;
    }
    default: {
      // General non-aggressive (X0)
      const cementOk = params.cementKg >= 240;
      checks.push({
        parameter: "Minimum Cement Content (X0)",
        requirement: ">= 240 kg/m³",
        actual: `${Math.round(params.cementKg)} kg/m³`,
        status: cementOk ? "compliant" : "non_compliant"
      });
      if (!cementOk) isCompliant = false;
      break;
    }
  }

  return {
    isCompliant,
    checks
  };
}
