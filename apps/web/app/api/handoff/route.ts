import { z } from "zod";

export const runtime = "nodejs";

// Phrases a GP-handoff narrative. The clinical content is already computed
// deterministically in @apple/core; the model only rewrites it into prose and
// never sets urgency or invents findings. With no ANTHROPIC_API_KEY the route
// returns the deterministic draft, so the app stays fully local by default.

const Body = z.object({
  summary: z.object({
    checkInCount: z.number(),
    windowDays: z.number(),
    presentingTopics: z.array(z.string()),
    redFlagsRaised: z.array(z.string()),
    disposition: z
      .object({ level: z.string(), title: z.string(), reason: z.string().optional() })
      .nullable(),
    trends: z.array(
      z.object({
        metric: z.string(),
        direction: z.string(),
        latest: z.number().optional().nullable(),
      }),
    ),
    narrativeDraft: z.string(),
  }),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const { summary } = parsed;

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      mode: "local",
      gpNarrative: summary.narrativeDraft,
      patientNote:
        "This summary was built on your device from your own check-ins. You decide whether to share it.",
    });
  }

  try {
    const { generateObject } = await import("ai");
    const { anthropic } = await import("@ai-sdk/anthropic");
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5"),
      schema: z.object({
        gpNarrative: z.string(),
        patientNote: z.string(),
      }),
      system:
        "You phrase a concise GP-handoff note from a patient's self check-in data. Rewrite only. Do not diagnose, do not change the urgency or invent symptoms. Use neutral clinical English, three to five sentences. The patientNote is one friendly sentence for the patient.",
      prompt: JSON.stringify(summary),
    });
    return Response.json({ mode: "ai", ...object });
  } catch {
    return Response.json({
      mode: "local",
      gpNarrative: summary.narrativeDraft,
      patientNote:
        "This summary was built on your device from your own check-ins. You decide whether to share it.",
    });
  }
}
