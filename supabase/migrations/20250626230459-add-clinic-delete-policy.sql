-- Adicionar política para exclusão de clínicas
-- Apenas admin_lify pode excluir clínicas

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Admins can delete clinics" ON public.clinics;

-- Criar nova política para exclusão
CREATE POLICY "Admin Lify can delete clinics" ON public.clinics
    FOR DELETE USING (
        public.is_admin_lify(auth.uid())
    );

-- Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics' AND cmd = 'DELETE'; 