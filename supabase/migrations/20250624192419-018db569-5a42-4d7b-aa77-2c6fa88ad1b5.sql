
-- Tabela para gerenciar sessões de agendamento ativas
CREATE TABLE IF NOT EXISTS public.whatsapp_booking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  session_state TEXT NOT NULL DEFAULT 'idle', -- idle, awaiting_date, awaiting_time, awaiting_confirmation, completed
  selected_date DATE NULL,
  selected_time TIME NULL,
  selected_service TEXT NULL,
  customer_name TEXT NULL,
  customer_email TEXT NULL,
  session_data JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para horários de funcionamento da clínica
CREATE TABLE IF NOT EXISTS public.clinic_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo, 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  break_start_time TIME NULL,
  break_end_time TIME NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para exceções de horários (feriados, dias especiais)
CREATE TABLE IF NOT EXISTS public.clinic_availability_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exception_date DATE NOT NULL UNIQUE,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  custom_start_time TIME NULL,
  custom_end_time TIME NULL,
  reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir horários padrão da clínica (Segunda a Sexta: 8h às 18h, com pausa 12h às 13h)
INSERT INTO public.clinic_availability (day_of_week, start_time, end_time, slot_duration_minutes, break_start_time, break_end_time) VALUES
(1, '08:00', '18:00', 30, '12:00', '13:00'), -- Segunda
(2, '08:00', '18:00', 30, '12:00', '13:00'), -- Terça
(3, '08:00', '18:00', 30, '12:00', '13:00'), -- Quarta
(4, '08:00', '18:00', 30, '12:00', '13:00'), -- Quinta
(5, '08:00', '18:00', 30, '12:00', '13:00'), -- Sexta
(6, '08:00', '12:00', 30, NULL, NULL)        -- Sábado (meio período)
ON CONFLICT DO NOTHING;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION clean_expired_booking_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.whatsapp_booking_sessions 
  WHERE expires_at < now();
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_booking_session_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_booking_sessions_timestamp
  BEFORE UPDATE ON public.whatsapp_booking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_session_timestamp();

-- RLS para as novas tabelas
ALTER TABLE public.whatsapp_booking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_availability_exceptions ENABLE ROW LEVEL SECURITY;

-- Policies para permitir acesso público (gerenciado via edge functions)
CREATE POLICY "Allow public access to booking sessions" ON public.whatsapp_booking_sessions FOR ALL USING (true);
CREATE POLICY "Allow public access to clinic availability" ON public.clinic_availability FOR ALL USING (true);
CREATE POLICY "Allow public access to availability exceptions" ON public.clinic_availability_exceptions FOR ALL USING (true);
