# An Apple a Day — build plan

A local-first health companion. You answer one easy question, "How do you feel today?", on a short video check-in. While you talk, the app reads voice and face signals on your own device and saves them. Over weeks it builds a picture of whether you are trending better or worse. When something you say warrants it, the easy question opens into a structured NHS-style set of follow-up questions, and the app can switch on a gentle every-other-day check-in so it keeps watching. None of this is a diagnosis. The output is a tidy summary you can choose to hand to your GP, so a 15-minute appointment starts with the history already gathered instead of being spent gathering it.

This document is the plan, not the spec. The specs live in the `.plain` files under `specs/`, which are the source of truth for what codeplain renders.

## What we are optimising for

The three hackathon briefs we are entering, and how each is judged:

1. codeplain. Judged on quality of spec-driven setup, presentation, innovation, and a little charm. The deliverable that counts is the `.plain` files plus configs in a public repo, with codeplain genuinely used as the primary build tool.
2. bilt.me. Build a working mobile app on bilt.me, then show who it is for, how they find it, and why they pay. Bonus for any real signups from outside the team.
3. FLock.io. Decentralised, privacy-preserving AI for UK Sovereign AI. We fit the "Public Sector and Citizen Services" track (healthcare support) and "Trusted Data and AI Infrastructure" (federated learning without sharing raw data).

You chose breadth of features and the federated FLock angle, with a local-first model where an LLM is optional. The plan reflects that.

## The one real architecture decision

codeplain on your machine renders a React plus Vite web app from the `typescript-react-app-template`, and that output is a mobile-first Progressive Web App you install to the home screen. bilt.me, by contrast, generates React Native. They do not share a codebase.

Rather than force one tool to do the other's job, we let each do what it is good at, with the `.plain` spec as the shared definition both follow.

- codeplain renders the real product: a React PWA. This is also the technically correct home for our biomarkers, because the open on-device models we researched run in the browser. MediaPipe Face Landmarker runs in WebAssembly and WebGL. Voice features come from the Web Audio API. Whisper has a working browser build. A PWA gives us camera, microphone, local storage, and install-to-home-screen without app-store friction. This is the app the judges actually use, and it backs the "entirely local" claim honestly, since the analysis never leaves the device.
- bilt.me produces the native mobile face of the same product for that brief and for the App Store and QR-code demo. We drive it from the same `.plain` specification, fed in as the natural-language description, and refine in its live simulator. bilt.me has an MCP integration, so once its MCP server is connected to this session, the build can be agent-driven against the same spec.

The net result. One specification, one product story, two delivery surfaces. The PWA is the source of truth for behaviour and the real on-device ML. bilt.me is the native packaging and the mobile-app deliverable.

If you would rather have a single React Native codebase end to end, the alternative is to skip the codeplain web template and drive bilt.me alone, but then we weaken the codeplain brief, where the whole point is spec-rendered code. I recommend the two-surface approach above. Flag it if you disagree and I will rework the plan.

## Spec structure (the .plain files)

codeplain wants concepts defined before use, wrapped in colons like `:Check-in:`, and grouped under `***definitions***`, `***functional specs***`, and optionally `***implementation reqs***`, `***test reqs***`, and nested `***acceptance tests***`. We import the shared `typescript-react-app-template` you already use.

Planned modules under `specs/`:

- `domain.plain`. Shared concepts with no UI. Things like `:Check-in:`, `:Voice-signal:`, `:Face-signal:`, `:Daily-point:`, `:Baseline:`, `:Trend:`, `:Question-node:`, `:Red-flag:`, `:Disposition:` (the care-level outcome, for example self-care, pharmacy, GP, 111, or 999), `:Monitoring-plan:`, `:Consent-record:`, and `:Handoff-summary:`. Imported by the others.
- `app.plain`. The shell. Mobile-first single column, top header, bottom navigation, the gradient background, and routing between screens. This mirrors the structure proven in your Golden Coffee spec.
- `checkin.plain`. The core loop. The dot-matrix voice eyes, the single daily question, microphone and camera capture, on-device feature extraction, and writing one `:Daily-point:` to local storage.
- `triage.plain`. The escalation tree. The encoded question nodes (PHQ-9, GAD-7, SOCRATES, red-flag screens), safety-netting on every branch, and the resulting `:Disposition:`.
- `monitoring.plain`. The every-other-day follow-up scheduling and reminders.
- `trends.plain`. The longitudinal view. Charts of each signal against the user's own `:Baseline:`, framed as change over time rather than scores.
- `handoff.plain`. The user-initiated, consented GP summary export.
- `consent.plain`. Onboarding, explicit unbundled consent for voice and face capture, and the "not a medical device" framing.

Each module that codeplain renders gets a matching `config.yaml` with `build-dest`, `template-dir`, and a unit-test script, following the convention in the example repos.

## Tech per layer, all in the browser

- Face. MediaPipe Face Landmarker (Tasks Vision, WASM and WebGL). It gives 478 landmarks and 52 blendshapes in real time at a few megabytes. From these we derive blink rate via the Eye Aspect Ratio (a fatigue signal), smile intensity, head pose, and left-versus-right facial asymmetry. We surface valence and arousal trends rather than an emotion label, because the science does not support reliable emotion inference and the law is hostile to claiming it.
- Voice. Web Audio API to capture the call, with a lightweight feature extractor (Meyda or a small WASM build) for the acoustic set: fundamental frequency, jitter, shimmer, harmonics-to-noise ratio, loudness, and MFCCs. Whisper-tiny in the browser is a stretch goal for transcript-derived metrics like speech rate and pause ratio. The honest, impressive part is plotting these real features over repeated check-ins.
- The "model". A small classifier or transparent heuristic over the extracted features that outputs a relative trend against the user's baseline, never an absolute clinical verdict. Kept tiny and shipped with the app.
- Storage. Local first, in IndexedDB. We store derived features, not raw audio or video, which is both the privacy-correct choice and the data-minimisation requirement under UK GDPR.

## Clinical content and legal guardrails, baked into the spec

The research is clear that automated triage plus monitoring plus emotion inference puts a health app at real risk of being a regulated medical device, and that a disclaimer alone does not save you if the wording implies diagnosis. So the guardrails are part of the spec from the start, not bolted on.

- We use the public-domain instruments verbatim: PHQ-9 and GAD-7 with their scoring bands, SOCRATES for symptom history, WHO-5 for wellbeing, and the mMRC breathlessness scale. We do not reuse NHS Pathways, which is licensed and itself a Class 1 device.
- Every branch of the question tree ends in plain signposting where the user keeps the decision. Red-flag answers route to 999. Persistent or urgent cases route to 111. PHQ-9 item 9 above zero triggers the self-harm safety pathway regardless of total score.
- Wording avoids the device-trigger words such as diagnose, screen, triage, or risk-of in the user-facing copy and the store listing. We describe the product as wellbeing logging and general signposting.
- Consent for voice and face capture is explicit, unbundled from the terms, and withdrawable. We write a short DPIA-style note in `docs/` covering health data as special category, the lawful basis, and data minimisation.
- A clear "not a medical device, does not replace clinical advice" notice is present, and the GP handoff is user-initiated and minimum-necessary.

These are documented in `docs/clinical-safety.md` and `docs/compliance.md`, drawn from the research reports already saved.

## The FLock.io federated angle

The local-first design is the perfect setup for federated learning, because raw data never leaves the phone by definition. The story for the sovereignty brief: each device improves the shared trend model from its own check-ins and contributes only model updates, never voice or video, coordinated through FLock. That keeps health data sovereign to the citizen while still letting the model get better across a population, which is exactly the "collaborate without sharing sensitive data" pitch.

For the build we wire a real FLock client if the API key and time allow, and otherwise ship a clearly labelled federated-client stub with the architecture in place, since you asked to design for it either way. We will confirm the exact FLock APIs against their docs before writing that module.

## Quality and verification (applies to every feature)

These rules govern the whole build, not just the end.

- No feature is signed off by the agent that built it. Each piece is checked by a separate adversarial verifier whose job is to find faults and try to refute that it works, not to confirm it.
- We build the maximally feature-rich version. No dead buttons, unwired controls, placeholder handlers, or half-finished functions. Anything visible in the UI does something real.
- Every milestone ends with a non-AI QA gate. Playwright drives the actual app (camera and microphone permission flows mocked where needed, real DOM and storage assertions) and must pass before the milestone is considered done.
- Visual review uses a grid overlay on screenshots so alignment, spacing, and the dot-matrix geometry can be checked properly.
- The finish has to match the reference app's clean, modern feel. The gradient, the eyes, typography, and spacing are part of the deliverable, not an afterthought.

## Day-by-day

Day 1. Lock the spec and scaffold. Write `domain.plain` and `app.plain`, render with codeplain against your key, and confirm the toolchain end to end. Port the dot-matrix eyes and gradient into web SVG and CSS. Commit research and compliance docs.

Day 2. The core check-in loop. `checkin.plain` rendered, camera and microphone capture working, MediaPipe and Web Audio feature extraction producing real numbers, one daily point saved locally.

Day 3. Escalation and monitoring. `triage.plain` with the encoded instruments and safety-netting, and `monitoring.plain` for the every-other-day follow-up. Consent and disclaimer flows.

Day 4. Longitudinal view and handoff. `trends.plain` charts against baseline, `handoff.plain` GP summary, and the FLock federated client or its stub.

Day 5. bilt.me build and polish. Generate the native surface on bilt.me from the spec, get the QR demo and shareable preview working, prepare the presentation, and start gathering the real-world signal the bilt.me brief rewards, for example a simple signup page shared outside the team.

## What I need from you

- codeplain key. Received and stored in `.env` (gitignored). Noted that it rotates in about 24 hours, so re-paste when it expires.
- bilt.me. To drive it from here, connect the bilt.me MCP server to this Claude Code session, or tell me you will build in the bilt.me web app yourself using the spec as the prompt. Either works.
- FLock.io. An API key when you want the real federated client rather than the stub.
- Optional only. An Anthropic API key if you want the GP-summary wording generated by an LLM. The triage logic itself stays local and deterministic, so this is purely for nicer phrasing.

## Open questions and risks

- The codeplain web template renders React for the browser, so the dot-matrix eyes get reimplemented in web SVG rather than react-native-svg. The geometry is identical, so this is low risk.
- Real on-device voice biomarkers in pure browser are lighter than the openSMILE iOS path from the research. We get genuine acoustic features from Meyda, and treat the heavier clinical-grade extraction as the escalation path we describe rather than ship.
- bilt.me and codeplain do not interoperate directly. The two-surface plan above is the deliberate answer to that, but it is the main thing to sanity-check before we start building.
