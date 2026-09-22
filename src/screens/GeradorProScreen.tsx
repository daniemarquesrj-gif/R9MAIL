import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { EmailData, EmailBlock, BlockType, Screen, TransitionType, EmailTemplate } from '../types';
import { parseHtmlToBlocks } from '../utils/htmlParser';
import { normalizeImage } from '../utils/imageNormalizer';
import { uploadImage, checkImageSize } from '../utils/imageUploader';
import { compileBlocksToHtml, generateSingleBlockHtml } from '../utils/compiler';
import { compileTransportHtml } from '../utils/emailCompiler';
import { sanitizeEmailHtml } from '../utils/security';
import { RichTextEditorRef } from '../components/RichTextEditor';
import {
  EditorTopBar,
  ExportModal,
  ImportModal,
  TemplateManagerModal,
  BlocksSidebar,
  PropertiesPanel,
  PreviewCanvas,
} from '../components/gerador';
import { DEFAULT_BLOCKS } from '../data/defaultBlocks';
import { useEditorHistory } from '../hooks/useEditorHistory';
import { useDraftAutosave } from '../hooks/useDraftAutosave';
import { Toast } from '../components/ui/Toast';
import { BlockSelectorModal } from '../components/gerador/BlockSelectorModal';
import { sanitizeBlockPropertyUpdate } from '../data/blockProperties';
import {
  listSavedTemplates,
  loadDraft,
  saveDraft,
  saveTemplateDocument,
  restoreTemplateVersion,
  deleteSavedTemplate,
} from '../utils/templateStore';
import type { TemplateDocument } from '../utils/templateStore';

interface GeradorProScreenProps {
  emailData: EmailData;
  setEmailData: React.Dispatch<React.SetStateAction<EmailData>>;
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
}


export const GeradorProScreen: React.FC<GeradorProScreenProps> = ({
  emailData,
  setEmailData,
  onNavigate,
}) => {
  // Initialize the document identity first so drafts can never leak between templates.
  const [documentId, setDocumentId] = useState<string>(() => emailData.documentId || `template-${Date.now()}`);
  const [draft] = useState(() => loadDraft(documentId));
  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    if (draft?.blocks?.length) return draft.blocks;
    if (emailData.contentSource === 'html' && emailData.customCodeHtml) {
      const parsed = parseHtmlToBlocks(sanitizeEmailHtml(emailData.customCodeHtml));
      if (parsed && parsed.length > 0) return parsed;
    }
    return DEFAULT_BLOCKS;
  });
  const [savedTemplates, setSavedTemplates] = useState<TemplateDocument[]>(() => listSavedTemplates());
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isMobileBlockSelectorOpen, setIsMobileBlockSelectorOpen] = useState(false);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(() => blocks[0]?.id || null);
  useEffect(() => {
    if (draft?.emailData) {
      setEmailData((prev) => ({ ...prev, ...draft.emailData, documentId: draft.documentId || prev.documentId }));
    }
  }, []);


  useEffect(() => {
    setEmailData((prev) => ({ ...prev, documentId, contentSource: 'blocks' }));
  }, []);

  const { push: pushToHistory, undo, redo, reset: resetHistory, canUndo, canRedo } = useEditorHistory(blocks);

  const handleUndo = useCallback(() => {
    const previous = undo();
    if (previous) setBlocks(previous);
  }, [undo]);

  const handleRedo = useCallback(() => {
    const next = redo();
    if (next) setBlocks(next);
  }, [redo]);

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextEditing = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );
      if (isTextEditing) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const { saveStatus, setSaveStatus, lastSavedTime, setLastSavedTime } = useDraftAutosave(blocks, emailData, documentId);

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [linkText, setLinkText] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');

  // Selection state
  const [activeSelection, setActiveSelection] = useState<{
    fieldName: string;
    start: number;
    end: number;
    selectedText: string;
  } | null>(null);
  const [hasRichTextSelection, setHasRichTextSelection] = useState(false);
  const [inlineBlockDrafts, setInlineBlockDrafts] = useState<Record<string, Partial<EmailBlock>>>({});

  useEffect(() => {
    setActiveSelection(null);
    setHasRichTextSelection(false);
  }, [selectedBlockId]);

  // Viewport Device and UI State
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [toastMessage, setToastMessage] = useState<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);
  const [isNormalizing, setIsNormalizing] = useState<boolean>(false);

  // References
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const activeEditorRef = useRef<RichTextEditorRef | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(600);
  const prevBlocksRef = useRef<EmailBlock[]>(blocks);
  const localCompiledHtmlRef = useRef<string>(compileBlocksToHtml(blocks));

  // Memoize compiled HTML
  const compiledHtml = useMemo(() => compileBlocksToHtml(blocks), [blocks]);
  const transportHtml = useMemo(() => compileTransportHtml({ ...emailData, documentId }, blocks), [emailData, blocks, documentId]);

  // Handle iframe dynamic height
  const handleIframeLoad = useCallback(() => {
    try {
      if (previewIframeRef.current && previewIframeRef.current.contentWindow) {
        const doc = previewIframeRef.current.contentDocument || previewIframeRef.current.contentWindow.document;
        if (doc) {
          const bodyH = doc.body?.scrollHeight || 0;
          const htmlH = doc.documentElement?.scrollHeight || 0;
          const contentH = Math.max(bodyH, htmlH);
          if (contentH > 100) {
            setIframeHeight(contentH + 20);
          }
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  // Sync iframe block DOM elements in-place when block properties change
  useEffect(() => {
    const prev = prevBlocksRef.current;
    prevBlocksRef.current = blocks;

    if (!previewIframeRef.current || !previewIframeRef.current.contentWindow) return;
    try {
      const doc = previewIframeRef.current.contentDocument || previewIframeRef.current.contentWindow.document;
      if (!doc || !doc.body) return;

      const sameBlockIds =
        prev.length === blocks.length && prev.every((b, i) => b.id === blocks[i]?.id);

      if (sameBlockIds) {
        blocks.forEach((block) => {
          const blockEl = doc.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement | null;
          if (blockEl) {
            // Nunca substitua um elemento enquanto ele estiver sendo editado
            // diretamente no canvas. O DOM do contenteditable é a fonte de
            // verdade durante a digitação; substituir o nó destrói o caret,
            // quebra espaço/Enter e faz teclas repetidas parecerem travadas.
            const activeInlineEditor = blockEl.querySelector('[data-inline-edit][contenteditable="true"][data-r9-editing="true"]');
            if (activeInlineEditor) return;

            const tempDiv = doc.createElement('div');
            tempDiv.innerHTML = generateSingleBlockHtml(block).trim();
            const newBlockEl = tempDiv.firstElementChild;
            if (newBlockEl && blockEl.outerHTML !== newBlockEl.outerHTML) {
              blockEl.replaceWith(newBlockEl);
            }
          }
        });

        const scrollH = doc.documentElement?.scrollHeight || doc.body?.scrollHeight;
        if (scrollH && scrollH > 100) {
          setIframeHeight((prevH) => (Math.abs(prevH - (scrollH + 10)) > 8 ? scrollH + 10 : prevH));
        }
      }
    } catch {
      // Fallback
    }
  }, [blocks]);

  // Continuously sync compiled HTML to emailData for external screens (e.g. VisualizacaoScreen)
  useEffect(() => {
    localCompiledHtmlRef.current = compiledHtml;
    setEmailData((prev) => {
      if (prev.customCodeHtml === compiledHtml) return prev;
      return {
        ...prev,
        customCodeHtml: compiledHtml,
        contentSource: 'blocks',
        documentId,
        subject: prev.subject || prev.headerTitle,
      };
    });
  }, [compiledHtml, setEmailData]);

  const showToast = useCallback((msg: string, kind: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ message: msg, kind });
  }, []);

  const persistTemplate = useCallback(() => {
    setSaveStatus('saving');
    try {
      const saved = saveTemplateDocument({
        id: documentId,
        name: emailData.headerTitle || 'Meu template',
        subject: emailData.subject || 'E-mail sem assunto',
        blocks,
        emailData: { ...emailData, documentId },
      });
      setDocumentId(saved.id);
      setSavedTemplates(listSavedTemplates());
      saveDraft(blocks, { ...emailData, documentId: saved.id }, saved.id);
      setSaveStatus('saved');
      setLastSavedTime(`às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      showToast('Template salvo com nova versão.');
    } catch {
      setSaveStatus('error');
      showToast('Não foi possível salvar o template.', 'error');
    }
  }, [blocks, documentId, emailData]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        persistTemplate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [persistTemplate]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatus === 'dirty' || saveStatus === 'saving') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const handleLoadSavedTemplate = (template: TemplateDocument) => {
    const safeHtml = sanitizeEmailHtml(template.emailData.customCodeHtml || '');
    const parsed = template.blocks?.length ? template.blocks : parseHtmlToBlocks(safeHtml);
    if (!parsed?.length) {
      showToast('Não foi possível reconstruir este template.', 'error');
      return;
    }
    setDocumentId(template.id);
    setBlocks(parsed);
    setSelectedBlockId(parsed[0]?.id || null);
    setEmailData({ ...template.emailData, customCodeHtml: safeHtml, documentId: template.id, contentSource: 'blocks', subject: template.subject });
    resetHistory(parsed);
    setIsTemplateManagerOpen(false);
    setSaveStatus('saved');
    showToast(`Template \"${template.name}\" carregado.`);
  };

  const handleDeleteSavedTemplate = (id: string) => {
    deleteSavedTemplate(id);
    setSavedTemplates(listSavedTemplates());
    showToast('Template removido.');
  };

  const handleRestoreVersion = (templateId: string, versionId: string) => {
    const restored = restoreTemplateVersion(templateId, versionId);
    if (restored) {
      setSavedTemplates(listSavedTemplates());
      handleLoadSavedTemplate(restored);
      showToast('Versão restaurada.');
    }
  };

  // Block management handlers
  const handleAddBlock = (type: BlockType, insertAfterIndex?: number) => {
    const newId = `block-${Date.now()}`;
    let newBlock: EmailBlock = { id: newId, type };

    switch (type) {
      case 'header_text':
      case 'header':
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
          text: 'Insira aqui seu subtítulo curto de apoio',
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
          imageUrl: '',
          imageAlt: 'Imagem Ilustrativa',
          imageCaption: '',
          imageWidthPx: 600,
          alignment: 'center',
          bgColor: '#ffffff',
        };
        break;
      case 'header_image':
        newBlock = {
          ...newBlock,
          imageUrl: '',
          imageAlt: 'Imagem de Cabeçalho',
          imageCaption: '',
          imageWidthPx: 600,
          alignment: 'center',
          bgColor: '#ffffff',
        };
        break;
      case 'coupon':
        newBlock = {
          ...newBlock,
          couponCode: 'CUPOMPRO2026',
          couponDiscount: 'OFERTA ESPECIAL 25% OFF',
          couponBgColor: '#f0fdf4',
          couponBorderColor: '#16a34a',
          fontSizePx: 22,
          isBold: true,
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

    const nextBlocks = [...blocks];
    if (typeof insertAfterIndex === 'number' && insertAfterIndex >= 0 && insertAfterIndex < nextBlocks.length) {
      nextBlocks.splice(insertAfterIndex + 1, 0, newBlock);
    } else {
      nextBlocks.push(newBlock);
    }

    setBlocks(nextBlocks);
    setSelectedBlockId(newId);
    pushToHistory(nextBlocks);
    showToast(`Bloco adicionado ao e-mail!`);
  };

  const handleDuplicate = (block: EmailBlock) => {
    const dupId = `block-${Date.now()}`;
    const dupBlock = { ...block, id: dupId };
    const index = blocks.findIndex((b) => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, dupBlock);
    setBlocks(newBlocks);
    setSelectedBlockId(dupId);
    pushToHistory(newBlocks);
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
      setSelectedBlockId(newBlocks[0]?.id || null);
    }
    pushToHistory(newBlocks);
    showToast('Bloco removido.');
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= blocks.length || toIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [draggedItem] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, draggedItem);
    setBlocks(newBlocks);
    pushToHistory(newBlocks);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index - 1];
    newBlocks[index - 1] = newBlocks[index];
    newBlocks[index] = temp;
    setBlocks(newBlocks);
    pushToHistory(newBlocks);
  };

  const handleMoveDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index + 1];
    newBlocks[index + 1] = newBlocks[index];
    newBlocks[index] = temp;
    setBlocks(newBlocks);
    pushToHistory(newBlocks);
  };

  const updateSelectedBlock = (updatedProps: Partial<EmailBlock>) => {
    const targetId = selectedBlockId;
    if (!targetId) return;

    const safeProps = sanitizeBlockPropertyUpdate(updatedProps);
    if (Object.keys(safeProps).length === 0) return;

    const nextBlocks = blocks.map((block) =>
      block.id === targetId ? { ...block, ...safeProps } : block,
    );
    setBlocks(nextBlocks);
    const coalescibleFields = new Set([
      'text',
      'headerTitle',
      'headerSubtitle',
      'footerText',
      'buttonLabel',
      'buttonUrl',
      'couponCode',
      'couponDiscount',
    ]);
    const shouldCoalesce = Object.keys(safeProps).some((key) => coalescibleFields.has(key));
    pushToHistory(nextBlocks, shouldCoalesce ? { coalesce: true } : undefined);
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    const safeTemplateHtml = template.customCodeHtml
      ? sanitizeEmailHtml(template.customCodeHtml)
      : undefined;

    setEmailData((prev) => ({
      ...prev,
      activeTemplateId: template.id,
      headerTitle: template.headerTitle || prev.headerTitle,
      greeting: template.greeting || prev.greeting,
      buttonText: template.buttonText || prev.buttonText,
      buttonUrl: template.buttonUrl || prev.buttonUrl,
      bodyText: template.bodyText || prev.bodyText,
      footerText: template.footerText || prev.footerText,
      primaryColor: template.primaryColor || prev.primaryColor,
      customCodeHtml: safeTemplateHtml,
      contentSource: 'blocks',
    }));

    if (safeTemplateHtml) {
      const parsed = parseHtmlToBlocks(safeTemplateHtml);
      if (parsed && parsed.length > 0) {
        setBlocks(parsed);
        setSelectedBlockId(parsed[0].id);
        pushToHistory(parsed);
        showToast(`✓ Modelo "${template.name}" carregado com sucesso!`);
        return;
      }
    }
    showToast(`✓ Modelo "${template.name}" carregado!`);
  };

  const handleImportHtmlContent = (rawHtml: string) => {
    const safeHtml = sanitizeEmailHtml(rawHtml);
    setEmailData((prev) => ({
      ...prev,
      customCodeHtml: safeHtml,
      contentSource: 'blocks',
    }));
    const parsed = parseHtmlToBlocks(safeHtml);
    if (parsed && parsed.length > 0) {
      setBlocks(parsed);
      setSelectedBlockId(parsed[0].id);
      pushToHistory(parsed);
    }
  };

  // Image Upload handler with Firebase & Normalization
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
    showToast('Otimizando e enviando para Firebase Storage (/emails/)...');
    try {
      const normalizedDataUrl = await normalizeImage(file, 1200);
      const uploadRes = await uploadImage(normalizedDataUrl, file.name);

      if (uploadRes.isPublicUrl) {
        updateSelectedBlock({ imageUrl: uploadRes.url });
        if (uploadRes.isFirebase) {
          showToast('🔥 Imagem enviada para Firebase Storage (/emails/)!');
        } else {
          showToast('✨ Imagem hospedada com URL pública HTTPS!');
        }
      } else {
        updateSelectedBlock({ imageUrl: uploadRes.url });
        showToast('⚠️ Salvo localmente.');
      }
    } catch (err: unknown) {
      console.error('Erro no processamento da imagem:', err);
      showToast(err instanceof Error ? err.message : 'Não foi possível carregar a imagem selecionada.', 'error');
    } finally {
      setIsNormalizing(false);
      e.target.value = '';
    }
  };

  const handleNormalizeExistingImage = async () => {
    const selected = blocks.find((b) => b.id === selectedBlockId);
    if (!selected || !selected.imageUrl) {
      showToast('Insira ou envie uma imagem primeiro para normalizar.');
      return;
    }

    setIsNormalizing(true);
    showToast('Ajustando dimensões para clientes de e-mail...');

    try {
      const normalized = await normalizeImage(selected.imageUrl, 1200);
      const res = await uploadImage(normalized, 'email_banner_normalized');
      updateSelectedBlock({ imageUrl: res.url });
      if (res.isFirebase) {
        showToast('🔥 Imagem ajustada e enviada para o Firebase Storage (/emails/)!');
      } else {
        showToast('✨ Imagem ajustada e hospedada com URL pública!');
      }
    } catch (err) {
      showToast('Não foi possível ajustar a imagem.');
    } finally {
      setIsNormalizing(false);
    }
  };

  const handleUploadExistingImage = async () => {
    const selected = blocks.find((b) => b.id === selectedBlockId);
    if (!selected || !selected.imageUrl) {
      showToast('Nenhuma imagem selecionada para hospedar.');
      return;
    }

    setIsNormalizing(true);
    showToast('Enviando para o Firebase Storage (/emails/)...');

    try {
      const res = await uploadImage(selected.imageUrl, 'email_banner');
      if (res.isPublicUrl) {
        updateSelectedBlock({ imageUrl: res.url });
        showToast('🔥 Imagem enviada para o Firebase Storage (/emails/)!');
      } else {
        showToast(res.message);
      }
    } catch (err) {
      showToast('Não foi possível realizar o upload da imagem.');
    } finally {
      setIsNormalizing(false);
    }
  };

  // Text Selection and Links
  const handleTextSelectOrChange = (
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: string
  ) => {
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const fullText = target.value;

    if (start < end) {
      setActiveSelection({
        fieldName,
        start,
        end,
        selectedText: fullText.substring(start, end),
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
    const selected = blocks.find((b) => b.id === selectedBlockId);
    if (!selected) return;

    let selText = activeEditorRef.current?.getSelectionText() || activeSelection?.selectedText || '';
    const cleanSelText = selText.replace(/<[^>]*>/g, '');
    setLinkText(cleanSelText);
    setLinkUrl('https://');
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
      showToast(`Link "${displayText}" inserido no texto!`);
    } else if (selectedBlockId) {
      const selected = blocks.find((b) => b.id === selectedBlockId);
      if (selected) {
        const defaultField = (
          (selected.type === 'header' || selected.type === 'header_text') ? 'headerTitle' :
          selected.type === 'footer' ? 'footerText' :
          selected.type === 'button' ? 'buttonLabel' : 'text'
        );
        const curr = String((selected as any)[defaultField] || '');
        updateSelectedBlock({ [defaultField]: curr ? `${curr} ${linkHtml}` : linkHtml });
        showToast(`Link "${displayText}" inserido!`);
      }
    }

    setLinkModalOpen(false);
    setLinkText('');
    setLinkUrl('');
  };

  const handleRemoveLinkFromBlock = () => {
    if (activeEditorRef.current) {
      activeEditorRef.current.execCommand('unlink');
      showToast('Link removido do texto.');
    }
    setLinkModalOpen(false);
  };

  const applyFormattingToSelection = (
    formatType: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'color' | 'fontSize' | 'fontFamily' | 'clear' | 'variable' | 'link' | 'unlink',
    formatValue?: string | number,
    colorTargetKey?: 'textColor' | 'headerTextColor' | 'buttonTextColor' | 'footerTextColor'
  ) => {
    const selected = blocks.find((b) => b.id === selectedBlockId);
    if (!selected) return;

    const editor = activeEditorRef.current;
    const hasInlineSelection = Boolean(editor?.hasSavedSelection());

    if (editor && hasInlineSelection) {
      editor.restoreSelection();
    }

    if (formatType === 'color' && formatValue && !hasInlineSelection) {
      const colorVal = String(formatValue);
      const targetField = colorTargetKey || (
        (selected.type === 'header' || selected.type === 'header_text') ? 'headerTextColor' :
        selected.type === 'footer' ? 'footerTextColor' :
        selected.type === 'button' ? 'buttonTextColor' : 'textColor'
      );
      updateSelectedBlock({ [targetField]: colorVal });
      return;
    }

    const editorCanApplyInline = Boolean(
      editor && (
        hasInlineSelection ||
        formatType === 'variable' ||
        formatType === 'link' ||
        formatType === 'unlink'
      )
    );

    if (editorCanApplyInline && editor) {
      switch (formatType) {
        case 'bold':
          editor.execCommand('bold');
          break;
        case 'italic':
          editor.execCommand('italic');
          break;
        case 'underline':
          editor.execCommand('underline');
          break;
        case 'strikethrough':
          editor.execCommand('strikeThrough');
          break;
        case 'color':
          if (formatValue) editor.applyInlineStyle('color', String(formatValue));
          break;
        case 'fontSize':
          if (formatValue) editor.applyInlineStyle('font-size', `${Number(formatValue)}px`);
          break;
        case 'fontFamily':
          if (formatValue) editor.applyInlineStyle('font-family', String(formatValue));
          break;
        case 'clear':
          editor.execCommand('removeFormat');
          break;
        case 'variable':
          if (formatValue) editor.insertHtml(` ${formatValue} `);
          break;
        case 'link':
          handleOpenLinkModal();
          return;
        case 'unlink':
          editor.execCommand('unlink');
          break;
      }
      showToast('Formatação aplicada no editor de texto!');
    } else {
      if (formatType === 'bold' && !hasInlineSelection) updateSelectedBlock({ isBold: !selected.isBold });
      else if (formatType === 'italic' && !hasInlineSelection) updateSelectedBlock({ isItalic: !selected.isItalic });
      else if (formatType === 'underline' && !hasInlineSelection) updateSelectedBlock({ isUnderline: !selected.isUnderline });
      else if (formatType === 'strikethrough' && !hasInlineSelection) updateSelectedBlock({ isStrikethrough: !selected.isStrikethrough });
      else if (formatType === 'fontSize' && formatValue && !hasInlineSelection) updateSelectedBlock({ fontSizePx: Number(formatValue) });
      else if (formatType === 'fontFamily' && formatValue && !hasInlineSelection) updateSelectedBlock({ fontFamily: String(formatValue) });
      else if (formatType === 'variable' && formatValue) {
        const defaultField = (
          (selected.type === 'header' || selected.type === 'header_text') ? 'headerTitle' :
          selected.type === 'footer' ? 'footerText' :
          selected.type === 'button' ? 'buttonLabel' : 'text'
        );
        const curr = String((selected as any)[defaultField] || '');
        updateSelectedBlock({ [defaultField]: curr + ` ${formatValue} ` });
      }
    }
  };

  const insertVariableToSelectedBlock = (varName: string) => {
    applyFormattingToSelection('variable', varName);
  };

  const handleInlineBlockDraft = useCallback((blockId: string, field: keyof EmailBlock, value: string) => {
    setInlineBlockDrafts((prev) => ({
      ...prev,
      [blockId]: { ...(prev[blockId] || {}), [field]: value },
    }));
  }, []);

  const handleInlineBlockEdit = useCallback((blockId: string, field: keyof EmailBlock, value: string) => {
    const target = blocks.find((block) => block.id === blockId);
    if (!target) return;
    setSelectedBlockId(blockId);
    updateSelectedBlockForId(blockId, { [field]: value });
    setInlineBlockDrafts((prev) => {
      if (!prev[blockId]) return prev;
      const next = { ...prev };
      const blockDraft = { ...next[blockId] };
      delete blockDraft[field];
      if (Object.keys(blockDraft).length) next[blockId] = blockDraft;
      else delete next[blockId];
      return next;
    });
  }, [blocks]);

  const updateSelectedBlockForId = (targetId: string, updatedProps: Partial<EmailBlock>) => {
    const safeProps = sanitizeBlockPropertyUpdate(updatedProps);
    if (!Object.keys(safeProps).length) return;
    const nextBlocks = blocks.map((block) => block.id === targetId ? { ...block, ...safeProps } : block);
    setBlocks(nextBlocks);
    setInlineBlockDrafts((prev) => {
      if (!prev[targetId]) return prev;
      const next = { ...prev };
      const draft = { ...next[targetId] };
      Object.keys(safeProps).forEach((key) => delete draft[key as keyof EmailBlock]);
      if (Object.keys(draft).length) next[targetId] = draft;
      else delete next[targetId];
      return next;
    });
    const shouldCoalesce = ['text', 'headerTitle', 'headerSubtitle', 'footerText', 'buttonLabel', 'couponCode', 'couponDiscount'].includes(String(Object.keys(safeProps)[0] || ''));
    pushToHistory(nextBlocks, shouldCoalesce ? { coalesce: true } : undefined);
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;
  const selectedBlockForPanel = selectedBlock
    ? { ...selectedBlock, ...(inlineBlockDrafts[selectedBlock.id] || {}) }
    : null;

  return (
    <>
      {toastMessage && <Toast message={toastMessage.message} kind={toastMessage.kind} onClose={() => setToastMessage(null)} />}
    <div className="flex flex-col pt-16 h-full w-full overflow-hidden bg-slate-100 font-sans">

      {/* Modern Fixed Top Bar */}
      <EditorTopBar
        subject={emailData.subject || 'E-mail sem assunto'}
        onSubjectChange={(newSubject) => setEmailData((prev) => ({ ...prev, subject: newSubject }))}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        previewDevice={previewDevice}
        setPreviewDevice={setPreviewDevice}
        lastSavedTime={lastSavedTime}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onNavigateToPreview={() => onNavigate('visualizacao', 'push')}
        onNavigateHome={() => onNavigate('inicio', 'none')}
        onSave={persistTemplate}
        onOpenTemplates={() => { setSavedTemplates(listSavedTemplates()); setIsTemplateManagerOpen(true); }}
        saveStatus={saveStatus}
      />

      {/* Main SaaS Workspace with 3 Distinct Panels */}
      <div className="flex-grow flex overflow-hidden w-full relative">
        {/* Panel A: Left Sidebar (Blocks, Layers & Templates) */}
        <aside className="w-72 lg:w-80 shrink-0 h-full overflow-hidden hidden md:flex flex-col z-10 shadow-xs">
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
            onSelectTemplate={handleSelectTemplate}
            activeTemplateId={emailData.activeTemplateId}
          />
        </aside>

        {/* Panel B: Center Canvas (The Email Document) */}
        <main className="flex-grow h-full overflow-hidden flex flex-col min-w-0">
          <PreviewCanvas
            compiledHtml={compiledHtml}
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            setSelectedBlockId={setSelectedBlockId}
            onInlineBlockEdit={handleInlineBlockEdit}
            onInlineBlockDraft={handleInlineBlockDraft}
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
            iframeHeight={iframeHeight}
            onExpand={() => onNavigate('visualizacao', 'push')}
            handleIframeLoad={handleIframeLoad}
            iframeRef={previewIframeRef}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onAddBlock={handleAddBlock}
            onOpenTemplates={() => {
              // Switches to templates view in sidebar
            }}
            onOpenBlockSelector={() => setIsMobileBlockSelectorOpen(true)}
          />
        </main>

        {/* Panel C: Right Sidebar (Properties Panel with Collapsible Accordion) */}
        <aside className="w-80 lg:w-88 shrink-0 h-full overflow-hidden hidden lg:flex flex-col z-10 shadow-xs">
          <PropertiesPanel
            selectedBlock={selectedBlockForPanel}
            updateSelectedBlock={updateSelectedBlock}
            applyFormattingToSelection={applyFormattingToSelection}
            insertVariableToSelectedBlock={insertVariableToSelectedBlock}
            activeSelection={activeSelection}
            hasRichTextSelection={hasRichTextSelection}
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
            handleDeleteBlock={handleDelete}
            onCloseSelection={() => setSelectedBlockId(null)}
            handleAddBlock={handleAddBlock}
            handleTextSelectOrChange={handleTextSelectOrChange}
            activeEditorRef={activeEditorRef}
            onRichTextSelectionChange={(selectedText) => {
              setHasRichTextSelection(Boolean(selectedText));
            }}
            imageFileInputRef={imageFileInputRef}
            handleImageBlockUpload={handleImageBlockUpload}
            handleNormalizeExistingImage={handleNormalizeExistingImage}
            handleUploadExistingImage={handleUploadExistingImage}
            isNormalizing={isNormalizing}
            emailData={emailData}
            setEmailData={setEmailData}
          />
        </aside>
      </div>

      <BlockSelectorModal
        isOpen={isMobileBlockSelectorOpen}
        onClose={() => setIsMobileBlockSelectorOpen(false)}
        onAddBlock={(type) => {
          handleAddBlock(type);
          setIsMobileBlockSelectorOpen(false);
        }}
      />

      {/* Export HTML Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        compiledHtml={transportHtml}
        subject={emailData.subject || ''}
        onShowToast={showToast}
      />

      {/* Import HTML Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportHtml={handleImportHtmlContent}
        onShowToast={showToast}
      />

      <TemplateManagerModal
        isOpen={isTemplateManagerOpen}
        templates={savedTemplates}
        onClose={() => setIsTemplateManagerOpen(false)}
        onLoad={handleLoadSavedTemplate}
        onDelete={handleDeleteSavedTemplate}
        onRestoreVersion={handleRestoreVersion}
      />
    </div>
    </>
  );
};
