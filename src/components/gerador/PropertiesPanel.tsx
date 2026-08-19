import React from 'react';
import { EmailBlock, BlockType } from '../../types';
import { RichTextEditor } from '../RichTextEditor';
import { FormattingToolbar } from './FormattingToolbar';

interface PropertiesPanelProps {
  selectedBlock: EmailBlock | null;
  updateSelectedBlock: (updatedProps: Partial<EmailBlock>) => void;
  applyFormattingToSelection: (
    formatType: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'color' | 'fontSize' | 'clear' | 'variable' | 'link' | 'unlink',
    formatValue?: string | number,
    colorTargetKey?: 'textColor' | 'headerTextColor' | 'buttonTextColor' | 'footerTextColor'
  ) => void;
  insertVariableToSelectedBlock: (varName: string) => void;
  activeSelection: {
    fieldName: string;
    start: number;
    end: number;
    selectedText: string;
  } | null;
  linkModalOpen: boolean;
  setLinkModalOpen: (open: boolean) => void;
  linkText: string;
  setLinkText: (text: string) => void;
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  onSaveLink: () => void;
  onRemoveLink: () => void;
  handleOpenLinkModal: () => void;
  handleDuplicate: (block: EmailBlock) => void;
  handleAddBlock: (type: BlockType) => void;
  handleTextSelectOrChange: (e: any, fieldName: string) => void;
  activeEditorRef: React.RefObject<any>;
  imageFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageBlockUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNormalizeExistingImage: () => void;
  handleUploadExistingToPublicHost: () => void;
  isNormalizing: boolean;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedBlock,
  updateSelectedBlock,
  applyFormattingToSelection,
  insertVariableToSelectedBlock,
  activeSelection,
  linkModalOpen,
  setLinkModalOpen,
  linkText,
  setLinkText,
  linkUrl,
  setLinkUrl,
  onSaveLink,
  onRemoveLink,
  handleOpenLinkModal,
  handleDuplicate,
  handleAddBlock,
  handleTextSelectOrChange,
  activeEditorRef,
  imageFileInputRef,
  handleImageBlockUpload,
  handleNormalizeExistingImage,
  handleUploadExistingToPublicHost,
  isNormalizing,
}) => {
  if (!selectedBlock) {
    return (
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
    );
  }

  const getBlockName = (type: BlockType) => {
    const labels: Record<BlockType, string> = {
      header_text: 'Texto do Cabeçalho / Banner',
      header: 'Cabeçalho Simples',
      header_image: 'Imagem do Cabeçalho',
      title: 'Título',
      subtitle: 'Subtítulo',
      text: 'Texto / Parágrafo',
      button: 'Botão CTA',
      image: 'Banner / Imagem',
      coupon: 'Cupom de Desconto',
      divider: 'Divisor',
      social: 'Redes Sociais',
      footer: 'Rodapé',
    };
    return labels[type] || type;
  };

  const renderToolbar = (options?: any) => (
    <FormattingToolbar
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
      onSaveLink={onSaveLink}
      onRemoveLink={onRemoveLink}
      handleOpenLinkModal={handleOpenLinkModal}
      options={options}
    />
  );

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 md:p-6 space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3">
        <h2 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-2">
          <span className="bg-indigo-600 text-white w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold">2</span>
          <span>Editando Bloco: {getBlockName(selectedBlock.type)}</span>
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
                        className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform shadow-2xs cursor-pointer"
                        style={{ backgroundColor: hex }}
                        title={`Cor: ${hex}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {renderToolbar({
            defaultColorKey: 'headerTextColor',
            defaultBgKey: 'headerBgColor',
          })}
        </div>
      )}

      {/* HEADER IMAGE FORM */}
      {selectedBlock.type === 'header_image' && (
        <div className="space-y-4">
          <input
            type="file"
            ref={imageFileInputRef}
            onChange={handleImageBlockUpload}
            accept="image/*"
            className="hidden"
          />

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
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
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
          {renderToolbar()}
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
          {renderToolbar()}
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
          {renderToolbar()}
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
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white cursor-pointer"
              >
                <option value="auto">Arredondado Centralizado (Padrão CTA)</option>
                <option value="full">100% da Largura (Preencher Bloco Inteiro)</option>
              </select>
            </div>
          </div>

          {renderToolbar({
            defaultColorKey: 'buttonTextColor',
            defaultBgKey: 'buttonBgColor',
            showBgColor: true,
          })}
        </div>
      )}

      {/* IMAGE FORM */}
      {selectedBlock.type === 'image' && (
        <div className="space-y-4">
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

            {/* Base64 Gmail Explanation */}
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
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
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
                Ou cole a URL direta da imagem (HTTPS):
              </label>
              <input
                type="text"
                value={selectedBlock.imageUrl || ''}
                onChange={(e) => updateSelectedBlock({ imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link ao Clicar na Imagem (URL)</label>
              <input
                type="text"
                value={selectedBlock.imageLink || ''}
                onChange={(e) => updateSelectedBlock({ imageLink: e.target.value })}
                placeholder="https://..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Texto Alternativo (Alt Text)</label>
              <input
                type="text"
                value={selectedBlock.imageAlt || ''}
                onChange={(e) => updateSelectedBlock({ imageAlt: e.target.value })}
                placeholder="Ex: Imagem descritiva"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* COUPON FORM */}
      {selectedBlock.type === 'coupon' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título do Cupom</label>
              <input
                type="text"
                value={selectedBlock.couponTitle || ''}
                onChange={(e) => updateSelectedBlock({ couponTitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código do Cupom</label>
              <input
                type="text"
                value={selectedBlock.couponCode || ''}
                onChange={(e) => updateSelectedBlock({ couponCode: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Texto de Validade</label>
              <input
                type="text"
                value={selectedBlock.couponExpiry || ''}
                onChange={(e) => updateSelectedBlock({ couponExpiry: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
          {renderToolbar()}
        </div>
      )}

      {/* DIVIDER FORM */}
      {selectedBlock.type === 'divider' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estilo da Linha</label>
              <select
                value={selectedBlock.dividerStyle || 'solid'}
                onChange={(e) => updateSelectedBlock({ dividerStyle: e.target.value as any })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white cursor-pointer"
              >
                <option value="solid">Sólida (Linha Contínua)</option>
                <option value="dashed">Tracejada (Dashed)</option>
                <option value="dotted">Pontilhada (Dotted)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Espessura (px)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={selectedBlock.dividerHeight || 1}
                onChange={(e) => updateSelectedBlock({ dividerHeight: Number(e.target.value) })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cor da Linha</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedBlock.dividerColor || '#cbd5e1'}
                  onChange={(e) => updateSelectedBlock({ dividerColor: e.target.value })}
                  className="w-10 h-8 p-0.5 border border-slate-300 rounded-lg cursor-pointer bg-white"
                />
                <span className="text-xs font-mono">{selectedBlock.dividerColor || '#cbd5e1'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL FORM */}
      {selectedBlock.type === 'social' && (
        <div className="space-y-4">
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
            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp URL / Link</label>
            <input
              type="text"
              value={selectedBlock.whatsappUrl || ''}
              onChange={(e) => updateSelectedBlock({ whatsappUrl: e.target.value })}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              placeholder="https://wa.me/55..."
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
          {renderToolbar({
            defaultColorKey: 'footerTextColor',
            defaultBgKey: 'footerBgColor',
          })}
        </div>
      )}
    </div>
  );
};
