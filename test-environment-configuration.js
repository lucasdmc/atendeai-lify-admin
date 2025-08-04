
// ========================================
// TESTE DE CONFIGURAÇÃO DE AMBIENTE
// ========================================

import { validateEnvironment, getEnvironmentConfig, isProduction, isDevelopment } from './src/config/environment.js';
import { runHealthCheck } from './scripts/health-check.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEnvironmentConfiguration() {
  console.log('🔧 Testando Configuração de Ambiente...\n');
  
  try {
    // Teste 1: Validar variáveis de ambiente
    console.log('📋 1. Validando variáveis de ambiente...');
    validateEnvironment();
    console.log('✅ Variáveis de ambiente validadas');
    
    // Teste 2: Verificar configuração
    console.log('\n📋 2. Verificando configuração...');
    const config = getEnvironmentConfig();
    console.log('✅ Configuração carregada:');
    console.log('- Ambiente:', config.nodeEnv);
    console.log('- Porta:', config.port);
    console.log('- Supabase URL:', config.supabase.url ? '✅ Configurado' : '❌ Não configurado');
    console.log('- OpenAI API Key:', config.openai.apiKey ? '✅ Configurado' : '❌ Não configurado');
    console.log('- WhatsApp Access Token:', config.whatsapp.accessToken ? '✅ Configurado' : '❌ Não configurado');
    console.log('- WhatsApp Phone Number ID:', config.whatsapp.phoneNumberId ? '✅ Configurado' : '❌ Não configurado');
    
    // Teste 3: Verificar ambiente
    console.log('\n📋 3. Verificando ambiente...');
    console.log('- É produção?', isProduction());
    console.log('- É desenvolvimento?', isDevelopment());
    
    // Teste 4: Executar health check
    console.log('\n📋 4. Executando health check...');
    const healthCheckResult = await runHealthCheck();
    
    if (healthCheckResult) {
      console.log('\n🎉 CONFIGURAÇÃO DE AMBIENTE FUNCIONANDO PERFEITAMENTE!');
      console.log('✅ Todas as validações passaram');
      console.log('🚀 Sistema pronto para uso');
    } else {
      console.log('\n⚠️  CONFIGURAÇÃO DE AMBIENTE COM PROBLEMAS!');
      console.log('❌ Algumas validações falharam');
      console.log('🔧 Corrija os problemas antes de usar');
    }
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO na configuração:', error.message);
    console.log('🔧 Verifique as variáveis de ambiente');
  }
}

// Executar teste
testEnvironmentConfiguration().catch(console.error);
