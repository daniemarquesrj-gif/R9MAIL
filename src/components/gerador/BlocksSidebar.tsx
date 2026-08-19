import React from 'react';
import { EmailBlock, BlockType } from '../../types';
import { BlockSelectorModal } from './BlockSelectorModal';

interface BlocksSidebarProps {
  blocks: EmailBlock[];
  selectedBlockId: string;
  setSelectedBlockId: (id: string) => void;
  onAddBlock: (type: BlockType) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (block: EmailBlock) => void;
  onDelete: (id: string) => void;
  draggedIdx: number | null;
  setDraggedIdx: (idx: number | null) => void;
  dragOverIdx: number | null;
  setDragOverIdx: (idx: number | null) => void;
  isAddBlockMenuOpen: boolean;
  setIsAddBlockMenuOpen: (open: boolean) => void;
  openCardMenuId: string | null;
  setOpenCardMenuId: (id: string | null) => void;
}

export const BlocksSidebar: React.FC<BlocksSidebarProps> = ({
  blocks,
  selectedBlockId,
  setSelectedBlockId,
  onAddBlock,
  onReorder,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  draggedIdx,
  setDraggedIdx,
  dragOverIdx,
  setDragOverIdx,
  isAddBlockMenuOpen,
  setIsAddBlockMenuOpen,
  openCardMenuId,
  setOpenCardMenuId,
}) => {
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

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-600 text-white w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold">1</span>
          <h2 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">
            Estrutura dos Blocos ({blocks.length})
          </h2>
        </div>

        {/* Unified "+ Adicionar Bloco" Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAddBlockMenuOpen(!isAddBlockMenuOpen)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Adicionar Bloco</span>
            <span className="material-symbols-outlined text-[16px]">
              {isAddBlockMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          <BlockSelectorModal
            isOpen={isAddBlockMenuOpen}
            onClose={() => setIsAddBlockMenuOpen(false)}
            onAddBlock={onAddBlock}
          />
        </div>
      </div>

      {/* Active Structure Blocks List with Drag & Drop */}
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
                  onReorder(draggedIdx, idx);
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
                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <span className="material-symbols-outlined text-[16px] block">{icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 truncate">{name}</span>
                    <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-[170px] sm:max-w-[220px]">
                    {block.type === 'header_text' && (block.headerTitle || 'Cabeçalho')}
                    {block.type === 'title' && (block.text || 'Título')}
                    {block.type === 'subtitle' && (block.text || 'Subtítulo')}
                    {block.type === 'text' && (block.text || 'Texto')}
                    {block.type === 'button' && `Botão: ${block.buttonLabel || 'CTA'}`}
                    {block.type === 'image' && 'Imagem / Banner'}
                    {block.type === 'header_image' && 'Imagem do Cabeçalho'}
                    {block.type === 'coupon' && `Cupom: ${block.couponCode || ''}`}
                    {block.type === 'divider' && 'Linha divisória'}
                    {block.type === 'social' && 'Links Sociais'}
                    {block.type === 'footer' && 'Rodapé'}
                  </p>
                </div>
              </div>

              {/* Actions & 3-Dots Menu */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMoveUp(idx)}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="Mover para cima"
                >
                  <span className="material-symbols-outlined text-[16px] block">arrow_upward</span>
                </button>
                <button
                  type="button"
                  disabled={idx === blocks.length - 1}
                  onClick={() => onMoveDown(idx)}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="Mover para baixo"
                >
                  <span className="material-symbols-outlined text-[16px] block">arrow_downward</span>
                </button>

                {/* 3-Dots Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenCardMenuId(isMenuOpen ? null : block.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                    title="Mais opções"
                  >
                    <span className="material-symbols-outlined text-[18px] block">more_vert</span>
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setOpenCardMenuId(null)} />
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1 space-y-0.5 animate-fadeIn">
                        <button
                          type="button"
                          onClick={() => {
                            onDuplicate(block);
                            setOpenCardMenuId(null);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          <span>Duplicar</span>
                        </button>
                        <button
                          type="button"
                          disabled={blocks.length <= 1}
                          onClick={() => {
                            onDelete(block.id);
                            setOpenCardMenuId(null);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Excluir</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
