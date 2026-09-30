import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const semanticFixture =
  "https://user:pass@faß.de:8443/a%2Fb//tail/?dup=1&dup=2&key&key=&=empty&&encoded=a%26b%3Dc&bad=%zz#frag%23ment";

const capacityFixture = () => {
  const entries = Array.from(
    { length: 260 },
    (_, index) => `parameter-${index}=${"x".repeat(64)}-${index}`,
  );
  const base = `https://example.com/deep/path?${entries.join("&")}#capacity`;
  return base + "x".repeat(Math.max(0, 20_000 - base.length));
};

test("intake preserves lossless semantics and rejects replacement", async ({ page }) => {
  await page.goto("/");
  const requestsAfterLoad: string[] = [];
  const unsafeDiagnostics: string[] = [];
  page.on("request", (request) => requestsAfterLoad.push(request.url()));
  page.on("console", (message) => {
    if (/faß\.de|dup=1|frag%23ment/.test(message.text())) {
      unsafeDiagnostics.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (/faß\.de|dup=1|frag%23ment/.test(error.message)) {
      unsafeDiagnostics.push(error.message);
    }
  });
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
  expect(unsafeDiagnostics).toEqual([]);
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
    .fill(capacityFixture());
  const start = Date.now();
  await page.getByRole("button", { name: "Apply URL" }).click();
  await expect(page.locator("#managed-pieces > li")).toHaveCount(263);
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
