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
import { semanticFixture } from "../../test/fixtures/semantic";
import { Workbench } from "./Workbench";

describe("URL Workbench", () => {
  afterEach(() => vi.useRealTimers());

  it("renders all managed pieces and retains the trusted view after invalid intake", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");

    await user.type(editor, semanticFixture);
    await user.click(screen.getByRole("button", { name: "Apply URL" }));
    await screen.findByText(/URL parsed/);
    expect(screen.getAllByRole("listitem")).toHaveLength(13);
    expect(screen.getByLabelText("Unicode Domain")).toHaveValue("faß.de");
    expect(screen.getByLabelText("ASCII/Punycode Domain")).toHaveValue(
      "xn--fa-hia.de",
    );
    expect(screen.getAllByText("Value absent")).toHaveLength(2);

    await user.clear(editor);
    await user.type(editor, "/relative");
    await user.click(screen.getByRole("button", { name: "Apply URL" }));
    expect(await screen.findByText(/complete HTTP or HTTPS/)).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(13);
  });

  it("does not publish a stale parse", async () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://first.example/a" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
    fireEvent.change(editor, { target: { value: "https://second.example/b" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Unicode Domain")).toHaveValue(
        "second.example",
      ),
    );
  });

  it("shows specific safety guidance for pasted line breaks", async () => {
    const user = userEvent.setup();
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    await user.type(editor, "https://example.com/a{enter}b");
    await user.click(screen.getByRole("button", { name: "Apply URL" }));
    expect(await screen.findByText(/Remove line breaks/)).toBeVisible();
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
    await user.click(screen.getByRole("button", { name: "Apply URL" }));
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
    await user.click(screen.getByRole("button", { name: "Apply URL" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
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
    await user.click(screen.getByRole("button", { name: "Apply URL" }));

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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
    fireEvent.change(screen.getByLabelText("Search Managed Pieces"), {
      target: { value: "1" },
    });
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByText("1 of 3 Managed Pieces shown.")).toBeInTheDocument();

    fireEvent.change(editor, { target: { value: "https://second.example/b" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
    const value = screen.getByLabelText(/^Value, Query Parameter/);
    value.focus();
    fireEvent.change(value, { target: { value: "%" } });
    expect(value).toHaveValue("%");
    expect(value).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/complete triplet/)).toBeVisible();
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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
    const value = screen.getByLabelText(/^Value, Query Parameter/);
    fireEvent.compositionStart(value);
    fireEvent.change(value, { target: { value: "日本" } });
    expect(editor).toHaveValue("https://example.com/a?x=long");
    fireEvent.compositionEnd(value, { data: "日本" });
    expect(editor).toHaveValue("https://example.com/a?x=%E6%97%A5%E6%9C%AC");
  });

  it("disables structured editors while Full URL text is pending or invalid", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, { target: { value: "https://example.com/a?x=1" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
    const value = screen.getByLabelText(/^Value, Query Parameter/);
    expect(value).toBeEnabled();

    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=unapplied" },
    });
    expect(value).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
    expect(screen.getByLabelText(/^Value, Query Parameter/)).toBeEnabled();

    fireEvent.change(editor, { target: { value: "/invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
    expect(screen.getByLabelText(/^Value, Query Parameter/)).toBeDisabled();
    expect(editor).toHaveValue("/invalid");
  });

  it("clears active Search before editing and retains the edited control", () => {
    render(<Workbench />);
    fireEvent.change(
      screen.getByLabelText("Complete HTTP or HTTPS Absolute URL"),
      { target: { value: "https://example.com/a?dup=1&other=2" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
    const value = screen.getByLabelText(/^Value, Query Parameter/) as HTMLInputElement;
    value.focus();
    fireEvent.change(value, { target: { value: "😀" } });
    expect(value).toHaveValue("😀");

    fireEvent.change(value, { target: { value: "" } });
    expect(value).toHaveValue("");
    expect(value).not.toHaveAttribute("aria-invalid");
  });

  it("preserves untouched raw Unicode in fallback and IME changes", () => {
    render(<Workbench />);
    const editor = screen.getByLabelText("Complete HTTP or HTTPS Absolute URL");
    fireEvent.change(editor, {
      target: { value: "https://example.com/a?x=café-tail" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Apply URL" }));
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
});
