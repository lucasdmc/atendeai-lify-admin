
// Sistema de testes automatizados para conversas fluidas
export class ConversationFlowTest {
  static async runAllTests(): Promise<void> {
    console.log('🧪 === INICIANDO TESTES COMPLETOS DE CONVERSAÇÃO ===');
    
    const testResults = {
      passed: 0,
      failed: 0,
      scenarios: []
    };
    
    // Teste 1: Primeiro contato
    console.log('\n🧪 Teste 1: Primeiro contato');
    try {
      const result = await this.testFirstContact();
      if (result.success) {
        testResults.passed++;
        console.log('✅ Teste 1 PASSOU');
      } else {
        testResults.failed++;
        console.log('❌ Teste 1 FALHOU:', result.error);
      }
      testResults.scenarios.push({ name: 'Primeiro contato', ...result });
    } catch (error) {
      testResults.failed++;
      console.log('❌ Teste 1 ERRO:', error);
    }
    
    // Teste 2: Agendamento
    console.log('\n🧪 Teste 2: Solicitação de agendamento');
    try {
      const result = await this.testAppointmentFlow();
      if (result.success) {
        testResults.passed++;
        console.log('✅ Teste 2 PASSOU');
      } else {
        testResults.failed++;
        console.log('❌ Teste 2 FALHOU:', result.error);
      }
      testResults.scenarios.push({ name: 'Agendamento', ...result });
    } catch (error) {
      testResults.failed++;
      console.log('❌ Teste 2 ERRO:', error);
    }
    
    // Teste 3: Urgência médica
    console.log('\n🧪 Teste 3: Urgência médica');
    try {
      const result = await this.testUrgentCase();
      if (result.success) {
        testResults.passed++;
        console.log('✅ Teste 3 PASSOU');
      } else {
        testResults.failed++;
        console.log('❌ Teste 3 FALHOU:', result.error);
      }
      testResults.scenarios.push({ name: 'Urgência médica', ...result });
    } catch (error) {
      testResults.failed++;
      console.log('❌ Teste 3 ERRO:', error);
    }
    
    // Teste 4: Ansiedade e preocupação
    console.log('\n🧪 Teste 4: Ansiedade e preocupação');
    try {
      const result = await this.testAnxietyResponse();
      if (result.success) {
        testResults.passed++;
        console.log('✅ Teste 4 PASSOU');
      } else {
        testResults.failed++;
        console.log('❌ Teste 4 FALHOU:', result.error);
      }
      testResults.scenarios.push({ name: 'Ansiedade', ...result });
    } catch (error) {
      testResults.failed++;
      console.log('❌ Teste 4 ERRO:', error);
    }
    
    // Teste 5: Conversa contínua
    console.log('\n🧪 Teste 5: Conversa contínua');
    try {
      const result = await this.testContinuousConversation();
      if (result.success) {
        testResults.passed++;
        console.log('✅ Teste 5 PASSOU');
      } else {
        testResults.failed++;
        console.log('❌ Teste 5 FALHOU:', result.error);
      }
      testResults.scenarios.push({ name: 'Conversa contínua', ...result });
    } catch (error) {
      testResults.failed++;
      console.log('❌ Teste 5 ERRO:', error);
    }
    
    // Relatório final
    this.generateTestReport(testResults);
  }
  
  static async testFirstContact(): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const { generateEnhancedAIResponse } = await import('./enhanced-openai-service.ts');
      
      const response = await generateEnhancedAIResponse(
        [], // contextData vazio para primeiro contato
        [], // histórico vazio
        'Olá',
        '5511999999999@s.whatsapp.net'
      );
      
      // Validações para primeiro contato
      const checks = [
        response.includes('Lia') || response.toLowerCase().includes('sou a lia'),
        response.includes('😊') || response.includes('💙'),
        response.toLowerCase().includes('nome') || response.toLowerCase().includes('quem'),
        response.toLowerCase().includes('como') && (response.toLowerCase().includes('está') || response.toLowerCase().includes('vai')),
        !response.toLowerCase().includes('ia') && !response.toLowerCase().includes('inteligência artificial')
      ];
      
      const allPassed = checks.every(check => check);
      
      return {
        success: allPassed,
        response,
        error: allPassed ? undefined : 'Resposta não atende aos critérios de primeiro contato'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async testAppointmentFlow(): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const { generateEnhancedAIResponse } = await import('./enhanced-openai-service.ts');
      
      const response = await generateEnhancedAIResponse(
        [{ question: 'Especialidades', answer: 'Cardiologia, Dermatologia, Clínico Geral' }],
        [{ content: 'Oi! Sou a Lia', message_type: 'sent' }],
        'Gostaria de agendar uma consulta',
        '5511999999999@s.whatsapp.net'
      );
      
      // Validações para agendamento
      const checks = [
        response.toLowerCase().includes('agend') || response.toLowerCase().includes('consulta'),
        response.includes('😊') || response.includes('💙'),
        response.toLowerCase().includes('especialidade') || response.toLowerCase().includes('data') || response.toLowerCase().includes('horário'),
        !response.toLowerCase().includes('erro') && !response.toLowerCase().includes('problema'),
        response.length > 20 && response.length < 300
      ];
      
      const allPassed = checks.every(check => check);
      
      return {
        success: allPassed,
        response,
        error: allPassed ? undefined : 'Resposta de agendamento não atende aos critérios'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async testUrgentCase(): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const { generateEnhancedAIResponse } = await import('./enhanced-openai-service.ts');
      
      const response = await generateEnhancedAIResponse(
        [{ question: 'Urgências', answer: 'Atendemos urgências das 8h às 18h' }],
        [{ content: 'Oi! Sou a Lia', message_type: 'sent' }],
        'Estou com uma dor muito forte! É urgente!',
        '5511999999999@s.whatsapp.net'
      );
      
      // Validações para urgência
      const checks = [
        response.toLowerCase().includes('urgente') || response.toLowerCase().includes('dor'),
        response.includes('😊') || response.includes('💙') || response.includes('🙏'),
        response.toLowerCase().includes('rápido') || response.toLowerCase().includes('agora') || response.toLowerCase().includes('prioridade'),
        !response.toLowerCase().includes('aguarde') || response.toLowerCase().includes('vou'),
        response.length > 30
      ];
      
      const allPassed = checks.every(check => check);
      
      return {
        success: allPassed,
        response,
        error: allPassed ? undefined : 'Resposta de urgência não demonstra empatia adequada'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async testAnxietyResponse(): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const { generateEnhancedAIResponse } = await import('./enhanced-openai-service.ts');
      
      const response = await generateEnhancedAIResponse(
        [{ question: 'Atendimento', answer: 'Oferecemos suporte completo aos pacientes' }],
        [{ content: 'Oi! Sou a Lia', message_type: 'sent' }],
        'Estou muito preocupado com meus sintomas, tenho medo que seja algo grave',
        '5511999999999@s.whatsapp.net'
      );
      
      // Validações para ansiedade
      const checks = [
        response.toLowerCase().includes('preocup') || response.toLowerCase().includes('entendo') || response.toLowerCase().includes('compreendo'),
        response.includes('💙') || response.includes('🙏'),
        response.toLowerCase().includes('ajudar') || response.toLowerCase().includes('cuidar'),
        response.toLowerCase().includes('equipe') || response.toLowerCase().includes('profissional') || response.toLowerCase().includes('médico'),
        !response.toLowerCase().includes('calma') // Evitar minimalizar a preocupação
      ];
      
      const allPassed = checks.every(check => check);
      
      return {
        success: allPassed,
        response,
        error: allPassed ? undefined : 'Resposta não demonstra empatia adequada para ansiedade'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async testContinuousConversation(): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const { generateEnhancedAIResponse } = await import('./enhanced-openai-service.ts');
      
      // Simular conversa contínua
      const responses = [];
      
      // Primeira mensagem
      const response1 = await generateEnhancedAIResponse(
        [],
        [],
        'Oi',
        '5511999999999@s.whatsapp.net'
      );
      responses.push(response1);
      
      // Segunda mensagem
      const response2 = await generateEnhancedAIResponse(
        [{ question: 'Especialidades', answer: 'Cardiologia, Dermatologia' }],
        [
          { content: 'Oi', message_type: 'received' },
          { content: response1, message_type: 'sent' }
        ],
        'Meu nome é João, gostaria de agendar',
        '5511999999999@s.whatsapp.net'
      );
      responses.push(response2);
      
      // Validações para continuidade
      const checks = [
        responses[0] !== responses[1], // Respostas diferentes
        responses[1].toLowerCase().includes('joão') || responses[1].toLowerCase().includes('agend'),
        responses.every(r => r.length > 20 && r.length < 400),
        responses.every(r => r.includes('😊') || r.includes('💙')),
        !responses.some(r => r.toLowerCase().includes('problema técnico'))
      ];
      
      const allPassed = checks.every(check => check);
      
      return {
        success: allPassed,
        response: `Resposta 1: ${responses[0]}\n\nResposta 2: ${responses[1]}`,
        error: allPassed ? undefined : 'Conversa contínua falhou na continuidade'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static generateTestReport(results: any): void {
    console.log('\n🎉 === RELATÓRIO FINAL DOS TESTES ===');
    console.log(`✅ Testes aprovados: ${results.passed}`);
    console.log(`❌ Testes falharam: ${results.failed}`);
    console.log(`📊 Taxa de sucesso: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 DETALHES POR CENÁRIO:');
    results.scenarios.forEach((scenario: any, index: number) => {
      console.log(`\n${index + 1}. ${scenario.name}: ${scenario.success ? '✅ PASSOU' : '❌ FALHOU'}`);
      if (!scenario.success && scenario.error) {
        console.log(`   Erro: ${scenario.error}`);
      }
      if (scenario.response) {
        console.log(`   Resposta: "${scenario.response.substring(0, 100)}..."`);
      }
    });
    
    if (results.failed === 0) {
      console.log('\n🎯 TODOS OS TESTES PASSARAM! Sistema pronto para conversa fluida.');
    } else {
      console.log('\n⚠️ ALGUNS TESTES FALHARAM. Revise os erros acima.');
    }
  }
}
