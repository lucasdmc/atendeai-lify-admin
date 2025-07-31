-- ========================================
-- INSTALAÇÃO COMPLETA - TODOS OS SPRINTS (VERSÃO FINAL)
-- ========================================

-- Verificar se a extensão pgvector está instalada
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- SPRINT 1 - CRITICAL SECURITY
-- ========================================

-- Tabela para validação médica
CREATE TABLE IF NOT EXISTS ai_medical_validation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    validation_result VARCHAR(20) NOT NULL CHECK (validation_result IN ('safe', 'warning', 'dangerous')),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    detected_issues TEXT[],
    recommendations TEXT[],
    requires_human_review BOOLEAN DEFAULT FALSE,
    clinic_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de conformidade LGPD
CREATE TABLE IF NOT EXISTS ai_lgpd_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    user_id UUID,
    clinic_id UUID,
    consent_given BOOLEAN DEFAULT FALSE,
    data_processed TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para scores de confiança
CREATE TABLE IF NOT EXISTS ai_confidence_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    quality_score DECIMAL(3,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),
    relevance_score DECIMAL(3,2) NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
    factors JSONB,
    requires_escalation BOOLEAN DEFAULT FALSE,
    clinic_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SPRINT 2 - QUALITY AND RELIABILITY
-- ========================================

-- Tabela para ensemble de modelos
CREATE TABLE IF NOT EXISTS ai_model_ensemble (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    selected_model VARCHAR(50) NOT NULL,
    fallback_model VARCHAR(50),
    model_scores JSONB,
    final_response TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0.0,
    clinic_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para prompts avançados
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_type VARCHAR(50) NOT NULL,
    base_prompt TEXT NOT NULL,
    context_prompt TEXT,
    constraints TEXT[],
    examples JSONB,
    performance_score DECIMAL(3,2),
    usage_count INTEGER DEFAULT 0,
    clinic_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para rate limiting
CREATE TABLE IF NOT EXISTS ai_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    clinic_id UUID,
    tier VARCHAR(20) NOT NULL DEFAULT 'basic',
    daily_usage INTEGER DEFAULT 0,
    monthly_usage INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SPRINT 3 - PERFORMANCE
-- ========================================

-- Tabela para cache semântico
CREATE TABLE IF NOT EXISTS ai_cache_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    embedding VECTOR(1536),
    clinic_id UUID,
    user_id UUID,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    model_used VARCHAR(50) NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para métricas de streaming
CREATE TABLE IF NOT EXISTS ai_streaming_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    clinic_id UUID,
    user_id UUID,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    model_used VARCHAR(50) NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0.0,
    response_time INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para interações de IA (analytics)
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    clinic_id UUID,
    user_id UUID,
    session_id VARCHAR(100),
    intent VARCHAR(100),
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    model_used VARCHAR(50) NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0.0,
    response_time INTEGER NOT NULL DEFAULT 0,
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

-- ========================================
-- SPRINT 4 - ADVANCED FEATURES
-- ========================================

-- Tabela para análise de emoções
CREATE TABLE IF NOT EXISTS ai_emotion_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    primary_emotion VARCHAR(50) NOT NULL,
    secondary_emotion VARCHAR(50),
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    intensity DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    triggers TEXT[],
    recommendations TEXT[],
    clinic_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para sugestões proativas
CREATE TABLE IF NOT EXISTS ai_proactive_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id VARCHAR(100) NOT NULL,
    user_id UUID,
    clinic_id UUID,
    type VARCHAR(20) NOT NULL CHECK (type IN ('information', 'action', 'reminder', 'recommendation')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    trigger VARCHAR(50) NOT NULL,
    context TEXT[],
    action_url TEXT,
    accepted BOOLEAN DEFAULT FALSE,
    response_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para análise multimodal
CREATE TABLE IF NOT EXISTS ai_multimodal_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'document', 'audio', 'video')),
    content TEXT NOT NULL,
    extracted_text TEXT,
    detected_objects TEXT[],
    medical_relevance VARCHAR(10) CHECK (medical_relevance IN ('high', 'medium', 'low')),
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    suggestions TEXT[],
    processing_time INTEGER NOT NULL DEFAULT 0,
    clinic_id UUID,
    user_id UUID,
    purpose VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para entradas de voz
CREATE TABLE IF NOT EXISTS ai_voice_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    clinic_id UUID,
    session_id VARCHAR(100),
    audio_format VARCHAR(10) NOT NULL,
    sample_rate INTEGER NOT NULL,
    duration DECIMAL(10,3) NOT NULL,
    transcribed_text TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    language VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    voice_settings JSONB,
    processing_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para respostas de voz
CREATE TABLE IF NOT EXISTS ai_voice_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    audio_format VARCHAR(10) NOT NULL DEFAULT 'wav',
    duration DECIMAL(10,3) NOT NULL,
    voice_settings JSONB,
    model_used VARCHAR(50) NOT NULL,
    processing_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para preferências de voz do usuário
CREATE TABLE IF NOT EXISTS user_voice_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    voice_settings JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para cache semântico
CREATE INDEX IF NOT EXISTS idx_ai_cache_embedding ON ai_cache_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_ai_cache_clinic_created ON ai_cache_entries(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_user_created ON ai_cache_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_confidence ON ai_cache_entries(confidence);

-- Índices para streaming
CREATE INDEX IF NOT EXISTS idx_streaming_clinic_created ON ai_streaming_metrics(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_streaming_user_created ON ai_streaming_metrics(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_streaming_response_time ON ai_streaming_metrics(response_time);

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

-- Índices para emoções
CREATE INDEX IF NOT EXISTS idx_emotion_clinic_created ON ai_emotion_analysis(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_emotion_user_created ON ai_emotion_analysis(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_emotion_primary_emotion ON ai_emotion_analysis(primary_emotion);
CREATE INDEX IF NOT EXISTS idx_emotion_sentiment ON ai_emotion_analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_emotion_urgency ON ai_emotion_analysis(urgency);

-- Índices para sugestões proativas
CREATE INDEX IF NOT EXISTS idx_proactive_user_created ON ai_proactive_suggestions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_proactive_clinic_created ON ai_proactive_suggestions(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_proactive_trigger ON ai_proactive_suggestions(trigger);
CREATE INDEX IF NOT EXISTS idx_proactive_priority ON ai_proactive_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_proactive_accepted ON ai_proactive_suggestions(accepted);

-- Índices para multimodal
CREATE INDEX IF NOT EXISTS idx_multimodal_clinic_created ON ai_multimodal_analysis(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_multimodal_user_created ON ai_multimodal_analysis(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_multimodal_type ON ai_multimodal_analysis(type);
CREATE INDEX IF NOT EXISTS idx_multimodal_medical_relevance ON ai_multimodal_analysis(medical_relevance);

-- Índices para voz
CREATE INDEX IF NOT EXISTS idx_voice_inputs_user_created ON ai_voice_inputs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_voice_inputs_clinic_created ON ai_voice_inputs(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_voice_inputs_language ON ai_voice_inputs(language);
CREATE INDEX IF NOT EXISTS idx_voice_inputs_confidence ON ai_voice_inputs(confidence);
CREATE INDEX IF NOT EXISTS idx_voice_responses_created ON ai_voice_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_responses_model ON ai_voice_responses(model_used);
CREATE INDEX IF NOT EXISTS idx_voice_preferences_user ON user_voice_preferences(user_id);

-- ========================================
-- FUNÇÕES SQL
-- ========================================

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
        0.0 as hit_rate,
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

-- Função para estatísticas de emoções
CREATE OR REPLACE FUNCTION get_emotion_stats(
    clinic_id_param UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_analyses BIGINT,
    emotion_distribution JSON,
    avg_confidence DECIMAL,
    avg_intensity DECIMAL,
    sentiment_breakdown JSON,
    urgency_breakdown JSON,
    top_triggers JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH emotion_counts AS (
        SELECT 
            primary_emotion,
            COUNT(*) as count
        FROM ai_emotion_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
        GROUP BY primary_emotion
    ),
    sentiment_counts AS (
        SELECT 
            sentiment,
            COUNT(*) as count
        FROM ai_emotion_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
        GROUP BY sentiment
    ),
    urgency_counts AS (
        SELECT 
            urgency,
            COUNT(*) as count
        FROM ai_emotion_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
        GROUP BY urgency
    ),
    trigger_counts AS (
        SELECT 
            unnest(triggers) as trigger,
            COUNT(*) as count
        FROM ai_emotion_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
            AND triggers IS NOT NULL
        GROUP BY unnest(triggers)
        ORDER BY count DESC
        LIMIT 10
    )
    SELECT 
        (SELECT COUNT(*) FROM ai_emotion_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as total_analyses,
        (SELECT json_object_agg(primary_emotion, count) FROM emotion_counts) as emotion_distribution,
        (SELECT AVG(confidence) FROM ai_emotion_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as avg_confidence,
        (SELECT AVG(intensity) FROM ai_emotion_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as avg_intensity,
        (SELECT json_object_agg(sentiment, count) FROM sentiment_counts) as sentiment_breakdown,
        (SELECT json_object_agg(urgency, count) FROM urgency_counts) as urgency_breakdown,
        (SELECT json_object_agg(trigger, count) FROM trigger_counts) as top_triggers;
END;
$$;

-- Função para estatísticas de sugestões proativas
CREATE OR REPLACE FUNCTION get_proactive_stats(
    clinic_id_param UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_suggestions BIGINT,
    acceptance_rate DECIMAL,
    trigger_effectiveness JSON,
    type_distribution JSON,
    priority_distribution JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH trigger_stats AS (
        SELECT 
            trigger,
            COUNT(*) as total,
            COUNT(CASE WHEN accepted THEN 1 END) as accepted
        FROM ai_proactive_suggestions
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
        GROUP BY trigger
    ),
    type_stats AS (
        SELECT 
            type,
            COUNT(*) as count
        FROM ai_proactive_suggestions
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
        GROUP BY type
    ),
    priority_stats AS (
        SELECT 
            priority,
            COUNT(*) as count
        FROM ai_proactive_suggestions
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
        GROUP BY priority
    )
    SELECT 
        (SELECT COUNT(*) FROM ai_proactive_suggestions 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as total_suggestions,
        (SELECT AVG(CASE WHEN accepted THEN 1.0 ELSE 0.0 END) FROM ai_proactive_suggestions 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as acceptance_rate,
        (SELECT json_object_agg(trigger, json_build_object('total', total, 'accepted', accepted, 'rate', CASE WHEN total > 0 THEN accepted::DECIMAL / total ELSE 0 END)) FROM trigger_stats) as trigger_effectiveness,
        (SELECT json_object_agg(type, count) FROM type_stats) as type_distribution,
        (SELECT json_object_agg(priority, count) FROM priority_stats) as priority_distribution;
END;
$$;

-- Função para estatísticas multimodais
CREATE OR REPLACE FUNCTION get_multimodal_stats(
    clinic_id_param UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_analyses BIGINT,
    type_distribution JSON,
    avg_confidence DECIMAL,
    medical_relevance_breakdown JSON,
    avg_processing_time DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH type_counts AS (
        SELECT 
            type,
            COUNT(*) as count
        FROM ai_multimodal_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
        GROUP BY type
    ),
    relevance_counts AS (
        SELECT 
            medical_relevance,
            COUNT(*) as count
        FROM ai_multimodal_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
            AND medical_relevance IS NOT NULL
        GROUP BY medical_relevance
    )
    SELECT 
        (SELECT COUNT(*) FROM ai_multimodal_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as total_analyses,
        (SELECT json_object_agg(type, count) FROM type_counts) as type_distribution,
        (SELECT AVG(confidence) FROM ai_multimodal_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as avg_confidence,
        (SELECT json_object_agg(medical_relevance, count) FROM relevance_counts) as medical_relevance_breakdown,
        (SELECT AVG(processing_time) FROM ai_multimodal_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as avg_processing_time;
END;
$$;

-- Função para estatísticas de voz
CREATE OR REPLACE FUNCTION get_voice_stats(
    clinic_id_param UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_inputs BIGINT,
    total_responses BIGINT,
    avg_confidence DECIMAL,
    language_distribution JSON,
    avg_processing_time DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH language_counts AS (
        SELECT 
            language,
            COUNT(*) as count
        FROM ai_voice_inputs
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND created_at BETWEEN start_date AND end_date
        GROUP BY language
    )
    SELECT 
        (SELECT COUNT(*) FROM ai_voice_inputs 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as total_inputs,
        (SELECT COUNT(*) FROM ai_voice_responses 
         WHERE created_at BETWEEN start_date AND end_date) as total_responses,
        (SELECT AVG(confidence) FROM ai_voice_inputs 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as avg_confidence,
        (SELECT json_object_agg(language, count) FROM language_counts) as language_distribution,
        (SELECT AVG(processing_time) FROM ai_voice_inputs 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND created_at BETWEEN start_date AND end_date) as avg_processing_time;
END;
$$;

-- ========================================
-- PERMISSÕES
-- ========================================

-- Permissões para todas as tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_medical_validation TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_lgpd_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_confidence_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_model_ensemble TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_prompts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_rate_limits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_cache_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_streaming_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_emotion_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_proactive_suggestions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_multimodal_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_voice_inputs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_voice_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_voice_preferences TO authenticated;

-- Permissões para todas as funções
GRANT EXECUTE ON FUNCTION match_cache_entries TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_cache_entries TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_streaming_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_emotion_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_proactive_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_multimodal_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_voice_stats TO authenticated;

-- ========================================
-- MENSAGEM DE SUCESSO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INSTALAÇÃO COMPLETA REALIZADA COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Tabelas criadas: 15';
    RAISE NOTICE '🔧 Funções criadas: 9';
    RAISE NOTICE '📈 Índices criados: 25+';
    RAISE NOTICE '🔒 Permissões configuradas';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚀 Sistema pronto para uso!';
    RAISE NOTICE '========================================';
END $$; 