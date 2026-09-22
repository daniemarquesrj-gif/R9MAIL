# R9Bot Mailer — Fases A e B

## Fase A — Segurança e confiabilidade

- Criada uma política central em `src/utils/security.ts` para HTML, rich text, URLs e CSS.
- `dangerouslySetInnerHTML` do editor de código agora recebe HTML sanitizado.
- HTML importado é sanitizado antes de entrar no parser/modelo.
- O parser também sanitiza a entrada para não depender dos chamadores.
- Rich text é sanitizado antes de ser persistido no estado do editor.
- O compilador passou a escapar/sanitizar conteúdo, URLs e valores CSS controláveis pelo usuário.
- `<style>` continua permitido no HTML de e-mail e regras `@media` são preservadas.
- Scripts, handlers `on*`, URLs `javascript:`/`vbscript:` e CSS perigoso são bloqueados.
- Upload de imagens agora usa somente Firebase Storage; foram removidos os fallbacks automáticos para FreeImage, ImgBB e TmpFiles e suas chaves do código.
- URLs de imagem externas precisam ser HTTPS quando já fornecidas como URL.
- Diagnóstico do Firebase não retorna mais sucesso para erros desconhecidos.
- Error Boundary não exibe detalhes internos do erro em produção.
- Removida a cópia duplicada `r9/` do projeto.
- Removidas dependências/artefatos de Gemini, Express e dotenv que não eram usados pelo aplicativo.

## Fase B — Testes e regressão

Foi criada uma suíte inicial em `tests/` cobrindo:

- escape HTML;
- validação de URLs;
- CSS perigoso;
- sanitização de rich text;
- preservação de `<style>` e `@media`;
- segurança do compilador;
- sanitização de HTML customizado;
- round-trip básico Compiler → Parser;
- importação com markup perigoso;
- diagnóstico de erros do Firebase;
- validação de uploads de imagem.

Comandos:

```bash
npm install
npm run lint
npm run test
npm run build
```

### Observação de validação desta entrega

O ambiente usado para preparar este ZIP não tinha as dependências npm instaladas e não conseguiu baixá-las durante a execução. Por isso, a suíte Vitest não foi executada aqui. Foi feita validação estática dos arquivos críticos com TypeScript global; `security.ts`, `compiler.ts`, `htmlParser.ts` e `types.ts` passaram sem erros de TypeScript quando compilados isoladamente com DOM/DOM.Iterable.

Antes de publicar, rode os três comandos acima em uma máquina com acesso ao npm.

## Fase C — Persistência e documentos
- Rascunho real em `localStorage`, com recuperação após refresh/reabertura.
- Botão **Salvar** e `Ctrl+S`.
- Biblioteca local de templates.
- Versionamento de até 20 versões por template.
- Restauração de versões anteriores.
- Evita criar versão duplicada quando o conteúdo não mudou.
- Indicador real de estado: salvando, salvo, alterações não salvas ou falha.

## Fase D — Engine de e-mail
- Preview continua usando o compilador visual atual.
- Exportação usa uma camada de transporte separada.
- Estrutura externa baseada em tabelas para clientes de e-mail.
- Markup condicional para Outlook/MSO.
- Meta tags e CSS defensivo para e-mail.
- Botões gerados em estrutura de tabela para maior previsibilidade.
- Imagens geradas com `width`, `display:block` e atributos seguros.
- Sanitização final mantida antes da exportação.
