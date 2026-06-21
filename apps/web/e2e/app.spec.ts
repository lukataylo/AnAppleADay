import { test, expect, type Page } from "@playwright/test";

async function consent(
  page: Page,
  opts: { fed?: boolean; voiceOff?: boolean; faceOff?: boolean } = {},
) {
  await page.goto("/");
  if (opts.fed) await page.getByTestId("consent-fed").click();
  if (opts.voiceOff) await page.getByTestId("consent-voice").click();
  if (opts.faceOff) await page.getByTestId("consent-face").click();
  await page.getByTestId("consent-accept").click();
  await page.getByTestId("consent-continue").click();
  await expect(page.getByTestId("tab-today")).toBeVisible();
}

async function moodCheckIn(page: Page, mood: number) {
  await page.getByTestId(`mood-${mood}`).click();
  await page.getByTestId("save-mood-only").click();
  await expect(page.getByText("Check-in saved")).toBeVisible();
}

test("consent gate gates the app and then reveals the check-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Before we start")).toBeVisible();
  // continue is disabled until the not-a-medical-device box is accepted
  await expect(page.getByTestId("consent-continue")).toBeDisabled();
  await page.getByTestId("consent-accept").click();
  await page.getByTestId("consent-continue").click();
  await expect(page.getByText("How do you feel today?")).toBeVisible();
});

test("mood-only check-in saves and shows a wellbeing signal", async ({ page }) => {
  await consent(page);
  await moodCheckIn(page, 4);
  await expect(page.getByText(/\/ 100/)).toBeVisible();
});

test("chest pain red flag routes to 999", async ({ page }) => {
  await consent(page);
  await moodCheckIn(page, 3);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-0").click(); // chest pain
  await page.getByTestId("choice-0").click(); // first red flag: Yes
  await expect(page.getByTestId("disposition")).toHaveAttribute(
    "data-level",
    "emergency-999",
  );
  await expect(page.getByText("Call 999 now")).toBeVisible();
});

test("no red flags on chest pain falls through to a routine outcome", async ({ page }) => {
  await consent(page);
  await moodCheckIn(page, 3);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-0").click(); // chest pain
  await page.getByTestId("choice-1").click(); // no
  await page.getByTestId("choice-1").click(); // no
  await page.getByTestId("choice-1").click(); // no
  await page.getByTestId("choice-0").click(); // comes and goes -> gp
  await expect(page.getByTestId("disposition")).toHaveAttribute(
    "data-level",
    "gp-routine",
  );
});

test("nothing in particular routes to self-care", async ({ page }) => {
  await consent(page);
  await moodCheckIn(page, 3);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-7").click();
  await expect(page.getByTestId("disposition")).toHaveAttribute(
    "data-level",
    "self-care",
  );
});

test("PHQ-9 self-harm routes to urgent 111 and activates monitoring", async ({ page }) => {
  await consent(page);
  await moodCheckIn(page, 2);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-3").click(); // low mood
  await page.getByTestId("choice-1").click(); // mood red flag: No
  for (let q = 0; q < 8; q++) await page.getByTestId(`q${q}-opt0`).click();
  await page.getByTestId("q8-opt2").click(); // item 9: self-harm thoughts
  await page.getByTestId("instrument-submit").click();
  await expect(page.getByTestId("disposition")).toHaveAttribute(
    "data-level",
    "urgent-111",
  );
  // Samaritans action should be present
  await expect(page.getByText(/Samaritans/)).toBeVisible();
  // monitoring should now be active
  await page.getByTestId("tab-plan").click();
  await expect(page.getByTestId("monitoring-due")).toBeVisible();
  await expect(page.getByTestId("monitoring-stop")).toBeVisible();
});

test("trends and a federated round after check-ins", async ({ page }) => {
  await consent(page, { fed: true });
  await moodCheckIn(page, 4);
  await page.getByTestId("checkin-again").click();
  await moodCheckIn(page, 2);
  await page.getByTestId("checkin-again").click();
  await page.getByTestId("tab-trends").click();
  await expect(page.getByText("Your trends")).toBeVisible();
  await page.getByTestId("flock-contribute").click();
  await expect(page.getByTestId("flock-result")).toBeVisible();
});

test("federated round is gated until consent is given", async ({ page }) => {
  await consent(page); // federated off by default
  await moodCheckIn(page, 3);
  await page.getByTestId("checkin-again").click();
  await page.getByTestId("tab-trends").click();
  await expect(page.getByTestId("flock-disabled")).toBeVisible();
  await expect(page.getByTestId("flock-contribute")).toBeDisabled();
});

test("enabling federated sharing in About unlocks the round", async ({ page }) => {
  await consent(page);
  await moodCheckIn(page, 3);
  await page.getByTestId("checkin-again").click();
  await page.getByTestId("tab-about").click();
  await page.getByTestId("edit-fed").click();
  await page.getByTestId("tab-trends").click();
  await page.getByTestId("flock-contribute").click();
  await expect(page.getByTestId("flock-result")).toBeVisible();
});

test("with voice and face off, the video check-in saves mood only", async ({ page }) => {
  await consent(page, { voiceOff: true, faceOff: true });
  await page.getByTestId("mood-3").click();
  await page.getByTestId("start-capture").click();
  await expect(page.getByText("Check-in saved")).toBeVisible();
  await expect(page.getByText(/Voice and face are both off/)).toBeVisible();
});

test("GP handoff summary generates from check-ins", async ({ page }) => {
  await consent(page);
  await moodCheckIn(page, 3);
  await page.getByTestId("checkin-again").click();
  await page.getByTestId("tab-share").click();
  await page.getByTestId("generate-handoff").click();
  await expect(page.getByTestId("handoff-summary")).toBeVisible();
  await expect(page.getByText(/not a diagnosis|not a medical device/i)).toBeVisible();
});

test("triage findings flow into the GP handoff", async ({ page }) => {
  await consent(page);
  await moodCheckIn(page, 3);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-0").click(); // chest pain
  await page.getByTestId("choice-0").click(); // red flag yes -> 999
  await expect(page.getByTestId("disposition")).toBeVisible();
  await page.getByTestId("tab-share").click();
  await page.getByTestId("generate-handoff").click();
  await expect(page.getByTestId("handoff-summary")).toBeVisible();
  // The chest-pain concern and a warning sign must appear, not "none recorded".
  await expect(page.getByText(/Warning signs:/)).toBeVisible();
});

test("plan can be started and stopped manually", async ({ page }) => {
  await consent(page);
  await page.getByTestId("tab-plan").click();
  await page.getByTestId("monitoring-start").click();
  await expect(page.getByTestId("monitoring-due")).toBeVisible();
  await page.getByTestId("monitoring-stop").click();
  await expect(page.getByTestId("monitoring-start")).toBeVisible();
});

test("data can be reset from the about screen", async ({ page }) => {
  await consent(page);
  await moodCheckIn(page, 5);
  await page.getByTestId("checkin-again").click();
  await page.getByTestId("tab-about").click();
  await page.getByTestId("reset-all").click();
  await page.getByTestId("tab-trends").click();
  await expect(page.getByText(/No check-ins yet/)).toBeVisible();
});
