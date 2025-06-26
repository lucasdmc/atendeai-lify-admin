
-- Adicionar permissão 'clinicas' para o role 'admin'
INSERT INTO public.role_permissions (role, module_name, can_access) 
VALUES ('admin', 'clinicas', true)
ON CONFLICT (role, module_name) DO UPDATE SET can_access = EXCLUDED.can_access;

-- Atualizar as permissões dos usuários existentes com role 'admin'
INSERT INTO public.user_permissions (user_id, module_name, can_access)
SELECT 
    up.id, 
    'clinicas' as module_name, 
    true as can_access
FROM public.user_profiles up
WHERE up.role = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = up.id AND module_name = 'clinicas'
);
