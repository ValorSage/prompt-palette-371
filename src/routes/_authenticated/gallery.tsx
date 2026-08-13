import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/signed-image";
import { ImageDetails } from "@/components/image-details";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type GallerySearch = { favorites?: boolean };

export const Route = createFileRoute("/_authenticated/gallery")({
  validateSearch: (search: Record<string, unknown>): GallerySearch => ({
    favorites: search["favorites"] === true || search["favorites"] === "true",
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { favorites } = Route.useSearch();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState("newest");
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 24;

  const images = useQuery({
    queryKey: ["gallery", { favorites, term, sort, page }],
    queryFn: async () => {
      let query = supabase
        .from("generated_images")
        .select("id, name, storage_path, is_favorite, created_at")
        .order("created_at", { ascending: sort === "oldest" })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (favorites) query = query.eq("is_favorite", true);
      if (term.trim()) query = query.ilike("name", `%${term.trim()}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (image: { id: string; storage_path: string }) => {
      await supabase.storage.from("generations").remove([image.storage_path]);
      const { error } = await supabase.from("generated_images").delete().eq("id", image.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const favorite = useMutation({
    mutationFn: async (image: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from("generated_images")
        .update({ is_favorite: !image.is_favorite })
        .eq("id", image.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["gallery"] }),
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{favorites ? "Favorites" : "Gallery"}</h1>
        <Button
          asChild
          size="icon"
          variant={favorites ? "default" : "outline"}
          aria-label={favorites ? "Show all images" : "Show favorites only"}
          title={favorites ? "Show all images" : "Show favorites only"}
        >
          <Link to="/gallery" search={favorites ? {} : { favorites: true }}>
            <Heart className="h-4 w-4" fill={favorites ? "currentColor" : "none"} />
          </Link>
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Search images"
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {images.isLoading && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      )}

      {images.isSuccess && images.data.length === 0 && (
        <div className="panel mt-6 p-12 text-center text-sm text-muted-foreground">
          Nothing here yet. Generated images appear in your gallery automatically.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.data?.map((img) => (
          <figure key={img.id} className="panel group overflow-hidden">
            <SignedImage
              bucket="generations"
              path={img.storage_path}
              alt={img.name}
              className="aspect-square w-full cursor-zoom-in object-cover"
              onClick={() => setOpenId(img.id)}
            />
            <figcaption className="flex items-center justify-between gap-1 border-t border-border p-1.5">
              <span className="truncate px-1 text-xs text-muted-foreground">{img.name}</span>
              <div className="flex shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Favorite"
                  className={img.is_favorite ? "text-accent" : ""}
                  onClick={() => favorite.mutate(img)}
                >
                  <Heart className="h-4 w-4" fill={img.is_favorite ? "currentColor" : "none"} />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove.mutate(img)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={(images.data?.length ?? 0) < pageSize}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      <ImageDetails imageId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
