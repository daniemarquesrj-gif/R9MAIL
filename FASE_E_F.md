# R9Bot Mailer — Fases E + F

## Fase E — UX e refinamento profissional

- Toast reutilizável para feedback de sucesso, erro e informação.
- Remoção de `alert()` do editor de código em favor de feedback não bloqueante.
- Feedback de upload e importação padronizado.
- Aviso nativo de alterações não salvas ao tentar fechar/recarregar o editor.
- Indicador de autosave mantido no editor.
- Navegação principal com `aria-label` e melhor comportamento em telas estreitas.
- Foco visível para teclado (`:focus-visible`).
- Suporte a `prefers-reduced-motion`.
- Modal de templates com semântica de diálogo, fechamento pelo backdrop e botão de fechar acessível.
- Remoção de controles da barra do editor de código que eram apenas visuais e não executavam nenhuma ação.
- Error Boundary elevado para a aplicação inteira, em vez de proteger somente o editor visual.

## Fase F — Arquitetura e manutenção

- Histórico de Undo/Redo extraído para `src/hooks/useEditorHistory.ts`.
- Histórico limitado a 50 estados para evitar crescimento indefinido de memória.
- Autosave extraído para `src/hooks/useDraftAutosave.ts`.
- Blocos padrão extraídos para `src/data/defaultBlocks.ts`.
- Toast extraído para `src/components/ui/Toast.tsx`.
- Redução de responsabilidades do `GeradorProScreen`.
- Tipagem de alguns fluxos antes baseados em `any` (`EmailTemplate` e erros como `unknown`).
- Versão do projeto atualizada para 1.2.0.

## Validação

O ambiente de execução desta entrega não possuía `node_modules`. A tentativa de instalar as dependências excedeu o limite de execução da sessão. Portanto, `npm test`, `npm run lint` e `npm run build` devem ser executados no ambiente do projeto antes do deploy.
