import dotenv from 'dotenv';
import { ClinicContextManager } from './services/core/clinicContextManager.js';
import { LLMOrchestratorService } from './services/core/llmOrchestratorService.js';

dotenv.config();

async function testProductionSimulation() {
  console.log('🏭 SIMULAÇÃO DE PRODUÇÃO - DEBUG COMPLETO');
  console.log('=========================================');
  console.log('🔍 Simulando EXATAMENTE o que acontece em produção');
  
  try {
    // 1. Verificar variáveis de ambiente
    console.log('\n1️⃣ VERIFICANDO VARIÁVEIS DE AMBIENTE:');
    console.log('   - VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ NOT SET');
    
    // 2. Inicializar serviços
    console.log('\n2️⃣ Inicializando serviços...');
    await ClinicContextManager.initialize();
    console.log('✅ ClinicContextManager inicializado');
    
    // 3. Buscar clínica
    console.log('\n3️⃣ Buscando clínica CardioPrime...');
    const clinicName = await ClinicContextManager.getClinicByWhatsApp('+554730915628');
    console.log('✅ Clínica encontrada:', clinicName);
    
    if (!clinicName) {
      console.log('❌ Nenhuma clínica encontrada');
      return;
    }
    
    // 4. Carregar contexto COMPLETO
    console.log('\n4️⃣ Carregando contexto COMPLETO...');
    const context = await ClinicContextManager.getClinicContext(clinicName);
    
    console.log('📊 CONTEXTO CARREGADO:');
    console.log('   - Nome:', context?.name);
    console.log('   - Serviços:', context?.services?.length || 0);
    console.log('   - Profissionais:', context?.professionals?.length || 0);
    console.log('   - ServicesDetails:', !!context?.servicesDetails);
    console.log('   - ProfessionalsDetails:', !!context?.professionalsDetails);
    
    // 5. SIMULAR PROCESSAMENTO COMPLETO (como em produção)
    console.log('\n5️⃣ SIMULANDO PROCESSAMENTO COMPLETO...');
    
    const testMessage = "Gostaria de informações sobre os preços de exames";
    console.log('📤 Mensagem de teste:', testMessage);
    
    // 6. SIMULAR O QUE O LLM RECEBE EM PRODUÇÃO
    console.log('\n6️⃣ SIMULANDO O QUE O LLM RECEBE EM PRODUÇÃO...');
    
    // Simular o prepareSystemPrompt
    const systemPrompt = LLMOrchestratorService.prepareSystemPrompt(context, {});
    
    // 7. VERIFICAR SE AS INFORMAÇÕES ESTÃO NO PROMPT
    console.log('\n7️⃣ VERIFICANDO INFORMAÇÕES NO PROMPT:');
    
    const hasServices = systemPrompt.includes('Consulta Cardiológica') || 
                       systemPrompt.includes('Ecocardiograma') ||
                       systemPrompt.includes('Teste Ergométrico');
    
    const hasProfessionals = systemPrompt.includes('Dr. Roberto Silva') || 
                            systemPrompt.includes('Dra. Maria Fernanda');
    
    const hasDetailedServices = systemPrompt.includes('SERVIÇOS DISPONÍVEIS (INFORMAÇÕES COMPLETAS)');
    const hasDetailedProfessionals = systemPrompt.includes('PROFISSIONAIS DA CLÍNICA (INFORMAÇÕES COMPLETAS)');
    
    const hasPrices = systemPrompt.includes('preco_particular') || 
                     systemPrompt.includes('250') || 
                     systemPrompt.includes('200') ||
                     systemPrompt.includes('180');
    
    console.log('🔍 VERIFICAÇÕES:');
    console.log('   - Tem serviços no prompt:', hasServices);
    console.log('   - Tem profissionais no prompt:', hasProfessionals);
    console.log('   - Tem seção de serviços detalhados:', hasDetailedServices);
    console.log('   - Tem seção de profissionais detalhados:', hasDetailedProfessionals);
    console.log('   - Tem preços no prompt:', hasPrices);
    
    // 8. DEBUG: Verificar se há dados faltando
    console.log('\n8️⃣ DEBUG: VERIFICANDO DADOS FALTANDO:');
    
    if (context?.servicesDetails) {
      console.log('📋 SERVIÇOS DETALHADOS:');
      console.log('   - Consultas:', context.servicesDetails.consultas?.length || 0);
      console.log('   - Exames:', context.servicesDetails.exames?.length || 0);
      console.log('   - Procedimentos:', context.servicesDetails.procedimentos?.length || 0);
      
      if (context.servicesDetails.exames) {
        console.log('   🔬 EXAMES COM PREÇOS:');
        context.servicesDetails.exames.forEach((exame, i) => {
          console.log(`      ${i + 1}. ${exame.nome} - R$ ${exame.preco_particular || 'N/A'}`);
        });
      }
    }
    
    // 9. RESULTADO FINAL
    console.log('\n🎯 RESULTADO FINAL:');
    
    const hasCompleteContext = hasServices && hasProfessionals && hasDetailedServices && hasDetailedProfessionals;
    
    if (hasCompleteContext) {
      console.log('✅ CONTEXTUALIZAÇÃO COMPLETA FUNCIONANDO LOCALMENTE!');
      console.log('   PROBLEMA: Em produção não está funcionando');
      console.log('   POSSÍVEIS CAUSAS:');
      console.log('   - Cache do Railway');
      console.log('   - Variáveis de ambiente diferentes');
      console.log('   - Banco de dados diferente');
      console.log('   - Deploy não atualizou todos os arquivos');
    } else {
      console.log('❌ CONTEXTUALIZAÇÃO INCOMPLETA LOCALMENTE!');
      console.log('   PROBLEMA: Código não está funcionando');
    }
    
    // 10. RECOMENDAÇÕES
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('   1. Forçar novo deploy no Railway');
    console.log('   2. Verificar variáveis de ambiente em produção');
    console.log('   3. Verificar se banco de dados está igual');
    console.log('   4. Limpar cache do Railway se possível');
    
  } catch (error) {
    console.error('💥 ERRO NO TESTE:', error);
  }
}

testProductionSimulation();
