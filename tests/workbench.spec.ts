import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import {
  createCapacityFixture,
  semanticFixture,
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

  await expect(page.getByText("13 Managed Pieces", { exact: true })).toBeVisible();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(13);
  await expect(page.getByLabel("Unicode Domain")).toHaveValue("faß.de");
  await expect(page.getByLabel("ASCII/Punycode Domain")).toHaveValue(
    "xn--fa-hia.de",
  );
  await expect(page.getByLabel("Path Segment 1 of 4")).toHaveValue("a%2Fb");
  await expect(page.getByText("Malformed percent text")).toBeVisible();

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
    await page.getByLabel("Key").evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    ),
  ).toEqual(Array.from({ length: 260 }, (_, index) => `parameter-${index}`));
  expect(Date.now() - start).toBeLessThan(1_000);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    320,
  );
  await expect(page.getByLabel("Key").last()).toHaveValue("parameter-259");
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
  await expect(page.getByText("3 Managed Pieces", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Complete HTTP or HTTPS Absolute URL")).toHaveValue("");
  await expect(page.getByText(/No session/)).toBeVisible();
});
