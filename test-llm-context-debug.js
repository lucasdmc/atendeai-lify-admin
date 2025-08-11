import dotenv from 'dotenv';
import { ClinicContextManager } from './services/core/clinicContextManager.js';
import { LLMOrchestratorService } from './services/core/llmOrchestratorService.js';

dotenv.config();

async function testLLMContextDebug() {
  console.log('🔍 DEBUG COMPLETO DO CONTEXTO DO LLM');
  console.log('=====================================');
  console.log('🔍 Simulando EXATAMENTE o que o LLM recebe');
  
  try {
    // 1. Inicializar serviços
    console.log('\n1️⃣ Inicializando serviços...');
    await ClinicContextManager.initialize();
    console.log('✅ ClinicContextManager inicializado');
    
    // 2. Buscar clínica
    console.log('\n2️⃣ Buscando clínica CardioPrime...');
    const clinicName = await ClinicContextManager.getClinicByWhatsApp('+554730915628');
    console.log('✅ Clínica encontrada:', clinicName);
    
    if (!clinicName) {
      console.log('❌ Nenhuma clínica encontrada');
      return;
    }
    
    // 3. Carregar contexto COMPLETO
    console.log('\n3️⃣ Carregando contexto COMPLETO...');
    const context = await ClinicContextManager.getClinicContext(clinicName);
    
    console.log('📊 CONTEXTO CARREGADO:');
    console.log('   - Nome:', context?.name);
    console.log('   - Serviços:', context?.services?.length || 0);
    console.log('   - Profissionais:', context?.professionals?.length || 0);
    console.log('   - ServicesDetails:', !!context?.servicesDetails);
    console.log('   - ProfessionalsDetails:', !!context?.professionalsDetails);
    
    // 4. SIMULAR EXATAMENTE O QUE O LLM RECEBE
    console.log('\n4️⃣ SIMULANDO EXATAMENTE O QUE O LLM RECEBE...');
    
    // Simular o prepareSystemPrompt
    const systemPrompt = LLMOrchestratorService.prepareSystemPrompt(context, {});
    
    console.log('📋 PROMPT DO SISTEMA GERADO:');
    console.log('==============================');
    console.log(systemPrompt);
    console.log('==============================');
    
    // 5. VERIFICAR SE AS INFORMAÇÕES ESTÃO NO PROMPT
    console.log('\n5️⃣ VERIFICANDO SE INFORMAÇÕES ESTÃO NO PROMPT:');
    
    const hasServices = systemPrompt.includes('Consulta Cardiológica') || 
                       systemPrompt.includes('Ecocardiograma') ||
                       systemPrompt.includes('Teste Ergométrico');
    
    const hasProfessionals = systemPrompt.includes('Dr. Roberto Silva') || 
                            systemPrompt.includes('Dra. Maria Fernanda');
    
    const hasDetailedServices = systemPrompt.includes('SERVIÇOS DISPONÍVEIS (INFORMAÇÕES COMPLETAS)');
    const hasDetailedProfessionals = systemPrompt.includes('PROFISSIONAIS DA CLÍNICA (INFORMAÇÕES COMPLETAS)');
    
    console.log('🔍 VERIFICAÇÕES:');
    console.log('   - Tem serviços no prompt:', hasServices);
    console.log('   - Tem profissionais no prompt:', hasProfessionals);
    console.log('   - Tem seção de serviços detalhados:', hasDetailedServices);
    console.log('   - Tem seção de profissionais detalhados:', hasDetailedProfessionals);
    
    // 6. DEBUG: Verificar se o contexto está sendo passado corretamente
    console.log('\n6️⃣ DEBUG: VERIFICANDO ESTRUTURA DO CONTEXTO:');
    
    console.log('📋 ESTRUTURA COMPLETA DO CONTEXTO:');
    console.log('   - context.services:', context?.services);
    console.log('   - context.professionals:', context?.professionals);
    console.log('   - context.servicesDetails:', context?.servicesDetails);
    console.log('   - context.professionalsDetails:', context?.professionalsDetails);
    
    // 7. VERIFICAR SE O PROBLEMA É NO prepareSystemPrompt
    console.log('\n7️⃣ VERIFICANDO SE O PROBLEMA É NO prepareSystemPrompt:');
    
    if (hasDetailedServices && hasDetailedProfessionals) {
      console.log('✅ prepareSystemPrompt está funcionando - problema deve ser em outro lugar');
    } else {
      console.log('❌ prepareSystemPrompt NÃO está funcionando - problema identificado!');
      
      // Debug adicional
      console.log('\n🔍 DEBUG ADICIONAL:');
      console.log('   - context.servicesDetails keys:', Object.keys(context?.servicesDetails || {}));
      console.log('   - context.professionalsDetails length:', context?.professionalsDetails?.length);
      
      if (context?.servicesDetails) {
        console.log('   - Consultas:', context.servicesDetails.consultas?.length);
        console.log('   - Exames:', context.servicesDetails.exames?.length);
        console.log('   - Procedimentos:', context.servicesDetails.procedimentos?.length);
      }
    }
    
    // 8. RESULTADO FINAL
    console.log('\n🎯 RESULTADO FINAL:');
    
    if (hasServices && hasProfessionals && hasDetailedServices && hasDetailedProfessionals) {
      console.log('✅ CONTEXTUALIZAÇÃO COMPLETA FUNCIONANDO!');
      console.log('   O LLM deve conseguir responder sobre tudo');
    } else {
      console.log('❌ CONTEXTUALIZAÇÃO INCOMPLETA!');
      console.log('   PROBLEMA IDENTIFICADO:');
      
      if (!hasDetailedServices) console.log('   - Seção de serviços detalhados não está sendo gerada');
      if (!hasDetailedProfessionals) console.log('   - Seção de profissionais detalhados não está sendo gerada');
      if (!hasServices) console.log('   - Serviços não estão sendo incluídos no prompt');
      if (!hasProfessionals) console.log('   - Profissionais não estão sendo incluídos no prompt');
    }
    
  } catch (error) {
    console.error('💥 ERRO NO TESTE:', error);
  }
}

testLLMContextDebug();
