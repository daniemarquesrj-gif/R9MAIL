import React, { useEffect, useState } from 'react';
import { Clock3, FileText, RotateCcw, Trash2, X } from 'lucide-react';
import type { TemplateDocument } from '../../utils/templateStore';

interface TemplateManagerModalProps {
  isOpen: boolean;
  templates: TemplateDocument[];
  onClose: () => void;
  onLoad: (template: TemplateDocument) => void;
  onDelete: (id: string) => void;
  onRestoreVersion: (templateId: string, versionId: string) => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen, templates, onClose, onLoad, onDelete, onRestoreVersion,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (selectedId && !templates.some((item) => item.id === selectedId)) setSelectedId(null);
  }, [selectedId, templates]);

  if (!isOpen) return null;
  const selected = templates.find((item) => item.id === selectedId) || null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="template-manager-title" className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="template-manager-title" className="text-base font-bold text-slate-800">Meus templates</h2>
            <p className="text-xs text-slate-500">Templates salvos localmente e versões anteriores.</p>
          </div>
          <button type="button" aria-label="Fechar meus templates" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2">
          <div className="overflow-y-auto p-4 border-r border-slate-100 space-y-2">
            {templates.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">Nenhum template salvo ainda.</div>
            ) : templates.map((template) => (
              <div key={template.id} className={`p-3 rounded-xl border ${selectedId === template.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                <button type="button" onClick={() => setSelectedId(template.id)} className="w-full text-left">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-800 truncate">{template.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{template.subject}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Atualizado {new Date(template.updatedAt).toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                </button>
                <div className="flex gap-1 mt-2">
                  <button type="button" onClick={() => onLoad(template)} className="flex-1 px-2 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold">Abrir</button>
                  <button type="button" onClick={() => onDelete(template.id)} className="px-2 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-y-auto p-4 bg-slate-50/70">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-slate-400">Selecione um template para ver suas versões.</div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3"><Clock3 className="w-4 h-4 text-indigo-600" /><h3 className="text-xs font-bold text-slate-800">Histórico de versões</h3></div>
                <div className="space-y-2">
                  {selected.versions.map((version, index) => (
                    <div key={version.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                      <div className="flex-1"><div className="text-xs font-semibold text-slate-700">{index === 0 ? 'Versão atual' : `Versão ${selected.versions.length - index}`}</div><div className="text-[10px] text-slate-400">{new Date(version.createdAt).toLocaleString('pt-BR')} · {version.blocks.length} blocos</div></div>
                      <button type="button" onClick={() => onRestoreVersion(selected.id, version.id)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600" title="Restaurar esta versão"><RotateCcw className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
