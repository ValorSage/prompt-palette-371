import { createFileRoute, Outlet, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
  errorComponent: () => <div>Error</div>,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }, [queryClient, navigate]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
        <Link to="/projects" className="flex items-center gap-2 hover:opacity-80 transition">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-accent text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-semibold">Lumina Studio</span>
        </Link>
      </header>
      <main className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
