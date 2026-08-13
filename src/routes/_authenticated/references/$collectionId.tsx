import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trash2, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadToBucket, validateImageFile } from "@/lib/data";
import { analyzeCollection } from "@/lib/generation.functions";
import { SignedImage } from "@/components/signed-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/references/$collectionId")({
  component: CollectionPage,
});

function CollectionPage() {
  const { collectionId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeCollection);
  const fileInput = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");
  const [uploading, setUploading] = useState(false);

  const collection = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_collections")
        .select("*, reference_images(id, name, storage_path, created_at)")
        .eq("id", collectionId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Collection not found");
      return data;
    },
  });

  const profile = useQuery({
    queryKey: ["collection-profile", collectionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reference_profiles")
        .select("summary, image_count, created_at")
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const runAnalysis = useMutation({
    mutationFn: () => analyze({ data: { collectionId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["collection-profile", collectionId] });
      toast.success("Reference profile updated");
    },
    onError: (e: Error) => toast.error("Analysis failed", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (image: { id: string; storage_path: string }) => {
      await supabase.storage.from("references").remove([image.storage_path]);
      const { error } = await supabase.from("reference_images").delete().eq("id", image.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["collection", collectionId] }),
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !user) return;
    const current = collection.data?.reference_images.length ?? 0;
    const limit = collection.data?.max_images ?? 50;
    setUploading(true);
    try {
      let added = 0;
      for (const file of Array.from(files)) {
        if (current + added >= limit) {
          toast.error(`This collection is limited to ${limit} images.`);
          break;
        }
        const problem = validateImageFile(file);
        if (problem) {
          toast.error(problem);
          continue;
        }
        const path = await uploadToBucket("references", user.id, file, collectionId);
        const { error } = await supabase.from("reference_images").insert({
          user_id: user.id,
          collection_id: collectionId,
          name: file.name,
          storage_path: path,
          mime_type: file.type,
          size_bytes: file.size,
        });
        if (error) throw new Error(error.message);
        added++;
      }
      void queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
      if (added) toast.success(`${added} image(s) added`);
    } catch (error) {
      toast.error("Upload failed", { description: (error as Error).message });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const images = (collection.data?.reference_images ?? []).filter((i) =>
    i.name.toLowerCase().includes(term.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-2xl font-semibold">{collection.data?.name ?? "Collection"}</h1>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search images" className="flex-1" />
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Button className="gap-1.5" onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          title={
            (collection.data?.reference_images.length ?? 0) === 0
              ? "Upload images before analysing this collection"
              : "Analyse this collection into a visual profile"
          }
          onClick={() => {
            if ((collection.data?.reference_images.length ?? 0) === 0) {
              toast.error("Add at least one image before analysing this collection.");
              return;
            }
            runAnalysis.mutate();
          }}
          disabled={runAnalysis.isPending || (collection.data?.reference_images.length ?? 0) === 0}
        >
          {runAnalysis.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Analyze
        </Button>
      </div>

      {profile.data && (
        <div className="panel mt-4 p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Cached visual profile</p>
          <p className="mt-1">{profile.data.summary}</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {collection.isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
        {images.map((img) => (
          <figure key={img.id} className="panel overflow-hidden">
            <SignedImage
              bucket="references"
              path={img.storage_path}
              alt={img.name}
              className="aspect-square w-full object-cover"
            />
            <figcaption className="flex items-center justify-between gap-1 border-t border-border p-1">
              <span className="truncate px-1 text-[11px] text-muted-foreground">{img.name}</span>
              <Button size="icon" variant="ghost" aria-label="Delete image" onClick={() => remove.mutate(img)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </figcaption>
          </figure>
        ))}
      </div>

      {collection.isSuccess && images.length === 0 && (
        <div className="panel mt-6 p-10 text-center text-sm text-muted-foreground">
          No images in this collection yet.
        </div>
      )}
    </div>
  );
}
