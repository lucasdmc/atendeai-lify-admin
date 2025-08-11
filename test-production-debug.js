import dotenv from 'dotenv';
import { ClinicContextManager } from './services/core/clinicContextManager.js';

dotenv.config();

async function testProductionDebug() {
  console.log('🔍 TESTE DE PRODUÇÃO - DEBUG SCHEMA DINÂMICO');
  console.log('==============================================');
  
  try {
    // 1. Testar inicialização
    console.log('\n1️⃣ Inicializando ClinicContextManager...');
    await ClinicContextManager.initialize();
    console.log('✅ Inicializado com sucesso');
    
    // 2. Testar busca de clínica
    console.log('\n2️⃣ Buscando clínica CardioPrime...');
    const clinicName = await ClinicContextManager.getClinicByWhatsApp('+554730915628');
    console.log('✅ Clínica encontrada:', clinicName);
    
    if (!clinicName) {
      console.log('❌ Nenhuma clínica encontrada para este WhatsApp');
      return;
    }
    
    // 3. Testar contexto completo
    console.log('\n3️⃣ Carregando contexto completo...');
    const context = await ClinicContextManager.getClinicContext(clinicName);
    
    console.log('📊 DADOS EXTRAÍDOS:');
    console.log('   - Nome:', context?.name);
    console.log('   - Endereço:', context?.address?.completo);
    console.log('   - Telefone:', context?.contacts?.telefone);
    console.log('   - Serviços:', context?.services?.length || 0);
    console.log('   - Profissionais:', context?.professionals?.length || 0);
    
    // 4. Testar dados específicos
    if (context?.services && context.services.length > 0) {
      console.log('\n📋 SERVIÇOS ENCONTRADOS:');
      context.services.slice(0, 3).forEach((service, i) => {
        console.log(`   ${i + 1}. ${service}`);
      });
    }
    
    if (context?.professionals && context.professionals.length > 0) {
      console.log('\n👨‍⚕️ PROFISSIONAIS ENCONTRADOS:');
      context.professionals.slice(0, 3).forEach((prof, i) => {
        console.log(`   ${i + 1}. ${prof}`);
      });
    }
    
    // 5. Testar se o LLM receberia essas informações
    console.log('\n4️⃣ VERIFICANDO SE LLM RECEBERIA:');
    console.log('   - hasServices:', !!context?.services?.length);
    console.log('   - hasProfessionals:', !!context?.professionals?.length);
    console.log('   - hasWorkingHours:', !!context?.workingHours);
    
    console.log('\n🎯 RESULTADO:');
    if (context?.services?.length > 0 && context?.professionals?.length > 0) {
      console.log('✅ SCHEMA DINÂMICO FUNCIONANDO - LLM deve receber informações completas');
    } else {
      console.log('❌ SCHEMA DINÂMICO FALHANDO - LLM não receberá informações completas');
    }
    
  } catch (error) {
    console.error('💥 ERRO NO TESTE:', error);
  }
}

testProductionDebug();
