declare module "subset-font" {
  interface Options {
    targetFormat?: "sfnt" | "woff" | "woff2" | "truetype";
    preserveNameIds?: number[];
    variationAxes?: Record<string, number | { min: number; max: number; default?: number }>;
  }
  export default function subsetFont(font: Buffer | Uint8Array, text: string, options?: Options): Promise<Buffer>;
}
