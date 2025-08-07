-- Adicionar campo simulation_mode na tabela clinics
-- Data: 2025-01-15
-- Descrição: Adiciona campo para controlar modo de simulação do chatbot

-- Adicionar coluna simulation_mode
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS simulation_mode BOOLEAN DEFAULT FALSE;

-- Adicionar comentário para documentação
COMMENT ON COLUMN clinics.simulation_mode IS 'Controla se o chatbot está em modo simulação (true) ou produção (false)';

-- Criar índice para busca por modo de simulação
CREATE INDEX IF NOT EXISTS idx_clinics_simulation_mode ON clinics(simulation_mode);

-- Verificar se a migração foi aplicada corretamente
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'clinics'
    AND column_name = 'simulation_mode'; 