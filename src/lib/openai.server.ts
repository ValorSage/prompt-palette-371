/**
 * Server-only OpenAI GPT Image 2 client.
 * Only parameters supported by the current OpenAI Images API are used.
 */

const OPENAI_BASE = "https://api.openai.com/v1";

export const SUPPORTED_SIZES = ["auto", "1024x1024", "1024x1536", "1536x1024"] as const;
export const SUPPORTED_QUALITY = ["auto", "low", "medium", "high"] as const;
export const SUPPORTED_FORMATS = ["png", "jpeg", "webp"] as const;
export const SUPPORTED_BACKGROUND = ["auto", "transparent", "opaque"] as const;
export const MAX_INPUT_IMAGES = 16; // OpenAI image edits input limit
export const MAX_N = 10;

export type ImageParams = {
  prompt: string;
  model: string;
  size: string;
  quality: string;
  background: string;
  outputFormat: string;
  n: number;
};

export type InputImage = { filename: string; mimeType: string; bytes: Uint8Array };

function apiKey(): string {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) {
    throw new Error(
      "Image generation is not configured yet. An OpenAI API key must be added to the project secrets.",
    );
  }
  return key;
}

function normalizeError(status: number, body: string): Error {
  let message = body;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) message = parsed.error.message;
  } catch {
    /* keep raw body */
  }
  if (status === 401) return new Error("The configured OpenAI API key was rejected.");
  if (status === 429) return new Error("OpenAI rate limit reached. Please try again shortly.");
  if (status === 400) return new Error(`OpenAI rejected the request: ${message}`);
  return new Error(`OpenAI error (${status}): ${message}`);
}

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string }>;
  usage?: { total_tokens?: number };
};

async function readImages(res: Response): Promise<{ images: Uint8Array[]; tokens: number }> {
  const text = await res.text();
  if (!res.ok) throw normalizeError(res.status, text);
  const json = JSON.parse(text) as OpenAIImageResponse;
  const images = (json.data ?? [])
    .map((d) => d.b64_json)
    .filter((b): b is string => Boolean(b))
    .map((b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
  if (images.length === 0) throw new Error("OpenAI returned no image data.");
  return { images, tokens: json.usage?.total_tokens ?? 0 };
}

export async function generateImages(params: ImageParams) {
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    n: params.n,
    size: params.size,
    quality: params.quality,
    output_format: params.outputFormat,
  };
  if (params.background !== "auto") body["background"] = params.background;

  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readImages(res);
}

export async function editImages(params: ImageParams, inputs: InputImage[]) {
  const form = new FormData();
  form.append("model", params.model);
  form.append("prompt", params.prompt);
  form.append("n", String(params.n));
  form.append("size", params.size);
  form.append("quality", params.quality);
  form.append("output_format", params.outputFormat);
  if (params.background !== "auto") form.append("background", params.background);
  for (const input of inputs.slice(0, MAX_INPUT_IMAGES)) {
    form.append(
      "image[]",
      new Blob([input.bytes as unknown as BlobPart], { type: input.mimeType }),
      input.filename,
    );
  }

  const res = await fetch(`${OPENAI_BASE}/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });
  return readImages(res);
}
