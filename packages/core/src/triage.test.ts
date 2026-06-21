import { describe, expect, it } from "vitest";
import {
  answerChoice,
  answerInstrument,
  createTree,
  currentNode,
  dispositionFromInstrument,
  hadRedFlag,
  startTriage,
  type TriageNode,
} from "./triage";
import { buildTriageTree } from "./tree";

describe("tree validation", () => {
  it("rejects a dangling reference", () => {
    const nodes: TriageNode[] = [
      {
        id: "root",
        kind: "choice",
        prompt: "?",
        choices: [{ label: "go", to: "missing" }],
      },
    ];
    expect(() => createTree("root", nodes)).toThrow(/missing/);
  });
  it("rejects a missing root", () => {
    expect(() => createTree("nope", [])).toThrow();
  });
  it("rejects duplicate ids", () => {
    const dup: TriageNode[] = [
      { id: "a", kind: "outcome", prompt: "", outcome: "self-care" },
      { id: "a", kind: "outcome", prompt: "", outcome: "self-care" },
    ];
    expect(() => createTree("a", dup)).toThrow(/Duplicate/);
  });
  it("builds the real triage tree without error", () => {
    expect(() => buildTriageTree()).not.toThrow();
  });
});

describe("triage navigation", () => {
  it("routes a chest-pain red flag straight to 999", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    // root -> chest pain (index 0)
    state = answerChoice(tree, state, 0);
    expect(currentNode(tree, state).id).toBe("chest-0");
    // first chest red flag -> Yes
    state = answerChoice(tree, state, 0);
    expect(state.done).toBe(true);
    expect(state.disposition?.level).toBe("emergency-999");
    expect(hadRedFlag(state)).toBe(true);
  });

  it("falls through chest red flags to the follow-up and routine outcome", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    state = answerChoice(tree, state, 0); // chest pain
    // answer No to all three chest red flags
    state = answerChoice(tree, state, 1);
    state = answerChoice(tree, state, 1);
    state = answerChoice(tree, state, 1);
    expect(currentNode(tree, state).id).toBe("chest-followup");
    // "comes and goes" -> gp-routine
    state = answerChoice(tree, state, 0);
    expect(state.disposition?.level).toBe("gp-routine");
    expect(hadRedFlag(state)).toBe(false);
  });

  it("routes low mood through PHQ-9 and surfaces self-harm urgently", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    state = answerChoice(tree, state, 3); // low mood
    expect(currentNode(tree, state).id).toBe("mood-0");
    // answer No to the single mood red flag
    state = answerChoice(tree, state, 1);
    expect(currentNode(tree, state).id).toBe("mood-instrument");
    // PHQ-9 with item 9 set
    state = answerInstrument(tree, state, [1, 1, 0, 0, 0, 0, 0, 0, 2]);
    expect(state.done).toBe(true);
    expect(state.disposition?.level).toBe("urgent-111");
    expect(hadRedFlag(state)).toBe(true);
  });

  it("routes anxiety through GAD-7", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    state = answerChoice(tree, state, 4); // anxiety
    expect(currentNode(tree, state).id).toBe("anx-instrument");
    state = answerInstrument(tree, state, [0, 0, 0, 0, 0, 0, 0]);
    expect(state.disposition?.level).toBe("self-care");
  });

  it("handles 'nothing in particular' as self-care", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    state = answerChoice(tree, state, 7);
    expect(state.disposition?.level).toBe("self-care");
    expect(state.done).toBe(true);
  });

  it("breathlessness with severe red flag goes to 999", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    state = answerChoice(tree, state, 1); // trouble breathing
    state = answerChoice(tree, state, 0); // first breath red flag yes
    expect(state.disposition?.level).toBe("emergency-999");
  });

  it("breathlessness without red flags reaches mMRC", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    state = answerChoice(tree, state, 1);
    state = answerChoice(tree, state, 1); // no
    state = answerChoice(tree, state, 1); // no
    expect(currentNode(tree, state).id).toBe("breath-instrument");
    state = answerInstrument(tree, state, [4]); // grade 4
    expect(state.disposition?.level).toBe("urgent-111");
  });

  it("throws when answering a choice on an instrument node", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    state = answerChoice(tree, state, 4); // anxiety -> instrument
    expect(() => answerChoice(tree, state, 0)).toThrow(/not a choice/);
  });

  it("fatigue lasting weeks routes to GP", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    state = answerChoice(tree, state, 5); // fatigue
    state = answerChoice(tree, state, 0); // weeks -> gp
    expect(state.disposition?.level).toBe("gp-routine");
  });
});

describe("exhaustive tree traversal", () => {
  const LEVELS = [
    "emergency-999",
    "urgent-111",
    "gp-routine",
    "pharmacy",
    "self-care",
  ];
  const sample = (id: string): number[] => {
    if (id === "phq9") return [0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (id === "gad7") return [0, 0, 0, 0, 0, 0, 0];
    if (id === "who5") return [5, 5, 5, 5, 5];
    return [0]; // mmrc
  };

  it("reaches every node, has no cycle, and every leaf yields a disposition", () => {
    const tree = buildTriageTree();
    const visited = new Set<string>();

    const walk = (id: string, path: Set<string>): void => {
      if (path.has(id)) throw new Error(`cycle detected at ${id}`);
      visited.add(id);
      const node = tree.nodes.get(id);
      expect(node).toBeDefined();
      if (!node) return;
      if (node.kind === "outcome") {
        expect(LEVELS).toContain(node.outcome);
        return;
      }
      if (node.kind === "instrument") {
        const d = dispositionFromInstrument(node.instrument, sample(node.instrument));
        expect(LEVELS).toContain(d.level);
        return;
      }
      const next = new Set(path);
      next.add(id);
      for (const c of node.choices) {
        if (typeof c.to === "string") walk(c.to, next);
        else expect(LEVELS).toContain(c.to.outcome);
      }
    };

    walk(tree.rootId, new Set());
    // Every defined node must be reachable from the root.
    expect(visited.size).toBe(tree.nodes.size);
  });
});

describe("instrument-node branch coverage", () => {
  it("mMRC grade 2 routes to GP, grade 0 to self-care", () => {
    const tree = buildTriageTree();
    const toMmrc = () => {
      let s = startTriage(tree);
      s = answerChoice(tree, s, 1); // breathing
      s = answerChoice(tree, s, 1); // no
      s = answerChoice(tree, s, 1); // no
      return s;
    };
    expect(answerInstrument(tree, toMmrc(), [2]).disposition?.level).toBe("gp-routine");
    expect(answerInstrument(tree, toMmrc(), [0]).disposition?.level).toBe("self-care");
  });
  it("maps WHO-5 wellbeing directly", () => {
    expect(dispositionFromInstrument("who5", [5, 5, 5, 5, 5]).level).toBe("self-care");
    expect(dispositionFromInstrument("who5", [1, 1, 1, 1, 1]).level).toBe("gp-routine");
  });
  it("rejects an empty mMRC answer set", () => {
    const tree = buildTriageTree();
    let s = startTriage(tree);
    s = answerChoice(tree, s, 1);
    s = answerChoice(tree, s, 1);
    s = answerChoice(tree, s, 1);
    expect(() => answerInstrument(tree, s, [])).toThrow();
  });
});

describe("cough and headache branches", () => {
  it("severe cough routes urgent and records a red flag", () => {
    const tree = buildTriageTree();
    let s = startTriage(tree);
    s = answerChoice(tree, s, 6); // cough
    s = answerChoice(tree, s, 0); // yes severe
    expect(s.disposition?.level).toBe("urgent-111");
    expect(hadRedFlag(s)).toBe(true);
  });
  it("long-standing cough routes to GP, short cough to self-care", () => {
    const tree = buildTriageTree();
    const start = () => answerChoice(tree, startTriage(tree), 6);
    let s = answerChoice(tree, start(), 1); // not severe
    expect(answerChoice(tree, s, 0).disposition?.level).toBe("gp-routine"); // >3 weeks
    s = answerChoice(tree, start(), 1);
    expect(answerChoice(tree, s, 1).disposition?.level).toBe("self-care");
  });
  it("headache red flag goes to 999, exertional headache to 111", () => {
    const tree = buildTriageTree();
    let s = startTriage(tree);
    s = answerChoice(tree, s, 2); // headache
    expect(answerChoice(tree, s, 0).disposition?.level).toBe("emergency-999"); // first flag yes
    // all red flags no -> followup
    let t = answerChoice(tree, s, 1);
    t = answerChoice(tree, t, 1);
    t = answerChoice(tree, t, 1);
    expect(answerChoice(tree, t, 0).disposition?.level).toBe("urgent-111");
    expect(hadRedFlag(answerChoice(tree, t, 0))).toBe(true);
  });
});
