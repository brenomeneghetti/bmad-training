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
    expect(screen.getByLabelText("Key")).toHaveValue("MixedKey");

    await user.clear(search);
    await user.type(search, "needle");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByLabelText("Value")).toHaveValue("Needle");
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
    expect(filteredRows[0]).toHaveAttribute("aria-posinset", "1");
    expect(filteredRows[0]).toHaveAttribute("aria-setsize", "2");
    expect(screen.getByText("Filtered position 1 of 2")).toBeVisible();
    expect(screen.getByText("Query Parameter 1 of 8, occurrence 1 of 2")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Clear Search" }));
    expect(search).toHaveFocus();
    expect(search).toHaveValue("");
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
    const clearButtons = screen.getAllByRole("button", { name: "Clear Search" });

    fireEvent.pointerDown(clearButtons[1]);
    expect(search).toHaveValue("unmatched");
    fireEvent.keyDown(search, { key: "Escape" });
    expect(search).toHaveValue("unmatched");

    await user.click(clearButtons[1]);
    expect(search).toHaveFocus();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("settles polite repeatable search announcements without moving focus", async () => {
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
    expect(search).toHaveFocus();

    fireEvent.change(search, { target: { value: "no" } });
    fireEvent.change(search, { target: { value: "x" } });
    await waitFor(() =>
      expect(document.querySelector("#search-status span")).not.toBe(
        firstAnnouncement,
      ),
    );
    expect(screen.getByText("3 of 4 Managed Pieces shown.")).toBeInTheDocument();
    expect(search).toHaveFocus();
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

    act(() => vi.advanceTimersByTime(75));
    expect(document.querySelector("#search-status span")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1_999));
    expect(document.querySelector("#search-status span")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(document.querySelector("#search-status span")).not.toBeInTheDocument();
  });
});
