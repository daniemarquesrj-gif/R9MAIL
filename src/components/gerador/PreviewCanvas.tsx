import React, { useState, useEffect } from 'react';
import { EmailBlock, BlockType } from '../../types';
import {
  Monitor,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  X,
  Plus,
  Sparkles,
  LayoutTemplate,
} from 'lucide-react';

interface PreviewCanvasProps {
  compiledHtml: string;
  blocks: EmailBlock[];
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  onInlineBlockEdit: (blockId: string, field: keyof EmailBlock, value: string) => void;
  previewDevice: 'desktop' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'mobile') => void;
  iframeHeight: number;
  onExpand: () => void;
  handleIframeLoad: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (block: EmailBlock) => void;
  onDelete: (id: string) => void;
  onAddBlock: (type: BlockType) => void;
  onOpenTemplates: () => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  compiledHtml,
  blocks,
  selectedBlockId,
  setSelectedBlockId,
  onInlineBlockEdit,
  previewDevice,
  setPreviewDevice,
  iframeHeight,
  onExpand,
  handleIframeLoad,
  iframeRef,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddBlock,
  onOpenTemplates,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const selectedIndex = blocks.findIndex((b) => b.id === selectedBlockId);
  const selectedBlock = selectedIndex !== -1 ? blocks[selectedIndex] : null;

  // Enhance iframe with click detection and selected block highlighting
  const handleEnhancedIframeLoad = () => {
    handleIframeLoad();
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        if (!doc) return;

        // Injeta CSS para cursor e destaque no iframe
        const styleId = 'r9-editor-canvas-styles';
        let styleTag = doc.getElementById(styleId);
        if (!styleTag) {
          styleTag = doc.createElement('style');
          styleTag.id = styleId;
          styleTag.textContent = `
            [data-block-id] {
              cursor: pointer !important;
              transition: outline 0.15s ease, box-shadow 0.15s ease !important;
            }
            [data-block-id]:hover {
              outline: 2px dashed #818cf8 !important;
              outline-offset: -2px !important;
            }
            [data-block-id].r9-selected-block {
              outline: 2px solid #4f46e5 !important;
              outline-offset: -2px !important;
              box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2) !important;
            }
          `;
          doc.head.appendChild(styleTag);
        }

        // Listener de clique nos blocos
        doc.body.onclick = (e: MouseEvent) => {
          let target = e.target as HTMLElement | null;
          while (target && target !== doc.body) {
            const blockId = target.getAttribute('data-block-id');
            if (blockId) {
              e.preventDefault();
              e.stopPropagation();
              setSelectedBlockId(blockId);
              return;
            }
            target = target.parentElement;
          }
        };

        // Edição rápida diretamente no preview. O usuário dá duplo clique em
        // conteúdos suportados; salvamos apenas no blur para não gerar dezenas
        // de estados de undo durante a digitação.
        doc.querySelectorAll<HTMLElement>('[data-inline-edit]').forEach((el) => {
          el.ondblclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            const blockId = el.closest('[data-block-id]')?.getAttribute('data-block-id');
            const field = el.getAttribute('data-inline-edit') as keyof EmailBlock | null;
            if (!blockId || !field) return;
            el.contentEditable = 'true';
            el.dataset.r9Editing = 'true';
            el.focus();
          };
          el.onblur = () => {
            if (el.dataset.r9Editing !== 'true') return;
            const blockId = el.closest('[data-block-id]')?.getAttribute('data-block-id');
            const field = el.getAttribute('data-inline-edit') as keyof EmailBlock | null;
            if (!blockId || !field) return;
            const value = field === 'text' ? el.innerHTML : el.textContent || '';
            el.contentEditable = 'false';
            delete el.dataset.r9Editing;
            onInlineBlockEdit(blockId, field, value);
          };
          el.title = 'Duplo clique para editar';
        });

        // Aplica classe de selecionado
        highlightSelectedBlockInIframe(selectedBlockId);
      }
    } catch (e) {
      // Cross-origin safe guard
    }
  };

  const highlightSelectedBlockInIframe = (blockId: string | null) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        if (!doc) return;

        doc.querySelectorAll('.r9-selected-block').forEach((el) => {
          el.classList.remove('r9-selected-block');
        });

        if (blockId) {
          const selectedEl = doc.querySelector(`[data-block-id="${blockId}"]`);
          if (selectedEl) {
            selectedEl.classList.add('r9-selected-block');
          }
        }
      }
    } catch (e) {
      // Cross-origin safe guard
    }
  };

  useEffect(() => {
    highlightSelectedBlockInIframe(selectedBlockId);
  }, [selectedBlockId, compiledHtml]);

  // Handle drop from sidebar
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data && data.startsWith('block:')) {
      const blockType = data.replace('block:', '') as BlockType;
      onAddBlock(blockType);
    }
  };

  return (
    <div className="flex-grow h-full flex flex-col bg-slate-100/75 select-none relative overflow-hidden">
      {/* Canvas Top Controls Toolbar */}
      <div className="h-11 px-4 border-b border-slate-200/90 bg-white/95 backdrop-blur-xs flex items-center justify-between gap-2 z-20 shrink-0">
        {/* Device View Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                previewDevice === 'desktop'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop (600px)</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                previewDevice === 'mobile'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (375px)</span>
            </button>
          </div>
        </div>

        {/* Zoom & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 60))}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              onClick={() => setZoomLevel(100)}
              className="px-2 cursor-pointer hover:text-indigo-600 font-mono text-[11px]"
              title="Resetar para 100%"
            >
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onExpand}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="Expandir Visualização em Tela Cheia"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Action Toolbar for the Selected Block */}
      {selectedBlock && selectedIndex !== -1 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white rounded-xl shadow-xl px-3 py-1.5 flex items-center gap-2 text-xs border border-slate-700 animate-slideDown">
          <span className="font-semibold text-slate-300 pr-1 border-r border-slate-700">
            Bloco: {selectedBlock.type}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={selectedIndex === 0}
              onClick={() => onMoveUp(selectedIndex)}
              className="p-1 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-slate-300 hover:text-white transition-colors"
              title="Mover para cima"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={selectedIndex === blocks.length - 1}
              onClick={() => onMoveDown(selectedIndex)}
              className="p-1 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-slate-300 hover:text-white transition-colors"
              title="Mover para baixo"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDuplicate(selectedBlock)}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="Duplicar bloco"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(selectedBlock.id)}
              className="p-1 hover:bg-rose-900/60 rounded text-rose-300 hover:text-rose-100 transition-colors"
              title="Excluir bloco"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedBlockId(null)}
            className="p-1 text-slate-400 hover:text-white rounded ml-1"
            title="Desmarcar bloco"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Canvas Workspace Area with Scroll */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDropOnCanvas}
        className={`flex-grow overflow-y-auto p-4 sm:p-8 flex justify-center items-start transition-colors ${
          isDragOver ? 'bg-indigo-50/50 ring-4 ring-indigo-400/20 ring-inset' : ''
        }`}
      >
        {blocks.length === 0 ? (
          /* Empty State */
          <div className="my-auto max-w-md w-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Seu e-mail está em branco
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Adicione blocos pela barra lateral à esquerda ou comece com um modelo profissional pronto.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onAddBlock('header_text')}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar Banner</span>
              </button>

              <button
                type="button"
                onClick={onOpenTemplates}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Escolher Modelo</span>
              </button>
            </div>
          </div>
        ) : (
          /* The Email Document Container (Simulating real paper/email client) */
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
            className={`transition-all duration-300 bg-white rounded-xl shadow-2xl shadow-slate-900/10 border border-slate-200/90 overflow-hidden relative ${
              previewDevice === 'mobile' ? 'w-[375px]' : 'w-[600px]'
            }`}
          >
            <iframe
              ref={iframeRef}
              onLoad={handleEnhancedIframeLoad}
              title="R9Bot Mailer Live Canvas Preview"
              srcDoc={compiledHtml}
              scrolling="no"
              style={{ height: `${iframeHeight}px` }}
              className="w-full border-0 block transition-[height] duration-200"
            />
          </div>
        )}
      </div>
    </div>
  );
};
