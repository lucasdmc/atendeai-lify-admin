// Script para executar via Supabase Dashboard SQL Editor
// Copie e cole este conteúdo no SQL Editor do Supabase Dashboard

const sqlToExecute = `
-- Script para configurar estrutura melhorada de WhatsApp
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Criar tabela clinic_whatsapp_numbers
CREATE TABLE IF NOT EXISTS clinic_whatsapp_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  whatsapp_number VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(clinic_id, whatsapp_number)
);

-- 2. Criar tabela whatsapp_conversations_improved
CREATE TABLE IF NOT EXISTS whatsapp_conversations_improved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_phone_number VARCHAR(20) NOT NULL,
  clinic_whatsapp_number VARCHAR(20) NOT NULL,
  patient_name VARCHAR(255),
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(clinic_id, patient_phone_number, clinic_whatsapp_number)
);

-- 3. Criar tabela whatsapp_messages_improved
CREATE TABLE IF NOT EXISTS whatsapp_messages_improved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations_improved(id) ON DELETE CASCADE,
  sender_phone VARCHAR(20) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('received', 'sent')),
  whatsapp_message_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_numbers_clinic ON clinic_whatsapp_numbers(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_numbers_active ON clinic_whatsapp_numbers(is_active);
CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_numbers_number ON clinic_whatsapp_numbers(whatsapp_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_improved_clinic ON whatsapp_conversations_improved(clinic_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_improved_patient ON whatsapp_conversations_improved(patient_phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_improved_clinic_number ON whatsapp_conversations_improved(clinic_whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_improved_last_message ON whatsapp_conversations_improved(last_message_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_improved_conversation ON whatsapp_messages_improved(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_improved_sender ON whatsapp_messages_improved(sender_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_improved_receiver ON whatsapp_messages_improved(receiver_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_improved_created ON whatsapp_messages_improved(created_at);

-- 5. Configurar RLS
ALTER TABLE clinic_whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations_improved ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages_improved ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
CREATE POLICY "Users can view clinic whatsapp numbers" ON clinic_whatsapp_numbers FOR SELECT USING (true);
CREATE POLICY "Users can insert clinic whatsapp numbers" ON clinic_whatsapp_numbers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update clinic whatsapp numbers" ON clinic_whatsapp_numbers FOR UPDATE USING (true);

CREATE POLICY "Users can view improved conversations" ON whatsapp_conversations_improved FOR SELECT USING (true);
CREATE POLICY "Users can insert improved conversations" ON whatsapp_conversations_improved FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update improved conversations" ON whatsapp_conversations_improved FOR UPDATE USING (true);

CREATE POLICY "Users can view improved messages" ON whatsapp_messages_improved FOR SELECT USING (true);
CREATE POLICY "Users can insert improved messages" ON whatsapp_messages_improved FOR INSERT WITH CHECK (true);

-- 7. Inserir dados de teste
INSERT INTO clinic_whatsapp_numbers (clinic_id, whatsapp_number, is_active) VALUES
('4a73f615-b636-4134-8937-c20b5db5acac', '554730915628', true),
('9b11dfd6-d638-48e3-bc84-f3880f987da2', '5547999999999', true)
ON CONFLICT (clinic_id, whatsapp_number) DO NOTHING;

-- 8. Migrar conversas existentes
INSERT INTO whatsapp_conversations_improved (
  clinic_id,
  patient_phone_number,
  clinic_whatsapp_number,
  patient_name,
  last_message_preview,
  unread_count,
  last_message_at,
  created_at,
  updated_at
)
SELECT 
  '4a73f615-b636-4134-8937-c20b5db5acac' as clinic_id,
  phone_number as patient_phone_number,
  '554730915628' as clinic_whatsapp_number,
  name as patient_name,
  last_message_preview,
  COALESCE(unread_count, 0) as unread_count,
  COALESCE(updated_at, created_at) as last_message_at,
  created_at,
  updated_at
FROM whatsapp_conversations
WHERE phone_number != '554730915628'  -- Não migrar conversas do próprio número da clínica
ON CONFLICT (clinic_id, patient_phone_number, clinic_whatsapp_number) DO NOTHING;

-- 9. Verificar se tudo foi criado
SELECT 'Estrutura melhorada criada com sucesso!' as status;
`;

console.log('📋 SQL PARA EXECUTAR NO SUPABASE DASHBOARD:');
console.log('============================================');
console.log(sqlToExecute);
console.log('\n📋 INSTRUÇÕES:');
console.log('1. Acesse: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi');
console.log('2. Vá para SQL Editor');
console.log('3. Cole o SQL acima e execute');
console.log('4. Volte aqui e execute: node scripts/test-improved-structure.js'); 