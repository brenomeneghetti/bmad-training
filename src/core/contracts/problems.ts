export type UrlProblemCode =
  | "empty"
  | "line-break"
  | "control-character"
  | "invalid-url"
  | "unsupported-scheme"
  | "missing-host"
  | "invalid-domain"
  | "malformed-percent"
  | "missing-piece"
  | "stale-token-revision"
  | "invalid-edit-range"
  | "split-percent-triplet"
  | "invalid-percent-edit";

export interface UrlProblem {
  readonly code: UrlProblemCode;
  readonly field: "full-url" | "domain" | "component";
  readonly message: string;
}

export const intakeMessage =
  "Enter a complete HTTP or HTTPS Absolute URL with a host.";
