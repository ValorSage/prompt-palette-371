import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, Copy, Heart, Download, Layers } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ensureConversation } from "@/lib/data";
import { Composer, type ComposerSettings } from "@/components/composer";
import { SignedImage, getSignedUrl } from "@/components/signed-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageDetails } from "@/components/image-details";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: ProjectWorkspace,
});

function ProjectWorkspace() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previousImageId, setPreviousImageId] = useState<string | null>(null);
  const [openImageId, setOpenImageId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Project not found");
      return data;
    },
  });

  const conversationQuery = useQuery({
    queryKey: ["conversation", projectId],
    enabled: Boolean(user?.id && projectQuery.data),
    queryFn: () => ensureConversation(projectId, user!.id),
  });

  const conversationId = conversationQuery.data ?? null;

  const settingsQuery = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_settings").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const generationsQuery = useQuery({
    queryKey: ["generations", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("*, generated_images(*), generation_references(id, source, storage_path)")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [generationsQuery.data?.length]);

  useEffect(() => {
    if (projectQuery.data) setName(projectQuery.data.name);
  }, [projectQuery.data]);

  const rename = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase.from("projects").update({ name: value }).eq("id", projectId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setRenaming(false);
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project renamed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const defaults: ComposerSettings = useMemo(
    () => ({
      model: settingsQuery.data?.default_model ?? "gpt-image-2",
      size: settingsQuery.data?.default_size ?? "1024x1024",
      quality: settingsQuery.data?.default_quality ?? "medium",
      background: settingsQuery.data?.default_background ?? "auto",
      outputFormat: settingsQuery.data?.default_output_format ?? "png",
      n: settingsQuery.data?.default_n ?? 1,
    }),
    [settingsQuery.data],
  );

  if (projectQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">This project could not be loaded.</p>
        <Button variant="outline" onClick={() => navigate({ to: "/projects" })}>
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {renaming ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) rename.mutate(name.trim());
            }}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-56" autoFocus />
            <Button size="sm" type="submit" disabled={rename.isPending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <h1 className="truncate text-base font-semibold">{projectQuery.data?.name ?? "Loading…"}</h1>
            <Button size="sm" variant="ghost" onClick={() => setRenaming(true)}>
              Rename
            </Button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {generationsQuery.isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-16 w-2/3" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}

          {!generationsQuery.isLoading && (generationsQuery.data?.length ?? 0) === 0 && (
            <div className="panel mx-auto max-w-lg p-10 text-center">
              <Layers className="mx-auto h-6 w-6 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">Start the first generation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Describe an image below. Attach your own images or pick references to steer the style.
              </p>
            </div>
          )}

          {generationsQuery.data?.map((gen) => (
            <GenerationBlock
              key={gen.id}
              generation={gen}
              onOpen={setOpenImageId}
              onUseAsInput={(id) => {
                setPreviousImageId(id);
                toast.success("Image attached as input");
              }}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {conversationId && user?.id ? (
        <Composer
          projectId={projectId}
          conversationId={conversationId}
          userId={user.id}
          previousImageId={previousImageId}
          onClearPrevious={() => setPreviousImageId(null)}
          defaults={defaults}
        />
      ) : (
        <div className="flex h-24 items-center justify-center border-t border-border">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <ImageDetails imageId={openImageId} onClose={() => setOpenImageId(null)} onUseAsInput={setPreviousImageId} />
    </div>
  );
}

type GenerationRow = {
  id: string;
  prompt: string;
  status: string;
  error: string | null;
  model: string;
  size: string;
  quality: string;
  created_at: string;
  generated_images: Array<{ id: string; storage_path: string; name: string; is_favorite: boolean }>;
  generation_references: Array<{ id: string; source: string; storage_path: string | null }>;
};

function GenerationBlock({
  generation,
  onOpen,
  onUseAsInput,
}: {
  generation: GenerationRow;
  onOpen: (id: string) => void;
  onUseAsInput: (id: string) => void;
}) {
  const queryClient = useQueryClient();

  const toggleFavorite = useMutation({
    mutationFn: async (image: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from("generated_images")
        .update({ is_favorite: !image.is_favorite })
        .eq("id", image.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["generations"] });
      void queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });

  async function download(path: string, name: string) {
    try {
      const url = await getSignedUrl("generations", path);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
    } catch (error) {
      toast.error("Download failed", { description: (error as Error).message });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-3 text-sm">
          {generation.prompt}
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            <span>{generation.model}</span>
            <span>· {generation.size}</span>
            <span>· {generation.quality}</span>
            {generation.generation_references.length > 0 && (
              <span>· {generation.generation_references.length} input image(s)</span>
            )}
          </div>
        </div>
      </div>

      {generation.status === "failed" && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
          <div>
            <p className="font-medium">Generation failed</p>
            <p className="text-muted-foreground">{generation.error}</p>
          </div>
        </div>
      )}

      {(generation.status === "queued" || generation.status === "processing") && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {generation.status}…
        </div>
      )}

      {generation.generated_images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {generation.generated_images.map((img) => (
            <figure key={img.id} className="panel group overflow-hidden">
              <SignedImage
                bucket="generations"
                path={img.storage_path}
                alt={img.name}
                className="aspect-square w-full cursor-zoom-in object-cover"
                onClick={() => onOpen(img.id)}
              />
              <figcaption className="flex items-center gap-1 border-t border-border p-1.5">
                <Button size="sm" variant="ghost" onClick={() => onUseAsInput(img.id)} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Use as input
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Favorite"
                  onClick={() => toggleFavorite.mutate(img)}
                  className={img.is_favorite ? "text-accent" : ""}
                >
                  <Heart className="h-4 w-4" fill={img.is_favorite ? "currentColor" : "none"} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Download"
                  onClick={() => void download(img.storage_path, `${img.name}.png`)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Details" onClick={() => onOpen(img.id)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {generation.generated_images.length === 0 && generation.status === "completed" && (
        <Badge variant="outline">No images returned</Badge>
      )}
    </div>
  );
}
