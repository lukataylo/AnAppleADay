import type { Disposition, InstrumentId, Severity } from "./types";
import { dispositionFor } from "./dispositions";

export interface InstrumentItem {
  id: string;
  text: string;
}

export interface InstrumentOption {
  label: string;
  value: number;
}

export interface Instrument {
  id: InstrumentId;
  name: string;
  stem: string;
  items: InstrumentItem[];
  options: InstrumentOption[];
  /** Higher score is worse, except WHO-5 where higher is better. */
  higherIsWorse: boolean;
}

const FREQ_OPTIONS: InstrumentOption[] = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

// PHQ-9 (public domain). Stem and items verbatim.
export const PHQ9: Instrument = {
  id: "phq9",
  name: "PHQ-9",
  stem: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
  higherIsWorse: true,
  options: FREQ_OPTIONS,
  items: [
    { id: "phq1", text: "Little interest or pleasure in doing things" },
    { id: "phq2", text: "Feeling down, depressed, or hopeless" },
    {
      id: "phq3",
      text: "Trouble falling or staying asleep, or sleeping too much",
    },
    { id: "phq4", text: "Feeling tired or having little energy" },
    { id: "phq5", text: "Poor appetite or overeating" },
    {
      id: "phq6",
      text: "Feeling bad about yourself, or that you are a failure or have let yourself or your family down",
    },
    {
      id: "phq7",
      text: "Trouble concentrating on things, such as reading the newspaper or watching television",
    },
    {
      id: "phq8",
      text: "Moving or speaking so slowly that other people could have noticed, or the opposite, being so fidgety or restless that you have been moving around a lot more than usual",
    },
    {
      id: "phq9",
      text: "Thoughts that you would be better off dead, or of hurting yourself in some way",
    },
  ],
};

// GAD-7 (public domain).
export const GAD7: Instrument = {
  id: "gad7",
  name: "GAD-7",
  stem: "Over the last 2 weeks, how often have you been bothered by the following problems?",
  higherIsWorse: true,
  options: FREQ_OPTIONS,
  items: [
    { id: "gad1", text: "Feeling nervous, anxious, or on edge" },
    { id: "gad2", text: "Not being able to stop or control worrying" },
    { id: "gad3", text: "Worrying too much about different things" },
    { id: "gad4", text: "Trouble relaxing" },
    { id: "gad5", text: "Being so restless that it is hard to sit still" },
    { id: "gad6", text: "Becoming easily annoyed or irritable" },
    { id: "gad7", text: "Feeling afraid, as if something awful might happen" },
  ],
};

// WHO-5 Wellbeing Index. Positively framed: higher is better.
export const WHO5: Instrument = {
  id: "who5",
  name: "WHO-5",
  stem: "Over the past two weeks...",
  higherIsWorse: false,
  options: [
    { label: "At no time", value: 0 },
    { label: "Some of the time", value: 1 },
    { label: "Less than half the time", value: 2 },
    { label: "More than half the time", value: 3 },
    { label: "Most of the time", value: 4 },
    { label: "All of the time", value: 5 },
  ],
  items: [
    { id: "who1", text: "I have felt cheerful and in good spirits" },
    { id: "who2", text: "I have felt calm and relaxed" },
    { id: "who3", text: "I have felt active and vigorous" },
    { id: "who4", text: "I woke up feeling fresh and rested" },
    {
      id: "who5",
      text: "My daily life has been filled with things that interest me",
    },
  ],
};

// mMRC breathlessness scale, a single grade 0..4.
export const MMRC: Instrument = {
  id: "mmrc",
  name: "mMRC breathlessness",
  stem: "Which statement best describes your breathlessness?",
  higherIsWorse: true,
  options: [],
  items: [
    {
      id: "mmrc0",
      text: "I only get breathless with strenuous exercise",
    },
    {
      id: "mmrc1",
      text: "I get short of breath hurrying on the level or walking up a slight hill",
    },
    {
      id: "mmrc2",
      text: "I walk slower than people of the same age, or stop for breath walking at my own pace",
    },
    {
      id: "mmrc3",
      text: "I stop for breath after about 100 metres or a few minutes on the level",
    },
    {
      id: "mmrc4",
      text: "I am too breathless to leave the house, or breathless when dressing",
    },
  ],
};

export const INSTRUMENTS: Record<InstrumentId, Instrument> = {
  phq9: PHQ9,
  gad7: GAD7,
  who5: WHO5,
  mmrc: MMRC,
};

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function expectLength(answers: number[], n: number, name: string): void {
  if (answers.length !== n) {
    throw new Error(`${name} needs exactly ${n} answers, got ${answers.length}`);
  }
}

function inRange(answers: number[], min: number, max: number, name: string) {
  for (const a of answers) {
    if (!Number.isInteger(a) || a < min || a > max) {
      throw new Error(`${name} answers must be integers ${min}..${max}`);
    }
  }
}

export interface Phq9Result {
  total: number; // 0..27
  band: Severity;
  /** Item 9 (self-harm thoughts) scored 1 or more. */
  selfHarmFlag: boolean;
}

export function scorePhq9(answers: number[]): Phq9Result {
  expectLength(answers, 9, "PHQ-9");
  inRange(answers, 0, 3, "PHQ-9");
  const total = sum(answers);
  const band: Severity =
    total <= 4
      ? "minimal"
      : total <= 9
        ? "mild"
        : total <= 14
          ? "moderate"
          : total <= 19
            ? "moderately-severe"
            : "severe";
  return { total, band, selfHarmFlag: (answers[8] ?? 0) >= 1 };
}

export interface Gad7Result {
  total: number; // 0..21
  band: Severity;
  /** 10 or more is the threshold for further assessment. */
  needsAssessment: boolean;
}

export function scoreGad7(answers: number[]): Gad7Result {
  expectLength(answers, 7, "GAD-7");
  inRange(answers, 0, 3, "GAD-7");
  const total = sum(answers);
  const band: Severity =
    total <= 4
      ? "minimal"
      : total <= 9
        ? "mild"
        : total <= 14
          ? "moderate"
          : "severe";
  return { total, band, needsAssessment: total >= 10 };
}

export interface Who5Result {
  raw: number; // 0..25
  index: number; // 0..100
  lowWellbeing: boolean; // raw <= 13, or any item 0..1
}

export function scoreWho5(answers: number[]): Who5Result {
  expectLength(answers, 5, "WHO-5");
  inRange(answers, 0, 5, "WHO-5");
  const raw = sum(answers);
  const anyVeryLow = answers.some((a) => a <= 1);
  return { raw, index: raw * 4, lowWellbeing: raw <= 13 || anyVeryLow };
}

export interface MmrcResult {
  grade: number; // 0..4
  concern: boolean; // grade >= 2
}

export function scoreMmrc(grade: number): MmrcResult {
  if (!Number.isInteger(grade) || grade < 0 || grade > 4) {
    throw new Error("mMRC grade must be an integer 0..4");
  }
  return { grade, concern: grade >= 2 };
}

// Map instrument scores to a signposting disposition. These follow NHS.uk
// advice (low mood lasting two weeks should see a GP; self-harm thoughts are
// urgent) and are deliberately conservative.

export function dispositionFromPhq9(r: Phq9Result): Disposition {
  if (r.selfHarmFlag) {
    return dispositionFor(
      "urgent-111",
      "You mentioned thoughts of being better off dead or hurting yourself.",
    );
  }
  if (r.band === "moderately-severe" || r.band === "severe") {
    return dispositionFor("gp-routine", "Your low-mood answers are in a higher range.");
  }
  if (r.band === "moderate" || r.band === "mild") {
    return dispositionFor("gp-routine", "Low mood that has lasted around two weeks is worth talking through with a GP.");
  }
  return dispositionFor("self-care", "Your low-mood answers are in the minimal range.");
}

export function dispositionFromGad7(r: Gad7Result): Disposition {
  if (r.band === "severe") {
    return dispositionFor("gp-routine", "Your anxiety answers are in the severe range.");
  }
  if (r.needsAssessment) {
    return dispositionFor("gp-routine", "Your anxiety answers are above the level usually worth assessing further.");
  }
  return dispositionFor("self-care", "Your anxiety answers are in the lower range.");
}
