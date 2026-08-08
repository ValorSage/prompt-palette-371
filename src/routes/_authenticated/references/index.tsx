import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_COLLECTIONS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/references/")({
  component: ReferencesPage,
});

function ReferencesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const collections = useQuery({
    queryKey: ["collections-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_collections")
        .select("id, name, kind, max_images, reference_images(count)")
        .order("created_at");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (value: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("reference_collections")
        .insert({ user_id: user.id, name: value, kind: "custom" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["collections-full"] });
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reference_collections").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["collections-full"] }),
  });

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-2xl font-semibold">Reference library</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Collections hold up to 50 images each. Lumina analyses them into a cached visual profile and sends only the
        most relevant images with each request.
      </p>

      <div className="panel mt-6 flex flex-col gap-2 p-4 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New collection name"
          onKeyDown={(e) => e.key === "Enter" && name.trim() && create.mutate(name.trim())}
        />
        <Button className="gap-1.5" disabled={!name.trim()} onClick={() => create.mutate(name.trim())}>
          <Plus className="h-4 w-4" /> Create
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {DEFAULT_COLLECTIONS.map((preset) => (
          <Button key={preset} size="sm" variant="outline" onClick={() => create.mutate(preset)}>
            + {preset}
          </Button>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {collections.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        {collections.data?.map((c) => (
          <div key={c.id} className="panel flex items-center justify-between p-4">
            <Link to="/references/$collectionId" params={{ collectionId: c.id }} className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.reference_images[0]?.count ?? 0} / {c.max_images} images
              </p>
            </Link>
            <Button size="icon" variant="ghost" aria-label="Delete collection" onClick={() => remove.mutate(c.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {collections.isSuccess && collections.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No collections yet.</p>
        )}
      </div>
    </div>
  );
}
