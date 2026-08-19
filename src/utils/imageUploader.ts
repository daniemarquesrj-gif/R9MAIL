import { uploadImageToFirebaseStorage } from './firebaseStorage';

export interface UploadResult {
  url: string;
  isPublicUrl: boolean;
  message: string;
  isFirebase?: boolean;
  provider?: string;
  warning?: string;
}

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const NETWORK_TIMEOUT_MS = 10000;

/**
 * Helper to fetch with an abort timeout so requests never hang indefinitely.
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = NETWORK_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Validates if an image File or Base64 string is valid and under the maximum allowed size (default 5MB).
 */
export function checkImageSize(
  fileOrBase64: File | string | null | undefined,
  maxMB = MAX_IMAGE_SIZE_MB
): { valid: boolean; sizeMB: number; message?: string } {
  if (!fileOrBase64) {
    return {
      valid: false,
      sizeMB: 0,
      message: 'Nenhum arquivo ou imagem foi fornecido para validação.'
    };
  }

  const maxBytes = maxMB * 1024 * 1024;
  let sizeInBytes = 0;

  try {
    if (typeof fileOrBase64 === 'string') {
      const trimmed = fileOrBase64.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return { valid: true, sizeMB: 0 };
      }
      const cleanBase64 = trimmed.replace(/^data:image\/[a-zA-Z+.-]+;base64,/, '');
      const padding = (cleanBase64.match(/=/g) || []).length;
      sizeInBytes = (cleanBase64.length * 3) / 4 - padding;
    } else if (fileOrBase64 && typeof fileOrBase64 === 'object' && 'size' in fileOrBase64) {
      sizeInBytes = (fileOrBase64 as File | Blob).size;
    } else {
      return {
        valid: false,
        sizeMB: 0,
        message: 'Formato de imagem inválido. Forneça um arquivo de imagem válido ou uma URL.'
      };
    }

    const sizeMB = sizeInBytes / (1024 * 1024);
    if (sizeInBytes > maxBytes) {
      return {
        valid: false,
        sizeMB,
        message: `A imagem possui ${sizeMB.toFixed(2)} MB, excedendo o limite máximo seguro de ${maxMB} MB por upload.`
      };
    }

    return { valid: true, sizeMB };
  } catch (err: any) {
    return {
      valid: false,
      sizeMB: 0,
      message: `Falha ao inspecionar o tamanho da imagem: ${err?.message || 'Arquivo corrompido'}`
    };
  }
}

/**
 * Multi-provider public image upload pipeline for HTML Email compatibility.
 * Email readers (Gmail, Outlook, Yahoo) strip or hide Base64 images (data:image/...).
 * This function primary uses Firebase Storage (/emails/) and falls back through
 * multiple public HTTPS hosts with timeout guards so images render reliably in 100% of email clients.
 * Enforces a strict 5MB maximum file size limit and handles offline/network errors gracefully.
 */
export async function uploadToPublicHost(
  fileOrBase64: File | string | null | undefined,
  filename?: string
): Promise<UploadResult> {
  if (!fileOrBase64) {
    throw new Error('Nenhuma imagem fornecida para o pipeline de upload.');
  }

  // 1. Check image size & format before processing
  const sizeValidation = checkImageSize(fileOrBase64, MAX_IMAGE_SIZE_MB);
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.message || 'Validação de tamanho da imagem falhou.');
  }

  // 2. If already a public HTTPS or HTTP URL, return immediately
  if (typeof fileOrBase64 === 'string') {
    const trimmed = fileOrBase64.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const isFirebase = trimmed.includes('firebasestorage') || trimmed.includes('googleapis.com');
      return {
        url: trimmed,
        isPublicUrl: true,
        isFirebase,
        provider: isFirebase ? 'Firebase Storage' : 'URL Externa',
        message: 'A imagem já é uma URL pública HTTPS direta.'
      };
    }
  }

  let base64Clean = '';
  let blob: Blob | null = null;

  try {
    if (typeof fileOrBase64 === 'string') {
      base64Clean = fileOrBase64.replace(/^data:image\/[a-zA-Z+.-]+;base64,/, '').trim();
      try {
        const byteCharacters = atob(base64Clean);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/png' });
      } catch (e) {
        console.warn('Erro ao decodificar Base64 para Blob binário:', e);
      }
    } else {
      blob = fileOrBase64;
      base64Clean = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          if (!res) {
            reject(new Error('Conteúdo vazio ao ler imagem.'));
            return;
          }
          resolve(res.replace(/^data:image\/[a-zA-Z+.-]+;base64,/, ''));
        };
        reader.onerror = () => reject(new Error('Falha no leitor de arquivos do navegador.'));
        reader.readAsDataURL(fileOrBase64);
      });
    }
  } catch (readErr: any) {
    console.error('Erro na extração de dados da imagem:', readErr);
    throw new Error(`Não foi possível processar os dados da imagem: ${readErr?.message || 'Arquivo inválido'}`);
  }

  // Safe file name sanitize
  const safeFilename = (filename || 'email_image.png').replace(/[^a-zA-Z0-9._-]/g, '_');

  // 3. PRIMARY PROVIDER: Firebase Storage (/emails/ folder)
  try {
    const fbResult = await uploadImageToFirebaseStorage(fileOrBase64, safeFilename);
    if (fbResult && fbResult.url && (fbResult.url.startsWith('http://') || fbResult.url.startsWith('https://'))) {
      return {
        url: fbResult.url,
        isPublicUrl: true,
        isFirebase: true,
        provider: 'Firebase Storage',
        message: '🔥 Imagem hospedada no Firebase Storage (/emails/) com URL pública inserida no HTML!'
      };
    }
  } catch (fbErr: any) {
    console.warn('Firebase Storage indisponível ou não configurado, acionando servidores públicos de contingência:', fbErr?.message || fbErr);
  }

  // 4. CONTINGENCY 1: FreeImage API with timeout
  if (base64Clean) {
    try {
      const formData = new FormData();
      formData.append('key', '6d2092832264d1d400254f2e40632186');
      formData.append('action', 'upload');
      formData.append('source', base64Clean);
      formData.append('format', 'json');

      const res = await fetchWithTimeout('https://freeimage.host/api/1/upload', {
        method: 'POST',
        body: formData,
      }, NETWORK_TIMEOUT_MS);

      if (res.ok) {
        const json = await res.json();
        if (json && json.image && json.image.url) {
          return {
            url: json.image.url,
            isPublicUrl: true,
            provider: 'FreeImage',
            message: '✨ Imagem hospedada com sucesso! Link HTTPS público gerado.'
          };
        }
      }
    } catch (err: any) {
      console.warn('Contingência FreeImage falhou ou expirou tempo limite:', err?.message);
    }
  }

  // 5. CONTINGENCY 2: ImgBB API with key rotation and timeout
  if (base64Clean) {
    const IMGBB_KEYS = [
      '6d700573b9e05c303875e67acf12aa9f',
      '3b00d81d4b6801833e70d744f9c1ec13',
      '2f481710b77e8a939499898c8c5123d9'
    ];

    for (const apiKey of IMGBB_KEYS) {
      try {
        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('image', base64Clean);

        const response = await fetchWithTimeout('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: formData,
        }, 7000);

        if (response.ok) {
          const data = await response.json();
          if (data && data.data && data.data.url) {
            return {
              url: data.data.url,
              isPublicUrl: true,
              provider: 'ImgBB',
              message: '✨ Imagem hospedada no ImgBB com sucesso! Link HTTPS compatível com e-mails.'
            };
          }
        }
      } catch (err: any) {
        console.warn(`ImgBB upload com chave ${apiKey.slice(0, 6)}... falhou:`, err?.message);
      }
    }
  }

  // 6. CONTINGENCY 3: TmpFiles API with timeout
  if (blob) {
    try {
      const formData = new FormData();
      formData.append('file', blob, safeFilename);

      const response = await fetchWithTimeout('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData,
      }, NETWORK_TIMEOUT_MS);

      if (response.ok) {
        const data = await response.json();
        if (data && data.data && data.data.url) {
          const directUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
          return {
            url: directUrl,
            isPublicUrl: true,
            provider: 'TmpFiles',
            message: '✨ Imagem hospedada com sucesso! URL pública vinculada.'
          };
        }
      }
    } catch (err: any) {
      console.warn('Contingência TmpFiles falhou:', err?.message);
    }
  }

  // 7. FINAL SAFE FALLBACK: Local Base64 format (with explicit warning)
  const mimeType = (fileOrBase64 instanceof File ? fileOrBase64.type : '') || 'image/png';
  const fallbackUrl = typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')
    ? fileOrBase64
    : `data:${mimeType};base64,${base64Clean}`;

  return {
    url: fallbackUrl,
    isPublicUrl: false,
    provider: 'Base64 Local',
    message: '⚠️ Armazenada localmente em Base64. (Servidores de upload externos indisponíveis).',
    warning: 'Alguns provedores de e-mail (Gmail Web/Outlook) podem ocultar imagens incorporadas em Base64.'
  };
}
