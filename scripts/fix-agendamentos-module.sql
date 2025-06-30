-- Script para corrigir e configurar o módulo de Agendamentos
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela google_tokens existe, se não, criar
CREATE TABLE IF NOT EXISTS public.google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  google_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- 2. Verificar se a tabela user_calendars existe, se não, criar
CREATE TABLE IF NOT EXISTS public.user_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  google_calendar_id TEXT NOT NULL, -- ID do calendário no Google
  calendar_name TEXT NOT NULL, -- Nome amigável do calendário
  calendar_color TEXT DEFAULT '#4285f4', -- Cor do calendário
  is_primary BOOLEAN DEFAULT false, -- Calendário principal do usuário
  is_active BOOLEAN DEFAULT true, -- Se está ativo
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, google_calendar_id)
);

-- 3. Verificar se a tabela calendar_events existe, se não, criar
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_calendar_id UUID REFERENCES public.user_calendars(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL, -- ID do evento no Google
  calendar_id TEXT NOT NULL, -- ID do calendário no Google
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees JSONB, -- Array de participantes
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, google_event_id)
);

-- 4. Verificar se a tabela calendar_sync_logs existe, se não, criar
CREATE TABLE IF NOT EXISTS public.calendar_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_calendar_id UUID REFERENCES public.user_calendars(id) ON DELETE CASCADE NOT NULL,
  sync_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'sync'
  event_id TEXT, -- Google Event ID
  status TEXT NOT NULL, -- 'success', 'error', 'pending'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON public.google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON public.user_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendars_google_id ON public.user_calendars(google_calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON public.calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_calendar_id ON public.calendar_sync_logs(user_calendar_id);

-- 6. Configurar RLS (Row Level Security)
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas de segurança para google_tokens
DROP POLICY IF EXISTS "Users can view own google tokens" ON public.google_tokens;
CREATE POLICY "Users can view own google tokens" ON public.google_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own google tokens" ON public.google_tokens;
CREATE POLICY "Users can insert own google tokens" ON public.google_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own google tokens" ON public.google_tokens;
CREATE POLICY "Users can update own google tokens" ON public.google_tokens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own google tokens" ON public.google_tokens;
CREATE POLICY "Users can delete own google tokens" ON public.google_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Criar políticas de segurança para user_calendars
DROP POLICY IF EXISTS "Users can view own calendars" ON public.user_calendars;
CREATE POLICY "Users can view own calendars" ON public.user_calendars
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own calendars" ON public.user_calendars;
CREATE POLICY "Users can insert own calendars" ON public.user_calendars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calendars" ON public.user_calendars;
CREATE POLICY "Users can update own calendars" ON public.user_calendars
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calendars" ON public.user_calendars;
CREATE POLICY "Users can delete own calendars" ON public.user_calendars
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Criar políticas de segurança para calendar_events
DROP POLICY IF EXISTS "Users can view own calendar events" ON public.calendar_events;
CREATE POLICY "Users can view own calendar events" ON public.calendar_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own calendar events" ON public.calendar_events;
CREATE POLICY "Users can insert own calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
CREATE POLICY "Users can update own calendar events" ON public.calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;
CREATE POLICY "Users can delete own calendar events" ON public.calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Criar políticas de segurança para calendar_sync_logs
DROP POLICY IF EXISTS "Users can view own sync logs" ON public.calendar_sync_logs;
CREATE POLICY "Users can view own sync logs" ON public.calendar_sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_calendars 
      WHERE user_calendars.id = calendar_sync_logs.user_calendar_id 
      AND user_calendars.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own sync logs" ON public.calendar_sync_logs;
CREATE POLICY "Users can insert own sync logs" ON public.calendar_sync_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_calendars 
      WHERE user_calendars.id = calendar_sync_logs.user_calendar_id 
      AND user_calendars.user_id = auth.uid()
    )
  );

-- 11. Verificar se as funções necessárias existem
-- (As funções serão criadas via Edge Functions)

-- 12. Log de conclusão
SELECT '✅ Módulo de Agendamentos configurado com sucesso!' as status; 