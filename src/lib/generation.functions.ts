import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { GenerateInput } from "./generation.server";

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: GenerateInput) => data)
  .handler(async ({ data, context }) => {
    const { runGeneration } = await import("./generation.server");
    return runGeneration(context.supabase, context.userId, data);
  });

export const enhancePromptFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      prompt: string;
      mode?: "generate" | "edit";
      aspect?: string;
      uploadedPaths?: string[];
      referenceImageIds?: string[];
      referenceCollectionIds?: string[];
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { runPromptEnhance } = await import("./generation.server");
    return runPromptEnhance(context.supabase, context.userId, data);
  });

export const analyzeCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { collectionId: string }) => data)
  .handler(async ({ data, context }) => {
    const { ensureCollectionProfile } = await import("./generation.server");
    const profile = await ensureCollectionProfile(context.supabase, context.userId, data.collectionId);
    return { summary: profile.summary, profile: profile.profile, imageCount: profile.image_count };
  });
