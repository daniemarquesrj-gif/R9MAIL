# R9Bot Mailer

Editor visual e editor HTML para criação de templates de e-mail marketing.

## Estrutura

- `src/screens/` — telas da aplicação.
- `src/components/` — componentes reutilizáveis.
- `src/utils/compiler.ts` — geração de HTML de e-mail.
- `src/utils/htmlParser.ts` — importação de HTML para blocos.
- `src/utils/security.ts` — política central de sanitização, URLs e CSS.
- `src/utils/imageUploader.ts` — upload de imagens exclusivamente pelo Firebase Storage.
- `src/lib/firebase.ts` — autenticação e serviços Firebase.
- `tests/` — testes automatizados de segurança, compilação, parser e upload.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Verificações

```bash
npm run lint
npm run test
npm run build
```

O projeto não depende mais de Gemini, Express, dotenv ou de hosts públicos de imagens de terceiros.

## Fases C e D

- `src/utils/templateStore.ts` — rascunho, templates locais e versões.
- `src/utils/emailCompiler.ts` — camada de transporte/exportação orientada a clientes de e-mail.
- `src/components/gerador/TemplateManagerModal.tsx` — biblioteca e restauração de versões.
- `tests/templateStore.test.ts` e `tests/emailCompiler.test.ts` — cobertura das novas camadas.

## Fase H

- A fonte do documento é explícita: `blocks` ou `html`.
- HTML de preview derivado não é mais usado como fonte de transporte do editor visual.
- Drafts são isolados por documento.
- Assunto e título visual são campos diferentes.
- Versões guardam nome e assunto.
- O upload de imagens usa apenas Firebase Storage.
