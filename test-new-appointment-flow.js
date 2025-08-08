// ========================================
// TESTE DO NOVO FLUXO DE AGENDAMENTO
// Verifica se o fluxo corrigido está funcionando
// ========================================

import { AppointmentConversationService } from './services/appointmentConversationService.js';

async function testNewAppointmentFlow() {
  console.log('🧪 [Teste] Testando novo fluxo de agendamento...');
  
  try {
    const patientPhone = '+554797192447';
    const clinicId = '4a73f615-b636-4134-8937-c20b5db5acac';
    
    // Simular fluxo completo
    const steps = [
      {
        message: 'Gostaria de agendar uma consulta',
        expectedStep: 'collecting_name',
        description: 'Início do agendamento'
      },
      {
        message: 'Lucas Cantoni',
        expectedStep: 'collecting_phone',
        description: 'Coleta do nome'
      },
      {
        message: 'mesmo',
        expectedStep: 'collecting_specialty',
        description: 'Coleta do telefone'
      },
      {
        message: 'Cardiologia Clínica',
        expectedStep: 'selecting_date',
        description: 'Coleta da especialidade'
      },
      {
        message: '1',
        expectedStep: 'selecting_time',
        description: 'Seleção da data'
      },
      {
        message: '1',
        expectedStep: 'selecting_doctor',
        description: 'Seleção do horário'
      }
    ];
    
    let currentState = null;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`\n📝 [Teste] Passo ${i + 1}: ${step.description}`);
      console.log(`📤 [Teste] Mensagem: "${step.message}"`);
      
      let result;
      if (i === 0) {
        // Primeira mensagem - iniciar conversa
        result = await AppointmentConversationService.processMessage(
          step.message,
          patientPhone,
          clinicId
        );
      } else {
        // Continuar conversa existente
        result = await AppointmentConversationService.processMessage(
          step.message,
          patientPhone,
          clinicId
        );
      }
      
      if (result && result.message) {
        console.log(`✅ [Teste] Resposta gerada: ${result.message.substring(0, 100)}...`);
        console.log(`📊 [Teste] Próximo passo: ${result.nextStep}`);
        console.log(`🔍 [Teste] Requer input: ${result.requiresInput}`);
        
        // Verificar se o passo está correto
        if (result.nextStep === step.expectedStep) {
          console.log(`✅ [Teste] Passo correto: ${step.expectedStep}`);
        } else {
          console.log(`❌ [Teste] Passo incorreto. Esperado: ${step.expectedStep}, Recebido: ${result.nextStep}`);
        }
        
        // Verificar se não há erro de carregamento
        if (result.message.includes('não foi possível carregar')) {
          console.log(`❌ [Teste] Erro de carregamento detectado`);
          return false;
        }
        
        currentState = result.state;
      } else {
        console.log(`❌ [Teste] Falha ao processar mensagem`);
        return false;
      }
    }
    
    console.log('\n🎉 [Teste] Novo fluxo de agendamento testado com sucesso!');
    return true;
    
  } catch (error) {
    console.error('💥 [Teste] Erro durante o teste:', error);
    console.error('📋 [Teste] Stack trace:', error.stack);
    return false;
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testNewAppointmentFlow()
    .then(success => {
      if (success) {
        console.log('\n✅ [Teste] Novo fluxo de agendamento está funcionando!');
        process.exit(0);
      } else {
        console.log('\n❌ [Teste] Novo fluxo de agendamento tem problemas!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 [Teste] Erro fatal no teste:', error);
      process.exit(1);
    });
}

export { testNewAppointmentFlow };
