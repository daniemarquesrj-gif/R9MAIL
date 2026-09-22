# Correção — Formatação de trecho selecionado

## Alteração desta etapa

A formatação de texto no painel de propriedades passou a ser aplicada ao trecho selecionado quando existe um editor de texto ativo, em vez de alterar automaticamente o bloco inteiro.

Foram convertidos para editores de texto ricos os campos editáveis que aceitam formatação parcial:
- título;
- subtítulo;
- texto/parágrafo;
- título e subtítulo do cabeçalho;
- rótulo do botão;
- rodapé.

Os botões de negrito, itálico, sublinhado e tachado agora usam a seleção do editor ativo.

## Fora do escopo

Nenhuma outra funcionalidade do projeto foi alterada intencionalmente nesta etapa.

## Validação

O build não pôde ser executado neste ambiente porque as dependências npm não estão instaladas (`vite: not found`). A validação precisa ser feita com `npm install` seguido de `npm run build` e, principalmente, com teste manual da seleção parcial no editor.
