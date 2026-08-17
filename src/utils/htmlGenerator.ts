import { EmailData } from '../types';

export function generateEmailHtml(data: EmailData): string {
  if (data.customCodeHtml) {
    return data.customCodeHtml;
  }

  const primary = data.primaryColor || '#002068';

  return `<style>
    img.emoji, img.CToW4e, img[src*="emoji"], img[src*="emoticons"], img[alt*="emoji"] {
      width: 1.2em !important; height: 1.2em !important; max-width: 1.2em !important; max-height: 1.2em !important; display: inline-block !important; vertical-align: -0.2em !important; margin: 0 0.15em !important;
    }
  </style>
  <div style="font-family: 'Inter', Arial, sans-serif; background-color: #f7f9fc; padding: 40px 20px; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0, 32, 104, 0.12); border: 1px solid #c4c5d5;">
    <div style="background-color: ${primary}; padding: 48px 24px; text-align: center;">
      <h1 style="color: #ffffff; font-family: 'Hanken Grotesk', sans-serif; font-size: 28px; margin: 0; font-weight: 700;">${escapeHtml(data.headerTitle)}</h1>
    </div>
    <div style="padding: 40px 32px; text-align: center;">
      <h2 style="color: #002068; font-size: 20px; margin-bottom: 24px; font-weight: 600;">${escapeHtml(data.greeting)}</h2>
      <div style="color: #444653; font-size: 16px; line-height: 1.6; max-width: 500px; margin: 0 auto 32px auto; text-align: center; white-space: pre-line;">
${escapeHtml(data.bodyText)}
      </div>
      <a href="${escapeHtml(data.buttonUrl)}" style="display: inline-block; background-color: ${primary}; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; padding: 16px 36px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 32, 104, 0.15);">
        ${escapeHtml(data.buttonText)}
      </a>
    </div>
    <div style="background-color: #f2f4f7; padding: 24px; border-top: 1px solid #c4c5d5; text-align: center; font-size: 12px; color: #747684;">
      <p style="margin: 0 0 8px 0;">Você está recebendo este e-mail pois está cadastrado em nossa base de usuários.</p>
      <p style="margin: 0; font-weight: 600;">Estácio de Sá — Educação Digital • Rio de Janeiro</p>
    </div>
  </div>
</div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
