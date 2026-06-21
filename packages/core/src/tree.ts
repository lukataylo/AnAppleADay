import { redFlagsFor } from "./redflags";
import { createTree, type TriageNode, type TriageTree } from "./triage";

// Builds a chain of yes/no red-flag nodes for a symptom. A "yes" on any flag
// goes straight to a 999 outcome. A "no" falls through to the next flag, and
// the final "no" lands on `fallThroughId`.
function redFlagChain(
  symptom: string,
  idPrefix: string,
  fallThroughId: string,
): TriageNode[] {
  const flags = redFlagsFor(symptom);
  const nodes: TriageNode[] = [];
  flags.forEach((flag, i) => {
    const isLast = i === flags.length - 1;
    const noTarget = isLast ? fallThroughId : `${idPrefix}-${i + 1}`;
    nodes.push({
      id: `${idPrefix}-${i}`,
      kind: "choice",
      topic: symptom,
      prompt: flag.question,
      choices: [
        {
          label: "Yes",
          redFlag: true,
          to: {
            outcome: flag.disposition,
            reason: flag.question,
          },
        },
        { label: "No", to: noTarget },
      ],
    });
  });
  return nodes;
}

const STATIC_NODES: TriageNode[] = [
  // Entry: the easy question opens into "what stands out".
  {
    id: "root",
    kind: "choice",
    prompt: "Is anything bothering you today that you'd like to look into?",
    choices: [
      { label: "Chest pain or tightness", to: "chest-0" },
      { label: "Trouble breathing", to: "breath-0" },
      { label: "A headache", to: "head-0" },
      { label: "Low mood", to: "mood-0" },
      { label: "Feeling anxious or worried", to: "anx-instrument" },
      { label: "Feeling very tired", to: "fatigue-q" },
      { label: "A cough", to: "cough-q" },
      {
        label: "Nothing in particular",
        to: { outcome: "self-care", reason: "No specific concern reported." },
      },
    ],
  },

  // Low mood: red flags first, then PHQ-9.
  {
    id: "mood-instrument",
    kind: "instrument",
    topic: "low-mood",
    prompt:
      "A few quick questions about how you've felt over the last two weeks.",
    instrument: "phq9",
  },

  // Anxiety goes straight to GAD-7 (no acute red flag set).
  {
    id: "anx-instrument",
    kind: "instrument",
    topic: "anxiety",
    prompt: "A few quick questions about worry over the last two weeks.",
    instrument: "gad7",
  },

  // Fatigue: simple branch, routine only (NHS treats most fatigue as see-a-GP).
  {
    id: "fatigue-q",
    kind: "choice",
    topic: "fatigue",
    prompt: "Has the tiredness lasted for several weeks with no clear reason?",
    choices: [
      {
        label: "Yes",
        to: {
          outcome: "gp-routine",
          reason: "Tiredness lasting several weeks with no clear cause.",
        },
      },
      { label: "No", to: "fatigue-extra" },
    ],
  },
  {
    id: "fatigue-extra",
    kind: "choice",
    topic: "fatigue",
    prompt:
      "Along with the tiredness, do you have weight loss, a lot more thirst, or needing to pee much more than usual?",
    choices: [
      {
        label: "Yes",
        to: {
          outcome: "gp-routine",
          reason: "Tiredness with weight loss, thirst or frequent urination.",
        },
      },
      {
        label: "No",
        to: {
          outcome: "self-care",
          reason: "Short-lived tiredness without other warning signs.",
        },
      },
    ],
  },

  // Cough: red-flag-style branch using NHS cough wording.
  {
    id: "cough-q",
    kind: "choice",
    topic: "cough",
    prompt:
      "Is the cough very bad or getting worse quickly, are you coughing up blood, or do you feel very unwell?",
    choices: [
      {
        label: "Yes",
        redFlag: true,
        to: {
          outcome: "urgent-111",
          reason:
            "Severe or rapidly worsening cough, coughing up blood, or feeling very unwell.",
        },
      },
      { label: "No", to: "cough-duration" },
    ],
  },
  {
    id: "cough-duration",
    kind: "choice",
    topic: "cough",
    prompt: "Has the cough lasted more than three weeks?",
    choices: [
      {
        label: "Yes",
        to: {
          outcome: "gp-routine",
          reason: "Cough lasting more than three weeks.",
        },
      },
      {
        label: "No",
        to: {
          outcome: "self-care",
          reason: "Short-lived cough without warning signs.",
        },
      },
    ],
  },
];

// Red-flag chains feed into their follow-up nodes.
const CHEST = redFlagChain("chest-pain", "chest", "chest-followup");
const BREATH = redFlagChain("breathlessness", "breath", "breath-instrument");
const HEAD = redFlagChain("headache", "head", "head-followup");
const MOOD = redFlagChain("low-mood", "mood", "mood-instrument");

const FOLLOWUPS: TriageNode[] = [
  {
    id: "chest-followup",
    kind: "choice",
    topic: "chest-pain",
    prompt: "Does the chest pain come and go, and settle quickly on its own?",
    choices: [
      {
        label: "Yes, it comes and goes",
        to: {
          outcome: "gp-routine",
          reason: "Intermittent chest pain that settles, no emergency features.",
        },
      },
      {
        label: "No, it is constant",
        redFlag: true,
        to: {
          outcome: "urgent-111",
          reason: "Constant chest pain without emergency red flags.",
        },
      },
    ],
  },
  {
    id: "breath-instrument",
    kind: "instrument",
    topic: "breathlessness",
    prompt: "Which statement best describes your breathlessness day to day?",
    instrument: "mmrc",
  },
  {
    id: "head-followup",
    kind: "choice",
    topic: "headache",
    prompt:
      "Does the headache get worse when you cough, sneeze, bend down, or exercise, or come with vision problems or vomiting?",
    choices: [
      {
        label: "Yes",
        redFlag: true,
        to: {
          outcome: "urgent-111",
          reason:
            "Headache worse on exertion, or with vision problems or vomiting.",
        },
      },
      {
        label: "No",
        to: {
          outcome: "self-care",
          reason: "Headache without warning features.",
        },
      },
    ],
  },
];

export function buildTriageTree(): TriageTree {
  return createTree("root", [
    ...STATIC_NODES,
    ...CHEST,
    ...BREATH,
    ...HEAD,
    ...MOOD,
    ...FOLLOWUPS,
  ]);
}
