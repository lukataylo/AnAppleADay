import type { Disposition, DispositionLevel, InstrumentId } from "./types";
import { dispositionFor } from "./dispositions";
import {
  scoreGad7,
  scoreMmrc,
  scorePhq9,
  scoreWho5,
  dispositionFromGad7,
  dispositionFromPhq9,
} from "./instruments";

export type TriageNodeId = string;

export interface TriageOutcome {
  outcome: DispositionLevel;
  reason?: string;
}

export interface TriageChoice {
  label: string;
  /** Either the id of the next node, or a terminal outcome. */
  to: TriageNodeId | TriageOutcome;
  /** Marks a red-flag answer, for audit emphasis and urgent styling. */
  redFlag?: boolean;
}

export interface ChoiceNode {
  id: TriageNodeId;
  kind: "choice";
  prompt: string;
  /** Short symptom tag for grouping and the handoff. */
  topic?: string;
  choices: TriageChoice[];
}

export interface InstrumentNode {
  id: TriageNodeId;
  kind: "instrument";
  prompt: string;
  topic?: string;
  instrument: InstrumentId;
}

export interface OutcomeNode {
  id: TriageNodeId;
  kind: "outcome";
  prompt: string;
  topic?: string;
  outcome: DispositionLevel;
  reason?: string;
}

export type TriageNode = ChoiceNode | InstrumentNode | OutcomeNode;

export interface TriageTree {
  rootId: TriageNodeId;
  nodes: Map<TriageNodeId, TriageNode>;
}

export interface TriageStep {
  nodeId: TriageNodeId;
  topic?: string;
  prompt: string;
  answer: string;
  redFlag: boolean;
}

export interface TriageState {
  nodeId: TriageNodeId | null;
  history: TriageStep[];
  disposition: Disposition | null;
  done: boolean;
}

/** Builds a tree from a node list and validates every reference resolves. */
export function createTree(
  rootId: TriageNodeId,
  list: TriageNode[],
): TriageTree {
  const nodes = new Map<TriageNodeId, TriageNode>();
  for (const n of list) {
    if (nodes.has(n.id)) throw new Error(`Duplicate triage node id: ${n.id}`);
    nodes.set(n.id, n);
  }
  if (!nodes.has(rootId)) throw new Error(`Root node ${rootId} not found`);
  for (const n of nodes.values()) {
    if (n.kind === "choice") {
      if (n.choices.length === 0)
        throw new Error(`Choice node ${n.id} has no choices`);
      for (const c of n.choices) {
        if (typeof c.to === "string" && !nodes.has(c.to)) {
          throw new Error(`Node ${n.id} points to missing node ${c.to}`);
        }
      }
    }
  }
  return { rootId, nodes };
}

export function getNode(tree: TriageTree, id: TriageNodeId): TriageNode {
  const n = tree.nodes.get(id);
  if (!n) throw new Error(`Triage node ${id} not found`);
  return n;
}

export function startTriage(tree: TriageTree): TriageState {
  return { nodeId: tree.rootId, history: [], disposition: null, done: false };
}

export function currentNode(tree: TriageTree, state: TriageState): TriageNode {
  if (!state.nodeId) throw new Error("Triage already finished");
  return getNode(tree, state.nodeId);
}

/** Answer a choice node by index. Returns a new state (pure). */
export function answerChoice(
  tree: TriageTree,
  state: TriageState,
  choiceIndex: number,
): TriageState {
  const node = currentNode(tree, state);
  if (node.kind !== "choice") {
    throw new Error(`Node ${node.id} is not a choice node`);
  }
  const choice = node.choices[choiceIndex];
  if (!choice) throw new Error(`Invalid choice index ${choiceIndex}`);

  const step: TriageStep = {
    nodeId: node.id,
    topic: node.topic,
    prompt: node.prompt,
    answer: choice.label,
    redFlag: choice.redFlag === true,
  };
  const history = [...state.history, step];

  if (typeof choice.to === "string") {
    const next = getNode(tree, choice.to);
    if (next.kind === "outcome") {
      return {
        nodeId: null,
        history: [...history, outcomeStep(next)],
        disposition: dispositionFor(next.outcome, next.reason),
        done: true,
      };
    }
    return { nodeId: choice.to, history, disposition: null, done: false };
  }

  return {
    nodeId: null,
    history,
    disposition: dispositionFor(choice.to.outcome, choice.to.reason),
    done: true,
  };
}

function outcomeStep(node: OutcomeNode): TriageStep {
  return {
    nodeId: node.id,
    topic: node.topic,
    prompt: node.prompt,
    answer: "",
    redFlag: node.outcome === "emergency-999",
  };
}

/** Compute a disposition from a scored instrument. */
export function dispositionFromInstrument(
  id: InstrumentId,
  answers: number[],
): Disposition {
  switch (id) {
    case "phq9":
      return dispositionFromPhq9(scorePhq9(answers));
    case "gad7":
      return dispositionFromGad7(scoreGad7(answers));
    case "who5": {
      const r = scoreWho5(answers);
      return r.lowWellbeing
        ? dispositionFor("gp-routine", "Your wellbeing score is on the low side.")
        : dispositionFor("self-care", "Your wellbeing score is in a healthy range.");
    }
    case "mmrc": {
      const r = scoreMmrc(answers[0] as number);
      if (r.grade >= 3)
        return dispositionFor("urgent-111", "Your breathlessness limits you a lot day to day.");
      if (r.grade === 2)
        return dispositionFor("gp-routine", "Your breathlessness is worth discussing with a GP.");
      return dispositionFor("self-care", "Your breathlessness is mild.");
    }
  }
}

/** Answer an instrument node with the raw item scores. */
export function answerInstrument(
  tree: TriageTree,
  state: TriageState,
  answers: number[],
): TriageState {
  const node = currentNode(tree, state);
  if (node.kind !== "instrument") {
    throw new Error(`Node ${node.id} is not an instrument node`);
  }
  const disposition = dispositionFromInstrument(node.instrument, answers);
  // An instrument that escalates to urgent or emergency care is recorded as a
  // red flag for the handoff audit, even where the disposition styling is not
  // marked urgent (for example a PHQ-9 self-harm response routing to 111).
  const escalated =
    disposition.level === "emergency-999" || disposition.level === "urgent-111";
  const step: TriageStep = {
    nodeId: node.id,
    topic: node.topic,
    prompt: node.prompt,
    answer: `${node.instrument} completed`,
    redFlag: escalated,
  };
  return {
    nodeId: null,
    history: [...state.history, step],
    disposition,
    done: true,
  };
}

/** Did any answered step trip a red flag? */
export function hadRedFlag(state: TriageState): boolean {
  return state.history.some((s) => s.redFlag);
}
