-- Criar tabela user_calendars se não existir
CREATE TABLE IF NOT EXISTS user_calendars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_calendar_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_name TEXT,
  calendar_color TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, google_calendar_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendars_google_calendar_id ON user_calendars(google_calendar_id);

-- Habilitar RLS
ALTER TABLE user_calendars ENABLE ROW LEVEL SECURITY;

-- Política RLS para user_calendars
CREATE POLICY IF NOT EXISTS "Users can view their own calendars" ON user_calendars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own calendars" ON user_calendars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own calendars" ON user_calendars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own calendars" ON user_calendars
  FOR DELETE USING (auth.uid() = user_id);

-- Criar tabela calendar_sync_logs se não existir
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_calendar_id UUID REFERENCES user_calendars(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para calendar_sync_logs
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- Política RLS para calendar_sync_logs
CREATE POLICY IF NOT EXISTS "Users can view their own sync logs" ON calendar_sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_calendars 
      WHERE user_calendars.id = calendar_sync_logs.user_calendar_id 
      AND user_calendars.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert their own sync logs" ON calendar_sync_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_calendars 
      WHERE user_calendars.id = calendar_sync_logs.user_calendar_id 
      AND user_calendars.user_id = auth.uid()
    )
  ); 