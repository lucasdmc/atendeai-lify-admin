-- Script para corrigir sistema de usuários e profiles
-- Execute via Supabase Dashboard SQL Editor

-- 1. Verificar estrutura atual da tabela user_profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Adicionar colunas que podem estar faltando
DO $$ 
BEGIN
  -- Adicionar coluna timezone se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'timezone') THEN
    ALTER TABLE public.user_profiles ADD COLUMN timezone TEXT DEFAULT 'America/Sao_Paulo';
  END IF;

  -- Adicionar coluna language se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'language') THEN
    ALTER TABLE public.user_profiles ADD COLUMN language TEXT DEFAULT 'pt-BR';
  END IF;

  -- Adicionar coluna updated_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;

  -- Adicionar coluna avatar_url se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Adicionar coluna phone se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.user_profiles ADD COLUMN phone TEXT;
  END IF;

  -- Adicionar coluna address se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'address') THEN
    ALTER TABLE public.user_profiles ADD COLUMN address JSONB;
  END IF;

  -- Adicionar coluna preferences se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferences') THEN
    ALTER TABLE public.user_profiles ADD COLUMN preferences JSONB DEFAULT '{}';
  END IF;
END $$;

-- 3. Atualizar timezone e language para usuários que não possuem
UPDATE public.user_profiles 
SET 
  timezone = 'America/Sao_Paulo',
  language = 'pt-BR'
WHERE timezone IS NULL OR language IS NULL;

-- 4. Verificar usuários sem clínica (que precisam de uma)
SELECT 
  id,
  name,
  email,
  role,
  clinic_id,
  status
FROM public.user_profiles 
WHERE clinic_id IS NULL 
  AND role NOT IN ('admin_lify', 'suporte_lify')
ORDER BY name;

-- 5. Associar usuários sem clínica à primeira clínica disponível (se necessário)
UPDATE public.user_profiles 
SET clinic_id = (
  SELECT id FROM public.clinics WHERE name = 'Lify' LIMIT 1
)
WHERE clinic_id IS NULL 
  AND role NOT IN ('admin_lify', 'suporte_lify');

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);

-- 7. Habilitar Row Level Security (se não estiver habilitado)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas de segurança
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_lify', 'suporte_lify')
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_lify', 'suporte_lify')
    )
  );

-- 9. Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_user_profiles_updated_at();

-- 11. Função para validar dados do usuário
CREATE OR REPLACE FUNCTION validate_user_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar nome não vazio
  IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
    RAISE EXCEPTION 'Nome do usuário é obrigatório';
  END IF;

  -- Validar email não vazio
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RAISE EXCEPTION 'Email do usuário é obrigatório';
  END IF;

  -- Validar role válido
  IF NEW.role NOT IN ('admin_lify', 'suporte_lify', 'admin', 'gestor', 'atendente') THEN
    RAISE EXCEPTION 'Role deve ser um valor válido';
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

-- 12. Trigger para validar dados
DROP TRIGGER IF EXISTS validate_user_profile_data ON public.user_profiles;
CREATE TRIGGER validate_user_profile_data 
  BEFORE INSERT OR UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION validate_user_profile_data();

-- 13. Verificar resultado final
SELECT 
  id,
  name,
  email,
  role,
  clinic_id,
  status,
  timezone,
  language,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC; 