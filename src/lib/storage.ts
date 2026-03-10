import { supabase } from "@/integrations/supabase/client";
import { retryAsync, withTimeout } from "@/lib/async";

const DEFAULT_TIMEOUT = 20000;

type UploadOptions = {
  bucket?: string;
  path: string;
  file: File;
  onProgress?: (value: number) => void;
};

export async function uploadPublicFile({ bucket = "uploads", path, file, onProgress }: UploadOptions) {
  onProgress?.(10);

  await retryAsync(
    () =>
      withTimeout(
        supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: true,
        }),
        DEFAULT_TIMEOUT,
        "Upload timed out"
      ).then(({ error }) => {
        if (error) throw error;
      }),
    1
  );

  onProgress?.(85);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  onProgress?.(100);
  return data.publicUrl;
}
