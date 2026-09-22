# Fase G — Sistema de Propriedades e Edição

## Aplicado
- Registro tipado central de propriedades em `src/data/blockProperties.ts`.
- Propriedades organizadas por conteúdo, tipografia, layout e aparência.
- Validação/sanitização central das alterações feitas no painel antes de entrarem no estado do editor.
- URLs e cores passam por validação; tamanhos numéricos ficam limitados a faixas seguras.
- Undo/Redo continua registrando alterações de propriedades.
- Edição rápida no próprio preview por duplo clique para título, subtítulo, texto, cabeçalho e rótulo de botão.
- Edição inline é persistida no mesmo modelo de blocos e passa pelo mesmo caminho de validação.
- `data-inline-edit` foi adicionado ao HTML de preview apenas para os campos que podem ser editados diretamente.

## Decisão de UX
O painel lateral continua sendo a fonte de controle detalhado. A edição inline é um atalho; ela não cria um segundo modelo de dados.

## Observação
A edição inline é confirmada no `blur`, evitando criar um estado de Undo para cada tecla digitada.
