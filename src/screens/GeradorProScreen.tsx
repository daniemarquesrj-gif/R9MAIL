import React, { useState, useRef, useEffect } from 'react';
import { EmailData, Screen, TransitionType } from '../types';
import { parseHtmlToBlocks } from '../utils/htmlParser';
import { normalizeImage } from '../utils/imageNormalizer';
import { uploadToPublicHost, checkImageSize } from '../utils/imageUploader';
import { DEFAULT_TEMPLATES } from '../data/templates';
import { RichTextEditor, RichTextEditorRef } from '../components/RichTextEditor';

export type BlockType = 
  | 'header'
  | 'header_text'
  | 'header_image'
  | 'title'
  | 'subtitle'
  | 'text'
  | 'button'
  | 'image'
  | 'coupon'
  | 'divider'
  | 'social'
  | 'footer';

export interface EmailBlock {
  id: string;
  type: BlockType;
  
  // Text content
  text?: string;
  
  // Font and typography formatting
  fontSizePx?: number;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
  bgColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontFamily?: string;
  lineHeight?: string;

  // Header properties
  headerTitle?: string;
  headerSubtitle?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  headerSubtitleColor?: string;
  headerSubtitleSizePx?: number;

  // Button properties
  buttonLabel?: string;
  buttonUrl?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonWidth?: 'full' | 'auto';

  // Image properties
  imageUrl?: string;
  imageAlt?: string;
  imageLink?: string;
  imageCaption?: string;

  // Coupon properties
  couponCode?: string;
  couponDiscount?: string;
  couponBgColor?: string;
  couponBorderColor?: string;

  // Divider properties
  dividerStyle?: 'solid' | 'dashed' | 'dotted';
  dividerColor?: string;

  // Social properties
  instagramUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;

  // Footer properties
  footerText?: string;
  footerBgColor?: string;
  footerTextColor?: string;
}

interface GeradorProScreenProps {
  emailData: EmailData;
  setEmailData: React.Dispatch<React.SetStateAction<EmailData>>;
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
}

const DEFAULT_BLOCKS: EmailBlock[] = [
  {
    id: 'block-1',
    type: 'header_text',
    headerTitle: 'ESTÁCIO\nSUA MATRÍCULA\nCOMEÇA AQUI!',
    headerSubtitle: 'Condições especiais para estudar na Estácio R9 – Taquara',
    headerBgColor: '#003bb3',
    headerTextColor: '#ffffff',
    headerSubtitleColor: '#ffffff',
    alignment: 'center',
    fontSizePx: 28,
    headerSubtitleSizePx: 16,
    isBold: true,
  },
  {
    id: 'block-2',
    type: 'title',
    text: 'Novidades Exclusivas para {{empresa}}',
    fontSizePx: 28,
    textColor: '#1e1b4b',
    alignment: 'left',
    isBold: true,
    fontFamily: 'Helvetica, Arial, sans-serif',
  },
  {
    id: 'block-3',
    type: 'subtitle',
    text: 'Olá {{nome}}, temos uma atualização especial para você!',
    fontSizePx: 18,
    textColor: '#475569',
    alignment: 'left',
    isItalic: false,
    fontFamily: 'Helvetica, Arial, sans-serif',
  },
  {
    id: 'block-4',
    type: 'text',
    text: 'Estamos muito felizes em apresentar as novas funcionalidades desenvolvidas sob medida para impulsionar os resultados de sua equipe.\n\nCom a nossa nova plataforma, você terá controle total sobre suas entregas, relatórios automatizados e integração simplificada em tempo real.',
    fontSizePx: 15,
    textColor: '#334155',
    alignment: 'left',
    lineHeight: '1.6',
    fontFamily: 'Helvetica, Arial, sans-serif',
  },
  {
    id: 'block-5',
    type: 'button',
    buttonLabel: 'Conhecer Plataforma Agora',
    buttonUrl: 'https://exemplo.com/plataforma',
    buttonBgColor: '#4f46e5',
    buttonTextColor: '#ffffff',
    buttonWidth: 'auto',
    alignment: 'center',
    fontSizePx: 16,
    isBold: true,
  },
  {
    id: 'block-6',
    type: 'divider',
    dividerStyle: 'solid',
    dividerColor: '#e2e8f0',
  },
  {
    id: 'block-7',
    type: 'coupon',
    couponCode: 'ESTACIO30OFF',
    couponDiscount: '30% DE DESCONTO NO PLANO ANUAL',
    couponBgColor: '#e0e7ff',
    couponBorderColor: '#6366f1',
    fontSizePx: 22,
    isBold: true,
  },
  {
    id: 'block-8',
    type: 'footer',
    footerText: 'Você está recebendo este e-mail enviado para {{email}}.\n© 2026 Estácio. Todos os direitos reservados.',
    footerBgColor: '#f8fafc',
    footerTextColor: '#64748b',
    fontSizePx: 12,
    alignment: 'center',
  },
];

// Helper to get default font size for a block type
export const getDefaultBlockFontSize = (type: BlockType): number => {
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
};

// Helper to construct inline CSS string for text blocks
function buildTextStyle(block: EmailBlock, defaultSize: number, defaultColor: string, defaultAlign = 'left'): string {
  if (!block) return `color: ${defaultColor}; font-size: ${defaultSize}px; text-align: ${defaultAlign};`;
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

  return `color: ${color}; font-size: ${size}px; text-align: ${align}; ${bold} ${italic} ${decoStr} ${transform} ${fontFam} ${lHeight}`;
}

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

  let htmlContent = '';

  blocks.forEach((block) => {
    if (!block || !block.type) return;
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

        htmlContent += `
    <div style="background-color: ${bg}; padding: 36px 24px; text-align: ${align}; font-family: Helvetica, Arial, sans-serif;">
      <h1 style="margin: 0; ${style}; line-height: 1.25; letter-spacing: 0.5px;">${formattedTitle}</h1>
      ${formattedSubtitle ? `<p style="margin: 16px 0 0 0; color: ${subColor}; font-size: ${subSize}px; font-weight: 500; text-align: ${align}; line-height: 1.4;">${formattedSubtitle}</p>` : ''}
    </div>`;
        break;
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

        htmlContent += `
    <div class="header-img-container" style="padding: 0; width: 100%; text-align: center; font-family: Helvetica, Arial, sans-serif; box-sizing: border-box; overflow: hidden; ${bgStyle}">
      ${imgHtml}
      ${caption ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b; font-style: italic; padding: 0 16px;">${caption}</p>` : ''}
    </div>`;
        break;
      }

      case 'title': {
        const align = block.alignment || 'left';
        const txt = block.text || 'Título do Bloco';
        const style = buildTextStyle(block, 28, '#1e1b4b', align);
        const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

        htmlContent += `
    <div style="padding: 24px 28px 8px 28px; text-align: ${align}; ${bgStyle}">
      <h2 style="margin: 0; ${style}">${txt}</h2>
    </div>`;
        break;
      }

      case 'subtitle': {
        const align = block.alignment || 'left';
        const txt = block.text || 'Subtítulo complementar';
        const style = buildTextStyle(block, 18, '#475569', align);
        const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

        htmlContent += `
    <div style="padding: 4px 28px 12px 28px; text-align: ${align}; ${bgStyle}">
      <p style="margin: 0; ${style}">${txt}</p>
    </div>`;
        break;
      }

      case 'text': {
        const align = block.alignment || 'left';
        const rawTxt = block.text || 'Insira aqui o texto do seu parágrafo...';
        const formattedTxt = String(rawTxt).replace(/\n/g, '<br/>');
        const style = buildTextStyle(block, 15, '#334155', align);
        const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

        htmlContent += `
    <div style="padding: 12px 28px; text-align: ${align}; ${bgStyle}">
      <div style="${style}">${formattedTxt}</div>
    </div>`;
        break;
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

        htmlContent += `
    <div style="padding: 20px 28px; text-align: ${align}; ${bgStyle}">
      <a href="${url}" class="${isFull ? 'btn btn-full' : 'btn btn-auto'}" style="${btnStyle}">${label}</a>
    </div>`;
        break;
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

        htmlContent += `
    <div class="img-container" style="padding: 16px 28px; text-align: center; font-family: Helvetica, Arial, sans-serif; box-sizing: border-box; width: 100%; ${bgStyle}">
      ${imgHtml}
      ${caption ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-style: italic;">${caption}</p>` : ''}
    </div>`;
        break;
      }

      case 'coupon': {
        const code = block.couponCode || 'DESCONTO20';
        const discount = block.couponDiscount || '20% OFF NA PRIMEIRA COMPRA';
        const bg = block.couponBgColor || '#f0fdf4';
        const border = block.couponBorderColor || '#16a34a';
        const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

        htmlContent += `
    <div style="padding: 20px 28px; font-family: Helvetica, Arial, sans-serif; ${bgStyle}">
      <div style="background-color: ${bg}; border: 2px dashed ${border}; border-radius: 10px; padding: 20px; text-align: center;">
        <span style="display: block; font-size: 12px; font-weight: bold; color: ${border}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${discount}</span>
        <div style="font-family: monospace; font-size: 22px; font-weight: bold; color: #0f172a; letter-spacing: 2px; padding: 6px 0;">
          ${code}
        </div>
      </div>
    </div>`;
        break;
      }

      case 'divider': {
        const style = block.dividerStyle || 'solid';
        const color = block.dividerColor || '#e2e8f0';
        const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

        htmlContent += `
    <div style="padding: 16px 28px; ${bgStyle}">
      <hr style="border: none; border-top: 1px ${style} ${color}; margin: 0;" />
    </div>`;
        break;
      }

      case 'social': {
        const insta = block.instagramUrl;
        const linkedin = block.linkedinUrl;
        const fb = block.facebookUrl;
        const web = block.websiteUrl;
        const bgStyle = block.bgColor ? `background-color: ${block.bgColor};` : '';

        htmlContent += `
    <div class="social-block" style="padding: 16px 28px; text-align: center; font-family: Helvetica, Arial, sans-serif; ${bgStyle}">
      <div style="display: inline-flex; gap: 16px; align-items: center; font-size: 13px; font-weight: bold;">
        ${insta ? `<a href="${insta}" style="color: #4f46e5; text-decoration: none;">Instagram</a>` : ''}
        ${linkedin ? `<a href="${linkedin}" style="color: #4f46e5; text-decoration: none;">LinkedIn</a>` : ''}
        ${fb ? `<a href="${fb}" style="color: #4f46e5; text-decoration: none;">Facebook</a>` : ''}
        ${web ? `<a href="${web}" style="color: #4f46e5; text-decoration: none;">Website</a>` : ''}
      </div>
    </div>`;
        break;
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

        htmlContent += `
    <div style="background-color: ${bg}; padding: 20px 24px; border-top: 1px solid #f1f5f9;">
      <div style="${style}">${formatted}</div>
    </div>`;
        break;
      }
    }
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 20px; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    a { color: #4f46e5; }
    img { max-width: 100%; height: auto; border: 0; outline: none; -ms-interpolation-mode: bicubic; }
    .img-container img, img.email-banner-img { width: 100% !important; max-width: 100% !important; height: auto !important; display: block; object-fit: contain; }
    .img-container { width: 100% !important; box-sizing: border-box !important; }

    /* Proteção para Emojis em Clientes de E-mail (Outlook, Gmail Web, Apple Mail) */
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
      object-fit: contain !important;
    }
    @media only screen and (max-width: 600px) {
      body { padding: 8px !important; }
      .card { border-radius: 0 !important; border: none !important; width: 100% !important; }
      .btn-full { display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; font-size: 16px !important; }
      .btn-auto { display: inline-block !important; width: auto !important; max-width: 100% !important; box-sizing: border-box !important; }
      .btn { max-width: 100% !important; box-sizing: border-box !important; }
      .img-container { padding: 12px 12px !important; }
      .img-container img { width: 100% !important; max-width: 100% !important; height: auto !important; }
    }
  </style>
</head>
<body>
  <div class="card">
    ${htmlContent}
  </div>
</body>
</html>`;
}

export const GeradorProScreen: React.FC<GeradorProScreenProps> = ({
  emailData,
  setEmailData,
  onNavigate,
}) => {
  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    if (emailData.customCodeHtml) {
      const parsed = parseHtmlToBlocks(emailData.customCodeHtml);
      if (parsed && parsed.length > 0) {
        return parsed;
      }
    }
    return DEFAULT_BLOCKS;
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string>(() => blocks[0]?.id || 'block-1');
  const [activeSelection, setActiveSelection] = useState<{
    fieldName: string;
    start: number;
    end: number;
    selectedText: string;
  } | null>(null);

  // Clear active selection when selected block changes
  useEffect(() => {
    setActiveSelection(null);
  }, [selectedBlockId]);

  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [linkText, setLinkText] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNormalizing, setIsNormalizing] = useState<boolean>(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isAddBlockMenuOpen, setIsAddBlockMenuOpen] = useState<boolean>(false);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const activeEditorRef = useRef<RichTextEditorRef | null>(null);
  const lastParsedHtmlRef = useRef<string | undefined>(emailData.customCodeHtml);

  const [iframeHeight, setIframeHeight] = useState<number>(600);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  const compiledHtml = compileBlocksToHtml(blocks);

  // Auto resize iframe to fit full content without internal scrollbars
  const handleIframeLoad = () => {
    try {
      if (previewIframeRef.current && previewIframeRef.current.contentWindow) {
        const doc = previewIframeRef.current.contentDocument || previewIframeRef.current.contentWindow.document;
        if (doc) {
          const scrollH = doc.documentElement.scrollHeight || doc.body.scrollHeight;
          if (scrollH && scrollH > 200) {
            setIframeHeight(scrollH + 10);
          }
        }
      }
    } catch {
      // Cross-origin fallback
    }
  };

  useEffect(() => {
    // Whenever compiledHtml or device changes, recalculate iframe height
    const timer = setTimeout(() => {
      handleIframeLoad();
    }, 150);
    return () => clearTimeout(timer);
  }, [compiledHtml, previewDevice]);

  // Continuously sync compiled HTML from Gerador Visual blocks to global emailData.customCodeHtml
  useEffect(() => {
    const compiled = compileBlocksToHtml(blocks);
    if (compiled === lastParsedHtmlRef.current) return;
    lastParsedHtmlRef.current = compiled;
    setEmailData((prev) => {
      if (prev.customCodeHtml === compiled) return prev;
      return {
        ...prev,
        customCodeHtml: compiled,
      };
    });
  }, [blocks, setEmailData]);

  // Sync blocks ONLY if emailData.customCodeHtml changes externally (e.g. from template load or external file import)
  useEffect(() => {
    if (emailData.customCodeHtml && emailData.customCodeHtml !== lastParsedHtmlRef.current) {
      lastParsedHtmlRef.current = emailData.customCodeHtml;
      const parsed = parseHtmlToBlocks(emailData.customCodeHtml);
      if (parsed && parsed.length > 0) {
        setBlocks(parsed);
        setSelectedBlockId(parsed[0].id);
      }
    }
  }, [emailData.customCodeHtml]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm') && file.type !== 'text/html') {
      alert('Por favor, selecione um arquivo de texto com extensão .html ou .htm');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setEmailData((prev) => ({
          ...prev,
          customCodeHtml: content,
        }));
        
        const parsedBlocks = parseHtmlToBlocks(content);
        if (parsedBlocks.length > 0) {
          setBlocks(parsedBlocks);
          setSelectedBlockId(parsedBlocks[0].id);
          showToast(`Arquivo HTML "${file.name}" importado e convertido em ${parsedBlocks.length} blocos editáveis no Gerador Visual!`);
        } else {
          showToast(`Arquivo HTML "${file.name}" importado no Gerador Visual!`);
        }
      }
    };
    reader.onerror = () => {
      alert('Ocorreu um erro ao ler o arquivo. Tente novamente.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImageBlockUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    // Limite estrito de 5MB por upload
    const sizeCheck = checkImageSize(file, 5);
    if (!sizeCheck.valid) {
      showToast(`⚠️ ${sizeCheck.message}`);
      e.target.value = '';
      return;
    }

    setIsNormalizing(true);
    showToast('Otimizando e fazendo upload para Firebase Storage (/emails/)...');
    try {
      // 1. Normalize image aspect ratio & dimensions (max 1200px)
      const normalizedDataUrl = await normalizeImage(file, 1200);

      // 2. Upload to Firebase Storage (/emails/ folder) or public host
      const uploadRes = await uploadToPublicHost(normalizedDataUrl, file.name);

      if (uploadRes.isPublicUrl) {
        updateSelectedBlock({ imageUrl: uploadRes.url });
        if (uploadRes.isFirebase) {
          showToast('🔥 Imagem enviada para Firebase Storage (/emails/)! URL inserida na tag <img src="...">.');
        } else {
          showToast('✨ Imagem hospedada em URL HTTPS pública! Visível em 100% dos e-mails (Gmail/Outlook).');
        }
      } else {
        updateSelectedBlock({ imageUrl: uploadRes.url });
        showToast('⚠️ Salvo localmente em Base64.');
      }
    } catch (err: any) {
      console.error('Erro no processamento da imagem:', err);
      showToast(err?.message || 'Não foi possível carregar a imagem selecionada.');
    } finally {
      setIsNormalizing(false);
      e.target.value = '';
    }
  };

  const handleUploadExistingToPublicHost = async () => {
    const selected = blocks.find((b) => b.id === selectedBlockId);
    if (!selected || !selected.imageUrl) {
      showToast('Nenhuma imagem selecionada para hospedar.');
      return;
    }

    if (selected.imageUrl.startsWith('http://') || selected.imageUrl.startsWith('https://')) {
      showToast('Esta imagem já possui uma URL HTTPS pública!');
      return;
    }

    setIsNormalizing(true);
    showToast('Enviando para o Firebase Storage (/emails/)...');

    try {
      const res = await uploadToPublicHost(selected.imageUrl, 'email_banner');
      if (res.isPublicUrl) {
        updateSelectedBlock({ imageUrl: res.url });
        showToast('🔥 Imagem enviada para o Firebase Storage (/emails/)! URL pública inserida.');
      } else {
        showToast(res.message);
      }
    } catch (err) {
      showToast('Não foi possível realizar o upload da imagem.');
    } finally {
      setIsNormalizing(false);
    }
  };

  const handleNormalizeExistingImage = async () => {
    const selected = blocks.find((b) => b.id === selectedBlockId);
    if (!selected || !selected.imageUrl) {
      showToast('Insira ou envie uma imagem primeiro para normalizar.');
      return;
    }

    setIsNormalizing(true);
    showToast('Ajustando dimensões e enviando para o Firebase Storage (/emails/)...');

    try {
      const normalized = await normalizeImage(selected.imageUrl, 1200);
      const res = await uploadToPublicHost(normalized, 'email_banner_normalized');
      updateSelectedBlock({ imageUrl: res.url });
      if (res.isFirebase) {
        showToast('🔥 Imagem ajustada e enviada para o Firebase Storage (/emails/)!');
      } else {
        showToast('✨ Imagem ajustada e hospedada com URL pública!');
      }
    } catch (err) {
      showToast('Não foi possível ajustar a imagem. Verifique se a URL é acessível.');
    } finally {
      setIsNormalizing(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectModel = (templateId: string) => {
    const tmpl = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setEmailData((prev) => ({
      ...prev,
      activeTemplateId: tmpl.id,
      headerTitle: tmpl.headerTitle || prev.headerTitle,
      greeting: tmpl.greeting || prev.greeting,
      buttonText: tmpl.buttonText || prev.buttonText,
      buttonUrl: tmpl.buttonUrl || prev.buttonUrl,
      bodyText: tmpl.bodyText || prev.bodyText,
      footerText: tmpl.footerText || prev.footerText,
      primaryColor: tmpl.primaryColor || prev.primaryColor,
      customCodeHtml: tmpl.customCodeHtml,
    }));

    if (tmpl.customCodeHtml) {
      const parsed = parseHtmlToBlocks(tmpl.customCodeHtml);
      if (parsed && parsed.length > 0) {
        setBlocks(parsed);
        setSelectedBlockId(parsed[0].id);
        showToast(`✓ Modelo "${tmpl.name}" carregado com ${parsed.length} blocos no Gerador Visual!`);
        return;
      }
    }

    showToast(`✓ Modelo "${tmpl.name}" carregado com sucesso!`);
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0];

  // Block management handlers
  const handleAddBlock = (type: BlockType) => {
    const newId = `block-${Date.now()}`;
    let newBlock: EmailBlock = { id: newId, type };

    switch (type) {
      case 'header_text':
        newBlock = {
          ...newBlock,
          headerTitle: 'ESTÁCIO\nSUA MATRÍCULA\nCOMEÇA AQUI!',
          headerSubtitle: 'Condições especiais para estudar na Estácio R9 – Taquara',
          headerBgColor: '#003bb3',
          headerTextColor: '#ffffff',
          headerSubtitleColor: '#ffffff',
          fontSizePx: 28,
          headerSubtitleSizePx: 16,
          alignment: 'center',
          isBold: true,
        };
        break;
      case 'header':
        newBlock = {
          ...newBlock,
          headerTitle: 'Novo Cabeçalho',
          headerSubtitle: 'Subtítulo do cabeçalho',
          headerBgColor: '#003bb3',
          headerTextColor: '#ffffff',
          headerSubtitleColor: '#ffffff',
          alignment: 'center',
          fontSizePx: 24,
          headerSubtitleSizePx: 15,
          isBold: true,
        };
        break;
      case 'header_image':
        newBlock = {
          ...newBlock,
          imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&h=200&q=80',
          imageAlt: 'Imagem de Cabeçalho do E-mail',
          imageCaption: '',
        };
        break;
      case 'title':
        newBlock = {
          ...newBlock,
          text: 'Novo Título Principal',
          fontSizePx: 26,
          textColor: '#1e1b4b',
          alignment: 'left',
          isBold: true,
        };
        break;
      case 'subtitle':
        newBlock = {
          ...newBlock,
          text: 'Insira aqui seu subtítulo curto',
          fontSizePx: 18,
          textColor: '#475569',
          alignment: 'left',
        };
        break;
      case 'text':
        newBlock = {
          ...newBlock,
          text: 'Novo parágrafo editável. Adicione variáveis como {{nome}} ou {{empresa}} se desejar.',
          fontSizePx: 15,
          textColor: '#334155',
          alignment: 'left',
          lineHeight: '1.6',
        };
        break;
      case 'button':
        newBlock = {
          ...newBlock,
          buttonLabel: 'Clique Aqui Agora',
          buttonUrl: 'https://exemplo.com',
          buttonBgColor: '#4f46e5',
          buttonTextColor: '#ffffff',
          buttonWidth: 'auto',
          alignment: 'center',
          fontSizePx: 16,
          isBold: true,
        };
        break;
      case 'image':
        newBlock = {
          ...newBlock,
          imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
          imageAlt: 'Imagem Ilustrativa',
          imageCaption: 'Legenda opcional da imagem',
        };
        break;
      case 'coupon':
        newBlock = {
          ...newBlock,
          couponCode: 'CUPOMPRO2026',
          couponDiscount: 'OFERTA ESPECIAL 25% OFF',
          couponBgColor: '#f0fdf4',
          couponBorderColor: '#16a34a',
        };
        break;
      case 'divider':
        newBlock = {
          ...newBlock,
          dividerStyle: 'solid',
          dividerColor: '#e2e8f0',
        };
        break;
      case 'social':
        newBlock = {
          ...newBlock,
          instagramUrl: 'https://instagram.com',
          linkedinUrl: 'https://linkedin.com',
          websiteUrl: 'https://estacio.br',
        };
        break;
      case 'footer':
        newBlock = {
          ...newBlock,
          footerText: 'Enviado para {{email}} por Estácio S.A.\n© 2026 Todos os direitos reservados.',
          footerBgColor: '#f8fafc',
          footerTextColor: '#64748b',
          fontSizePx: 12,
          alignment: 'center',
        };
        break;
    }

    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newId);
    showToast(`Bloco [${type.toUpperCase()}] adicionado com sucesso!`);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= blocks.length || toIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [draggedItem] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, draggedItem);
    setBlocks(newBlocks);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index - 1];
    newBlocks[index - 1] = newBlocks[index];
    newBlocks[index] = temp;
    setBlocks(newBlocks);
  };

  const handleMoveDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index + 1];
    newBlocks[index + 1] = newBlocks[index];
    newBlocks[index] = temp;
    setBlocks(newBlocks);
  };

  const handleDuplicate = (block: EmailBlock) => {
    const dupId = `block-${Date.now()}`;
    const dupBlock = { ...block, id: dupId };
    const index = blocks.findIndex((b) => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, dupBlock);
    setBlocks(newBlocks);
    setSelectedBlockId(dupId);
    showToast('Bloco duplicado!');
  };

  const handleDelete = (id: string) => {
    if (blocks.length <= 1) {
      showToast('O e-mail deve ter pelo menos 1 bloco.');
      return;
    }
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    if (selectedBlockId === id) {
      setSelectedBlockId(newBlocks[0].id);
    }
    showToast('Bloco removido.');
  };

  const updateSelectedBlock = (updatedProps: Partial<EmailBlock>) => {
    const targetId = selectedBlock?.id || selectedBlockId;
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== targetId) return b;
        let isDifferent = false;
        for (const key in updatedProps) {
          if ((b as any)[key] !== (updatedProps as any)[key]) {
            isDifferent = true;
            break;
          }
        }
        if (!isDifferent) return b;
        return { ...b, ...updatedProps };
      })
    );
  };

  const getBlockLabel = (type: BlockType) => {
    const labels: Record<BlockType, { name: string; icon: string }> = {
      header_text: { name: 'Texto do Cabeçalho / Banner', icon: 'web_asset' },
      header: { name: 'Cabeçalho', icon: 'web_asset' },
      header_image: { name: 'Imagem de Cabeçalho', icon: 'view_day' },
      title: { name: 'Título', icon: 'title' },
      subtitle: { name: 'Subtítulo', icon: 'format_size' },
      text: { name: 'Texto', icon: 'notes' },
      button: { name: 'Botão / CTA', icon: 'smart_button' },
      image: { name: 'Imagem / Banner', icon: 'image' },
      coupon: { name: 'Cupom', icon: 'local_offer' },
      divider: { name: 'Divisor', icon: 'horizontal_rule' },
      social: { name: 'Redes Sociais', icon: 'share' },
      footer: { name: 'Rodapé', icon: 'call_to_action' },
    };
    return labels[type] || { name: type, icon: 'extension' };
  };

  const handleTextSelectOrChange = (
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: string
  ) => {
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const fullText = target.value;

    if (start < end) {
      const selectedText = fullText.substring(start, end);
      setActiveSelection({
        fieldName,
        start,
        end,
        selectedText,
      });
    } else {
      setActiveSelection({
        fieldName,
        start,
        end: start,
        selectedText: '',
      });
    }
  };

  const handleOpenLinkModal = () => {
    if (!selectedBlock) return;
    const defaultField = (
      (selectedBlock.type === 'header' || selectedBlock.type === 'header_text') ? 'headerTitle' :
      selectedBlock.type === 'footer' ? 'footerText' :
      selectedBlock.type === 'button' ? 'buttonLabel' : 'text'
    );
    const fieldName = activeSelection?.fieldName || defaultField;
    const fullText = String((selectedBlock as any)[fieldName] || '');

    let selText = activeEditorRef.current?.getSelectionText() || activeSelection?.selectedText || '';
    const cleanSelText = selText.replace(/<[^>]*>/g, '');

    let existingUrl = 'https://';
    const hrefMatch = selText.match(/href=["']([^"']+)["']/i) || fullText.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      existingUrl = hrefMatch[1];
    }

    setLinkText(cleanSelText);
    setLinkUrl(existingUrl);
    setLinkModalOpen(true);
  };

  const handleSaveLink = () => {
    if (!linkUrl.trim()) {
      showToast('Por favor, informe a URL do link.');
      return;
    }

    let finalUrl = linkUrl.trim();
    if (
      !finalUrl.startsWith('http://') &&
      !finalUrl.startsWith('https://') &&
      !finalUrl.startsWith('mailto:') &&
      !finalUrl.startsWith('tel:') &&
      !finalUrl.startsWith('{{')
    ) {
      finalUrl = 'https://' + finalUrl;
    }

    const displayText = linkText.trim() || finalUrl;
    const linkHtml = `<a href="${finalUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${displayText}</a>`;

    if (activeEditorRef.current) {
      activeEditorRef.current.insertHtml(linkHtml);
      showToast(`Link "${displayText}" inserido com sucesso no texto!`);
    } else if (selectedBlock) {
      const defaultField = (
        (selectedBlock.type === 'header' || selectedBlock.type === 'header_text') ? 'headerTitle' :
        selectedBlock.type === 'footer' ? 'footerText' :
        selectedBlock.type === 'button' ? 'buttonLabel' : 'text'
      );

      const fieldName = activeSelection?.fieldName || defaultField;
      const fullText = String((selectedBlock as any)[fieldName] || '');
      updateSelectedBlock({ [fieldName]: fullText ? (fullText + ' ' + linkHtml) : linkHtml });
      showToast(`Link "${displayText}" inserido com sucesso!`);
    }

    setLinkModalOpen(false);
    setLinkText('');
    setLinkUrl('');
  };

  const handleRemoveLinkFromBlock = () => {
    if (activeEditorRef.current) {
      activeEditorRef.current.execCommand('unlink');
      showToast('Link removido do texto.');
    } else if (selectedBlock) {
      const defaultField = (
        (selectedBlock.type === 'header' || selectedBlock.type === 'header_text') ? 'headerTitle' :
        selectedBlock.type === 'footer' ? 'footerText' :
        selectedBlock.type === 'button' ? 'buttonLabel' : 'text'
      );

      const fieldName = activeSelection?.fieldName || defaultField;
      const fullText = String((selectedBlock as any)[fieldName] || '');
      const cleanText = fullText.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1');
      updateSelectedBlock({ [fieldName]: cleanText });
      showToast('Links removidos do texto.');
    }
    setLinkModalOpen(false);
  };

  const applyFormattingToSelection = (
    formatType: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'color' | 'fontSize' | 'clear' | 'variable' | 'link' | 'unlink',
    formatValue?: string | number,
    colorTargetKey?: 'textColor' | 'headerTextColor' | 'buttonTextColor' | 'footerTextColor'
  ) => {
    if (!selectedBlock) return;

    // Direct color update for block property
    if (formatType === 'color' && formatValue) {
      const colorVal = String(formatValue);
      const targetField = colorTargetKey || (
        (selectedBlock.type === 'header' || selectedBlock.type === 'header_text') ? 'headerTextColor' :
        selectedBlock.type === 'footer' ? 'footerTextColor' :
        selectedBlock.type === 'button' ? 'buttonTextColor' :
        'textColor'
      );
      updateSelectedBlock({ [targetField]: colorVal, textColor: colorVal });
    }

    if (activeEditorRef.current) {
      switch (formatType) {
        case 'bold':
          activeEditorRef.current.execCommand('bold');
          break;
        case 'italic':
          activeEditorRef.current.execCommand('italic');
          break;
        case 'underline':
          activeEditorRef.current.execCommand('underline');
          break;
        case 'strikethrough':
          activeEditorRef.current.execCommand('strikeThrough');
          break;
        case 'color':
          if (formatValue) {
            activeEditorRef.current.execCommand('foreColor', String(formatValue));
          }
          break;
        case 'clear':
          activeEditorRef.current.execCommand('removeFormat');
          break;
        case 'variable':
          if (formatValue) {
            activeEditorRef.current.insertHtml(` ${formatValue} `);
          }
          break;
        case 'link':
          handleOpenLinkModal();
          return;
        case 'unlink':
          activeEditorRef.current.execCommand('unlink');
          break;
      }
      showToast('Formatação aplicada no editor de texto!');
    } else {
      if (formatType === 'bold') {
        updateSelectedBlock({ isBold: !selectedBlock.isBold });
      } else if (formatType === 'italic') {
        updateSelectedBlock({ isItalic: !selectedBlock.isItalic });
      } else if (formatType === 'underline') {
        updateSelectedBlock({ isUnderline: !selectedBlock.isUnderline });
      } else if (formatType === 'strikethrough') {
        updateSelectedBlock({ isStrikethrough: !selectedBlock.isStrikethrough });
      } else if (formatType === 'color' && formatValue) {
        // Handled above with block property updates
      } else if (formatType === 'variable' && formatValue) {
        const defaultField = (
          (selectedBlock.type === 'header' || selectedBlock.type === 'header_text') ? 'headerTitle' :
          selectedBlock.type === 'footer' ? 'footerText' :
          selectedBlock.type === 'button' ? 'buttonLabel' : 'text'
        );
        const curr = String((selectedBlock as any)[defaultField] || '');
        updateSelectedBlock({ [defaultField]: curr + ` ${formatValue} ` });
      }
    }
  };

  const insertVariableToSelectedBlock = (varName: string) => {
    applyFormattingToSelection('variable', varName);
  };

  // Reusable Formatting Controls Component
  const renderFormattingToolbar = (options: {
    showTextColor?: boolean;
    showBgColor?: boolean;
    showAlign?: boolean;
    showFontFamily?: boolean;
    showLineHeight?: boolean;
    defaultColorKey?: 'textColor' | 'headerTextColor' | 'buttonTextColor' | 'footerTextColor';
    defaultBgKey?: 'bgColor' | 'headerBgColor' | 'buttonBgColor' | 'footerBgColor';
  } = {}) => {
    if (!selectedBlock) return null;

    const {
      showTextColor = true,
      showBgColor = true,
      showAlign = true,
      showFontFamily = true,
      showLineHeight = true,
      defaultColorKey = 'textColor',
      defaultBgKey = 'bgColor',
    } = options;

    const currentTextColor = (selectedBlock as any)[defaultColorKey] || selectedBlock.textColor || '#334155';
    const currentBgColor = (selectedBlock as any)[defaultBgKey] || selectedBlock.bgColor || '#ffffff';
    const defaultBlockSize = getDefaultBlockFontSize(selectedBlock.type);
    const currentFontSize = selectedBlock.fontSizePx || defaultBlockSize;
    const currentAlign = selectedBlock.alignment || 'left';

    const COLOR_PRESETS = [
      '#1e1b4b', '#0f172a', '#334155', '#64748b',
      '#4f46e5', '#2563eb', '#0284c7', '#16a34a',
      '#dc2626', '#d97706', '#7c3aed', '#ffffff',
    ];

    return (
      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-indigo-600">format_paint</span>
            <span>Estilização de Texto & Tipografia</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Selecione um texto para formatar apenas o trecho</span>
        </div>

        {/* Active Selection Info Badge */}
        {activeSelection && activeSelection.start < activeSelection.end && (
          <div className="bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg flex items-center justify-between text-xs text-indigo-900 animate-fadeIn">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <span className="material-symbols-outlined text-[16px] text-indigo-600">match_case</span>
              <span>Texto Selecionado:</span>
              <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold font-mono text-indigo-700 truncate max-w-xs">
                "{activeSelection.selectedText.replace(/<[^>]*>/g, '')}"
              </code>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleOpenLinkModal}
                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] rounded font-bold transition-colors flex items-center gap-1 shadow-2xs"
                title="Inserir um hiperlink no texto selecionado"
              >
                <span className="material-symbols-outlined text-[14px]">link</span>
                <span>+ Inserir Link</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormattingToSelection('clear')}
                className="px-2 py-0.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 text-[11px] rounded font-bold transition-colors"
                title="Remover tags HTML do texto selecionado"
              >
                Limpar Formatação
              </button>
            </div>
          </div>
        )}

        {/* Inline Link Editor Form */}
        {linkModalOpen && (
          <div className="bg-indigo-50/90 border-2 border-indigo-200 p-3.5 rounded-xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-indigo-600">link</span>
                <span>Inserir / Editar Hiperlink no Texto</span>
              </span>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Texto a ser Exibido no Link:
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Ex: Clique aqui para se matricular"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  URL de Destino (Link):
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Ex: https://seusite.com.br ou {{var1}}"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono text-indigo-900 font-medium"
                />
              </div>
            </div>

            {/* Quick Presets for Link URL */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-slate-500 font-medium">Atalhos rápidos:</span>
              <button
                type="button"
                onClick={() => setLinkUrl('https://')}
                className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded font-mono text-[10px]"
              >
                https://
              </button>
              <button
                type="button"
                onClick={() => setLinkUrl('{{var1}}')}
                className="px-2 py-0.5 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded font-mono text-[10px] font-bold"
              >
                {`{{var1}}`}
              </button>
              <button
                type="button"
                onClick={() => setLinkUrl('{{var2}}')}
                className="px-2 py-0.5 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded font-mono text-[10px] font-bold"
              >
                {`{{var2}}`}
              </button>
              <button
                type="button"
                onClick={() => setLinkUrl('mailto:')}
                className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded font-mono text-[10px]"
              >
                mailto:
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
              <button
                type="button"
                onClick={handleRemoveLinkFromBlock}
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 text-xs rounded-lg font-bold transition-colors flex items-center gap-1"
                title="Remover hiperlink do texto"
              >
                <span className="material-symbols-outlined text-[16px]">link_off</span>
                <span>Remover Link</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveLink}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Aplicar Link no Texto</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Essential Format Toolbar (Always Visible) */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-100/90 p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          {/* Style Buttons & Link */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormattingToSelection('bold')}
                className={`w-7 h-7 rounded-lg font-black text-xs transition-colors flex items-center justify-center cursor-pointer ${
                  selectedBlock.isBold ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Negrito"
              >
                B
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormattingToSelection('italic')}
                className={`w-7 h-7 rounded-lg italic font-serif text-xs transition-colors flex items-center justify-center cursor-pointer ${
                  selectedBlock.isItalic ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Itálico"
              >
                I
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormattingToSelection('underline')}
                className={`w-7 h-7 rounded-lg underline font-bold text-xs transition-colors flex items-center justify-center cursor-pointer ${
                  selectedBlock.isUnderline ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Sublinhado"
              >
                U
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormattingToSelection('strikethrough')}
                className={`w-7 h-7 rounded-lg line-through font-bold text-xs transition-colors flex items-center justify-center cursor-pointer ${
                  selectedBlock.isStrikethrough ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Tachado"
              >
                S
              </button>
            </div>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenLinkModal}
              className="h-9 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 shadow-2xs shrink-0 cursor-pointer"
              title="Inserir / Editar Link no Texto"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">link</span>
              <span>Link</span>
            </button>

            {/* Quick Font Size Selector in Main Toolbar */}
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 h-9 rounded-xl border border-slate-200/90 shadow-2xs shrink-0" title="Tamanho da fonte">
              <span className="material-symbols-outlined text-[16px] text-slate-500">format_size</span>
              <select
                value={currentFontSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) updateSelectedBlock({ fontSizePx: val });
                }}
                className="text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-200/70 rounded-lg px-2 py-0.5 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                {[10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48].map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}px {sz === defaultBlockSize ? ' (Padrão)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Color Picker in Main Toolbar */}
            {showTextColor && (
              <div className="flex flex-wrap items-center gap-1.5 bg-white px-2.5 py-1 min-h-[36px] rounded-xl border border-slate-200/90 shadow-2xs max-w-full" title="Cor do texto">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">palette</span>
                  <input
                    type="color"
                    value={currentTextColor}
                    onChange={(e) => applyFormattingToSelection('color', e.target.value, defaultColorKey)}
                    className="w-6 h-6 p-0 border border-slate-300 rounded cursor-pointer bg-white"
                    title="Escolher cor personalizada"
                  />
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {['#ffffff', '#1e1b4b', '#334155', '#dc2626', '#16a34a', '#2563eb'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormattingToSelection('color', hex, defaultColorKey)}
                      className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 shadow-2xs cursor-pointer ${
                        currentTextColor.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-indigo-500 ring-offset-1 border-indigo-600' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: hex }}
                      title={`Aplicar cor ${hex}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alignment Controls */}
          {showAlign && (
            <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs sm:ml-auto shrink-0">
              <button
                type="button"
                onClick={() => updateSelectedBlock({ alignment: 'left' })}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  currentAlign === 'left' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Esquerda"
              >
                <span className="material-symbols-outlined text-[16px]">format_align_left</span>
              </button>
              <button
                type="button"
                onClick={() => updateSelectedBlock({ alignment: 'center' })}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  currentAlign === 'center' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Centralizado"
              >
                <span className="material-symbols-outlined text-[16px]">format_align_center</span>
              </button>
              <button
                type="button"
                onClick={() => updateSelectedBlock({ alignment: 'right' })}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  currentAlign === 'right' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Direita"
              >
                <span className="material-symbols-outlined text-[16px]">format_align_right</span>
              </button>
              <button
                type="button"
                onClick={() => updateSelectedBlock({ alignment: 'justify' })}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  currentAlign === 'justify' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Justificado"
              >
                <span className="material-symbols-outlined text-[16px]">format_align_justify</span>
              </button>
            </div>
          )}

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px] text-indigo-600">tune</span>
            <span>Configurações Avançadas</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">
              {isAdvancedSettingsOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* Collapsible Advanced Settings Accordion */}
        {isAdvancedSettingsOpen && (
          <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl space-y-4 shadow-2xs animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-indigo-600">tune</span>
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Configurações Avançadas (Tamanho, Cores, Fontes)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdvancedSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">expand_less</span>
              </button>
            </div>

            {/* Fixed Typography Size Selector Box */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-indigo-600">format_size</span>
                  <span>Tamanho da Fonte Fixo / Tipografia do Bloco:</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md font-mono">
                    {currentFontSize}px
                  </span>
                  {selectedBlock.fontSizePx && selectedBlock.fontSizePx !== defaultBlockSize && (
                    <button
                      type="button"
                      onClick={() => updateSelectedBlock({ fontSizePx: defaultBlockSize })}
                      className="text-[10px] text-slate-500 hover:text-indigo-600 font-semibold underline cursor-pointer"
                      title="Restaurar tamanho padrão"
                    >
                      Restaurar Padrão ({defaultBlockSize}px)
                    </button>
                  )}
                </div>
              </div>

              {/* Fixed Sizes Buttons Grid */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { sz: 10, label: '10px' },
                  { sz: 12, label: '12px' },
                  { sz: 14, label: '14px' },
                  { sz: 15, label: '15px' },
                  { sz: 16, label: '16px' },
                  { sz: 18, label: '18px' },
                  { sz: 20, label: '20px' },
                  { sz: 22, label: '22px' },
                  { sz: 24, label: '24px' },
                  { sz: 28, label: '28px' },
                  { sz: 32, label: '32px' },
                  { sz: 36, label: '36px' },
                  { sz: 40, label: '40px' },
                  { sz: 48, label: '48px' },
                ].map(({ sz, label }) => {
                  const isActive = currentFontSize === sz;
                  const isDefault = sz === defaultBlockSize;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => updateSelectedBlock({ fontSizePx: sz })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title={`${label}${isDefault ? ' (Padrão para este bloco)' : ''}`}
                    >
                      {label}
                      {isDefault && <span className="text-[9px] opacity-75 ml-0.5">•</span>}
                    </button>
                  );
                })}
              </div>

              {/* Semantic Scale Select Dropdown */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <span className="text-[11px] text-slate-500 font-semibold shrink-0">Escala de Uso:</span>
                <select
                  value={currentFontSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) updateSelectedBlock({ fontSizePx: val });
                  }}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800 focus:bg-white cursor-pointer"
                >
                  <option value={10}>10px - Microtexto / Avisos legais</option>
                  <option value={12}>12px - Rodapé / Informações de contato</option>
                  <option value={14}>14px - Texto Compacto / Secundário</option>
                  <option value={15}>15px - Padrão Parágrafo (Corpo do E-mail)</option>
                  <option value={16}>16px - Texto Médio / Botão CTA</option>
                  <option value={18}>18px - Subtítulo / Destaque Suave</option>
                  <option value={20}>20px - Subtítulo Médio</option>
                  <option value={22}>22px - Destaque Comercial / Cupom</option>
                  <option value={24}>24px - Subtítulo Forte / Título H3</option>
                  <option value={28}>28px - Título de Seção / Banner Padrão</option>
                  <option value={32}>32px - Título Principal / Grande Impacto</option>
                  <option value={36}>36px - Banner Grande</option>
                  <option value={40}>40px - Super Destaque</option>
                  <option value={48}>48px - Banner Gigante</option>
                </select>
              </div>
            </div>

            {/* 2-Column Grid of Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Família da Fonte */}
              {showFontFamily && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Família da Fonte:</label>
                  <select
                    value={selectedBlock.fontFamily || 'Helvetica, Arial, sans-serif'}
                    onChange={(e) => updateSelectedBlock({ fontFamily: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-800"
                  >
                    <option value="Helvetica, Arial, sans-serif">Helvetica / Arial (E-mail padrão)</option>
                    <option value="Georgia, serif">Georgia (Serifada)</option>
                    <option value="'Times New Roman', Times, serif">Times New Roman</option>
                    <option value="'Courier New', Courier, monospace">Courier New</option>
                    <option value="Verdana, Geneva, sans-serif">Verdana</option>
                    <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  </select>
                </div>
              )}

              {/* Altura da Linha */}
              {showLineHeight && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Altura da Linha:</label>
                  <select
                    value={selectedBlock.lineHeight || '1.4'}
                    onChange={(e) => updateSelectedBlock({ lineHeight: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-800"
                  >
                    <option value="1.2">Compacto (1.2)</option>
                    <option value="1.4">Normal (1.4)</option>
                    <option value="1.6">Confortável (1.6)</option>
                    <option value="1.8">Espaçado (1.8)</option>
                    <option value="2.0">Duplo (2.0)</option>
                  </select>
                </div>
              )}

              {/* Estilo de Caixa */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Estilo de Caixa:</label>
                <select
                  value={selectedBlock.textTransform || 'none'}
                  onChange={(e) => updateSelectedBlock({ textTransform: e.target.value as any })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-800"
                >
                  <option value="none">Normal (Padrão)</option>
                  <option value="uppercase">MAIÚSCULAS</option>
                  <option value="lowercase">minúsculas</option>
                  <option value="capitalize">Primeira Maiúscula</option>
                </select>
              </div>

              {/* Cor do Texto */}
              {showTextColor && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Cor do Texto:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTextColor}
                      onChange={(e) => applyFormattingToSelection('color', e.target.value, defaultColorKey)}
                      className="w-9 h-8 p-0.5 border border-slate-300 rounded-lg cursor-pointer bg-white"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['#ffffff', '#1e1b4b', '#0f172a', '#334155', '#dc2626', '#16a34a', '#2563eb', '#0284c7'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormattingToSelection('color', hex, defaultColorKey)}
                          className="w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-110 shadow-2xs"
                          style={{ backgroundColor: hex }}
                          title={`Cor ${hex}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Cor de Fundo do Bloco */}
              {showBgColor && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Cor de Fundo do Bloco:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentBgColor}
                      onChange={(e) => updateSelectedBlock({ [defaultBgKey]: e.target.value } as any)}
                      className="w-9 h-8 p-0.5 border border-slate-300 rounded-lg cursor-pointer bg-white"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['#1e1b4b', '#ffffff', '#f8fafc', '#f1f5f9', '#e0e7ff', '#f0fdf4', '#fef2f2', '#fffbeb', '#0284c7', '#0f172a'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => updateSelectedBlock({ [defaultBgKey]: hex } as any)}
                          className="w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-110 shadow-2xs"
                          style={{ backgroundColor: hex }}
                          title={`Fundo: ${hex}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Atalhos de Variáveis */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-700">Atalhos de Variáveis:</label>
              <div className="flex items-center gap-2 flex-wrap">
                {['{{nome}}', '{{email}}', '{{empresa}}', '{{var1}}', '{{var2}}'].map((vName) => (
                  <button
                    key={vName}
                    type="button"
                    onClick={() => insertVariableToSelectedBlock(vName)}
                    className="px-3 py-1 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 text-xs font-mono font-bold rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    {vName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-grow bg-slate-50/60 pt-20 pb-28 px-4 md:px-8 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-indigo-600 text-white font-semibold px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-xs space-y-8">
        
        {/* Header Block */}
        <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                extension
              </span>
              <h1 className="text-base md:text-lg font-bold tracking-wide uppercase text-slate-900 flex items-center gap-2">
                <span>GERADOR VISUAL — CONSTRUTOR POR BLOCOS</span>
                <span className="text-[11px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full">
                  MODULAR & FORMATADO
                </span>
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-4xl">
              Monte seu e-mail personalizando textos, tamanhos de fontes, cores, estilos (negrito, itálico, sublinhado) e muito mais.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Hidden HTML File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".html,.htm,text/html"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs shadow-2xs"
              title="Importar um arquivo HTML para edição no Editor"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Importar HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setBlocks(DEFAULT_BLOCKS)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg text-xs transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Resetar</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('visualizacao', 'push')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1.5 text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              <span>Ver Visualização</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            MODELOS PRONTOS DE E-MAIL (TEMPLATES)
        ========================================================================= */}
        <div className="bg-slate-50/90 border border-slate-200 p-4 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-800">
              <span className="material-symbols-outlined text-indigo-600 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                dashboard_customize
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                MODELOS PRONTOS DE E-MAIL:
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Clique em um modelo para carregar a estrutura pronta de e-mail no Gerador Visual
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {DEFAULT_TEMPLATES.map((tmpl) => {
              const isActive = emailData.activeTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectModel(tmpl.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs uppercase transition-all active:scale-95 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400 ring-offset-1'
                      : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tmpl.id === 'padrao' && 'description'}
                    {tmpl.id === 'estacio-matricula' && 'local_offer'}
                    {tmpl.id === 'estacio-boleto' && 'receipt_long'}
                    {tmpl.id === 'documentacao' && 'folder_shared'}
                    {!['padrao', 'estacio-matricula', 'estacio-boleto', 'documentacao'].includes(tmpl.id) && 'draft'}
                  </span>
                  <span>{tmpl.name}</span>
                  {isActive && (
                    <span className="w-2.5 h-2.5 bg-white rounded-full ml-1 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            LAYOUT EM TELA DIVIDIDA (SPLIT SCREEN: EDITOR À ESQUERDA + CANVAS À DIREITA)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUNA ESQUERDA: GERENCIAMENTO DE BLOCOS + EDIÇÃO DO BLOCO SELECIONADO */}
          <div className="lg:col-span-7 xl:col-span-6 space-y-6">
            
            {/* SEÇÃO 1: ESTRUTURA DOS BLOCOS */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold">1</span>
                  <h2 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">Estrutura dos Blocos ({blocks.length})</h2>
                </div>
                
                {/* Unified "+ Adicionar Bloco" Categorized Dropdown Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAddBlockMenuOpen(!isAddBlockMenuOpen)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>+ Adicionar Bloco</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isAddBlockMenuOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isAddBlockMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsAddBlockMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 p-2 space-y-2 divide-y divide-slate-100 max-h-96 overflow-y-auto animate-fadeIn">
                        {/* Category: Cabeçalho */}
                        <div>
                          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider px-2.5 py-1 block">
                            Cabeçalho & Banners
                          </span>
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('header_text'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">web_asset</span>
                              <span>Texto do Cabeçalho</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('header_image'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">view_day</span>
                              <span>Imagem do Cabeçalho</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('header'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">web_asset</span>
                              <span>Cabeçalho Simples</span>
                            </button>
                          </div>
                        </div>

                        {/* Category: Conteúdo */}
                        <div className="pt-2">
                          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider px-2.5 py-1 block">
                            Conteúdo do E-mail
                          </span>
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('title'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">title</span>
                              <span>Título</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('subtitle'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">format_size</span>
                              <span>Subtítulo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('text'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">notes</span>
                              <span>Texto / Parágrafo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('button'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">smart_button</span>
                              <span>Botão CTA</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('image'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">image</span>
                              <span>Banner / Imagem</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('coupon'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">local_offer</span>
                              <span>Cupom de Desconto</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('divider'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">horizontal_rule</span>
                              <span>Divisor</span>
                            </button>
                          </div>
                        </div>

                        {/* Category: Rodapé e Social */}
                        <div className="pt-2">
                          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider px-2.5 py-1 block">
                            Rodapé & Redes
                          </span>
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('social'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">share</span>
                              <span>Redes Sociais</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { handleAddBlock('footer'); setIsAddBlockMenuOpen(false); }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-indigo-600">call_to_action</span>
                              <span>Rodapé</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Active Structure Blocks List with 3-Dots Context Menu */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {blocks.map((block, idx) => {
                  const isSelected = block.id === selectedBlockId;
                  const isBeingDragged = draggedIdx === idx;
                  const isTargeted = dragOverIdx === idx && draggedIdx !== idx;
                  const { name, icon } = getBlockLabel(block.type);
                  const isMenuOpen = openCardMenuId === block.id;

                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedIdx(idx);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(idx));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverIdx !== idx) setDragOverIdx(idx);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        if (dragOverIdx !== idx) setDragOverIdx(idx);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIdx !== null && draggedIdx !== idx) {
                          handleReorder(draggedIdx, idx);
                        }
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                        isBeingDragged
                          ? 'opacity-40 border-dashed border-indigo-500 bg-indigo-50/50'
                          : isTargeted
                          ? 'bg-indigo-100/90 border-indigo-600 ring-2 ring-indigo-500/40 shadow-xs'
                          : isSelected
                          ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 transition-colors shrink-0 p-1 rounded hover:bg-slate-100"
                          title="Segure e arraste para reordenar"
                        >
                          <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                        </div>

                        <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                        <span className="material-symbols-outlined text-indigo-600 text-[18px] shrink-0">{icon}</span>

                        <div className="truncate min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {block.headerTitle || block.text || block.buttonLabel || block.couponCode || 'Configurar conteúdo'}
                          </p>
                        </div>
                      </div>

                      {/* 3-Dots Context Menu Button */}
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenCardMenuId(isMenuOpen ? null : block.id)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                          title="Opções do Bloco"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>

                        {isMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenCardMenuId(null)} />
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-40 py-1.5 text-xs font-semibold space-y-0.5 animate-fadeIn">
                              <button
                                type="button"
                                onClick={() => { setSelectedBlockId(block.id); setOpenCardMenuId(null); }}
                                className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-indigo-700 font-extrabold flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                <span>Editar Bloco</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { handleDuplicate(block); setOpenCardMenuId(null); }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                <span>Duplicar Bloco</span>
                              </button>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => { handleMoveUp(idx); setOpenCardMenuId(null); }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 disabled:opacity-30 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                                <span>Mover para Cima</span>
                              </button>
                              <button
                                type="button"
                                disabled={idx === blocks.length - 1}
                                onClick={() => { handleMoveDown(idx); setOpenCardMenuId(null); }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 disabled:opacity-30 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                                <span>Mover para Baixo</span>
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                type="button"
                                onClick={() => { handleDelete(block.id); setOpenCardMenuId(null); }}
                                className="w-full text-left px-3.5 py-2 hover:bg-red-100 text-red-600 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                <span>Excluir Bloco</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

        {/* =========================================================================
            PARTE 2: CONFIGURAÇÃO / EDIÇÃO DO BLOCO SELECIONADO
        ========================================================================= */}
        {selectedBlock && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3">
              <h2 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <span className="bg-indigo-600 text-white w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold">2</span>
                <span>Editando Bloco: {getBlockLabel(selectedBlock.type).name}</span>
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDuplicate(selectedBlock)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Duplicar este bloco"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-500">content_copy</span>
                  <span>Duplicar</span>
                </button>
              </div>
            </div>

            {/* HEADER / HEADER_TEXT FORM */}
            {(selectedBlock.type === 'header' || selectedBlock.type === 'header_text') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Título Principal do Cabeçalho
                    </label>
                    <RichTextEditor
                      key={`${selectedBlock.id}-headerTitle`}
                      ref={activeEditorRef}
                      value={selectedBlock.headerTitle || ''}
                      onChange={(newVal) => updateSelectedBlock({ headerTitle: newVal })}
                      placeholder="Ex: ESTÁCIO - SUA MATRÍCULA COMEÇA AQUI!"
                      minHeight="70px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subtítulo / Texto Complementar do Cabeçalho
                    </label>
                    <RichTextEditor
                      key={`${selectedBlock.id}-headerSubtitle`}
                      ref={activeEditorRef}
                      value={selectedBlock.headerSubtitle || ''}
                      onChange={(newVal) => updateSelectedBlock({ headerSubtitle: newVal })}
                      placeholder="Ex: Condições especiais para estudar na Estácio R9 – Taquara"
                      minHeight="70px"
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600">subtitles</span>
                      <span>Estilização do Subtítulo / Texto Complementar</span>
                    </span>
                    <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md font-mono">
                      {selectedBlock.headerSubtitleSizePx || 16}px
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Tamanho Fixo do Subtítulo:
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[12, 14, 15, 16, 18, 20, 22, 24, 28].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => updateSelectedBlock({ headerSubtitleSizePx: sz })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                              (selectedBlock.headerSubtitleSizePx || 16) === sz
                                ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>
                      <select
                        value={selectedBlock.headerSubtitleSizePx || 16}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) updateSelectedBlock({ headerSubtitleSizePx: val });
                        }}
                        className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800 focus:bg-white cursor-pointer mt-1"
                      >
                        <option value={12}>12px - Discreto / Rodapé de Banner</option>
                        <option value={14}>14px - Compacto</option>
                        <option value={15}>15px - Padrão Leitura</option>
                        <option value={16}>16px - Padrão Médio</option>
                        <option value={18}>18px - Subtítulo Destacado</option>
                        <option value={20}>20px - Subtítulo Forte</option>
                        <option value={22}>22px - Destaque Principal</option>
                        <option value={24}>24px - Grande Impacto</option>
                        <option value={28}>28px - Máximo Destaque</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-600">Cor do Subtítulo:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedBlock.headerSubtitleColor || '#ffffff'}
                          onChange={(e) => updateSelectedBlock({ headerSubtitleColor: e.target.value })}
                          className="w-9 h-8 p-0.5 border border-slate-300 rounded cursor-pointer bg-white"
                        />
                        <span className="text-xs font-mono uppercase text-slate-600 font-bold">{selectedBlock.headerSubtitleColor || '#ffffff'}</span>
                        <div className="flex gap-1 ml-1 flex-wrap">
                          {['#ffffff', '#e0e7ff', '#fef08a', '#93c5fd', '#1e1b4b', '#f97316'].map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => updateSelectedBlock({ headerSubtitleColor: hex })}
                              className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform shadow-2xs"
                              style={{ backgroundColor: hex }}
                              title={`Cor: ${hex}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {renderFormattingToolbar({
                  defaultColorKey: 'headerTextColor',
                  defaultBgKey: 'headerBgColor',
                })}
              </div>
            )}

            {/* HEADER IMAGE FORM */}
            {selectedBlock.type === 'header_image' && (
              <div className="space-y-4">
                {/* Hidden Image File Input */}
                <input
                  type="file"
                  ref={imageFileInputRef}
                  onChange={handleImageBlockUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Compact Collapsible Dimension Specifications Banner */}
                <details className="group bg-slate-100/90 border border-slate-200/90 rounded-xl overflow-hidden transition-all shadow-2xs">
                  <summary className="px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center justify-between cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600">info</span>
                      <span>Dicas de Tamanho e Medidas Recomendadas ℹ️ (600 x 200px)</span>
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-slate-400 group-open:rotate-180 transition-transform">
                      expand_more
                    </span>
                  </summary>
                  <div className="p-3.5 border-t border-slate-200/80 bg-white space-y-2.5 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Largura Ideal</span>
                        <span className="text-xs font-black text-indigo-600">600 px</span>
                        <span className="text-[9px] text-slate-400 block">(100% da caixa)</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Altura</span>
                        <span className="text-xs font-black text-amber-600">150–250 px</span>
                        <span className="text-[9px] text-slate-400 block">(Proporção ~3:1)</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Formato</span>
                        <span className="text-xs font-black text-slate-700">PNG / JPG</span>
                        <span className="text-[9px] text-slate-400 block">(Até 5MB)</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                      💡 A largura de 600px cobre todo o topo da caixa de entrada perfeitamente no Gmail, Outlook, Apple Mail e celular sem ficar borrada ou cortada.
                    </p>
                  </div>
                </details>

                <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600">view_day</span>
                      <span>Imagem Banner de Cabeçalho</span>
                    </label>
                    {selectedBlock.imageUrl && (
                      selectedBlock.imageUrl.includes('firebasestorage') ? (
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-amber-600">local_fire_department</span>
                          Firebase Storage — URL Pública
                        </span>
                      ) : selectedBlock.imageUrl.startsWith('http://') || selectedBlock.imageUrl.startsWith('https://') ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          URL HTTPS Pública
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Imagem em Base64 Local
                        </span>
                      )
                    )}
                  </div>

                  {/* Upload & Normalization Action Area */}
                  <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        disabled={isNormalizing}
                        onClick={() => imageFileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isNormalizing ? 'sync' : 'upload_file'}
                        </span>
                        <span>{isNormalizing ? 'Processando...' : 'Fazer Upload do Cabeçalho'}</span>
                      </button>

                      {selectedBlock.imageUrl && (
                        <button
                          type="button"
                          disabled={isNormalizing}
                          onClick={handleNormalizeExistingImage}
                          className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Redimensiona e otimiza para 600px de largura"
                        >
                          <span className="material-symbols-outlined text-[16px] text-indigo-600">tune</span>
                          <span>Otimizar para 600px</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-indigo-950/80 font-medium leading-relaxed flex items-center gap-1.5 pt-1 border-t border-indigo-100/80">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600 shrink-0">verified</span>
                      <span>Geramos automaticamente a URL pública HTTPS necessária para exibição garantida no Gmail e Outlook.</span>
                    </p>
                  </div>

                  {/* Base64 Warning */}
                  {selectedBlock.imageUrl?.startsWith('data:') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">warning</span>
                        <div className="text-xs text-amber-900 leading-relaxed">
                          <p className="font-bold">Atenção ao usar Base64 no cabeçalho:</p>
                          <p className="mt-0.5 text-amber-800">
                            Provedores de e-mail bloqueiam imagens codificadas em Base64. Clique abaixo para gerar o link público HTTPS.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isNormalizing}
                        onClick={handleUploadExistingToPublicHost}
                        className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        <span>{isNormalizing ? 'Gerando URL pública...' : 'Hospedar em Link Público (Fixar para Gmail)'}</span>
                      </button>
                    </div>
                  )}

                  {/* Image Preview Box */}
                  {selectedBlock.imageUrl && (
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-20 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
                          <img
                            src={selectedBlock.imageUrl}
                            alt={selectedBlock.imageAlt || 'Cabeçalho'}
                            className="max-w-full max-h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="min-w-0 text-xs">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 truncate">
                              {selectedBlock.imageAlt || 'Cabeçalho do E-mail'}
                            </p>
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                              600px Largura
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs md:max-w-md">
                            {selectedBlock.imageUrl.length > 60
                              ? `${selectedBlock.imageUrl.substring(0, 60)}...`
                              : selectedBlock.imageUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateSelectedBlock({ imageUrl: '' })}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg border border-red-200 transition-colors flex items-center gap-1"
                          title="Remover Imagem"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* URL input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ou digite/cole a URL da imagem de cabeçalho:
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.imageUrl || ''}
                      onChange={(e) => updateSelectedBlock({ imageUrl: e.target.value })}
                      placeholder="https://sua-empresa.com/cabecalho-600x200.jpg"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Additional inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Link ao Clicar no Cabeçalho (Opcional)
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.imageLink || ''}
                      onChange={(e) => updateSelectedBlock({ imageLink: e.target.value })}
                      placeholder="https://seusite.com"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Texto Alternativo (Alt)</label>
                    <input
                      type="text"
                      value={selectedBlock.imageAlt || ''}
                      onChange={(e) => updateSelectedBlock({ imageAlt: e.target.value })}
                      placeholder="Ex: Cabeçalho Estácio Taquara"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Legenda Opcional</label>
                    <input
                      type="text"
                      value={selectedBlock.imageCaption || ''}
                      onChange={(e) => updateSelectedBlock({ imageCaption: e.target.value })}
                      placeholder="Ex: Edição Especial de Agosto"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TITLE FORM */}
            {selectedBlock.type === 'title' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Texto do Título</label>
                  <RichTextEditor
                    key={`${selectedBlock.id}-title`}
                    ref={activeEditorRef}
                    value={selectedBlock.text || ''}
                    onChange={(newVal) => updateSelectedBlock({ text: newVal })}
                    placeholder="Digite o título..."
                    minHeight="50px"
                    style={{
                      color: selectedBlock.textColor || '#1e1b4b',
                      fontSize: selectedBlock.fontSizePx ? `${selectedBlock.fontSizePx}px` : undefined,
                    }}
                  />
                </div>
                {renderFormattingToolbar()}
              </div>
            )}

            {/* SUBTITLE FORM */}
            {selectedBlock.type === 'subtitle' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Texto do Subtítulo</label>
                  <RichTextEditor
                    key={`${selectedBlock.id}-subtitle`}
                    ref={activeEditorRef}
                    value={selectedBlock.text || ''}
                    onChange={(newVal) => updateSelectedBlock({ text: newVal })}
                    placeholder="Digite o subtítulo..."
                    minHeight="50px"
                    style={{
                      color: selectedBlock.textColor || '#475569',
                      fontSize: selectedBlock.fontSizePx ? `${selectedBlock.fontSizePx}px` : undefined,
                    }}
                  />
                </div>
                {renderFormattingToolbar()}
              </div>
            )}

            {/* TEXT FORM */}
            {selectedBlock.type === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Conteúdo do Parágrafo</label>
                  <RichTextEditor
                    key={`${selectedBlock.id}-text`}
                    ref={activeEditorRef}
                    value={selectedBlock.text || ''}
                    onChange={(newVal) => updateSelectedBlock({ text: newVal })}
                    placeholder="Digite o conteúdo do parágrafo..."
                    minHeight="120px"
                    style={{
                      color: selectedBlock.textColor || '#334155',
                      fontSize: selectedBlock.fontSizePx ? `${selectedBlock.fontSizePx}px` : undefined,
                    }}
                  />
                </div>
                {renderFormattingToolbar()}
              </div>
            )}

            {/* BUTTON FORM */}
            {selectedBlock.type === 'button' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Texto do Botão</label>
                    <input
                      type="text"
                      value={selectedBlock.buttonLabel || ''}
                      onChange={(e) => {
                        updateSelectedBlock({ buttonLabel: e.target.value });
                        handleTextSelectOrChange(e, 'buttonLabel');
                      }}
                      onSelect={(e) => handleTextSelectOrChange(e, 'buttonLabel')}
                      onKeyUp={(e) => handleTextSelectOrChange(e, 'buttonLabel')}
                      onMouseUp={(e) => handleTextSelectOrChange(e, 'buttonLabel')}
                      onFocus={(e) => handleTextSelectOrChange(e, 'buttonLabel')}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Link de Destino (URL)</label>
                    <input
                      type="text"
                      value={selectedBlock.buttonUrl || ''}
                      onChange={(e) => updateSelectedBlock({ buttonUrl: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Formato e Largura do Botão</label>
                    <select
                      value={selectedBlock.buttonWidth || 'auto'}
                      onChange={(e) => updateSelectedBlock({ buttonWidth: e.target.value as any })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="auto">Arredondado Centralizado (Padrão CTA)</option>
                      <option value="full">100% da Largura (Preencher Bloco Inteiro)</option>
                    </select>
                  </div>
                </div>

                {renderFormattingToolbar({
                  defaultColorKey: 'buttonTextColor',
                  defaultBgKey: 'buttonBgColor',
                  showBgColor: true,
                })}
              </div>
            )}

            {/* IMAGE FORM */}
            {selectedBlock.type === 'image' && (
              <div className="space-y-4">
                {/* Hidden Image File Input */}
                <input
                  type="file"
                  ref={imageFileInputRef}
                  onChange={handleImageBlockUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600">image</span>
                      <span>Imagem / Banner do E-mail</span>
                    </label>
                    {selectedBlock.imageUrl && (
                      selectedBlock.imageUrl.includes('firebasestorage') ? (
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-amber-600">local_fire_department</span>
                          Firebase Storage (/emails/) — URL Pública vinculada ao HTML
                        </span>
                      ) : selectedBlock.imageUrl.startsWith('http://') || selectedBlock.imageUrl.startsWith('https://') ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          URL HTTPS Pública (Compatível com Gmail/Outlook)
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Imagem em Base64 Local (Pode ser bloqueada no Gmail)
                        </span>
                      )
                    )}
                  </div>

                  {/* Upload & Normalization Action Area */}
                  <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        disabled={isNormalizing}
                        onClick={() => imageFileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isNormalizing ? 'sync' : 'upload_file'}
                        </span>
                        <span>{isNormalizing ? 'Processando...' : 'Fazer Upload de Imagem'}</span>
                      </button>

                      {selectedBlock.imageUrl && (
                        <button
                          type="button"
                          disabled={isNormalizing}
                          onClick={handleNormalizeExistingImage}
                          className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Redimensiona e otimiza para ficar visível em qualquer celular e PC"
                        >
                          <span className="material-symbols-outlined text-[16px] text-indigo-600">tune</span>
                          <span>Ajustar Dimensões Celular/PC</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-indigo-950/80 font-medium leading-relaxed flex items-center gap-1.5 pt-1 border-t border-indigo-100/80">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600 shrink-0">verified</span>
                      <span>Suporta PNG, JPG, WEBP, GIF (Até 5MB). Geramos link HTTPS automático para exibição garantida no Gmail e Outlook.</span>
                    </p>
                  </div>

                  {/* Base64 Gmail Explanation Banner & Conversion Button */}
                  {selectedBlock.imageUrl?.startsWith('data:') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">warning</span>
                        <div className="text-xs text-amber-900 leading-relaxed">
                          <p className="font-bold">Por que imagens em Base64 somem ao receber o e-mail?</p>
                          <p className="mt-0.5 text-amber-800">
                            Provedores como <strong>Gmail, Outlook e Yahoo</strong> bloqueiam imagens codificadas localmente em Base64 (<code>data:image/...</code>) por política de segurança. Para garantir que ela apareça na caixa de entrada dos leitores, hospede em um link público HTTPS!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isNormalizing}
                        onClick={handleUploadExistingToPublicHost}
                        className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        <span>{isNormalizing ? 'Gerando URL pública...' : 'Hospedar em Link Público (Fixar para Gmail/Outlook)'}</span>
                      </button>
                    </div>
                  )}

                  {/* Image Preview Box */}
                  {selectedBlock.imageUrl && (
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
                          <img
                            src={selectedBlock.imageUrl}
                            alt={selectedBlock.imageAlt || 'Preview'}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="min-w-0 text-xs">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 truncate">
                              {selectedBlock.imageAlt || 'Imagem Selecionada'}
                            </p>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                              Visível em Celular e PC
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs md:max-w-md">
                            {selectedBlock.imageUrl.length > 60
                              ? `${selectedBlock.imageUrl.substring(0, 60)}...`
                              : selectedBlock.imageUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateSelectedBlock({ imageUrl: '' })}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg border border-red-200 transition-colors flex items-center gap-1"
                          title="Remover Imagem"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* URL fallback / direct edit */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ou digite/cole a URL externa da imagem:
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.imageUrl || ''}
                      onChange={(e) => updateSelectedBlock({ imageUrl: e.target.value })}
                      placeholder="https://sua-empresa.com/banner.jpg"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Metadata & Click Link inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Link ao Clicar na Imagem (Opcional)
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.imageLink || ''}
                      onChange={(e) => updateSelectedBlock({ imageLink: e.target.value })}
                      placeholder="https://seusite.com/promocao"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Texto Alternativo (Alt)</label>
                    <input
                      type="text"
                      value={selectedBlock.imageAlt || ''}
                      onChange={(e) => updateSelectedBlock({ imageAlt: e.target.value })}
                      placeholder="Ex: Banner Promocional"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Legenda Opcional</label>
                    <input
                      type="text"
                      value={selectedBlock.imageCaption || ''}
                      onChange={(e) => updateSelectedBlock({ imageCaption: e.target.value })}
                      placeholder="Ex: *Consulte regulamento"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* COUPON FORM */}
            {selectedBlock.type === 'coupon' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código do Cupom</label>
                  <input
                    type="text"
                    value={selectedBlock.couponCode || ''}
                    onChange={(e) => updateSelectedBlock({ couponCode: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Título da Oferta</label>
                  <input
                    type="text"
                    value={selectedBlock.couponDiscount || ''}
                    onChange={(e) => updateSelectedBlock({ couponDiscount: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cor de Fundo do Cupom</label>
                  <input
                    type="color"
                    value={selectedBlock.couponBgColor || '#f0fdf4'}
                    onChange={(e) => updateSelectedBlock({ couponBgColor: e.target.value })}
                    className="w-full h-9 p-1 border border-slate-300 rounded-lg bg-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cor da Borda Tracejada</label>
                  <input
                    type="color"
                    value={selectedBlock.couponBorderColor || '#16a34a'}
                    onChange={(e) => updateSelectedBlock({ couponBorderColor: e.target.value })}
                    className="w-full h-9 p-1 border border-slate-300 rounded-lg bg-white cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* DIVIDER FORM */}
            {selectedBlock.type === 'divider' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estilo da Linha</label>
                  <select
                    value={selectedBlock.dividerStyle || 'solid'}
                    onChange={(e) => updateSelectedBlock({ dividerStyle: e.target.value as any })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="solid">Sólido</option>
                    <option value="dashed">Tracejado</option>
                    <option value="dotted">Pontilhado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cor da Linha</label>
                  <input
                    type="color"
                    value={selectedBlock.dividerColor || '#e2e8f0'}
                    onChange={(e) => updateSelectedBlock({ dividerColor: e.target.value })}
                    className="w-full h-9 p-1 border border-slate-300 rounded-lg bg-white cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* SOCIAL FORM */}
            {selectedBlock.type === 'social' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instagram URL</label>
                  <input
                    type="text"
                    value={selectedBlock.instagramUrl || ''}
                    onChange={(e) => updateSelectedBlock({ instagramUrl: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={selectedBlock.linkedinUrl || ''}
                    onChange={(e) => updateSelectedBlock({ linkedinUrl: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facebook URL</label>
                  <input
                    type="text"
                    value={selectedBlock.facebookUrl || ''}
                    onChange={(e) => updateSelectedBlock({ facebookUrl: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={selectedBlock.websiteUrl || ''}
                    onChange={(e) => updateSelectedBlock({ websiteUrl: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            {/* FOOTER FORM */}
            {selectedBlock.type === 'footer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Texto do Rodapé</label>
                  <RichTextEditor
                    key={`${selectedBlock.id}-footerText`}
                    ref={activeEditorRef}
                    value={selectedBlock.footerText || ''}
                    onChange={(newVal) => updateSelectedBlock({ footerText: newVal })}
                    placeholder="Digite o texto do rodapé..."
                    minHeight="80px"
                    style={{
                      color: selectedBlock.footerTextColor || selectedBlock.textColor || '#64748b',
                      fontSize: selectedBlock.fontSizePx ? `${selectedBlock.fontSizePx}px` : undefined,
                    }}
                  />
                </div>
                {renderFormattingToolbar({
                  defaultColorKey: 'footerTextColor',
                  defaultBgKey: 'footerBgColor',
                })}
              </div>
            )}
          </div>
        )}

        {!selectedBlock && (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-[36px] text-slate-400">touch_app</span>
            <p className="text-sm font-bold text-slate-700">Nenhum bloco selecionado para edição</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Clique em um bloco na lista acima ou adicione um novo bloco pelo botão <strong>+ Adicionar Bloco</strong>.
            </p>
            <button
              type="button"
              onClick={() => handleAddBlock('text')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Adicionar Primeiro Bloco</span>
            </button>
          </div>
        )}
      </div>

      {/* COLUNA DIREITA: CANVAS DE VISUALIZAÇÃO EM TEMPO REAL (STICKY ON DESKTOP) */}
          <div className="lg:col-span-5 xl:col-span-6 lg:sticky lg:top-20 lg:self-start z-10 space-y-4">
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <span>Visualização Real-time</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">AO VIVO</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        previewDevice === 'desktop' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">desktop_windows</span>
                      <span>PC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        previewDevice === 'mobile' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">smartphone</span>
                      <span>Mobile</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('visualizacao', 'push')}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Ver em tela cheia / Exportar HTML"
                  >
                    <span className="material-symbols-outlined text-[15px]">open_in_full</span>
                    <span className="hidden sm:inline">Expandir</span>
                  </button>
                </div>
              </div>

              {/* Rendered Live Canvas Simulation Container (Fluid Height, No Internal Scrollbar) */}
              <div className="bg-slate-100/90 rounded-2xl p-3 sm:p-4 flex justify-center items-start">
                <div
                  className={`transition-all duration-300 bg-white rounded-xl shadow-md overflow-hidden ${
                    previewDevice === 'mobile' ? 'w-[340px]' : 'w-full max-w-[580px]'
                  }`}
                >
                  <iframe
                    ref={previewIframeRef}
                    onLoad={handleIframeLoad}
                    title="Gerador PRO Live Preview Canvas"
                    srcDoc={compiledHtml}
                    scrolling="no"
                    style={{ height: `${iframeHeight}px` }}
                    className="w-full border-0 transition-[height] duration-200 block"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
