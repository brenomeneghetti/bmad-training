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
  await page.getByRole("button", { name: "Apply URL" }).click();

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
  await page.getByRole("button", { name: "Apply URL" }).click();
  await expect(page.getByText(/complete HTTP or HTTPS/)).toBeVisible();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(13);
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

test("Domain editing is synchronized, correctable, IME-safe, and host-only", async ({
  page,
}) => {
    await page.goto("/");
    const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
    await fullUrl.fill(
      "https://User:Pass@Example.COM:044/a%2fb//?dup=1&dup=2#Frag%2f",
    );
    await page.getByRole("button", { name: "Apply URL" }).click();
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
      `help-${domainId}-domain`,
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
    await page.getByRole("button", { name: "Apply URL" }).click();
    await expect(unicode).toBeDisabled();
    await expect(ascii).toBeDisabled();
    await expect(fullUrl).toHaveValue("/invalid");
});

test("capacity view renders every row and stays usable at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page
    .getByLabel("Complete HTTP or HTTPS Absolute URL")
    .fill(createCapacityFixture());
  const start = Date.now();
  await page.getByRole("button", { name: "Apply URL" }).click();
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
  expect(Object.values(searchMeasurements.durations).every((value) => value < 100))
    .toBe(true);
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
  await page.getByRole("button", { name: "Apply URL" }).click();
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

test("initial and populated workbench pass automated accessibility checks", async ({
  page,
}) => {
  await page.goto("/");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page
    .getByLabel("Complete HTTP or HTTPS Absolute URL")
    .fill("https://example.com/a?x=1&x=&empty");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Apply URL" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#managed-pieces > li")).toHaveCount(5);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

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
  await expect(page.getByRole("button", { name: "Apply URL" })).toBeEnabled();
  await page.getByRole("button", { name: "Apply URL" }).focus();
  await expect(page.getByRole("button", { name: "Apply URL" })).toBeFocused();
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

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 800,
    deviceScaleFactor: 4,
    mobile: false,
  });
  expect(await page.evaluate(() => window.devicePixelRatio)).toBe(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    320,
  );
});

test("reload clears URL content and returns to no session", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("Complete HTTP or HTTPS Absolute URL")
    .fill("https://example.com/private?token=secret");
  await page.getByRole("button", { name: "Apply URL" }).click();
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
  await page.getByRole("button", { name: "Apply URL" }).click();
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
  await page.getByRole("button", { name: "Apply URL" }).click();
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
  await expect(page.getByText(/complete triplet/)).toBeVisible();
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
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const fullUrl = page.getByLabel("Complete HTTP or HTTPS Absolute URL");
  await fullUrl.fill("https://example.com/a?dup=alpha%2F😀omega&other=two");
  await page.getByRole("button", { name: "Apply URL" }).click();

  const search = page.getByLabel("Search Managed Pieces");
  await search.fill("alpha");
  const value = page.getByRole("textbox", {
    name: "Value, Query Parameter 1 of 2",
  });
  await value.focus();
  await value.evaluate((input) => {
    (input as HTMLInputElement).setSelectionRange(0, 5);
  });
  await value.press("ControlOrMeta+X");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("alpha");
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
  await page.evaluate(() => navigator.clipboard.writeText("paste&😀"));
  await value.press("ControlOrMeta+V");
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
  await page.getByRole("button", { name: "Apply URL" }).click();
  await expect(value).toBeDisabled();
  await expect(fullUrl).toHaveValue("/invalid");
});
