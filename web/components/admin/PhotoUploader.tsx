"use client";

import { AlertCircle, ImagePlus, Loader2, RotateCcw, Sparkles, Star, Trash2, Wand2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PhotoItem {
  key: string;
  status: "uploading" | "done" | "error";
  /** Enhanced photo (or an existing photo URL when editing). */
  url?: string;
  /** Untouched upload, kept so the admin can switch back. */
  originalUrl?: string;
  useOriginal: boolean;
  /** "basic" | "ai:gemini" | "ai:openai" for new uploads. */
  method?: string;
  preview?: string;
  error?: string;
}

/** Phone photos can be 5-10 MB. Shrink them in the browser before uploading. */
async function shrinkForUpload(file: File): Promise<Blob> {
  const MAX = 2560;
  if (file.size < 1_500_000 || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // Older browsers: send as-is; the server still resizes it.
  }
}

export function PhotoUploader({ initial }: { initial: string[] }) {
  const [items, setItems] = useState<PhotoItem[]>(() =>
    initial.map((url, i) => ({ key: `existing-${i}`, status: "done", url, useOriginal: false })),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const update = (key: string, patch: Partial<PhotoItem>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const added = [...files].map((file) => ({
      file,
      item: {
        key: crypto.randomUUID(),
        status: "uploading" as const,
        useOriginal: false,
        preview: URL.createObjectURL(file),
      },
    }));
    setItems((prev) => [...prev, ...added.map((a) => a.item)]);

    // One at a time: kinder to slow connections, and each photo shows progress.
    for (const { file, item } of added) {
      try {
        const body = new FormData();
        const blob = await shrinkForUpload(file);
        body.append("photo", blob, file.name);
        const res = await fetch("/api/admin/photos", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        update(item.key, { status: "done", url: json.url, originalUrl: json.originalUrl, method: json.method });
        if (json.aiNote) toast.warning("Used basic enhancement", { description: json.aiNote });
      } catch (e) {
        update(item.key, { status: "error", error: (e as Error).message });
      }
    }
  }

  const finalUrls = items
    .filter((it) => it.status === "done")
    .map((it) => (it.useOriginal && it.originalUrl ? it.originalUrl : it.url!));
  const uploading = items.filter((it) => it.status === "uploading").length;

  return (
    <div className="space-y-3">
      {/* What the form actually submits. */}
      <input type="hidden" name="photos" value={finalUrls.join("\n")} />
      <input type="hidden" name="photosUploading" value={uploading} />

      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it, index) => {
            const src = it.status === "done" ? (it.useOriginal && it.originalUrl ? it.originalUrl : it.url) : it.preview;
            const isAi = it.method?.startsWith("ai:");
            return (
              <li key={it.key} className="overflow-hidden rounded-lg border bg-white">
                <div className="relative aspect-[4/3] bg-muted">
                  {src && (
                    // eslint-disable-next-line @next/next/no-img-element -- blob: previews and storage URLs
                    <img src={src} alt={`Photo ${index + 1}`} className="size-full object-cover" />
                  )}
                  {index === 0 && it.status === "done" && (
                    <span className="absolute left-2 top-2 rounded bg-primary-dark px-1.5 py-0.5 text-[11px] font-bold text-white">Cover</span>
                  )}
                  {it.status === "uploading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/75 text-sm font-medium">
                      <Loader2 className="size-5 animate-spin text-primary" />
                      Enhancing…
                    </div>
                  )}
                  {it.status === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/90 p-2 text-center text-xs text-destructive">
                      <AlertCircle className="size-5" />
                      {it.error}
                    </div>
                  )}
                  {it.status === "done" && it.method && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-ink/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      {it.useOriginal ? (
                        "Original"
                      ) : isAi ? (
                        <>
                          <Sparkles className="size-3" /> AI enhanced
                        </>
                      ) : (
                        <>
                          <Wand2 className="size-3" /> Enhanced
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 p-1">
                  {it.originalUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 flex-1 text-xs"
                      onClick={() => update(it.key, { useOriginal: !it.useOriginal })}
                    >
                      {it.useOriginal ? <Wand2 /> : <RotateCcw />}
                      {it.useOriginal ? "Use enhanced" : "Use original"}
                    </Button>
                  )}
                  {index > 0 && it.status === "done" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label="Make cover photo"
                      title="Make cover photo"
                      onClick={() => setItems((prev) => [it, ...prev.filter((p) => p.key !== it.key)])}
                    >
                      <Star />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-9 text-destructive hover:text-destructive"
                    aria-label="Remove photo"
                    disabled={it.status === "uploading"}
                    onClick={() => setItems((prev) => prev.filter((p) => p.key !== it.key))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="outline" className="h-11 w-full border-dashed" onClick={() => inputRef.current?.click()}>
        <ImagePlus /> Add photos
      </Button>
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP. Each photo is straightened, brightened, sharpened and compressed, and its hidden GPS
        location is removed. The original is kept, so you can switch back.
      </p>
    </div>
  );
}
