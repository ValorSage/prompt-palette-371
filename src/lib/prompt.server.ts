/**
 * Prompt Agent: rewrites a rough user idea into a production-grade image prompt.
 * Server-only. Uses the Lovable AI gateway (vision-capable chat model) so it can
 * also look at the attached/reference images before rewriting.
 */

export type EnhanceInput = {
  prompt: string;
  mode?: "generate" | "edit";
  aspect?: string;
  referenceSummary?: string;
  images?: Array<{ mimeType: string; base64: string }>;
};

const SYSTEM = `You are a senior art director and prompt engineer for OpenAI GPT Image models.
Rewrite the user's idea into ONE English image prompt that follows best practice:
- Lead with the subject and the action, then scene/context.
- Then: composition and framing, camera/lens or render style, lighting, color palette,
  materials and textures, mood, level of detail, and any negative constraints phrased positively.
- Keep any exact text the user wants rendered inside the image in "quotes" and unchanged.
- Preserve the user's intent, brand names, and named entities. Never invent a different subject.
- If reference images or a reference visual profile are provided, describe how the output should
  match that direction (style, palette, lighting, framing) instead of describing the references literally.
- In edit mode, describe only the change plus what must stay identical.
- No preamble, no markdown, no lists, no quotes around the whole prompt. 60-150 words.
Reply with the prompt text only.`;

export async function enhancePrompt(input: EnhanceInput): Promise<string> {
  const raw = input.prompt.trim();
  if (!raw) throw new Error("Write something first, then enhance it.");
  if (raw.length > 4000) throw new Error("Prompt is too long (max 4000 characters).");

  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("The prompt assistant is not configured.");

  const details = [
    `Mode: ${input.mode ?? "generate"}`,
    input.aspect ? `Target size/aspect: ${input.aspect}` : "",
    input.referenceSummary ? `Reference visual direction: ${input.referenceSummary}` : "",
    `User idea (may be in Arabic or any language — always answer in English): ${raw}`,
  ]
    .filter(Boolean)
    .join("\n");

  const content: Array<Record<string, unknown>> = [
    { type: "text", text: details },
    ...(input.images ?? []).slice(0, 4).map((img) => ({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    })),
  ];

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content },
      ],
    }),
  });

  if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
  if (!res.ok) throw new Error(`Prompt enhancement failed (${res.status}).`);

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = (json.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new Error("The prompt assistant returned nothing. Try again.");
  return text.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
}
