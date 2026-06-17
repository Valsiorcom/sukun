// Browser-side image compression: resize to max 800px wide and target <200KB.
// Returns a JPEG/WebP File. Falls back to original on failure or in SSR.

const MAX_WIDTH = 800;
const TARGET_BYTES = 200 * 1024;

export async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  // already small enough and narrow enough? skip
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    // try decreasing quality until below TARGET_BYTES
    const mime = "image/jpeg";
    let quality = 0.85;
    let blob = await canvasToBlob(canvas, mime, quality);
    while (blob && blob.size > TARGET_BYTES && quality > 0.4) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, mime, quality);
    }
    if (!blob) return file;
    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: mime, lastModified: Date.now() });
  } catch {
    return file;
  }
}

function canvasToBlob(c: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((resolve) => c.toBlob((b) => resolve(b), type, q));
}
