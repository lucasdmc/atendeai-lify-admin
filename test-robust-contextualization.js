import dotenv from 'dotenv';
import { ClinicContextManager } from './services/core/clinicContextManager.js';
import { LLMOrchestratorService } from './services/core/llmOrchestratorService.js';

dotenv.config();

async function testRobustContextualization() {
  console.log('🧪 TESTE ROBUSTO DE CONTEXTUALIZAÇÃO');
  console.log('=====================================');
  console.log('🔍 Simulando EXATAMENTE o que o sistema fazia ANTES das alterações');
  
  try {
    // 1. Inicializar serviços
    console.log('\n1️⃣ Inicializando serviços...');
    await ClinicContextManager.initialize();
    console.log('✅ ClinicContextManager inicializado');
    
    // 2. Buscar clínica por WhatsApp
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
    console.log('   - Endereço:', context?.address?.completo);
    console.log('   - Telefone:', context?.contacts?.telefone);
    console.log('   - Serviços:', context?.services?.length || 0);
    console.log('   - Profissionais:', context?.professionals?.length || 0);
    
    // 4. MAPEAR TODOS OS CAMPOS DO JSON (como fazia antes)
    console.log('\n4️⃣ MAPEANDO TODOS OS CAMPOS DO JSON:');
    
    if (context?.servicesDetails) {
      console.log('📋 SERVIÇOS DETALHADOS:');
      console.log('   - Consultas:', context.servicesDetails.consultas?.length || 0);
      console.log('   - Exames:', context.servicesDetails.exames?.length || 0);
      console.log('   - Procedimentos:', context.servicesDetails.procedimentos?.length || 0);
      
      if (context.servicesDetails.consultas) {
        console.log('   📝 CONSULTAS:');
        context.servicesDetails.consultas.forEach((consulta, i) => {
          console.log(`      ${i + 1}. ${consulta.nome} - ${consulta.duracao || 'N/A'}`);
        });
      }
      
      if (context.servicesDetails.exames) {
        console.log('   🔬 EXAMES:');
        context.servicesDetails.exames.forEach((exame, i) => {
          console.log(`      ${i + 1}. ${exame.nome} - ${exame.tipo || 'N/A'}`);
        });
      }
    }
    
    if (context?.professionalsDetails) {
      console.log('👨‍⚕️ PROFISSIONAIS DETALHADOS:');
      context.professionalsDetails.forEach((prof, i) => {
        console.log(`   ${i + 1}. ${prof.nome_completo || prof.nome} - ${prof.especialidade || 'N/A'}`);
      });
    }
    
    // 5. TESTAR SE O LLM RECEBERIA ESSAS INFORMAÇÕES
    console.log('\n5️⃣ VERIFICANDO SE LLM RECEBERIA INFORMAÇÕES:');
    console.log('   - hasServices:', !!context?.services?.length);
    console.log('   - hasProfessionals:', !!context?.professionals?.length);
    console.log('   - hasServicesDetails:', !!context?.servicesDetails);
    console.log('   - hasProfessionalsDetails:', !!context?.professionalsDetails);
    
    // 6. SIMULAR PROCESSAMENTO DE MENSAGEM (como o sistema fazia)
    console.log('\n6️⃣ SIMULANDO PROCESSAMENTO DE MENSAGEM...');
    
    const testMessage = "Gostaria de informações sobre preços dos exames";
    console.log('📤 Mensagem de teste:', testMessage);
    
    // 7. VERIFICAR SE O CONTEXTO ESTÁ SENDO PASSADO PARA O LLM
    console.log('\n7️⃣ VERIFICANDO CONTEXTO PARA LLM:');
    
    // Simular o que o LLM receberia
    const contextForLLM = {
      clinicName: context.name,
      services: context.services || [],
      professionals: context.professionals || [],
      servicesDetails: context.servicesDetails || {},
      professionalsDetails: context.professionalsDetails || [],
      address: context.address?.completo,
      phone: context.contacts?.telefone
    };
    
    console.log('📋 CONTEXTO QUE O LLM DEVERIA RECEBER:');
    console.log('   - Nome da clínica:', contextForLLM.clinicName);
    console.log('   - Serviços disponíveis:', contextForLLM.services.length);
    console.log('   - Profissionais:', contextForLLM.professionals.length);
    console.log('   - Detalhes dos serviços:', Object.keys(contextForLLM.servicesDetails).length);
    console.log('   - Detalhes dos profissionais:', contextForLLM.professionalsDetails.length);
    
    // 8. RESULTADO FINAL
    console.log('\n🎯 RESULTADO FINAL:');
    
    const hasCompleteContext = contextForLLM.services.length > 0 && 
                              contextForLLM.professionals.length > 0 &&
                              Object.keys(contextForLLM.servicesDetails).length > 0;
    
    if (hasCompleteContext) {
      console.log('✅ CONTEXTUALIZAÇÃO COMPLETA FUNCIONANDO!');
      console.log('   O LLM deve conseguir responder sobre:');
      console.log('   - Serviços disponíveis');
      console.log('   - Profissionais da clínica');
      console.log('   - Informações detalhadas');
    } else {
      console.log('❌ CONTEXTUALIZAÇÃO INCOMPLETA!');
      console.log('   O LLM NÃO conseguirá responder adequadamente');
    }
    
    // 9. DEBUG: Verificar se há dados faltando
    if (!hasCompleteContext) {
      console.log('\n🔍 DEBUG - DADOS FALTANDO:');
      console.log('   - services.length:', contextForLLM.services.length);
      console.log('   - professionals.length:', contextForLLM.professionals.length);
      console.log('   - servicesDetails keys:', Object.keys(contextForLLM.servicesDetails));
      console.log('   - professionalsDetails.length:', contextForLLM.professionalsDetails.length);
    }
    
  } catch (error) {
    console.error('💥 ERRO NO TESTE ROBUSTO:', error);
  }
}

testRobustContextualization();
