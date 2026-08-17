import { EmailData } from '../types';

export function compileEmailToHtml(data: EmailData): string {
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
    /* Reset baseline */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; max-width: 100%; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    /* Proteção de Emojis em Clientes de E-mail (Gmail / Outlook Web / Apple Mail) */
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
    
    /* Responsive Styles */
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
          
          <!-- Header Banner -->
          <tr>
            <td align="${textAlign}" style="background-color: ${primaryColor}; padding: 36px 32px;" class="email-padding">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${headerTitle}
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td align="${textAlign}" style="padding: 36px 32px; background-color: #ffffff;" class="email-padding font-responsive">
              <p style="margin-top: 0; margin-bottom: 20px; color: #0f172a; font-size: 18px; font-weight: 700; line-height: 1.4;">
                ${greeting}
              </p>
              
              <div style="color: #475569; font-size: ${isLargeFont ? '17px' : '15px'}; line-height: 1.6; margin-bottom: 32px;">
                <p style="margin-top: 0; margin-bottom: 16px;">${formattedBody}</p>
              </div>

              <!-- Button Container -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="${buttonAlign}">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${buttonUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="15%" stroke="f" fillcolor="${primaryColor}">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${buttonText}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${buttonUrl}" target="_blank" class="action-button" style="background-color: ${primaryColor}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
                      ${buttonText}
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
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
