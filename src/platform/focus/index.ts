export interface FocusPort {
  focusById(id: string): boolean;
}

import type { FocusTarget } from "../effects";

export interface MountedPiece {
  readonly id: string;
  readonly kind: "domain" | "path" | "query";
}

export const focusRestoredTarget = (
  target: FocusTarget,
  visible: readonly MountedPiece[],
  document: Document,
): boolean => {
  const firstField = (piece: MountedPiece) =>
    `${piece.kind === "domain" ? "unicode" : piece.kind === "path" ? "path" : "query-key"}-${piece.id}`;
  let ids: string[];
  let filtered = false;
  if (target.kind === "full-url") ids = ["full-url-editor"];
  else if (target.kind === "nearest") {
    const piece = target.candidates.map((id) => visible.find((row) => row.id === id)).find(Boolean);
    ids = [piece ? firstField(piece) : "full-url-editor"];
    filtered = target.candidates.length > 0 && !visible.some((row) => row.id === target.candidates[0]);
  } else {
    const piece = visible.find((row) => row.id === target.pieceId);
    if (!piece) {
      filtered = true;
      const index = target.order.indexOf(target.pieceId);
      const neighbor = [...target.order.slice(index + 1), ...target.order.slice(0, index).reverse()]
        .map((id) => visible.find((row) => row.id === id)).find(Boolean);
      ids = [neighbor ? firstField(neighbor) : "full-url-editor"];
    } else if (target.control === "up" || target.control === "down") {
      ids = [`move-${target.control}-${piece.id}`,
        `move-${target.control === "up" ? "down" : "up"}-${piece.id}`, firstField(piece)];
    } else {
      const prefix = target.control === "domain-unicode" ? "unicode"
        : target.control === "domain-ascii" ? "ascii" : target.control;
      ids = [`${prefix}-${piece.id}`];
    }
  }
  const elements = ids.map((id) => document.getElementById(id));
  // Missing mounted controls indicate a failed render precondition, not a new intent.
  if (elements.some((element) => element === null)) return false;
  const element = elements.find((element) => !("disabled" in element! && element.disabled));
  if (!element) return false;
  element.scrollIntoView?.({ block: "nearest" });
  element.focus({ preventScroll: true });
  return filtered;
};
