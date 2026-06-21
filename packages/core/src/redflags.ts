import type { DispositionLevel } from "./types";

/**
 * Red-flag screening questions, worded closely to NHS.uk symptom pages.
 * A "yes" routes to the given disposition (almost always 999). These are the
 * safety net that runs before any scored instrument.
 */
export interface RedFlag {
  id: string;
  symptom: string;
  question: string;
  disposition: DispositionLevel;
}

export const RED_FLAGS: RedFlag[] = [
  // Chest pain / heart attack (NHS.uk)
  {
    id: "chest-sudden",
    symptom: "chest-pain",
    question:
      "Do you have sudden chest pain that does not go away, like squeezing, pressure or burning?",
    disposition: "emergency-999",
  },
  {
    id: "chest-spreading",
    symptom: "chest-pain",
    question:
      "Is the pain spreading to your arms, neck, jaw, stomach or back?",
    disposition: "emergency-999",
  },
  {
    id: "chest-sweating",
    symptom: "chest-pain",
    question:
      "Is the chest pain coming with sweating, feeling sick, light-headedness or shortness of breath?",
    disposition: "emergency-999",
  },
  // Shortness of breath (NHS.uk)
  {
    id: "breath-severe",
    symptom: "breathlessness",
    question:
      "Are you struggling to breathe, gasping, choking, or unable to get your words out?",
    disposition: "emergency-999",
  },
  {
    id: "breath-blue",
    symptom: "breathlessness",
    question:
      "Are your lips or skin turning pale, blue or grey, or are you suddenly confused?",
    disposition: "emergency-999",
  },
  // Headache (NHS.uk)
  {
    id: "head-thunderclap",
    symptom: "headache",
    question:
      "Did the headache come on very suddenly and is extremely painful, or follow a recent head injury?",
    disposition: "emergency-999",
  },
  {
    id: "head-neuro",
    symptom: "headache",
    question:
      "With the headache, do you have a seizure, weakness or numbness, trouble speaking or walking, drowsiness, confusion, or loss of vision?",
    disposition: "emergency-999",
  },
  {
    id: "head-meningitis",
    symptom: "headache",
    question:
      "With the headache, do you have a very high temperature, a stiff neck, light hurting your eyes, or a rash that does not fade?",
    disposition: "emergency-999",
  },
  // Mental health crisis (NHS.uk)
  {
    id: "mood-immediate-risk",
    symptom: "low-mood",
    question:
      "Right now, are you unable to keep yourself safe, or have you seriously harmed yourself?",
    disposition: "emergency-999",
  },
];

export function redFlagsFor(symptom: string): RedFlag[] {
  return RED_FLAGS.filter((f) => f.symptom === symptom);
}
