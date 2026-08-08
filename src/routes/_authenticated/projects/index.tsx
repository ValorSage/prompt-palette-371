import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Heart } from "lucide-react";
import { useState, useCallback, useMemo, memo } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createProject } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsPage,
});

const ProjectItem = memo(function ProjectItem({
  project,
  editing,
  value,
  onEditChange,
  onValueChange,
  onSave,
  onEditClick,
  onDelete,
}: {
  project: any;
  editing: string | null;
  value: string;
  onEditChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onEditClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="panel flex items-center gap-3 p-4">
      {editing === project.id ? (
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <Input value={value} onChange={(e) => onValueChange(e.target.value)} autoFocus className="h-8" />
          <Button size="sm" type="submit">
            Save
          </Button>
        </form>
      ) : (
        <Link
          to="/projects/$projectId"
          params={{ projectId: project.id }}
          className="flex-1 truncate font-medium hover:text-primary"
        >
          {project.name}
        </Link>
      )}
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {new Date(project.updated_at).toLocaleDateString()}
      </span>
      <Button
        size="icon"
        variant="ghost"
        aria-label="Rename project"
        onClick={onEditClick}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Delete project">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the project, its conversations and its generated images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");

  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, updated_at, generated_images(count)")
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("projects").update({ name }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleCreateProject = useCallback(async () => {
    if (!user) return;
    const project = await createProject(user.id);
    navigate({ to: "/projects/$projectId", params: { projectId: project.id } });
  }, [user, navigate]);

  const handleViewFavorites = useCallback(() => {
    navigate({ to: "/gallery", search: { favorites: true } });
  }, [navigate]);

  const handleRename = useCallback((id: string, name: string) => {
    setEditing(id);
    setValue(name);
  }, []);

  const handleSaveRename = useCallback(() => {
    rename.mutate({ id: editing!, name: value.trim() || value });
  }, [editing, value, rename]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            title="View Favorites"
            onClick={handleViewFavorites}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button
            className="gap-1.5"
            onClick={handleCreateProject}
          >
            <Plus className="h-4 w-4" /> New project
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {projects.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        {projects.isSuccess && projects.data.length === 0 && (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            No projects yet — create your first one to start generating.
          </div>
        )}
        {projects.data?.map((p) => (
          <ProjectItem
            key={p.id}
            project={p}
            editing={editing}
            value={value}
            onEditChange={() => setEditing(null)}
            onValueChange={setValue}
            onSave={handleSaveRename}
            onEditClick={() => handleRename(p.id, p.name)}
            onDelete={() => remove.mutate(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
