
# Instruções de Deploy - Lify AtendeAÍ

## Criando Usuário Administrador

Para criar um usuário administrador após o deploy:

### 1. Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard do seu projeto
2. Vá em Authentication > Users
3. Clique em "Add user"
4. Configure:
   - **Email**: `admin@lify.com`
   - **Password**: `Admin123!`
   - **Email Confirm**: `true` (marque como confirmado)
   - **Auto Confirm User**: `true`

### 2. Após criar o usuário

1. Vá em SQL Editor
2. Execute o seguinte comando para dar permissões de admin:

```sql
-- Atualizar o usuário recém-criado para admin
UPDATE public.user_profiles 
SET role = 'admin', name = 'Administrador'
WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = 'admin@lify.com' 
    LIMIT 1
);

-- Garantir que tem todas as permissões
INSERT INTO public.user_permissions (user_id, module_name, can_access) 
SELECT 
    (SELECT id FROM auth.users WHERE email = 'admin@lify.com' LIMIT 1),
    module_name,
    true
FROM (VALUES 
    ('dashboard'),
    ('conversas'),
    ('conectar_whatsapp'),
    ('contextualizar'),
    ('gestao_usuarios'),
    ('configuracoes')
) AS modules(module_name)
ON CONFLICT (user_id, module_name) DO UPDATE SET can_access = true;
```

## Credenciais de Login

- **Email**: `admin@lify.com`
- **Senha**: `Admin123!`

## Deploy

1. Para publicar a aplicação, use o botão "Share > Publish" no Lovable
2. A aplicação será disponibilizada em uma URL pública
3. Configure as URLs de redirect no Supabase:
   - Authentication > Settings > URL Configuration
   - Site URL: `https://seu-dominio.lovable.app`
   - Redirect URLs: `https://seu-dominio.lovable.app/**`

## Configurações Importantes

### Supabase Settings

No painel do Supabase, em Authentication > Settings:

1. **Email Auth**: Habilitado
2. **Confirm email**: Desabilitado (para facilitar testes)
3. **Secure email change**: Habilitado
4. **Email templates**: Configure conforme necessário

### RLS (Row Level Security)

Todas as políticas RLS já estão configuradas automaticamente via migration.

## Módulos da Aplicação

- **Dashboard**: Métricas e overview
- **Conversas**: Gestão de conversas WhatsApp
- **Conectar WhatsApp**: Integração com WhatsApp Business
- **Contextualizar**: Configuração da IA
- **Gestão de Usuários**: Administração de usuários e permissões
- **Configurações**: Configurações gerais do sistema

## Suporte

Para questões técnicas ou problemas de deploy, consulte a documentação do Lovable.
