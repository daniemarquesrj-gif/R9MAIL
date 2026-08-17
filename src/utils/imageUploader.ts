import { uploadImageToFirebaseStorage } from './firebaseStorage';

export interface UploadResult {
  url: string;
  isPublicUrl: boolean;
  message: string;
  isFirebase?: boolean;
  provider?: string;
}

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Validates if an image File or Base64 string is under the maximum allowed size (default 5MB).
 */
export function checkImageSize(fileOrBase64: File | string, maxMB = MAX_IMAGE_SIZE_MB): { valid: boolean; sizeMB: number; message?: string } {
  const maxBytes = maxMB * 1024 * 1024;
  let sizeInBytes = 0;

  if (typeof fileOrBase64 === 'string') {
    if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) {
      return { valid: true, sizeMB: 0 };
    }
    const cleanBase64 = fileOrBase64.replace(/^data:image\/\w+;base64,/, '');
    const padding = (cleanBase64.match(/=/g) || []).length;
    sizeInBytes = (cleanBase64.length * 3) / 4 - padding;
  } else {
    sizeInBytes = fileOrBase64.size;
  }

  const sizeMB = sizeInBytes / (1024 * 1024);
  if (sizeInBytes > maxBytes) {
    return {
      valid: false,
      sizeMB,
      message: `A imagem possui ${sizeMB.toFixed(2)} MB, excedendo o limite máximo de ${maxMB} MB por upload.`
    };
  }

  return { valid: true, sizeMB };
}

/**
 * Multi-provider public image upload pipeline for HTML Email compatibility.
 * Email readers (Gmail, Outlook, Yahoo) strip or hide Base64 images (data:image/...).
 * This function primary uses Firebase Storage (/emails/) and falls back to 
 * public HTTPS image hosts so images render reliably in 100% of email clients.
 * Enforces a strict 5MB maximum file size limit.
 */
export async function uploadToPublicHost(fileOrBase64: File | string, filename?: string): Promise<UploadResult> {
  // Check image size before processing
  const sizeValidation = checkImageSize(fileOrBase64, MAX_IMAGE_SIZE_MB);
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.message);
  }

  // If already a public HTTPS or HTTP URL, return immediately
  if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
    const isFirebase = fileOrBase64.includes('firebasestorage') || fileOrBase64.includes('googleapis.com');
    return {
      url: fileOrBase64,
      isPublicUrl: true,
      isFirebase,
      provider: isFirebase ? 'Firebase Storage' : 'URL Externa',
      message: 'A imagem já é uma URL pública HTTPS.'
    };
  }

  let base64Clean = '';
  let blob: Blob | null = null;

  if (typeof fileOrBase64 === 'string') {
    base64Clean = fileOrBase64.replace(/^data:image\/\w+;base64,/, '');
    try {
      const byteCharacters = atob(base64Clean);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'image/png' });
    } catch (e) {
      console.warn('Erro ao converter base64 para Blob:', e);
    }
  } else {
    blob = fileOrBase64;
    base64Clean = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.replace(/^data:image\/\w+;base64,/, ''));
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem'));
      reader.readAsDataURL(fileOrBase64);
    });
  }

  // 1. PRIMARY PROVIDER: Firebase Storage (/emails/ folder)
  try {
    const fbResult = await uploadImageToFirebaseStorage(fileOrBase64, filename);
    if (fbResult.url && (fbResult.url.startsWith('http://') || fbResult.url.startsWith('https://'))) {
      return {
        url: fbResult.url,
        isPublicUrl: true,
        isFirebase: true,
        provider: 'Firebase Storage',
        message: '🔥 Imagem hospedada no Firebase Storage (/emails/) com URL pública inserida no HTML!'
      };
    }
  } catch (fbErr: any) {
    console.warn('Firebase Storage indisponível, acionando servidores públicos de contingência:', fbErr);
  }

  // 2. CONTINGENCY 1: FreeImage API
  try {
    const formData = new FormData();
    formData.append('key', '6d2092832264d1d400254f2e40632186');
    formData.append('action', 'upload');
    formData.append('source', base64Clean);
    formData.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });

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
  } catch (err) {
    console.warn('FreeImage upload failed:', err);
  }

  // 3. CONTINGENCY 2: ImgBB API
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

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

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
    } catch (err) {
      console.warn('ImgBB upload key failed:', err);
    }
  }

  // 4. CONTINGENCY 3: TmpFiles API
  if (blob) {
    try {
      const formData = new FormData();
      formData.append('file', blob, filename || 'email_banner.png');

      const response = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

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
    } catch (err) {
      console.warn('TmpFiles upload failed:', err);
    }
  }

  // Fallback to local Base64
  const fallbackUrl = typeof fileOrBase64 === 'string' 
    ? fileOrBase64 
    : `data:${fileOrBase64.type || 'image/png'};base64,${base64Clean}`;

  return {
    url: fallbackUrl,
    isPublicUrl: false,
    message: '⚠️ A imagem foi salva localmente em Base64. Leitores como Gmail/Outlook podem bloquear Base64.'
  };
}
