import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import {
  createCapacityFixture,
  removalFixtures,
  semanticFixture,
  structuredEditFixture,
  undoFocusFixture,
  undoFocusKinds,
} from "../src/test/fixtures/semantic";
import delivery from "../deployment/static-delivery.json" with { type: "json" };

interface PrivacyProbe {
  storageWrites: string[];
  indexedDbCalls: string[];
  cacheCalls: string[];
  serviceWorkerCalls: string[];
  beaconCalls: string[];
  fetchCalls: string[];
}

test.beforeEach(async ({ browser, browserName }, testInfo) => {
  testInfo.annotations.push({ type: "engine", description: `${browserName}:${browser.version()}` });
});

const installCopyProbe = async (page: import("@playwright/test").Page) => {
  await page.addInitScript(() => {
    const probe = {
      writes: [] as string[], mode: "success",
      pending: [] as { resolve: () => void; reject: () => void }[],
    };
    Object.defineProperty(window, "__copyProbe", { value: probe });
    Object.defineProperty(navigator, "clipboard", { configurable: true, get: () => {
      if (probe.mode === "unavailable") return undefined;
      return { writeText: (value: string) => {
        probe.writes.push(value);
        if (probe.mode === "throw") throw new Error("non-content failure");
        if (probe.mode === "reject") return Promise.reject(new Error("non-content failure"));
        if (probe.mode === "pending") return new Promise<void>((resolve, reject) => {
          probe.pending.push({ resolve, reject: () => reject(new Error("non-content failure")) });
        });
        return Promise.resolve();
      } };
    } });
  });
};

declare global {
  interface Window {
    __copyProbe: {
      writes: string[]; mode: string;
      pending: { resolve: () => void; reject: () => void }[];
    };
  }
}

test("Story 3.5 Chromium schedules two-second repeated children and strict six-second exact overflow summaries", async ({ page }) => {
  await installCopyProbe(page);
  await page.clock.install({ time: new Date("2026-10-08T12:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-10-08T12:00:01Z"));
  await page.getByLabel("Complete HTTP or HTTPS Absolute URL").fill("https://example.com/a");
  const status = page.locator("#operation-status");
  await expect(status).toHaveText("URL parsed. 2 Managed Pieces available.");
  await page.clock.runFor(2_000);
  const search = page.getByLabel("Search Managed Pieces");
  await search.focus();
  const copy = page.getByRole("button", { name: "Copy", exact: true });
  await copy.dispatchEvent("click");
  await expect(status).toHaveText("Current URL copied.");
  await status.evaluate((element) => {
    Object.defineProperty(window, "__firstStatusChild", { configurable: true, value: element.firstChild });
  });
  await copy.dispatchEvent("click");
  await page.clock.runFor(1_999);
  expect(await status.evaluate((element) => element.firstChild ===
    (window as unknown as { __firstStatusChild: Node }).__firstStatusChild)).toBe(true);
  await page.clock.runFor(1);
  expect(await status.evaluate((element) => element.firstChild ===
    (window as unknown as { __firstStatusChild: Node }).__firstStatusChild)).toBe(false);
  await expect(status).toHaveText("Current URL copied.");
  for (let i = 0; i < 3; i++) {
    await copy.dispatchEvent("click");
    await expect.poll(() => page.evaluate(() => window.__copyProbe.writes.length)).toBe(i + 3);
  }
  await expect(page.getByRole("list", { name: "Feedback history" })).toHaveCount(0);
  await copy.dispatchEvent("click");
  const history = page.getByRole("list", { name: "Feedback history" });
  await expect(history.getByRole("listitem")).toHaveCount(5);
  expect(await history.getByRole("listitem").allTextContents()).toEqual(Array(5).fill("Current URL copied."));
  await expect(status).toHaveText("Current URL copied.");
  for (let i = 0; i < 3; i++) {
    await copy.dispatchEvent("click");
    await expect.poll(() => page.evaluate(() => window.__copyProbe.writes.length)).toBe(i + 7);
  }
  await expect(history.getByRole("listitem")).toHaveCount(8);
  await page.clock.runFor(1_999);
  await expect(status).toHaveText("Current URL copied.");
  await page.clock.runFor(1);
  await expect(status).toHaveText("5 operation outcomes added to feedback history.");
  await page.clock.runFor(2_000);
  await expect(status).toHaveText("3 operation outcomes added to feedback history.");
  await expect(history.getByRole("listitem")).toHaveCount(8);
  await expect(search).toBeFocused();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveAttribute("aria-disabled", "true");
});

test("Story 3.5 Chromium coalesces settled Search and synchronization without preempting committed FIFO", async ({ page }) => {
  await installCopyProbe(page);
  await page.clock.install({ time: new Date("2026-10-08T12:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-10-08T12:00:01Z"));
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await editor.fill("https://example.com/a?x=1&y=2");
  const search = page.getByLabel("Search Managed Pieces");
  await search.fill("x");
  await page.clock.runFor(300);
  await search.fill("y");
  await page.clock.runFor(300);
  await editor.fill("https://example.com/b?x=1&y=2");
  await page.clock.runFor(100);
  await editor.fill("https://example.com/c?x=1&y=2");
  await page.getByRole("button", { name: "Copy", exact: true }).dispatchEvent("click");
  await expect.poll(() => page.evaluate(() => window.__copyProbe.writes.length)).toBe(1);
  await page.clock.runFor(1_299);
  await expect(page.locator("#operation-status")).toHaveText("URL parsed. 4 Managed Pieces available.");
  await page.clock.runFor(1);
  await expect(page.locator("#operation-status")).toHaveText("Current URL copied.");
  await page.clock.runFor(2_000);
  await expect(page.locator("#operation-status")).toHaveText("1 of 4 Managed Pieces shown.");
  await page.clock.runFor(2_000);
  await expect(page.locator("#operation-status")).toHaveText("URL parsed. 4 Managed Pieces available.");
  await expect(editor).toHaveValue("https://example.com/c?x=1&y=2");
  await expect(search).toHaveValue("y");
});

test("Story 3.5 Chromium validation repeats replace nodes and retain help errors through synthetic IME correction", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-08T12:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-10-08T12:00:01Z"));
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await editor.fill("https://example.com/a?x=1");
  await editor.fill("https://");
  const announcer = page.locator("#validation-announcer");
  await expect(editor).toHaveAttribute("aria-describedby", "full-url-help error-full-url");
  await expect(page.locator("#error-full-url")).toBeVisible();
  await page.clock.runFor(299);
  await expect(announcer).toBeEmpty();
  await page.clock.runFor(1);
  await expect(announcer).toContainText("Draft URL is not valid.");
  await announcer.evaluate((element) => {
    Object.defineProperty(window, "__validationChild", { configurable: true, value: element.firstChild });
  });
  await editor.press("Enter");
  expect(await announcer.evaluate((element) => element.firstChild ===
    (window as unknown as { __validationChild: Node }).__validationChild)).toBe(false);
  await editor.dispatchEvent("compositionstart");
  await editor.evaluate((input: HTMLTextAreaElement) => {
    input.value = "https://valid.example/a?x=1";
    input.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
  });
  await page.clock.runFor(500);
  await expect(page.locator("#error-full-url")).toBeVisible();
  await editor.dispatchEvent("compositionend", { data: "https://valid.example/a?x=1" });
  await expect(announcer).toBeEmpty();
  await expect(editor).not.toHaveAttribute("aria-invalid");
  await expect(editor).toHaveAttribute("aria-describedby", "full-url-help");
  for (const label of ["Unicode Domain", "Path Segment 1 of 1", "Key, Query Parameter 1 of 1", "Value, Query Parameter 1 of 1"]) {
    const field = page.getByLabel(label, { exact: true });
    const original = await field.inputValue();
    await field.fill(label === "Unicode Domain" ? "xn--" : "%");
    const id = await field.getAttribute("aria-errormessage");
    expect(id).toMatch(/^error-.*-(domain-unicode|path|query-key|query-value)$/);
    await expect(page.locator(`[id="${id}"]`)).toBeVisible();
    const help = (await field.getAttribute("aria-describedby"))!.split(" ")[0]!;
    expect(help).toMatch(/^help-/);
    await field.press("Enter");
    await announcer.evaluate((element) => {
      Object.defineProperty(window, "__validationChild", { configurable: true, value: element.firstChild });
    });
    await field.press("Enter");
    expect(await announcer.evaluate((element) => element.firstChild ===
      (window as unknown as { __validationChild: Node }).__validationChild)).toBe(false);
    await field.fill(original);
    await expect(field).not.toHaveAttribute("aria-invalid");
    await expect(field).toHaveAttribute("aria-describedby", help);
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(0);
  }
  await page.clock.resume();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("Story 3.5 Chromium failure remains independent of invalid Draft queued mutations and guarded recovery", async ({ page }) => {
  await installCopyProbe(page);
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await editor.fill("https://example.com/a?x=1&y=2");
  await page.getByLabel("Value, Query Parameter 1 of 2", { exact: true }).fill("changed");
  await editor.fill("https://");
  await expect(page.locator("#validation-announcer")).toContainText("Draft URL is not valid.");
  const status = await page.locator("#operation-status").textContent();
  await page.evaluate(() => { window.__copyProbe.mode = "pending"; });
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  const search = page.getByLabel("Search Managed Pieces");
  await search.focus();
  await page.evaluate(() => window.__copyProbe.pending.shift()!.reject());
  await expect(page.getByRole("alert")).toContainText("Couldn’t copy the Last Valid URL.");
  await expect(page.getByRole("alert")).toContainText("Select the Last Valid URL below");
  await expect(page.getByRole("alert")).not.toContainText("is selected");
  await expect(page.getByRole("alert")).toHaveAttribute("aria-atomic", "true");
  await expect(page.getByLabel("Last Valid URL — copy recovery")).toHaveValue("https://example.com/a?x=changed&y=2");
  await expect(search).toBeFocused();
  await expect(page.locator("#operation-status")).toHaveText(status!);
  await expect(page.locator("#validation-announcer")).toContainText("Draft URL is not valid.");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor).toHaveValue("https://");
  await expect(page.getByLabel("Value, Query Parameter 1 of 2", { exact: true })).toHaveValue("1");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator("#copy-recovery")).toHaveCount(0);
  await expect(page.locator("#error-full-url")).toBeVisible();
});

test("Story 3.5 Chromium dense feedback publishes below 100 ms privately with complete accessible 320px reflow", async ({ page }) => {
  await installCopyProbe(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const sinks: string[] = [];
    Object.defineProperty(window, "__feedbackSinks", { value: sinks });
    Storage.prototype.setItem = () => { sinks.push("storage"); };
    window.indexedDB.open = () => { sinks.push("indexeddb"); throw new Error("unexpected sink"); };
    window.caches.open = async () => { sinks.push("cache"); throw new Error("unexpected sink"); };
    navigator.serviceWorker.register = async () => { sinks.push("service-worker"); throw new Error("unexpected sink"); };
    navigator.sendBeacon = () => { sinks.push("beacon"); return false; };
    window.fetch = async () => { sinks.push("fetch"); throw new Error("unexpected sink"); };
  });
  await page.goto("/");
  const requests: string[] = [], diagnostics: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => diagnostics.push(message.text()));
  page.on("pageerror", (error) => diagnostics.push(error.message));
  const url = createCapacityFixture();
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await editor.fill(url);
  await expect(page.locator("#managed-pieces > li")).toHaveCount(263);
  const buttons = await page.getByRole("button", { name: "Copy", exact: true }).boundingBox();
  await page.waitForTimeout(2_000);
  const publication = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const status = document.getElementById("operation-status")!;
    const start = performance.now();
    const observer = new MutationObserver(() => {
      if (status.textContent === "Current URL copied.") {
        observer.disconnect();
        resolve(performance.now() - start);
      }
    });
    observer.observe(status, { childList: true, subtree: true });
    const copy = [...document.querySelectorAll("button")].find((button) => button.textContent === "Copy");
    if (!copy) { observer.disconnect(); reject(new Error("Copy control missing")); }
    else copy.click();
  }));
  expect(publication).toBeLessThan(100);
  const after = await page.getByRole("button", { name: "Copy", exact: true }).boundingBox();
  expect(after?.x).toBe(buttons?.x);
  expect(after?.y).toBe(buttons?.y);
  await expect(editor).toHaveValue(url);
  await expect(page.getByLabel("Key, Query Parameter 260 of 260")).toBeAttached();
  await page.getByRole("button", { name: "Copy", exact: true }).dispatchEvent("click");
  await page.getByRole("button", { name: "Copy", exact: true }).dispatchEvent("click");
  await page.getByRole("button", { name: "Copy", exact: true }).dispatchEvent("click");
  await page.getByRole("button", { name: "Copy", exact: true }).dispatchEvent("click");
  await expect(page.getByRole("list", { name: "Feedback history" }).getByRole("listitem")).toHaveCount(5);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.evaluate(() => {
    const sheet = document.styleSheets[0]!;
    sheet.insertRule("* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }", sheet.cssRules.length);
    sheet.insertRule("p { margin-bottom: 2em !important; }", sheet.cssRules.length);
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => (window as unknown as { __feedbackSinks: string[] }).__feedbackSinks)).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie, location.search])).toEqual([0, 0, "", ""]);
  expect(requests).toEqual([]);
  expect(diagnostics).toEqual([]);
  await page.reload();
  await expect(editor).toHaveValue("");
  await expect(page.getByRole("list", { name: "Feedback history" })).toHaveCount(0);
});

test("Story 3.3 Copy exact Current and Last Valid preserves pointer editing and keyboard action order", async ({ page, browser }) => {
  await installCopyProbe(page);
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  const copy = page.getByRole("button", { name: "Copy", exact: true });
  await expect(copy).toHaveAttribute("aria-disabled", "true");
  await copy.focus();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => window.__copyProbe.writes)).toEqual([]);
  await editor.fill(semanticFixture);
  await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 8, "backward"));
  await copy.dispatchEvent("pointerdown");
  await copy.dispatchEvent("pointercancel");
  expect(await page.evaluate(() => window.__copyProbe.writes)).toEqual([]);
  await copy.click();
  await expect(page.getByText("Current URL copied.", { exact: true })).toBeVisible();
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((input: HTMLTextAreaElement) =>
    [input.selectionStart, input.selectionEnd, input.selectionDirection])).toEqual([2, 8, "backward"]);
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveAttribute("aria-disabled", "true");
  const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")));
  await page.getByLabel("Search Managed Pieces").fill("dup");
  await editor.fill("https://");
  await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 5, "backward"));
  const validation = await page.locator("#error-full-url").textContent();
  await copy.click();
  await expect(page.getByText("Last Valid URL copied; Draft URL is unchanged.", { exact: true })).toBeVisible();
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((input: HTMLTextAreaElement) =>
    [input.selectionStart, input.selectionEnd, input.selectionDirection])).toEqual([2, 5, "backward"]);
  await expect(page.locator("#error-full-url")).toHaveText(validation!);
  await expect(page.getByLabel("Search Managed Pieces")).toHaveValue("dup");
  await page.getByLabel("Search Managed Pieces").fill("");
  expect(await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")))).toEqual(ids);
  await page.getByRole("button", { name: "Undo", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(copy).toBeFocused();
  await page.keyboard.press("Space");
  await expect(copy).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => window.__copyProbe.writes.length)).toBe(4);
  expect(await page.evaluate(() => window.__copyProbe.writes)).toEqual(Array(4).fill(semanticFixture));
  const touchContext = await browser.newContext({ hasTouch: true, viewport: { width: 320, height: 720 } });
  try {
    const touchPage = await touchContext.newPage();
    await installCopyProbe(touchPage);
    await touchPage.goto("/");
    const touchEditor = touchPage.getByLabel("Complete HTTP or HTTPS Absolute URL");
    await touchEditor.fill(semanticFixture);
    await touchPage.getByRole("button", { name: "Copy", exact: true }).tap();
    await expect(touchPage.getByText("Current URL copied.", { exact: true })).toBeVisible();
    await expect(touchEditor).toBeFocused();
    expect(await touchPage.evaluate(() => window.__copyProbe.writes)).toEqual([semanticFixture]);
  } finally {
    await touchContext.close();
  }
});

test("Story 3.3 Copy serial races supersede queued attempts and stale completions before Undo focus", async ({ page }) => {
  await installCopyProbe(page);
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  const copy = page.getByRole("button", { name: "Copy", exact: true });
  await editor.fill("https://example.com/a?x=1");
  await page.evaluate(() => { window.__copyProbe.mode = "pending"; });
  await copy.click();
  await copy.click();
  await page.locator("#add-query-before").click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await copy.click();
  expect(await page.evaluate(() => window.__copyProbe.writes)).toEqual(["https://example.com/a?x=1"]);
  await page.evaluate(() => window.__copyProbe.pending.shift()!.resolve());
  await expect.poll(() => page.evaluate(() => window.__copyProbe.writes.length)).toBe(2);
  await expect(page.getByText("Current URL copied.", { exact: true })).toHaveCount(0);
  await page.evaluate(() => { window.__copyProbe.mode = "success"; window.__copyProbe.pending.shift()!.resolve(); });
  await expect(page.getByText("Current URL copied.", { exact: true })).toBeVisible({ timeout: 7_000 });
  await expect(editor).toHaveValue("https://example.com/a?x=1");
  await copy.click();
  await expect.poll(() => page.evaluate(() => window.__copyProbe.writes.length)).toBe(3);
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveAttribute("aria-disabled", "true");
});

test("Story 3.4 failure matrix selects exact Last Valid recovery and retry preserves native focus", async ({ page }) => {
  await installCopyProbe(page);
  for (const mode of ["unavailable", "throw", "reject", "pending"]) {
    await page.goto("/");
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    const copy = page.getByRole("button", { name: "Copy", exact: true });
    await editor.fill("https://example.com/a");
    await editor.fill("https://");
    await page.evaluate((mode) => { window.__copyProbe.mode = mode; }, mode);
    await copy.click();
    await expect(page.getByRole("alert")).toContainText("Couldn’t copy the Last Valid URL.");
    const recovery = page.getByLabel("Last Valid URL — copy recovery", { exact: true });
    await expect(recovery).toHaveValue("https://example.com/a");
    await expect(recovery).toBeFocused();
    await expect(recovery).toHaveAttribute("readonly", "");
    expect(await recovery.evaluate((input: HTMLTextAreaElement) =>
      [input.selectionStart, input.selectionEnd])).toEqual([0, "https://example.com/a".length]);
    await expect(page.locator("#error-full-url")).toBeVisible();
    const search = page.getByLabel("Search Managed Pieces");
    await search.focus();
    await page.evaluate(() => { window.__copyProbe.mode = "success"; });
    await copy.click();
    if (mode === "pending") {
      await expect(page.getByRole("alert")).toContainText("pending clipboard write");
      expect(await page.evaluate(() => window.__copyProbe.writes.length)).toBe(1);
      await page.evaluate(() => window.__copyProbe.pending.shift()!.resolve());
      await expect(page.getByText(/URL copied/)).toHaveCount(0);
      await expect(page.getByRole("alert")).toContainText("pending clipboard write");
      await search.focus();
      await copy.click();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.getByText("Last Valid URL copied; Draft URL is unchanged.", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => window.__copyProbe.writes.length)).toBe(2);
    } else {
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.getByText("Last Valid URL copied; Draft URL is unchanged.", { exact: true })).toBeVisible();
    }
    await expect(search).toBeFocused();
    await expect(recovery).toHaveCount(0);
  }
});

test("Story 3.4 Current recovery retains native selection across Search and clears on mutation retry reload", async ({ page }) => {
  await installCopyProbe(page);
  for (const mode of ["unavailable", "throw", "reject"]) {
    await page.goto("/");
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    const copy = page.getByRole("button", { name: "Copy", exact: true });
    await editor.fill(semanticFixture);
    const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")));
    await page.evaluate((mode) => { window.__copyProbe.mode = mode; }, mode);
    if (mode === "reject") await copy.click();
    else {
      await copy.focus();
      await page.keyboard.press(mode === "unavailable" ? "Enter" : "Space");
    }
    const recovery = page.getByLabel("Current URL — copy recovery", { exact: true });
    await expect(recovery).toHaveValue(semanticFixture);
    await expect(recovery).toBeFocused();
    expect(await recovery.evaluate((input: HTMLTextAreaElement) =>
      [input.selectionStart, input.selectionEnd])).toEqual([0, semanticFixture.length]);
    await expect(recovery).toHaveAttribute("aria-describedby", "copy-recovery-help");
    await expect(page.locator("#copy-recovery-help")).toContainText("Ctrl+C");
    await expect(page.locator("#copy-recovery-help")).toContainText("Command+C");
    await expect(page.locator("#copy-recovery-help")).toContainText("native Copy menu");
    const writes = await page.evaluate(() => window.__copyProbe.writes.length);
    await page.keyboard.press("Control+c");
    expect(await page.evaluate(() => window.__copyProbe.writes.length)).toBe(writes);
    await expect(page.getByText("Current URL copied.", { exact: true })).toHaveCount(0);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
    await expect(recovery).not.toBeFocused();
    await page.getByLabel("Search Managed Pieces").fill("dup");
    await expect(recovery).toHaveValue(semanticFixture);
    await page.getByLabel("Search Managed Pieces").fill("");
    expect(await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")))).toEqual(ids);
    await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveAttribute("aria-disabled", "true");
    await recovery.focus();
    await page.evaluate(() => { window.__copyProbe.mode = "success"; });
    await copy.click();
    await expect(copy).toBeFocused();
    await expect(recovery).toHaveCount(0);
    await page.evaluate((mode) => { window.__copyProbe.mode = mode; }, mode);
    await editor.fill("https://");
    await expect(recovery).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 5, "backward"));
    const validation = await page.locator("#error-full-url").textContent();
    await copy.click();
    const lastValid = page.getByLabel("Last Valid URL — copy recovery", { exact: true });
    await expect(lastValid).toHaveValue(semanticFixture);
    await expect(lastValid).toBeFocused();
    expect(await editor.evaluate((input: HTMLTextAreaElement) =>
      [input.selectionStart, input.selectionEnd, input.selectionDirection])).toEqual([2, 5, "backward"]);
    await expect(page.locator("#error-full-url")).toHaveText(validation!);
    await page.evaluate(() => { window.__copyProbe.mode = "pending"; });
    await copy.click();
    await expect(lastValid).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("#copy-recovery")).toHaveCount(0);
    await expect(editor).toHaveValue("");
    await expect(copy).toHaveAttribute("aria-disabled", "true");
  }
});

test("Story 3.4 timeout fence exposes newest exact recovery and late resolve reject cannot focus or succeed", async ({ page }) => {
  await installCopyProbe(page);
  for (const outcome of ["resolve", "reject"] as const) {
    await page.goto("/");
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    const copy = page.getByRole("button", { name: "Copy", exact: true });
    await editor.fill(semanticFixture);
    await page.evaluate(() => { window.__copyProbe.mode = "pending"; });
    await copy.click();
    await expect(page.getByLabel("Current URL — copy recovery", { exact: true })).toHaveValue(semanticFixture);
    await expect(page.locator("#copy-recovery")).toBeFocused();
    await editor.fill("https://EXAMPLE.com/new?flag&empty=");
    await expect(page.locator("#copy-recovery")).toHaveCount(0);
    await editor.fill("https://");
    await copy.click();
    const recovery = page.getByLabel("Last Valid URL — copy recovery", { exact: true });
    await expect(recovery).toHaveValue("https://EXAMPLE.com/new?flag&empty=");
    await expect(recovery).toBeFocused();
    expect(await page.evaluate(() => window.__copyProbe.writes)).toEqual([semanticFixture]);
    const attemptId = await recovery.getAttribute("data-attempt-id");
    const search = page.getByLabel("Search Managed Pieces");
    await search.fill("flag");
    await page.evaluate((outcome) => { window.__copyProbe.pending.shift()![outcome](); }, outcome);
    await expect(search).toBeFocused();
    await expect(recovery).toHaveAttribute("data-attempt-id", attemptId!);
    await expect(recovery).toHaveValue("https://EXAMPLE.com/new?flag&empty=");
    await expect(page.getByRole("alert")).toContainText("pending clipboard write");
    await expect(page.getByRole("alert")).toContainText("may overwrite text you copy manually");
    await expect(page.getByText(/URL copied/)).toHaveCount(0);
    await page.evaluate(() => { window.__copyProbe.mode = "success"; });
    await copy.click();
    await expect(recovery).toHaveCount(0);
    await expect(page.getByText("Last Valid URL copied; Draft URL is unchanged.", { exact: true })).toBeVisible();
    await expect(search).toBeFocused();
    expect(await page.evaluate(() => window.__copyProbe.writes)).toEqual([semanticFixture, "https://EXAMPLE.com/new?flag&empty="]);
  }
});

test("Story 3.4 interrupted failures retain manual recovery without stealing focus and obsolete writes stay silent", async ({ page }) => {
  await installCopyProbe(page);
  for (const interaction of ["pointer", "outside", "keyboard", "focus", "composition", "mutation", "newer-copy", "undo"]) {
    await page.goto("/");
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    const copy = page.getByRole("button", { name: "Copy", exact: true });
    await editor.fill("https://example.com/a?x=1");
    await page.getByLabel("Value, Query Parameter 1 of 1").fill("2");
    await editor.focus();
    await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 8, "backward"));
    await page.evaluate(() => { window.__copyProbe.mode = "pending"; });
    await copy.click();
    if (interaction === "pointer") await editor.dispatchEvent("pointerdown");
    else if (interaction === "outside") await page.locator("body").dispatchEvent("pointerdown");
    else if (interaction === "keyboard") await page.keyboard.press("ArrowLeft");
    else if (interaction === "focus") await page.getByLabel("Search Managed Pieces").focus();
    else if (interaction === "composition") await editor.dispatchEvent("compositionstart");
    else if (interaction === "mutation") await editor.fill("https://");
    else if (interaction === "undo") await page.getByRole("button", { name: "Undo", exact: true }).click();
    else await copy.click();
    const focusId = await page.evaluate(() => document.activeElement?.id);
    await page.evaluate(() => { window.__copyProbe.mode = "success"; window.__copyProbe.pending.shift()!.reject(); });
    if (["pointer", "outside", "keyboard", "focus", "composition"].includes(interaction)) {
      await expect(page.locator("#copy-recovery")).toHaveValue("https://example.com/a?x=2");
      expect(await page.evaluate(() => document.activeElement?.id)).toBe(focusId);
    } else {
      await expect(page.locator("#copy-recovery")).toHaveCount(0);
      await expect(page.getByRole("alert")).toHaveCount(0);
      if (interaction === "newer-copy") {
        await expect(page.getByText("Current URL copied.", { exact: true })).toBeVisible();
        expect(await page.evaluate(() => window.__copyProbe.writes.length)).toBe(2);
      } else {
        await expect(page.getByText(/URL copied/)).toHaveCount(0);
      }
    }
    if (interaction === "composition") await editor.dispatchEvent("compositionend");
  }
});

test("Story 3.4 dense recovery publishes and selects privately below 100 ms with accessible 320px complete rendering", async ({ page }) => {
  await installCopyProbe(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.addInitScript(() => {
    const sinks: string[] = [];
    Object.defineProperty(window, "__recoverySinks", { value: sinks });
    Storage.prototype.setItem = () => { sinks.push("storage"); };
    window.indexedDB.open = () => { sinks.push("indexeddb"); throw new Error("unexpected sink"); };
    window.caches.open = async () => { sinks.push("cache"); throw new Error("unexpected sink"); };
    navigator.serviceWorker.register = async () => { sinks.push("service-worker"); throw new Error("unexpected sink"); };
    navigator.sendBeacon = () => { sinks.push("beacon"); return false; };
    window.fetch = async () => { sinks.push("fetch"); throw new Error("unexpected sink"); };
  });
  await page.goto("/");
  const requests: string[] = [], diagnostics: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => diagnostics.push(message.text()));
  page.on("pageerror", (error) => diagnostics.push(error.message));
  const url = createCapacityFixture();
  expect(url.length).toBe(20_000);
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await editor.fill(url);
  const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")));
  await page.evaluate(() => { window.__copyProbe.mode = "pending"; });
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  const settleToSelectedRecovery = () => page.evaluate(() => new Promise<number>((resolve, reject) => {
    const start = performance.now();
    const check = () => {
      const recovery = document.getElementById("copy-recovery") as HTMLTextAreaElement | null;
      if (recovery && document.activeElement === recovery &&
        recovery.selectionStart === 0 && recovery.selectionEnd === recovery.value.length) {
        resolve(performance.now() - start);
      } else if (performance.now() - start > 1_000) reject(new Error("Recovery render/focus deadline"));
      else requestAnimationFrame(check);
    };
    window.__copyProbe.pending.shift()!.reject();
    requestAnimationFrame(check);
  }));
  expect(await settleToSelectedRecovery()).toBeLessThan(100);
  const recovery = page.getByLabel("Current URL — copy recovery", { exact: true });
  await expect(recovery).toHaveValue(url);
  await expect(recovery).toBeFocused();
  expect(await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")))).toEqual(ids);
  await expect(page.getByLabel("Key, Query Parameter 260 of 260")).toBeAttached();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveAttribute("aria-disabled", "true");
  await recovery.scrollIntoViewIfNeeded();
  await expect(page.locator("#copy-recovery-help")).toBeVisible();
  await expect(page.getByText("Current URL — copy recovery", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.emulateMedia({ forcedColors: "active" });
  expect(await recovery.evaluate((element) => getComputedStyle(element).borderTopColor)).not.toBe("rgba(0, 0, 0, 0)");
  const outline = await recovery.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth), color: style.outlineColor };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);
  expect(outline.color).not.toBe("rgba(0, 0, 0, 0)");
  expect(await recovery.evaluate((input: HTMLTextAreaElement) =>
    [input.selectionStart, input.selectionEnd])).toEqual([0, url.length]);
  await page.evaluate(() => {
    const sheet = document.styleSheets[0]!;
    sheet.insertRule("* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }", sheet.cssRules.length);
    sheet.insertRule("p { margin-bottom: 2em !important; }", sheet.cssRules.length);
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await editor.fill("https://");
  await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 5, "backward"));
  const validation = await page.locator("#error-full-url").textContent();
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  expect(await settleToSelectedRecovery()).toBeLessThan(100);
  const lastValid = page.getByLabel("Last Valid URL — copy recovery", { exact: true });
  await expect(lastValid).toHaveValue(url);
  await expect(lastValid).toBeFocused();
  expect(await lastValid.evaluate((input: HTMLTextAreaElement) =>
    [input.selectionStart, input.selectionEnd])).toEqual([0, url.length]);
  expect(await editor.evaluate((input: HTMLTextAreaElement) =>
    [input.selectionStart, input.selectionEnd, input.selectionDirection])).toEqual([2, 5, "backward"]);
  await expect(editor).toHaveValue("https://");
  await expect(page.locator("#error-full-url")).toHaveText(validation!);
  expect(await page.locator("#managed-pieces > li").evaluateAll((rows) =>
    rows.map((row) => row.getAttribute("data-piece-id")))).toEqual(ids);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => (window as unknown as { __recoverySinks: string[] }).__recoverySinks)).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie, location.search])).toEqual([0, 0, "", ""]);
  expect(requests).toEqual([]);
  expect(diagnostics).toEqual([]);
});

test("Story 3.3 dense Copy edit Undo exact writes private complete rows below 100 ms at 320px", async ({ page }) => {
  await installCopyProbe(page);
  await page.addInitScript(() => {
    const sinks: string[] = [];
    Object.defineProperty(window, "__copySinks", { value: sinks });
    Storage.prototype.setItem = () => { sinks.push("storage"); };
    window.indexedDB.open = () => { sinks.push("indexeddb"); throw new Error("unexpected sink"); };
    window.caches.open = async () => { sinks.push("cache"); throw new Error("unexpected sink"); };
    navigator.serviceWorker.register = async () => { sinks.push("service-worker"); throw new Error("unexpected sink"); };
    navigator.sendBeacon = () => { sinks.push("beacon"); return false; };
    window.fetch = async () => { sinks.push("fetch"); throw new Error("unexpected sink"); };
  });
  await page.goto("/");
  const requests: string[] = [], diagnostics: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => diagnostics.push(message.text()));
  page.on("pageerror", (error) => diagnostics.push(error.message));
  const url = createCapacityFixture();
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await editor.fill(url);
  const copy = page.getByRole("button", { name: "Copy", exact: true });
  const activate = async (message = "Current URL copied.") => {
    const elapsed = await copy.evaluate((button: HTMLButtonElement) => {
      const start = performance.now(); button.click(); return performance.now() - start;
    });
    expect(elapsed).toBeLessThan(100);
    await expect(page.getByText(message, { exact: true }).first()).toBeVisible({ timeout: 7_000 });
  };
  const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")));
  const originalLastValue = await page.getByLabel("Value, Query Parameter 260 of 260").inputValue();
  await activate();
  await page.getByLabel("Value, Query Parameter 260 of 260").fill("changed");
  const changed = await editor.inputValue();
  await activate();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await activate();
  expect(await page.evaluate(() => window.__copyProbe.writes)).toEqual([url, changed, url]);
  expect(await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")))).toEqual(ids);
  await expect(page.getByLabel("Value, Query Parameter 260 of 260")).toHaveValue(originalLastValue);
  await editor.fill("https://");
  await activate("Last Valid URL copied; Draft URL is unchanged.");
  expect(await page.evaluate(() => window.__copyProbe.writes)).toEqual([url, changed, url, url]);
  expect(await page.locator("#managed-pieces > li").count()).toBe(ids.length);
  await page.setViewportSize({ width: 320, height: 720 });
  await expect(copy).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => (window as unknown as { __copySinks: string[] }).__copySinks)).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie, location.search])).toEqual([0, 0, "", ""]);
  expect(requests).toEqual([]);
  expect(diagnostics).toEqual([]);
});

test("Story 3.2 both Undo paths restore every operation-specific focus without new history", async ({ page }) => {
  for (const path of ["visible", "shortcut"]) {
    for (const kind of undoFocusKinds) {
      await page.goto("/");
      const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
      const undo = page.getByRole("button", { name: "Undo", exact: true });
      await editor.fill(undoFocusFixture);
      await undo.focus();
      const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) =>
        rows.map((row) => row.getAttribute("data-piece-id")!));
      const [domain, segment, first, second] = ids;
      let destination = "";
      if (kind === "domain-unicode" || kind === "domain-ascii") {
        destination = `${kind === "domain-unicode" ? "unicode" : "ascii"}-${domain}`;
        await page.locator(`#${destination}`).fill("example.org");
      } else if (kind === "path" || kind === "query-key" || kind === "query-value") {
        destination = `${kind}-${kind === "path" ? segment : first}`;
        await page.locator(`#${destination}`).fill("changed");
      } else if (kind === "add") {
        await page.locator("#add-query-before").click();
        destination = `query-key-${second}`;
      } else if (kind === "remove-path" || kind === "remove-query") {
        destination = `remove-${kind === "remove-path" ? segment : first}`;
        await page.locator(`#${destination}`).click();
      } else if (kind === "move-up" || kind === "move-down") {
        const id = kind === "move-up" ? second : first;
        destination = `${kind}-${id}`;
        await page.locator(`#${destination}`).click();
      } else {
        await editor.fill(undoFocusFixture.replace("/a?", "/changed?"));
        destination = "full-url-editor";
      }
      if (path === "visible") await undo.click();
      else {
        await undo.focus();
        await page.keyboard.press("Control+z");
      }
      await expect(editor).toHaveValue(undoFocusFixture);
      await expect(page.locator(`#${destination}`)).toBeFocused();
      await expect(undo).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByText(/Undid: /)).toHaveCount(1);
      expect(await page.locator("#managed-pieces > li").evaluateAll((rows) =>
        rows.map((row) => row.getAttribute("data-piece-id")))).toEqual(ids);
    }
  }
});

test("Story 3.2 routing leaves native ownership excluded chords and composition untouched", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  const undo = page.getByRole("button", { name: "Undo", exact: true });
  await editor.fill(undoFocusFixture);
  await page.locator("#add-query-before").click();
  const changed = await editor.inputValue();
  await undo.focus();
  const excluded = await undo.evaluate((button) => [
    { key: "Z", ctrlKey: true }, { key: "z", ctrlKey: true, shiftKey: true },
    { key: "z", ctrlKey: true, altKey: true }, { key: "z", metaKey: true },
    { key: "z", ctrlKey: true, isComposing: true }, { key: "z" },
  ].map((init) => {
    const event = new KeyboardEvent("keydown", { ...init, bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    return event.defaultPrevented;
  }));
  expect(excluded).toEqual([false, false, false, false, false, false]);
  for (const label of ["Complete HTTP or HTTPS Absolute URL", "Unicode Domain", "Key, Query Parameter 1 of 3", "Search Managed Pieces"]) {
    const field = page.getByLabel(label);
    await field.focus();
    expect(await field.evaluate((input) => input.dispatchEvent(new KeyboardEvent("keydown", {
      key: "z", ctrlKey: true, bubbles: true, cancelable: true,
    })))).toBe(true);
  }
  await expect(editor).toHaveValue(changed);
  await undo.focus();
  expect(await page.evaluate(() => {
    const host = document.createElement("div");
    host.contentEditable = "true";
    host.innerHTML = '<span>editable</span><span contenteditable="false"><b>island</b></span>';
    document.body.append(host);
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent === "Undo")!;
    const selection = document.getSelection()!;
    const protectedEvents: boolean[] = [];
    const dispatch = (target: Element) => {
      const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      protectedEvents.push(event.defaultPrevented);
    };
    dispatch(host.firstElementChild!);
    selection.setBaseAndExtent(host.firstElementChild!.firstChild!, 0, button.firstChild!, 1);
    dispatch(button);
    selection.setBaseAndExtent(button.firstChild!, 0, host.firstElementChild!.firstChild!, 1);
    dispatch(button);
    selection.removeAllRanges();
    host.remove();
    return protectedEvents;
  })).toEqual([false, false, false]);
  const search = page.getByLabel("Search Managed Pieces");
  await search.dispatchEvent("compositionstart");
  await undo.focus();
  expect(await undo.evaluate((button: HTMLButtonElement) => {
    const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    button.click();
    return event.defaultPrevented;
  })).toBe(false);
  await expect(editor).toHaveValue(changed);
  await search.dispatchEvent("compositionend");
  await page.keyboard.press("Control+z");
  await expect(editor).toHaveValue(undoFocusFixture);
  await expect(page.getByLabel("Key, Query Parameter 2 of 2")).toBeFocused();
});

test("Story 3.2 filtering retains Search invalid Draft backward selection and validation on both paths", async ({ page }) => {
  for (const path of ["visible", "shortcut"]) {
    for (const searchTerm of ["y", "faß", "no-matches"]) {
      await page.goto("/");
      const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
      const undo = page.getByRole("button", { name: "Undo", exact: true });
      await editor.fill(undoFocusFixture);
      await page.getByRole("button", { name: /Remove Query Parameter at position 1 of 2/ }).click();
      await editor.fill("https://");
      await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 5, "backward"));
      const error = await page.locator("#error-full-url").textContent();
      const search = page.getByLabel("Search Managed Pieces");
      await search.fill(searchTerm);
      if (path === "visible") await undo.click();
      else { await undo.focus(); await page.keyboard.press("Control+z"); }
      const destination = searchTerm === "y" ? page.getByLabel("Key, Query Parameter 2 of 2")
        : searchTerm === "faß" ? page.getByLabel("Unicode Domain") : editor;
      await expect(destination).toBeFocused();
      await expect(search).toHaveValue(searchTerm);
      await expect(editor).toHaveValue("https://");
      expect(await editor.evaluate((input: HTMLTextAreaElement) =>
        [input.selectionStart, input.selectionEnd, input.selectionDirection])).toEqual([2, 5, "backward"]);
      expect(await page.locator("#error-full-url").textContent()).toBe(error);
      await expect(page.getByText(/Restored target is hidden by Search/)).toBeVisible();
      await expect(page.getByText(/Draft URL is unchanged/)).toBeVisible();
    }
    for (const searchTerm of ["x", "no-matches"]) {
      await page.goto("/");
      const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
      const undo = page.getByRole("button", { name: "Undo", exact: true });
      await editor.fill(undoFocusFixture);
      await page.locator("#add-query-before").click();
      await editor.fill("https://");
      await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 5, "backward"));
      const error = await page.locator("#error-full-url").textContent();
      const search = page.getByLabel("Search Managed Pieces");
      await search.fill(searchTerm);
      if (path === "visible") await undo.click();
      else { await undo.focus(); await page.keyboard.press("Control+z"); }
      const destination = searchTerm === "x" ? page.getByLabel("Key, Query Parameter 1 of 2") : editor;
      await expect(destination).toBeFocused();
      await expect(search).toHaveValue(searchTerm);
      await expect(editor).toHaveValue("https://");
      expect(await editor.evaluate((input: HTMLTextAreaElement) =>
        [input.selectionStart, input.selectionEnd, input.selectionDirection])).toEqual([2, 5, "backward"]);
      expect(await page.locator("#error-full-url").textContent()).toBe(error);
      await expect(page.getByText(/Undid: Query Parameter addition.*Draft URL is unchanged/)).toBeVisible();
      await expect(page.getByText(/Restored target is hidden by Search/)).toBeVisible();
      await expect(undo).toHaveAttribute("aria-disabled", "true");
    }
  }
});

test("Story 3.2 shortcut dense Undo focuses privately below 100 ms with all 260 entries", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "__focusSinks", { value: [] });
    const sinks = (window as unknown as { __focusSinks: string[] }).__focusSinks;
    Storage.prototype.setItem = () => { sinks.push("storage"); };
    IDBFactory.prototype.open = () => { sinks.push("indexedDB"); throw new Error("unexpected sink"); };
    CacheStorage.prototype.open = async () => { sinks.push("cache"); throw new Error("unexpected sink"); };
    Navigator.prototype.sendBeacon = () => { sinks.push("beacon"); return false; };
    window.fetch = async () => { sinks.push("fetch"); throw new Error("unexpected sink"); };
  });
  await page.goto("/");
  const requests: string[] = [];
  const diagnostics: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => diagnostics.push(message.text()));
  page.on("pageerror", (error) => diagnostics.push(error.message));
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  const url = createCapacityFixture();
  await editor.fill(url);
  const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) =>
    rows.map((row) => row.getAttribute("data-piece-id")));
  const remove = page.getByRole("button", { name: /Remove Query Parameter at position 260 of 260/ });
  const removedId = await remove.getAttribute("id");
  await remove.click();
  const undo = page.getByRole("button", { name: "Undo", exact: true });
  await undo.focus();
  const elapsed = await undo.evaluate((button) => {
    const start = performance.now();
    button.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true }));
    return performance.now() - start;
  });
  expect(elapsed).toBeLessThan(100);
  await expect(editor).toHaveValue(url);
  await expect(page.locator(`#${removedId}`)).toBeFocused();
  expect(await page.locator("#managed-pieces > li").evaluateAll((rows) =>
    rows.map((row) => row.getAttribute("data-piece-id")))).toEqual(ids);
  expect(await page.evaluate(() => (window as unknown as { __focusSinks: string[] }).__focusSinks)).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie, location.search])).toEqual([0, 0, "", ""]);
  expect(requests).toEqual([]);
  expect(diagnostics).toEqual([]);
});

test("Story 3.1 Undo remains inactive during native composition in every URL editor", async ({ page }) => {
  for (const field of ["ASCII/Punycode Domain", "Value, Query Parameter 1 of 1", "Complete HTTP or HTTPS Absolute URL"]) {
    await page.goto("/");
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    const undo = page.getByRole("button", { name: "Undo", exact: true });
    await editor.fill("https://example.com/a?x=1");
    await page.getByLabel("ASCII/Punycode Domain").fill("example.org");
    const composing = page.getByLabel(field);
    await composing.focus();
    const next = field === "ASCII/Punycode Domain" ? "example.net"
      : field === "Value, Query Parameter 1 of 1" ? "new" : "https://";
    await composing.evaluate((input: HTMLInputElement | HTMLTextAreaElement, value) => {
      const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true, inputType: "insertCompositionText" }));
    }, next);
    await expect(undo).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByText("Undo inactive: finish text composition first.")).toBeVisible();
    await undo.evaluate((button: HTMLButtonElement) => button.click());
    await expect(composing).toHaveValue(next);
    await expect(page.getByText(/Undid: /)).toHaveCount(0);
    await composing.evaluate((input, value) => {
      input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: value }));
    }, next);
    await expect(undo).toHaveAttribute("aria-disabled", "false");
    await undo.click();
    await expect(editor).toHaveValue(field === "Complete HTTP or HTTPS Absolute URL" ? "https://" : "https://example.org/a?x=1");
  }
});

test("Story 3.1 visible Undo restores every committed mutation exactly and branches with fresh IDs", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  const undo = page.getByRole("button", { name: "Undo", exact: true });
  const initial = "https://xn--fa-hia.de/a%2fb//?dup=1&dup=2&flag&empty=#Frag%2f";
  await editor.fill(initial);
  await expect(undo).toHaveAttribute("aria-disabled", "true");
  const capture = async () => ({
    url: await editor.inputValue(),
    rows: await page.locator("#managed-pieces > li").evaluateAll((rows) =>
      rows.map((row) => ({
        id: row.getAttribute("data-piece-id"),
        values: [...row.querySelectorAll("input")].map((input) => input.value),
      }))),
  });
  const snapshots = [await capture()];
  const operations = [
    async () => { await page.getByLabel("Path Segment 1 of 3").fill("edited%2F"); },
    async () => { await page.getByLabel("Key, Query Parameter 1 of 4").fill("new"); },
    async () => { await page.getByLabel("Value, Query Parameter 1 of 4").fill("value"); },
    async () => { await page.getByLabel("Unicode Domain").fill("例え.jp"); },
    async () => { await page.getByLabel("ASCII/Punycode Domain").fill("example.org"); },
    async () => { await page.locator("#add-query-before").click(); },
    async () => { await page.getByRole("button", { name: /Move Query Parameter at position 2 of 5 up/ }).click(); },
    async () => { await page.getByRole("button", { name: /Remove Query Parameter at position 2 of 5/ }).click(); },
    async () => { await page.getByRole("button", { name: /Remove Path Segment at position 1 of 3/ }).click(); },
    async () => {
      const url = await editor.inputValue();
      await editor.fill(url.replace("example.org", "example.net"));
      await editor.fill(url.replace("example.org", "example.com"));
    },
  ];
  for (const operation of operations) {
    await operation();
    snapshots.push(await capture());
  }
  for (const expected of snapshots.slice(0, -1).reverse()) {
    await undo.click();
    await expect(editor).toHaveValue(expected.url);
    expect(await capture()).toEqual(expected);
  }
  await expect(undo).toHaveAttribute("aria-disabled", "true");
  await undo.focus();
  await page.keyboard.press("Enter");
  await expect(undo).toBeFocused();
  await expect(editor).toHaveValue(initial);
  await page.locator("#add-query-before").click();
  const firstAdded = (await capture()).rows.at(-1)!.id;
  await undo.click();
  await page.locator("#add-query-before").click();
  expect((await capture()).rows.at(-1)!.id).not.toBe(firstAdded);
  await undo.click();
  await expect(editor).toHaveValue(initial);
  await expect(undo).toHaveAttribute("aria-disabled", "true");
});

test("Story 3.1 Undo preserves invalid Draft selection errors Search and accessible cancellation", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  const undo = page.getByRole("button", { name: "Undo", exact: true });
  await editor.fill("https://example.com/a?x=1&y=2");
  await editor.fill("https://example.com/b?x=1&y=2");
  await editor.fill("https://");
  const error = await page.locator("#error-full-url").textContent();
  await page.getByLabel("Search Managed Pieces").fill("a");
  await editor.focus();
  await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 5, "backward"));
  await undo.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "mouse" });
  await undo.dispatchEvent("pointercancel", { pointerId: 1, pointerType: "mouse" });
  await expect(page.getByLabel("Path Segment 1 of 1")).toHaveCount(0);
  await expect(editor).toHaveValue("https://");
  await undo.click();
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue("https://");
  expect(await editor.evaluate((input: HTMLTextAreaElement) =>
    [input.selectionStart, input.selectionEnd, input.selectionDirection])).toEqual([2, 5, "backward"]);
  expect(await page.locator("#error-full-url").textContent()).toBe(error);
  await expect(page.getByLabel("Search Managed Pieces")).toHaveValue("a");
  await expect(page.getByLabel("Path Segment 1 of 1")).toHaveValue("a");
  await expect(page.getByText(/Undid: Full URL edit.*Draft URL is unchanged/)).toBeVisible();
  await expect(undo).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "Clear Search" }).click();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(4);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ forcedColors: "active" });
  await expect(undo).toBeVisible();
  await undo.focus();
  await page.keyboard.press("Enter");
  await expect(undo).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Story 3.1 Undo restores capacity privately under 100 ms with complete rows", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "__undoSinks", { value: [] });
    const sinks = (window as unknown as { __undoSinks: string[] }).__undoSinks;
    Storage.prototype.setItem = () => { sinks.push("storage"); };
    IDBFactory.prototype.open = () => { sinks.push("indexedDB"); throw new Error("unexpected sink"); };
    CacheStorage.prototype.open = async () => { sinks.push("cache"); throw new Error("unexpected sink"); };
    Navigator.prototype.sendBeacon = () => { sinks.push("beacon"); return false; };
    window.fetch = async () => { sinks.push("fetch"); throw new Error("unexpected sink"); };
  });
  await page.goto("/");
  const requests: string[] = [];
  const diagnostics: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => diagnostics.push(message.text()));
  page.on("pageerror", (error) => diagnostics.push(error.message));
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  const url = createCapacityFixture();
  await editor.fill(url);
  const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")));
  await page.getByRole("button", { name: /Remove Query Parameter at position 260 of 260/ }).click();
  const elapsed = await page.getByRole("button", { name: "Undo", exact: true }).evaluate((button: HTMLButtonElement) => {
    const start = performance.now();
    button.click();
    return performance.now() - start;
  });
  expect(elapsed).toBeLessThan(100);
  await expect(editor).toHaveValue(url);
  await expect(page.locator("#managed-pieces > li")).toHaveCount(ids.length);
  expect(await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")))).toEqual(ids);
  expect(await page.evaluate(() => (window as unknown as { __undoSinks: string[] }).__undoSinks)).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie, location.search])).toEqual([0, 0, "", ""]);
  expect(requests).toEqual([]);
  expect(diagnostics).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Token final beforeinput publishes composition once and preserves normalized prefix caret", async ({ page }) => {
  for (const inputType of ["insertFromComposition", "insertText"]) {
    for (const delayed of [false, true]) {
      await page.goto("/");
      const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
      await editor.fill("https://example.com/a?x=old");
      const value = page.getByLabel("Value, Query Parameter 1 of 1");
      await value.focus();
      const accepted = await value.evaluate(async (input: HTMLInputElement, options) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
        setter.call(input, "日old");
        input.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true, inputType: "insertCompositionText" }));
        input.setSelectionRange(1, 1);
        input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "日" }));
        if (options.delayed) await new Promise((done) => setTimeout(done, 0));
        const finalInput = new InputEvent("beforeinput", {
          bubbles: true, cancelable: true, data: "日", inputType: options.inputType,
        });
        // Chromium's constructor normalizes unsupported engine-specific input types.
        Object.defineProperty(finalInput, "inputType", { value: options.inputType });
        const accepted = input.dispatchEvent(finalInput);
        setter.call(input, "日old");
        input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: options.inputType }));
        return accepted;
      }, { inputType, delayed });
      expect(accepted).toBe(false);
      await expect(value).toHaveValue("%E6%97%A5old");
      await expect(editor).toHaveValue("https://example.com/a?x=%E6%97%A5old");
      expect(await value.evaluate((input: HTMLInputElement) => [input.selectionStart, input.selectionEnd])).toEqual([9, 9]);
      await value.press("x");
      await expect(value).toHaveValue("%E6%97%A5xold");
    }
  }
});

for (const timing of ["immediate", "delayed"]) {
  test(`Domain composition publishes once with ${timing} final input and preserves later edits and selection`, async ({ page }) => {
    await page.goto("/");
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    await editor.fill("https://example.com/a?dup=1&dup=2#Frag%2f");
    const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")));
    const domain = page.getByLabel("ASCII/Punycode Domain");
    await domain.focus();
    await domain.evaluate(async (element: HTMLInputElement, timing) => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      set.call(element, "EXAMPLE.ORG");
      element.setSelectionRange(7, 7);
      element.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true, inputType: "insertCompositionText" }));
      element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "EXAMPLE.ORG" }));
      if (timing === "delayed") await new Promise((done) => setTimeout(done, 0));
      set.call(element, "EXAMPLE.ORG");
      element.setSelectionRange(7, 7);
      element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertFromComposition", isComposing: false }));
    }, timing);
    await expect(domain).toHaveValue("example.org");
    await expect(editor).toHaveValue("https://example.org/a?dup=1&dup=2#Frag%2f");
    await expect(page.getByText(/Domain synchronized at revision 2/)).toBeVisible();
    await expect(domain).toBeFocused();
    expect(await domain.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual([7, 7]);
    await page.getByLabel("Unicode Domain").fill("example.net");
    await expect(editor).toHaveValue("https://example.net/a?dup=1&dup=2#Frag%2f");
    await expect(page.getByText(/Domain synchronized at revision 3/)).toBeVisible();
    await domain.fill("EXAMPLE.ORG");
    await expect(editor).toHaveValue("https://example.org/a?dup=1&dup=2#Frag%2f");
    await expect(page.getByText(/Domain synchronized at revision 4/)).toBeVisible();
    expect(await page.locator("#managed-pieces > li").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-piece-id")))).toEqual(ids);
    await domain.evaluate((element: HTMLInputElement) => {
      element.setSelectionRange(2, 5, "backward");
      element.dispatchEvent(new Event("select", { bubbles: true }));
    });
    await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
    expect(await domain.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd, element.selectionDirection])).toEqual([2, 5, "backward"]);
  });
  test(`Token composition retains Last Valid until end with ${timing} final input and later edits`, async ({ page }) => {
    await page.goto("/");
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    await editor.fill("https://example.com/a?x=old#Frag%2f");
    const value = page.getByLabel("Value, Query Parameter 1 of 1");
    await value.focus();
    const during = await value.evaluate(async (element: HTMLInputElement, timing) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      setter.call(element, "日本");
      element.setSelectionRange(2, 2);
      element.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true, inputType: "insertCompositionText" }));
      const during = document.querySelector<HTMLTextAreaElement>("#full-url-editor")!.value;
      element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "日本" }));
      if (timing === "delayed") await new Promise((done) => setTimeout(done, 0));
      setter.call(element, "日本");
      element.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: false, inputType: "insertFromComposition" }));
      return during;
    }, timing);
    expect(during).toBe("https://example.com/a?x=old#Frag%2f");
    await expect(value).toHaveValue("%E6%97%A5%E6%9C%AC");
    await expect(editor).toHaveValue("https://example.com/a?x=%E6%97%A5%E6%9C%AC#Frag%2f");
    await value.fill("later");
    await expect(value).toBeFocused();
    await expect(editor).toHaveValue("https://example.com/a?x=later#Frag%2f");
  });
}

declare global {
  interface Window {
    readonly __privacyProbe: PrivacyProbe;
  }
}

test("intake preserves lossless semantics and rejects replacement", async ({ page }) => {
  await page.addInitScript(() => {
    const probe = {
      storageWrites: [] as string[],
      indexedDbCalls: [] as string[],
      cacheCalls: [] as string[],
      serviceWorkerCalls: [] as string[],
      beaconCalls: [] as string[],
      fetchCalls: [] as string[],
    };
    Object.defineProperty(window, "__privacyProbe", { value: probe });

    const storageSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      probe.storageWrites.push(`${key}:${value}`);
      storageSetItem.call(this, key, value);
    };

    const indexedDbOpen = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (name, version) {
      probe.indexedDbCalls.push(String(name));
      return indexedDbOpen.call(this, name, version);
    };

    const cacheOpen = CacheStorage.prototype.open;
    CacheStorage.prototype.open = function (name) {
      probe.cacheCalls.push(name);
      return cacheOpen.call(this, name);
    };

    if ("serviceWorker" in navigator) {
      const serviceWorkerPrototype = Object.getPrototypeOf(navigator.serviceWorker);
      const register = serviceWorkerPrototype.register;
      serviceWorkerPrototype.register = function (scriptURL: string | URL) {
        probe.serviceWorkerCalls.push(String(scriptURL));
        return register.apply(this, arguments);
      };
    }

    const sendBeacon = Navigator.prototype.sendBeacon;
    Navigator.prototype.sendBeacon = function (url, data) {
      probe.beaconCalls.push(`${String(url)}:${String(data ?? "")}`);
      return sendBeacon.call(this, url, data);
    };

    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      probe.fetchCalls.push(
        `${url}:${String(init?.body ?? "")}`,
      );
      return originalFetch.call(this, input, init);
    };
  });
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toBe(
    delivery.headers["Content-Security-Policy"],
  );
  expect(response?.headers()["referrer-policy"]).toBe(
    delivery.headers["Referrer-Policy"],
  );
  const requestsAfterLoad: string[] = [];
  const diagnostics: string[] = [];
  page.on("request", (request) => requestsAfterLoad.push(request.url()));
  page.on("console", (message) => diagnostics.push(message.text()));
  page.on("pageerror", (error) => diagnostics.push(error.message));
  await page.getByLabel("Complete HTTP or HTTPS Absolute URL").fill(semanticFixture);

  await expect(
    page.getByText("13 of 13 Managed Pieces shown", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(13);
  await expect(page.getByLabel("Unicode Domain")).toHaveValue("faß.de");
  await expect(page.getByLabel("ASCII/Punycode Domain")).toHaveValue(
    "xn--fa-hia.de",
  );
  await page.getByLabel("Search Managed Pieces").fill("DUP");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(2);
  await expect(page.getByText("2 of 13 Managed Pieces shown")).toBeVisible();
  await page.getByRole("button", { name: "Clear Search" }).click();
  await expect(page.getByLabel("Search Managed Pieces")).toBeFocused();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(13);
  await expect(page.getByLabel("Path Segment 1 of 4")).toHaveValue("a%2Fb");
  await expect(page.getByText("Malformed percent text")).toBeVisible();
  await page.getByLabel("Path Segment 1 of 4").fill("edited+%2F");
  await expect(page.getByLabel("Complete HTTP or HTTPS Absolute URL")).toHaveValue(
    semanticFixture.replace("a%2Fb", "edited+%2F"),
  );
  await page.getByLabel("Unicode Domain").fill("example.com");
  await expect(page.getByLabel("ASCII/Punycode Domain")).toHaveValue(
    "example.com",
  );

  await page.getByLabel("Complete HTTP or HTTPS Absolute URL").fill("/relative");
  await expect(page.getByText(/complete HTTP or HTTPS/)).toBeVisible();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(13);
  await page.getByLabel("Unicode Domain").fill("example.org");
  await page.getByLabel("Path Segment 1 of 4").fill("invalid-draft-edit");
  await page.locator("#add-query-before").focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Key, Query Parameter 9 of 9").fill("private-local");
  await page.getByLabel("Value absent, Query Parameter 9 of 9").fill("private-value");
  await page.getByRole("button", { name: /Move Query Parameter at position 9 of 9 up/ }).click();
  await page.getByRole("button", { name: /Remove Query Parameter at position 8 of 9/ }).click();
  await expect(page.getByLabel("Complete HTTP or HTTPS Absolute URL")).toHaveValue("/relative");
  expect(requestsAfterLoad).toEqual([]);
  expect(diagnostics).toEqual([]);
  expect(
    await page.evaluate(() => window.__privacyProbe),
  ).toEqual({
    storageWrites: [],
    indexedDbCalls: [],
    cacheCalls: [],
    serviceWorkerCalls: [],
    beaconCalls: [],
    fetchCalls: [],
  });
  expect(
    await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
      indexedDatabases:
        typeof indexedDB.databases === "function"
          ? (await indexedDB.databases()).length
          : 0,
    })),
  ).toEqual({ local: 0, session: 0, cookies: "", indexedDatabases: 0 });
});

  test("Story 2.7 invalid Draft source, independent feedback and keyboard mutations remain accessible at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    await editor.fill("/invalid-intake");
    await expect(page.locator("#error-full-url")).not.toContainText("Last Valid");
    await expect(page.locator("#structured-source")).toHaveCount(0);
    await editor.fill("https://example.com/a?dup=1&dup=2&flag&empty=#Frag%2f");
    const targetId = await page.getByLabel("Value, Query Parameter 2 of 4, occurrence 2 of 2")
      .locator("xpath=ancestor::li").getAttribute("data-piece-id");
    const value = page.locator(`#query-value-${targetId}`);
    await value.fill("%");
    const fieldError = await value.getAttribute("aria-errormessage");
    await editor.fill("https://");
    await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 6, "backward"));
    const fullError = await page.locator("#error-full-url").textContent();
    await expect(page.locator("#error-full-url")).toContainText(
      "Draft URL is not valid. Structured View changes use the Last Valid URL.",
    );
    await expect(page.getByRole("region", { name: "Structured View" }))
      .toHaveAccessibleDescription("Source: Last Valid URL.");
    await expect(page.locator(`#${fieldError}`)).toContainText("complete triplet");
    await expect(value).toHaveAccessibleDescription(/complete triplet/);
    await expect(editor).toHaveAccessibleDescription(/Draft URL is not valid/);
    await expect(page.getByLabel("ASCII/Punycode Domain")).toHaveAccessibleDescription(/Last Valid URL/);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.getByLabel("Unicode Domain").fill("example.org");
    await page.getByLabel("Path Segment 1 of 1").fill("new");
    await page.getByLabel("Key, Query Parameter 1 of 4, occurrence 1 of 2").fill("first");
    await value.fill("%2F");
    await expect(value).toBeFocused();
    await expect(value).not.toHaveAttribute("aria-invalid");
    await page.getByLabel("Search Managed Pieces").fill("%2F");
    await expect(page.locator("#managed-pieces > li")).toHaveCount(1);
    const move = page.getByRole("button", { name: /Move Query Parameter at position 2 of 4 up/ });
    await move.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(`#move-down-${targetId}`)).toBeFocused();
    await expect(page.getByLabel("Search Managed Pieces")).toHaveValue("%2F");
    await expect(page.getByText(/Moved Query Parameter 2 of 4 to position 1 of 4/)).toBeVisible();
    await page.locator("#add-query-after").focus();
    await page.keyboard.press("Space");
    await expect(page.getByLabel("Search Managed Pieces")).toHaveValue("");
    await expect(page.getByLabel("Key, Query Parameter 5 of 5")).toBeFocused();
    await page.locator(`#remove-${targetId}`).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /Remove Query Parameter at position 1 of 4/ })).toBeFocused();
    await expect(editor).toHaveValue("https://");
    expect(await editor.evaluate((input: HTMLTextAreaElement) =>
      [input.selectionStart, input.selectionEnd, input.selectionDirection])).toEqual([2, 6, "backward"]);
    await expect(page.locator("#error-full-url")).toHaveText(fullError!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await editor.fill("https://example.org/new?first=1&flag&empty=&#Frag%2f");
    await expect(page.locator("#structured-source")).toHaveCount(0);
    await expect(page.locator("#error-full-url")).toHaveCount(0);
    await expect(page.locator("#managed-pieces > li")).toHaveCount(6);
  });

  test("Story 2.7 invalid Draft capacity preserves all identities and measured edit/reorder response", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    const requests: string[] = [];
    const diagnostics: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    page.on("console", (message) => diagnostics.push(message.text()));
    page.on("pageerror", (error) => diagnostics.push(error.message));
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    const fixture = createCapacityFixture();
    await editor.fill(fixture);
    const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.pieceId));
    await editor.fill("https://");
    const key = page.getByLabel("Key, Query Parameter 260 of 260");
    const editDuration = await key.evaluate(async (input: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      const start = performance.now();
      setter.call(input, "last");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      // Two frames include a rendering opportunity after checking publication.
      await new Promise<void>((resolve, reject) => requestAnimationFrame(() => {
        if (input.value !== "last") {
          reject(new Error("The measured edit did not publish its DOM outcome."));
          return;
        }
        input.getBoundingClientRect();
        requestAnimationFrame(() => resolve());
      }));
      return performance.now() - start;
    });
    expect(editDuration).toBeLessThan(100);
    await expect(key).toHaveValue("last");
    const move = page.getByRole("button", { name: /Move Query Parameter at position 260 of 260 up/ });
    const moveDuration = await move.evaluate(async (button: HTMLButtonElement) => {
      const row = button.closest("li")!;
      const previousRow = row.previousElementSibling!;
      const start = performance.now();
      button.click();
      await new Promise<void>((resolve, reject) => requestAnimationFrame(() => {
        if (row.nextElementSibling !== previousRow || document.activeElement !== button) {
          reject(new Error("The measured move did not publish its order and focus."));
          return;
        }
        row.getBoundingClientRect();
        requestAnimationFrame(() => resolve());
      }));
      return performance.now() - start;
    });

    expect(moveDuration).toBeLessThan(100);
    await expect(page.locator(`#move-up-${ids.at(-1)}`)).toBeFocused();
    await expect(page.locator("#managed-pieces > li")).toHaveCount(263);
    expect(await page.locator("#managed-pieces > li").evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.pieceId)))
      .toEqual([...ids.slice(0, -2), ids.at(-1), ids.at(-2)]);
    await expect(editor).toHaveValue("https://");
    await expect(page.getByRole("region", { name: "Structured View" }))
      .toHaveAccessibleDescription("Source: Last Valid URL.");
    const entries = fixture.slice(fixture.indexOf("?") + 1, fixture.indexOf("#")).split("&");
    entries[259] = entries[259]!.replace("parameter-259", "last");
    [entries[258], entries[259]] = [entries[259]!, entries[258]!];
    await editor.fill(`${fixture.slice(0, fixture.indexOf("?") + 1)}${entries.join("&")}${fixture.slice(fixture.indexOf("#"))}`);
    await expect(page.locator("#structured-source")).toHaveCount(0);
    expect(await page.locator("#managed-pieces > li").evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.pieceId)))
      .toEqual([...ids.slice(0, -2), ids.at(-1), ids.at(-2)]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    expect(requests).toEqual([]);
    expect(diagnostics).toEqual([]);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie]))
      .toEqual([0, 0, ""]);
  });

test("Story 2.7 capacity rejection preserves invalid Draft, selection, identities and focus", async ({ page }) => {
    await page.goto("/");
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    await editor.fill(createCapacityFixture());
    const ids = await page.locator("#managed-pieces > li").evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.pieceId));
    await editor.fill("https://");
    await editor.evaluate((input: HTMLTextAreaElement) => input.setSelectionRange(2, 6, "backward"));
    const parserError = await page.locator("#error-full-url").textContent();
    const search = page.getByLabel("Search Managed Pieces");
    await search.fill("parameter-259");
    await page.locator("#add-query-after").focus();
    await page.keyboard.press("Enter");
    await expect(search).toHaveValue("parameter-259");
    await expect(page.locator("#add-query-after")).toBeFocused();
    await expect(page.locator("#managed-pieces > li")).toHaveCount(1);
    await expect(page.getByRole("alert")).toContainText(/20,000/);
    await expect(page.getByText(/Query Parameter \d+ added/)).toHaveCount(0);
    await page.getByRole("button", { name: "Clear Search" }).click();
    const key = page.getByLabel("Key, Query Parameter 260 of 260");
    await key.fill("parameter-259-extra");
    await expect(key).toBeFocused();
    await expect(key).toHaveAttribute("aria-invalid", "true");
    await expect(key).toHaveAccessibleDescription(/20,000/);
    await expect(editor).toHaveValue("https://");
    expect(await editor.evaluate((input: HTMLTextAreaElement) =>
      [input.selectionStart, input.selectionEnd, input.selectionDirection])).toEqual([2, 6, "backward"]);
    await expect(page.locator("#error-full-url")).toHaveText(parserError!);
    expect(await page.locator("#managed-pieces > li").evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.pieceId))).toEqual(ids);
    await key.fill("parameter-259");
    await expect(key).not.toHaveAttribute("aria-invalid");
    await editor.fill(createCapacityFixture());
    await expect(page.locator("#structured-source")).toHaveCount(0);
    expect(await page.locator("#managed-pieces > li").evaluateAll((rows) =>
      rows.map((row) => (row as HTMLElement).dataset.pieceId))).toEqual(ids);
});

test("Story 2.7 invalid Draft feedback reflows with forced colors and increased text spacing", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    // CSP forbids inline styles, so change the existing same-origin sheet.
    await page.evaluate(() => {
      document.styleSheets[0]!.insertRule(
        "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }",
        document.styleSheets[0]!.cssRules.length,
      );
      document.styleSheets[0]!.insertRule(
        "p { margin-bottom: 2em !important; }",
        document.styleSheets[0]!.cssRules.length,
      );
    });
    const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    await editor.fill("https://example.com/a?x=1&y=2");
    const domain = page.getByLabel("Unicode Domain");
    await domain.fill("xn--");
    await expect(domain).toHaveAccessibleDescription(/valid|Domain|domain/);
    const domainError = await domain.getAttribute("aria-errormessage");
    await expect(page.locator(`#${domainError}-feedback`)).not.toBeEmpty();
    await editor.fill("https://");
    await expect(editor).toHaveAccessibleDescription(/Last Valid URL/);
    await expect(page.getByRole("region", { name: "Structured View" }))
      .toHaveAccessibleDescription("Source: Last Valid URL.");
    await domain.fill("example.org");
    await page.locator("#add-query-after").focus();
    await page.keyboard.press("Space");
    await expect(page.getByLabel("Key, Query Parameter 3 of 3")).toBeFocused();
    for (const selector of ["#error-full-url", "#structured-source", "#add-query-after", "#query-key-" + (
      await page.getByLabel("Key, Query Parameter 3 of 3").locator("xpath=ancestor::li").getAttribute("data-piece-id")
    )]) {
      const box = await page.locator(selector).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("Domain editing is synchronized, correctable, IME-safe, and host-only", async ({
  page,
}) => {
    await page.goto("/");
    const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    await fullUrl.fill(
      "https://User:Pass@Example.COM:044/a%2fb//?dup=1&dup=2#Frag%2f",
    );
    const rows = page.locator("#managed-pieces > li");
    const originalIds = await rows.evaluateAll((items) =>
      items.map((item) => (item as HTMLElement).dataset.pieceId),
    );
    const unicode = page.getByLabel("Unicode Domain");
    const ascii = page.getByLabel("ASCII/Punycode Domain");

    await unicode.fill("faß.de");
    await expect(unicode).toBeFocused();
    await expect(unicode).toHaveValue("faß.de");
    await expect(ascii).toHaveValue("xn--fa-hia.de");
    await expect(fullUrl).toHaveValue(
      "https://User:Pass@xn--fa-hia.de:044/a%2fb//?dup=1&dup=2#Frag%2f",
    );
    expect(
      await rows.evaluateAll((items) =>
        items.map((item) => (item as HTMLElement).dataset.pieceId),
      ),
    ).toEqual(originalIds);

    await ascii.fill("xn--");
    await expect(ascii).toHaveValue("xn--");
    await expect(ascii).toHaveAttribute("aria-invalid", "true");
    const errorId = await ascii.getAttribute("aria-errormessage");
    if (!errorId) throw new Error("Missing associated Domain error");
    const domainId = await ascii.locator("xpath=ancestor::li").getAttribute(
      "data-piece-id",
    );
    expect(errorId).toBe(`error-${domainId}-domain-ascii`);
    await expect(ascii).toHaveAttribute(
      "aria-describedby",
      `help-${domainId}-domain error-${domainId}-domain-ascii`,
    );
    await expect(page.locator(`#${errorId}`)).toContainText(
      "valid ASCII or Punycode",
    );
    await expect(
      page.getByText("Enter a valid ASCII or Punycode domain."),
    ).toHaveCount(1);
    await expect(page.getByText("Domain forms are synchronized.")).toHaveCount(0);
    await expect(page.getByText(/Domain synchronized at revision/)).toHaveCount(0);
    await expect(unicode).toHaveValue("faß.de");
    await expect(fullUrl).toHaveValue(
      "https://User:Pass@xn--fa-hia.de:044/a%2fb//?dup=1&dup=2#Frag%2f",
    );

    await ascii.fill("EXAMPLE.COM");
    await expect(ascii).toBeFocused();
    await expect(ascii).toHaveValue("example.com");
    await expect(unicode).toHaveValue("example.com");
    const synchronized = page.getByText(/Domain synchronized at revision 3/);
    await expect(synchronized).toContainText(
      "Unicode Domain, ASCII/Punycode Domain, and Full URL updated",
    );
    await expect(synchronized).not.toHaveAttribute("role");
    await expect(page.locator("#operation-status")).toHaveAttribute("aria-live", "polite");
    await ascii.evaluate((input) => {
      const field = input as HTMLInputElement;
      field.focus();
      field.setSelectionRange(3, 4);
    });
    await page.keyboard.type("M");
    await expect(ascii).toHaveValue("example.com");
    expect(
      await ascii.evaluate((input) => (input as HTMLInputElement).selectionStart),
    ).toBe(4);
    await expect(fullUrl).toHaveValue(
      "https://User:Pass@example.com:044/a%2fb//?dup=1&dup=2#Frag%2f",
    );

    await unicode.dispatchEvent("compositionstart", { data: "" });
    await unicode.evaluate((input) => {
      const field = input as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(field, "日本.jp");
      field.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: "日本",
          inputType: "insertCompositionText",
          isComposing: true,
        }),
      );
    });
    await expect(fullUrl).toHaveValue(
      "https://User:Pass@example.com:044/a%2fb//?dup=1&dup=2#Frag%2f",
    );
    await unicode.evaluate(async (input) => {
      input.dispatchEvent(
        new CompositionEvent("compositionend", {
          bubbles: true,
          data: "日本",
        }),
      );
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: "日本",
          inputType: "insertFromComposition",
          isComposing: false,
        }),
      );
    });
    await expect(fullUrl).toHaveValue(
      "https://User:Pass@xn--wgv71a.jp:044/a%2fb//?dup=1&dup=2#Frag%2f",
    );
    await expect(page.getByText(/Domain synchronized at revision 4/)).toBeVisible();
    await expect(unicode).not.toHaveAttribute("aria-invalid");
    await expect(unicode).toHaveCSS("unicode-bidi", "isolate");

    await unicode.fill("cafe\u0301..example");
    await unicode.evaluate((input) => {
      const field = input as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(field, "cafe\u0301.example");
      field.setSelectionRange(6, 6);
      field.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: null,
          inputType: "deleteContentBackward",
        }),
      );
    });
    await expect(unicode).toHaveValue("café.example");
    expect(
      await unicode.evaluate((input) => (input as HTMLInputElement).selectionStart),
    ).toBe(5);

    await fullUrl.fill("/invalid");
    await expect(page.getByText(/complete HTTP or HTTPS/)).toBeVisible();
    await expect(unicode).toBeEnabled();
    await expect(ascii).toBeEnabled();
    await expect(fullUrl).toHaveValue("/invalid");
});

test("capacity view renders every row and stays usable at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const start = Date.now();
  await page
    .getByLabel("Complete HTTP or HTTPS Absolute URL")
    .fill(createCapacityFixture());
  await expect(page.locator("#managed-pieces > li")).toHaveCount(263);
  expect(
    await page
      .getByRole("textbox", { name: /^Key, Query Parameter/ })
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
  ).toEqual(Array.from({ length: 260 }, (_, index) => `parameter-${index}`));
  expect(Date.now() - start).toBeLessThan(1_000);
  const searchMeasurements = await page.evaluate(async () => {
    const input = document.querySelector<HTMLInputElement>(
      "#managed-piece-search",
    );
    if (!input) throw new Error("Search input missing");
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    const originalIds = Array.from(
      document.querySelectorAll<HTMLElement>("#managed-pieces > li"),
      (row) => row.dataset.pieceId,
    );
    const visibleRows = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>("#managed-pieces > li"),
        (row) => ({
          id: row.dataset.pieceId,
          values: Array.from(
            row.querySelectorAll<HTMLInputElement>("input"),
            (field) => field.value,
          ),
        }),
      );
    const applySearch = (term: string, expectedCount: number) =>
      new Promise<{
        duration: number;
        rows: ReturnType<typeof visibleRows>;
      }>((resolve) => {
        const started = performance.now();
        const observer = new MutationObserver(() => {
          if (
            document.querySelectorAll("#managed-pieces > li").length ===
            expectedCount
          ) {
            observer.disconnect();
            resolve({
              duration: performance.now() - started,
              rows: visibleRows(),
            });
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setter?.call(input, term);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    const matches = {
      domain: await applySearch("example.com", 1),
      path: await applySearch("deep", 1),
      key: await applySearch("parameter-259", 1),
      value: await applySearch("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", 260),
      none: await applySearch("not-present-anywhere", 0),
    };
    const clear = document.querySelector<HTMLButtonElement>(
      "#managed-piece-search + button",
    );
    if (!clear) throw new Error("Clear Search button missing");
    const clearStarted = performance.now();
    const clearDuration = await new Promise<number>((resolve) => {
      const observer = new MutationObserver(() => {
        if (document.querySelectorAll("#managed-pieces > li").length === 263) {
          observer.disconnect();
          resolve(performance.now() - clearStarted);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      clear.click();
    });
    const restoredIds = Array.from(
      document.querySelectorAll<HTMLElement>("#managed-pieces > li"),
      (row) => row.dataset.pieceId,
    );
    return {
      durations: {
        domain: matches.domain.duration,
        path: matches.path.duration,
        key: matches.key.duration,
        value: matches.value.duration,
        none: matches.none.duration,
        clear: clearDuration,
      },
      rows: {
        domain: matches.domain.rows,
        path: matches.path.rows,
        key: matches.key.rows,
        value: matches.value.rows,
        none: matches.none.rows,
      },
      originalIds,
      restoredIds,
    };
  });
  for (const [operation, duration] of Object.entries(searchMeasurements.durations)) {
    expect(duration, `${operation} Search response`).toBeLessThan(100);
  }
  expect(searchMeasurements.rows.domain[0]?.values).toEqual([
    "example.com",
    "example.com",
  ]);
  expect(searchMeasurements.rows.path[0]?.values).toEqual(["deep"]);
  expect(searchMeasurements.rows.key[0]?.values[0]).toBe("parameter-259");
  expect(searchMeasurements.rows.value).toHaveLength(260);
  expect(
    searchMeasurements.rows.value.every((row) =>
      row.values[1]?.includes("x".repeat(40)),
    ),
  ).toBe(true);
  expect(searchMeasurements.rows.none).toEqual([]);
  expect(searchMeasurements.restoredIds).toEqual(searchMeasurements.originalIds);
  await expect(page.locator("#managed-pieces > li")).toHaveCount(263);
  const lastKey = page.getByRole("textbox", {
    name: /^Key, Query Parameter/,
  }).last();
  const originalFullUrl = createCapacityFixture();
  await lastKey.focus();
  await lastKey.press("End");
  await lastKey.press("x");
  await expect(lastKey).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByLabel("Complete HTTP or HTTPS Absolute URL"),
  ).toHaveValue(originalFullUrl);

  const editDuration = await lastKey.evaluate(async (input) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    const started = performance.now();
    setter?.call(input, "last%2Fkey");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise<void>((resolve) => {
      const check = () => {
        const fullUrl = document.querySelector<HTMLTextAreaElement>(
          "#full-url-editor",
        );
        if (fullUrl?.value.includes("last%2Fkey")) {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
    return performance.now() - started;
  });
  expect(editDuration).toBeLessThan(100);
  await expect(lastKey).toHaveValue("last%2Fkey");
  const domain = page.getByLabel("ASCII/Punycode Domain");
  const domainDuration = await domain.evaluate(async (input) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    const started = performance.now();
    setter?.call(input, "a.co");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise<void>((resolve) => {
      const check = () => {
        const fullUrl = document.querySelector<HTMLTextAreaElement>(
          "#full-url-editor",
        );
        if (fullUrl?.value.includes("https://a.co/")) {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
    return performance.now() - started;
  });
  await expect(
    page.getByLabel("Complete HTTP or HTTPS Absolute URL"),
  ).toHaveValue(
    originalFullUrl
      .replace("example.com", "a.co")
      .replace("parameter-259", "last%2Fkey"),
  );
  expect(domainDuration).toBeLessThan(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    320,
  );
  await expect(lastKey).toHaveValue("last%2Fkey");

  const removeLast = page.getByRole("button", {
    name: /Remove Query Parameter at position 260 of 260/,
  });
  const removalDuration = await removeLast.evaluate(async (button) => {
    const started = performance.now();
    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (!document.getElementById((button as HTMLButtonElement).id)) {
          observer.disconnect();
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      (button as HTMLButtonElement).click();
    });
    return performance.now() - started;
  });
  expect(removalDuration).toBeLessThan(100);
  await expect(page.locator("#managed-pieces > li")).toHaveCount(262);
  await expect(page.getByRole("button", { name: /Remove Query Parameter/ })).toHaveCount(
    259,
  );
  await expect(
    page.getByLabel("Complete HTTP or HTTPS Absolute URL"),
  ).not.toHaveValue(/last%2Fkey/);
});

test("removal preserves exact survivors, Search, focus, accessibility, and privacy", async ({
  page,
}) => {
  await page.goto("/");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill(removalFixtures.pathAndDuplicates);
  const rows = page.locator("#managed-pieces > li");
  const originalIds = await rows.evaluateAll((items) =>
    items.map((item) => (item as HTMLElement).dataset.pieceId),
  );
  const search = page.getByLabel("Search Managed Pieces");
  await search.fill("dup");
  await expect(rows).toHaveCount(3);
  await expect(page.getByRole("button", { name: /Remove Domain/ })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Remove Query Parameter at position 1 of 3/ }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: /Remove Query Parameter at position 1 of 3/ }).click();
  await expect(fullUrl).toHaveValue(
    "https://example.com/a%2fb//tail/?dup=&dup=3#Frag%2f",
  );
  await expect(search).toHaveValue("dup");
  await expect(rows).toHaveCount(2);
  expect(
    await rows.evaluateAll((items) =>
      items.map((item) => (item as HTMLElement).dataset.pieceId),
    ),
  ).toEqual(originalIds.slice(-2));
  const nextRemove = page.getByRole("button", {
    name: /Remove Query Parameter at position 1 of 2/,
  });
  await expect(nextRemove).toBeFocused();
  await expect(
    page.getByRole("status").filter({
      hasText: "Query Parameter 1 removed. Full URL and Structured View updated.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", {
      name: "Value, Query Parameter 1 of 2, occurrence 1 of 2",
    }),
  ).toHaveValue("");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: "Clear Search" }).click();
  await page.getByRole("button", { name: /Remove Path Segment at position 2 of 4/ }).click();
  await expect(fullUrl).toHaveValue(
    "https://example.com/a%2fb/tail/?dup=&dup=3#Frag%2f",
  );
  await expect(
    page.getByRole("button", { name: /Remove Path Segment at position 2 of 3/ }),
  ).toBeFocused();
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
    })),
  ).toEqual({ local: 0, session: 0, cookies: "" });
});

test("Add Query Parameter appends from either control, synchronizes Search, keeps focus, and stays private at capacity", async ({
  page,
}) => {
  await page.goto("/");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill("https://example.com/a");
  await expect(
    page.getByRole("link", { name: "Skip to Add Query Parameter" }),
  ).toHaveAttribute("href", "#add-query-after");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const addBefore = page.locator("#add-query-before");
  const addAfter = page.locator("#add-query-after");
  const rows = page.locator("#managed-pieces > li");
  await expect(rows).toHaveCount(2);

  await addBefore.click();
  await expect(fullUrl).toHaveValue("https://example.com/a?");
  await expect(rows).toHaveCount(3);
  await expect(
    page.getByRole("textbox", { name: /^Key, Query Parameter 1 of 1/ }),
  ).toBeFocused();
  await expect(
    page.getByRole("status").filter({
      hasText: "Query Parameter 1 added. Full URL and Structured View updated.",
    }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.keyboard.type("newKey");
  await expect(fullUrl).toHaveValue("https://example.com/a?newKey");

  await addAfter.click();
  await expect(fullUrl).toHaveValue("https://example.com/a?newKey&");
  await expect(rows).toHaveCount(4);
  await expect(
    page.getByRole("textbox", { name: /^Key, Query Parameter 2 of 2/ }),
  ).toBeFocused();

  const search = page.getByLabel("Search Managed Pieces");
  await search.fill("newKey");
  await expect(rows).toHaveCount(1);
  await addAfter.click();
  await expect(search).toHaveValue("");
  await expect(rows).toHaveCount(5);
  await expect(
    page.getByRole("textbox", { name: /^Key, Query Parameter 3 of 3/ }),
  ).toBeFocused();

  await page.keyboard.press("Tab");
  await addBefore.focus();
  await page.keyboard.press("Enter");
  await expect(rows).toHaveCount(6);

  expect(requests).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
    })),
  ).toEqual({ local: 0, session: 0, cookies: "" });
});

test("Add Query Parameter remains reachable and performant at 250+ entries", async ({
  page,
}) => {
  await page.goto("/");
  const entries = Array.from(
    { length: 260 },
    (_, index) => `parameter-${index}=value-${index}`,
  );
  await page
    .getByLabel("Complete HTTP or HTTPS Absolute URL")
    .fill(`https://example.com/deep/path?${entries.join("&")}`);
  await expect(page.locator("#managed-pieces > li")).toHaveCount(263);

  const addAfter = page.locator("#add-query-after");
  await addAfter.scrollIntoViewIfNeeded();
  const duration = await addAfter.evaluate(async (button) => {
    const started = performance.now();
    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (document.querySelectorAll("#managed-pieces > li").length === 264) {
          observer.disconnect();
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      (button as HTMLButtonElement).click();
    });
    return performance.now() - started;
  });
  expect(duration).toBeLessThan(100);
  await expect(page.locator("#managed-pieces > li")).toHaveCount(264);
});

test("reorders Query Parameters by keyboard and pointer activation, honoring boundaries, Search, duplicates, and capacity", async ({
  page,
}) => {
  await page.goto("/");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill("https://example.com/a?dup=1&dup=2&z=3");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const firstUp = page.getByRole("button", {
    name: /Move Query Parameter at position 1 of 3 up/,
  });
  const lastDown = page.getByRole("button", {
    name: /Move Query Parameter at position 3 of 3 down/,
  });
  await expect(firstUp).toBeDisabled();
  await expect(lastDown).toBeDisabled();

  const middleDown = page.getByRole("button", {
    name: /Move Query Parameter at position 2 of 3 down/,
  });
  await middleDown.focus();
  await page.keyboard.press("Enter");
  await expect(fullUrl).toHaveValue("https://example.com/a?dup=1&z=3&dup=2");
  await expect(
    page.getByRole("status").filter({ hasText: /Moved Query Parameter 2 of 3 to position 3 of 3/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Move Query Parameter at position 3 of 3 up/ }),
  ).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const search = page.getByLabel("Search Managed Pieces");
  await search.fill("dup");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(2);
  await page
    .getByRole("button", { name: /Move Query Parameter at position 1 of 3 down/ })
    .click();
  await expect(fullUrl).toHaveValue("https://example.com/a?z=3&dup=1&dup=2");
  await expect(search).toHaveValue("dup");

  expect(requests).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
    })),
  ).toEqual({ local: 0, session: 0, cookies: "" });
});

test("reorders within a 250+ parameter list, keeping boundaries reachable and performant", async ({
  page,
}) => {
  await page.goto("/");
  const entries = Array.from(
    { length: 260 },
    (_, index) => `parameter-${index}=value-${index}`,
  );
  await page
    .getByLabel("Complete HTTP or HTTPS Absolute URL")
    .fill(`https://example.com/deep/path?${entries.join("&")}`);
  await expect(page.locator("#managed-pieces > li")).toHaveCount(263);

  const moveDown = page.getByRole("button", {
    name: /Move Query Parameter at position 101 of 260 down/,
  });
  await moveDown.scrollIntoViewIfNeeded();
  const duration = await moveDown.evaluate(async (button) => {
    const started = performance.now();
    (button as HTMLButtonElement).click();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return performance.now() - started;
  });
  expect(duration).toBeLessThan(100);
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await expect(fullUrl).toHaveValue(/parameter-101=value-101&parameter-100=value-100/);
});

test("initial and populated workbench pass automated accessibility checks", async ({
  page,
}) => {
  await page.goto("/");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill("https://example.com/a?x=1&x=&empty");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(5);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await fullUrl.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Copy", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Add Query Parameter before the list" }),
  ).toBeFocused();

  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.evaluate(() => {
    const sheet = document.styleSheets[0];
    sheet.insertRule(
      "* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }",
      sheet.cssRules.length,
    );
    sheet.insertRule("p { margin-block: 2em !important; }", sheet.cssRules.length);
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    1280,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const addQueryBefore = page.getByRole("button", {
    name: "Add Query Parameter before the list",
  });
  await expect(addQueryBefore).toBeEnabled();
  await addQueryBefore.focus();
  await expect(addQueryBefore).toBeFocused();
  await expect(page.locator("#full-url-help")).toBeVisible();
  await expect(page.locator("#copy-help")).toBeVisible();
  await expect(page.locator("#piece-summary")).toBeVisible();
  await expect(page.getByLabel("Search Managed Pieces")).toBeVisible();
  await expect(page.locator("#managed-pieces > li").first()).toBeVisible();
  await expect(page.locator("#managed-pieces > li").last()).toBeVisible();
  expect(
    await page
      .locator(
        "#full-url-help, #copy-help, [role='status'], #piece-summary, #managed-pieces > li",
      )
      .evaluateAll((elements) =>
        elements
          .filter(
            (element) =>
              element.scrollHeight > element.clientHeight ||
              element.scrollWidth > element.clientWidth,
          )
          .map((element) => element.id || element.tagName),
      ),
  ).toEqual([]);

  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    320,
  );
});

test("reload clears URL content and returns to no session", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("Complete HTTP or HTTPS Absolute URL")
    .fill("https://example.com/private?token=secret");
  await expect(
    page.getByText("3 of 3 Managed Pieces shown", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Complete HTTP or HTTPS Absolute URL")).toHaveValue("");
  await expect(page.getByText(/No session/)).toBeVisible();
});

test("search no-results and clear remain keyboard and activation safe", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Complete HTTP or HTTPS Absolute URL")
    .fill("https://example.com/a?x=1");
  const search = page.getByLabel("Search Managed Pieces");
  await search.fill("unmatched");
  await expect(
    page.getByText(
      "0 of 3 Managed Pieces shown. No Managed Piece matches ‘unmatched’.",
    ),
  ).toBeVisible();
  await search.press("Escape");
  await expect(search).toHaveValue("unmatched");
  const clearSearch = page.getByRole("button", { name: "Clear Search" });
  await expect(clearSearch).toHaveCount(1);
  await clearSearch.dispatchEvent("pointerdown");
  await clearSearch.dispatchEvent("pointercancel");
  await expect(search).toHaveValue("unmatched");
  await clearSearch.focus();
  await clearSearch.press("Enter");
  await expect(search).toBeFocused();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(3);
});

test("structured editing preserves exact bytes, identity, validation, and focus", async ({
  page,
}) => {
  await page.goto("/");
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill(structuredEditFixture);
  const rows = page.locator("#managed-pieces > li");
  const originalIds = await rows.evaluateAll((items) =>
    items.map((item) => (item as HTMLElement).dataset.pieceId),
  );

  const duplicateValue = page.getByRole("textbox", {
    name: /^Value, Query Parameter/,
  }).nth(1);
  await duplicateValue.fill("x&😀");
  await expect(duplicateValue).toBeFocused();
  await expect(duplicateValue).toHaveValue("x%26%F0%9F%98%80");
  await expect(
    page.getByRole("textbox", { name: /^Value, Query Parameter/ }).first(),
  ).toHaveValue("1");
  await expect(fullUrl).toHaveValue(
    "https://User@example.com:044/a%2fb//tail?dup=1&dup=x%26%F0%9F%98%80&flag&empty=#Frag%2f",
  );
  expect(
    await rows.evaluateAll((items) =>
      items.map((item) => (item as HTMLElement).dataset.pieceId),
    ),
  ).toEqual(originalIds);

  await duplicateValue.fill("%");
  await expect(duplicateValue).toHaveValue("%");
  await expect(duplicateValue).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#managed-pieces").getByText(/complete triplet/)).toBeVisible();
  await expect(fullUrl).toHaveValue(
    "https://User@example.com:044/a%2fb//tail?dup=1&dup=x%26%F0%9F%98%80&flag&empty=#Frag%2f",
  );
  await duplicateValue.fill("%2F");
  await expect(duplicateValue).toHaveValue("%2F");
  await expect(duplicateValue).not.toHaveAttribute("aria-invalid");
  await expect(duplicateValue).toBeFocused();

  const absentValue = page.locator('input[id^="query-value-"]').nth(2);
  await absentValue.fill("x");
  await absentValue.fill("");
  await expect(fullUrl).toHaveValue(
    "https://User@example.com:044/a%2fb//tail?dup=1&dup=%2F&flag=&empty=#Frag%2f",
  );
});

test("structured editing handles search, selections, word deletion, caret, and drafts", async ({
  page,
}) => {
  await page.goto("/");
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill("https://example.com/a?dup=alpha%2F😀omega&other=two");

  const search = page.getByLabel("Search Managed Pieces");
  await search.fill("alpha");
  const value = page.getByRole("textbox", {
    name: "Value, Query Parameter 1 of 2",
  });
  await value.focus();
  await value.evaluate((input) => {
    (input as HTMLInputElement).setSelectionRange(0, 5);
  });
  expect(await value.evaluate((input) => {
    const clipboardData = new DataTransfer();
    const event = new Event("cut", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: clipboardData });
    input.dispatchEvent(event);
    return clipboardData.getData("text/plain");
  })).toBe("alpha");
  await expect(search).toHaveValue("");
  await expect(value).toBeFocused();
  await expect(value).toHaveValue("%2F😀omega");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(4);
  await expect(page.locator("#operation-status")).toContainText(
    "4 of 4 Managed Pieces shown.",
  );

  await value.evaluate((input) => {
    (input as HTMLInputElement).setSelectionRange(0, 0);
  });
  await value.press("Delete");
  await expect(value).toHaveValue("😀omega");
  await value.press("Delete");
  await expect(value).toHaveValue("omega");
  await value.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );

  await value.evaluate((input) => {
    const field = input as HTMLInputElement;
    field.setSelectionRange(0, field.value.length);
    field.dispatchEvent(new Event("select", { bubbles: true }));
  });
  await value.evaluate((input) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", "paste&😀");
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: clipboardData });
    input.dispatchEvent(event);
  });
  await expect(value).toHaveValue("paste%26%F0%9F%98%80");
  await value.fill("one");
  await value.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await value.evaluate((input) => {
    const field = input as HTMLInputElement;
    field.setSelectionRange(1, 1);
  });
  await page.keyboard.insertText("😀");
  await expect(value).toHaveValue("o%F0%9F%98%80ne");
  await expect
    .poll(() =>
      value.evaluate((input) => (input as HTMLInputElement).selectionStart),
    )
    .toBe(13);

  await value.fill("one two");
  await expect(value).toHaveValue("one%20two");
  expect(
    await value.evaluate((input) => {
      const field = input as HTMLInputElement;
      field.setSelectionRange(3, 3);
      const allowed = field.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "deleteWordForward",
        }),
      );
      field.setSelectionRange(field.value.length, field.value.length);
      return allowed;
    }),
  ).toBe(true);
  await value.press("Control+Backspace");
  await expect(value).toHaveValue("one");

  await value.evaluate((input) => {
    const field = input as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    field.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    setter?.call(field, "日本");
    field.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: "日本",
        inputType: "insertCompositionText",
        isComposing: true,
      }),
    );
    field.dispatchEvent(
      new CompositionEvent("compositionend", {
        bubbles: true,
        data: "日本",
      }),
    );
  });
  await expect(value).toHaveValue("%E6%97%A5%E6%9C%AC");

  await value.evaluate((input) => {
    const field = input as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(field, "日本");
    field.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: "日本",
        inputType: "insertText",
        isComposing: false,
      }),
    );
  });
  await expect(value).toHaveValue("%E6%97%A5%E6%9C%AC");

  await search.fill("%E6");
  await value.focus();
  await value.press("End");
  await page.keyboard.insertText("%");
  await expect(search).toHaveValue("");
  await expect(page.locator("#operation-status")).toContainText(
    "4 of 4 Managed Pieces shown.",
  );
  await expect(value).toHaveAttribute("aria-invalid", "true");
  const errorId = await value.getAttribute("aria-errormessage");
  if (!errorId) throw new Error("Missing associated structured field error");
  await expect(page.locator(`#${errorId}`)).toContainText("complete triplet");

  await fullUrl.fill("/invalid");
  await expect(page.getByText(/complete HTTP or HTTPS/)).toBeVisible();
  await expect(value).toBeEnabled();
  await expect(fullUrl).toHaveValue("/invalid");
});

test("Full URL edits publish continuously without an Apply step, with no Apply URL affordance anywhere", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Apply URL" })).toHaveCount(0);

  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill("https://example.com/a/b?x=1&y=2");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(5);
  await expect(page.getByText("5 of 5 Managed Pieces shown")).toBeVisible();

  await expect(page.getByRole("button", { name: "Apply URL" })).toHaveCount(0);
});

test("Full URL retains row identity across first intake, Enter, blur, and refocus", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await editor.fill("https://example.com/a?x=1");
  const query = page.getByLabel("Key, Query Parameter 1 of 1");
  const id = await query.getAttribute("id");
  const domainId = await page.getByLabel("Unicode Domain")
    .locator("xpath=ancestor::li").getAttribute("data-piece-id");
  await editor.fill("https://example.com/b?x=1");
  await expect(query).toHaveAttribute("id", id!);
  await editor.press("Enter");
  await editor.fill("https://example.com/c?x=1");
  await expect(query).toHaveAttribute("id", id!);
  await expect(page.getByLabel("Unicode Domain").locator("xpath=ancestor::li"))
    .toHaveAttribute("data-piece-id", domainId!);
  await editor.blur();
  await editor.fill("https://example.com/d?x=1");
  await expect(query).toHaveAttribute("id", id!);
});

test("Full URL composition leaves Last Valid and validation untouched until composition ends", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await editor.fill("https://example.com/a");
  await editor.evaluate((element: HTMLTextAreaElement) => {
    element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    setter.call(element, "https://");
    element.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true, inputType: "insertCompositionText" }));
  });
  await editor.dispatchEvent("keydown", { key: "Enter", isComposing: false });
  await expect(editor).toHaveValue("https://");
  await expect(editor).not.toHaveAttribute("aria-invalid");
  await expect(page.getByLabel("Path Segment 1 of 1")).toHaveValue("a");
  await editor.evaluate((element: HTMLTextAreaElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    setter.call(element, "https://example.com/final");
    element.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true, inputType: "insertCompositionText" }));
  });
  await editor.dispatchEvent("compositionend", { data: "final" });
  await expect(page.getByLabel("Path Segment 1 of 1")).toHaveValue("final");
});

test("an invalid Draft survives structured Add with its selection, error, and focus contract", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await editor.fill("https://example.com/a?x=1");
  await editor.fill("https://example.com/b?x=1");
  await editor.fill("https://");
  await editor.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(3, 5));
  const message = await page.locator("#error-full-url").textContent();
  await page.getByRole("button", { name: "Add Query Parameter before the list" }).click();
  await expect(editor).toHaveValue("https://");
  expect(await editor.evaluate((element: HTMLTextAreaElement) =>
    [element.selectionStart, element.selectionEnd])).toEqual([3, 5]);
  await expect(page.locator("#error-full-url")).toHaveText(message!);
  await expect(page.getByLabel("Key, Query Parameter 2 of 2")).toBeFocused();
  await expect(page.getByText(/Last Valid URL and Structured View updated. Draft URL is unchanged./))
    .toBeVisible();
  await editor.fill("https://example.com/corrected?x=1&y=2");
  await expect(page.locator("#error-full-url")).toHaveCount(0);
  await expect(page.getByLabel("Path Segment 1 of 1")).toHaveValue("corrected");
});

test("continuous Full URL reconciliation meets the response target at 20,000 characters and 260 entries", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  const input = createCapacityFixture();
  await editor.fill(input);
  const retained = await page.getByLabel("Key, Query Parameter 100 of 260").getAttribute("id");
  const elapsed = await editor.evaluate(async (element: HTMLTextAreaElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (!setter) throw new Error("Missing native textarea setter");
    const start = performance.now();
    setter.call(element, element.value.replace("deep/path", "deep/next"));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return performance.now() - start;
  });
  expect(elapsed).toBeLessThan(100);
  await expect(page.getByLabel("Path Segment 2 of 2")).toHaveValue("next");
  await expect(page.getByLabel("Key, Query Parameter 100 of 260")).toHaveAttribute("id", retained!);
  await expect(page.locator("#managed-pieces > li")).toHaveCount(263);
});

test("Enter outside IME composition suppresses the newline and closes the focus session", async ({
  page,
}) => {
  const diagnostics: string[] = [];
  await page.goto("/");
  page.on("pageerror", (error) => diagnostics.push(error.message));
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.focus();
  await page.keyboard.type("https://example.com/a");
  await page.keyboard.press("Enter");
  await page.keyboard.type("?b=1");
  await expect(fullUrl).toHaveValue("https://example.com/a?b=1");
  expect(await fullUrl.inputValue()).not.toContain("\n");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(3);
  expect(diagnostics).toEqual([]);
});

test("Shift+Enter outside IME composition suppresses the newline without closing the focus session", async ({
  page,
}) => {
  const diagnostics: string[] = [];
  await page.goto("/");
  page.on("pageerror", (error) => diagnostics.push(error.message));
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.focus();
  await page.keyboard.type("https://example.com/a");
  await page.keyboard.press("Shift+Enter");
  await page.keyboard.type("?b=1");
  await expect(fullUrl).toHaveValue("https://example.com/a?b=1");
  expect(await fullUrl.inputValue()).not.toContain("\n");
  await expect(fullUrl).toBeFocused();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(3);
  expect(diagnostics).toEqual([]);
});

test("Structured View editing controls stay enabled while the Full URL draft is momentarily invalid (loosened gating)", async ({
  page,
}) => {
  await page.goto("/");
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill("https://example.com/a?x=1");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(3);

  // Corrupt the scheme by deleting the "https://" prefix via keyboard, making
  // the draft momentarily invalid (missing scheme) without blurring.
  await fullUrl.focus();
  await fullUrl.press("Home");
  for (let i = 0; i < "https://".length; i += 1) {
    await page.keyboard.press("Delete");
  }
  await expect(page.locator("#error-full-url")).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Add Query Parameter before the list" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /Remove Query Parameter/ }),
  ).toBeEnabled();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(3);
});

test("blur-close and refocus round trip keeps the Structured View synchronized", async ({
  page,
}) => {
  await page.goto("/");
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill("https://example.com/a?x=1");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(3);

  await fullUrl.fill("https://example.com/b?y=2&z=3");
  await page.keyboard.press("Tab");
  await expect(fullUrl).not.toBeFocused();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(4);
  await expect(page.getByLabel("Path Segment 1 of 1")).toHaveValue("b");

  await fullUrl.focus();
  await fullUrl.fill("https://example.com/b/c?y=2&z=3&w=4");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(6);
  await expect(page.getByLabel("Path Segment 2 of 2")).toHaveValue("c");
  await fullUrl.blur();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(6);
  await expect(fullUrl).toHaveValue("https://example.com/b/c?y=2&z=3&w=4");
});
