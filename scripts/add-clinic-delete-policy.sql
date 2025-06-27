-- Script para adicionar política de exclusão de clínicas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics';

-- 2. Remover política antiga se existir
DROP POLICY IF EXISTS "Admins can delete clinics" ON public.clinics;

-- 3. Criar nova política para exclusão
CREATE POLICY "Admin Lify can delete clinics" ON public.clinics
    FOR DELETE USING (
        public.is_admin_lify(auth.uid())
    );

-- 4. Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics' AND cmd = 'DELETE';

-- 5. Testar a função is_admin_lify (substitua pelo ID do usuário atual)
-- SELECT public.is_admin_lify('seu-user-id-aqui');

-- 6. Verificar todas as políticas da tabela clinics
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics'
ORDER BY cmd; 