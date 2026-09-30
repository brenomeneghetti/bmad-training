import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { semanticFixture } from "../../test/fixtures/semantic";
import { Workbench } from "./Workbench";

describe("URL Workbench", () => {
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

  it("has the required landmark and heading structure", () => {
    render(<Workbench />);
    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1 })).toHaveTextContent(
      "URL Workbench",
    );
    expect(screen.getAllByRole("region")).toHaveLength(3);
  });
});
