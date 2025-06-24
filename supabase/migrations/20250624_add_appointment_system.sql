
-- Tabela para solicitações de aprovação de agendamentos
CREATE TABLE IF NOT EXISTS appointment_approval_requests (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('cancel', 'reschedule', 'new_appointment')),
  phone_number TEXT NOT NULL,
  customer_name TEXT,
  original_appointment JSONB,
  new_appointment_data JSONB,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by TEXT DEFAULT 'whatsapp_bot',
  processed_by UUID REFERENCES user_profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para notificações internas para atendentes
CREATE TABLE IF NOT EXISTS internal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  approval_id TEXT REFERENCES appointment_approval_requests(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_phone ON appointment_approval_requests(phone_number);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON appointment_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type ON appointment_approval_requests(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON internal_notifications(user_id, read_at) WHERE read_at IS NULL;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_approval_requests_timestamp
  BEFORE UPDATE ON appointment_approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_timestamp();

-- Inserir configurações padrão de disponibilidade se não existirem
INSERT INTO clinic_availability (day_of_week, start_time, end_time, slot_duration_minutes, break_start_time, break_end_time, is_active)
VALUES 
  (1, '08:00', '18:00', 30, '12:00', '13:00', true), -- Segunda
  (2, '08:00', '18:00', 30, '12:00', '13:00', true), -- Terça
  (3, '08:00', '18:00', 30, '12:00', '13:00', true), -- Quarta
  (4, '08:00', '18:00', 30, '12:00', '13:00', true), -- Quinta
  (5, '08:00', '17:00', 30, '12:00', '13:00', true)  -- Sexta
ON CONFLICT (day_of_week) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE appointment_approval_requests IS 'Solicitações de aprovação para agendamentos, cancelamentos e reagendamentos via WhatsApp';
COMMENT ON TABLE internal_notifications IS 'Notificações internas para atendentes sobre solicitações de aprovação';
