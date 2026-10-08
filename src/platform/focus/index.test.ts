import { afterEach, expect, it, vi } from "vitest";
import { focusRestoredTarget } from ".";

afterEach(() => document.body.replaceChildren());

it("Story 3.2 focus scrolls before focus and uses enabled reorder fallbacks", () => {
  document.body.innerHTML = '<button id="move-up-a" disabled></button><button id="move-down-a"></button><input id="query-key-a">';
  const button = document.getElementById("move-down-a")!;
  const order: string[] = [];
  button.scrollIntoView = () => { order.push("scroll"); };
  button.addEventListener("focus", () => order.push("focus"));
  const target = { kind: "piece", pieceId: "a", order: ["a"], control: "up" } as const;
  focusRestoredTarget(target, [{ id: "a", kind: "query" }], document);
  expect(order).toEqual(["scroll", "focus"]);
  expect(button).toHaveFocus();
  (button as HTMLButtonElement).disabled = true;
  focusRestoredTarget(target, [{ id: "a", kind: "query" }], document);
  expect(document.getElementById("query-key-a")).toHaveFocus();
});

it("Story 3.2 focus retains restored next then previous source order and filtering fallback", () => {
  document.body.innerHTML = '<input id="path-a"><input id="query-key-c"><textarea id="full-url-editor"></textarea>';
  const target = { kind: "piece", pieceId: "b", order: ["a", "b", "c"], control: "remove" } as const;
  expect(focusRestoredTarget(target, [{ id: "a", kind: "path" }, { id: "c", kind: "query" }], document)).toBe(true);
  expect(document.getElementById("query-key-c")).toHaveFocus();
  focusRestoredTarget(target, [{ id: "a", kind: "path" }], document);
  expect(document.getElementById("path-a")).toHaveFocus();
  focusRestoredTarget(target, [], document);
  expect(document.getElementById("full-url-editor")).toHaveFocus();
});

it("Story 3.2 missing mounted targets touch no DOM and enqueue no replacement", () => {
  document.body.innerHTML = '<textarea id="full-url-editor"></textarea>';
  const textarea = document.getElementById("full-url-editor")!;
  const focus = vi.spyOn(textarea, "focus");
  focusRestoredTarget({ kind: "piece", pieceId: "a", order: ["a"], control: "remove" },
    [{ id: "a", kind: "query" }], document);
  expect(focus).not.toHaveBeenCalled();
});
