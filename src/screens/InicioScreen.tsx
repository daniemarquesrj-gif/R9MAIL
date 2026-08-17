import React, { useState } from 'react';
import { Screen, TransitionType } from '../types';

interface InicioScreenProps {
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
}

export const InicioScreen: React.FC<InicioScreenProps> = ({ onNavigate }) => {
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const variablesList = [
    { tag: '{{nome}}', campo: 'Nome', desc: 'Nome do destinatário / aluno / cliente', ex: 'Maria Silva Santos' },
    { tag: '{{email}}', campo: 'Email', desc: 'E-mail do destinatário', ex: 'maria.santos@email.com' },
    { tag: '{{var1}}', campo: 'Var1', desc: 'Variável livre 1 (pode conter qualquer dado, ex: link do boleto, CPF, etc.)', ex: 'https://boleto.estacio.br/12345' },
    { tag: '{{var2}}', campo: 'Var2', desc: 'Variável livre 2 (pode conter qualquer dado, ex: valor, vencimento, curso, etc.)', ex: 'R$ 299,00' },
    { tag: '{{var3}}', campo: 'Var3', desc: 'Variável livre 3 (pode conter qualquer dado, ex: unidade, empresa, código, etc.)', ex: 'Estácio Tom Jobim / Yduqs' },
  ];

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedVar(tag);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  return (
    <div className="flex-grow flex flex-col pt-16 pb-24 w-full bg-slate-50 text-slate-800">
      {/* Banner / Hero Principal */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white py-12 px-4 md:px-8 border-b border-slate-800 shadow-md">
        <div className="max-w-5xl mx-auto space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
            <span className="material-symbols-outlined text-sm">rocket_launch</span>
            <span>Manual do Usuário & Visão Geral</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight flex items-center justify-center md:justify-start gap-3">
            <img src="/favicon.svg" alt="R9 Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-md border border-white/20" />
            <span>Bem-vindo ao <span className="text-blue-400">R9Bot Mailer</span></span>
          </h1>

          <p className="text-slate-300 text-sm md:text-lg max-w-3xl leading-relaxed">
            Sua plataforma completa para criação, personalização e exportação de e-mails corporativos 100% responsivos e otimizados para disparos automatizados.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              onClick={() => onNavigate('gerador_pro', 'push')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">view_quilt</span>
              <span>Abrir Gerador Visual PRO</span>
            </button>

            <button
              onClick={() => onNavigate('editor', 'push')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-5 py-3 rounded-xl text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">code</span>
              <span>Editor de Código HTML</span>
            </button>

            <button
              onClick={() => onNavigate('visualizacao', 'push')}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <span className="material-symbols-outlined text-[20px]">visibility</span>
              <span>Visualização Real</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal do Guia */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-12">
        
        {/* Seção 1: Como funciona o Gerador Visual PRO */}
        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xl shadow-2xs">
              <span className="material-symbols-outlined text-2xl">widgets</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">1. Gerador Visual PRO (Blocos)</h2>
              <p className="text-xs md:text-sm text-slate-500">Crie e-mails profissionais sem precisar escrever código HTML manualmente.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <span className="material-symbols-outlined text-lg">dashboard</span>
                <span>Modelos Prontos</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Escolha entre modelos predefinidos no topo do gerador (<strong>Padrão, Boas-Vindas, Newsletter, Oferta e Pesquisa</strong>) para carregar layouts completos em 1 clique.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <span className="material-symbols-outlined text-lg">drag_indicator</span>
                <span>Blocos Modulares</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Adicione, exclua ou reordene os blocos (Cabeçalho, Imagem/Banner, Botão CTA, Caixa de Destaque, Lista e Rodapé) usando as setas de ordenação para cima e para baixo.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                <span>Upload de Imagens</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Envie imagens direto do seu dispositivo no bloco de Imagem. Elas são enviadas para um servidor público seguro e preparadas para exibição perfeita no e-mail.
              </p>
            </div>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-indigo-600 mt-0.5">lightbulb</span>
            <div className="text-xs text-indigo-950 space-y-1">
              <strong className="font-bold">Dica Pro no Gerador Visual:</strong>
              <p>
                Ao clicar em qualquer campo de texto ou caixa de mensagem do bloco selecionado, o seletor de variáveis aparecerá automaticamente para você inserir tags dinâmicas no local exato do cursor.
              </p>
            </div>
          </div>
        </section>

        {/* Seção 2: Editor de Código HTML */}
        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-xl shadow-2xs">
              <span className="material-symbols-outlined text-2xl">code</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">2. Editor de Código HTML</h2>
              <p className="text-xs md:text-sm text-slate-500">Para desenvolvedores ou controle total sobre o HTML do seu e-mail.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-base">terminal</span>
                Edição Direta e Limpa
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Insira ou modifique seu próprio código HTML responsivo. O editor inclui numeração de linhas, busca fácil e atalhos para colar estruturas prontas de e-mail.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-base">sync</span>
                Sincronização em Tempo Real
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Qualquer alteração feita no editor é compilada instantaneamente. Você pode mudar para a aba <strong>Visualização Real</strong> a qualquer momento para conferir o resultado final.
              </p>
            </div>
          </div>
        </section>

        {/* Seção 3: Variáveis Dinâmicas */}
        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold text-xl shadow-2xs">
                <span className="material-symbols-outlined text-2xl">data_object</span>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">3. Como Funcionam as Variáveis Dinâmicas</h2>
                <p className="text-xs md:text-sm text-slate-500">Substituição automática de dados do destinatário no disparo pelo robô/servidor.</p>
              </div>
            </div>

            {copiedVar && (
              <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-full animate-bounce">
                Copiado {copiedVar}!
              </span>
            )}
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 space-y-1.5 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
              <span className="material-symbols-outlined text-emerald-600 text-base">swap_calls</span>
              <span>Entradas do Disparador de E-mail: Nome, Email, Var1, Var2, Var3</span>
            </div>
            <p className="leading-relaxed">
              O nosso disparador de e-mails trabalha com 5 entradas de dados: <strong>Nome</strong>, <strong>Email</strong>, e as variáveis livres <strong>Var1</strong>, <strong>Var2</strong> e <strong>Var3</strong>. Você pode incluir qualquer informação personalizada que desejar dentro de <strong>var1</strong>, <strong>var2</strong> ou <strong>var3</strong> (como links, CPF, empresa, valores, cursos, etc.).
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
                  <th className="p-3.5">Entrada no Disparador</th>
                  <th className="p-3.5">Tag de Código</th>
                  <th className="p-3.5">Descrição</th>
                  <th className="p-3.5">Exemplo de Valor</th>
                  <th className="p-3.5 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {variablesList.map((v) => (
                  <tr key={v.tag} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-mono">
                        {v.campo}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {v.tag}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {v.desc}
                    </td>
                    <td className="p-3.5 text-slate-500 italic">
                      {v.ex}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleCopyTag(v.tag)}
                        className="bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-bold px-2.5 py-1 rounded text-[11px] border border-slate-200 transition-all active:scale-95"
                      >
                        Copiar Tag
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Seção 4: Visualização Real & Resolução de Emojis */}
        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold text-xl shadow-2xs">
              <span className="material-symbols-outlined text-2xl">devices</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">4. Visualização e Correção de Emojis</h2>
              <p className="text-xs md:text-sm text-slate-500">Garantia de layout idêntico tanto no Celular quanto no Computador (Outlook e Gmail).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-base">desktop_windows</span>
                <span>Desktop vs Mobile</span>
              </div>
              <p>
                Alterne o dispositivo na barra superior para visualizar exatamente como o layout reagirá nas telas de smartphones (360px) e monitores (600px).
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-base">sentiment_satisfied</span>
                <span>Emojis Otimizados</span>
              </div>
              <p>
                O R9Bot Mailer aplica proteção automática para que emojis convertidos em imagem por webmails (como Gmail Web e Outlook) fiquem sempre no tamanho proporcional ao texto (1.2em) e não estourem no computador.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-base">file_download</span>
                <span>Exportação Limpa</span>
              </div>
              <p>
                Clique em <strong>Copiar Código HTML</strong> ou <strong>Baixar Arquivo HTML</strong> para obter o arquivo pronto para ser inserido na sua ferramenta de disparo favorita.
              </p>
            </div>
          </div>
        </section>

        {/* CTA do Rodapé */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center space-y-4 shadow-md">
          <h3 className="text-2xl font-extrabold tracking-tight">Pronto para criar seu e-mail?</h3>
          <p className="text-sm text-blue-100 max-w-xl mx-auto">
            Acesse o Gerador Visual PRO para montar a estrutura por blocos ou utilize o Editor de Código para customização técnica.
          </p>
          <div className="pt-2 flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => onNavigate('gerador_pro', 'push')}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              Começar com Gerador Visual PRO
            </button>
            <button
              onClick={() => onNavigate('editor', 'push')}
              className="bg-blue-800/80 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl text-sm border border-blue-400/30 transition-all active:scale-95 cursor-pointer"
            >
              Abrir Editor de Código
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
