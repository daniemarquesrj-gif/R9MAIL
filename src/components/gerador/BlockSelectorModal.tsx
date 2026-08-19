import React from 'react';
import { BlockType } from '../../types';

interface BlockSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (type: BlockType) => void;
}

export const BlockSelectorModal: React.FC<BlockSelectorModalProps> = ({
  isOpen,
  onClose,
  onAddBlock,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 p-2 space-y-2 divide-y divide-slate-100 max-h-96 overflow-y-auto animate-fadeIn">
        {/* Category: Cabeçalho & Banners */}
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider px-2.5 py-1 block">
            Cabeçalho & Banners
          </span>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { onAddBlock('header_text'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">web_asset</span>
              <span>Texto do Cabeçalho</span>
            </button>
            <button
              type="button"
              onClick={() => { onAddBlock('header_image'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">view_day</span>
              <span>Imagem do Cabeçalho</span>
            </button>
            <button
              type="button"
              onClick={() => { onAddBlock('header'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">web_asset</span>
              <span>Cabeçalho Simples</span>
            </button>
          </div>
        </div>

        {/* Category: Conteúdo do E-mail */}
        <div className="pt-2">
          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider px-2.5 py-1 block">
            Conteúdo do E-mail
          </span>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { onAddBlock('title'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">title</span>
              <span>Título</span>
            </button>
            <button
              type="button"
              onClick={() => { onAddBlock('subtitle'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">format_size</span>
              <span>Subtítulo</span>
            </button>
            <button
              type="button"
              onClick={() => { onAddBlock('text'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">notes</span>
              <span>Texto / Parágrafo</span>
            </button>
            <button
              type="button"
              onClick={() => { onAddBlock('button'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">smart_button</span>
              <span>Botão CTA</span>
            </button>
            <button
              type="button"
              onClick={() => { onAddBlock('image'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">image</span>
              <span>Banner / Imagem</span>
            </button>
            <button
              type="button"
              onClick={() => { onAddBlock('coupon'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">local_offer</span>
              <span>Cupom de Desconto</span>
            </button>
            <button
              type="button"
              onClick={() => { onAddBlock('divider'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">horizontal_rule</span>
              <span>Divisor</span>
            </button>
          </div>
        </div>

        {/* Category: Rodapé & Redes */}
        <div className="pt-2">
          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider px-2.5 py-1 block">
            Rodapé & Redes
          </span>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { onAddBlock('social'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">share</span>
              <span>Redes Sociais</span>
            </button>
            <button
              type="button"
              onClick={() => { onAddBlock('footer'); onClose(); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">call_to_action</span>
              <span>Rodapé</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
