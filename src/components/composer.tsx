import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Layers, History, Settings2, Send, X, Loader2, Wand2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { enhancePromptFn, generateImage } from "@/lib/generation.functions";
import { uploadToBucket, validateImageFile } from "@/lib/data";
import { SignedImage } from "@/components/signed-image";
import { cn } from "@/lib/utils";

export type ComposerSettings = {
  model: string;
  size: string;
  quality: string;
  background: string;
  outputFormat: string;
  n: number;
};

const SIZES = [
  { value: "1024x1024", label: "Square 1024×1024" },
  { value: "1024x1536", label: "Portrait 1024×1536" },
  { value: "1536x1024", label: "Landscape 1536×1024" },
  { value: "auto", label: "Auto" },
];
const QUALITIES = ["auto", "low", "medium", "high"];
const FORMATS = ["png", "jpeg", "webp"];
const BACKGROUNDS = ["auto", "transparent", "opaque"];

export function Composer({
  projectId,
  conversationId,
  userId,
  previousImageId,
  onClearPrevious,
  defaults,
}: {
  projectId: string;
  conversationId: string;
  userId: string;
  previousImageId: string | null;
  onClearPrevious: () => void;
  defaults: ComposerSettings;
}) {
  const queryClient = useQueryClient();
  const generate = useServerFn(generateImage);
  const enhance = useServerFn(enhancePromptFn);
  const fileInput = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState<ComposerSettings>(defaults);
  const [uploads, setUploads] = useState<Array<{ path: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  useEffect(() => setSettings(defaults), [defaults]);

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_collections")
        .select("id, name, reference_images(count)")
        .order("created_at");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () =>
      generate({
        data: {
          prompt,
          projectId,
          conversationId,
          model: settings.model,
          size: settings.size,
          quality: settings.quality,
          background: settings.background,
          outputFormat: settings.outputFormat,
          n: settings.n,
          referenceImageIds: selectedRefs,
          referenceCollectionIds: selectedCollections,
          uploadedPaths: uploads.map((u) => u.path),
          previousImageId,
        },
      }),
    onSuccess: () => {
      setPrompt("");
      setUploads([]);
      onClearPrevious();
      void queryClient.invalidateQueries({ queryKey: ["generations", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image ready");
    },
    onError: (error: Error) => toast.error("Generation failed", { description: error.message }),
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 8)) {
        const problem = validateImageFile(file);
        if (problem) {
          toast.error(problem);
          continue;
        }
        const path = await uploadToBucket("references", userId, file, "composer");
        setUploads((prev) => [...prev, { path, name: file.name }]);
      }
    } catch (error) {
      toast.error("Upload failed", { description: (error as Error).message });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const busy = mutation.isPending;

  return (
    <div className="border-t border-border bg-surface/80 p-3 backdrop-blur sm:p-4">
      <div className="mx-auto max-w-4xl">
        {(uploads.length > 0 || previousImageId || selectedRefs.length > 0 || selectedCollections.length > 0) && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {uploads.map((u) => (
              <div key={u.path} className="relative">
                <SignedImage
                  bucket="references"
                  path={u.path}
                  alt={u.name}
                  className="h-14 w-14 rounded-lg border border-border object-cover"
                />
                <button
                  aria-label={`Remove ${u.name}`}
                  onClick={() => setUploads((prev) => prev.filter((p) => p.path !== u.path))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {previousImageId && (
              <Badge variant="secondary" className="gap-1">
                Using previous image
                <button aria-label="Remove previous image" onClick={onClearPrevious}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedRefs.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                {selectedRefs.length} reference image{selectedRefs.length > 1 ? "s" : ""}
                <button aria-label="Clear references" onClick={() => setSelectedRefs([])}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCollections.map((id) => {
              const c = collections?.find((x) => x.id === id);
              return (
                <Badge key={id} variant="outline" className="gap-1">
                  {c?.name ?? "Collection"}
                  <button
                    aria-label="Remove collection"
                    onClick={() => setSelectedCollections((prev) => prev.filter((p) => p !== id))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        <div className="panel p-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && prompt.trim() && !busy) mutation.mutate();
            }}
            placeholder="Describe the image you want, or how to edit the attached images…"
            className="min-h-[84px] resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
          />

          <div className="flex flex-wrap items-center gap-1.5 px-1 pb-1 pt-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Add Image
            </Button>

            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setRefPickerOpen(true)}>
              <Layers className="h-4 w-4" />
              References
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1.5", previousImageId && "text-primary")}
              onClick={() => {
                if (previousImageId) onClearPrevious();
                else toast.info("Open an image and choose “Use as input” to continue from it.");
              }}
            >
              <History className="h-4 w-4" />
              Previous Image
            </Button>

            <Select value={settings.model} onValueChange={(v) => setSettings((s) => ({ ...s, model: v }))}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-image-2">GPT Image 2</SelectItem>
                <SelectItem value="gpt-image-1">GPT Image 1</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Settings2 className="h-4 w-4" />
                  Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Size</Label>
                  <Select value={settings.size} onValueChange={(v) => setSettings((s) => ({ ...s, size: v }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Quality</Label>
                  <Select value={settings.quality} onValueChange={(v) => setSettings((s) => ({ ...s, quality: v }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALITIES.map((q) => (
                        <SelectItem key={q} value={q}>
                          {q}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Output format</Label>
                  <Select
                    value={settings.outputFormat}
                    onValueChange={(v) => setSettings((s) => ({ ...s, outputFormat: v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Background</Label>
                  <Select
                    value={settings.background}
                    onValueChange={(v) => setSettings((s) => ({ ...s, background: v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKGROUNDS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Number of images</Label>
                  <Select value={String(settings.n)} onValueChange={(v) => setSettings((s) => ({ ...s, n: Number(v) }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              className="ml-auto gap-1.5"
              disabled={!prompt.trim() || busy}
              onClick={() => mutation.mutate()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Generate
            </Button>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          References are contextual inputs to the model — they never train or fine-tune it.
        </p>
      </div>

      <ReferencePicker
        open={refPickerOpen}
        onOpenChange={setRefPickerOpen}
        selectedRefs={selectedRefs}
        setSelectedRefs={setSelectedRefs}
        selectedCollections={selectedCollections}
        setSelectedCollections={setSelectedCollections}
      />
    </div>
  );
}

function ReferencePicker({
  open,
  onOpenChange,
  selectedRefs,
  setSelectedRefs,
  selectedCollections,
  setSelectedCollections,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedRefs: string[];
  setSelectedRefs: (v: string[]) => void;
  selectedCollections: string[];
  setSelectedCollections: (v: string[]) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["reference-picker"],
    enabled: open,
    queryFn: async () => {
      const { data: cols, error } = await supabase
        .from("reference_collections")
        .select("id, name, reference_images(id, name, storage_path)")
        .order("created_at");
      if (error) throw new Error(error.message);
      return cols;
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select references</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          {isLoading && <div className="h-24 animate-pulse rounded-lg bg-muted" />}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No collections yet. Create one in the References section.
            </p>
          )}
          <div className="space-y-5">
            {data?.map((collection) => (
              <div key={collection.id}>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={selectedCollections.includes(collection.id)}
                    onCheckedChange={(checked) =>
                      setSelectedCollections(
                        checked
                          ? [...selectedCollections, collection.id]
                          : selectedCollections.filter((id) => id !== collection.id),
                      )
                    }
                  />
                  {collection.name}
                  <span className="text-xs text-muted-foreground">
                    ({collection.reference_images.length} images · whole collection profile)
                  </span>
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {collection.reference_images.map((img) => {
                    const active = selectedRefs.includes(img.id);
                    return (
                      <button
                        key={img.id}
                        onClick={() =>
                          setSelectedRefs(
                            active ? selectedRefs.filter((id) => id !== img.id) : [...selectedRefs, img.id],
                          )
                        }
                        className={cn(
                          "overflow-hidden rounded-lg border-2 transition",
                          active ? "border-primary shadow-glow" : "border-transparent hover:border-border",
                        )}
                      >
                        <SignedImage
                          bucket="references"
                          path={img.storage_path}
                          alt={img.name}
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Up to 16 images are sent to the model per request.</span>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
