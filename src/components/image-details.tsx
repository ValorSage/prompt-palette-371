import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Heart, Layers } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignedImage, getSignedUrl } from "@/components/signed-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function ImageDetails({
  imageId,
  onClose,
  onUseAsInput,
}: {
  imageId: string | null;
  onClose: () => void;
  onUseAsInput?: (id: string) => void;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["image-details", imageId],
    enabled: Boolean(imageId),
    queryFn: async () => {
      const { data: image, error } = await supabase
        .from("generated_images")
        .select(
          "*, generations(*, generation_references(id, source, storage_path)), projects(id, name)",
        )
        .eq("id", imageId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!image) throw new Error("Image not found");

      const root = image.root_image_id ?? image.id;
      const { data: versions } = await supabase
        .from("image_versions")
        .select("id, version, label, image_id, created_at")
        .eq("root_image_id", root)
        .order("version");
      return { image, versions: versions ?? [] };
    },
  });

  const favorite = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("generated_images")
        .update({ is_favorite: !data?.image.is_favorite })
        .eq("id", imageId!);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["image-details", imageId] });
      void queryClient.invalidateQueries({ queryKey: ["gallery"] });
      void queryClient.invalidateQueries({ queryKey: ["generations"] });
    },
  });

  async function download() {
    if (!data) return;
    try {
      const url = await getSignedUrl("generations", data.image.storage_path);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.image.name}.png`;
      a.click();
    } catch (error) {
      toast.error("Download failed", { description: (error as Error).message });
    }
  }

  return (
    <Dialog open={Boolean(imageId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate">{data?.image.name ?? "Image"}</DialogTitle>
        </DialogHeader>

        {isLoading && <Skeleton className="aspect-square w-full" />}

        {data && (
          <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
            <SignedImage
              bucket="generations"
              path={data.image.storage_path}
              alt={data.image.name}
              className="w-full rounded-xl border border-border object-contain"
            />

            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void download()} className="gap-1.5">
                  <Download className="h-4 w-4" /> Download
                </Button>
                <Button size="sm" variant="outline" onClick={() => favorite.mutate()} className="gap-1.5">
                  <Heart className="h-4 w-4" fill={data.image.is_favorite ? "currentColor" : "none"} />
                  {data.image.is_favorite ? "Favorited" : "Favorite"}
                </Button>
                {onUseAsInput && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onUseAsInput(data.image.id);
                      onClose();
                      toast.success("Image attached as input");
                    }}
                  >
                    Use as input
                  </Button>
                )}
              </div>

              <Field label="Prompt">{data.image.generations?.prompt}</Field>
              <Field label="Model">{data.image.generations?.model}</Field>
              <Field label="Settings">
                {data.image.generations?.size} · {data.image.generations?.quality} ·{" "}
                {data.image.generations?.output_format} · background {data.image.generations?.background}
              </Field>
              <Field label="Project">{data.image.projects?.name ?? "—"}</Field>
              <Field label="Date">{format(new Date(data.image.created_at), "PPp")}</Field>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">References used</p>
                {(data.image.generations?.generation_references.length ?? 0) === 0 ? (
                  <p className="mt-1 text-muted-foreground">None</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.image.generations?.generation_references.map((r) => (
                      <div key={r.id} className="flex items-center gap-1.5">
                        {r.storage_path && (
                          <SignedImage
                            bucket={r.source === "previous" ? "generations" : "references"}
                            path={r.storage_path}
                            alt={r.source}
                            className="h-10 w-10 rounded-md border border-border object-cover"
                          />
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {r.source}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                {data.image.generations?.reference_profile_summary && (
                  <p className="mt-2 flex gap-1.5 text-xs text-muted-foreground">
                    <Layers className="mt-0.5 h-3 w-3 shrink-0" />
                    {data.image.generations.reference_profile_summary}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Version history</p>
                <ul className="mt-1 space-y-1">
                  {data.versions.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-2">
                      <span className={v.image_id === data.image.id ? "font-medium text-primary" : ""}>
                        {v.label ?? `Version ${v.version}`}
                      </span>
                      <span className="text-xs text-muted-foreground">{format(new Date(v.created_at), "PP")}</span>
                    </li>
                  ))}
                  {data.versions.length === 0 && <li className="text-muted-foreground">Original only</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words">{children}</p>
    </div>
  );
}
