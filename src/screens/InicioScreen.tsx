import React from 'react';
import { Screen, TransitionType, EmailTemplate } from '../types';
import { ArrowRight, Blocks, BookOpen, FileCode2, Layers3, Sparkles } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../data/templates';

interface InicioScreenProps {
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
  onSelectTemplate: (template: EmailTemplate) => void;
  onOpenLibrary: () => void;
}

export const InicioScreen: React.FC<InicioScreenProps> = ({ onNavigate, onSelectTemplate, onOpenLibrary }) => {
  return (
    <main className="flex-grow w-full bg-slate-50 px-4 py-10 md:px-8 md:py-14 text-slate-800">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 md:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <Layers3 size={14} /> R9Bot Mailer
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">O que você quer fazer?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
            Crie, edite e confira seus e-mails em um só lugar.
          </p>
        </section>

        <section aria-label="Ações principais">
          <button
            type="button"
            onClick={() => onNavigate('gerador_pro', 'push')}
            className="group flex min-h-48 w-full flex-col rounded-2xl border border-blue-700 bg-blue-700 p-6 text-left text-white transition-all hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:p-7"
          >
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
              <Blocks size={23} />
            </span>
            <span className="text-xl font-bold">Criar ou editar e-mail</span>
            <span className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Monte seu e-mail com blocos, abra um e-mail salvo ou importe um HTML existente. Sem precisar escrever código.
            </span>
            <span className="mt-auto flex items-center gap-2 pt-6 text-xs font-semibold text-white">
              Abrir o editor <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </section>

        <section className="mt-4" aria-label="Biblioteca compartilhada">
          <button
            type="button"
            onClick={onOpenLibrary}
            className="group flex w-full items-center gap-4 rounded-2xl border border-indigo-200 bg-white p-5 text-left shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><BookOpen size={22} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900">Biblioteca compartilhada</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">Consulte os modelos publicados pela equipe ou publique um novo e-mail para todos reutilizarem.</span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-indigo-600 transition-transform group-hover:translate-x-1" />
          </button>
        </section>

        <section className="mt-10 md:mt-12" aria-label="Começar de um modelo">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <Sparkles size={16} /> Modelos prontos
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Começar de um modelo</h2>
              <p className="mt-1.5 text-sm text-slate-600">Escolha uma base e personalize o conteúdo no editor.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {DEFAULT_TEMPLATES.map((template) => (
              <article key={template.id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                <div className="relative h-36 overflow-hidden bg-slate-100">
                  <img
                    src={template.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">
                    {template.badge || 'Modelo'}
                  </span>
                </div>
                <div className="flex flex-grow flex-col p-4">
                  <h3 className="text-sm font-bold text-slate-900">{template.name}</h3>
                  <p className="mt-1.5 flex-grow text-xs leading-5 text-slate-600">{template.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="h-2.5 w-2.5 rounded-full border border-slate-300" style={{ backgroundColor: template.primaryColor }} />
                      Paleta do modelo
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectTemplate(template)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      Usar modelo <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <FileCode2 size={14} /> Dica: mantenha as tags dinâmicas, como {'{{nome}}'} e {'{{email}}'}, quando o disparo precisar personalizar cada mensagem.
        </p>
      </div>
    </main>
  );
};
