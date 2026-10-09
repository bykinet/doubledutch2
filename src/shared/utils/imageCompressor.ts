export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  sizeKb: number;
  width: number;
  height: number;
  format: string;
}

/**
 * Automatically compresses an uploaded image file:
 * - Dimensions: max 256 x 256 px (maintains aspect ratio)
 * - Format: WebP with transparent alpha channel
 * - Quality: 85% (0.85)
 * - Resulting file size: approx 25 ~ 35 KB
 */
export function compressCharacterImage(
  file: File,
  maxDimension: number = 256,
  quality: number = 0.85
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("파일을 읽는 중 오류가 발생했습니다."));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Scale down to within maxDimension while keeping aspect ratio
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("캔버스 2D 컨텍스트를 생성할 수 없습니다."));
          return;
        }

        // Draw image with transparency preserved
        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Export to WebP format at 85% quality
        let format = "image/webp";
        let dataUrl = canvas.toDataURL(format, quality);

        // Fallback check if browser didn't output webp
        if (!dataUrl.startsWith("data:image/webp")) {
          format = "image/png";
          dataUrl = canvas.toDataURL(format);
        }

        // Calculate binary size from Base64
        const base64Data = dataUrl.split(",")[1] || "";
        const sizeBytes = Math.round((base64Data.length * 3) / 4);
        const sizeKb = Math.round((sizeBytes / 1024) * 10) / 10;

        resolve({
          dataUrl,
          sizeBytes,
          sizeKb,
          width,
          height,
          format,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
