# Configuração de recuperação de senha — R9Bot Mailer

O fluxo de recuperação usa o Supabase Auth. Não é necessário criar tabela nem executar SQL para redefinir senhas.

## 1. Conferir as variáveis do aplicativo

Configure no ambiente de build:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICAVEL_OU_ANON
```

Use apenas a chave pública/publishable (ou a chave `anon` legada) no navegador. **Nunca coloque a `service_role` no frontend.** A sessão de recuperação é validada pelo Supabase Auth.

## 2. Configurar URLs autorizadas no Supabase

1. Abra o projeto correto no painel do Supabase.
2. Entre em **Authentication → URL Configuration**.
3. Em **Site URL**, coloque a origem principal da aplicação publicada, por exemplo `https://SEU-DOMINIO`. Não copie o domínio de exemplo literalmente.
4. Em **Redirect URLs**, adicione o endereço de recuperação usado pelo código e os endereços de desenvolvimento. Recomendações:
   - `http://localhost:3000/**` para desenvolvimento local;
   - `http://127.0.0.1:3000/**` caso também acesse pelo endereço IP local;
   - `https://SEU-DOMINIO/**` para a aplicação publicada, substituindo pelo domínio real.
5. Salve as configurações.

O aplicativo solicita o retorno para `/?auth=password-reset`. O padrão `/**` permite esse retorno com query string. Em produção, restrinja a lista aos domínios realmente usados pelo sistema; não autorize domínios desconhecidos.

Se o endereço público mudar (por exemplo, de uma URL de preview para o domínio definitivo), atualize a Site URL e a lista de Redirect URLs.

## 3. Conferir o modelo de e-mail de redefinição

1. Acesse **Authentication → Email Templates → Reset Password** (o rótulo pode aparecer como “Reset password”).
2. Confira se o botão/link de redefinição usa a variável oficial `{{ .ConfirmationURL }}`. Ela contém o link de verificação e respeita o `redirectTo` enviado pelo aplicativo.
3. Um modelo simples em português pode ser:

**Assunto**

```text
Redefinir sua senha | R9Bot Mailer
```

**Corpo HTML**

```html
<h2>Redefinir senha do R9Bot Mailer</h2>
<p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
<p><a href="{{ .ConfirmationURL }}">Criar uma nova senha</a></p>
<p>Se você não solicitou essa alteração, ignore este e-mail. Sua senha não será alterada.</p>
```

Não substitua `{{ .ConfirmationURL }}` por um link inventado ou por `{{ .SiteURL }}` sem a rota de verificação. O link do Supabase realiza a validação do token antes de devolver o usuário ao aplicativo.

## 4. Como o fluxo deve funcionar

1. Na tela de login, o usuário informa o e-mail e clica em **Esqueci minha senha**.
2. O app chama `resetPasswordForEmail` e mostra uma confirmação neutra para não revelar se o e-mail está cadastrado.
3. O usuário abre o e-mail e clica no link.
4. O Supabase valida o link e retorna para `/?auth=password-reset` com a sessão de recuperação.
5. O app detecta o evento `PASSWORD_RECOVERY`, exibe os campos de nova senha e confirmação e chama `updateUser({ password })`.
6. Após a confirmação, o usuário pode continuar para o sistema.

## 5. Teste de ponta a ponta

- Teste primeiro com uma conta de teste cujo e-mail você consiga abrir.
- Confirme que o e-mail recebido aponta para o projeto e para o domínio correto.
- Clique no link uma única vez e confirme que a página **Defina uma nova senha** é aberta.
- Defina uma senha válida, confirme o sucesso e entre novamente com a nova senha.
- Solicite outro link e teste um link expirado ou já usado: o app deve pedir que o usuário solicite uma nova mensagem.
- Repita o teste após publicar o app no domínio final; funcionar em localhost não garante que as URLs de produção estejam autorizadas.

Se a mensagem não chegar, verifique spam, os logs de Auth do projeto e as configurações de entrega de e-mail. Para uso real da equipe, avalie configurar um SMTP próprio e autorizado, porque a entrega de e-mails de autenticação depende da configuração e dos limites do serviço de e-mail.
