# R9Bot Mailer

Aplicação para criar, importar, editar, organizar e exportar e-mails usando blocos visuais.

## Telas
- **Início:** abre o editor ou permite começar de um modelo pronto.
- **Editor:** blocos arrastáveis, edição de texto diretamente no e-mail, imagens, botões, desfazer/refazer, prévia responsiva, importação e exportação de HTML.
- **Biblioteca de modelos:** catálogo compartilhado de modelos públicos, com cópia independente para uso e permissões de edição por proprietário/administrador.

## Persistência online
- O **rascunho atual** é salvo automaticamente no Supabase após uma breve pausa na edição. Os rascunhos são privados para cada usuário autenticado.
- **Salvar template** publica o modelo na biblioteca compartilhada ou atualiza o modelo existente se o usuário for seu dono ou administrador.
- **Usar modelo** cria uma cópia independente; não altera o original.
- O histórico é registrado no banco quando um modelo é publicado ou seu conteúdo/metadados são alterados.
- O projeto não utiliza mais `localStorage` para armazenar templates ou rascunhos. A persistência local de sessão do Supabase permanece ativada para manter o login.

## Configuração do Supabase
1. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente do projeto.
2. Execute `supabase/migrations/202610160001_shared_mailer_library.sql` no SQL Editor do projeto Supabase ou aplique-o pelo fluxo de migrations adotado pela equipe.
3. Cadastre pelo menos um administrador, substituindo o e-mail na consulta abaixo por uma conta já registrada em Auth > Users:

```sql
insert into public.mailer_library_admins (user_id)
select id from auth.users where lower(email) = lower('admin@example.com')
on conflict (user_id) do nothing;
```

A tabela de administradores não permite que usuários autenticados adicionem a si mesmos. A promoção administrativa deve ser feita por alguém com acesso privilegiado ao banco.

### Regras implementadas
- Consultar e usar modelos públicos: todos os usuários autenticados.
- Criar/publicar modelos públicos: todos os usuários autenticados.
- Editar modelos: somente o dono ou um administrador.
- Excluir modelos: somente administradores.
- O administrador pode editar um modelo sem transferir a propriedade do criador original.
- Os rascunhos são privados e as permissões são aplicadas por RLS no Supabase, além dos controles de interface.

**Importante:** a migração do banco precisa ser aplicada no projeto Supabase real antes de testar os fluxos da biblioteca. Este pacote inclui a migração, mas não aplica alterações remotamente ao seu projeto.

## Importar HTML
A importação analisa o conteúdo antes de substituir o e-mail atual e mostra uma estimativa de palavras preservadas, imagens, links e blocos gerados. O conteúdo textual pode ser aproveitado mesmo quando colunas, bordas, espaçamentos e outros detalhes visuais precisam ser simplificados na conversão para blocos.

## Rodar localmente
1. `npm install`
2. Configure as variáveis de ambiente do Supabase e do Firebase se for usar upload de imagens.
3. `npm run dev`

## Verificar
- `npm run lint`
- `npm test`
- `npm run build`

### Publicação na biblioteca compartilhada

Ao clicar em **Salvar template** (ou usar `Ctrl+S` no editor), o sistema abre um formulário próprio para o nome e a descrição do modelo. Para uma nova publicação, esses campos começam vazios e são obrigatórios; o assunto/título do e-mail não é utilizado como nome automaticamente. Ao editar um modelo já publicado, o formulário recupera o nome e a descrição registrados na biblioteca.

### Diagnóstico de falha ao publicar

A publicação do modelo é executada antes da gravação do rascunho privado, então uma falha isolada no autosave não impede a publicação. Se a publicação em si falhar, a janela exibe a mensagem devolvida pela operação em vez de ocultá-la com um aviso genérico. Se apenas o rascunho falhar, o sistema informa que o modelo foi publicado e que o rascunho precisa de atenção. O diagnóstico somente leitura do banco está em `supabase/diagnostics/check-mailer-library.sql`; execute-o no SQL Editor para conferir todas as colunas usadas pelo código, políticas, funções e RLS. Se houver colunas ausentes em tabelas que já existiam antes da migração, execute `supabase/diagnostics/repair-mailer-library-columns.sql`: ele apenas adiciona colunas ausentes, preenche metadados disponíveis e solicita a atualização do cache de schema do PostgREST, sem apagar registros.

## Recuperação de senha
- A tela de login envia o e-mail de recuperação pelo Supabase Auth.
- O link retorna para `/?auth=password-reset`, onde o usuário define e confirma a nova senha.
- Configure a **Site URL**, as **Redirect URLs** e o template de e-mail de recuperação no painel do Supabase. O passo a passo está em [`SUPABASE_AUTH_SETUP.md`](./SUPABASE_AUTH_SETUP.md).
- Não é necessária uma migração SQL para este recurso. Use o arquivo `.env.example` como referência das variáveis de ambiente; não coloque a chave `service_role` no frontend.

## Encerrar sessão
- O botão **Sair** fica disponível na navegação principal e também na barra superior do editor.
- Ao sair pelo editor, o R9Bot tenta salvar o rascunho atual na nuvem antes de encerrar a sessão; se o salvamento falhar, informa o problema e mantém o usuário no editor.
- O encerramento da sessão é feito por `supabase.auth.signOut()`. O usuário retorna à tela de autenticação.

## Aviso diário de novidades

Ao entrar com uma conta autenticada, o aplicativo apresenta um aviso sobre o login por e-mail e senha e a Biblioteca compartilhada na primeira abertura do dia. O aviso pode ser fechado pelo botão `X` ou por `Entendi, continuar` e volta a aparecer no próximo dia. Para lembrar a data em que o aviso foi fechado, o aplicativo guarda somente a data local no `localStorage`, com uma chave separada por usuário; modelos e rascunhos não são armazenados ali.
