import { MixDesignMethodMetadata } from "../../core/types";

export const DREUX_GORISSE_METADATA: MixDesignMethodMetadata = {
  id: "dreux-gorisse",
  name: "طريقة درو-غوريس (Dreux-Gorisse)",
  shortName: "Dreux-Gorisse",
  version: "1.0.0",
  description: "طريقة فرنسية تقليدية لتصميم الخلطات الخرسانية بناءً على الترتيب الحبيبي الأنسب (Georges Dreux optimum arrangement formula).",
  references: [
    "Georges Dreux & Jean Festa, Nouveau guide du béton et de ses constituants, 8e édition, Eyrolles, 1998 (equation/page traceability pending)",
    "EN 206:2013+A2:2021 (edition currently encoded for indicative limits; Algerian adoption and national requirements pending; not a source for Dreux equations)"
  ],
  supportedLanguages: ["ar", "fr", "en"],
  status: "active"
};
