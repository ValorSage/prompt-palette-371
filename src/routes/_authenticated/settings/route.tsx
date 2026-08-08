import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsLayout,
});

const tabs = [
  { to: "/settings/account", label: "Account" },
  { to: "/settings/generation", label: "Generation" },
  { to: "/settings/references", label: "References" },
  { to: "/settings/usage", label: "Usage" },
] as const;

function SettingsLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { setOpen } = useSidebar();

  const handleBack = () => {
    setOpen(true);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="border-b border-border px-5 py-4 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-secondary transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <nav className="px-5 py-4 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition",
              path === t.to ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-5 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
