'use client';

export interface PreprocessedImageResult {
  dataUri: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  fileName: string;
}

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12MB limit

export async function preprocessReceiptFile(file: File): Promise<PreprocessedImageResult> {
  if (!file) {
    throw new Error('No receipt file provided.');
  }

  const mime = file.type.toLowerCase();
  const isSupported = SUPPORTED_MIME_TYPES.some((t) => mime.includes(t) || file.name.toLowerCase().endsWith('.heic'));
  if (!isSupported && mime) {
    throw new Error(`Unsupported file format (${mime || 'unknown'}). Please upload a JPEG, PNG, WEBP, or PDF.`);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 12MB.`);
  }

  // If PDF, read directly as Base64 data URL
  if (mime === 'application/pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          dataUri: result,
          mimeType: 'application/pdf',
          originalSize: file.size,
          compressedSize: file.size,
          width: 800,
          height: 1100,
          fileName: file.name,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read PDF document.'));
      reader.readAsDataURL(file);
    });
  }

  // For images: optimize using Canvas down to max 1800px & 85% JPEG quality
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUri = e.target?.result as string;
      const img = new window.Image();

      img.onload = () => {
        try {
          const maxDimension = 1800;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback if canvas context fails
            resolve({
              dataUri: rawDataUri,
              mimeType: file.type || 'image/jpeg',
              originalSize: file.size,
              compressedSize: file.size,
              width,
              height,
              fileName: file.name,
            });
            return;
          }

          // Draw image with smoothing for OCR sharpness
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUri = canvas.toDataURL('image/jpeg', 0.85);
          // Calculate approx size in bytes
          const base64Length = compressedDataUri.length - 'data:image/jpeg;base64,'.length;
          const compressedBytes = Math.round((base64Length * 3) / 4);

          resolve({
            dataUri: compressedDataUri,
            mimeType: 'image/jpeg',
            originalSize: file.size,
            compressedSize: compressedBytes,
            width,
            height,
            fileName: file.name,
          });
        } catch (err) {
          // If canvas fails, fallback gracefully to original
          resolve({
            dataUri: rawDataUri,
            mimeType: file.type || 'image/jpeg',
            originalSize: file.size,
            compressedSize: file.size,
            width: img.width || 800,
            height: img.height || 1000,
            fileName: file.name,
          });
        }
      };

      img.onerror = () => {
        reject(new Error('Corrupted or unreadable image file. Please try another photo.'));
      };

      img.src = rawDataUri;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };

    reader.readAsDataURL(file);
  });
}
