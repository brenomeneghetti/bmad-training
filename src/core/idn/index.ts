import * as tr46 from "tr46";
import { err, ok, type Result, type UrlProblem } from "../contracts";

const options = {
  transitionalProcessing: false,
  checkBidi: true,
  checkJoiners: true,
  checkHyphens: false,
  useSTD3ASCIIRules: false,
  verifyDNSLength: false,
  ignoreInvalidPunycode: false,
} as const;

export interface DomainForms {
  readonly unicode: string;
  readonly ascii: string;
}

const problem = (): UrlProblem => ({
  code: "invalid-domain",
  field: "domain",
  message: "Enter a domain that can be represented safely as Unicode and ASCII/Punycode.",
});

const validateWhatwgHost = (ascii: string): boolean => {
  try {
    const parsed = new URL(`https://${ascii}/`);
    return parsed.hostname.length > 0 && parsed.hostname === ascii.toLowerCase();
  } catch {
    return false;
  }
};

export const convertDomain = (input: string): Result<DomainForms, UrlProblem> => {
  const labels = input.endsWith(".") ? input.slice(0, -1).split(".") : input.split(".");
  if (labels.some((label) => label.length === 0)) return err(problem());
  if (input.startsWith("[") && input.endsWith("]")) {
    if (!validateWhatwgHost(input.toLowerCase())) return err(problem());
    return ok({ ascii: input.toLowerCase(), unicode: input.toLowerCase() });
  }
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(input)) {
    if (!validateWhatwgHost(input)) return err(problem());
    return ok({ ascii: input, unicode: input });
  }
  const ascii = tr46.toASCII(input, options);
  if (!ascii || !validateWhatwgHost(ascii)) return err(problem());

  const unicode = tr46.toUnicode(ascii, options);
  if (unicode.error || !unicode.domain) return err(problem());
  return ok({ ascii: ascii.toLowerCase(), unicode: unicode.domain });
};
