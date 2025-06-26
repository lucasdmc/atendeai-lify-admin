
-- Adicionar a permissão 'agentes' para todos os usuários admin e suporte_lify existentes
-- Usando 'id' ao invés de 'user_id' na tabela user_profiles
INSERT INTO public.user_permissions (user_id, module_name, can_access)
SELECT 
    up.id, 
    'agentes' as module_name, 
    true as can_access
FROM public.user_profiles up
WHERE up.role IN ('admin', 'suporte_lify')
AND NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = up.id AND module_name = 'agentes'
);
