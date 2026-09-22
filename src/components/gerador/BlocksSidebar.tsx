import React, { useState } from 'react';
import { EmailBlock, BlockType, EmailTemplate } from '../../types';
import { DEFAULT_TEMPLATES } from '../../data/templates';
import { BlockSelectorModal } from './BlockSelectorModal';
import {
  PlusCircle,
  Layers,
  Sparkles,
  Heading,
  Type,
  AlignLeft,
  Image as ImageIcon,
  MousePointerClick,
  Ticket,
  Minus,
  Share2,
  PanelBottom,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Search,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface BlocksSidebarProps {
  blocks: EmailBlock[];
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string) => void;
  onAddBlock: (type: BlockType, insertAfterIndex?: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (block: EmailBlock) => void;
  onDelete: (id: string) => void;
  onSelectTemplate: (template: EmailTemplate) => void;
  activeTemplateId?: string;
}

interface BlockDefinition {
  type: BlockType;
  name: string;
  description: string;
  category: 'text' | 'media' | 'cta' | 'structure';
  icon: React.ReactNode;
  badgeColor: string;
}

const AVAILABLE_BLOCKS: BlockDefinition[] = [
  {
    type: 'header_text',
    name: 'Cabeçalho / Banner',
    description: 'Faixa colorida com título e subtítulo',
    category: 'structure',
    icon: <Heading className="w-4 h-4 text-blue-600" />,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    type: 'title',
    name: 'Título Principal',
    description: 'Texto de destaque para seções e novidades',
    category: 'text',
    icon: <Heading className="w-4 h-4 text-indigo-600" />,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    type: 'subtitle',
    name: 'Subtítulo',
    description: 'Complemento de apoio ao título',
    category: 'text',
    icon: <Type className="w-4 h-4 text-purple-600" />,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    type: 'text',
    name: 'Parágrafo / Texto',
    description: 'Corpo da mensagem e conteúdo principal',
    category: 'text',
    icon: <AlignLeft className="w-4 h-4 text-slate-600" />,
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  {
    type: 'image',
    name: 'Imagem / Banner',
    description: 'Foto do produto, hero banner ou anúncio',
    category: 'media',
    icon: <ImageIcon className="w-4 h-4 text-emerald-600" />,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    type: 'button',
    name: 'Botão CTA',
    description: 'Botão de clique para ação e links externos',
    category: 'cta',
    icon: <MousePointerClick className="w-4 h-4 text-amber-600" />,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    type: 'coupon',
    name: 'Cupom de Desconto',
    description: 'Caixa de oferta com código promocional',
    category: 'cta',
    icon: <Ticket className="w-4 h-4 text-rose-600" />,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    type: 'divider',
    name: 'Linha Divisória',
    description: 'Separação visual entre blocos de conteúdo',
    category: 'structure',
    icon: <Minus className="w-4 h-4 text-slate-500" />,
    badgeColor: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  {
    type: 'social',
    name: 'Redes Sociais',
    description: 'Links para Instagram, WhatsApp, LinkedIn',
    category: 'structure',
    icon: <Share2 className="w-4 h-4 text-sky-600" />,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    type: 'footer',
    name: 'Rodapé Legal',
    description: 'Assinatura, copyright e links de descadastro',
    category: 'structure',
    icon: <PanelBottom className="w-4 h-4 text-slate-600" />,
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
  },
];

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
  onSelectTemplate,
  activeTemplateId,
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'templates'>('layers');
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [templateConfirm, setTemplateConfirm] = useState<EmailTemplate | null>(null);

  // Drag and drop state for layers list
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Helper to extract preview text for a block in the layers list
  const getBlockSummary = (block: EmailBlock) => {
    switch (block.type) {
      case 'header_text':
      case 'header':
        return block.headerTitle?.split('\n')[0] || 'Cabeçalho';
      case 'title':
        return block.text || 'Título sem texto';
      case 'subtitle':
        return block.text || 'Subtítulo';
      case 'text':
        return block.text?.replace(/<[^>]*>?/gm, '').substring(0, 30) || 'Texto do parágrafo';
      case 'button':
        return block.buttonLabel || 'Botão CTA';
      case 'image':
        return block.imageAlt || 'Banner / Imagem';
      case 'coupon':
        return block.couponCode ? `Cupom: ${block.couponCode}` : 'Cupom de oferta';
      case 'divider':
        return 'Linha divisória';
      case 'social':
        return 'Ícones de Redes Sociais';
      case 'footer':
        return 'Rodapé do e-mail';
      default:
        return block.type;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200/90 select-none relative">
      {/* Floating Add Block Modal/Popover */}
      <BlockSelectorModal
        isOpen={isAddBlockModalOpen}
        onClose={() => setIsAddBlockModalOpen(false)}
        onAddBlock={(type) => {
          onAddBlock(type);
          setIsAddBlockModalOpen(false);
        }}
      />

      {/* Sidebar Navigation Tabs */}
      <div className="p-2 border-b border-slate-200/80 bg-slate-50/70 shrink-0">
        <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('layers')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'layers'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1">
              <span>Camadas</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                {blocks.length}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modelos</span>
          </button>
        </div>
      </div>

      {/* Tab: Layers / Structure */}
      {activeTab === 'layers' && (
        <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
          {/* Prominent Action Button to Open Floating Block Menu */}
          <div className="p-3 border-b border-slate-200/80 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setIsAddBlockModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar Bloco</span>
            </button>
          </div>

          {/* Subheader: Order & Count matching user screenshot */}
          <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="font-semibold text-slate-700">Ordem dos Blocos ({blocks.length})</span>
            <span className="text-[11px] text-slate-400">Arraste para reordenar</span>
          </div>

          <div className="flex-grow overflow-y-auto p-3 space-y-2 min-h-0">
            {blocks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl space-y-3">
                <Layers className="w-8 h-8 mx-auto text-slate-300" />
                <div>
                  <p className="font-bold text-slate-700">Nenhum bloco no e-mail</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Comece adicionando o primeiro bloco</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddBlockModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Adicionar primeiro bloco</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {blocks.map((block, idx) => {
                  const isSelected = block.id === selectedBlockId;
                  const isBeingDragged = draggedIdx === idx;
                  const isTargeted = dragOverIdx === idx && draggedIdx !== idx;
                  const def = AVAILABLE_BLOCKS.find((b) => b.type === block.type);

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
                      className={`group p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                        isBeingDragged
                          ? 'opacity-40 border-dashed border-indigo-500 bg-indigo-50/50'
                          : isTargeted
                          ? 'bg-indigo-100/90 border-indigo-600 ring-2 ring-indigo-500/40 shadow-xs'
                          : isSelected
                          ? 'bg-indigo-50/90 border-indigo-500 ring-1 ring-indigo-500/30 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90'
                      }`}
                    >
                      {/* Drag Handle & Icon */}
                      <div className="flex items-center gap-2 min-w-0 flex-grow">
                        <div className="text-slate-400 group-hover:text-slate-600 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                          {def?.icon || <Layers className="w-3 h-3 text-slate-500" />}
                        </div>

                        <div className="min-w-0 flex-grow">
                          <p className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                            {def?.name || block.type}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {getBlockSummary(block)}
                          </p>
                        </div>
                      </div>

                      {/* Quick Layer Controls on Hover / Selected */}
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveUp(idx);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                          title="Mover para cima"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === blocks.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveDown(idx);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                          title="Mover para baixo"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate(block);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          title="Duplicar bloco"
                        >
                          <Copy className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(block.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Excluir bloco"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Pre-built Templates */}
      {activeTab === 'templates' && (
        <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
          <div className="px-3 py-2.5 bg-slate-50/80 border-b border-slate-200/80 text-xs text-slate-500 shrink-0">
            <span className="font-semibold text-slate-700">Modelos Prontos</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Escolha um modelo pronto para acelerar a sua criação:
            </p>
          </div>

          <div className="flex-grow overflow-y-auto p-3 space-y-3 min-h-0">

          <div className="space-y-3">
            {DEFAULT_TEMPLATES.map((tmpl) => {
              const isCurrent = tmpl.id === activeTemplateId;

              return (
                <div
                  key={tmpl.id}
                  onClick={() => setTemplateConfirm(tmpl)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden group ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">
                      {tmpl.name}
                    </span>
                    {tmpl.badge && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                        {tmpl.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                    {tmpl.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-300"
                        style={{ backgroundColor: tmpl.primaryColor }}
                      />
                      <span className="text-slate-400 font-mono">
                        {tmpl.primaryColor}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-indigo-600 group-hover:underline flex items-center gap-1">
                      {isCurrent ? 'Modelo Atual' : 'Carregar'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Template Confirmation Dialog */}
      {templateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-800">Carregar Modelo?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja carregar o modelo <strong>"{templateConfirm.name}"</strong>? O conteúdo atual será substituído pelos blocos deste modelo.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTemplateConfirm(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectTemplate(templateConfirm);
                  setTemplateConfirm(null);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Sim, carregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
