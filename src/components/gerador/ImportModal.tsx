import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileCode,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportHtml: (rawHtml: string) => void;
  onShowToast: (message: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportHtml,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedCode, setPastedCode] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [loadedFileContent, setLoadedFileContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm') && file.type !== 'text/html') {
      onShowToast('Por favor, selecione um arquivo válido .html ou .htm');
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setLoadedFileContent(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    const htmlToImport = activeTab === 'upload' ? loadedFileContent : pastedCode;
    if (!htmlToImport || !htmlToImport.trim()) {
      onShowToast('Nenhum código ou arquivo HTML selecionado para importação.');
      return;
    }

    onImportHtml(htmlToImport);
    onShowToast('HTML importado com sucesso para o editor!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Importar HTML</h2>
              <p className="text-xs text-slate-500">
                Carregue um arquivo existente ou cole o código para converter em blocos editáveis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-1 border-b border-slate-100 flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Upload de Arquivo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Colar Código HTML</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-grow">
          {activeTab === 'upload' ? (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".html,.htm,text/html"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : selectedFileName
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                {selectedFileName ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">{selectedFileName}</p>
                    <p className="text-xs text-slate-500">
                      Arquivo pronto para ser importado. Clique para escolher outro.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">
                      Arraste e solte o arquivo .html aqui
                    </p>
                    <p className="text-xs text-slate-400">
                      ou clique para selecionar do seu computador
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Cole o código HTML completo:
              </label>
              <textarea
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                placeholder="<!DOCTYPE html><html><body>..."
                rows={10}
                className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Ao importar um novo HTML, os blocos atuais serão substituídos pela estrutura identificada no código.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={activeTab === 'upload' ? !loadedFileContent : !pastedCode.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Importar para o Editor
          </button>
        </div>
      </div>
    </div>
  );
};
