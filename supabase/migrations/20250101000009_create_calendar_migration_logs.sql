-- Migration para criar tabela de logs de migração de calendários
-- Execute: supabase db push --linked --include-all

-- Criar tabela de logs de migração
CREATE TABLE IF NOT EXISTS public.calendar_migration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  calendars_migrated INTEGER NOT NULL DEFAULT 0,
  migration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_calendar_migration_logs_user_id 
ON public.calendar_migration_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_migration_logs_clinic_id 
ON public.calendar_migration_logs(clinic_id);

CREATE INDEX IF NOT EXISTS idx_calendar_migration_logs_status 
ON public.calendar_migration_logs(status);

CREATE INDEX IF NOT EXISTS idx_calendar_migration_logs_date 
ON public.calendar_migration_logs(migration_date);

-- Habilita Row Level Security
ALTER TABLE public.calendar_migration_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Users can view their own migration logs" ON public.calendar_migration_logs;
CREATE POLICY "Users can view their own migration logs"
  ON public.calendar_migration_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas para usuários admin
DROP POLICY IF EXISTS "Admin users can view all migration logs" ON public.calendar_migration_logs;
CREATE POLICY "Admin users can view all migration logs"
  ON public.calendar_migration_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role IN ('admin_lify', 'suporte_lify')
    )
  );

-- Comentário explicativo
COMMENT ON TABLE public.calendar_migration_logs IS 'Logs de migração de calendários para associação com clínicas';
COMMENT ON COLUMN public.calendar_migration_logs.user_id IS 'ID do usuário cujos calendários foram migrados';
COMMENT ON COLUMN public.calendar_migration_logs.clinic_id IS 'ID da clínica para qual os calendários foram migrados';
COMMENT ON COLUMN public.calendar_migration_logs.calendars_migrated IS 'Quantidade de calendários migrados';
COMMENT ON COLUMN public.calendar_migration_logs.status IS 'Status da migração: pending, in_progress, completed, failed';
