-- Script para adicionar coluna de última clínica selecionada
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Adicionar coluna last_selected_clinic_id na tabela user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'last_selected_clinic_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN last_selected_clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_user_profiles_last_selected_clinic ON public.user_profiles(last_selected_clinic_id);
    RAISE NOTICE 'Coluna last_selected_clinic_id adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna last_selected_clinic_id já existe';
  END IF;
END $$;

-- 2. Criar função para atualizar última clínica selecionada
CREATE OR REPLACE FUNCTION update_last_selected_clinic(
  p_user_id UUID,
  p_clinic_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar apenas para usuários admin_lify e suporte_lify
  UPDATE public.user_profiles 
  SET 
    last_selected_clinic_id = p_clinic_id,
    updated_at = NOW()
  WHERE user_id = p_user_id 
  AND role IN ('admin_lify', 'suporte_lify');
  
  -- Log da operação
  RAISE NOTICE 'Última clínica selecionada atualizada para usuário %: %', p_user_id, p_clinic_id;
END;
$$;

-- 3. Criar função para obter última clínica selecionada
CREATE OR REPLACE FUNCTION get_last_selected_clinic(
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- Buscar última clínica selecionada
  SELECT last_selected_clinic_id INTO v_clinic_id
  FROM public.user_profiles 
  WHERE user_id = p_user_id 
  AND role IN ('admin_lify', 'suporte_lify');
  
  RETURN v_clinic_id;
END;
$$;

-- 4. Criar função para obter primeira clínica disponível como fallback
CREATE OR REPLACE FUNCTION get_first_available_clinic()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- Buscar primeira clínica disponível
  SELECT id INTO v_clinic_id
  FROM public.clinics 
  ORDER BY name ASC 
  LIMIT 1;
  
  RETURN v_clinic_id;
END;
$$;

-- 5. Criar trigger para atualizar last_selected_clinic_id automaticamente
-- (opcional - pode ser usado no futuro se necessário)

-- 6. Verificar se as funções foram criadas corretamente
SELECT 
  'Funções criadas:' as status,
  COUNT(*) as total
FROM information_schema.routines 
WHERE routine_name IN ('update_last_selected_clinic', 'get_last_selected_clinic', 'get_first_available_clinic')
AND routine_schema = 'public';

-- 7. Verificar se a coluna foi adicionada
SELECT 
  'Coluna last_selected_clinic_id:' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      AND column_name = 'last_selected_clinic_id'
      AND table_schema = 'public'
    ) THEN 'Adicionada com sucesso'
    ELSE 'Não encontrada'
  END as status;

-- 8. Exemplo de uso das funções
-- SELECT update_last_selected_clinic('user-uuid-here', 'clinic-uuid-here');
-- SELECT get_last_selected_clinic('user-uuid-here');
-- SELECT get_first_available_clinic(); 