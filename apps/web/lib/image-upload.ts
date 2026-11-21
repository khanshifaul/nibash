export const IMAGE_UPLOAD = {
  maxBytes: 5 * 1024 * 1024,
  minWidth: 800,
  minHeight: 600,
  // card previews use 4/3 and 16/10; allow common photo ratios
  minRatio: 3 / 4, // portrait limit
  maxRatio: 16 / 9,
  accept: ["image/jpeg", "image/png", "image/webp"],
} as const;

export type ImageValidationResult = { ok: true } | { ok: false; error: string };

export function validateImageFile(file: File): Promise<ImageValidationResult> {
  if (!IMAGE_UPLOAD.accept.includes(file.type as (typeof IMAGE_UPLOAD.accept)[number])) {
    return Promise.resolve({ ok: false, error: "Use JPG, PNG, or WebP images." });
  }
  if (file.size > IMAGE_UPLOAD.maxBytes) {
    return Promise.resolve({ ok: false, error: "Image must be 5MB or smaller." });
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      if (width < IMAGE_UPLOAD.minWidth || height < IMAGE_UPLOAD.minHeight) {
        resolve({
          ok: false,
          error: `Image must be at least ${IMAGE_UPLOAD.minWidth}x${IMAGE_UPLOAD.minHeight}px.`,
        });
        return;
      }
      const ratio = width / height;
      if (ratio < IMAGE_UPLOAD.minRatio || ratio > IMAGE_UPLOAD.maxRatio) {
        resolve({
          ok: false,
          error: "Image ratio must be between 3:4 and 16:9 for card previews.",
        });
        return;
      }
      resolve({ ok: true });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: "Could not read image file." });
    };
    img.src = url;
  });
}
