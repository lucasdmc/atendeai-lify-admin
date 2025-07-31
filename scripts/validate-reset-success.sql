-- ========================================
-- VALIDAÇÃO DO RESET COMPLETO
-- ========================================
-- Execute este script no Supabase Dashboard > SQL Editor
-- Para verificar se o reset foi executado corretamente

-- ========================================
-- TESTE 1: VERIFICAR TABELAS BASE
-- ========================================

SELECT 'TABELAS BASE:' as categoria, COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clinics', 'users', 'user_profiles', 'sessions');

-- ========================================
-- TESTE 2: VERIFICAR TABELAS AI
-- ========================================

SELECT 'TABELAS AI:' as categoria, COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%';

-- ========================================
-- TESTE 3: VERIFICAR FUNÇÕES
-- ========================================

SELECT 'FUNÇÕES:' as categoria, COUNT(*) as total
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'match_cache_entries',
    'cleanup_old_cache_entries',
    'get_cache_stats',
    'get_streaming_stats',
    'get_analytics_stats',
    'get_emotion_stats',
    'get_proactive_stats',
    'get_multimodal_stats',
    'get_voice_stats'
);

-- ========================================
-- TESTE 4: VERIFICAR DADOS INICIAIS
-- ========================================

SELECT 'CLÍNICAS:' as tabela, COUNT(*) as total FROM clinics
UNION ALL
SELECT 'USUÁRIOS:' as tabela, COUNT(*) as total FROM users;

-- ========================================
-- TESTE 5: VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

-- Verificar estrutura da tabela clinics
SELECT 'ESTRUTURA CLINICS:' as info, 
       column_name || ' - ' || data_type as coluna
FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- TESTE 6: VERIFICAR ÍNDICES
-- ========================================

SELECT 'ÍNDICES:' as categoria, COUNT(*) as total
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE '%';

-- ========================================
-- TESTE 7: VERIFICAR PERMISSÕES
-- ========================================

SELECT 'PERMISSÕES:' as categoria, COUNT(*) as total
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
AND table_schema = 'public';

-- ========================================
-- TESTE 8: VERIFICAR EXTENSÃO PGVECTOR
-- ========================================

SELECT 'EXTENSÃO PGVECTOR:' as categoria, 
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_extension WHERE extname = 'vector'
       ) THEN 'INSTALADA' ELSE 'NÃO INSTALADA' END as status;

-- ========================================
-- TESTE 9: TESTAR FUNÇÃO DE CACHE
-- ========================================

SELECT 'TESTE FUNÇÃO CACHE:' as categoria,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'get_cache_stats'
       ) THEN 'FUNÇÃO CRIADA' ELSE 'FUNÇÃO NÃO ENCONTRADA' END as status;

-- ========================================
-- TESTE 10: VERIFICAR DADOS ESPECÍFICOS
-- ========================================

SELECT 'DADOS CLÍNICA ESADI:' as categoria,
       CASE WHEN EXISTS (
           SELECT 1 FROM clinics WHERE name LIKE '%ESADI%'
       ) THEN 'CLÍNICA ENCONTRADA' ELSE 'CLÍNICA NÃO ENCONTRADA' END as status;

SELECT 'DADOS ADMIN:' as categoria,
       CASE WHEN EXISTS (
           SELECT 1 FROM users WHERE email = 'admin@esadi.com.br'
       ) THEN 'ADMIN ENCONTRADO' ELSE 'ADMIN NÃO ENCONTRADO' END as status;

-- ========================================
-- RESUMO FINAL
-- ========================================

SELECT '========================================' as resultado
UNION ALL
SELECT 'VALIDAÇÃO DO RESET COMPLETO' as resultado
UNION ALL
SELECT '========================================' as resultado
UNION ALL
SELECT 'Se você viu os resultados acima, o reset foi bem-sucedido!' as resultado
UNION ALL
SELECT '========================================' as resultado; 