-- ========================================
-- TESTE DAS FUNÇÕES APÓS RESET
-- ========================================
-- Execute este script no Supabase Dashboard > SQL Editor

-- Teste 1: Verificar se as tabelas foram criadas
SELECT 'Tabelas Base:' as tipo, COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clinics', 'users', 'user_profiles', 'sessions')
UNION ALL
SELECT 'Tabelas AI:' as tipo, COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%';

-- Teste 2: Verificar se as funções foram criadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'get_%'
ORDER BY routine_name;

-- Teste 3: Testar função de cache (deve retornar vazio pois não há dados)
SELECT * FROM get_cache_stats();

-- Teste 4: Testar função de streaming (deve retornar vazio pois não há dados)
SELECT * FROM get_streaming_stats();

-- Teste 5: Testar função de analytics (deve retornar vazio pois não há dados)
SELECT * FROM get_analytics_stats();

-- Teste 6: Verificar dados iniciais
SELECT 'Clinics:' as tabela, COUNT(*) as total FROM clinics
UNION ALL
SELECT 'Users:' as tabela, COUNT(*) as total FROM users;

-- Teste 7: Verificar estrutura da tabela clinics
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Teste 8: Verificar se a extensão pgvector está instalada
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Teste 9: Verificar permissões
SELECT table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
AND table_schema = 'public' 
AND table_name LIKE 'ai_%'
ORDER BY table_name, privilege_type;

-- Teste 10: Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ TESTES CONCLUÍDOS COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Se você viu os resultados acima, o reset foi bem-sucedido!';
    RAISE NOTICE '========================================';
END $$; 