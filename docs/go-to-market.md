# Go-to-market plan

The landing page in `/landing` is the front door for this plan. The goal for the
hackathon is not a big launch, it is a handful of real people outside the team
who sign up and tell us why they would use it. That signal is worth more than a
polished pitch.

## Who we are for first

We are not chasing everyone at once. The first wedge is people who already have a
reason to check in often:

- People managing low mood or anxiety who have been told to "keep an eye on it"
  but have no structured way to do so between appointments.
- People with a long-term respiratory condition tracking breathlessness over time.
- Family carers who want an early, gentle warning when someone they look after is
  drifting the wrong way.

These groups feel the pain weekly, not yearly, so a daily habit actually sticks.
GPs and the NHS are the second-order buyer: the value to them is the
pre-navigated question tree and the longitudinal handoff, which is the eventual
business case.

## The promise, in one line

A thirty-second check-in that turns "how are you?" into health data you own,
with a summary your GP can actually use. Local-first, never a diagnosis.

## Why someone acts now

- It is genuinely low effort. One question, one tap.
- It respects them. Nothing leaves the phone, and it refuses to fake a diagnosis.
- It pays off later. The trend and the GP summary are the reward for showing up.

## The funnel

1. Land on the page. The animated face and one clear sentence do the work.
2. Either try the live check-in or join the waitlist with an email.
3. Waitlist email goes to a Formspree form (free tier). Set `FORMSPREE_ENDPOINT`
   in `landing/index.html` to your form URL to start collecting.
4. Follow up within a day with a short note: one question about what would make it
   useful for them. The reply is the real signal.

Metric that matters for the hackathon: number of signups from outside the team,
and how many reply to the follow-up. Even five thoughtful replies beats a
thousand anonymous clicks.

## Channels to get the first dozen

- Direct messages to people who fit the wedge, with the link and a one-line ask.
- One post in a relevant community (a mental-health support forum, a carers'
  group, a quantified-self or digital-health subreddit) framed as "would you use
  this, and what is missing?" rather than a launch.
- The hackathon room itself: judges and other teams are a fast first cohort.

## What we charge, eventually

Free for individuals. The revenue is on the clinical side: a per-seat tool for
GP practices and NHS trusts that ingests the consented handoff and saves
appointment time, sold against the cost of those minutes. Federated learning via
FLock is the trust story that makes an NHS sale possible, because the model
improves without patient data ever being centralised.

## Deploying the landing page

It is a single static file. Deploy `/landing` to Vercel (or any static host):

```bash
cd landing && npx vercel --prod
```

Point a short domain at it for the demo. Set the Formspree endpoint first so the
waitlist actually captures emails.

## Honest risks

- Engagement decay: daily habits are hard. The every-other-day prompt and the
  visible trend are the retention mechanics; they need testing with real users.
- Trust: a health app reading face and voice has to over-deliver on privacy. The
  local-first design and the plain "not a medical device" framing are the answer,
  and they must stay front and centre.
- Regulation: anything that drifts toward triage or diagnosis becomes a regulated
  device. The product stays on the wellbeing-and-signposting side of that line on
  purpose (see `compliance.md`).
