# Compliance guardrails (build-time checklist)

These are baked into the specs, not added later. Full reasoning and citations are in docs/research/nhs-triage-and-legality.md.

## Stay out of medical-device scope
- Intended purpose stated narrowly as wellbeing logging and general signposting.
- Avoid device-trigger words in UI, marketing, and store listing: diagnose, screen, triage, monitor [condition], risk of [disease], predict.
- The question tree is signposting where the user keeps the decision (self-care, pharmacy, GP, 111, 999), not an automated interpretation that drives individual treatment.
- A visible "not a medical device, does not replace clinical advice" notice.

## Safety-netting (every branch ends safely)
- Red-flag answers route to 999 with the verbatim NHS wording.
- Persistent or urgent cases route to NHS 111.
- PHQ-9 item 9 of 1 or more triggers the self-harm pathway regardless of total, surfacing Samaritans 116 123 and urgent-help guidance.

## Data protection (UK GDPR, DPA 2018)
- Health data is special category. Lawful basis is explicit consent (Art 9(2)(a)), unbundled from terms and withdrawable.
- DPIA written before launch (see docs/dpia.md once drafted).
- Data minimisation: store derived features in local IndexedDB, never raw audio or video. Encryption at rest and TLS for any sync.
- Audit trail around the GP handoff export. Handoff is user-initiated and minimum-necessary.

## Emotion AI specifics
- Surface valence/arousal and geometric trends, not emotion verdicts or condition labels.
- Never deploy the emotion feature in workplace or education contexts (EU AI Act Art 5).
- Tell the user when face/voice signals are being analysed (transparency).

## If we later integrate with NHS or GP systems
- DCB0129/DCB0160 clinical safety process with a named Clinical Safety Officer and hazard log.
- DTAC and NICE Evidence Standards Framework apply.
