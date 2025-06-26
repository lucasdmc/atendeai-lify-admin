
-- Verificar se as tabelas já existem e criar apenas se necessário
DO $$ 
BEGIN
    -- Verificar se a tabela clinics já existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clinics') THEN
        -- Criar tabela de clínicas
        CREATE TABLE public.clinics (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            cnpj text,
            email text,
            phone text,
            address text,
            city text,
            state text,
            website text,
            is_active boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
        
        -- Habilitar RLS
        ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
        
        -- Criar política para visualização
        CREATE POLICY "Users can view their clinics" ON public.clinics
            FOR SELECT USING (
                public.is_lify_admin(auth.uid()) OR
                EXISTS (
                    SELECT 1 FROM public.clinic_users 
                    WHERE user_id = auth.uid() AND clinic_id = clinics.id AND is_active = true
                )
            );
            
        -- Criar política para inserção (apenas admins)
        CREATE POLICY "Admins can create clinics" ON public.clinics
            FOR INSERT WITH CHECK (public.is_lify_admin(auth.uid()));
            
        -- Criar política para atualização (apenas admins)
        CREATE POLICY "Admins can update clinics" ON public.clinics
            FOR UPDATE USING (public.is_lify_admin(auth.uid()));
    END IF;
    
    -- Verificar se a tabela clinic_users já existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clinic_users') THEN
        -- Criar tabela de relacionamento usuário-clínica
        CREATE TABLE public.clinic_users (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
            role user_role NOT NULL DEFAULT 'atendente',
            is_active boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now(),
            UNIQUE(user_id, clinic_id)
        );
        
        -- Habilitar RLS
        ALTER TABLE public.clinic_users ENABLE ROW LEVEL SECURITY;
        
        -- Criar política para visualização
        CREATE POLICY "Users can view clinic users" ON public.clinic_users
            FOR SELECT USING (
                public.is_lify_admin(auth.uid()) OR
                user_id = auth.uid()
            );
    END IF;
    
    -- Inserir clínica padrão se não existir
    IF NOT EXISTS (SELECT FROM public.clinics WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        INSERT INTO public.clinics (id, name, is_active) 
        VALUES ('00000000-0000-0000-0000-000000000001', 'Clínica Principal', true);
    END IF;
    
    -- Associar usuários existentes à clínica padrão se ainda não estão associados
    INSERT INTO public.clinic_users (user_id, clinic_id, role)
    SELECT id, '00000000-0000-0000-0000-000000000001', role::user_role
    FROM public.user_profiles
    WHERE NOT EXISTS (
        SELECT 1 FROM public.clinic_users 
        WHERE user_id = user_profiles.id
    );
    
END $$;

-- Adicionar permissão 'clinicas' para admins e suporte_lify
INSERT INTO public.user_permissions (user_id, module_name, can_access)
SELECT 
    up.id, 
    'clinicas' as module_name, 
    true as can_access
FROM public.user_profiles up
WHERE up.role IN ('admin', 'suporte_lify')
AND NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = up.id AND module_name = 'clinicas'
);
