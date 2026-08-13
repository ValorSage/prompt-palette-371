import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  editImages,
  generateImages,
  MAX_INPUT_IMAGES,
  MAX_N,
  SUPPORTED_BACKGROUND,
  SUPPORTED_FORMATS,
  SUPPORTED_QUALITY,
  SUPPORTED_SIZES,
  type InputImage,
} from "./openai.server";
import { analyzeReferenceImages, profileToPromptBlock, type ReferenceProfile } from "./analyzer.server";

type DB = SupabaseClient<Database>;

export type GenerateInput = {
  prompt: string;
  projectId: string;
  conversationId: string;
  mode?: "generate" | "edit" | "regenerate" | "variation";
  model?: string;
  size?: string;
  quality?: string;
  background?: string;
  outputFormat?: string;
  n?: number;
  referenceImageIds?: string[];
  referenceCollectionIds?: string[];
  uploadedPaths?: string[];
  previousImageId?: string | null;
};

const RATE_LIMIT_PER_MINUTE = 8;

function pick<T extends readonly string[]>(list: T, value: string | undefined, fallback: string) {
  return value && (list as readonly string[]).includes(value) ? value : fallback;
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function download(db: DB, bucket: string, path: string) {
  const { data, error } = await db.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Could not read stored image: ${error?.message ?? "missing"}`);
  return new Uint8Array(await data.arrayBuffer());
}

/** Builds (and caches) a visual profile for a set of reference collections. */
export async function ensureCollectionProfile(db: DB, userId: string, collectionId: string) {
  const { data: images, error } = await db
    .from("reference_images")
    .select("id, storage_path, mime_type, created_at")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(error.message);
  if (!images || images.length === 0) throw new Error("This collection has no images to analyze.");

  const fingerprint = await sha256(images.map((i) => i.id).join(","));
  const { data: cached } = await db
    .from("reference_profiles")
    .select("*")
    .eq("collection_id", collectionId)
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  if (cached) return cached;

  const sample = images.slice(0, 12);
  const encoded = await Promise.all(
    sample.map(async (img) => ({
      mimeType: img.mime_type,
      base64: toBase64(await download(db, "references", img.storage_path)),
    })),
  );
  const profile = await analyzeReferenceImages(encoded);

  const { data: inserted, error: insertError } = await db
    .from("reference_profiles")
    .insert({
      user_id: userId,
      collection_id: collectionId,
      fingerprint,
      summary: profile.summary,
      profile: profile as unknown as Database["public"]["Tables"]["reference_profiles"]["Row"]["profile"],
      image_count: images.length,
    })
    .select("*")
    .single();
  if (insertError) throw new Error(insertError.message);

  await db.from("usage_events").insert({ user_id: userId, kind: "reference_analysis", units: sample.length });
  return inserted;
}

export async function runGeneration(db: DB, userId: string, input: GenerateInput) {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("A prompt is required.");
  if (prompt.length > 4000) throw new Error("Prompt is too long (max 4000 characters).");

  // --- ownership checks (server-side, never trust the client) ---
  const { data: project } = await db
    .from("projects")
    .select("id")
    .eq("id", input.projectId)
    .maybeSingle();
  if (!project) throw new Error("Project not found.");
  const { data: conversation } = await db
    .from("conversations")
    .select("id")
    .eq("id", input.conversationId)
    .eq("project_id", input.projectId)
    .maybeSingle();
  if (!conversation) throw new Error("Conversation not found.");

  // --- rate limiting ---
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) {
    throw new Error("You're generating too quickly. Please wait a moment and try again.");
  }

  const params = {
    model: input.model === "gpt-image-1" ? "gpt-image-1" : "gpt-image-2",
    size: pick(SUPPORTED_SIZES, input.size, "1024x1024"),
    quality: pick(SUPPORTED_QUALITY, input.quality, "medium"),
    background: pick(SUPPORTED_BACKGROUND, input.background, "auto"),
    outputFormat: pick(SUPPORTED_FORMATS, input.outputFormat, "png"),
    n: Math.min(Math.max(Number(input.n) || 1, 1), MAX_N),
  };

  // --- gather reference material ---
  const referenceIds = (input.referenceImageIds ?? []).slice(0, 50);
  const collectionIds = (input.referenceCollectionIds ?? []).slice(0, 5);

  let profileBlock = "";
  const usedProfiles: string[] = [];
  for (const collectionId of collectionIds) {
    try {
      const profileRow = await ensureCollectionProfile(db, userId, collectionId);
      profileBlock += `\n${profileToPromptBlock(profileRow.profile as unknown as ReferenceProfile)}`;
      usedProfiles.push(profileRow.summary);
    } catch {
      /* analysis is best-effort; generation continues without it */
    }
  }

  const selectedRefs: Array<{ id: string | null; collection_id: string | null; path: string; mime: string }> = [];
  if (referenceIds.length > 0) {
    const { data: refs } = await db
      .from("reference_images")
      .select("id, collection_id, storage_path, mime_type")
      .in("id", referenceIds);
    for (const r of refs ?? []) {
      selectedRefs.push({ id: r.id, collection_id: r.collection_id, path: r.storage_path, mime: r.mime_type });
    }
  }
  if (selectedRefs.length === 0 && collectionIds.length > 0) {
    const { data: refs } = await db
      .from("reference_images")
      .select("id, collection_id, storage_path, mime_type")
      .in("collection_id", collectionIds)
      .order("created_at", { ascending: false })
      .limit(4);
    for (const r of refs ?? []) {
      selectedRefs.push({ id: r.id, collection_id: r.collection_id, path: r.storage_path, mime: r.mime_type });
    }
  }

  const uploaded = (input.uploadedPaths ?? []).filter((p) => p.startsWith(`${userId}/`)).slice(0, MAX_INPUT_IMAGES);

  let previousPath: string | null = null;
  let rootImageId: string | null = null;
  let baseVersion = 0;
  if (input.previousImageId) {
    const { data: prev } = await db
      .from("generated_images")
      .select("id, storage_path, root_image_id, version")
      .eq("id", input.previousImageId)
      .maybeSingle();
    if (!prev) throw new Error("Source image not found.");
    previousPath = prev.storage_path;
    rootImageId = prev.root_image_id ?? prev.id;
    baseVersion = prev.version;
  }

  const inputImages: InputImage[] = [];
  const inputSources: Array<{ source: string; refId: string | null; collectionId: string | null; path: string }> = [];
  if (previousPath) {
    inputImages.push({
      filename: "previous.png",
      mimeType: "image/png",
      bytes: await download(db, "generations", previousPath),
    });
    inputSources.push({ source: "previous", refId: null, collectionId: null, path: previousPath });
  }
  for (const path of uploaded) {
    if (inputImages.length >= MAX_INPUT_IMAGES) break;
    inputImages.push({
      filename: path.split("/").pop() ?? "upload.png",
      mimeType: "image/png",
      bytes: await download(db, "references", path),
    });
    inputSources.push({ source: "upload", refId: null, collectionId: null, path });
  }
  for (const ref of selectedRefs) {
    if (inputImages.length >= MAX_INPUT_IMAGES) break;
    inputImages.push({
      filename: `${ref.id}.png`,
      mimeType: ref.mime,
      bytes: await download(db, "references", ref.path),
    });
    inputSources.push({ source: "reference", refId: ref.id, collectionId: ref.collection_id, path: ref.path });
  }

  const finalPrompt = profileBlock
    ? `${prompt}\n\nFollow this reference visual direction:\n${profileBlock.trim()}`
    : prompt;

  // --- duplicate-request protection ---
  const requestHash = await sha256(
    JSON.stringify({
      p: finalPrompt,
      ...params,
      conv: input.conversationId,
      inputs: inputSources.map((s) => s.path),
      ts: Math.floor(Date.now() / 10_000),
    }),
  );

  const mode = input.mode ?? (inputImages.length > 0 ? "edit" : "generate");
  const { data: generation, error: genError } = await db
    .from("generations")
    .insert({
      user_id: userId,
      project_id: input.projectId,
      conversation_id: input.conversationId,
      mode,
      prompt,
      model: params.model,
      size: params.size,
      quality: params.quality,
      background: params.background,
      output_format: params.outputFormat,
      n: params.n,
      status: "processing",
      request_hash: requestHash,
      parent_image_id: input.previousImageId ?? null,
      reference_profile_summary: usedProfiles.join(" ") || null,
    })
    .select("*")
    .single();

  if (genError) {
    if (genError.code === "23505") throw new Error("That exact request is already running.");
    throw new Error(genError.message);
  }

  if (inputSources.length > 0) {
    await db.from("generation_references").insert(
      inputSources.map((s) => ({
        user_id: userId,
        generation_id: generation.id,
        reference_image_id: s.refId,
        collection_id: s.collectionId,
        source: s.source,
        storage_path: s.path,
      })),
    );
  }

  try {
    const result =
      inputImages.length > 0
        ? await editImages({ ...params, prompt: finalPrompt }, inputImages)
        : await generateImages({ ...params, prompt: finalPrompt });

    const ext = params.outputFormat === "jpeg" ? "jpg" : params.outputFormat;
    const mime = `image/${params.outputFormat}`;
    const rows: Database["public"]["Tables"]["generated_images"]["Insert"][] = [];

    for (let i = 0; i < result.images.length; i++) {
      const bytes = result.images[i]!;
      const path = `${userId}/${generation.id}/${i}.${ext}`;
      const { error: uploadError } = await db.storage
        .from("generations")
        .upload(path, new Blob([bytes as unknown as BlobPart], { type: mime }), {
          contentType: mime,
          upsert: true,
        });
      if (uploadError) throw new Error(uploadError.message);
      rows.push({
        user_id: userId,
        generation_id: generation.id,
        project_id: input.projectId,
        name: prompt.slice(0, 60) || "Image",
        storage_path: path,
        mime_type: mime,
        size_bytes: bytes.byteLength,
        is_favorite: false,
        root_image_id: rootImageId,
        version: rootImageId ? baseVersion + 1 : 0,
      });
    }

    const { data: images, error: imgError } = await db.from("generated_images").insert(rows).select("*");
    if (imgError) throw new Error(imgError.message);

    for (const img of images ?? []) {
      const root = rootImageId ?? img.id;
      if (!rootImageId) await db.from("generated_images").update({ root_image_id: root }).eq("id", img.id);
      await db.from("image_versions").insert({
        user_id: userId,
        root_image_id: root,
        image_id: img.id,
        version: rootImageId ? baseVersion + 1 : 0,
        label: rootImageId ? `Version ${baseVersion + 1}` : "Original",
      });
    }

    await db
      .from("generations")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", generation.id);
    await db.from("usage_events").insert({
      user_id: userId,
      kind: "generation",
      units: result.images.length,
      metadata: { model: params.model, quality: params.quality, size: params.size, tokens: result.tokens },
    });

    return { generationId: generation.id, imageCount: images?.length ?? 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    await db
      .from("generations")
      .update({ status: "failed", error: message, request_hash: null, completed_at: new Date().toISOString() })
      .eq("id", generation.id);
    throw new Error(message);
  }
}
