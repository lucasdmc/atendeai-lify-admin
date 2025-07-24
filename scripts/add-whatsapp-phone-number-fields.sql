-- Migração para adicionar campos de número de telefone WhatsApp
-- Data: 2025-07-23
-- Descrição: Adiciona campos para gerenciar número de telefone por clínica
-- Adicionar campos de número de telefone WhatsApp
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS whatsapp_phone_number_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS whatsapp_phone_number_verification_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS whatsapp_phone_number_verification_status VARCHAR(50) DEFAULT 'pending';
-- Adicionar comentários para documentação
COMMENT ON COLUMN clinics.whatsapp_phone_number IS 'Número de telefone WhatsApp da clínica (formato internacional: +5511999999999)';
COMMENT ON COLUMN clinics.whatsapp_phone_number_verified IS 'Indica se o número foi verificado na Meta Business';
COMMENT ON COLUMN clinics.whatsapp_phone_number_verification_date IS 'Data/hora da verificação do número';
COMMENT ON COLUMN clinics.whatsapp_phone_number_verification_status IS 'Status da verificação: pending, verified, failed, unverified';
-- Criar índice para busca por número de telefone
CREATE INDEX IF NOT EXISTS idx_clinics_whatsapp_phone_number ON clinics(whatsapp_phone_number);
-- Adicionar constraint de unicidade para número de telefone (permitindo NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinics_whatsapp_phone_number_unique ON clinics(whatsapp_phone_number)
WHERE whatsapp_phone_number IS NOT NULL;
-- Atualizar RLS (Row Level Security) se necessário
-- Nota: RLS já deve estar configurado para a tabela clinics
-- Verificar se a migração foi aplicada corretamente
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'clinics'
    AND column_name LIKE 'whatsapp_phone_number%'
ORDER BY column_name;