
-- Verificar o usuário admin atual
SELECT id, name, role FROM public.user_profiles WHERE role = 'admin';

-- Verificar permissões do usuário admin
SELECT up.user_id, prof.name, prof.role, up.module_name, up.can_access 
FROM public.user_permissions up
JOIN public.user_profiles prof ON prof.id = up.user_id
WHERE prof.role = 'admin'
ORDER BY up.user_id, up.module_name;

-- Garantir que o usuário admin tenha todas as permissões
INSERT INTO public.user_permissions (user_id, module_name, can_access) 
SELECT 
    prof.id,
    modules.module_name,
    true
FROM public.user_profiles prof
CROSS JOIN (VALUES 
    ('dashboard'),
    ('conversas'),
    ('conectar_whatsapp'),
    ('contextualizar'),
    ('gestao_usuarios'),
    ('configuracoes')
) AS modules(module_name)
WHERE prof.role = 'admin'
ON CONFLICT (user_id, module_name) DO UPDATE SET can_access = true;
