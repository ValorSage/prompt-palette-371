import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createProject } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const recent = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, updated_at")
        .order("updated_at", { ascending: false })
        .limit(6);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function create() {
    if (!user) return;
    setBusy(true);
    try {
      const project = await createProject(user.id, name.trim() || "Untitled project");
      navigate({ to: "/projects/$projectId", params: { projectId: project.id } });
    } catch (error) {
      toast.error("Could not create project", { description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold">New project</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Each project keeps its own generation history, references and images.
      </p>
      <div className="panel mt-6 flex flex-col gap-3 p-5 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          onKeyDown={(e) => e.key === "Enter" && void create()}
        />
        <Button onClick={() => void create()} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
        </Button>
      </div>

      <h2 className="mt-12 text-lg font-semibold">Recent projects</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {recent.data?.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } })}
            className="panel p-4 text-left transition hover:shadow-glow"
          >
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleString()}</p>
          </button>
        ))}
        {recent.isSuccess && recent.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        )}
      </div>
    </div>
  );
}
