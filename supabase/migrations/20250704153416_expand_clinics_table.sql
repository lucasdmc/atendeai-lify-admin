-- Expandir tabela clinics com campos avançados
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS working_hours TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS payment_methods TEXT[],
ADD COLUMN IF NOT EXISTS insurance_accepted TEXT[],
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'pt-BR';

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_clinics_specialties 
ON clinics USING GIN(specialties);

CREATE INDEX IF NOT EXISTS idx_clinics_payment_methods 
ON clinics USING GIN(payment_methods);

CREATE INDEX IF NOT EXISTS idx_clinics_insurance_accepted 
ON clinics USING GIN(insurance_accepted);

CREATE INDEX IF NOT EXISTS idx_clinics_timezone 
ON clinics(timezone);

-- Adicionar comentários para documentação
COMMENT ON COLUMN clinics.working_hours IS 'Horários de funcionamento da clínica';
COMMENT ON COLUMN clinics.specialties IS 'Array de especialidades médicas';
COMMENT ON COLUMN clinics.payment_methods IS 'Array de métodos de pagamento aceitos';
COMMENT ON COLUMN clinics.insurance_accepted IS 'Array de convênios aceitos';
COMMENT ON COLUMN clinics.emergency_contact IS 'Contato de emergência';
COMMENT ON COLUMN clinics.admin_notes IS 'Notas administrativas';
COMMENT ON COLUMN clinics.logo_url IS 'URL do logo da clínica';
COMMENT ON COLUMN clinics.primary_color IS 'Cor primária da marca (hex)';
COMMENT ON COLUMN clinics.secondary_color IS 'Cor secundária da marca (hex)';
COMMENT ON COLUMN clinics.timezone IS 'Fuso horário da clínica';
COMMENT ON COLUMN clinics.language IS 'Idioma principal da clínica';
