export const nativeEditing = (node: EventTarget | null): boolean => {
  let element = node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
  let editable: boolean | undefined;
  while (element) {
    if (element.matches("input, textarea, select")) return true;
    const attribute = element.getAttribute("contenteditable")?.toLowerCase();
    if (editable === undefined && attribute !== undefined &&
      ["", "true", "plaintext-only", "false"].includes(attribute)) {
      editable = attribute !== "false";
    }
    element = element.parentElement;
  }
  return editable === true;
};

export const routeUndo = (
  event: KeyboardEvent,
  context: {
    readonly platform: "mac" | "other";
    readonly composing: boolean;
    readonly available: boolean;
    readonly document: Document;
    readonly undo: () => void;
  },
): boolean => {
  const selection = context.document.getSelection();
  if (event.defaultPrevented || event.key !== "z" || event.shiftKey || event.altKey ||
    event.getModifierState("AltGraph") || event.isComposing || event.keyCode === 229 ||
    context.composing || !context.available ||
    (context.platform === "mac" ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey) ||
    [event.target, context.document.activeElement, selection?.anchorNode ?? null,
      selection?.focusNode ?? null].some(nativeEditing)) return false;
  event.preventDefault();
  context.undo();
  return true;
};
