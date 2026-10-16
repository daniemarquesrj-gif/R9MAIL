import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mesmo HTML que será exportado, para que o que se vê aqui seja o que se envia. */
  html: string;
  device: 'desktop' | 'mobile';
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, html, device }) => {

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Visualização do e-mail"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Visualização do e-mail</h2>
          <button type="button" onClick={onClose} aria-label="Fechar visualização" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 flex justify-center items-start">
          <div className={`w-full bg-white rounded-xl border border-slate-200 overflow-hidden ${device === 'mobile' ? 'max-w-[375px]' : 'max-w-[700px]'}`}>
            <iframe
              title="Visualização fiel do e-mail"
              srcDoc={html}
              sandbox=""
              className="w-full h-[620px] border-0 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
