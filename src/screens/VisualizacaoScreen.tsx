import React, { useState } from 'react';
import { EmailData, Screen, TransitionType } from '../types';
import { generateEmailHtml } from '../utils/htmlGenerator';

interface VisualizacaoScreenProps {
  emailData: EmailData;
  setEmailData: React.Dispatch<React.SetStateAction<EmailData>>;
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
}

export const VisualizacaoScreen: React.FC<VisualizacaoScreenProps> = ({
  emailData,
  setEmailData,
  onNavigate,
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [readingMode, setReadingMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExportHtml = () => {
    const htmlString = emailData.customCodeHtml || generateEmailHtml(emailData);
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-template-${emailData.activeTemplateId || 'custom'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToastMessage('✓ Arquivo HTML exportado e baixado com sucesso!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className={`flex-grow flex flex-col pt-16 pb-20 w-full min-h-[calc(100vh-64px)] transition-colors relative ${
      readingMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-emerald-600 text-white font-semibold px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Canvas Toolbar */}
      <div className={`flex flex-wrap justify-between sm:justify-end items-center px-4 md:px-6 py-2.5 gap-3 border-b backdrop-blur-md sticky top-16 z-30 ${
        readingMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-md p-1 border border-slate-200/80">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded flex items-center justify-center transition-all ${
              device === 'desktop'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Visualização Desktop"
          >
            <span className="material-symbols-outlined text-[20px]">desktop_windows</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded flex items-center justify-center transition-all ${
              device === 'mobile'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Visualização Smartphone"
          >
            <span className="material-symbols-outlined text-[20px]">smartphone</span>
          </button>
        </div>

        <button
          onClick={() => setReadingMode(!readingMode)}
          className={`flex items-center gap-1.5 border px-3.5 py-1.5 rounded-md font-semibold text-xs transition-colors ${
            readingMode
              ? 'bg-slate-700 border-slate-600 text-amber-400 hover:bg-slate-600'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          <span>{readingMode ? 'MODO NORMAL' : 'MODO LEITURA'}</span>
        </button>

        <button
          onClick={handleExportHtml}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md font-bold text-xs transition-all shadow-xs active:scale-95"
          title="Exportar código HTML"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>EXPORTAR HTML</span>
        </button>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start custom-scroll my-4">
        <div
          className={`transition-device w-full bg-white rounded-xl shadow-xs border overflow-hidden min-h-[620px] flex flex-col ${
            device === 'mobile' ? 'max-w-[375px]' : 'max-w-[700px]'
          } ${readingMode ? 'border-slate-700 shadow-2xl' : 'border-slate-200'}`}
        >
          <iframe
            title="Visualização Fiel do E-mail"
            srcDoc={emailData.customCodeHtml || generateEmailHtml(emailData)}
            className="w-full h-[620px] min-h-[580px] border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
