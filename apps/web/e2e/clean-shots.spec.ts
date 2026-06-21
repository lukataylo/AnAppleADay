import { test, type Page } from "@playwright/test";

const DIR = "shots";
const opts = { animations: "disabled" as const };

async function consent(page: Page) {
  await page.goto("/");
  await page.getByTestId("consent-fed").click();
  await page.getByTestId("consent-accept").click();
  await page.getByTestId("consent-continue").click();
}

test("consent", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/01-consent.png`, ...opts });
});

test("today", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-4").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/02-today.png`, ...opts });
});

test("saved", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-4").click();
  await page.getByTestId("save-mood-only").click();
  await page.getByText("Check-in saved").waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/03-saved.png`, ...opts });
});

test("triage999", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-3").click();
  await page.getByTestId("save-mood-only").click();
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-0").click();
  await page.getByTestId("choice-0").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/04-triage-999.png`, ...opts });
});

test("phq9", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-2").click();
  await page.getByTestId("save-mood-only").click();
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-3").click();
  await page.getByTestId("choice-1").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/05-phq9.png`, fullPage: true, ...opts });
});

test("trends", async ({ page }) => {
  await consent(page);
  for (const m of [4, 2, 5, 3]) {
    await page.getByTestId(`mood-${m}`).click();
    await page.getByTestId("save-mood-only").click();
    await page.getByTestId("checkin-again").click();
  }
  await page.getByTestId("tab-trends").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/06-trends.png`, fullPage: true, ...opts });
});

test("share", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-3").click();
  await page.getByTestId("save-mood-only").click();
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-0").click();
  await page.getByTestId("choice-0").click();
  await page.getByTestId("tab-share").click();
  await page.getByTestId("generate-handoff").click();
  await page.getByTestId("handoff-summary").waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/07-share.png`, fullPage: true, ...opts });
});

test("plan", async ({ page }) => {
  await consent(page);
  await page.getByTestId("tab-plan").click();
  await page.getByTestId("monitoring-start").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/08-plan.png`, ...opts });
});
