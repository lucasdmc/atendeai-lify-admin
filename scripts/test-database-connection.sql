-- ========================================
-- SCRIPT DE TESTE - CONEXÃO COM BANCO DE DADOS
-- ========================================

-- Teste 1: Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%'
ORDER BY table_name;

-- Teste 2: Verificar se as funções existem
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'get_%'
ORDER BY routine_name;

-- Teste 3: Verificar permissões do usuário atual
SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE grantee = current_user
AND table_schema = 'public'
AND table_name LIKE 'ai_%'
ORDER BY table_name, privilege_type;

-- Teste 4: Testar função de estatísticas (sem parâmetros)
SELECT * FROM get_cache_stats();

-- Teste 5: Testar função de streaming (sem parâmetros)
SELECT * FROM get_streaming_stats();

-- Teste 6: Testar função de analytics (sem parâmetros)
SELECT * FROM get_analytics_stats();

-- Teste 7: Verificar se a extensão pgvector está instalada
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'vector';

-- Teste 8: Verificar configurações do banco
SELECT 
    name,
    setting,
    unit
FROM pg_settings 
WHERE name IN ('shared_preload_libraries', 'max_connections', 'work_mem')
ORDER BY name;

-- Teste 9: Verificar espaço em disco
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename LIKE 'ai_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Teste 10: Verificar índices das tabelas AI
SELECT 
    t.table_name,
    i.indexname,
    i.indexdef
FROM pg_indexes i
JOIN information_schema.tables t ON i.tablename = t.table_name
WHERE t.table_schema = 'public'
AND t.table_name LIKE 'ai_%'
ORDER BY t.table_name, i.indexname; 