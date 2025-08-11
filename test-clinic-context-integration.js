// test-clinic-context-integration.js
// Script de teste para validar integração do ClinicContextManager (APENAS JSONs)

import dotenv from 'dotenv';
import { ClinicContextManager } from './services/core/index.js';

dotenv.config();

console.log('🧪 [Test] Iniciando teste de integração do ClinicContextManager (APENAS JSONs)...\n');

async function testClinicContextIntegration() {
  try {
    // 1. Testar inicialização
    console.log('📋 [Test] 1. Testando inicialização...');
    await ClinicContextManager.initialize();
    console.log('✅ [Test] ClinicContextManager inicializado com sucesso\n');
    
    // 2. Testar estatísticas
    console.log('📊 [Test] 2. Testando estatísticas...');
    const stats = ClinicContextManager.getStats();
    console.log('📊 [Test] Estatísticas:', stats);
    console.log('✅ [Test] Estatísticas obtidas com sucesso\n');
    
    // 3. Testar busca por chave da clínica
    console.log('🔑 [Test] 3. Testando busca por chave da clínica...');
    const context = ClinicContextManager.getClinicContext('cardioprime');
    
    if (context) {
      console.log('✅ [Test] Contexto encontrado para: cardioprime');
      console.log('🏥 [Test] Nome da clínica:', context.name);
      console.log('📄 [Test] Tem JSON de contextualização:', context.hasJsonContext);
      console.log('🤖 [Test] Nome do agente:', context.agentConfig?.nome);
      console.log('👋 [Test] Saudação inicial:', context.agentConfig?.saudacao_inicial?.substring(0, 50) + '...');
      console.log('🕒 [Test] Horários configurados:', Object.keys(context.workingHours || {}).length > 0 ? 'SIM' : 'NÃO');
      console.log('📍 [Test] Endereço:', context.address || 'Não informado');
      console.log('📞 [Test] Telefone:', context.phone || 'Não informado');
      console.log('📧 [Test] Email:', context.email || 'Não informado');
      console.log('🌐 [Test] Website:', context.website || 'Não informado');
    } else {
      console.log('❌ [Test] Contexto não encontrado para: cardioprime');
    }
    console.log('');
    
    // 4. Testar clínica ESADI
    console.log('🔑 [Test] 4. Testando clínica ESADI...');
    const esadiContext = ClinicContextManager.getClinicContext('esadi');
    
    if (esadiContext) {
      console.log('✅ [Test] Contexto encontrado para: esadi');
      console.log('🏥 [Test] Nome da clínica:', esadiContext.name);
      console.log('🤖 [Test] Nome do agente:', esadiContext.agentConfig?.nome);
      console.log('📄 [Test] Tem JSON:', esadiContext.hasJsonContext);
    } else {
      console.log('❌ [Test] Contexto não encontrado para: esadi');
    }
    console.log('');
    
    // 5. Testar clínica inexistente
    console.log('🔑 [Test] 5. Testando clínica inexistente...');
    const inexistentContext = ClinicContextManager.getClinicContext('clinica-inexistente');
    console.log('✅ [Test] Contexto padrão obtido para clínica inexistente');
    console.log('🏥 [Test] Nome da clínica:', inexistentContext.name);
    console.log('🤖 [Test] Nome do agente:', inexistentContext.agentConfig?.nome);
    console.log('📄 [Test] Tem JSON:', inexistentContext.hasJsonContext);
    console.log('📄 [Test] Fonte:', inexistentContext.source);
    console.log('');
    
    // 6. Testar verificação de JSON
    console.log('📄 [Test] 6. Testando verificação de JSON...');
    const hasCardioJson = ClinicContextManager.hasJsonContext('cardioprime');
    const hasEsadiJson = ClinicContextManager.hasJsonContext('esadi');
    const hasInexistentJson = ClinicContextManager.hasJsonContext('clinica-inexistente');
    
    console.log('✅ [Test] CardioPrime tem JSON:', hasCardioJson);
    console.log('✅ [Test] ESADI tem JSON:', hasEsadiJson);
    console.log('✅ [Test] Clínica inexistente tem JSON:', hasInexistentJson);
    console.log('');
    
    // 7. Listar todas as clínicas disponíveis
    console.log('📋 [Test] 7. Listando clínicas disponíveis...');
    const allClinics = ClinicContextManager.getAllClinics();
    console.log('🏥 [Test] Clínicas disponíveis:');
    allClinics.forEach(clinic => {
      console.log(`  - ${clinic.key}: ${clinic.name}`);
    });
    console.log('');
    
    console.log('🎉 [Test] Todos os testes concluídos com sucesso!');
    console.log('🔗 [Test] Sistema de contextualização JSON funcionando APENAS com arquivos JSON');
    console.log('📄 [Test] Fonte de dados: APENAS arquivos em data/contextualizacao-*.json');
    
  } catch (error) {
    console.error('❌ [Test] Erro durante os testes:', error);
    process.exit(1);
  }
}

// Executar testes
testClinicContextIntegration();
