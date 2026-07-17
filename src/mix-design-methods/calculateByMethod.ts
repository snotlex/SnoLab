import { MixDesignMethodId, MixDesignResult } from "./types";
import { mixDesignEngine } from "../mix-design/core/MixDesignEngine";

export function calculateByMethod(
  methodId: MixDesignMethodId,
  inputs: any
): MixDesignResult {
  return mixDesignEngine.calculate({
    methodId: methodId as string,
    input: inputs,
    context: { language: "ar" }
  }) as any;
}

