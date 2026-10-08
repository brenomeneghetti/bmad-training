export interface ClipboardPort {
  writeText(value: string): Promise<void>;
}

import type { ClipboardOutcome } from "../../core/session";

export interface ClipboardClock {
  setTimeout(callback: () => void, milliseconds: number): ReturnType<typeof setTimeout>;
  clearTimeout(timer: ReturnType<typeof setTimeout>): void;
}

// Timeout settles feedback, not the native write's ownership.
export const createBrowserClipboard = (
  getPort: () => ClipboardPort | undefined = () => navigator.clipboard,
  clock: ClipboardClock = {
    setTimeout: (callback, milliseconds) => setTimeout(callback, milliseconds),
    clearTimeout: (timer) => clearTimeout(timer),
  },
  timeout = 3_000,
) => {
  let fenced = false;
  return {
    async write(value: string): Promise<ClipboardOutcome> {
      if (fenced) return "fenced";
      let port: ClipboardPort | undefined;
      let pending: Promise<void>;
      try {
        port = getPort();
        if (!port || typeof port.writeText !== "function") return "unavailable";
        fenced = true;
        pending = port.writeText(value);
      } catch {
        fenced = false;
        return "throw";
      }
      return new Promise((resolve) => {
        let terminal = false;
        const timer = clock.setTimeout(() => {
          terminal = true;
          resolve("timeout");
        }, timeout);
        const settle = (outcome: ClipboardOutcome) => {
          fenced = false;
          if (terminal) return;
          terminal = true;
          clock.clearTimeout(timer);
          resolve(outcome);
        };
        Promise.resolve(pending).then(() => settle("success"), () => settle("rejected"));
      });
    },
  };
};
