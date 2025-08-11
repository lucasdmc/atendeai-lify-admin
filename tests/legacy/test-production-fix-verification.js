// ========================================
// TESTE DE VERIFICAÇÃO PÓS-DEPLOY
// Verifica se o AppointmentConversationService está funcionando
// ========================================

import { AppointmentConversationService } from './services/appointmentConversationService.js';

async function testProductionFix() {
  console.log('🧪 [Teste] Verificando se o fix foi aplicado em produção...');
  
  try {
    // Teste 1: Carregar dados da clínica
    console.log('\n📋 [Teste] Testando loadClinicData...');
    
    const clinicId = '4a73f615-b636-4134-8937-c20b5db5acac';
    const clinicData = await AppointmentConversationService.loadClinicData(clinicId);
    
    if (clinicData) {
      console.log('✅ [Teste] Dados da clínica carregados com sucesso');
      console.log('📊 [Teste] Estrutura dos dados:', {
        hasClinica: !!clinicData.clinica,
        hasProfissionais: !!clinicData.profissionais,
        clinicaName: clinicData.clinica?.informacoes_basicas?.nome,
        profissionaisCount: clinicData.profissionais?.length || 0
      });
    } else {
      console.log('❌ [Teste] Falha ao carregar dados da clínica');
      return false;
    }
    
    // Teste 2: Processar mensagem de agendamento
    console.log('\n📅 [Teste] Testando processMessage...');
    
    const testMessage = 'agendar';
    const patientPhone = '+554797192447';
    
    const result = await AppointmentConversationService.processMessage(
      testMessage,
      patientPhone,
      clinicId
    );
    
    if (result && result.message) {
      console.log('✅ [Teste] Mensagem processada com sucesso');
      console.log('📝 [Teste] Resposta:', result.message.substring(0, 100) + '...');
      console.log('📊 [Teste] Próximo passo:', result.nextStep);
      console.log('🔍 [Teste] Requer input:', result.requiresInput);
      
      // Verificar se não é a mensagem de erro
      if (result.message.includes('não foi possível carregar')) {
        console.log('❌ [Teste] Ainda retornando erro de carregamento');
        return false;
      } else {
        console.log('✅ [Teste] Não retornando erro de carregamento');
      }
    } else {
      console.log('❌ [Teste] Falha ao processar mensagem');
      return false;
    }
    
    console.log('\n🎉 [Teste] Fix aplicado com sucesso! AppointmentConversationService está funcionando.');
    return true;
    
  } catch (error) {
    console.error('💥 [Teste] Erro durante o teste:', error);
    console.error('📋 [Teste] Stack trace:', error.stack);
    return false;
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testProductionFix()
    .then(success => {
      if (success) {
        console.log('\n✅ [Teste] Fix foi aplicado com sucesso!');
        process.exit(0);
      } else {
        console.log('\n❌ [Teste] Fix ainda não foi aplicado!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 [Teste] Erro fatal no teste:', error);
      process.exit(1);
    });
}

export { testProductionFix };
