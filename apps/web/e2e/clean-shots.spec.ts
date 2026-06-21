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

test("01 consent", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/01-consent.png`, fullPage: true, ...opts });
});

test("02 today", async ({ page }) => {
  await consent(page);
  await page.getByTestId("mood-4").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/02-today.png`, ...opts });
});

test("03 capturing", async ({ page }) => {
  await page.addInitScript(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 240;
    const ctx = canvas.getContext("2d")!;
    let t = 0;
    setInterval(() => { t++; ctx.fillStyle = `hsl(${t % 360},45%,45%)`; ctx.fillRect(0, 0, 320, 240); }, 100);
    const vs = (canvas as HTMLCanvasElement).captureStream(10);
    // @ts-expect-error test override
    navigator.mediaDevices.getUserMedia = async (c: MediaStreamConstraints) => {
      const tracks: MediaStreamTrack[] = [];
      if (c.video) tracks.push(...vs.getVideoTracks());
      if (c.audio) {
        const ac = new AudioContext();
        const osc = ac.createOscillator(); osc.frequency.value = 150;
        const dest = ac.createMediaStreamDestination(); osc.connect(dest); osc.start();
        tracks.push(...dest.stream.getAudioTracks());
      }
      return new MediaStream(tracks);
    };
  });
  await consent(page);
  await page.getByTestId("mood-4").click();
  await page.getByTestId("start-capture").click();
  await page.getByText(/Listening/).waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${DIR}/03-capturing.png`, ...opts });
});

test("04 saved", async ({ page }) => {
  await consent(page);
  await checkIn(page, 4);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/04-saved.png`, ...opts });
});

test("05 triage entry", async ({ page }) => {
  await consent(page);
  await checkIn(page, 3);
  await page.getByTestId("open-triage").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/05-triage-entry.png`, fullPage: true, ...opts });
});

test("06 triage 999", async ({ page }) => {
  await consent(page);
  await checkIn(page, 3);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-0").click();
  await page.getByTestId("choice-0").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/06-triage-999.png`, ...opts });
});

test("07 phq9", async ({ page }) => {
  await consent(page);
  await checkIn(page, 2);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-3").click();
  await page.getByTestId("choice-1").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/07-phq9.png`, fullPage: true, ...opts });
});

test("08 self-care result", async ({ page }) => {
  await consent(page);
  await checkIn(page, 4);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-7").click(); // nothing in particular
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/08-self-care.png`, ...opts });
});

test("09 trends", async ({ page }) => {
  await consent(page);
  for (const m of [4, 2, 5, 3]) {
    await page.getByTestId(`mood-${m}`).click();
    await page.getByTestId("save-mood-only").click();
    await page.getByTestId("checkin-again").click();
  }
  await page.getByTestId("tab-trends").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/09-trends.png`, fullPage: true, ...opts });
});

test("10 plan inactive", async ({ page }) => {
  await consent(page);
  await page.getByTestId("tab-plan").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/10-plan-inactive.png`, ...opts });
});

test("11 plan active", async ({ page }) => {
  await consent(page);
  await page.getByTestId("tab-plan").click();
  await page.getByTestId("monitoring-start").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/11-plan-active.png`, ...opts });
});

test("12 share handoff", async ({ page }) => {
  await consent(page);
  await checkIn(page, 3);
  await page.getByTestId("open-triage").click();
  await page.getByTestId("choice-0").click();
  await page.getByTestId("choice-0").click();
  await page.getByTestId("tab-share").click();
  await page.getByTestId("generate-handoff").click();
  await page.getByTestId("handoff-summary").waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/12-share.png`, fullPage: true, ...opts });
});

test("13 about", async ({ page }) => {
  await consent(page);
  await checkIn(page, 4);
  await page.getByTestId("checkin-again").click();
  await page.getByTestId("tab-about").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/13-about.png`, fullPage: true, ...opts });
});
