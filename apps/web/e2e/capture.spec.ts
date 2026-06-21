import { test, expect } from "@playwright/test";

// Drives the real capture lifecycle by injecting a synthetic MediaStream
// (canvas video + oscillator audio) in place of getUserMedia. This proves the
// fix for the bug where the video ref was read before the element mounted: the
// stream must attach to the <video>, voice features must be extracted over the
// twelve-second take, and a check-in must save. It does not rely on a real
// camera or network model download.

test("a real video check-in runs the capture pipeline and saves features", async ({
  page,
}) => {
  test.setTimeout(60000);

  await page.addInitScript(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d")!;
    let t = 0;
    setInterval(() => {
      t += 1;
      ctx.fillStyle = `hsl(${t % 360}, 50%, 50%)`;
      ctx.fillRect(0, 0, 320, 240);
    }, 100);
    const videoStream = (canvas as HTMLCanvasElement).captureStream(10);

    // @ts-expect-error override for test
    navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
      const tracks: MediaStreamTrack[] = [];
      if (constraints.video) tracks.push(...videoStream.getVideoTracks());
      if (constraints.audio) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ac = new AC();
        const osc = ac.createOscillator();
        osc.frequency.value = 150;
        const dest = ac.createMediaStreamDestination();
        osc.connect(dest);
        osc.start();
        tracks.push(...dest.stream.getAudioTracks());
      }
      return new MediaStream(tracks);
    };
  });

  await page.goto("/");
  await page.getByTestId("consent-accept").click();
  await page.getByTestId("consent-continue").click();
  await page.getByTestId("mood-4").click();
  await page.getByTestId("start-capture").click();

  // The capturing screen shows the live countdown.
  await expect(page.getByText(/Listening/)).toBeVisible({ timeout: 10000 });
  // The video element receives the injected stream (the C1 regression guard).
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const v = document.querySelector("video") as HTMLVideoElement | null;
          return !!(v && v.srcObject);
        }),
      { timeout: 8000 },
    )
    .toBe(true);

  // After the take, a check-in is saved with extracted voice features.
  await expect(page.getByText("Check-in saved")).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/Voice: pitch/)).toBeVisible();
});
