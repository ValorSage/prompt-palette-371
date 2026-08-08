import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/references")({
  component: ReferenceSettings,
});

function ReferenceSettings() {
  const collections = useQuery({
    queryKey: ["collections-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_collections")
        .select("id, name, max_images, reference_images(count)")
        .order("created_at");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return (
    <div className="panel divide-y divide-border p-1">
      {collections.data?.map((c) => (
        <Link
          key={c.id}
          to="/references/$collectionId"
          params={{ collectionId: c.id }}
          className="flex items-center justify-between p-4 text-sm hover:text-primary"
        >
          <span>{c.name}</span>
          <span className="text-xs text-muted-foreground">
            {c.reference_images[0]?.count ?? 0} / {c.max_images}
          </span>
        </Link>
      ))}
      {collections.isSuccess && collections.data.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">No collections yet.</p>
      )}
    </div>
  );
}
