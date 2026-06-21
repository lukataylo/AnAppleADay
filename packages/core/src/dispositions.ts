import type { Disposition, DispositionLevel } from "./types";

// Canonical NHS signposting contacts.
const CALL_999 = { label: "Call 999", kind: "call" as const, value: "999" };
const CALL_111 = { label: "Call 111", kind: "call" as const, value: "111" };
const NHS_111_ONLINE = {
  label: "NHS 111 online",
  kind: "link" as const,
  value: "https://111.nhs.uk/",
};
const SAMARITANS = {
  label: "Samaritans 116 123",
  kind: "call" as const,
  value: "116123",
};

interface Template {
  title: string;
  detail: string;
  urgent: boolean;
  actions: Disposition["actions"];
}

const TEMPLATES: Record<DispositionLevel, Template> = {
  "emergency-999": {
    title: "Call 999 now",
    detail:
      "Your answers match signs that need emergency help. Call 999 or go to A&E now. Do not wait.",
    urgent: true,
    actions: [CALL_999],
  },
  "urgent-111": {
    title: "Contact NHS 111",
    detail:
      "This sounds like it needs to be looked at soon. Contact NHS 111 for urgent advice.",
    urgent: true,
    actions: [CALL_111, NHS_111_ONLINE],
  },
  "gp-routine": {
    title: "See your GP",
    detail:
      "It would be worth booking a routine appointment with your GP to talk this through.",
    urgent: false,
    actions: [
      {
        label: "Find a GP",
        kind: "link",
        value: "https://www.nhs.uk/service-search/find-a-gp",
      },
    ],
  },
  pharmacy: {
    title: "Ask a pharmacist",
    detail:
      "A pharmacist can give advice and treatment for many everyday symptoms without an appointment.",
    urgent: false,
    actions: [
      {
        label: "Find a pharmacy",
        kind: "link",
        value: "https://www.nhs.uk/service-search/pharmacy/find-a-pharmacy",
      },
    ],
  },
  "self-care": {
    title: "Self-care for now",
    detail:
      "There is nothing here that needs urgent attention. Keep checking in, and see your GP if things change or do not settle.",
    urgent: false,
    actions: [{ label: "How you can look after yourself", kind: "info" }],
  },
};

/** Rank from most to least urgent, used to keep the worst outcome. */
export const URGENCY_ORDER: DispositionLevel[] = [
  "emergency-999",
  "urgent-111",
  "gp-routine",
  "pharmacy",
  "self-care",
];

export function dispositionFor(
  level: DispositionLevel,
  reason?: string,
): Disposition {
  const t = TEMPLATES[level];
  const actions = [...t.actions];
  if (
    reason &&
    /self-harm|harmed? your|hurting|better off dead|keep yourself safe/i.test(
      reason,
    )
  ) {
    actions.push(SAMARITANS);
  }
  return {
    level,
    title: t.title,
    detail: t.detail,
    reason,
    actions,
    urgent: t.urgent,
  };
}

/** Returns whichever disposition is more urgent. */
export function moreUrgent(a: Disposition, b: Disposition): Disposition {
  return URGENCY_ORDER.indexOf(a.level) <= URGENCY_ORDER.indexOf(b.level)
    ? a
    : b;
}

export function isMoreUrgent(
  a: DispositionLevel,
  b: DispositionLevel,
): boolean {
  return URGENCY_ORDER.indexOf(a) < URGENCY_ORDER.indexOf(b);
}
