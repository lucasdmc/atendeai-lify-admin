# Google User Auth Edge Function

Esta Edge Function gerencia a autenticação OAuth do Google Calendar.

## Funcionalidade

- Troca código de autorização por tokens de acesso
- Obtém informações do perfil do usuário
- Trata erros específicos do OAuth (redirect_uri_mismatch, etc.)
- Suporte completo a CORS

## Variáveis de Ambiente Necessárias

- `GOOGLE_CLIENT_ID`: Client ID do Google OAuth (configurado automaticamente)
- `GOOGLE_CLIENT_SECRET`: Client Secret do Google OAuth (obrigatório)

## Endpoint

`POST /functions/v1/google-user-auth`

### Payload
```json
{
  "code": "authorization_code_from_google",
  "redirectUri": "https://atendeai.lify.com.br/agendamentos"
}
```

### Response
```json
{
  "access_token": "access_token",
  "refresh_token": "refresh_token",
  "expires_at": "2025-01-18T22:00:00.000Z",
  "scope": "calendar email profile",
  "user_profile": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "profile_picture_url",
    "verified_email": true
  }
}
```

## Deploy

Para fazer deploy desta função:

```bash
supabase functions deploy google-user-auth
```

## Configuração no Supabase

1. Configurar a variável `GOOGLE_CLIENT_SECRET` no Supabase Dashboard
2. Verificar se a função está ativa
3. Testar com um código OAuth válido
