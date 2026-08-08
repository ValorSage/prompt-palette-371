import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings/account")({
  component: AccountSettings,
});

function AccountSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="panel space-y-4 p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</p>
        <p className="mt-1 font-medium">{user?.email}</p>
      </div>
      <Button
        variant="outline"
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/login", replace: true });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
