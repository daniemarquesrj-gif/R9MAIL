import React from 'react';

interface PreviewCanvasProps {
  compiledHtml: string;
  previewDevice: 'desktop' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'mobile') => void;
  iframeHeight: number;
  onExpand: () => void;
  handleIframeLoad: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  compiledHtml,
  previewDevice,
  setPreviewDevice,
  iframeHeight,
  onExpand,
  handleIframeLoad,
  iframeRef,
}) => {
  return (
    <div className="lg:col-span-5 xl:col-span-6 lg:sticky lg:top-20 lg:self-start z-10 space-y-4">
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span>Visualização Real-time</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">AO VIVO</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">desktop_windows</span>
                <span>PC</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">smartphone</span>
                <span>Mobile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onExpand}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Ver em tela cheia / Exportar HTML"
            >
              <span className="material-symbols-outlined text-[15px]">open_in_full</span>
              <span className="hidden sm:inline">Expandir</span>
            </button>
          </div>
        </div>

        {/* Rendered Live Canvas Simulation Container (Fluid Height, No Internal Scrollbar) */}
        <div className="bg-slate-100/90 rounded-2xl p-3 sm:p-4 flex justify-center items-start">
          <div
            className={`transition-all duration-300 bg-white rounded-xl shadow-md overflow-hidden ${
              previewDevice === 'mobile' ? 'w-[340px]' : 'w-full max-w-[580px]'
            }`}
          >
            <iframe
              ref={iframeRef}
              onLoad={handleIframeLoad}
              title="Gerador PRO Live Preview Canvas"
              srcDoc={compiledHtml}
              scrolling="no"
              style={{ height: `${iframeHeight}px` }}
              className="w-full border-0 transition-[height] duration-200 block"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
