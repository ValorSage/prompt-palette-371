/**
 * Reference Analyzer: builds a cached visual profile from reference images
 * using the Lovable AI gateway (vision model). Server-only.
 */

export type ReferenceProfile = {
  style: string;
  colors: string;
  lighting: string;
  composition: string;
  camera: string;
  materials: string;
  textures: string;
  subjects: string;
  mood: string;
  design_language: string;
  summary: string;
};

const EMPTY: ReferenceProfile = {
  style: "",
  colors: "",
  lighting: "",
  composition: "",
  camera: "",
  materials: "",
  textures: "",
  subjects: "",
  mood: "",
  design_language: "",
  summary: "",
};

export async function analyzeReferenceImages(
  images: Array<{ mimeType: string; base64: string }>,
): Promise<ReferenceProfile> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI analysis is not configured.");

  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text:
        "Analyze these reference images as one coherent visual direction. Reply with ONLY a JSON object with the keys: " +
        "style, colors, lighting, composition, camera, materials, textures, subjects, mood, design_language, summary. " +
        "Each value must be a short descriptive string. summary must be 1-3 sentences usable as guidance inside an image generation prompt.",
    },
    ...images.map((img) => ({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    })),
  ];

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
  if (!res.ok) throw new Error(`Reference analysis failed (${res.status}).`);

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "");
  let parsed: Partial<ReferenceProfile> = {};
  try {
    parsed = JSON.parse(cleaned) as Partial<ReferenceProfile>;
  } catch {
    parsed = { summary: raw.slice(0, 800) };
  }
  return { ...EMPTY, ...parsed };
}

export function profileToPromptBlock(profile: ReferenceProfile): string {
  const parts = [
    profile.summary && `Overall direction: ${profile.summary}`,
    profile.style && `Style: ${profile.style}`,
    profile.colors && `Color palette: ${profile.colors}`,
    profile.lighting && `Lighting: ${profile.lighting}`,
    profile.composition && `Composition: ${profile.composition}`,
    profile.camera && `Camera: ${profile.camera}`,
    profile.materials && `Materials: ${profile.materials}`,
    profile.textures && `Textures: ${profile.textures}`,
    profile.mood && `Mood: ${profile.mood}`,
    profile.design_language && `Design language: ${profile.design_language}`,
  ].filter(Boolean);
  return parts.join("\n");
}
