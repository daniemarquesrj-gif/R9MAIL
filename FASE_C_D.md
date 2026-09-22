# R9Bot Mailer — Fases C e D

## Fase C — Persistência e documentos

### O que foi implementado
- Rascunho real com recuperação via `localStorage`.
- Autosave com debounce de 700 ms.
- Estado visual real de persistência: `Salvando`, `Salvo`, `Alterações não salvas` e `Falha ao salvar`.
- `Ctrl+S` / `Cmd+S` para salvar manualmente.
- Biblioteca local de templates.
- Salvar template com versionamento.
- Até 20 versões por template.
- Restauração de versão anterior.
- Evita gerar uma nova versão quando o conteúdo não mudou.
- Gerenciador de templates integrado ao editor.

### Limitação deliberada
A persistência desta fase é local ao navegador/dispositivo. Não é sincronização multiusuário no Firebase. Isso evita alterar a arquitetura de autenticação/dados sem uma definição posterior de modelo de conta e permissões.

## Fase D — Engine de e-mail

### O que foi implementado
- Separação entre HTML de **preview** e HTML de **transporte/exportação**.
- Novo `emailCompiler.ts`.
- Estrutura externa baseada em tabelas.
- Markup condicional para Outlook/MSO.
- Meta tags de e-mail e CSS defensivo.
- Botões exportados em estrutura de tabela.
- Imagens exportadas com atributos e estilos apropriados para e-mail.
- Sanitização final preservada.
- Validação auxiliar de links no HTML final.

### Princípio
O editor continua livre para usar uma estrutura amigável ao navegador. A exportação não precisa reproduzir a mesma árvore DOM do preview; ela passa por uma camada própria de compatibilidade com clientes de e-mail.

### Importante
A engine melhora a compatibilidade estrutural, mas não equivale a um teste real em Outlook, Gmail, Apple Mail e clientes móveis. Essa matriz deve ser validada em uma etapa posterior com fixtures e mensagens reais.

## Validação realizada nesta entrega
- Os módulos puros `types.ts`, `security.ts`, `compiler.ts`, `emailCompiler.ts` e `templateStore.ts` passaram por TypeScript isolado (`tsc --noEmit`) no ambiente de trabalho.
- A instalação completa de npm não terminou dentro do ambiente desta sessão; por isso a suíte Vitest e o build Vite precisam ser executados localmente com `npm install`, `npm run test`, `npm run lint` e `npm run build`.
