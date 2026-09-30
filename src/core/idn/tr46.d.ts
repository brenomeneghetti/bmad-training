declare module "tr46" {
  export interface Options {
    checkBidi?: boolean;
    checkHyphens?: boolean;
    checkJoiners?: boolean;
    ignoreInvalidPunycode?: boolean;
    transitionalProcessing?: boolean;
    useSTD3ASCIIRules?: boolean;
    verifyDNSLength?: boolean;
  }
  export function toASCII(domain: string, options?: Options): string | null;
  export function toUnicode(
    domain: string,
    options?: Options,
  ): { domain: string; error: boolean };
}
