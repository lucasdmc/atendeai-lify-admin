// ========================================
// TESTE DE DEBUG DO PROBLEMA DE HORÁRIO
// ========================================

import { LLMOrchestratorService } from './services/core/llmOrchestratorService.js';

async function testDebugHorario() {
  console.log('🔍 DEBUG DO PROBLEMA DE HORÁRIO');
  console.log('================================');
  
  try {
    // 1. SIMULAR DADOS EXATOS DO BANCO (como mostrado no teste anterior)
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
    
    console.log('📋 Estrutura workingHours:', JSON.stringify(mockClinicContext.workingHours, null, 2));
    
    // 2. VERIFICAR HORÁRIO ATUAL
    console.log('\n🕒 2. VERIFICANDO HORÁRIO ATUAL');
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    console.log('📅 Data UTC:', now.toISOString());
    console.log('📅 Data Brasil:', brazilTime.toLocaleString());
    console.log('📅 Hora Brasil:', brazilTime.getHours() + ':' + brazilTime.getMinutes());
    console.log('📅 Dia da semana (número):', brazilTime.getDay());
    
    // 3. TESTAR FUNÇÃO getDayOfWeek
    console.log('\n🔍 3. TESTANDO FUNÇÃO getDayOfWeek');
    const dayNumber = brazilTime.getDay();
    const dayName = LLMOrchestratorService.getDayOfWeek(dayNumber);
    console.log('📅 Dia número:', dayNumber);
    console.log('📅 Dia nome:', dayName);
    console.log('📅 Horário configurado para este dia:', mockClinicContext.workingHours[dayName]);
    
    // 4. TESTAR FUNÇÃO parseTime
    console.log('\n🔍 4. TESTANDO FUNÇÃO parseTime');
    const testTime = "23:00";
    const parsedTime = LLMOrchestratorService.parseTime(testTime);
    console.log('📅 Tempo de teste:', testTime);
    console.log('📅 Tempo parseado:', parsedTime);
    
    // 5. TESTAR FUNÇÃO checkWorkingHours DIRETAMENTE
    console.log('\n🧪 5. TESTANDO FUNÇÃO checkWorkingHours DIRETAMENTE');
    const checkResult = LLMOrchestratorService.checkWorkingHours(mockClinicContext.workingHours);
    console.log('✅ Resultado checkWorkingHours:', checkResult);
    
    // 6. TESTAR FUNÇÃO isWithinBusinessHours
    console.log('\n🧪 6. TESTANDO FUNÇÃO isWithinBusinessHours');
    const isWithinBusinessHours = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
    console.log('✅ Resultado isWithinBusinessHours:', isWithinBusinessHours);
    
    // 7. VERIFICAR PROBLEMA ESPECÍFICO
    console.log('\n🔍 7. VERIFICANDO PROBLEMA ESPECÍFICO');
    const currentDay = dayName;
    const currentTime = brazilTime.getHours() * 100 + brazilTime.getMinutes();
    const todaySchedule = mockClinicContext.workingHours[currentDay];
    
    if (todaySchedule && todaySchedule.abertura && todaySchedule.fechamento) {
      const openingTime = LLMOrchestratorService.parseTime(todaySchedule.abertura);
      const closingTime = LLMOrchestratorService.parseTime(todaySchedule.fechamento);
      
      console.log('📊 Análise detalhada:');
      console.log('   - Dia atual:', currentDay);
      console.log('   - Horário atual (HHMM):', currentTime);
      console.log('   - Horário abertura (HHMM):', openingTime);
      console.log('   - Horário fechamento (HHMM):', closingTime);
      console.log('   - Está dentro?', currentTime >= openingTime && currentTime <= closingTime);
      console.log('   - Comparação:', `${currentTime} >= ${openingTime} && ${currentTime} <= ${closingTime}`);
      
      // Verificar se há problema com 23:00
      console.log('\n🔍 Verificação específica para 23:00:');
      console.log('   - 23:00 parseado:', LLMOrchestratorService.parseTime("23:00"));
      console.log('   - 19:55 parseado:', LLMOrchestratorService.parseTime("19:55"));
      console.log('   - 19:55 em HHMM:', 19 * 100 + 55);
    }
    
    // 8. TESTAR COM HORÁRIO ESPECÍFICO (19:55)
    console.log('\n🕒 8. TESTANDO COM HORÁRIO ESPECÍFICO (19:55)');
    const testTime1955 = 19 * 100 + 55; // 1955
    const testTime2300 = LLMOrchestratorService.parseTime("23:00"); // 2300
    
    console.log('📅 19:55 em HHMM:', testTime1955);
    console.log('📅 23:00 em HHMM:', testTime2300);
    console.log('📅 19:55 <= 23:00?', testTime1955 <= testTime2300);
    
    // 9. TESTAR FUNÇÃO applyResponseLogic
    console.log('\n🤖 9. TESTANDO FUNÇÃO applyResponseLogic');
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
    
    console.log('\n📊 RESUMO DO DEBUG');
    console.log('==================');
    console.log('✅ Dados do banco simulados corretamente');
    console.log('✅ Horário atual verificado');
    console.log('✅ Funções testadas individualmente');
    console.log('✅ Problema específico analisado');
    
    if (!isWithinBusinessHours) {
      console.log('\n🎯 PROBLEMA IDENTIFICADO:');
      console.log('O sistema está detectando que está FORA do horário mesmo com 23:00 configurado');
      console.log('Isso indica um bug na lógica de verificação de horário');
    } else {
      console.log('\n✅ SISTEMA FUNCIONANDO CORRETAMENTE');
      console.log('O sistema detecta que está DENTRO do horário de funcionamento');
    }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

// Executar teste
testDebugHorario();

