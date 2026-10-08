import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { removalFixtures, semanticFixture } from "../../test/fixtures/semantic";
import { Workbench } from "./Workbench";

describe("URL Workbench", () => {
  afterEach(() => vi.useRealTimers());

  it.each(["Domain", "token", "Full URL"] as const)(
    "Story 3.1 Undo stays inactive during %s composition and re-enables after settlement",
    (kind) => {
      render(<Workbench />);
      const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
      fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
      const domain = screen.getByLabelText("ASCII/Punycode Domain");
      fireEvent.change(domain, { target: { value: "example.org" } });
      const composing = kind === "Domain" ? domain
        : kind === "token" ? screen.getByLabelText("Value, Query Parameter 1 of 1")
        : editor;
      const value = kind === "Domain" ? "example.net" : kind === "token" ? "new" : "https://";
      const undo = screen.getByRole("button", { name: "Undo" });
      fireEvent.compositionStart(composing);
      fireEvent.input(composing, { target: { value }, isComposing: true });
      expect(undo).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByText("Undo inactive: finish text composition first.")).toBeVisible();
      fireEvent.click(undo);
      expect(composing).toHaveValue(value);
      if (kind !== "Full URL") expect(editor).toHaveValue("https://example.org/a?x=1");
      expect(screen.queryByText(/Undid /)).not.toBeInTheDocument();
      fireEvent.compositionEnd(composing, { data: value });
      expect(undo).toHaveAttribute("aria-disabled", "false");
      fireEvent.click(undo);
      expect(editor).toHaveValue(kind === "Full URL" ? "https://" : "https://example.org/a?x=1");
      if (kind === "Full URL") {
        expect(domain).toHaveValue("example.com");
        expect(screen.getByText(/Draft URL is unchanged/)).toBeVisible();
      }
    },
  );

  it("Story 3.1 Undo restores visible values and remains focusable when inactive without pointer-down activation", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toHaveAttribute("aria-disabled", "true");
    expect(undo).not.toBeDisabled();
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://xn--fa-hia.de/a?flag&empty=#Frag%2f" } });
    expect(undo).toHaveAttribute("aria-disabled", "true");
    fireEvent.change(screen.getByLabelText("Value, Query Parameter 2 of 2"), { target: { value: "changed" } });
    fireEvent.pointerDown(undo);
    fireEvent.pointerCancel(undo);
    expect(editor).toHaveValue("https://xn--fa-hia.de/a?flag&empty=changed#Frag%2f");
    undo.focus();
    await user.keyboard("{Enter}");
    expect(editor).toHaveValue("https://xn--fa-hia.de/a?flag&empty=#Frag%2f");
    expect(screen.getByLabelText("Unicode Domain")).toHaveValue("faß.de");
    expect(screen.getByLabelText("Value, Query Parameter 2 of 2")).toHaveValue("");
    expect(undo).toHaveFocus();
    expect(undo).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Undo inactive: no URL changes to undo.")).toBeVisible();
    await user.keyboard("{Enter}");
    expect(undo).toHaveFocus();
    expect(screen.getByText(/Undid Query Parameter value edit/)).toBeVisible();
  });

  it("Story 3.1 Undo re-enables when a composing editor is removed without compositionend", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const value = screen.getByLabelText("Value, Query Parameter 1 of 1");
    fireEvent.compositionStart(value);
    fireEvent.input(value, { target: { value: "unfinished" }, isComposing: true });
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(screen.getByRole("button", { name: /Remove Query Parameter at position 1 of 1/ }));
    expect(value).not.toBeInTheDocument();
    expect(undo).toHaveAttribute("aria-disabled", "false");
    fireEvent.click(undo);
    expect(editor).toHaveValue("https://example.com/a?x=1");
    expect(screen.getByLabelText("Value, Query Parameter 1 of 1")).toHaveValue("1");
  });

  it("Story 3.1 Undo keeps invalid Draft selection validation and Search while deriving restored rows", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL") as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1&y=2" } });
    fireEvent.change(editor, { target: { value: "https://example.com/b?x=1&y=2" } });
    fireEvent.change(editor, { target: { value: "https://" } });
    const error = document.getElementById("error-full-url")!.textContent;
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "a" } });
    editor.focus();
    editor.setSelectionRange(2, 5, "backward");
    const undo = screen.getByRole("button", { name: "Undo" });
    fireEvent.pointerDown(undo);
    fireEvent.click(undo);
    expect(editor).toHaveValue("https://");
    expect([editor.selectionStart, editor.selectionEnd, editor.selectionDirection]).toEqual([2, 5, "backward"]);
    expect(editor).toHaveFocus();
    expect(document.getElementById("error-full-url")).toHaveTextContent(error!);
    expect(search).toHaveValue("a");
    expect(screen.getByLabelText("Path Segment 1 of 1")).toHaveValue("a");
    expect(screen.getByText(/Undid Full URL edit.*Draft URL is unchanged/)).toBeVisible();
  });

  it("expires Domain composition suppression after the other representation changes", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?dup=1&dup=2" } });
    const ascii = screen.getByLabelText("ASCII/Punycode Domain");
    fireEvent.compositionStart(ascii);
    fireEvent.input(ascii, { target: { value: "EXAMPLE.ORG" }, isComposing: true });
    fireEvent.compositionEnd(ascii, { data: "EXAMPLE.ORG" });
    fireEvent.change(screen.getByLabelText("Unicode Domain"), { target: { value: "example.net" } });
    fireEvent.input(ascii, { target: { value: "EXAMPLE.ORG" }, inputType: "insertText" });
    expect(ascii).toHaveValue("example.org");
    expect(editor).toHaveValue("https://example.org/a?dup=1&dup=2");
    expect(screen.getByText(/Domain synchronized at revision 4/)).toBeVisible();
  });

  it("publishes validation for same-turn native input/change pairs without stale parse completion", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    act(() => {
      fireEvent.input(editor, { target: { value: "https://example.com/a?x=1" } });
      fireEvent.change(editor, { target: { value: "https://" } });
    });
    expect(editor).toHaveValue("https://");
    expect(screen.getByLabelText("Path Segment 1 of 1")).toHaveValue("a");
    expect(document.getElementById("error-full-url")).toHaveTextContent("Last Valid URL");
  });

  it("handles cancellable native beforeinput exactly once before its fallback input", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=old" } });
    const value = screen.getByLabelText("Value, Query Parameter 1 of 1") as HTMLInputElement;
    value.focus();
    value.setSelectionRange(0, value.value.length);
    let accepted = true;
    act(() => {
      accepted = value.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true, cancelable: true, inputType: "insertText", data: "x&😀",
      }));
    });
    expect(accepted).toBe(false);
    expect(value).toHaveValue("x%26%F0%9F%98%80");
    expect(editor).toHaveValue("https://example.com/a?x=x%26%F0%9F%98%80");
  });

  it.each(["immediate", "delayed"] as const)(
    "publishes Domain composition once with %s final input and accepts later edits",
    async (timing) => {
      render(<Workbench />);
      const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
      fireEvent.change(editor, { target: { value: "https://example.com/a?dup=1&dup=2#Frag%2f" } });
      const domain = screen.getByLabelText("ASCII/Punycode Domain") as HTMLInputElement;
      domain.focus();
      fireEvent.compositionStart(domain);
      fireEvent.input(domain, { target: { value: "EXAMPLE.ORG" }, isComposing: true, inputType: "insertCompositionText" });
      expect(editor).toHaveValue("https://example.com/a?dup=1&dup=2#Frag%2f");
      fireEvent.compositionEnd(domain, { data: "EXAMPLE.ORG" });
      if (timing === "delayed") await act(() => new Promise((done) => window.setTimeout(done, 0)));
      fireEvent.input(domain, { target: { value: "EXAMPLE.ORG" }, inputType: "insertFromComposition", isComposing: false });
      expect(domain).toHaveValue("example.org");
      expect(editor).toHaveValue("https://example.org/a?dup=1&dup=2#Frag%2f");
      expect(screen.getByText(/Domain synchronized at revision 2/)).toBeVisible();
      fireEvent.change(domain, { target: { value: "example.net" } });
      expect(domain).toHaveFocus();
      expect(editor).toHaveValue("https://example.net/a?dup=1&dup=2#Frag%2f");
      expect(screen.getByText(/Domain synchronized at revision 3/)).toBeVisible();
    },
  );

  it("distinguishes intake from invalid Draft source and clears only Full URL feedback on correction", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "/invalid" } });
    expect(screen.queryByText(/Draft URL is not valid/)).not.toBeInTheDocument();
    expect(document.getElementById("structured-source")).not.toBeInTheDocument();
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const value = screen.getByLabelText("Value, Query Parameter 1 of 1");
    fireEvent.change(value, { target: { value: "%" } });
    const errorId = value.getAttribute("aria-errormessage")!;
    fireEvent.change(editor, { target: { value: "https://" } });
    expect(document.getElementById("error-full-url")).toHaveTextContent(
      "Draft URL is not valid. Structured View changes use the Last Valid URL.",
    );
    expect(document.getElementById("error-full-url")).not.toHaveTextContent(
      /^Draft URL is not valid\. Structured View changes use the Last Valid URL\.$/,
    );
    expect(screen.getByRole("region", { name: "Structured View" }))
      .toHaveAccessibleDescription("Source: Last Valid URL.");
    expect(value).toHaveValue("%");
    expect(document.getElementById(errorId)).toHaveTextContent(/complete triplet/);
    expect(document.querySelector('[id$="-domain"]')).toHaveTextContent("the Last Valid URL");
    const search = screen.getByLabelText("Search Managed Pieces");
    search.focus();
    fireEvent.change(search, { target: { value: "x=not-present" } });
    expect(screen.getByText(/No Managed Piece matches/)).toBeVisible();
    expect(search).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Clear Search" }));
    expect(value).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    expect(document.getElementById("error-full-url")).not.toBeInTheDocument();
    expect(document.getElementById("structured-source")).not.toBeInTheDocument();
    const correctedValue = screen.getByLabelText("Value, Query Parameter 1 of 1");
    expect(correctedValue).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(correctedValue, { target: { value: "%2F" } });
    expect(correctedValue).not.toHaveAttribute("aria-invalid");
  });

  it("keeps field error, operation status, Search and invalid Draft composition independent", () => {
    vi.useFakeTimers();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const value = screen.getByLabelText("Value, Query Parameter 1 of 1");
    fireEvent.change(value, { target: { value: "%" } });
    fireEvent.change(editor, { target: { value: "/invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Query Parameter before the list" }));
    const status = screen.getByText(/Query Parameter 2 added/).textContent;
    const search = screen.getByLabelText("Search Managed Pieces");
    search.focus();
    fireEvent.change(search, { target: { value: "x" } });
    act(() => vi.advanceTimersByTime(300));
    expect(document.getElementById("search-status")).toHaveTextContent("2 of 4 Managed Pieces shown.");
    fireEvent.change(editor, { target: { value: "/still-invalid" } });
    expect(screen.getByText(/Query Parameter 2 added/)).toHaveTextContent(status!);
    expect(document.getElementById("search-status")).toHaveTextContent("2 of 4 Managed Pieces shown.");
    expect(search).toHaveFocus();
    const error = document.getElementById("error-full-url")!.textContent;
    fireEvent.compositionStart(editor);
    fireEvent.change(editor, { target: { value: "https://example.com/final?x=1&" } });
    fireEvent.keyDown(editor, { key: "Enter" });
    expect(document.getElementById("error-full-url")).toHaveTextContent(error!);
    expect(screen.getByText("Source: Last Valid URL.")).toBeVisible();
    fireEvent.compositionEnd(editor);
    expect(document.getElementById("error-full-url")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Value, Query Parameter 1 of 2")).toHaveValue("%");
  });

  it("does not apply an old move focus intent to a newer identical outcome in one batch", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1&y=2&z=3" } });
    fireEvent.change(editor, { target: { value: "/invalid" } });
    const search = screen.getByLabelText("Search Managed Pieces");
    search.focus();
    const row = screen.getByLabelText("Key, Query Parameter 2 of 3").closest("li")!;
    const down = within(row).getByRole("button", { name: / down,/ });
    const up = within(row).getByRole("button", { name: / up,/ });
    act(() => {
      down.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      up.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      down.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(screen.getByText(/"y=2" moved from position 2 to position 3 of 3/)).toBeVisible();
    expect(search).toHaveFocus();
    expect(editor).toHaveValue("/invalid");
  });

  it.each(["add", "move", "remove"] as const)(
    "does not let pending %s override newer Search focus",
    (operation) => {
      render(<Workbench />);
      const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
      fireEvent.change(editor, { target: { value: "https://example.com/a?x=1&y=2" } });
      fireEvent.change(editor, { target: { value: "/invalid" } });
      const search = screen.getByLabelText("Search Managed Pieces");
      fireEvent.change(search, { target: { value: "x" } });
      editor.focus();
      const button = operation === "add"
        ? screen.getByRole("button", { name: "Add Query Parameter before the list" })
        : screen.getByRole("button", {
          name: operation === "move"
            ? /Move Query Parameter at position 1 of 2 down/
            : /Remove Query Parameter at position 1 of 2/,
        });
      act(() => {
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        search.focus();
      });
      expect(search).toHaveFocus();
      expect(search).toHaveValue("x");
      expect(editor).toHaveValue("/invalid");
    },
  );

  it.each(["focus", "input", "composition"] as const)(
    "does not let pending Add supersede newer Full URL %s",
    (interaction) => {
      render(<Workbench />);
      const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
      fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
      fireEvent.change(editor, { target: { value: "/invalid" } });
      const search = screen.getByLabelText("Search Managed Pieces");
      fireEvent.change(search, { target: { value: "x" } });
      search.focus();
      const add = screen.getByRole("button", { name: "Add Query Parameter before the list" });
      act(() => {
        add.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        if (interaction === "focus") editor.focus();
        if (interaction === "input") {
          fireEvent.change(editor, { target: { value: "/new-invalid" } });
        }
        if (interaction === "composition") fireEvent.compositionStart(editor);
      });
      expect(search).toHaveValue("x");
      expect(interaction === "focus" ? editor : search).toHaveFocus();
      expect(screen.queryByLabelText("Key, Query Parameter 2 of 2")).not.toBeInTheDocument();
    },
  );

  it("rejects stale Add focus and Search clearing after batched Add, Remove, Add", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    fireEvent.change(editor, { target: { value: "/invalid" } });
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "x" } });
    search.focus();
    const add = screen.getByRole("button", { name: "Add Query Parameter before the list" });
    const remove = screen.getByRole("button", { name: /Remove Query Parameter at position 1 of 1/ });
    act(() => {
      add.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      remove.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      add.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(search).toHaveFocus();
    expect(search).toHaveValue("x");
    expect(screen.getByText(/Query Parameter 2 added/)).toBeVisible();
    expect(editor).toHaveValue("/invalid");
  });

  it("persistently announces and associates Full URL and structured errors independently", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    const fullUrlRegion = document.getElementById("full-url-validation");
    const structuredRegion = document.getElementById("structured-validation");
    expect(fullUrlRegion).toHaveAttribute("aria-live", "polite");
    expect(structuredRegion).toHaveAttribute("aria-live", "polite");
    expect(fullUrlRegion).toBeEmptyDOMElement();
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const domain = screen.getByLabelText("Unicode Domain");
    const domainRegion = document.getElementById(
      `error-${domain.closest("li")!.dataset.pieceId}-domain-unicode-feedback`,
    );
    expect(domainRegion).toHaveAttribute("aria-live", "polite");
    expect(domainRegion).toBeEmptyDOMElement();
    fireEvent.change(domain, { target: { value: "xn--" } });
    const domainError = document.getElementById(domain.getAttribute("aria-errormessage")!)!;
    expect(domain).toHaveAccessibleDescription(expect.stringContaining(domainError.textContent!));
    expect(domain).toHaveAccessibleDescription(expect.stringContaining("Edit either form."));
    expect(domainRegion).toHaveTextContent(domainError.textContent!);
    expect(structuredRegion).toBeEmptyDOMElement();
    fireEvent.change(domain, { target: { value: "example.com" } });
    expect(domain).not.toHaveAttribute("aria-errormessage");
    expect(domain).toHaveAccessibleDescription(/Edit either form/);
    expect(domainRegion).toBeEmptyDOMElement();

    for (const label of ["Path Segment 1 of 1", "Key, Query Parameter 1 of 1", "Value, Query Parameter 1 of 1"]) {
      const input = screen.getByLabelText(label);
      const validValue = (input as HTMLInputElement).value;
      const fieldRegion = document.getElementById(
        `${input.id}-error-feedback`,
      );
      expect(fieldRegion).toHaveAttribute("aria-live", "polite");
      expect(fieldRegion).toBeEmptyDOMElement();
      fireEvent.change(input, { target: { value: "%" } });
      const error = document.getElementById(input.getAttribute("aria-errormessage")!)!;
      expect(input).toHaveAccessibleDescription(error.textContent!);
      expect(fieldRegion).toHaveTextContent(error.textContent!);
      fireEvent.change(editor, { target: { value: "https://" } });
      expect(editor).toHaveAccessibleDescription(expect.stringContaining("Draft URL is not valid."));
      expect(fullUrlRegion).toHaveTextContent("Structured View changes use the Last Valid URL.");
      expect(fieldRegion).toHaveTextContent(error.textContent!);
      fireEvent.change(input, { target: { value: validValue } });
      expect(input).not.toHaveAttribute("aria-describedby");
      expect(fieldRegion).toBeEmptyDOMElement();
      fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
      expect(editor).toHaveAccessibleDescription(document.getElementById("full-url-help")!.textContent!);
      expect(fullUrlRegion).toBeEmptyDOMElement();
      expect(screen.getByText(/URL parsed/)).toBeVisible();
    }
    expect(document.getElementById("full-url-validation")).toBe(fullUrlRegion);
    expect(document.getElementById("structured-validation")).toBe(structuredRegion);
  });

  it("preserves invalid Draft, selection, Search and focus when capacity rejects Add and an expanding edit", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL") as HTMLTextAreaElement;
    const prefix = "https://example.com/a?big=";
    fireEvent.change(editor, { target: { value: `${prefix}${"x".repeat(20_000 - prefix.length)}` } });
    const ids = screen.getAllByRole("listitem").map((row) => row.dataset.pieceId);
    fireEvent.change(editor, { target: { value: "https://" } });
    editor.setSelectionRange(2, 6, "backward");
    const parserError = document.getElementById("error-full-url")!.textContent!;
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "big" } });
    search.focus();
    fireEvent.click(screen.getByRole("button", { name: "Add Query Parameter after the list" }));
    expect(search).toHaveValue("big");
    expect(search).toHaveFocus();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText(/Query Parameter \d+ added/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear Search" }));
    const key = screen.getByLabelText("Key, Query Parameter 1 of 1");
    key.focus();
    fireEvent.change(key, { target: { value: "big-extra" } });
    expect(key).toHaveFocus();
    expect(key).toHaveAttribute("aria-invalid", "true");
    expect(search).toHaveValue("");
    expect(editor).toHaveValue("https://");
    expect([editor.selectionStart, editor.selectionEnd, editor.selectionDirection]).toEqual([2, 6, "backward"]);
    expect(document.getElementById("error-full-url")).toHaveTextContent(parserError);
    expect(screen.getAllByRole("listitem").map((row) => row.dataset.pieceId)).toEqual(ids);
  });

  it.each(["domain", "path", "key", "value", "remove", "move"] as const)(
    "preserves exact invalid Draft selection and source through %s with established focus",
    (operation) => {
      render(<Workbench />);
      const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL") as HTMLTextAreaElement;
      fireEvent.change(editor, { target: { value: "https://example.com/a?dup=1&dup=2" } });
      const ids = screen.getAllByRole("listitem").map((row) => row.dataset.pieceId);
      fireEvent.change(editor, { target: { value: "https://" } });
      editor.setSelectionRange(2, 6, "backward");
      const error = document.getElementById("error-full-url")!.textContent;
      const control = operation === "domain" ? screen.getByLabelText("Unicode Domain")
        : operation === "path" ? screen.getByLabelText("Path Segment 1 of 1")
        : operation === "key" ? screen.getAllByLabelText(/^Key, Query/)[1]!
        : operation === "value" ? screen.getAllByLabelText(/^Value, Query/)[1]!
        : screen.getByRole("button", {
          name: operation === "move" ? /Move Query Parameter at position 2 of 2 up/ : /Remove Query Parameter at position 2 of 2/,
        });
      control.focus();
      if (operation === "move" || operation === "remove") fireEvent.click(control);
      else fireEvent.change(control, { target: { value: operation === "domain" ? "example.org" : "new" } });
      expect(editor).toHaveValue("https://");
      expect([editor.selectionStart, editor.selectionEnd, editor.selectionDirection]).toEqual([2, 6, "backward"]);
      expect(document.getElementById("error-full-url")).toHaveTextContent(error!);
      expect(screen.getByRole("region", { name: "Structured View" }))
        .toHaveAccessibleDescription("Source: Last Valid URL.");
      if (operation === "remove") {
        expect(document.getElementById(`remove-${ids[2]}`)).toHaveFocus();
        expect(screen.getAllByRole("listitem").map((row) => row.dataset.pieceId)).toEqual(ids.slice(0, -1));
      } else if (operation === "move") {
        expect(document.getElementById(`move-down-${ids[3]}`)).toHaveFocus();
        expect(screen.getAllByRole("listitem").map((row) => row.dataset.pieceId)).toEqual([ids[0], ids[1], ids[3], ids[2]]);
      } else {
        expect(control).toHaveFocus();
        expect(screen.getAllByRole("listitem").map((row) => row.dataset.pieceId)).toEqual(ids);
      }
    },
  );

  it("does not let a pending caret-restoration frame overwrite a newer selection", () => {
    const callbacks: FrameRequestCallback[] = [];
    const frame = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    try {
      render(<Workbench />);
      fireEvent.change(screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"), {
        target: { value: "https://example.com/a?flag" },
      });
      const value = screen.getByLabelText("Value absent, Query Parameter 1 of 1") as HTMLInputElement;
      fireEvent.change(value, { target: { value: "x" } });
      value.setSelectionRange(0, 1);
      act(() => callbacks.forEach((callback) => callback(performance.now())));
      expect([value.selectionStart, value.selectionEnd]).toEqual([0, 1]);
      fireEvent.keyDown(value, { key: "Delete" });
      expect(value).toHaveValue("");
      expect(screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"))
        .toHaveValue("https://example.com/a?flag=");
    } finally {
      frame.mockRestore();
    }
  });

  it("renders all managed pieces and retains the trusted view after invalid intake", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");

    await user.type(editor, semanticFixture);
    await screen.findByText(/URL parsed/);
    expect(screen.getAllByRole("listitem")).toHaveLength(13);
    expect(screen.getByLabelText("Unicode Domain")).toHaveValue("faß.de");
    expect(screen.getByLabelText("ASCII/Punycode Domain")).toHaveValue(
      "xn--fa-hia.de",
    );
    expect(screen.getAllByText("Value absent")).toHaveLength(2);

    await user.clear(editor);
    await user.type(editor, "/relative");
    expect(await screen.findByText(/complete HTTP or HTTPS/)).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(13);
  });

  it("publishes only the final value when the Full URL text changes twice in a row", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://first.example/a" } });
    fireEvent.change(editor, { target: { value: "https://second.example/b" } });
    expect(screen.getByLabelText("Unicode Domain")).toHaveValue(
      "second.example",
    );
  });

  it("shows specific safety guidance for pasted line breaks", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a\nb" } });
    expect(screen.getByText(/Remove line breaks/)).toBeVisible();
  });

  it("has the required landmark and heading structure", () => {
    render(<Workbench />);
    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1 })).toHaveTextContent(
      "URL Workbench",
    );
    expect(screen.getAllByRole("region")).toHaveLength(3);
  });

  it("searches every supported field with full Unicode folding", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    await user.type(
      editor,
      "https://faß.de/Alpha/Straße?MixedKey=ValueOne&other=Needle",
    );
    const search = screen.getByLabelText("Search Managed Pieces");

    await user.type(search, "SS");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByLabelText("Unicode Domain")).toHaveValue("faß.de");
    expect(screen.getByLabelText("Path Segment 2 of 2")).toHaveValue("Straße");

    await user.clear(search);
    await user.type(search, "XN--FA-HIA");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByLabelText("ASCII/Punycode Domain")).toHaveValue(
      "xn--fa-hia.de",
    );

    await user.clear(search);
    await user.type(search, "mixedkey");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByLabelText(/^Key, Query Parameter/)).toHaveValue("MixedKey");

    await user.clear(search);
    await user.type(search, "needle");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByLabelText(/^Value, Query Parameter/)).toHaveValue("Needle");
  });

  it("filters presentation only and restores stable identity and source order", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    await user.type(editor, semanticFixture);
    const originalRows = screen.getAllByRole("listitem");
    const originalIds = originalRows.map((row) => row.dataset.pieceId);
    const search = screen.getByLabelText("Search Managed Pieces");

    await user.type(search, "dup");
    expect(screen.getByText("2 of 13 Managed Pieces shown")).toBeVisible();
    const filteredRows = screen.getAllByRole("listitem");
    expect(filteredRows.map((row) => row.dataset.pieceId)).toEqual(
      originalIds.slice(5, 7),
    );
    filteredRows.forEach((row, index) => {
      expect(row).toHaveAttribute("aria-posinset", String(index + 1));
      expect(row).toHaveAttribute("aria-setsize", "2");
      expect(
        within(row).getByText(`Filtered position ${index + 1} of 2`),
      ).toBeVisible();
    });
    expect(screen.getByText("Query Parameter 1 of 8, occurrence 1 of 2")).toBeVisible();
    expect(screen.getByText("Query Parameter 2 of 8, occurrence 2 of 2")).toBeVisible();

    fireEvent.change(search, { target: { value: "a%2Fb" } });
    expect(screen.getByLabelText("Path Segment 1 of 4")).toHaveValue("a%2Fb");
    fireEvent.change(search, { target: { value: "a/b" } });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    fireEvent.change(search, { target: { value: "a%26b%3Dc" } });
    expect(screen.getByLabelText(/^Value, Query Parameter/)).toHaveValue("a%26b%3Dc");
    fireEvent.change(search, { target: { value: "a&b=c" } });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Clear Search" }));
    expect(search).toHaveFocus();
    expect(search).toHaveValue("");
    expect(
      within(document.querySelector("#search-status") as HTMLElement).getByText(
        "13 of 13 Managed Pieces shown.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((row) => row.dataset.pieceId)).toEqual(
      originalIds,
    );
    expect(editor).toHaveValue(semanticFixture);
  });

  it("keeps no-result feedback reachable and clears only on activation", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?x=1" } },
    );
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "unmatched" } });
    expect(screen.getByText(/No Managed Piece matches/)).toHaveTextContent(
      "0 of 3 Managed Pieces shown. No Managed Piece matches ‘unmatched’.",
    );
    expect(document.querySelector("#managed-pieces")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Skip to Structured View results" }),
    ).toHaveAttribute("href", "#managed-pieces");
    const clearButton = screen.getByRole("button", { name: "Clear Search" });

    fireEvent.pointerDown(clearButton);
    fireEvent.pointerCancel(clearButton);
    expect(search).toHaveValue("unmatched");
    fireEvent.keyDown(search, { key: "Escape" });
    expect(search).toHaveValue("unmatched");

    await user.click(clearButton);
    expect(search).toHaveFocus();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("does not normalize canonically equivalent raw search text", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    await user.type(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      "https://example.com/café",
    );

    fireEvent.change(screen.getByLabelText("Search Managed Pieces"), {
      target: { value: "cafe\u0301" },
    });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("settles repeatable announcements without replacing live entries or moving focus", async () => {
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?x=1&x=2" } },
    );
    const search = screen.getByLabelText("Search Managed Pieces");
    search.focus();

    fireEvent.change(search, { target: { value: "x" } });
    fireEvent.change(search, { target: { value: "no" } });
    fireEvent.change(search, { target: { value: "x" } });
    await waitFor(() =>
      expect(screen.getByText("3 of 4 Managed Pieces shown.")).toBeInTheDocument(),
    );
    const firstAnnouncement = document.querySelector("#search-status span");
    expect(firstAnnouncement).toHaveAttribute("role", "status");
    expect(firstAnnouncement).toHaveAttribute("aria-live", "polite");
    expect(firstAnnouncement).toHaveAttribute("aria-atomic", "true");
    expect(search).toHaveFocus();

    fireEvent.change(search, { target: { value: "no" } });
    fireEvent.change(search, { target: { value: "x" } });
    await waitFor(() =>
      expect(
        within(document.querySelector("#search-status") as HTMLElement).getAllByText(
          "3 of 4 Managed Pieces shown.",
        ),
      ).toHaveLength(2),
    );
    expect(document.querySelector("#search-status span")).toBe(firstAnnouncement);
    expect(search).toHaveFocus();
  });

  it("announces restoration when the final search character is deleted", () => {
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?x=1" } },
    );
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "x" } });
    fireEvent.change(search, { target: { value: "" } });

    expect(
      within(document.querySelector("#search-status") as HTMLElement).getByText(
        "3 of 3 Managed Pieces shown.",
      ),
    ).toBeInTheDocument();
  });

  it("removes old-session announcements when the snapshot is replaced", () => {
    vi.useFakeTimers();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://first.example/a?x=1" },
    });
    fireEvent.change(screen.getByLabelText("Search Managed Pieces"), {
      target: { value: "1" },
    });
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByText("1 of 3 Managed Pieces shown.")).toBeInTheDocument();

    fireEvent.change(editor, { target: { value: "https://second.example/b" } });
    expect(
      screen.queryByText("1 of 3 Managed Pieces shown."),
    ).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByText("0 of 2 Managed Pieces shown.")).toBeInTheDocument();
  });

  it("exposes a settled search announcement for at least two seconds", () => {
    vi.useFakeTimers();
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?x=1" } },
    );
    fireEvent.change(screen.getByLabelText("Search Managed Pieces"), {
      target: { value: "x" },
    });

    act(() => vi.advanceTimersByTime(250));
    expect(document.querySelector("#search-status span")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search Managed Pieces"), {
      target: { value: "not-present" },
    });
    act(() => vi.advanceTimersByTime(299));
    expect(document.querySelector("#search-status span")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText("0 of 3 Managed Pieces shown.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search Managed Pieces"), {
      target: { value: "x" },
    });
    act(() => vi.advanceTimersByTime(300));
    expect(document.querySelector("#search-status span")).toBeInTheDocument();
    expect(screen.getByText("2 of 3 Managed Pieces shown.")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2_099));
    expect(document.querySelector("#search-status span")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(document.querySelector("#search-status span")).not.toBeInTheDocument();
  });

  it("edits only the selected duplicate and keeps focus", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://example.com/a?dup=1&dup=2&flag" },
    });
    const values = screen.getAllByLabelText(/^Value, Query Parameter/);
    const second = values[1] as HTMLInputElement;
    second.focus();
    fireEvent.change(second, { target: { value: "x&😀" } });

    expect(second).toHaveFocus();
    expect(second).toHaveValue("x%26%F0%9F%98%80");
    expect(values[0]).toHaveValue("1");
    expect(editor).toHaveValue(
      "https://example.com/a?dup=1&dup=x%26%F0%9F%98%80&flag",
    );
  });

  it("keeps an invalid percent draft associated until corrected", () => {
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?x=1" } },
    );
    const value = screen.getByLabelText(/^Value, Query Parameter/);
    value.focus();
    fireEvent.change(value, { target: { value: "%" } });
    expect(value).toHaveValue("%");
    expect(value).toHaveAttribute("aria-invalid", "true");
    const error = document.getElementById(value.getAttribute("aria-errormessage")!)!;
    expect(error).toBeVisible();
    expect(error).toHaveTextContent(/complete triplet/);
    expect(screen.getByLabelText("Complete HTTP or HTTPS Absolute URL")).toHaveValue(
      "https://example.com/a?x=1",
    );

    fireEvent.change(value, { target: { value: "%2F" } });
    expect(value).toHaveValue("%2F");
    expect(value).not.toHaveAttribute("aria-invalid");
    expect(value).toHaveFocus();
    expect(screen.getByLabelText("Complete HTTP or HTTPS Absolute URL")).toHaveValue(
      "https://example.com/a?x=%2F",
    );
  });

  it("suppresses commits during IME composition and commits once at its end", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=long" } });
    const value = screen.getByLabelText(/^Value, Query Parameter/);
    fireEvent.compositionStart(value);
    fireEvent.change(value, { target: { value: "日本" } });
    expect(editor).toHaveValue("https://example.com/a?x=long");
    fireEvent.compositionEnd(value, { data: "日本" });
    expect(editor).toHaveValue("https://example.com/a?x=%E6%97%A5%E6%9C%AC");
  });

  it("edits either Domain form while preserving focus and synchronized commits", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://User@example.com:044/a%2fb?x=1#Frag%2f" },
    });
    const unicode = screen.getByLabelText("Unicode Domain");
    unicode.focus();
    fireEvent.change(unicode, { target: { value: "faß.de" } });
    expect(unicode).toHaveFocus();
    expect(unicode).toHaveValue("faß.de");
    expect(screen.getByLabelText("ASCII/Punycode Domain")).toHaveValue(
      "xn--fa-hia.de",
    );
    expect(editor).toHaveValue(
      "https://User@xn--fa-hia.de:044/a%2fb?x=1#Frag%2f",
    );

    const ascii = screen.getByLabelText("ASCII/Punycode Domain");
    ascii.focus();
    fireEvent.change(ascii, { target: { value: "EXAMPLE.COM" } });
    expect(ascii).toHaveFocus();
    expect(ascii).toHaveValue("example.com");
    expect(unicode).toHaveValue("example.com");
    expect(editor).toHaveValue(
      "https://User@example.com:044/a%2fb?x=1#Frag%2f",
    );
  });

  it("isolates an invalid Domain draft and associates its stable guidance", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const ascii = screen.getByLabelText("ASCII/Punycode Domain");
    const domainId = ascii.closest("li")?.dataset.pieceId;
    fireEvent.change(ascii, { target: { value: "xn--" } });
    expect(ascii).toHaveValue("xn--");
    expect(ascii).toHaveAttribute("aria-invalid", "true");
    expect(ascii).toHaveAttribute(
      "aria-errormessage",
      `error-${domainId}-domain-ascii`,
    );
    expect(ascii).toHaveAttribute(
      "aria-describedby",
      `help-${domainId}-domain error-${domainId}-domain-ascii`,
    );
    expect(
      document.getElementById(`help-${domainId}-domain`),
    ).toHaveTextContent("synchronizes both Domain forms and the Full URL");
    expect(screen.queryByText("Domain forms are synchronized.")).not.toBeInTheDocument();
    expect(screen.getAllByText("Enter a valid ASCII or Punycode domain.")).toHaveLength(
      1,
    );
    expect(screen.getByLabelText("Unicode Domain")).toHaveValue("example.com");
    expect(editor).toHaveValue("https://example.com/a?x=1");

    fireEvent.change(ascii, { target: { value: "XN--FA-HIA.DE" } });
    expect(ascii).not.toHaveAttribute("aria-invalid");
    expect(ascii).toHaveValue("xn--fa-hia.de");
    expect(screen.getByLabelText("Unicode Domain")).toHaveValue("faß.de");
    expect(editor).toHaveValue("https://xn--fa-hia.de/a?x=1");
    expect(screen.getByText(/Domain synchronized at revision/)).toHaveTextContent(
      "Unicode Domain, ASCII/Punycode Domain, and Full URL updated",
    );
    const status = screen.getByText(/Domain synchronized at revision/);
    expect(status).toHaveAttribute("role", "status");
    expect(status).toHaveAttribute("aria-live", "polite");

    fireEvent.change(ascii, { target: { value: "xn--" } });
    expect(screen.queryByText(/Domain synchronized at revision/)).not.toBeInTheDocument();
  });

  it("clears active Search when a Domain edit starts and retains Domain focus", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=1" },
    });
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "example" } });
    const unicode = screen.getByLabelText("Unicode Domain");
    unicode.focus();
    fireEvent.change(unicode, { target: { value: "faß.de" } });

    expect(search).toHaveValue("");
    expect(unicode).toHaveFocus();
    expect(unicode).toHaveValue("faß.de");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("suppresses Domain commits and synchronization status during IME composition", async () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/" } });
    const unicode = screen.getByLabelText("Unicode Domain");
    fireEvent.compositionStart(unicode);
    fireEvent.change(unicode, { target: { value: "cafe\u0301.example" } });
    expect(editor).toHaveValue("https://example.com/");
    expect(screen.queryByText("Domain forms are synchronized.")).not.toBeInTheDocument();
    fireEvent.compositionEnd(unicode, {
      target: { value: "cafe\u0301.example" },
      data: "e\u0301",
    });
    expect(editor).toHaveValue("https://xn--caf-dma.example/");
    expect(unicode).toHaveValue("café.example");
    expect(screen.getByText(/Domain synchronized at revision/)).toBeInTheDocument();

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    fireEvent.input(unicode, {
      target: { value: "cafe\u0301.example" },
      inputType: "insertFromComposition",
      isComposing: false,
    });
    expect(unicode).toHaveValue("café.example");
    expect(screen.getByText(/Domain synchronized at revision/)).toBeInTheDocument();
  });

  it("restores the Domain caret through normalization inside the raw suffix", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/" } });
    const unicode = screen.getByLabelText("Unicode Domain") as HTMLInputElement;

    fireEvent.change(unicode, { target: { value: "cafe\u0301..example" } });
    fireEvent.input(unicode, {
      target: {
        value: "cafe\u0301.example",
        selectionStart: 6,
        selectionEnd: 6,
      },
    });

    expect(unicode).toHaveValue("café.example");
    expect(unicode.selectionStart).toBe(5);
  });

  it("keeps structured editors enabled while Full URL text changes or turns invalid, as long as a Last Valid snapshot exists", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const value = screen.getByLabelText(/^Value, Query Parameter/);
    expect(value).toBeEnabled();

    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=revised" },
    });
    expect(screen.getByLabelText(/^Value, Query Parameter/)).toBeEnabled();

    fireEvent.change(editor, { target: { value: "/invalid" } });
    expect(screen.getByLabelText(/^Value, Query Parameter/)).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Add Query Parameter before the list" }),
    ).toBeEnabled();
    expect(editor).toHaveValue("/invalid");
    expect(screen.getByText(/complete HTTP or HTTPS/)).toBeVisible();
  });

  it("clears active Search before editing and retains the edited control", () => {
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?dup=1&other=2" } },
    );
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "dup" } });
    const key = screen.getByLabelText(
      "Key, Query Parameter 1 of 2",
    ) as HTMLInputElement;
    key.focus();
    fireEvent.change(key, { target: { value: "renamed" } });

    expect(search).toHaveValue("");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(key).toHaveFocus();
    expect(key).toHaveValue("renamed");
    expect(
      within(document.querySelector("#search-status") as HTMLElement).getByText(
        "4 of 4 Managed Pieces shown.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps percent triplets and Unicode code points atomic during deletion", () => {
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?x=%2F😀" } },
    );
    const value = screen.getByLabelText(/^Value, Query Parameter/) as HTMLInputElement;
    value.focus();
    fireEvent.change(value, { target: { value: "😀" } });
    expect(value).toHaveValue("😀");

    fireEvent.change(value, { target: { value: "" } });
    expect(value).toHaveValue("");
    expect(value).not.toHaveAttribute("aria-invalid");
  });

  it("expands fallback partial triplet deletion to the complete atom", () => {
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?x=%2F" } },
    );
    const value = screen.getByLabelText(/^Value, Query Parameter/);
    fireEvent.change(value, { target: { value: "%F" } });
    expect(value).toHaveValue("");
    expect(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
    ).toHaveValue("https://example.com/a?x=");
  });

  it("preserves piece identity when focused and the Full URL text is re-published unchanged", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const before = screen
      .getAllByRole("listitem")
      .map((item) => item.getAttribute("data-piece-id"));

    fireEvent.focus(editor);
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });

    expect(
      screen
        .getAllByRole("listitem")
        .map((item) => item.getAttribute("data-piece-id")),
    ).toEqual(before);
  });

  it("mints a fresh piece id when, while focused, Full URL text detours through a changed value before returning", () => {
    // Reconciliation diffs each keystroke against the most recently accepted
    // snapshot (not the original focus baseline), so a value that changes and
    // then changes back does not recover its original id -- only an
    // unmodified round-trip (see the test above) does.
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const value = screen.getByLabelText(/^Value, Query Parameter/);
    const beforeId = value.closest("li")?.getAttribute("data-piece-id");

    fireEvent.focus(editor);
    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=draft" },
    });
    expect(screen.getByLabelText(/^Value, Query Parameter/)).toBeEnabled();
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    expect(
      screen
        .getByLabelText(/^Value, Query Parameter/)
        .closest("li")
        ?.getAttribute("data-piece-id"),
    ).not.toBe(beforeId);
  });

  it("does not expand deletion across unpaired surrogate code units", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=a\uDC00x" },
    });
    const value = screen.getByLabelText(
      /^Value, Query Parameter/,
    ) as HTMLInputElement;
    value.focus();
    value.setSelectionRange(2, 2);
    fireEvent.keyDown(value, { key: "Backspace" });
    expect(value).toHaveValue("ax");

    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=a\uD800x" },
    });
    const nextValue = screen.getByLabelText(
      /^Value, Query Parameter/,
    ) as HTMLInputElement;
    nextValue.setSelectionRange(2, 3);
    fireEvent.cut(nextValue, {
      clipboardData: { setData: vi.fn() },
    });
    expect(nextValue).toHaveValue("a\uD800");
  });

  it("announces Search restoration even when a structured edit is rejected", () => {
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?x=1" } },
    );
    fireEvent.change(screen.getByLabelText("Search Managed Pieces"), {
      target: { value: "x" },
    });
    fireEvent.change(screen.getByLabelText(/^Value, Query Parameter/), {
      target: { value: "%" },
    });
    expect(screen.getByLabelText("Search Managed Pieces")).toHaveValue("");
    expect(
      within(document.querySelector("#search-status") as HTMLElement).getByText(
        "3 of 3 Managed Pieces shown.",
      ),
    ).toBeInTheDocument();
    expect(
      within(document.querySelector("#search-status") as HTMLElement).queryByText(
        "1 of 3 Managed Pieces shown.",
      ),
    ).not.toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/b?y=2" } },
    );
    expect(
      within(document.querySelector("#search-status") as HTMLElement).queryByText(
        "3 of 3 Managed Pieces shown.",
      ),
    ).not.toBeInTheDocument();
  });

  it("preserves untouched raw Unicode in fallback and IME changes", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=café-tail" },
    });
    const value = screen.getByLabelText(/^Value, Query Parameter/);
    fireEvent.change(value, { target: { value: "café-next" } });
    expect(editor).toHaveValue("https://example.com/a?x=café-next");

    fireEvent.compositionStart(value);
    fireEvent.change(value, { target: { value: "café-日本" } });
    fireEvent.compositionEnd(value, { data: "日本" });
    expect(editor).toHaveValue(
      "https://example.com/a?x=café-%E6%97%A5%E6%9C%AC",
    );
  });

  it("gives duplicate query editors source-identifiable accessible names", () => {
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/?dup=1&dup=2" } },
    );
    expect(
      screen.getByLabelText(
        "Key, Query Parameter 2 of 2, occurrence 2 of 2",
      ),
    ).toBeVisible();
    expect(
      screen.getByLabelText(
        "Value, Query Parameter 1 of 2, occurrence 1 of 2",
      ),
    ).toBeVisible();
  });

  it("removes one duplicate under Search and focuses the next visible Remove control", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: removalFixtures.duplicateQuery } });
    const beforeIds = screen
      .getAllByRole("listitem")
      .map((row) => row.getAttribute("data-piece-id"));
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "dup" } });
    const target = screen.getByRole("button", {
      name: /Remove Query Parameter at position 1 of 3/,
    });
    expect(screen.queryByRole("button", { name: /Remove Domain/ })).toBeNull();

    await user.click(target);

    expect(editor).toHaveValue("https://example.com/a?dup=&dup=3#Frag%2f");
    expect(search).toHaveValue("dup");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen
        .getAllByRole("listitem")
        .map((row) => row.getAttribute("data-piece-id")),
    ).toEqual([beforeIds[3], beforeIds[4]]);
    expect(
      screen.getByRole("button", { name: /Remove Query Parameter at position 1 of 2/ }),
    ).toHaveFocus();
    expect(
      screen.getByText("Query Parameter 1 removed. Full URL and Structured View updated."),
    ).toHaveAttribute("role", "status");
    expect(screen.getByLabelText(/^Value, Query Parameter 1 of 2/)).toHaveValue("");
  });

  it("does not commit or move focus on pointer-down and pointer cancellation", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: removalFixtures.mixedQuery } });
    const search = screen.getByLabelText("Search Managed Pieces");
    search.focus();
    const remove = screen.getByRole("button", {
      name: /Remove Query Parameter at position 1 of 5/,
    });

    fireEvent.pointerDown(remove);
    expect(search).toHaveFocus();
    fireEvent.pointerCancel(remove);

    expect(search).toHaveFocus();
    expect(editor).toHaveValue(removalFixtures.mixedQuery);
    expect(screen.queryByText(/Query Parameter 1 removed/)).toBeNull();
  });

  it("uses Clear Search, the after-list Add control, or the Structured View heading as the removal focus fallback", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: removalFixtures.clearSearchFallback },
    });
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "example.com" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    await user.click(
      screen.getByRole("button", { name: /Remove Query Parameter at position 1 of 1/ }),
    );
    expect(search).toHaveValue("example.com");
    expect(screen.getByRole("button", { name: "Clear Search" })).toHaveFocus();

    rerender(<Workbench />);
    fireEvent.change(editor, { target: { value: removalFixtures.headingFallback } });
    fireEvent.change(search, { target: { value: "needle" } });
    const remove = screen.getByRole("button", {
      name: /Remove Query Parameter at position 1 of 2/,
    });
    remove.focus();
    await user.keyboard("{Enter}");
    expect(editor).toHaveValue("https://example.com/a?other=2");
    expect(search).toHaveValue("needle");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(document.getElementById("add-query-after")).toHaveFocus();
  });

  it("focuses the nearest previous visible Remove control when the last row is removed", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://example.com/?needle=1&needle=2" },
    });
    fireEvent.change(screen.getByLabelText("Search Managed Pieces"), {
      target: { value: "needle" },
    });

    await user.click(
      screen.getByRole("button", {
        name: /Remove Query Parameter at position 2 of 2/,
      }),
    );

    expect(editor).toHaveValue("https://example.com/?needle=1");
    expect(
      screen.getByRole("button", {
        name: /Remove Query Parameter at position 1 of 1/,
      }),
    ).toHaveFocus();
  });

  it("announces the original source position when Search isolates a later piece", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://example.com/?first=1&target=2&third=3" },
    });
    fireEvent.change(screen.getByLabelText("Search Managed Pieces"), {
      target: { value: "target" },
    });

    await user.click(
      screen.getByRole("button", {
        name: /Remove Query Parameter at position 2 of 3/,
      }),
    );

    expect(editor).toHaveValue("https://example.com/?first=1&third=3");
    expect(
      screen.getByText("Query Parameter 2 removed. Full URL and Structured View updated."),
    ).toHaveAttribute("role", "status");
  });

  it("offers a skip link to the after-list Add Query Parameter control", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    await user.type(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      "https://example.com/a?x=1",
    );
    expect(
      screen.getByRole("link", { name: "Skip to Add Query Parameter" }),
    ).toHaveAttribute("href", "#add-query-after");
    expect(document.getElementById("add-query-after")).toBeInTheDocument();
  });

  it("appends exactly one fresh Query Parameter from the before-list Add control with no query present", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    await user.type(editor, "https://example.com/a");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Add Query Parameter before the list" }));

    expect(editor).toHaveValue("https://example.com/a?");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByText("Query Parameter 1 added. Full URL and Structured View updated."),
    ).toHaveAttribute("role", "status");
  });

  it("appends exactly one fresh Query Parameter from the after-list Add control after existing entries and focuses the new key", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const beforeIds = screen
      .getAllByRole("listitem")
      .map((row) => row.getAttribute("data-piece-id"));

    const addAfter = document.getElementById("add-query-after");
    if (!(addAfter instanceof HTMLButtonElement)) {
      throw new Error("Missing after-list Add control");
    }
    await user.click(addAfter);

    expect(editor).toHaveValue("https://example.com/a?x=1&");
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(4);
    const newId = rows[3]?.getAttribute("data-piece-id");
    expect(newId).not.toBeNull();
    expect(beforeIds.includes(newId)).toBe(false);
    expect(
      screen.getByLabelText(/^Key, Query Parameter 2 of 2/),
    ).toHaveFocus();
    expect(screen.getByLabelText(/^Key, Query Parameter 2 of 2/)).toHaveValue("");
    expect(
      screen.getByLabelText(/^Value absent, Query Parameter 2 of 2/),
    ).toHaveValue("");
  });

  it("clears an active Search and adds the row as one operation, keeping the new key focused", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://example.com/a?dup=1&dup=2" },
    });
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "dup" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    const addAfter = document.getElementById("add-query-after");
    if (!(addAfter instanceof HTMLButtonElement)) {
      throw new Error("Missing after-list Add control");
    }
    await user.click(addAfter);

    expect(search).toHaveValue("");
    expect(editor).toHaveValue("https://example.com/a?dup=1&dup=2&");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(
      screen.getByLabelText(/^Key, Query Parameter 3 of 3/),
    ).toHaveFocus();
  });

  it("leaves an active Search unchanged when Add is rejected for exceeding URL capacity", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    const prefix = "https://example.com/a?big=";
    const atCapacity = `${prefix}${"x".repeat(20_000 - prefix.length)}`;
    fireEvent.change(editor, { target: { value: atCapacity } });
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "no-match-term" } });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Add Query Parameter after the list" }),
    );

    expect(search).toHaveValue("no-match-term");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.queryByText(/Query Parameter \d+ added/)).toBeNull();
  });

  it("does not commit or move focus on pointer-down and pointer cancellation for Add", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const search = screen.getByLabelText("Search Managed Pieces");
    search.focus();
    const addAfter = document.getElementById("add-query-after");
    if (!(addAfter instanceof HTMLButtonElement)) {
      throw new Error("Missing after-list Add control");
    }

    fireEvent.pointerDown(addAfter);
    expect(search).toHaveFocus();
    fireEvent.pointerCancel(addAfter);

    expect(search).toHaveFocus();
    expect(editor).toHaveValue("https://example.com/a?x=1");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText(/Query Parameter 2 added/)).toBeNull();
  });

  it("permits Add while the Full URL textarea has a pending unclosed draft", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    fireEvent.focus(editor);
    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=1&draft" },
    });

    expect(
      [
        screen.getByRole("button", { name: "Add Query Parameter before the list" }),
        screen.getByRole("button", { name: "Add Query Parameter after the list" }),
      ].every((button) => !(button as HTMLButtonElement).disabled),
    ).toBe(true);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);

    await user.click(
      screen.getByRole("button", { name: "Add Query Parameter after the list" }),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(editor).toHaveValue("https://example.com/a?x=1&draft&");
  });

  it("exposes boundary-disabled Move Up/Move Down controls on every row", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    await user.type(editor, "https://example.com/a?x=1&y=2&z=3");

    const firstUp = screen.getByRole("button", {
      name: /Move Query Parameter at position 1 of 3 up/,
    });
    const firstDown = screen.getByRole("button", {
      name: /Move Query Parameter at position 1 of 3 down/,
    });
    const lastUp = screen.getByRole("button", {
      name: /Move Query Parameter at position 3 of 3 up/,
    });
    const lastDown = screen.getByRole("button", {
      name: /Move Query Parameter at position 3 of 3 down/,
    });

    expect(firstUp).toBeDisabled();
    expect(firstDown).not.toBeDisabled();
    expect(lastUp).not.toBeDisabled();
    expect(lastDown).toBeDisabled();
  });

  it("moves a middle row down by one source position, keeping focus and announcing the outcome", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    await user.type(editor, "https://example.com/a?x=1&y=2&z=3");

    const moveDown = screen.getByRole("button", {
      name: /Move Query Parameter at position 2 of 3 down/,
    });
    await user.click(moveDown);

    expect(editor).toHaveValue("https://example.com/a?x=1&z=3&y=2");
    expect(
      screen.getByRole("button", {
        name: /Move Query Parameter at position 3 of 3 up/,
      }),
    ).toHaveFocus();
    expect(
      screen.getByText(/"y=2" moved from position 2 to position 3 of 3/),
    ).toHaveAttribute("role", "status");
  });

  it("moves focus to the enabled opposite control when a move lands on a boundary", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    await user.type(editor, "https://example.com/a?x=1&y=2&z=3");

    const moveUp = screen.getByRole("button", {
      name: /Move Query Parameter at position 2 of 3 up/,
    });
    await user.click(moveUp);

    expect(editor).toHaveValue("https://example.com/a?y=2&x=1&z=3");
    expect(
      screen.getByRole("button", {
        name: /Move Query Parameter at position 1 of 3 down/,
      }),
    ).toHaveFocus();
  });

  it("resolves moves against full source order while Search filters rows", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    await user.type(editor, "https://example.com/a?x=1&needle=2&z=3");
    const search = screen.getByLabelText("Search Managed Pieces");
    fireEvent.change(search, { target: { value: "needle" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    await user.click(
      screen.getByRole("button", {
        name: /Move Query Parameter at position 2 of 3 down/,
      }),
    );

    expect(editor).toHaveValue("https://example.com/a?x=1&z=3&needle=2");
    expect(search).toHaveValue("needle");
    expect(
      screen.getByRole("button", {
        name: /Move Query Parameter at position 3 of 3 up/,
      }),
    ).toHaveFocus();
  });

  it("does not commit or move focus on pointer-down and pointer cancellation for Move", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1&y=2" } });
    const search = screen.getByLabelText("Search Managed Pieces");
    search.focus();
    const moveDown = screen.getByRole("button", {
      name: /Move Query Parameter at position 1 of 2 down/,
    });

    fireEvent.pointerDown(moveDown);
    expect(search).toHaveFocus();
    fireEvent.pointerCancel(moveDown);

    expect(search).toHaveFocus();
    expect(editor).toHaveValue("https://example.com/a?x=1&y=2");
    expect(screen.queryByText(/moved from position/)).toBeNull();
  });

  it("permits Move while the Full URL textarea has a pending unclosed draft", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1&y=2" } });
    fireEvent.focus(editor);
    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=1&y=2&draft" },
    });

    const moveButtons = screen.getAllByRole("button", { name: /Move Query Parameter/ });
    expect(moveButtons.some((button) => !(button as HTMLButtonElement).disabled)).toBe(
      true,
    );

    await user.click(
      screen.getByRole("button", {
        name: /Move Query Parameter at position 1 of 3 down/,
      }),
    );
    expect(editor).toHaveValue("https://example.com/a?y=2&x=1&draft");
  });

  it("moves within a 250+ parameter list, preserving correctness at capacity", async () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    const entries = Array.from(
      { length: 260 },
      (_, index) => `parameter-${index}=value-${index}`,
    );
    fireEvent.change(editor, {
      target: { value: `https://example.com/deep/path?${entries.join("&")}` },
    });

    const moveDown = screen.getByRole("button", {
      name: /Move Query Parameter at position 101 of 260 down/,
    });
    fireEvent.click(moveDown);
    expect((editor as HTMLTextAreaElement).value).toContain(
      "parameter-101=value-101&parameter-100=value-100",
    );
  }, 20_000);

  it("publishes the Structured View keystroke by keystroke with no explicit apply step", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    expect(
      screen.queryByRole("button", { name: "Apply URL" }),
    ).not.toBeInTheDocument();

    const target = "https://example.com/a?x=1";
    for (let length = 1; length <= target.length; length += 1) {
      fireEvent.change(editor, { target: { value: target.slice(0, length) } });
    }

    expect(screen.getByLabelText("Unicode Domain")).toHaveValue("example.com");
    expect(screen.getByLabelText("Path Segment 1 of 1")).toHaveValue("a");
    expect(screen.getByLabelText(/^Key, Query Parameter/)).toHaveValue("x");
    expect(screen.getByLabelText(/^Value, Query Parameter/)).toHaveValue("1");
    expect(
      screen.queryByRole("button", { name: "Apply URL" }),
    ).not.toBeInTheDocument();
  });

  it("accepts a full paste-and-replace of the Full URL followed by blur without error or data loss", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    fireEvent.focus(editor);
    fireEvent.change(editor, {
      target: { value: "https://replaced.example/b?y=2" },
    });

    expect(() => fireEvent.blur(editor)).not.toThrow();
    expect(editor).toHaveValue("https://replaced.example/b?y=2");
    expect(screen.getByLabelText("Unicode Domain")).toHaveValue("replaced.example");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

    it("keeps retained row identities during first-intake typing and after Enter without refocusing", () => {
      render(<Workbench />);
      const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
      fireEvent.focus(editor);
      fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
      const query = screen.getByLabelText(/^Key, Query Parameter/);
      const initialId = query.id;
      fireEvent.change(editor, { target: { value: "https://example.com/b?x=1" } });
      expect(screen.getByLabelText(/^Key, Query Parameter/).id).toBe(initialId);
      fireEvent.keyDown(editor, { key: "Enter" });
      fireEvent.change(editor, { target: { value: "https://example.com/c?x=1" } });
      expect(screen.getByLabelText(/^Key, Query Parameter/).id).toBe(initialId);
    });

    it("buffers Full URL composition, ignores confirming Enter even without isComposing, then publishes once", () => {
      render(<Workbench />);
      const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
      fireEvent.focus(editor);
      fireEvent.change(editor, { target: { value: "https://example.com/a" } });
      const path = screen.getByLabelText("Path Segment 1 of 1");
      fireEvent.compositionStart(editor);
      fireEvent.change(editor, { target: { value: "https://" } });
      fireEvent.keyDown(editor, { key: "Enter", isComposing: false });
      expect(editor).toHaveValue("https://");
      expect(path).toHaveValue("a");
      expect(editor).not.toHaveAttribute("aria-invalid");
      fireEvent.change(editor, { target: { value: "https://example.com/final" } });
      fireEvent.compositionEnd(editor, { data: "final" });
      expect(screen.getByLabelText("Path Segment 1 of 1")).toHaveValue("final");
      expect(editor).toHaveValue("https://example.com/final");
    });

    it("preserves invalid Draft and its selection while Add updates Last Valid and focuses the new key", () => {
      render(<Workbench />);
      const editor = screen.getByLabelText(
        "Complete HTTP or HTTPS Absolute URL",
      ) as HTMLTextAreaElement;
      fireEvent.focus(editor);
      fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
      fireEvent.change(editor, { target: { value: "https://example.com/b?x=1" } });
      fireEvent.change(editor, { target: { value: "https://" } });
      editor.setSelectionRange(3, 5);
      const error = document.getElementById("error-full-url")?.textContent;
      fireEvent.click(screen.getByRole("button", {
        name: "Add Query Parameter before the list",
      }));
      expect(editor).toHaveValue("https://");
      expect(editor.selectionStart).toBe(3);
      expect(editor.selectionEnd).toBe(5);
      expect(document.getElementById("error-full-url")?.textContent).toBe(error);
      expect(screen.getByLabelText("Key, Query Parameter 2 of 2")).toHaveFocus();
      expect(screen.getByText(/Last Valid URL and Structured View updated. Draft unchanged./))
        .toBeVisible();
    });

  it("suppresses the newline a non-composing Enter would otherwise insert", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText(
      "Complete HTTP or HTTPS Absolute URL",
    ) as HTMLTextAreaElement;

    await user.type(editor, "https://example.com/a{Enter}b");

    expect(editor.value).toBe("https://example.com/ab");
    expect(editor.value).not.toContain("\n");
  });

  it("does not throw and leaves the draft untouched when Enter arrives while composing", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText(
      "Complete HTTP or HTTPS Absolute URL",
    ) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: "https://example.com/a" } });

    expect(() =>
      fireEvent.keyDown(editor, { key: "Enter", isComposing: true }),
    ).not.toThrow();
    expect(editor.value).toBe("https://example.com/a");
  });

  it("keeps Structured View editors enabled while an invalid Full URL draft is present, as long as a Last Valid snapshot exists", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    const removeButton = screen.getByRole("button", {
      name: /Remove Query Parameter at position 1 of 1/,
    });
    const addButton = screen.getByRole("button", {
      name: "Add Query Parameter before the list",
    });
    expect(removeButton).toBeEnabled();
    expect(addButton).toBeEnabled();

    fireEvent.change(editor, { target: { value: "not-a-valid-url" } });

    expect(
      screen.getByRole("button", {
        name: /Remove Query Parameter at position 1 of 1/,
      }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Add Query Parameter before the list" }),
    ).toBeEnabled();
    expect(screen.getByText(/complete HTTP or HTTPS/)).toBeVisible();
  });
});
