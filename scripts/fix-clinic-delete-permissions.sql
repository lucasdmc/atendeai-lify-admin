-- Script para corrigir permissões de exclusão de clínicas
-- Execute este script diretamente no editor SQL do Supabase

-- 1. Adicionar permissão específica para deletar clínicas
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete)
VALUES 
  ('admin_lify', 'deletar_clinicas', true, true, true, true, true)
ON CONFLICT (role, module_name) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  can_create = EXCLUDED.can_create,
  can_read = EXCLUDED.can_read,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete;

-- 2. Verificar se a política de DELETE existe
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics' AND cmd = 'DELETE';

-- 3. Se não existir, criar a política de DELETE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clinics' AND cmd = 'DELETE'
    ) THEN
        CREATE POLICY "Admin Lify can delete clinics" ON public.clinics
            FOR DELETE USING (
                public.is_admin_lify(auth.uid())
            );
        RAISE NOTICE 'Política de DELETE criada com sucesso';
    ELSE
        RAISE NOTICE 'Política de DELETE já existe';
    END IF;
END $$;

-- 4. Verificar se a função is_admin_lify existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'is_admin_lify';

-- 5. Testar a função is_admin_lify (substitua pelo ID do usuário atual)
-- SELECT public.is_admin_lify('seu-user-id-aqui');

-- 6. Verificar todas as políticas da tabela clinics
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics'
ORDER BY cmd;

-- 7. Verificar permissões do admin_lify
SELECT role, module_name, can_access, can_create, can_read, can_update, can_delete
FROM role_permissions 
WHERE role = 'admin_lify' 
ORDER BY module_name; 