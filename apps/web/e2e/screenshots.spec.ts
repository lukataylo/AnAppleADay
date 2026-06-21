import { test, type Page } from "@playwright/test";

// Visual capture with a grid overlay for alignment review. Not an assertion
// suite; run with: pnpm exec playwright test screenshots
const DIR = "screenshots";

async function grid(page: Page) {
  await page.evaluate(() => {
    if (document.querySelector(".grid-overlay")) return;
    const d = document.createElement("div");
    d.className = "grid-overlay";
    document.body.appendChild(d);
  });
}

async function consent(page: Page) {
  await page.goto("/");
  await page.getByTestId("consent-accept").click();
  await page.getByTestId("consent-continue").click();
}

test("capture consent", async ({ page }) => {
  await page.goto("/");
  await grid(page);
  await page.screenshot({ path: `${DIR}/01-consent.png` });
});

test("capture today", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-4").click();
  await grid(page);
  await page.screenshot({ path: `${DIR}/02-today.png` });
});

test("capture saved", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-4").click();
  await page.getByTestId("save-mood-only").click();
  await page.getByText("Check-in saved").waitFor();
  await grid(page);
  await page.screenshot({ path: `${DIR}/03-saved.png` });
});

test("capture triage 999", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-3").click();
  await page.getByTestId("save-mood-only").click();
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-0").click();
  await page.getByTestId("choice-0").click();
  await grid(page);
  await page.screenshot({ path: `${DIR}/04-triage-999.png` });
});

test("capture phq9", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-2").click();
  await page.getByTestId("save-mood-only").click();
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-3").click();
  await page.getByTestId("choice-1").click();
  await grid(page);
  await page.screenshot({ path: `${DIR}/05-phq9.png`, fullPage: true });
});

test("capture trends", async ({ page }) => {
  await consent(page);
  for (const m of [4, 2, 5]) {
    await page.getByTestId(`mood-${m}`).click();
    await page.getByTestId("save-mood-only").click();
    await page.getByTestId("checkin-again").click();
  }
  await page.getByTestId("tab-trends").click();
  await page.waitForTimeout(500);
  await grid(page);
  await page.screenshot({
    path: `${DIR}/06-trends.png`,
    fullPage: true,
    animations: "disabled",
  });
});

test("capture share", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-3").click();
  await page.getByTestId("save-mood-only").click();
  await page.getByTestId("checkin-again").click();
  await page.getByTestId("tab-share").click();
  await page.getByTestId("generate-handoff").click();
  await page.getByTestId("handoff-summary").waitFor();
  await grid(page);
  await page.screenshot({ path: `${DIR}/07-share.png`, fullPage: true });
});
