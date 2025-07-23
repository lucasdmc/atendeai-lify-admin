-- Script para adicionar constraint única na tabela google_tokens
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos limpar possíveis duplicatas (caso existam)
DELETE FROM public.google_tokens 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM public.google_tokens 
    GROUP BY user_id
);

-- 2. Adicionar a constraint única
ALTER TABLE public.google_tokens 
ADD CONSTRAINT google_tokens_user_id_unique UNIQUE (user_id);

-- 3. Verificar se a constraint foi criada
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'google_tokens' 
  AND table_schema = 'public'
  AND constraint_type = 'UNIQUE';

-- 4. Testar um upsert para confirmar que funciona
-- (Este comando deve executar sem erro)
INSERT INTO public.google_tokens (user_id, access_token, expires_at, scope)
VALUES ('00000000-0000-0000-0000-000000000000', 'test_token', NOW() + INTERVAL '1 hour', 'test')
ON CONFLICT (user_id) 
DO UPDATE SET 
    access_token = EXCLUDED.access_token,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();

-- 5. Limpar o registro de teste
DELETE FROM public.google_tokens 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- ✅ Pronto! Agora a tabela google_tokens tem constraint única e suporta upsert 