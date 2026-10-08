import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import {
  createCapacityFixture,
  removalFixtures,
  semanticFixture,
  structuredEditFixture,
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
    await expect(page.getByText(/Undid /)).toHaveCount(0);
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
  await expect(page.getByText(/Undid Full URL edit.*Draft URL is unchanged/)).toBeVisible();
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
    await expect(page.getByText(/Last Valid URL and Structured View updated. Draft unchanged./)).toBeVisible();
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
    await expect(page.locator("#structured-validation")).toContainText(/20,000/);
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
    await expect(synchronized).toHaveAttribute("role", "status");
    await expect(synchronized).toHaveAttribute("aria-live", "polite");
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
    page.getByRole("status").filter({ hasText: /moved from position 2 to position 3 of 3/ }),
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
  await expect(page.locator("#actions-note")).toBeVisible();
  await expect(page.locator("#piece-summary")).toBeVisible();
  await expect(page.getByLabel("Search Managed Pieces")).toBeVisible();
  await expect(page.locator("#managed-pieces > li").first()).toBeVisible();
  await expect(page.locator("#managed-pieces > li").last()).toBeVisible();
  expect(
    await page
      .locator(
        "#full-url-help, #actions-note, [role='status'], #piece-summary, #managed-pieces > li",
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
  await expect(page.locator("#search-status")).toContainText(
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
  await expect(page.locator("#search-status")).toContainText(
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
  await expect(page.getByText(/Last Valid URL and Structured View updated. Draft unchanged./))
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
