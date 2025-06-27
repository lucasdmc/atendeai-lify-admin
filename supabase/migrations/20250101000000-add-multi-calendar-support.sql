-- Migração para suporte a múltiplos calendários Google
-- Data: 2025-01-01

-- 1. Criar tabela para calendários dos usuários
CREATE TABLE public.user_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
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

-- 2. Adicionar coluna na tabela calendar_events
ALTER TABLE public.calendar_events 
ADD COLUMN user_calendar_id UUID REFERENCES public.user_calendars(id);

-- 3. Criar tabela para logs de sincronização
CREATE TABLE public.calendar_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_calendar_id UUID REFERENCES public.user_calendars(id) NOT NULL,
  sync_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'sync'
  event_id TEXT, -- Google Event ID
  status TEXT NOT NULL, -- 'success', 'error', 'pending'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Criar índices para performance
CREATE INDEX idx_user_calendars_user_id ON public.user_calendars(user_id);
CREATE INDEX idx_user_calendars_primary ON public.user_calendars(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_calendar_events_user_calendar ON public.calendar_events(user_calendar_id);
CREATE INDEX idx_calendar_sync_logs_calendar ON public.calendar_sync_logs(user_calendar_id);
CREATE INDEX idx_calendar_sync_logs_created ON public.calendar_sync_logs(created_at);

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE public.user_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para user_calendars
CREATE POLICY "Users can view their own calendars" 
  ON public.user_calendars 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendars" 
  ON public.user_calendars 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendars" 
  ON public.user_calendars 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendars" 
  ON public.user_calendars 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 7. Políticas RLS para calendar_sync_logs
CREATE POLICY "Users can view their own sync logs" 
  ON public.calendar_sync_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_calendars 
      WHERE user_calendars.id = calendar_sync_logs.user_calendar_id 
      AND user_calendars.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sync logs" 
  ON public.calendar_sync_logs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_calendars 
      WHERE user_calendars.id = calendar_sync_logs.user_calendar_id 
      AND user_calendars.user_id = auth.uid()
    )
  );

-- 8. Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_user_calendars_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para atualizar timestamp automaticamente
CREATE TRIGGER update_user_calendars_timestamp_trigger
  BEFORE UPDATE ON public.user_calendars
  FOR EACH ROW
  EXECUTE FUNCTION update_user_calendars_timestamp();

-- 10. Migração de dados existentes (se houver)
-- Criar calendário padrão para usuários que já têm tokens
INSERT INTO public.user_calendars (
  user_id,
  google_calendar_id,
  calendar_name,
  calendar_color,
  is_primary,
  is_active,
  access_token,
  refresh_token,
  expires_at
)
SELECT 
  user_id,
  'primary' as google_calendar_id,
  'Calendário Principal' as calendar_name,
  '#4285f4' as calendar_color,
  true as is_primary,
  true as is_active,
  access_token,
  refresh_token,
  expires_at
FROM public.google_calendar_tokens
ON CONFLICT (user_id, google_calendar_id) DO NOTHING;

-- 11. Atualizar eventos existentes para usar o novo calendário
UPDATE public.calendar_events 
SET user_calendar_id = (
  SELECT id FROM public.user_calendars 
  WHERE user_calendars.user_id = calendar_events.user_id 
  AND user_calendars.is_primary = true
)
WHERE user_calendar_id IS NULL; 