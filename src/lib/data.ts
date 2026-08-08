import { supabase } from "@/integrations/supabase/client";

export async function ensureConversation(projectId: string, userId: string) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ project_id: projectId, user_id: userId, title: "Main thread" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function createProject(userId: string, name = "Untitled project") {
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, name })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await ensureConversation(data.id, userId);
  return data;
}

export const DEFAULT_COLLECTIONS = [
  "Brand Style",
  "Product Style",
  "Character",
  "Fashion",
  "Architecture",
] as const;

export function fileExtension(file: File) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "png";
}

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Only PNG, JPEG and WebP images are supported.";
  if (file.size > MAX_UPLOAD_BYTES) return "Images must be smaller than 20 MB.";
  return null;
}

export async function uploadToBucket(bucket: string, userId: string, file: File, prefix = "uploads") {
  const path = `${userId}/${prefix}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}
