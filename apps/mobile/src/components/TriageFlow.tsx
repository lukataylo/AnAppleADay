import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
import { palette } from "../theme";
import { s } from "../styles";
import { DispositionCard } from "./DispositionCard";

function InstrumentForm({
  instrument,
  onSubmit,
}: {
  instrument: Instrument;
  onSubmit: (answers: number[]) => void;
}) {
  const isGrade = instrument.options.length === 0;
  const [answers, setAnswers] = useState<number[]>(
    isGrade ? [] : Array(instrument.items.length).fill(-1),
  );

  if (isGrade) {
    return (
      <View style={{ gap: 10 }}>
        {instrument.items.map((item, i) => (
          <TouchableOpacity
            key={item.id}
            style={[s.btn, s.choice]}
            onPress={() => onSubmit([i])}
          >
            <Text style={s.btnText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  const complete = answers.every((a) => a >= 0);
  return (
    <View style={{ gap: 12 }}>
      {instrument.items.map((item, qi) => (
        <View key={item.id} style={s.card}>
          <Text style={{ color: palette.ink, fontSize: 15 }}>{item.text}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {instrument.options.map((opt) => {
              const sel = answers[qi] === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    s.pill,
                    sel
                      ? { backgroundColor: palette.accentSoft, borderColor: palette.accent }
                      : null,
                  ]}
                  onPress={() =>
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[qi] = opt.value;
                      return next;
                    })
                  }
                >
                  <Text style={[s.pillText, sel ? { color: palette.ink } : null]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
      <TouchableOpacity
        style={[s.btn, s.btnPrimary, !complete ? s.btnDisabled : null]}
        disabled={!complete}
        onPress={() => onSubmit(answers)}
      >
        <Text style={s.btnPrimaryText}>See result</Text>
      </TouchableOpacity>
    </View>
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
      <ScrollView contentContainerStyle={{ gap: 14 }}>
        <DispositionCard d={state.disposition} />
        <TouchableOpacity style={s.btn} onPress={() => setState(startTriage(tree))}>
          <Text style={s.btnText}>Start over</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const node = currentNode(tree, state);
  return (
    <ScrollView contentContainerStyle={{ gap: 14 }}>
      <Text style={s.h1}>{node.prompt}</Text>
      {node.kind === "choice" && (
        <View style={{ gap: 10 }}>
          {node.choices.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[s.btn, s.choice]}
              onPress={() => {
                const next = answerChoice(tree, state, i);
                setState(next);
                if (next.done && onComplete) onComplete(next);
              }}
            >
              <Text style={s.btnText}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    </ScrollView>
  );
}
