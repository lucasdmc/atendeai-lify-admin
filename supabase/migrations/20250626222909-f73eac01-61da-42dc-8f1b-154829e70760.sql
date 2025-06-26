
-- Primeira migração: Adicionar novos valores ao enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin_lify';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestor';

-- Criar tabela para definir permissões por role de forma mais flexível
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    module_name text NOT NULL,
    can_access boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(role, module_name)
);
