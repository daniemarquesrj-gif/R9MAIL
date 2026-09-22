import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Monitor,
  Smartphone,
  UploadCloud,
  Eye,
  Download,
  Check,
  Edit2,
  Sparkles,
  ArrowLeft,
  Save,
  FolderOpen,
} from 'lucide-react';

interface EditorTopBarProps {
  subject: string;
  onSubjectChange: (newSubject: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  previewDevice: 'desktop' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'mobile') => void;
  lastSavedTime: string;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  onNavigateToPreview: () => void;
  onNavigateHome: () => void;
  onSave: () => void;
  onOpenTemplates: () => void;
  saveStatus: 'saved' | 'saving' | 'dirty' | 'error';
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  subject,
  onSubjectChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  previewDevice,
  setPreviewDevice,
  lastSavedTime,
  onOpenImportModal,
  onOpenExportModal,
  onNavigateToPreview,
  onNavigateHome,
  onSave,
  onOpenTemplates,
  saveStatus,
}) => {
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [tempSubject, setTempSubject] = useState(subject);

  const handleSaveSubject = () => {
    setIsEditingSubject(false);
    if (tempSubject.trim()) {
      onSubjectChange(tempSubject.trim());
    } else {
      setTempSubject(subject);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveSubject();
    } else if (e.key === 'Escape') {
      setTempSubject(subject);
      setIsEditingSubject(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-3 md:px-5 flex items-center justify-between gap-2 z-30 select-none shrink-0 shadow-2xs">
      {/* Left: Branding, Home navigation & Email Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onNavigateHome}
          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Voltar ao início"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pr-2 border-r border-slate-200 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            R9
          </div>
          <span className="font-bold text-slate-800 text-sm hidden sm:inline tracking-tight">
            R9Bot <span className="text-slate-400 font-normal">Mailer</span>
          </span>
        </div>

        {/* Editable Subject / Campaign Title */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-[200px] sm:max-w-[280px] md:max-w-xs">
          {isEditingSubject ? (
            <input
              type="text"
              autoFocus
              value={tempSubject}
              onChange={(e) => setTempSubject(e.target.value)}
              onBlur={handleSaveSubject}
              onKeyDown={handleKeyDown}
              className="px-2 py-0.5 text-xs font-semibold text-slate-800 border border-indigo-400 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
              placeholder="Assunto do e-mail..."
            />
          ) : (
            <div
              onClick={() => {
                setTempSubject(subject);
                setIsEditingSubject(true);
              }}
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer group min-w-0"
              title="Clique para editar o assunto/título do e-mail"
            >
              <span className="text-xs font-semibold text-slate-700 truncate group-hover:text-slate-900">
                {subject || 'E-mail sem assunto'}
              </span>
              <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        {/* Persistence status */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-medium pl-1">
          <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : saveStatus === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
          <span className={saveStatus === 'error' ? 'text-red-500' : 'text-slate-400'}>
            {saveStatus === 'saved' ? `Salvo ${lastSavedTime}` : saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'error' ? 'Falha ao salvar' : 'Alterações não salvas'}
          </span>
        </div>
      </div>

      {/* Center: Undo / Redo & Device Selector */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100/80 rounded-lg p-0.5 border border-slate-200/80">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className={`p-1.5 rounded-md transition-all ${
              canUndo
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white shadow-2xs cursor-pointer active:scale-95'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className={`p-1.5 rounded-md transition-all ${
              canRedo
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white shadow-2xs cursor-pointer active:scale-95'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Device Switcher (Desktop 600px / Mobile 375px) */}
        <div className="flex items-center bg-slate-100/80 rounded-lg p-0.5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setPreviewDevice('desktop')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              previewDevice === 'desktop'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 cursor-pointer'
            }`}
            title="Visualização Desktop (600px)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewDevice('mobile')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              previewDevice === 'mobile'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 cursor-pointer'
            }`}
            title="Visualização Mobile (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Right: Actions (Import, Preview, Export) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onOpenTemplates}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Abrir meus templates salvos"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden lg:inline">Meus templates</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Salvar template (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Salvar</span>
        </button>

        {/* Import HTML */}
        <button
          type="button"
          onClick={onOpenImportModal}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Importar um arquivo HTML ou colar código"
        >
          <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Importar HTML</span>
        </button>

        {/* Live Preview Fullscreen */}
        <button
          type="button"
          onClick={onNavigateToPreview}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Visualizar em tela cheia com dados dinâmicos"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Visualizar</span>
        </button>

        {/* Primary Action: Export HTML */}
        <button
          type="button"
          onClick={onOpenExportModal}
          className="px-3 sm:px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          title="Exportar código HTML limpo e baixar arquivo"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar HTML</span>
        </button>
      </div>
    </header>
  );
};
