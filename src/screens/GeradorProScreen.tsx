import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { EmailData, EmailBlock, BlockType, Screen, TransitionType } from '../types';
import { parseHtmlToBlocks } from '../utils/htmlParser';
import { normalizeImage } from '../utils/imageNormalizer';
import { uploadToPublicHost, checkImageSize } from '../utils/imageUploader';
import { compileBlocksToHtml, generateSingleBlockHtml } from '../utils/compiler';
import { DEFAULT_TEMPLATES } from '../data/templates';
import { RichTextEditorRef } from '../components/RichTextEditor';
import {
  BlocksSidebar,
  PropertiesPanel,
  PreviewCanvas,
  TemplateSelector,
} from '../components/gerador';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const activeEditorRef = useRef<RichTextEditorRef | null>(null);

  const [iframeHeight, setIframeHeight] = useState<number>(600);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const isIframeInitializedRef = useRef<boolean>(false);
  const prevBlocksRef = useRef<EmailBlock[]>(blocks);
  // Track the HTML version produced by this component to avoid re-parsing on self-updates
  const localCompiledHtmlRef = useRef<string>(compileBlocksToHtml(blocks));

  // Memoize compiled HTML based on blocks
  const compiledHtml = useMemo(() => compileBlocksToHtml(blocks), [blocks]);

  // Auto resize iframe to fit full content without internal scrollbars
  const handleIframeLoad = useCallback(() => {
    try {
      if (previewIframeRef.current && previewIframeRef.current.contentWindow) {
        const doc = previewIframeRef.current.contentDocument || previewIframeRef.current.contentWindow.document;
        if (doc) {
          const scrollH = doc.documentElement?.scrollHeight || doc.body?.scrollHeight;
          if (scrollH && scrollH > 200) {
            setIframeHeight((prev) => (Math.abs(prev - (scrollH + 10)) > 8 ? scrollH + 10 : prev));
          }
          isIframeInitializedRef.current = true;
        }
      }
    } catch {
      // Cross-origin fallback
    }
  }, []);

  // Recalculate iframe height smoothly without resetting scroll position
  useEffect(() => {
    const timer = setTimeout(() => {
      handleIframeLoad();
    }, 150);
    return () => clearTimeout(timer);
  }, [compiledHtml, previewDevice, handleIframeLoad]);

  // Partial DOM update in preview iframe: when only block styling/content changes (same block structure/ids),
  // update the corresponding DOM elements in place so the iframe document is NEVER rebuilt, preventing any jump or scroll reset.
  useEffect(() => {
    const prevBlocks = prevBlocksRef.current;
    prevBlocksRef.current = blocks;

    if (!isIframeInitializedRef.current || !previewIframeRef.current) {
      return;
    }

    try {
      const doc = previewIframeRef.current.contentDocument || previewIframeRef.current.contentWindow?.document;
      if (!doc || !doc.body) return;

      const sameBlockIds =
        prevBlocks.length === blocks.length &&
        blocks.every((b, idx) => prevBlocks[idx] && prevBlocks[idx].id === b.id && prevBlocks[idx].type === b.type);

      if (sameBlockIds) {
        // Update each block element in-place without triggering iframe re-parse or scroll jump
        blocks.forEach((block) => {
          const blockEl = doc.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement | null;
          if (blockEl) {
            const tempDiv = doc.createElement('div');
            tempDiv.innerHTML = generateSingleBlockHtml(block).trim();
            const newBlockEl = tempDiv.firstElementChild;
            if (newBlockEl && blockEl.outerHTML !== newBlockEl.outerHTML) {
              blockEl.replaceWith(newBlockEl);
            }
          }
        });

        // Update iframe height if content dimensions shifted
        const scrollH = doc.documentElement?.scrollHeight || doc.body?.scrollHeight;
        if (scrollH && scrollH > 200) {
          setIframeHeight((prev) => (Math.abs(prev - (scrollH + 10)) > 8 ? scrollH + 10 : prev));
        }
      }
    } catch {
      // Fallback silently if document access fails
    }
  }, [blocks]);

  // Continuously sync compiled HTML from Gerador Visual blocks to global emailData.customCodeHtml
  useEffect(() => {
    localCompiledHtmlRef.current = compiledHtml;
    setEmailData((prev) => {
      if (prev.customCodeHtml === compiledHtml) return prev;
      return {
        ...prev,
        customCodeHtml: compiledHtml,
      };
    });
  }, [compiledHtml, setEmailData]);

  // Sync blocks ONLY if emailData.customCodeHtml changes externally (e.g. from template load or external file import)
  useEffect(() => {
    const externalHtml = emailData.customCodeHtml;
    if (!externalHtml || externalHtml === localCompiledHtmlRef.current) {
      return;
    }
    localCompiledHtmlRef.current = externalHtml;
    const parsed = parseHtmlToBlocks(externalHtml);
    if (parsed && parsed.length > 0) {
      setBlocks(parsed);
      setSelectedBlockId((prev) => (parsed.some((b) => b.id === prev) ? prev : parsed[0].id));
    }
  }, [emailData.customCodeHtml]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const isHtml = file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type === 'text/html';
      if (!isHtml) {
        showToast('⚠️ Por favor, selecione um arquivo de texto com extensão .html ou .htm');
        e.target.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast('⚠️ O arquivo HTML excede o limite seguro de 10 MB.');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (content && content.trim()) {
            setEmailData((prev) => ({
              ...prev,
              customCodeHtml: content,
            }));
            
            const parsedBlocks = parseHtmlToBlocks(content);
            if (parsedBlocks && parsedBlocks.length > 0) {
              setBlocks(parsedBlocks);
              setSelectedBlockId(parsedBlocks[0].id);
              showToast(`✓ Arquivo "${file.name}" importado com sucesso (${parsedBlocks.length} blocos identificados)!`);
            } else {
              showToast(`✓ Arquivo "${file.name}" importado no Gerador Visual!`);
            }
          } else {
            showToast('⚠️ O arquivo selecionado está vazio.');
          }
        } catch (parseErr: any) {
          console.error('Erro ao processar conteúdo do arquivo:', parseErr);
          showToast('⚠️ Erro ao interpretar a estrutura do arquivo HTML.');
        }
      };
      reader.onerror = (readErr) => {
        console.error('Erro na leitura do arquivo:', readErr);
        showToast('⚠️ Ocorreu um erro ao ler o arquivo. Tente novamente.');
      };
      reader.readAsText(file);
    } catch (err: any) {
      console.error('Erro geral no upload de arquivo:', err);
      showToast('⚠️ Falha ao abrir o arquivo selecionado.');
    } finally {
      e.target.value = '';
    }
  };

  const handleImageBlockUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    const sizeCheck = checkImageSize(file, 5);
    if (!sizeCheck.valid) {
      showToast(`⚠️ ${sizeCheck.message}`);
      e.target.value = '';
      return;
    }

    setIsNormalizing(true);
    showToast('Otimizando e fazendo upload para Firebase Storage (/emails/)...');
    try {
      const normalizedDataUrl = await normalizeImage(file, 1200);
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
        // Handled above
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
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer"
              title="Importar um arquivo HTML para edição no Editor"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Importar HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setBlocks(DEFAULT_BLOCKS)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Resetar</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('visualizacao', 'push')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              <span>Ver Visualização</span>
            </button>
          </div>
        </div>

        {/* Modelos Prontos de E-mail (Templates) */}
        <TemplateSelector
          activeTemplateId={emailData.activeTemplateId}
          onSelectTemplate={handleSelectModel}
        />

        {/* Split Screen Layout (Editor Left + Canvas Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Blocks Management & Selected Block Properties */}
          <div className="lg:col-span-7 xl:col-span-6 space-y-6">
            {/* Blocks Structure Sidebar */}
            <BlocksSidebar
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              setSelectedBlockId={setSelectedBlockId}
              onAddBlock={handleAddBlock}
              onReorder={handleReorder}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              draggedIdx={draggedIdx}
              setDraggedIdx={setDraggedIdx}
              dragOverIdx={dragOverIdx}
              setDragOverIdx={setDragOverIdx}
              isAddBlockMenuOpen={isAddBlockMenuOpen}
              setIsAddBlockMenuOpen={setIsAddBlockMenuOpen}
              openCardMenuId={openCardMenuId}
              setOpenCardMenuId={setOpenCardMenuId}
            />

            {/* Selected Block Properties Panel */}
            <PropertiesPanel
              selectedBlock={selectedBlock}
              updateSelectedBlock={updateSelectedBlock}
              applyFormattingToSelection={applyFormattingToSelection}
              insertVariableToSelectedBlock={insertVariableToSelectedBlock}
              activeSelection={activeSelection}
              linkModalOpen={linkModalOpen}
              setLinkModalOpen={setLinkModalOpen}
              linkText={linkText}
              setLinkText={setLinkText}
              linkUrl={linkUrl}
              setLinkUrl={setLinkUrl}
              onSaveLink={handleSaveLink}
              onRemoveLink={handleRemoveLinkFromBlock}
              handleOpenLinkModal={handleOpenLinkModal}
              handleDuplicate={handleDuplicate}
              handleAddBlock={handleAddBlock}
              handleTextSelectOrChange={handleTextSelectOrChange}
              activeEditorRef={activeEditorRef}
              imageFileInputRef={imageFileInputRef}
              handleImageBlockUpload={handleImageBlockUpload}
              handleNormalizeExistingImage={handleNormalizeExistingImage}
              handleUploadExistingToPublicHost={handleUploadExistingToPublicHost}
              isNormalizing={isNormalizing}
            />
          </div>

          {/* Right Column: Real-time Live Canvas Simulation */}
          <PreviewCanvas
            compiledHtml={compiledHtml}
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
            iframeHeight={iframeHeight}
            onExpand={() => onNavigate('visualizacao', 'push')}
            handleIframeLoad={handleIframeLoad}
            iframeRef={previewIframeRef}
          />
        </div>
      </div>
    </div>
  );
};
