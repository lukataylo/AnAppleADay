# Specs (codeplain)

These are the spec-driven part of the project. `app.plain` is written in Plain,
codeplain's structured-English specification language, and codeplain renders it
into working code. The spec is the source of truth.

## Files

- `app.plain` — the full specification of An Apple a Day: the concepts, the
  implementation requirements, the test requirements, and every functional
  spec (consent, the daily check-in, the dot-matrix eyes, the NHS-style triage
  tree with red-flag safety-netting, PHQ-9 and GAD-7, dispositions, monitoring,
  trends, the FLock federated card, the GP handoff, and the about screen). It
  imports the `typescript-react-app-template`.
- `domain.plain` — the shared domain vocabulary, kept as readable documentation
  of the model.
- `generated/app` — the code codeplain rendered from `app.plain` (16
  functionalities). This is committed so the spec-to-code result is visible.

## Rendering

```bash
export CODEPLAIN_API_KEY=...        # your key
cd specs
codeplain --headless --force-render --build-folder generated app.plain
```

codeplain resolves the spec by bare filename from the current directory, so run
it from inside `specs`. Each functional requirement is rendered in order, with
generated unit tests, into `generated/app`.

## Relationship to the apps

codeplain owns the spec and the rendered reference implementation. The
production web app in `apps/web` is the same product taken further (real
in-browser MediaPipe and Web Audio capture, IndexedDB, the Vercel AI SDK, PWA
install, and Playwright tests), sharing the clinical logic through
`@apple/core`. Keeping the spec and the hand-finished app side by side is
deliberate: the spec stays the readable source of truth, the app stays the
polished surface.
