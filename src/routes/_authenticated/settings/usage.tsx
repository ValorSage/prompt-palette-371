import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/usage")({
  component: UsageSettings,
});

function UsageSettings() {
  const usage = useQuery({
    queryKey: ["usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usage_events")
        .select("id, kind, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return (
    <div className="panel divide-y divide-border p-1">
      {usage.data?.map((event) => (
        <div key={event.id} className="flex items-center justify-between p-3 text-sm">
          <span>{event.kind}</span>
          <span className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</span>
        </div>
      ))}
      {usage.isSuccess && usage.data.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">No activity recorded yet.</p>
      )}
    </div>
  );
}
