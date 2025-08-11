-- Migration para adicionar clinic_id à tabela user_calendars
-- Execute: supabase db push --linked --include-all

-- Adicionar coluna clinic_id à tabela user_calendars
ALTER TABLE public.user_calendars 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_user_calendars_clinic_id 
ON public.user_calendars(clinic_id);

-- Atualizar políticas de segurança para incluir clinic_id
DROP POLICY IF EXISTS "Users can view their own calendars" ON public.user_calendars;
CREATE POLICY "Users can view their own calendars"
  ON public.user_calendars
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.clinic_id = user_calendars.clinic_id
    )
  );

-- Política para usuários admin que podem ver todos os calendários
DROP POLICY IF EXISTS "Admin users can view all calendars" ON public.user_calendars;
CREATE POLICY "Admin users can view all calendars"
  ON public.user_calendars
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin_lify', 'suporte_lify')
    )
  );

-- Comentário explicativo
COMMENT ON COLUMN public.user_calendars.clinic_id IS 'ID da clínica associada ao calendário. NULL significa calendário pessoal do usuário.';
