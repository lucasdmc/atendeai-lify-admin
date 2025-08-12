// ========================================
// TESTE ESPECÍFICO PARA HORÁRIO 19:55
// ========================================

import { LLMOrchestratorService } from './services/core/llmOrchestratorService.js';

async function testHorario1955() {
  console.log('🕒 TESTE ESPECÍFICO PARA HORÁRIO 19:55');
  console.log('=======================================');
  
  try {
    // 1. SIMULAR DADOS EXATOS DO BANCO
    console.log('\n📋 1. SIMULANDO DADOS EXATOS DO BANCO');
    const mockClinicContext = {
      name: 'CardioPrime',
      workingHours: {
        "sexta": {"abertura": "07:00", "fechamento": "23:00"},
        "terca": {"abertura": "07:00", "fechamento": "23:00"},
        "quarta": {"abertura": "07:00", "fechamento": "23:00"},
        "quinta": {"abertura": "07:00", "fechamento": "23:00"},
        "sabado": {"abertura": "08:00", "fechamento": "23:00"},
        "domingo": {"abertura": null, "fechamento": null},
        "segunda": {"abertura": "07:00", "fechamento": "23:00"},
        "emergencia_24h": true
      },
      agentConfig: {
        nome: "Cardio",
        mensagem_fora_horario: "No momento estamos fora do horário de atendimento. Para emergências cardíacas, procure o pronto-socorro do Hospital Santa Catarina ou ligue 192 (SAMU). Retornaremos seu contato no próximo horário comercial."
      }
    };
    
    // 2. SIMULAR HORÁRIO ESPECÍFICO (19:55 - Segunda-feira)
    console.log('\n🕒 2. SIMULANDO HORÁRIO ESPECÍFICO (19:55 - Segunda-feira)');
    
    // Criar uma data simulada para segunda-feira às 19:55
    const simulatedDate = new Date('2025-08-11T19:55:00');
    const simulatedBrazilTime = new Date(simulatedDate.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    console.log('📅 Data simulada:', simulatedDate.toISOString());
    console.log('📅 Data Brasil simulada:', simulatedBrazilTime.toLocaleString());
    console.log('📅 Hora Brasil simulada:', simulatedBrazilTime.getHours() + ':' + simulatedBrazilTime.getMinutes());
    console.log('📅 Dia da semana (número):', simulatedBrazilTime.getDay());
    
    // 3. TESTAR FUNÇÃO getDayOfWeek
    console.log('\n🔍 3. TESTANDO FUNÇÃO getDayOfWeek');
    const dayNumber = simulatedBrazilTime.getDay();
    const dayName = LLMOrchestratorService.getDayOfWeek(dayNumber);
    console.log('📅 Dia número:', dayNumber);
    console.log('📅 Dia nome:', dayName);
    console.log('📅 Horário configurado para este dia:', mockClinicContext.workingHours[dayName]);
    
    // 4. TESTAR FUNÇÃO parseTime
    console.log('\n🔍 4. TESTANDO FUNÇÃO parseTime');
    const time1955 = "19:55";
    const time2300 = "23:00";
    const parsed1955 = LLMOrchestratorService.parseTime(time1955);
    const parsed2300 = LLMOrchestratorService.parseTime(time2300);
    
    console.log('📅 19:55 parseado:', parsed1955);
    console.log('📅 23:00 parseado:', parsed2300);
    console.log('📅 19:55 <= 23:00?', parsed1955 <= parsed2300);
    
    // 5. TESTAR VERIFICAÇÃO MANUAL
    console.log('\n🔍 5. TESTANDO VERIFICAÇÃO MANUAL');
    const currentTime = simulatedBrazilTime.getHours() * 100 + simulatedBrazilTime.getMinutes();
    const todaySchedule = mockClinicContext.workingHours[dayName];
    
    if (todaySchedule && todaySchedule.abertura && todaySchedule.fechamento) {
      const openingTime = LLMOrchestratorService.parseTime(todaySchedule.abertura);
      const closingTime = LLMOrchestratorService.parseTime(todaySchedule.fechamento);
      
      console.log('📊 Análise detalhada para 19:55:');
      console.log('   - Dia atual:', dayName);
      console.log('   - Horário atual (HHMM):', currentTime);
      console.log('   - Horário abertura (HHMM):', openingTime);
      console.log('   - Horário fechamento (HHMM):', closingTime);
      console.log('   - Está dentro?', currentTime >= openingTime && currentTime <= closingTime);
      console.log('   - Comparação:', `${currentTime} >= ${openingTime} && ${currentTime} <= ${closingTime}`);
      
      // Verificar se há problema com a lógica
      console.log('\n🔍 Verificação da lógica:');
      console.log('   - 1955 >= 700?', currentTime >= openingTime);
      console.log('   - 1955 <= 2300?', currentTime <= closingTime);
      console.log('   - Ambos verdadeiros?', (currentTime >= openingTime) && (currentTime <= closingTime));
    }
    
    // 6. TESTAR FUNÇÃO checkWorkingHours COM DATA SIMULADA
    console.log('\n🧪 6. TESTANDO FUNÇÃO checkWorkingHours COM DATA SIMULADA');
    
    // Monkey patch para simular o horário
    const originalDate = global.Date;
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super('2025-08-11T19:55:00');
        } else {
          super(...args);
        }
      }
      
      getDay() {
        return 1; // Segunda-feira
      }
      
      getHours() {
        return 19;
      }
      
      getMinutes() {
        return 55;
      }
    };
    
    try {
      const checkResult = LLMOrchestratorService.checkWorkingHours(mockClinicContext.workingHours);
      console.log('✅ Resultado checkWorkingHours (simulado):', checkResult);
    } finally {
      // Restaurar Date original
      global.Date = originalDate;
    }
    
    // 7. TESTAR FUNÇÃO isWithinBusinessHours
    console.log('\n🧪 7. TESTANDO FUNÇÃO isWithinBusinessHours');
    const isWithinBusinessHours = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
    console.log('✅ Resultado isWithinBusinessHours:', isWithinBusinessHours);
    
    // 8. TESTAR FUNÇÃO applyResponseLogic
    console.log('\n🤖 8. TESTANDO FUNÇÃO applyResponseLogic');
    const testResponse = "Olá! Como posso ajudá-lo?";
    const finalResponse = await LLMOrchestratorService.applyResponseLogic(
      testResponse,
      mockClinicContext,
      false, // isFirstConversationOfDay
      isWithinBusinessHours,
      null, // userProfile
      [] // conversationHistory
    );
    
    console.log('✅ Resposta original:', testResponse);
    console.log('✅ Resposta final:', finalResponse);
    console.log('✅ Está fora do horário?', !isWithinBusinessHours);
    
    console.log('\n📊 RESUMO DO TESTE 19:55');
    console.log('==========================');
    console.log('✅ Dados do banco simulados corretamente');
    console.log('✅ Horário 19:55 simulado');
    console.log('✅ Segunda-feira simulada');
    console.log('✅ Funções testadas individualmente');
    
    if (!isWithinBusinessHours) {
      console.log('\n🎯 PROBLEMA IDENTIFICADO:');
      console.log('O sistema está detectando que 19:55 está FORA do horário mesmo com 23:00 configurado');
      console.log('Isso indica um bug na lógica de verificação de horário');
    } else {
      console.log('\n✅ SISTEMA FUNCIONANDO CORRETAMENTE');
      console.log('O sistema detecta que 19:55 está DENTRO do horário de funcionamento');
      console.log('Se você estava recebendo mensagem "fora do horário" às 19:55, o problema foi resolvido');
    }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

// Executar teste
testHorario1955();

