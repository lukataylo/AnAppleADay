# An Apple a Day

A local-first health companion. You answer one easy question, "How do you feel today?", on a short check-in. While you talk, the app reads voice and face signals on your own device, saves them, and builds a picture over time of whether you are trending better or worse. When something you say warrants it, the easy question opens into a structured NHS-style set of follow-up questions, and the app can switch on a gentle every-other-day check-in. None of this is a diagnosis. The output is a tidy summary you can choose to hand to your GP, so the appointment starts with the history already gathered.

Built for a hackathon across three briefs: codeplain (spec-driven build), bilt.me (mobile app and go-to-market), and FLock.io (decentralised, privacy-preserving AI for UK Sovereign AI).

## What is in here

A pnpm monorepo with one shared brain and two front ends.

- `packages/core` — the shared, platform-agnostic TypeScript core: the clinical instruments (PHQ-9, GAD-7, WHO-5, mMRC), the triage decision tree with red-flag safety-netting, the biomarker math, the trend math, the monitoring scheduler, and the GP-handoff builder. Covered by 66 Vitest unit tests. Both apps consume it, so the clinical logic can never drift between them.
- `apps/web` — the production web app: a Next.js installable PWA that runs the on-device ML in the browser (MediaPipe Face Landmarker for face signals, Web Audio for voice signals), stores everything locally in IndexedDB, and uses the Vercel AI SDK only to phrase the GP summary (the app is fully usable with no API key). Verified by 14 Playwright end-to-end tests, including a real camera-capture lifecycle.
- `apps/mobile` — the React Native (Expo) app: the same experience natively, with the dot-matrix eyes and gradient, on-device voice capture via expo-audio, and face signals via react-native-vision-camera in a dev client. Shares 100% of the clinical logic through `@apple/core`.
- `specs/` — the codeplain `.plain` specifications. `app.plain` is the source of truth; codeplain renders it into a working React app in `specs/generated/app`.
- `docs/` — sourced research (voice biomarkers, face markers, NHS triage, UK legality) and the build-time compliance guardrails.

## The core idea

One low-effort question keeps people checking in. Voice and face give objective signals that, tracked against a person's own baseline, show change a memory cannot. When an answer warrants it, the NHS-style tree pre-navigates the questions a GP would ask, with hard safety-netting (red flags route to 999, urgent cases to NHS 111, PHQ-9 self-harm responses to urgent help). The result cuts the gathering work out of a short GP appointment and builds longitudinal data, while never offering a diagnosis.

## Running it

Install once at the root:

```bash
pnpm install
```

Web app (the verified surface):

```bash
pnpm --filter @apple/web dev        # http://localhost:3000
pnpm --filter @apple/web build      # production build
pnpm --filter @apple/web exec playwright test   # end-to-end tests
```

Shared core tests:

```bash
pnpm --filter @apple/core test
```

Mobile app (needs a dev client for the on-device ML):

```bash
pnpm --filter @apple/mobile start          # Expo
# For real face/voice capture, add the native modules and prebuild:
#   pnpm --filter @apple/mobile add react-native-vision-camera \
#     react-native-vision-camera-face-detector react-native-worklets-core expo-audio
#   pnpm --filter @apple/mobile exec expo prebuild
```

Render the spec with codeplain (from the `specs` directory, with `CODEPLAIN_API_KEY` set):

```bash
cd specs && codeplain --headless --force-render --build-folder generated app.plain
```

## Privacy and safety

Voice and face are turned into a small set of numbers on the device. Raw audio and video are never stored or sent. The app is wellbeing logging and general signposting, not a medical device, and does not diagnose. See `docs/compliance.md` for the guardrails and `docs/research/nhs-triage-and-legality.md` for the reasoning and sources.
