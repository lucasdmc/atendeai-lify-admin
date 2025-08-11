#!/usr/bin/env node

/**
 * 🧪 TESTE SIMPLES DE DEBUG
 * Para identificar problemas básicos antes do teste robusto
 */

import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

console.log('🚀 TESTE SIMPLES INICIADO');

// Verificar variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente:');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Não configurado');
console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configurado' : '❌ Não configurado');

// Testar import do Supabase
try {
  console.log('🔍 Testando import do Supabase...');
  const { createClient } = await import('@supabase/supabase-js');
  console.log('✅ Supabase importado com sucesso');
  
  // Testar conexão
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('🔍 Testando conexão com Supabase...');
  const { data, error } = await supabase
    .from('clinics')
    .select('name')
    .limit(1);
  
  if (error) {
    console.log('❌ Erro na conexão:', error.message);
  } else {
    console.log('✅ Conexão com Supabase funcionando');
    console.log('   Clínicas encontradas:', data?.length || 0);
  }
  
} catch (error) {
  console.log('❌ Erro ao importar/testar Supabase:', error.message);
}

// Testar import dos serviços
try {
  console.log('🔍 Testando import dos serviços...');
  
  const LLMOrchestratorService = await import('./services/core/llmOrchestratorService.js');
  console.log('✅ LLMOrchestratorService importado');
  
  const ClinicContextManager = await import('./services/core/clinicContextManager.js');
  console.log('✅ ClinicContextManager importado');
  
} catch (error) {
  console.log('❌ Erro ao importar serviços:', error.message);
}

console.log('✅ TESTE SIMPLES CONCLUÍDO');
