-- ========================================
-- TESTE DOS SERVIÇOS AI
-- ========================================
-- Execute este script no Supabase Dashboard > SQL Editor
-- Para testar se os serviços AI estão funcionando

-- ========================================
-- TESTE 1: VALIDAÇÃO MÉDICA (SPRINT 1)
-- ========================================

-- Inserir teste de validação médica
INSERT INTO ai_medical_validation (
    content,
    validation_result,
    risk_level,
    detected_issues,
    recommendations,
    requires_human_review,
    clinic_id,
    user_id
) VALUES (
    'Você tem sintomas de gripe e deve tomar paracetamol',
    'dangerous',
    'critical',
    ARRAY['Sugestão de medicamento detectada: "paracetamol"', 'Frase diagnóstica detectada: "Você tem sintomas"'],
    ARRAY['CONTEÚDO PERIGOSO - NÃO ENVIAR', 'Requer revisão médica obrigatória'],
    TRUE,
    (SELECT id FROM clinics LIMIT 1),
    (SELECT id FROM user_profiles LIMIT 1)
);

-- ========================================
-- TESTE 2: ENSEMBLE DE MODELOS (SPRINT 2)
-- ========================================

-- Inserir teste de ensemble
INSERT INTO ai_model_ensemble (
    query,
    selected_model,
    fallback_model,
    model_scores,
    final_response,
    tokens_used,
    cost,
    clinic_id,
    user_id
) VALUES (
    'Como posso agendar uma consulta?',
    'gpt-4o',
    'gpt-3.5-turbo',
    '{"gpt-4o": 0.85, "gpt-3.5-turbo": 0.75}',
    'Para agendar uma consulta, entre em contato conosco pelo telefone ou use nosso sistema online.',
    150,
    0.00075,
    (SELECT id FROM clinics LIMIT 1),
    (SELECT id FROM user_profiles LIMIT 1)
);

-- ========================================
-- TESTE 3: CACHE E STREAMING (SPRINT 3)
-- ========================================

-- Inserir teste de cache
INSERT INTO ai_cache_entries (
    query,
    response,
    embedding,
    clinic_id,
    user_id,
    confidence,
    model_used,
    tokens_used,
    cost
) VALUES (
    'Horário de funcionamento',
    'Nosso horário de funcionamento é de segunda a sexta, das 8h às 18h.',
    ARRAY[0.1, 0.2, 0.3, 0.4, 0.5]::vector,
    (SELECT id FROM clinics LIMIT 1),
    (SELECT id FROM user_profiles LIMIT 1),
    0.9,
    'gpt-4o',
    100,
    0.0005
);

-- Inserir teste de streaming
INSERT INTO ai_streaming_metrics (
    message,
    response,
    clinic_id,
    user_id,
    confidence,
    model_used,
    tokens_used,
    cost,
    response_time
) VALUES (
    'Preciso de ajuda',
    'Como posso ajudá-lo hoje?',
    (SELECT id FROM clinics LIMIT 1),
    (SELECT id FROM user_profiles LIMIT 1),
    0.8,
    'gpt-4o',
    50,
    0.00025,
    1200
);

-- ========================================
-- TESTE 4: ANÁLISE DE EMOÇÕES (SPRINT 4)
-- ========================================

-- Inserir teste de análise de emoções
INSERT INTO ai_emotion_analysis (
    text,
    primary_emotion,
    secondary_emotion,
    confidence,
    intensity,
    sentiment,
    urgency,
    triggers,
    recommendations,
    clinic_id,
    user_id
) VALUES (
    'Estou muito preocupado com minha saúde',
    'medo',
    'ansiedade',
    0.8,
    0.7,
    'negative',
    'medium',
    ARRAY['preocupado', 'saúde'],
    ARRAY['Oferecer suporte emocional', 'Agendar consulta urgente'],
    (SELECT id FROM clinics LIMIT 1),
    (SELECT id FROM user_profiles LIMIT 1)
);

-- ========================================
-- TESTE 5: SUGESTÕES PROATIVAS (SPRINT 4)
-- ========================================

-- Inserir teste de sugestão proativa
INSERT INTO ai_proactive_suggestions (
    suggestion_id,
    user_id,
    clinic_id,
    type,
    title,
    description,
    priority,
    trigger,
    context,
    action_url,
    accepted
) VALUES (
    'schedule_appointment',
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM clinics LIMIT 1),
    'action',
    'Agendar Consulta',
    'Agende uma consulta com nossos especialistas',
    'high',
    'medical_question',
    ARRAY['consulta', 'agendamento'],
    '/agendamento',
    FALSE
);

-- ========================================
-- TESTE 6: ANÁLISE MULTIMODAL (SPRINT 4)
-- ========================================

-- Inserir teste de análise multimodal
INSERT INTO ai_multimodal_analysis (
    type,
    content,
    extracted_text,
    detected_objects,
    medical_relevance,
    confidence,
    suggestions,
    processing_time,
    clinic_id,
    user_id,
    purpose
) VALUES (
    'image',
    'radiografia_paciente.jpg',
    'Imagem de radiografia analisada',
    ARRAY['ossos', 'pulmões', 'coração'],
    'high',
    0.9,
    ARRAY['Requer análise médica especializada'],
    1500,
    (SELECT id FROM clinics LIMIT 1),
    (SELECT id FROM user_profiles LIMIT 1),
    'diagnóstico'
);

-- ========================================
-- TESTE 7: PROCESSAMENTO DE VOZ (SPRINT 4)
-- ========================================

-- Inserir teste de entrada de voz
INSERT INTO ai_voice_inputs (
    user_id,
    clinic_id,
    session_id,
    audio_format,
    sample_rate,
    duration,
    transcribed_text,
    confidence,
    language,
    voice_settings,
    processing_time
) VALUES (
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM clinics LIMIT 1),
    'session-123',
    'wav',
    16000,
    10.5,
    'Preciso agendar uma consulta médica urgente',
    0.85,
    'pt-BR',
    '{"language": "pt-BR", "sample_rate": 16000}',
    2500
);

-- Inserir teste de resposta de voz
INSERT INTO ai_voice_responses (
    text,
    audio_format,
    duration,
    voice_settings,
    model_used,
    processing_time
) VALUES (
    'Entendi sua solicitação. Vou ajudá-lo a agendar uma consulta.',
    'wav',
    8.5,
    '{"voice": "alloy", "speed": 1.0}',
    'tts-1',
    1800
);

-- ========================================
-- TESTE 8: INTERAÇÕES (ANALYTICS)
-- ========================================

-- Inserir teste de interação
INSERT INTO ai_interactions (
    message,
    response,
    clinic_id,
    user_id,
    session_id,
    intent,
    confidence,
    model_used,
    tokens_used,
    cost,
    response_time,
    cache_hit,
    escalated,
    error,
    user_rating,
    medical_content,
    resolved
) VALUES (
    'Como faço para agendar uma consulta?',
    'Para agendar uma consulta, você pode ligar para nosso telefone ou usar nosso sistema online.',
    (SELECT id FROM clinics LIMIT 1),
    (SELECT id FROM user_profiles LIMIT 1),
    'session-456',
    'agendamento',
    0.9,
    'gpt-4o',
    120,
    0.0006,
    1500,
    FALSE,
    FALSE,
    FALSE,
    5,
    FALSE,
    TRUE
);

-- ========================================
-- VERIFICAR RESULTADOS DOS TESTES
-- ========================================

-- Contar registros em cada tabela
SELECT 'MEDICAL VALIDATION' as tabela, COUNT(*) as total FROM ai_medical_validation
UNION ALL
SELECT 'MODEL ENSEMBLE' as tabela, COUNT(*) as total FROM ai_model_ensemble
UNION ALL
SELECT 'CACHE ENTRIES' as tabela, COUNT(*) as total FROM ai_cache_entries
UNION ALL
SELECT 'STREAMING METRICS' as tabela, COUNT(*) as total FROM ai_streaming_metrics
UNION ALL
SELECT 'EMOTION ANALYSIS' as tabela, COUNT(*) as total FROM ai_emotion_analysis
UNION ALL
SELECT 'PROACTIVE SUGGESTIONS' as tabela, COUNT(*) as total FROM ai_proactive_suggestions
UNION ALL
SELECT 'MULTIMODAL ANALYSIS' as tabela, COUNT(*) as total FROM ai_multimodal_analysis
UNION ALL
SELECT 'VOICE INPUTS' as tabela, COUNT(*) as total FROM ai_voice_inputs
UNION ALL
SELECT 'VOICE RESPONSES' as tabela, COUNT(*) as total FROM ai_voice_responses
UNION ALL
SELECT 'INTERACTIONS' as tabela, COUNT(*) as total FROM ai_interactions;

-- ========================================
-- TESTAR FUNÇÕES SQL
-- ========================================

-- Testar função de cache
SELECT * FROM get_cache_stats();

-- Testar função de streaming
SELECT * FROM get_streaming_stats();

-- Testar função de analytics
SELECT * FROM get_analytics_stats();

-- Testar função de emoções
SELECT * FROM get_emotion_stats();

-- Testar função de sugestões proativas
SELECT * FROM get_proactive_stats();

-- Testar função multimodal
SELECT * FROM get_multimodal_stats();

-- Testar função de voz
SELECT * FROM get_voice_stats();

-- ========================================
-- MENSAGEM DE SUCESSO
-- ========================================

SELECT '========================================' as resultado
UNION ALL
SELECT 'TESTES DOS SERVIÇOS AI CONCLUÍDOS!' as resultado
UNION ALL
SELECT '========================================' as resultado
UNION ALL
SELECT 'Se você viu os resultados acima, os serviços estão funcionando!' as resultado
UNION ALL
SELECT '========================================' as resultado; 