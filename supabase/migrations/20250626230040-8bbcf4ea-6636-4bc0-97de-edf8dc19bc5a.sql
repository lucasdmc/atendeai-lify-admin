
-- Atualizar a política para permitir que admins também possam criar clínicas
DROP POLICY IF EXISTS "Admin Lify can create clinics" ON public.clinics;
CREATE POLICY "Admins can create clinics" ON public.clinics
    FOR INSERT WITH CHECK (
        public.is_admin_lify(auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Atualizar a política de atualização também
DROP POLICY IF EXISTS "Admin Lify can update clinics" ON public.clinics;
CREATE POLICY "Admins can update clinics" ON public.clinics
    FOR UPDATE USING (
        public.is_admin_lify(auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
