import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Code2,
  Eye,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  compiledHtml: string;
  subject?: string;
  onShowToast: (message: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  compiledHtml,
  subject = 'newsletter',
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(compiledHtml);
      setCopied(true);
      onShowToast('Código HTML copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = compiledHtml;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      onShowToast('Código HTML copiado!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadFile = () => {
    try {
      const sanitizedName = (subject || 'email-newsletter')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-');
      const blob = new Blob([compiledHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizedName || 'email'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onShowToast('Arquivo .html baixado com sucesso!');
    } catch (err) {
      onShowToast('Erro ao baixar o arquivo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Exportar E-mail HTML</h2>
              <p className="text-xs text-slate-500">
                Código sanitizado, responsivo e estruturado para maior compatibilidade com clientes de e-mail.
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

        {/* Modal Tab Switcher & Quick Actions */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 bg-white">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Código HTML</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pré-visualização</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                copied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar .html</span>
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-grow bg-slate-50/50">
          {activeTab === 'code' ? (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  readOnly
                  value={compiledHtml}
                  rows={14}
                  className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 focus:outline-none resize-none selection:bg-indigo-500 selection:text-white"
                />
              </div>

              {/* Compatibility Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Compatível com Gmail & Apple Mail</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Compatível com Outlook & Yahoo</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Estrutura em tabelas + CSS defensivo</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-center items-center">
              <iframe
                title="Export Preview"
                srcDoc={compiledHtml}
                className="w-full max-w-[580px] h-[400px] border-0 rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
