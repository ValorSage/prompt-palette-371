import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Layers, FolderKanban, Images, Wand2, ShieldCheck, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumina Studio — AI image generation & editing workspace" },
      {
        name: "description",
        content:
          "A project-based studio for AI image generation and editing with GPT Image 2, a reusable reference library and full version history.",
      },
      { property: "og:title", content: "Lumina Studio — AI image generation workspace" },
      {
        property: "og:description",
        content: "Generate and edit images with GPT Image 2, guided by your own reference collections.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Wand2,
    title: "Generate and edit",
    body: "Write a prompt, attach images and let GPT Image 2 create or edit. Regenerate and produce variations without losing earlier results.",
  },
  {
    icon: Layers,
    title: "Reference library",
    body: "Build collections for brand style, products, characters, fashion or architecture. References are contextual inputs — not model training.",
  },
  {
    icon: FolderKanban,
    title: "Projects & conversations",
    body: "Every project keeps its own chat-style generation history, so a creative thread stays together from first idea to final image.",
  },
  {
    icon: Images,
    title: "Gallery & versions",
    body: "Search, filter, favourite and download. Each image keeps a non-destructive version history: original, version 1, version 2…",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Images live in private storage with signed access, and every record is protected by row-level security tied to your account.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          Lumina Studio
        </div>
        <Button asChild size="sm">
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <section className="bg-hero">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-16 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Powered by OpenAI GPT Image 2
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            An image studio that <span className="text-gradient">remembers your style</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Lumina Studio turns prompting into a real creative workflow: projects, conversation history, a reusable
            reference library and non-destructive versions — all in one workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/login">
                Start creating <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="panel p-6">
              <f.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-semibold">The creative workflow</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              ["Create a project", "Group related work so every generation shares context and history."],
              ["Add references", "Upload images into collections. Lumina builds a cached visual profile from them."],
              ["Generate", "Your prompt plus the reference profile and selected images go to GPT Image 2."],
              ["Refine", "Edit, regenerate or make variations. Each result becomes a new version, never a replacement."],
            ].map(([title, body], i) => (
              <li key={title} className="panel p-5">
                <span className="font-display text-sm text-primary">0{i + 1}</span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Lumina Studio</span>
          <span>References guide generation as contextual inputs — they do not train or fine-tune any model.</span>
        </div>
      </footer>
    </div>
  );
}
