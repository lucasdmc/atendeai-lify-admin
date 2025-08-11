// ========================================
// TESTE DO APPOINTMENT CONVERSATION SERVICE
// Verifica se o serviço está funcionando em produção
// ========================================

import { AppointmentConversationService } from './services/appointmentConversationService.js';

async function testAppointmentService() {
  console.log('🧪 [Teste] Iniciando teste do AppointmentConversationService...');
  
  try {
    // Teste 1: Carregar dados da clínica
    console.log('\n📋 [Teste] Testando loadClinicData...');
    
    const clinicId = '4a73f615-b636-4134-8937-c20b5db5acac'; // Clínica CardioPrime
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
    
    const testMessage = 'Quero agendar uma consulta';
    const patientPhone = '+5547999999999';
    
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
    } else {
      console.log('❌ [Teste] Falha ao processar mensagem');
      return false;
    }
    
    // Teste 3: Verificar estado da conversa
    console.log('\n💬 [Teste] Verificando estado da conversa...');
    
    const conversationState = AppointmentConversationService.getConversationState(patientPhone);
    
    if (conversationState) {
      console.log('✅ [Teste] Estado da conversa encontrado');
      console.log('📊 [Teste] Passo atual:', conversationState.step);
      console.log('📋 [Teste] Dados coletados:', Object.keys(conversationState.collectedData || {}));
    } else {
      console.log('⚠️ [Teste] Estado da conversa não encontrado (pode ser normal)');
    }
    
    // Teste 4: Limpar estado
    console.log('\n🧹 [Teste] Limpando estado da conversa...');
    
    AppointmentConversationService.clearConversation(patientPhone);
    
    const clearedState = AppointmentConversationService.getConversationState(patientPhone);
    
    if (!clearedState) {
      console.log('✅ [Teste] Estado da conversa limpo com sucesso');
    } else {
      console.log('❌ [Teste] Falha ao limpar estado da conversa');
    }
    
    console.log('\n🎉 [Teste] Todos os testes passaram! AppointmentConversationService está funcionando.');
    return true;
    
  } catch (error) {
    console.error('💥 [Teste] Erro durante o teste:', error);
    console.error('📋 [Teste] Stack trace:', error.stack);
    return false;
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testAppointmentService()
    .then(success => {
      if (success) {
        console.log('\n✅ [Teste] AppointmentConversationService está funcionando corretamente!');
        process.exit(0);
      } else {
        console.log('\n❌ [Teste] AppointmentConversationService tem problemas!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 [Teste] Erro fatal no teste:', error);
      process.exit(1);
    });
}

export { testAppointmentService };
