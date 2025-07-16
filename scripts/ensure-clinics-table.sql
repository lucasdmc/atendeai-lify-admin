-- Script para garantir que a tabela clinics tenha todas as colunas necessárias
-- Execute via Supabase Dashboard SQL Editor

-- 1. Criar tabela clinics se não existir
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address JSONB,
  phone JSONB,
  email JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  working_hours JSONB,
  specialties JSONB,
  payment_methods JSONB,
  insurance_accepted JSONB,
  emergency_contact JSONB,
  admin_notes TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR'
);

-- 2. Adicionar colunas que podem estar faltando (se não existirem)
DO $$ 
BEGIN
  -- Adicionar coluna address se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'address') THEN
    ALTER TABLE public.clinics ADD COLUMN address JSONB;
  END IF;

  -- Adicionar coluna phone se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'phone') THEN
    ALTER TABLE public.clinics ADD COLUMN phone JSONB;
  END IF;

  -- Adicionar coluna email se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'email') THEN
    ALTER TABLE public.clinics ADD COLUMN email JSONB;
  END IF;

  -- Adicionar coluna working_hours se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'working_hours') THEN
    ALTER TABLE public.clinics ADD COLUMN working_hours JSONB;
  END IF;

  -- Adicionar coluna specialties se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'specialties') THEN
    ALTER TABLE public.clinics ADD COLUMN specialties JSONB;
  END IF;

  -- Adicionar coluna payment_methods se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'payment_methods') THEN
    ALTER TABLE public.clinics ADD COLUMN payment_methods JSONB;
  END IF;

  -- Adicionar coluna insurance_accepted se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'insurance_accepted') THEN
    ALTER TABLE public.clinics ADD COLUMN insurance_accepted JSONB;
  END IF;

  -- Adicionar coluna emergency_contact se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'emergency_contact') THEN
    ALTER TABLE public.clinics ADD COLUMN emergency_contact JSONB;
  END IF;

  -- Adicionar coluna admin_notes se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'admin_notes') THEN
    ALTER TABLE public.clinics ADD COLUMN admin_notes TEXT;
  END IF;

  -- Adicionar coluna logo_url se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'logo_url') THEN
    ALTER TABLE public.clinics ADD COLUMN logo_url TEXT;
  END IF;

  -- Adicionar coluna primary_color se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'primary_color') THEN
    ALTER TABLE public.clinics ADD COLUMN primary_color TEXT;
  END IF;

  -- Adicionar coluna secondary_color se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'secondary_color') THEN
    ALTER TABLE public.clinics ADD COLUMN secondary_color TEXT;
  END IF;

  -- Adicionar coluna timezone se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'timezone') THEN
    ALTER TABLE public.clinics ADD COLUMN timezone TEXT DEFAULT 'America/Sao_Paulo';
  END IF;

  -- Adicionar coluna language se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'language') THEN
    ALTER TABLE public.clinics ADD COLUMN language TEXT DEFAULT 'pt-BR';
  END IF;

  -- Adicionar coluna updated_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = 'updated_at') THEN
    ALTER TABLE public.clinics ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clinics_created_by ON public.clinics(created_by);
CREATE INDEX IF NOT EXISTS idx_clinics_name ON public.clinics(name);
CREATE INDEX IF NOT EXISTS idx_clinics_created_at ON public.clinics(created_at);

-- 4. Habilitar Row Level Security
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança
DROP POLICY IF EXISTS "Users can view clinics" ON public.clinics;
CREATE POLICY "Users can view clinics" ON public.clinics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert clinics" ON public.clinics;
CREATE POLICY "Users can insert clinics" ON public.clinics
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update clinics" ON public.clinics;
CREATE POLICY "Users can update clinics" ON public.clinics
  FOR UPDATE USING (auth.uid() = created_by OR auth.jwt() ->> 'role' = 'admin_lify');

DROP POLICY IF EXISTS "Users can delete clinics" ON public.clinics;
CREATE POLICY "Users can delete clinics" ON public.clinics
  FOR DELETE USING (auth.uid() = created_by OR auth.jwt() ->> 'role' = 'admin_lify');

-- 6. Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_clinics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS update_clinics_updated_at ON public.clinics;
CREATE TRIGGER update_clinics_updated_at 
  BEFORE UPDATE ON public.clinics 
  FOR EACH ROW EXECUTE FUNCTION update_clinics_updated_at();

-- 8. Função para validar dados da clínica
CREATE OR REPLACE FUNCTION validate_clinic_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar nome não vazio
  IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
    RAISE EXCEPTION 'Nome da clínica é obrigatório';
  END IF;

  -- Validar timezone se fornecido
  IF NEW.timezone IS NOT NULL AND NEW.timezone NOT IN ('America/Sao_Paulo', 'America/New_York', 'Europe/London', 'Asia/Tokyo') THEN
    RAISE EXCEPTION 'Timezone deve ser um valor válido';
  END IF;

  -- Validar language se fornecido
  IF NEW.language IS NOT NULL AND NEW.language NOT IN ('pt-BR', 'en-US', 'es-ES') THEN
    RAISE EXCEPTION 'Language deve ser um valor válido';
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Trigger para validar dados
DROP TRIGGER IF EXISTS validate_clinic_data ON public.clinics;
CREATE TRIGGER validate_clinic_data 
  BEFORE INSERT OR UPDATE ON public.clinics 
  FOR EACH ROW EXECUTE FUNCTION validate_clinic_data();

-- 10. Comentários para documentação
COMMENT ON TABLE public.clinics IS 'Tabela de clínicas do sistema';
COMMENT ON COLUMN public.clinics.id IS 'ID único da clínica';
COMMENT ON COLUMN public.clinics.name IS 'Nome da clínica';
COMMENT ON COLUMN public.clinics.address IS 'Endereço da clínica (JSON)';
COMMENT ON COLUMN public.clinics.phone IS 'Telefone da clínica (JSON)';
COMMENT ON COLUMN public.clinics.email IS 'Email da clínica (JSON)';
COMMENT ON COLUMN public.clinics.created_by IS 'ID do usuário que criou a clínica';
COMMENT ON COLUMN public.clinics.working_hours IS 'Horário de funcionamento (JSON)';
COMMENT ON COLUMN public.clinics.specialties IS 'Especialidades da clínica (JSON)';
COMMENT ON COLUMN public.clinics.payment_methods IS 'Métodos de pagamento (JSON)';
COMMENT ON COLUMN public.clinics.insurance_accepted IS 'Convênios aceitos (JSON)';
COMMENT ON COLUMN public.clinics.emergency_contact IS 'Contato de emergência (JSON)';
COMMENT ON COLUMN public.clinics.admin_notes IS 'Notas administrativas';
COMMENT ON COLUMN public.clinics.logo_url IS 'URL do logo da clínica';
COMMENT ON COLUMN public.clinics.primary_color IS 'Cor primária da clínica';
COMMENT ON COLUMN public.clinics.secondary_color IS 'Cor secundária da clínica';
COMMENT ON COLUMN public.clinics.timezone IS 'Fuso horário da clínica';
COMMENT ON COLUMN public.clinics.language IS 'Idioma da clínica';
COMMENT ON COLUMN public.clinics.created_at IS 'Data de criação';
COMMENT ON COLUMN public.clinics.updated_at IS 'Data de última atualização';

-- 11. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clinics' 
ORDER BY ordinal_position; 