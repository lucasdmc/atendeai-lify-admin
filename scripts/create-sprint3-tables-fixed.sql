-- ========================================
-- SPRINT 3 - TABELAS DE PERFORMANCE (VERSÃO CORRIGIDA)
-- ========================================

-- Tabela para cache semântico
CREATE TABLE IF NOT EXISTS ai_cache_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-3-small
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    model_used VARCHAR(50) NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca semântica
CREATE INDEX IF NOT EXISTS idx_ai_cache_embedding ON ai_cache_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_cache_clinic_created ON ai_cache_entries(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_user_created ON ai_cache_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_confidence ON ai_cache_entries(confidence);

-- Tabela para métricas de streaming
CREATE TABLE IF NOT EXISTS ai_streaming_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    model_used VARCHAR(50) NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0.0,
    response_time INTEGER NOT NULL DEFAULT 0, -- em milissegundos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para streaming metrics
CREATE INDEX IF NOT EXISTS idx_streaming_clinic_created ON ai_streaming_metrics(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_streaming_user_created ON ai_streaming_metrics(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_streaming_response_time ON ai_streaming_metrics(response_time);

-- Tabela para interações de IA (analytics)
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    intent VARCHAR(100),
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    model_used VARCHAR(50) NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0.0,
    response_time INTEGER NOT NULL DEFAULT 0, -- em milissegundos
    cache_hit BOOLEAN DEFAULT FALSE,
    escalated BOOLEAN DEFAULT FALSE,
    error BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    medical_content BOOLEAN DEFAULT FALSE,
    medical_accuracy BOOLEAN,
    relevance_score DECIMAL(3,2),
    engagement_score DECIMAL(3,2),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_interactions_clinic_created ON ai_interactions(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_user_created ON ai_interactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON ai_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_intent ON ai_interactions(intent);
CREATE INDEX IF NOT EXISTS idx_interactions_confidence ON ai_interactions(confidence);
CREATE INDEX IF NOT EXISTS idx_interactions_cache_hit ON ai_interactions(cache_hit);
CREATE INDEX IF NOT EXISTS idx_interactions_escalated ON ai_interactions(escalated);
CREATE INDEX IF NOT EXISTS idx_interactions_error ON ai_interactions(error);
CREATE INDEX IF NOT EXISTS idx_interactions_medical ON ai_interactions(medical_content);

-- Função para busca semântica no cache
CREATE OR REPLACE FUNCTION match_cache_entries(
    query_embedding VECTOR(1536),
    similarity_threshold DECIMAL DEFAULT 0.85,
    clinic_id UUID DEFAULT NULL,
    user_id UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    query TEXT,
    response TEXT,
    embedding VECTOR(1536),
    clinic_id UUID,
    user_id UUID,
    confidence DECIMAL(3,2),
    model_used VARCHAR(50),
    tokens_used INTEGER,
    cost DECIMAL(10,6),
    created_at TIMESTAMP WITH TIME ZONE,
    similarity DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ace.id,
        ace.query,
        ace.response,
        ace.embedding,
        ace.clinic_id,
        ace.user_id,
        ace.confidence,
        ace.model_used,
        ace.tokens_used,
        ace.cost,
        ace.created_at,
        1 - (ace.embedding <=> query_embedding) as similarity
    FROM ai_cache_entries ace
    WHERE 
        (clinic_id IS NULL OR ace.clinic_id = clinic_id)
        AND (user_id IS NULL OR ace.user_id = user_id)
        AND 1 - (ace.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY ace.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$;

-- Função para limpeza automática de cache antigo
CREATE OR REPLACE FUNCTION cleanup_old_cache_entries()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_cache_entries 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Trigger para limpeza automática (executar a cada hora)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-cache', '0 * * * *', 'SELECT cleanup_old_cache_entries();');

-- Função para estatísticas de cache
CREATE OR REPLACE FUNCTION get_cache_stats(clinic_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    total_entries BIGINT,
    total_cost DECIMAL,
    avg_confidence DECIMAL,
    hit_rate DECIMAL,
    most_common_queries JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_entries,
            SUM(cost) as total_cost,
            AVG(confidence) as avg_confidence
        FROM ai_cache_entries
        WHERE clinic_id_param IS NULL OR clinic_id = clinic_id_param
    ),
    query_counts AS (
        SELECT 
            query,
            COUNT(*) as count
        FROM ai_cache_entries
        WHERE clinic_id_param IS NULL OR clinic_id = clinic_id_param
        GROUP BY query
        ORDER BY count DESC
        LIMIT 10
    )
    SELECT 
        s.total_entries,
        s.total_cost,
        s.avg_confidence,
        0.0 as hit_rate, -- Será calculado pelo analytics service
        json_agg(json_build_object('query', qc.query, 'count', qc.count)) as most_common_queries
    FROM stats s
    CROSS JOIN query_counts qc
    GROUP BY s.total_entries, s.total_cost, s.avg_confidence;
END;
$$;

-- Função para estatísticas de streaming
CREATE OR REPLACE FUNCTION get_streaming_stats(clinic_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    total_streams BIGINT,
    avg_response_time DECIMAL,
    avg_tokens INTEGER,
    total_cost DECIMAL,
    avg_confidence DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_streams,
        AVG(response_time) as avg_response_time,
        AVG(tokens_used)::INTEGER as avg_tokens,
        SUM(cost) as total_cost,
        AVG(confidence) as avg_confidence
    FROM ai_streaming_metrics
    WHERE clinic_id_param IS NULL OR clinic_id = clinic_id_param;
END;
$$;

-- Função para estatísticas de analytics
CREATE OR REPLACE FUNCTION get_analytics_stats(
    clinic_id_param UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_interactions BIGINT,
    avg_response_time DECIMAL,
    avg_confidence DECIMAL,
    total_cost DECIMAL,
    cache_hit_rate DECIMAL,
    escalation_rate DECIMAL,
    error_rate DECIMAL,
    user_satisfaction DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_interactions,
        AVG(response_time) as avg_response_time,
        AVG(confidence) as avg_confidence,
        SUM(cost) as total_cost,
        AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) as cache_hit_rate,
        AVG(CASE WHEN escalated THEN 1.0 ELSE 0.0 END) as escalation_rate,
        AVG(CASE WHEN error THEN 1.0 ELSE 0.0 END) as error_rate,
        AVG(user_rating) as user_satisfaction
    FROM ai_interactions
    WHERE 
        (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
        AND created_at BETWEEN start_date AND end_date;
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE ai_cache_entries IS 'Cache semântico para respostas de IA';
COMMENT ON TABLE ai_streaming_metrics IS 'Métricas de streaming de respostas de IA';
COMMENT ON TABLE ai_interactions IS 'Interações de IA para analytics';

COMMENT ON FUNCTION match_cache_entries IS 'Busca respostas similares no cache usando embeddings';
COMMENT ON FUNCTION cleanup_old_cache_entries IS 'Remove entradas antigas do cache';
COMMENT ON FUNCTION get_cache_stats IS 'Obtém estatísticas do cache semântico';
COMMENT ON FUNCTION get_streaming_stats IS 'Obtém estatísticas de streaming';
COMMENT ON FUNCTION get_analytics_stats IS 'Obtém estatísticas de analytics';

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_cache_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_streaming_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_interactions TO authenticated;

GRANT EXECUTE ON FUNCTION match_cache_entries TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_cache_entries TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_streaming_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_stats TO authenticated; 