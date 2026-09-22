# Fase H — Auditoria final pós-correção

## Resultado

A auditoria estática foi repetida após as correções da Fase H. Não foram encontrados caminhos ativos para hosts públicos de imagem de terceiros, Gemini, Express ou dotenv no código de produção. A fonte do HTML de transporte agora é explícita: documentos visuais usam `EmailBlock[]`; documentos HTML usam `customCodeHtml`.

## Correções verificadas

- `compileTransportHtml()` não usa mais o HTML de preview derivado dos blocos como fonte de transporte.
- `compileEmailToHtml()` continua podendo usar `customCodeHtml` como cache de preview, preservando a tela de visualização.
- `contentSource` diferencia `blocks` de `html`.
- Assunto do e-mail foi separado de `headerTitle`.
- Versões guardam `name` e `subject`.
- Drafts usam chave por `documentId`; `saveDraft()` retorna `boolean`.
- Sanitização de `<meta>` foi restringida a metadados seguros.
- `data:image` foi limitado a PNG/JPEG/GIF/WEBP em Base64.
- Fallbacks externos de imagem no compilador foram removidos; blocos sem imagem exibem placeholder local.
- Nomenclatura legada `uploadToPublicHost` foi removida; o pipeline usa Firebase Storage.
- Testes foram ampliados para fonte de transporte, metadados e casos de segurança.

## Dívidas técnicas restantes — não bloqueantes

1. `PropertiesPanel.tsx` ainda é grande (~1150 linhas) e parte da UI ainda usa condições manuais em vez de ser totalmente gerada pelo catálogo de propriedades.
2. Ainda existem alguns usos de `any`, principalmente em parser e componentes de edição.
3. `htmlParser.ts` é grande (~1340 linhas) e merece benchmark antes de qualquer otimização.
4. Existem `console.warn/error` para diagnóstico legítimo; não há `console.log` de debug.
5. Templates visuais de demonstração ainda usam imagens externas do Unsplash para cards de galeria. Elas não são usadas como fallback pelo compilador de e-mail e não representam upload automático de assets do usuário.
6. As Firebase Rules não estão incluídas no ZIP; não é possível auditar permissões de Firestore/Storage sem os arquivos/configuração do projeto Firebase.

## Validação de execução

O ambiente desta auditoria não conseguiu instalar as dependências npm: `npm install` excedeu o limite de execução e o modo offline confirmou que os pacotes não estão em cache. Portanto, `npm run lint`, `npm test` e `npm run build` precisam ser executados no ambiente do projeto.

## Comandos finais

```bash
npm install
npm run lint
npm run test
npm run build
```
