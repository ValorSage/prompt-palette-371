import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings/generation")({
  component: GenerationSettings,
});

const fields = [
  { key: "default_size", label: "Default size", options: ["1024x1024", "1024x1536", "1536x1024"] },
  { key: "default_quality", label: "Default quality", options: ["low", "medium", "high"] },
  { key: "default_output_format", label: "Default format", options: ["png", "jpeg", "webp"] },
] as const;

type SettingKey = (typeof fields)[number]["key"];


function GenerationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_settings").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function save(key: SettingKey, value: string) {
    if (!user) return;
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, [key]: value } as never, { onConflict: "user_id" });

    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    toast.success("Preferences saved");
  }

  return (
    <div className="panel space-y-5 p-5">
      {fields.map((field) => (
        <div key={field.key} className="flex items-center justify-between gap-4">
          <label className="text-sm">{field.label}</label>
          <Select
            value={(settings.data?.[field.key] as string) ?? field.options[0]}
            onValueChange={(value) => void save(field.key, value)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
