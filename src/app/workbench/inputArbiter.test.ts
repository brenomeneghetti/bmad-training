import { afterEach, describe, expect, it, vi } from "vitest";
import { nativeEditing, routeUndo } from "./inputArbiter";

afterEach(() => {
  document.body.replaceChildren();
  document.getSelection()?.removeAllRanges();
});

describe("Story 3.2 input arbiter", () => {
  it.each(["mac", "other"] as const)("routes exactly once under independent %s policy", (platform) => {
    const undo = vi.fn();
    const event = new KeyboardEvent("keydown", { key: "z", cancelable: true,
      ctrlKey: platform === "other", metaKey: platform === "mac" });
    const prevent = vi.spyOn(event, "preventDefault");
    expect(routeUndo(event, { platform, available: true, composing: false, document, undo })).toBe(true);
    expect(prevent).toHaveBeenCalledTimes(1);
    expect(undo).toHaveBeenCalledTimes(1);
    expect(routeUndo(event, { platform, available: true, composing: false, document, undo })).toBe(false);
  });

  it.each([
    { name: "uppercase", key: "Z", ctrlKey: true }, { name: "Shift", key: "z", ctrlKey: true, shiftKey: true },
    { name: "Alt", key: "z", ctrlKey: true, altKey: true }, { name: "wrong primary", key: "z", metaKey: true },
    { name: "combined modifiers", key: "z", ctrlKey: true, metaKey: true }, { name: "no modifier", key: "z" },
    { name: "composition", key: "z", ctrlKey: true, isComposing: true }, { name: "IME keycode", key: "z", ctrlKey: true, keyCode: 229 },
  ])("leaves excluded $name chord untouched", (chord) => {
    const event = new KeyboardEvent("keydown", { ...chord, cancelable: true });
    const undo = vi.fn();
    expect(routeUndo(event, { platform: "other", available: true, composing: false, document, undo })).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(undo).not.toHaveBeenCalled();
  });

  it("protects empty history composition prevented events AltGraph and wrong mac modifier", () => {
    for (const reason of ["empty", "composition", "prevented", "AltGraph", "mac"]) {
      const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, cancelable: true });
      if (reason === "prevented") event.preventDefault();
      if (reason === "AltGraph") vi.spyOn(event, "getModifierState").mockReturnValue(true);
      const prevent = vi.spyOn(event, "preventDefault");
      const undo = vi.fn();
      expect(routeUndo(event, { platform: reason === "mac" ? "mac" : "other",
        available: reason !== "empty", composing: reason === "composition", document, undo })).toBe(false);
      expect(prevent).not.toHaveBeenCalled();
      expect(undo).not.toHaveBeenCalled();
    }
  });

  it.each(["input", "textarea", "select", "host", "anchor", "focus", "active"])(
    "protects native %s ownership including selection endpoints", (kind) => {
      const host = document.createElement(kind === "input" || kind === "textarea" || kind === "select" ? kind : "div");
      if (host instanceof HTMLDivElement) host.setAttribute("contenteditable", "true");
      host.append("editable");
      const outside = document.createElement("button");
      outside.textContent = "outside";
      document.body.append(host, outside);
      if (kind === "active") host.focus();
      if (kind === "anchor" || kind === "focus") {
        const selection = document.getSelection()!;
        selection.setBaseAndExtent(kind === "anchor" ? host.firstChild! : outside.firstChild!, 0,
          kind === "focus" ? host.firstChild! : outside.firstChild!, 1);
      }
      const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, cancelable: true, bubbles: true });
      const undo = vi.fn();
      const destination = ["anchor", "focus", "active"].includes(kind) ? outside : host;
      destination.addEventListener("keydown", (e) => routeUndo(e as KeyboardEvent, {
        platform: "other", available: true, composing: false, document, undo,
      }));
      destination.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(undo).not.toHaveBeenCalled();
    },
  );

  it("honors inherited editability plaintext-only and nested noneditable islands", () => {
    document.body.innerHTML = '<div contenteditable="plaintext-only"><span id="inherited">text</span><span contenteditable="false" id="island"><b id="child">button</b><i contenteditable="true" id="nested">edit</i></span></div>';
    expect(nativeEditing(document.getElementById("inherited")!.firstChild)).toBe(true);
    expect(nativeEditing(document.getElementById("child"))).toBe(false);
    expect(nativeEditing(document.getElementById("nested"))).toBe(true);
    const island = document.getElementById("island")!;
    const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, cancelable: true, bubbles: true });
    const undo = vi.fn();
    island.addEventListener("keydown", (e) => routeUndo(e, { platform: "other", available: true, composing: false, document, undo }));
    island.dispatchEvent(event);
    expect(undo).toHaveBeenCalledTimes(1);
  });
});
