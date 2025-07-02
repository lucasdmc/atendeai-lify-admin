-- Migration para criar tabelas ausentes identificadas no debug
-- Execute: supabase db push --linked --include-all

-- 1. Tabela de logs de sincronização de calendário
CREATE TABLE IF NOT EXISTS public.calendar_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_calendar_id UUID REFERENCES public.user_calendars(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela de eventos salvos do calendário
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  google_event_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  summary TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabela de clínicas (se não existir)
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de usuários do sistema (se não existir)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabela de conversas (se não existir)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabela de mensagens (se não existir)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'system',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Tabela de agendamentos (se não existir)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_user_id ON public.calendar_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_user_calendar_id ON public.calendar_sync_logs(user_calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id ON public.calendar_events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_clinics_created_by ON public.clinics(created_by);
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON public.users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_id ON public.conversations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);

-- 9. Habilitar Row Level Security
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas básicas de segurança
-- Calendar sync logs
CREATE POLICY "Users can view own sync logs" ON public.calendar_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs" ON public.calendar_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Calendar events
CREATE POLICY "Users can view own calendar events" ON public.calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON public.calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Clinics
CREATE POLICY "Users can view clinics" ON public.clinics
  FOR SELECT USING (true);

CREATE POLICY "Users can insert clinics" ON public.clinics
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own clinics" ON public.clinics
  FOR UPDATE USING (auth.uid() = created_by);

-- Users
CREATE POLICY "Users can view users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own users" ON public.users
  FOR UPDATE USING (auth.uid() = created_by);

-- Conversations
CREATE POLICY "Users can view conversations" ON public.conversations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = created_by);

-- Messages
CREATE POLICY "Users can view messages" ON public.messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Appointments
CREATE POLICY "Users can view appointments" ON public.appointments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = created_by); 