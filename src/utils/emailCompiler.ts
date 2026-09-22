import type { EmailBlock, EmailData } from '../types';
import { escapeHtml, sanitizeCssValue, sanitizeEmailHtml, sanitizeUrl } from './security';
import { generateSingleBlockHtml } from './compiler';

/**
 * Produces the transport/export version of a visual template.
 * The preview compiler remains DOM-friendly; this compiler adds a table-based
 * email shell, Outlook conditional markup and conservative email CSS.
 */
export function compileBlocksForEmail(blocks: EmailBlock[], data?: EmailData): string {
  const content = (blocks || []).map((block) => {
    if (block.type === 'button') {
      const align = block.alignment || 'center';
      const bg = sanitizeCssValue(block.buttonBgColor || '#4f46e5', '#4f46e5');
      const color = sanitizeCssValue(block.buttonTextColor || '#ffffff', '#ffffff');
      const label = escapeHtml(block.buttonLabel || 'Clique Aqui');
      const url = sanitizeUrl(block.buttonUrl, 'href') || '#';
      const width = block.buttonWidth === 'full' ? '100%' : 'auto';
      return `<tr><td align="${align}" style="padding:20px 28px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="${align}"><tr><td align="center" bgcolor="${bg}" style="border-radius:6px;">
          <a href="${url}" target="_blank" style="display:inline-block;width:${width};background-color:${bg};color:${color} !important;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;line-height:1.2;text-decoration:none;padding:14px 28px;border-radius:6px;">${label}</a>
        </td></tr></table>
      </td></tr>`;
    }
    if (block.type === 'image' || block.type === 'header_image') {
      const src = sanitizeUrl(block.imageUrl, 'src') || '';
      const alt = escapeHtml(block.imageAlt || 'Imagem do e-mail');
      const href = sanitizeUrl(block.imageLink, 'href');
      const align = ['left', 'center', 'right'].includes(block.alignment || '') ? block.alignment! : 'center';
      const bg = sanitizeCssValue(block.bgColor || '#ffffff', '#ffffff');
      const width = Number.isFinite(block.imageWidthPx) ? Math.max(80, Math.min(1200, Number(block.imageWidthPx))) : 600;
      const image = src
        ? `<img src="${src}" alt="${alt}" width="${width}" style="display:block;width:${width}px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;margin:${align === 'left' ? '0 auto 0 0' : align === 'right' ? '0 0 0 auto' : '0 auto'};" />`
        : `<div role="img" aria-label="${alt}" style="padding:32px 16px;background:#f1f5f9;color:#64748b;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:13px;">Imagem não definida</div>`;
      const body = href && src ? `<a href="${href}" target="_blank" style="display:block;text-decoration:none;">${image}</a>` : image;
      return `<tr><td align="${align}" bgcolor="${bg}" style="padding:0;background-color:${bg};">${body}</td></tr>`;
    }
    const blockHtml = generateSingleBlockHtml(block);
    if (!blockHtml) return '';
    return `<tr><td align="center" valign="top" style="padding:0;margin:0;">${blockHtml}</td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
<style>
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  table { border-collapse:collapse !important; }
  img { -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none; max-width:100%; }
  body { margin:0 !important; padding:0 !important; width:100% !important; background:#f1f5f9; }
  a { text-decoration:none; }
  @media screen and (max-width:620px) {
    .email-shell { width:100% !important; }
    .email-padding { padding-left:0 !important; padding-right:0 !important; }
    .email-body { width:100% !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
<center role="article" aria-roledescription="email" lang="pt-BR" style="width:100%;background-color:#f1f5f9;">
<!--[if mso]>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center"><tr><td>
<![endif]-->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-shell" style="max-width:600px;margin:0 auto;background:#ffffff;">
  <tr><td class="email-padding" style="padding:0;margin:0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-body">
      ${content}
    </table>
  </td></tr>
</table>
<!--[if mso]>
</td></tr></table>
<![endif]-->
</center>
</body>
</html>`;

  return sanitizeEmailHtml(html);
}

export function compileTransportHtml(data: EmailData, blocks: EmailBlock[]): string {
  // The visual editor is authoritative when the document source is blocks.
  // customCodeHtml is a derived preview cache in that mode, not the transport source.
  if (data.contentSource === 'html' && data.customCodeHtml) {
    return sanitizeEmailHtml(data.customCodeHtml);
  }
  return compileBlocksForEmail(blocks, data);
}

export function validateEmailLinks(html: string): { valid: boolean; invalidUrls: string[] } {
  const invalidUrls: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('a[href],img[src]').forEach((node) => {
    const attr = node.tagName.toLowerCase() === 'img' ? 'src' : 'href';
    const value = node.getAttribute(attr);
    if (!value || value.startsWith('{{') || value.startsWith('#')) return;
    if (!sanitizeUrl(value, node.tagName.toLowerCase() === 'img' ? 'src' : 'href')) invalidUrls.push(value);
  });
  return { valid: invalidUrls.length === 0, invalidUrls };
}
