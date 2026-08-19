import { EmailData, EmailBlock, BlockType } from '../types';

/**
 * Helper to get default font size for a block type.
 */
export function getDefaultBlockFontSize(type: BlockType): number {
  switch (type) {
    case 'header':
    case 'header_text':
    case 'title':
      return 28;
    case 'subtitle':
      return 18;
    case 'text':
      return 15;
    case 'button':
      return 16;
    case 'coupon':
      return 22;
    case 'footer':
      return 12;
    default:
      return 16;
  }
}

/**
 * Constructs inline CSS styling string for text blocks with safe defaults.
 */
export function buildTextStyle(
  block: EmailBlock | null | undefined,
  defaultSize: number,
  defaultColor: string,
  defaultAlign: 'left' | 'center' | 'right' | 'justify' = 'left'
): string {
  if (!block) {
    return `color: ${defaultColor}; font-size: ${defaultSize}px; text-align: ${defaultAlign};`;
  }
  const sizeMap: Record<string, number> = { sm: 18, md: 22, lg: 26, xl: 30 };
  const size = block.fontSizePx || (block.fontSize ? sizeMap[block.fontSize] : defaultSize) || defaultSize;
  const color = block.textColor || defaultColor;
  const align = block.alignment || defaultAlign;
  const bold = block.isBold ? 'font-weight: bold;' : 'font-weight: normal;';
  const italic = block.isItalic ? 'font-style: italic;' : 'font-style: normal;';
  
  const decos: string[] = [];
  if (block.isUnderline) decos.push('underline');
  if (block.isStrikethrough) decos.push('line-through');
  const decoStr = decos.length > 0 ? `text-decoration: ${decos.join(' ')};` : 'text-decoration: none;';

  const transform = block.textTransform && block.textTransform !== 'none' ? `text-transform: ${block.textTransform};` : '';
  const fontFam = block.fontFamily ? `font-family: ${block.fontFamily};` : 'font-family: Helvetica, Arial, sans-serif;';
  const lHeight = block.lineHeight ? `line-height: ${block.lineHeight};` : 'line-height: 1.5;';

  return `color: ${color}; font-size: ${size}px; text-align: ${align}; ${bold} ${italic} ${decoStr} ${transform} ${fontFam} ${lHeight}`.trim();
}

/**
 * Generates email-compliant HTML for a single block.
 * Includes data-block-id for granular, in-place DOM preview updates.
 */
export function generateSingleBlockHtml(block: EmailBlock): string {
  if (!block || !block.type) return '';
  const blockIdAttr = block.id ? `data-block-id="${block.id}" id="preview-block-${block.id}"` : '';

  switch (block.type) {
    case 'header_text':
    case 'header': {
      const bg = block.headerBgColor || block.bgColor || '#003bb3';
      const rawTitle = block.headerTitle || 'ESTÁCIO\nSUA MATRÍCULA\nCOMEÇA AQUI!';
      const formattedTitle = String(rawTitle).replace(/\n/g, '<br/>');
      const rawSubtitle = block.headerSubtitle;
      const formattedSubtitle = rawSubtitle ? String(rawSubtitle).replace(/\n/g, '<br/>') : '';

      const titleSize = block.fontSizePx || 28;
      const style = buildTextStyle(
        { ...block, textColor: block.headerTextColor || '#ffffff' },
        titleSize,
        '#ffffff',
        block.alignment || 'center'
      );

      const subColor = block.headerSubtitleColor || '#ffffff';
      const subSize = block.headerSubtitleSizePx || 16;
      const align = block.alignment || 'center';

      return `
    <div ${blockIdAttr} style="background-color: ${bg}; padding: 36px 24px; text-align: ${align}; font-family: Helvetica, Arial, sans-serif;">
      <h1 style="margin: 0; ${style}; line-height: 1.25; letter-spacing: 0.5px;">${formattedTitle}</h1>
      ${formattedSubtitle ? `<p style="margin: 16px 0 0 0; color: ${subColor}; font-size: ${subSize}px; font-weight: 500; text-align: ${align}; line-height: 1.4;">${formattedSubtitle}</p>` : ''}
    </div>`;
    }

    case 'header_image': {
      const imgUrl = block.imageUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&h=200&q=80';
      const alt = block.imageAlt || 'Cabeçalho do E-mail';
      const link = block.imageLink;
      const caption = block.imageCaption;
      const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

      let imgHtml = `<img src="${imgUrl}" alt="${alt}" class="email-header-img" width="100%" style="width: 100% !important; max-width: 100% !important; height: auto !important; display: block; border: 0; outline: none; margin: 0 auto; object-fit: cover;" />`;
      if (link) {
        imgHtml = `<a href="${link}" target="_blank" style="text-decoration: none; display: block; width: 100%;">${imgHtml}</a>`;
      }

      return `
    <div ${blockIdAttr} class="header-img-container" style="padding: 0; width: 100%; text-align: center; font-family: Helvetica, Arial, sans-serif; box-sizing: border-box; overflow: hidden; ${bgStyle}">
      ${imgHtml}
      ${caption ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b; font-style: italic; padding: 0 16px;">${caption}</p>` : ''}
    </div>`;
    }

    case 'title': {
      const align = block.alignment || 'left';
      const txt = block.text || 'Título do Bloco';
      const style = buildTextStyle(block, 28, '#1e1b4b', align);
      const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

      return `
    <div ${blockIdAttr} style="padding: 24px 28px 8px 28px; text-align: ${align}; ${bgStyle}">
      <h2 style="margin: 0; ${style}">${txt}</h2>
    </div>`;
    }

    case 'subtitle': {
      const align = block.alignment || 'left';
      const txt = block.text || 'Subtítulo complementar';
      const style = buildTextStyle(block, 18, '#475569', align);
      const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

      return `
    <div ${blockIdAttr} style="padding: 4px 28px 12px 28px; text-align: ${align}; ${bgStyle}">
      <p style="margin: 0; ${style}">${txt}</p>
    </div>`;
    }

    case 'text': {
      const align = block.alignment || 'left';
      const rawTxt = block.text || 'Insira aqui o texto do seu parágrafo...';
      const formattedTxt = String(rawTxt).replace(/\n/g, '<br/>');
      const style = buildTextStyle(block, 15, '#334155', align);
      const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

      return `
    <div ${blockIdAttr} style="padding: 12px 28px; text-align: ${align}; ${bgStyle}">
      <div style="${style}">${formattedTxt}</div>
    </div>`;
    }

    case 'button': {
      const align = block.alignment || 'center';
      const bg = block.buttonBgColor || '#4f46e5';
      const color = block.buttonTextColor || '#ffffff';
      const label = block.buttonLabel || 'Clique Aqui';
      const url = block.buttonUrl || '#';
      const isFull = block.buttonWidth === 'full';
      const fontFam = block.fontFamily || 'Helvetica, Arial, sans-serif';
      const size = block.fontSizePx || 15;
      const bold = block.isBold !== false ? 'font-weight: bold;' : 'font-weight: normal;';
      const italic = block.isItalic ? 'font-style: italic;' : '';
      const transform = block.textTransform ? `text-transform: ${block.textTransform};` : '';
      const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

      const btnStyle = isFull
        ? `display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: ${bg}; color: ${color} !important; padding: 14px 20px; text-decoration: none; ${bold} ${italic} ${transform} border-radius: 8px; font-size: ${size}px; font-family: ${fontFam};`
        : `display: inline-block; background-color: ${bg}; color: ${color} !important; padding: 12px 28px; text-decoration: none; ${bold} ${italic} ${transform} border-radius: 8px; font-size: ${size}px; font-family: ${fontFam};`;

      return `
    <div ${blockIdAttr} style="padding: 20px 28px; text-align: ${align}; ${bgStyle}">
      <a href="${url}" class="${isFull ? 'btn btn-full' : 'btn btn-auto'}" style="${btnStyle}">${label}</a>
    </div>`;
    }

    case 'image': {
      const imgUrl = block.imageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80';
      const alt = block.imageAlt || 'Banner Promocional';
      const link = block.imageLink;
      const caption = block.imageCaption;
      const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

      let imgHtml = `<img src="${imgUrl}" alt="${alt}" class="email-banner-img" width="100%" style="width: 100% !important; max-width: 100% !important; height: auto !important; display: block; border: 0; outline: none; margin: 0 auto; border-radius: 6px; object-fit: contain;" />`;
      if (link) {
        imgHtml = `<a href="${link}" target="_blank" style="text-decoration: none; display: block; width: 100%;">${imgHtml}</a>`;
      }

      return `
    <div ${blockIdAttr} class="img-container" style="padding: 16px 28px; text-align: center; font-family: Helvetica, Arial, sans-serif; box-sizing: border-box; width: 100%; ${bgStyle}">
      ${imgHtml}
      ${caption ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-style: italic;">${caption}</p>` : ''}
    </div>`;
    }

    case 'coupon': {
      const code = block.couponCode || 'DESCONTO20';
      const discount = block.couponDiscount || '20% OFF NA PRIMEIRA COMPRA';
      const bg = block.couponBgColor || '#f0fdf4';
      const border = block.couponBorderColor || '#16a34a';
      const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

      return `
    <div ${blockIdAttr} style="padding: 20px 28px; font-family: Helvetica, Arial, sans-serif; ${bgStyle}">
      <div style="background-color: ${bg}; border: 2px dashed ${border}; border-radius: 10px; padding: 20px; text-align: center;">
        <span style="display: block; font-size: 12px; font-weight: bold; color: ${border}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${discount}</span>
        <div style="font-family: monospace; font-size: 22px; font-weight: bold; color: #0f172a; letter-spacing: 2px; padding: 6px 0;">
          ${code}
        </div>
      </div>
    </div>`;
    }

    case 'divider': {
      const style = block.dividerStyle || 'solid';
      const color = block.dividerColor || '#e2e8f0';
      const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

      return `
    <div ${blockIdAttr} style="padding: 16px 28px; ${bgStyle}">
      <hr style="border: none; border-top: 1px ${style} ${color}; margin: 0;" />
    </div>`;
    }

    case 'social': {
      const insta = block.instagramUrl;
      const linkedin = block.linkedinUrl;
      const fb = block.facebookUrl;
      const web = block.websiteUrl;
      const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

      return `
    <div ${blockIdAttr} class="social-block" style="padding: 16px 28px; text-align: center; font-family: Helvetica, Arial, sans-serif; ${bgStyle}">
      <div style="display: inline-flex; gap: 16px; align-items: center; font-size: 13px; font-weight: bold;">
        ${insta ? `<a href="${insta}" style="color: #4f46e5; text-decoration: none;">Instagram</a>` : ''}
        ${linkedin ? `<a href="${linkedin}" style="color: #4f46e5; text-decoration: none;">LinkedIn</a>` : ''}
        ${fb ? `<a href="${fb}" style="color: #4f46e5; text-decoration: none;">Facebook</a>` : ''}
        ${web ? `<a href="${web}" style="color: #4f46e5; text-decoration: none;">Website</a>` : ''}
      </div>
    </div>`;
    }

    case 'footer': {
      const bg = block.footerBgColor || block.bgColor || '#f8fafc';
      const rawTxt = block.footerText || '© 2026 Minha Empresa. Todos os direitos reservados.';
      const formatted = String(rawTxt).replace(/\n/g, '<br/>');
      const style = buildTextStyle(
        { ...block, textColor: block.footerTextColor || '#64748b' },
        block.fontSizePx || 12,
        '#64748b',
        block.alignment || 'center'
      );

      return `
    <div ${blockIdAttr} style="background-color: ${bg}; padding: 20px 24px; border-top: 1px solid #f1f5f9;">
      <div style="${style}">${formatted}</div>
    </div>`;
    }
    default:
      return '';
  }
}

/**
 * Compiles a list of EmailBlock objects into a complete, standalone responsive HTML email document.
 */
export function compileBlocksToHtml(blocks: EmailBlock[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>body { font-family: Helvetica, Arial, sans-serif; padding: 30px; text-align: center; color: #64748b; }</style>
</head>
<body>
  <p>Nenhum bloco no e-mail. Adicione blocos para visualizar.</p>
</body>
</html>`;
  }

  const htmlContent = blocks.map((b) => generateSingleBlockHtml(b)).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 20px 10px;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    .btn {
      transition: opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.9;
    }
    @media (max-width: 620px) {
      body { padding: 8px 4px; }
      .card { border-radius: 6px; }
      .btn-full { width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="card" id="email-preview-card">
    ${htmlContent}
  </div>
</body>
</html>`;
}

/**
 * Universal compiler for EmailData.
 * Returns customCodeHtml if set, otherwise compiles a clean responsive template.
 */
export function compileEmailToHtml(data: EmailData): string {
  if (data.customCodeHtml) {
    return data.customCodeHtml;
  }

  const primaryColor = data.primaryColor || '#2563eb';
  const headerTitle = data.headerTitle || 'Aviso Importante';
  const greeting = data.greeting || 'Olá {{nome}},';
  const bodyText = data.bodyText || '';
  const buttonText = data.buttonText || 'Acessar Conta';
  const buttonUrl = data.buttonUrl || 'https://estacio.br';
  const footerText = data.footerText || '© 2026 Estácio. Todos os direitos reservados.';

  const isLeft = data.alignment === 'left';
  const textAlign = isLeft ? 'left' : 'center';
  const buttonAlign = isLeft ? 'left' : 'center';

  let borderRadius = '8px';
  if (data.cardBorderRadius === 'none') borderRadius = '0px';
  if (data.cardBorderRadius === 'modern') borderRadius = '16px';

  const isMobileFullBtn = data.mobileButtonWidth === 'full';
  const isLargeFont = data.fontSizeLevel === 'large_mobile';

  const formattedBody = bodyText
    ? bodyText.split('\n\n').map(p => p.replace(/\n/g, '<br/>')).join('</p><p style="margin-bottom: 16px;">')
    : 'Temos o prazer de apresentar uma oferta desenhada sob medida para as necessidades de negócios.';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${headerTitle}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; max-width: 100%; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    img.emoji, img.CToW4e, img[src*="emoji"], img[src*="emoticons"], img[alt*="emoji"], img[style*="width: 1em"], img[style*="height: 1em"] {
      width: 1.2em !important;
      height: 1.2em !important;
      max-width: 1.2em !important;
      max-height: 1.2em !important;
      min-width: 0 !important;
      min-height: 0 !important;
      display: inline-block !important;
      vertical-align: -0.2em !important;
      margin: 0 0.15em !important;
      border: 0 !important;
      outline: none !important;
    }
    
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .email-padding { padding: 24px 16px !important; }
      .action-button { display: ${isMobileFullBtn ? 'block' : 'inline-block'} !important; width: ${isMobileFullBtn ? '100%' : 'auto'} !important; text-align: center !important; }
      .font-responsive { font-size: ${isLargeFont ? '17px' : '15px'} !important; line-height: 1.6 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: ${borderRadius}; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td align="${textAlign}" style="background-color: ${primaryColor}; padding: 36px 32px;" class="email-padding">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${headerTitle}
              </h1>
            </td>
          </tr>
          <tr>
            <td align="${textAlign}" style="padding: 36px 32px; background-color: #ffffff;" class="email-padding font-responsive">
              <p style="margin-top: 0; margin-bottom: 20px; color: #0f172a; font-size: 18px; font-weight: 700; line-height: 1.4;">
                ${greeting}
              </p>
              <div style="color: #475569; font-size: ${isLargeFont ? '17px' : '15px'}; line-height: 1.6; margin-bottom: 32px;">
                <p style="margin-top: 0; margin-bottom: 16px;">${formattedBody}</p>
              </div>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="${buttonAlign}">
                    <a href="${buttonUrl}" target="_blank" class="action-button" style="background-color: ${primaryColor}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="${textAlign}" style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 12px; line-height: 1.5;" class="email-padding">
              <p style="margin: 0; white-space: pre-line;">${footerText.replace(/\n/g, '<br/>')}</p>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Backward compatibility alias for generateEmailHtml
 */
export const generateEmailHtml = compileEmailToHtml;
