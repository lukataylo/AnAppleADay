"use client";

import { useMemo, useState } from "react";
import {
  INSTRUMENTS,
  answerChoice,
  answerInstrument,
  buildTriageTree,
  currentNode,
  startTriage,
  type Instrument,
  type TriageState,
} from "@apple/core";
import { DispositionCard } from "./DispositionCard";

function InstrumentForm({
  instrument,
  onSubmit,
}: {
  instrument: Instrument;
  onSubmit: (answers: number[]) => void;
}) {
  const isGrade = instrument.options.length === 0; // mMRC: pick one item as the grade
  const [answers, setAnswers] = useState<number[]>(
    isGrade ? [] : Array(instrument.items.length).fill(-1),
  );

  if (isGrade) {
    return (
      <div className="choice-list">
        {instrument.items.map((item, i) => (
          <button
            key={item.id}
            className="btn choice"
            data-testid={`grade-${i}`}
            onClick={() => onSubmit([i])}
          >
            {item.text}
          </button>
        ))}
      </div>
    );
  }

  const complete = answers.every((a) => a >= 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {instrument.items.map((item, qi) => (
        <div key={item.id} className="card">
          <p style={{ color: "var(--ink)", marginTop: 0 }}>{item.text}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {instrument.options.map((opt) => (
              <button
                key={opt.value}
                data-testid={`q${qi}-opt${opt.value}`}
                className="pill"
                style={
                  answers[qi] === opt.value
                    ? {
                        background: "var(--accent-soft)",
                        borderColor: "var(--accent)",
                        color: "var(--ink)",
                      }
                    : undefined
                }
                onClick={() =>
                  setAnswers((prev) => {
                    const next = [...prev];
                    next[qi] = opt.value;
                    return next;
                  })
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        className="btn primary"
        disabled={!complete}
        data-testid="instrument-submit"
        onClick={() => onSubmit(answers)}
      >
        See result
      </button>
    </div>
  );
}

export function TriageFlow({
  onComplete,
}: {
  onComplete?: (state: TriageState) => void;
}) {
  const tree = useMemo(() => buildTriageTree(), []);
  const [state, setState] = useState<TriageState>(() => startTriage(tree));

  if (state.done && state.disposition) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <DispositionCard d={state.disposition} />
        <button
          className="btn ghost"
          onClick={() => setState(startTriage(tree))}
          data-testid="triage-restart"
        >
          Start over
        </button>
      </div>
    );
  }

  const node = currentNode(tree, state);

  return (
    <div className="screen" style={{ gap: 14 }}>
      <h1 className="h1">{node.prompt}</h1>
      {node.kind === "choice" && (
        <div className="choice-list">
          {node.choices.map((c, i) => (
            <button
              key={i}
              className="btn choice"
              data-testid={`choice-${i}`}
              onClick={() => {
                const next = answerChoice(tree, state, i);
                setState(next);
                if (next.done && onComplete) onComplete(next);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      {node.kind === "instrument" && (
        <InstrumentForm
          instrument={INSTRUMENTS[node.instrument]}
          onSubmit={(answers) => {
            const next = answerInstrument(tree, state, answers);
            setState(next);
            if (next.done && onComplete) onComplete(next);
          }}
        />
      )}
    </div>
  );
}
