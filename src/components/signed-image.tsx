import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

const cache = new Map<string, { url: string; expires: number }>();

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  const key = `${bucket}/${path}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error(error?.message ?? "Could not load image");
  cache.set(key, { url: data.signedUrl, expires: Date.now() + (expiresIn - 60) * 1000 });
  return data.signedUrl;
}

export function SignedImage({
  bucket,
  path,
  alt,
  className,
  onClick,
}: {
  bucket: string;
  path: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    getSignedUrl(bucket, path)
      .then((u) => active && setUrl(u))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [bucket, path]);

  if (failed) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  if (!url) return <div className={cn("animate-pulse bg-muted", className)} />;

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      onClick={onClick}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
