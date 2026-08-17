/**
 * Utility to normalize and optimize images for HTML Email compatibility.
 * Resizes large images (canvas scaling) and converts to standard compressed JPEG/PNG Data URLs,
 * ensuring responsive scaling across both Desktop and Mobile email clients and viewports.
 */

export async function normalizeImage(fileOrUrl: File | string, maxDimension = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const processImage = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(typeof fileOrUrl === 'string' ? fileOrUrl : '');
          return;
        }

        // Scale down if larger than maxDimension while keeping exact aspect ratio
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
          resolve(typeof fileOrUrl === 'string' ? fileOrUrl : '');
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Detect if original format was PNG to preserve alpha transparency
        const isPng =
          typeof fileOrUrl === 'string'
            ? fileOrUrl.startsWith('data:image/png') || fileOrUrl.toLowerCase().includes('.png')
            : fileOrUrl.type === 'image/png';

        const mimeType = isPng ? 'image/png' : 'image/jpeg';
        const quality = isPng ? undefined : 0.88;
        const dataUrl = canvas.toDataURL(mimeType, quality);

        resolve(dataUrl);
      } catch (err) {
        // Fallback to original string if canvas CORS or processing fails
        if (typeof fileOrUrl === 'string') {
          resolve(fileOrUrl);
        } else {
          reject(err);
        }
      }
    };

    img.onload = processImage;
    img.onerror = () => {
      if (typeof fileOrUrl === 'string') {
        resolve(fileOrUrl);
      } else {
        reject(new Error('Não foi possível carregar a imagem para normalização.'));
      }
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Erro ao ler arquivo de imagem.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
      reader.readAsDataURL(fileOrUrl);
    }
  });
}
