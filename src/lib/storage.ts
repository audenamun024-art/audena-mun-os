import { supabase } from "@/integrations/supabase/client";
import { retryAsync, withTimeout } from "@/lib/async";

const DEFAULT_TIMEOUT = 120000;
const DEFAULT_CACHE_CONTROL = "3600";

type UploadOptions = {
  bucket?: string;
  path: string;
  file: File;
  onProgress?: (value: number) => void;
  timeoutMs?: number;
  cacheControl?: string;
  upsert?: boolean;
};

export async function uploadPublicFile({
  bucket = "uploads",
  path,
  file,
  onProgress,
  timeoutMs = DEFAULT_TIMEOUT,
  cacheControl = DEFAULT_CACHE_CONTROL,
  upsert = true,
}: UploadOptions) {
  let progressValue = 10;
  let progressTimer: ReturnType<typeof setInterval> | undefined;

  const startProgress = () => {
    onProgress?.(progressValue);
    progressTimer = setInterval(() => {
      progressValue = Math.min(progressValue + 6, 78);
      onProgress?.(progressValue);
    }, 700);
  };

  const stopProgress = () => {
    if (progressTimer) clearInterval(progressTimer);
  };

  startProgress();

  try {
    await retryAsync(
      () =>
        withTimeout(
          supabase.storage.from(bucket).upload(path, file, {
            cacheControl,
            contentType: file.type,
            upsert,
          }),
          timeoutMs,
          "Upload timed out"
        ).then(({ error }) => {
          if (error) throw error;
        }),
      1
    );

    stopProgress();
    onProgress?.(92);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onProgress?.(100);
    return data.publicUrl;
  } finally {
    stopProgress();
  }
}
