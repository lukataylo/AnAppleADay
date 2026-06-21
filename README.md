# An Apple a Day

**A thirty-second check-in that turns "how are you?" into health data you own.**

Most people cannot tell you how they felt last Tuesday. A GP gets fifteen minutes and spends a third of it just gathering the story. And the richest early signals of how someone is doing, the steadiness of their voice, how tired their face looks, whether their mood is drifting, go uncaptured because no one is measuring them day to day.

An Apple a Day asks one easy question, "How do you feel today?", and listens. While you answer, it reads voice and face signals on your own device and saves a few numbers, never the recording. Over weeks it learns your normal and shows you when you are drifting from it. When something you say warrants it, the easy question opens into the same structured questions a clinician would ask, with hard safety-netting built in. When you are ready, it hands your GP a tidy summary so the appointment starts where it should: with the history already gathered.

It is local-first, it is honest about what it can and cannot know, and it never gives a diagnosis.

## Why this matters

The insight is that the cheapest question gets the most answers. One tap a day keeps people checking in, and consistency is what makes longitudinal signal possible. Voice and face give objective markers that, tracked against a person's own baseline, reveal change a memory cannot. The structured follow-up pre-navigates the NHS question tree, so the work that usually eats a GP appointment is already done. And because everything runs on the device, the privacy promise is real rather than a policy.

This is built for three hackathon briefs at once:

- **codeplain** — spec-driven development. `specs/app.plain` is the source of truth, and codeplain renders it into a working app.
- **bilt.me** — a real mobile app plus a credible plan for how people find it, use it, and pay.
- **FLock.io** — decentralised, privacy-preserving AI for UK Sovereign AI. The model improves from everyone's check-ins without anyone sharing their data.

## What it does

- One-tap daily check-in with a friendly dot-matrix face that reacts to your voice.
- On-device voice signals (steadiness, pauses, clarity) and face signals (blink rate, smile, head pose, symmetry). Raw audio and video never leave the device.
- An NHS-style triage tree using public-domain instruments (PHQ-9, GAD-7, WHO-5, mMRC) with verbatim NHS red-flag wording. Red flags route to 999, urgent cases to NHS 111, and any sign of self-harm to urgent help with the Samaritans number.
- Every-other-day follow-up that switches on automatically when something is worth watching, because most people do not remember to come back on their own.
- Longitudinal trends shown against your own baseline, framed as signals over time, not scores and not diagnoses.
- A consented GP-handoff summary you choose to share.
- A FLock federated layer: your device contributes a small model update, never your data.

## How it is built

A pnpm monorepo with one shared brain and two front ends.

- `packages/core` — the platform-agnostic clinical core both apps share: instruments, the triage tree with safety-netting, biomarker math, trend math, the monitoring scheduler, and the handoff builder. Covered by 66 unit tests, so the clinical logic cannot drift between platforms.
- `apps/web` — the production web app: a Next.js installable PWA that runs the on-device ML in the browser (MediaPipe Face Landmarker and Web Audio), stores everything in IndexedDB, and uses the Vercel AI SDK only to phrase the GP summary. Verified by 22 Playwright end-to-end tests, including a real camera-capture lifecycle.
- `apps/mobile` — the React Native (Expo) app: the same experience natively, sharing 100% of the clinical logic.
- `specs/` — the codeplain `.plain` specification and the app it renders.
- `docs/` — sourced research (voice biomarkers, face markers, NHS triage, UK legality) and the build-time compliance guardrails.
- `landing/` — the marketing landing page and the go-to-market plan in `docs/go-to-market.md`.

Every part was checked by a separate adversarial reviewer, not signed off by its author, and the external tests caught real bugs that reading the code did not.

## Try it

```bash
pnpm install
pnpm --filter @apple/web dev          # http://localhost:3000
pnpm --filter @apple/core test        # 66 unit tests
pnpm --filter @apple/web exec playwright test   # end-to-end
```

Deploying the web app to Vercel: import this repo at vercel.com. The root
`vercel.json` already sets the monorepo build, so no settings are needed.

## Safety and privacy

An Apple a Day is wellbeing logging and general signposting. It is not a medical
device, it does not diagnose, and it does not replace a clinician. Voice and face
become a small set of numbers on your device; the originals are never stored or
sent. See `docs/compliance.md` for the guardrails and
`docs/research/nhs-triage-and-legality.md` for the reasoning and sources. Not
affiliated with the NHS.
