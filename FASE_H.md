# Fase H — Auditoria, Correção e Consolidação

## Correções aplicadas
- Separação explícita entre fonte `blocks` e fonte `html`.
- `compileTransportHtml` usa o compilador de e-mail quando o documento é visual.
- `customCodeHtml` passa a ser cache/representação derivada no modo visual, não fonte de transporte.
- Drafts passaram a ser isolados por `documentId` e `saveDraft` retorna sucesso/falha real.
- Metadados de nome e assunto passaram a fazer parte das versões.
- Assunto do e-mail foi separado do título visual do template.
- Sanitização de `<meta>` corrigida e `data:image` restringido a PNG/JPEG/GIF/WEBP.
- Removida a nomenclatura legada de host público de imagens. O upload continua exclusivamente no Firebase Storage.
- Testes adicionados para fonte de transporte e metadados de template.

## Auditoria pós-correção
- Nenhum uso de hosts públicos de imagens foi encontrado no código de produção.
- Nenhum Gemini/Express/dotenv foi encontrado no código.
- Ainda existem alguns `any` em componentes/parser; são dívida técnica não bloqueante.
- `PropertiesPanel` ainda é grande e pode ser decomposto em etapa futura, mas não é uma correção funcional obrigatória.
- Regras Firebase não estão presentes no ZIP; precisam ser auditadas no projeto Firebase antes de produção.
- Build/teste completo deve ser executado no ambiente do projeto após `npm install`.
