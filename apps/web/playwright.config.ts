import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 390, height: 844 },
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm exec next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 90000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
