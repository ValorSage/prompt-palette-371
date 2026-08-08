import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Lumina Studio" },
      { name: "description", content: "Sign in with Google to open your AI image generation workspace." },
      { property: "og:title", content: "Sign in — Lumina Studio" },
      { property: "og:description", content: "Sign in with Google to open your AI image generation workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function signIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Sign-in failed", { description: result.error.message });
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background bg-hero px-4">
      <div className="panel w-full max-w-sm p-8 text-center">
        <Link to="/" className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-accent">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Welcome to Lumina Studio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to generate, edit and organise your images. Your projects, references and generations stay private to
          your account.
        </p>
        <Button className="mt-7 w-full" size="lg" onClick={signIn} disabled={loading || checking}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue with Google
        </Button>
        <Link to="/" className="mt-5 inline-block text-xs text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
      </div>
    </div>
  );
}
