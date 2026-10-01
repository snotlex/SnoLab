declare module "arabic-persian-reshaper" {
  const reshaper: {
    ArabicShaper: { convertArabic(value: string): string };
    PersianShaper: { convertArabic(value: string): string };
  };
  export default reshaper;
}

declare module "bidi-js" {
  type Bidi = {
    getEmbeddingLevels(value: string, direction?: "ltr" | "rtl"): unknown;
    getReorderSegments(value: string, embedding: unknown): Array<[number, number]>;
  };
  const factory: () => Bidi;
  export default factory;
}
