-- ========================================
-- SPRINT 4 - TABELAS DE FEATURES AVANÇADAS
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
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para análise de emoções
CREATE INDEX IF NOT EXISTS idx_emotion_clinic_timestamp ON ai_emotion_analysis(clinic_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_emotion_user_timestamp ON ai_emotion_analysis(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_emotion_primary_emotion ON ai_emotion_analysis(primary_emotion);
CREATE INDEX IF NOT EXISTS idx_emotion_sentiment ON ai_emotion_analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_emotion_urgency ON ai_emotion_analysis(urgency);

-- Tabela para sugestões proativas
CREATE TABLE IF NOT EXISTS ai_proactive_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('information', 'action', 'reminder', 'recommendation')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    trigger VARCHAR(50) NOT NULL,
    context TEXT[],
    action_url TEXT,
    accepted BOOLEAN DEFAULT FALSE,
    response_timestamp TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sugestões proativas
CREATE INDEX IF NOT EXISTS idx_proactive_user_timestamp ON ai_proactive_suggestions(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_proactive_clinic_timestamp ON ai_proactive_suggestions(clinic_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_proactive_trigger ON ai_proactive_suggestions(trigger);
CREATE INDEX IF NOT EXISTS idx_proactive_priority ON ai_proactive_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_proactive_accepted ON ai_proactive_suggestions(accepted);

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
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    purpose VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para análise multimodal
CREATE INDEX IF NOT EXISTS idx_multimodal_clinic_timestamp ON ai_multimodal_analysis(clinic_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_multimodal_user_timestamp ON ai_multimodal_analysis(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_multimodal_type ON ai_multimodal_analysis(type);
CREATE INDEX IF NOT EXISTS idx_multimodal_medical_relevance ON ai_multimodal_analysis(medical_relevance);

-- Tabela para entradas de voz
CREATE TABLE IF NOT EXISTS ai_voice_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    audio_format VARCHAR(10) NOT NULL,
    sample_rate INTEGER NOT NULL,
    duration DECIMAL(10,3) NOT NULL,
    transcribed_text TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    language VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    voice_settings JSONB,
    processing_time INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para entradas de voz
CREATE INDEX IF NOT EXISTS idx_voice_inputs_user_timestamp ON ai_voice_inputs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_voice_inputs_clinic_timestamp ON ai_voice_inputs(clinic_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_voice_inputs_language ON ai_voice_inputs(language);
CREATE INDEX IF NOT EXISTS idx_voice_inputs_confidence ON ai_voice_inputs(confidence);

-- Tabela para respostas de voz
CREATE TABLE IF NOT EXISTS ai_voice_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    audio_format VARCHAR(10) NOT NULL DEFAULT 'wav',
    duration DECIMAL(10,3) NOT NULL,
    voice_settings JSONB,
    model_used VARCHAR(50) NOT NULL,
    processing_time INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para respostas de voz
CREATE INDEX IF NOT EXISTS idx_voice_responses_timestamp ON ai_voice_responses(timestamp);
CREATE INDEX IF NOT EXISTS idx_voice_responses_model ON ai_voice_responses(model_used);

-- Tabela para preferências de voz do usuário
CREATE TABLE IF NOT EXISTS user_voice_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    voice_settings JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para preferências de voz
CREATE INDEX IF NOT EXISTS idx_voice_preferences_user ON user_voice_preferences(user_id);

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
            AND timestamp BETWEEN start_date AND end_date
        GROUP BY primary_emotion
    ),
    sentiment_counts AS (
        SELECT 
            sentiment,
            COUNT(*) as count
        FROM ai_emotion_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND timestamp BETWEEN start_date AND end_date
        GROUP BY sentiment
    ),
    urgency_counts AS (
        SELECT 
            urgency,
            COUNT(*) as count
        FROM ai_emotion_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND timestamp BETWEEN start_date AND end_date
        GROUP BY urgency
    ),
    trigger_counts AS (
        SELECT 
            unnest(triggers) as trigger,
            COUNT(*) as count
        FROM ai_emotion_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND timestamp BETWEEN start_date AND end_date
            AND triggers IS NOT NULL
        GROUP BY unnest(triggers)
        ORDER BY count DESC
        LIMIT 10
    )
    SELECT 
        (SELECT COUNT(*) FROM ai_emotion_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as total_analyses,
        (SELECT json_object_agg(primary_emotion, count) FROM emotion_counts) as emotion_distribution,
        (SELECT AVG(confidence) FROM ai_emotion_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as avg_confidence,
        (SELECT AVG(intensity) FROM ai_emotion_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as avg_intensity,
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
            AND timestamp BETWEEN start_date AND end_date
        GROUP BY trigger
    ),
    type_stats AS (
        SELECT 
            type,
            COUNT(*) as count
        FROM ai_proactive_suggestions
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND timestamp BETWEEN start_date AND end_date
        GROUP BY type
    ),
    priority_stats AS (
        SELECT 
            priority,
            COUNT(*) as count
        FROM ai_proactive_suggestions
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND timestamp BETWEEN start_date AND end_date
        GROUP BY priority
    )
    SELECT 
        (SELECT COUNT(*) FROM ai_proactive_suggestions 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as total_suggestions,
        (SELECT AVG(CASE WHEN accepted THEN 1.0 ELSE 0.0 END) FROM ai_proactive_suggestions 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as acceptance_rate,
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
            AND timestamp BETWEEN start_date AND end_date
        GROUP BY type
    ),
    relevance_counts AS (
        SELECT 
            medical_relevance,
            COUNT(*) as count
        FROM ai_multimodal_analysis
        WHERE 
            (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
            AND timestamp BETWEEN start_date AND end_date
            AND medical_relevance IS NOT NULL
        GROUP BY medical_relevance
    )
    SELECT 
        (SELECT COUNT(*) FROM ai_multimodal_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as total_analyses,
        (SELECT json_object_agg(type, count) FROM type_counts) as type_distribution,
        (SELECT AVG(confidence) FROM ai_multimodal_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as avg_confidence,
        (SELECT json_object_agg(medical_relevance, count) FROM relevance_counts) as medical_relevance_breakdown,
        (SELECT AVG(processing_time) FROM ai_multimodal_analysis 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as avg_processing_time;
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
            AND timestamp BETWEEN start_date AND end_date
        GROUP BY language
    )
    SELECT 
        (SELECT COUNT(*) FROM ai_voice_inputs 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as total_inputs,
        (SELECT COUNT(*) FROM ai_voice_responses 
         WHERE timestamp BETWEEN start_date AND end_date) as total_responses,
        (SELECT AVG(confidence) FROM ai_voice_inputs 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as avg_confidence,
        (SELECT json_object_agg(language, count) FROM language_counts) as language_distribution,
        (SELECT AVG(processing_time) FROM ai_voice_inputs 
         WHERE (clinic_id_param IS NULL OR clinic_id = clinic_id_param)
         AND timestamp BETWEEN start_date AND end_date) as avg_processing_time;
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE ai_emotion_analysis IS 'Análise de emoções do usuário';
COMMENT ON TABLE ai_proactive_suggestions IS 'Sugestões proativas da IA';
COMMENT ON TABLE ai_multimodal_analysis IS 'Análise multimodal (imagens, documentos, áudio, vídeo)';
COMMENT ON TABLE ai_voice_inputs IS 'Entradas de voz (Speech-to-Text)';
COMMENT ON TABLE ai_voice_responses IS 'Respostas de voz (Text-to-Speech)';
COMMENT ON TABLE user_voice_preferences IS 'Preferências de voz do usuário';

COMMENT ON FUNCTION get_emotion_stats IS 'Obtém estatísticas de análise de emoções';
COMMENT ON FUNCTION get_proactive_stats IS 'Obtém estatísticas de sugestões proativas';
COMMENT ON FUNCTION get_multimodal_stats IS 'Obtém estatísticas de análise multimodal';
COMMENT ON FUNCTION get_voice_stats IS 'Obtém estatísticas de uso de voz';

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_emotion_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_proactive_suggestions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_multimodal_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_voice_inputs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_voice_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_voice_preferences TO authenticated;

GRANT EXECUTE ON FUNCTION get_emotion_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_proactive_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_multimodal_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_voice_stats TO authenticated; 