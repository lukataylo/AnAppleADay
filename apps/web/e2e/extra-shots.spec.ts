import { test, type Page } from "@playwright/test";

const DIR = "shots";
const opts = { animations: "disabled" as const };

async function consent(page: Page) {
  await page.goto("/");
  await page.getByTestId("consent-fed").click();
  await page.getByTestId("consent-accept").click();
  await page.getByTestId("consent-continue").click();
}

async function checkIn(page: Page, mood: number) {
  await page.getByTestId(`mood-${mood}`).click();
  await page.getByTestId("save-mood-only").click();
  await page.getByText("Check-in saved").waitFor();
}

test("14 gad7 anxiety", async ({ page }) => {
  await consent(page);
  await checkIn(page, 3);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-4").click(); // feeling anxious
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/14-gad7.png`, fullPage: true, ...opts });
});

test("15 urgent 111", async ({ page }) => {
  await consent(page);
  await checkIn(page, 3);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-2").click(); // headache
  await page.getByTestId("choice-1").click(); // no
  await page.getByTestId("choice-1").click(); // no
  await page.getByTestId("choice-1").click(); // no
  await page.getByTestId("choice-0").click(); // worse on exertion -> 111
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/15-urgent-111.png`, ...opts });
});

test("16 federated round", async ({ page }) => {
  await consent(page);
  for (const m of [4, 2, 5]) {
    await page.getByTestId(`mood-${m}`).click();
    await page.getByTestId("save-mood-only").click();
    await page.getByTestId("checkin-again").click();
  }
  await page.getByTestId("tab-trends").click();
  await page.getByTestId("flock-contribute").click();
  await page.getByTestId("flock-result").waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/16-federated.png`, fullPage: true, ...opts });
});
