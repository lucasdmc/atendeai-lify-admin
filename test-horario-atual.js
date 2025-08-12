// ========================================
// TESTE PARA IDENTIFICAR BUG NO HORÁRIO ATUAL
// ========================================

import { LLMOrchestratorService } from './services/core/llmOrchestratorService.js';

async function testHorarioAtual() {
  console.log('🔍 TESTE PARA IDENTIFICAR BUG NO HORÁRIO ATUAL');
  console.log('================================================');
  
  try {
    // 1. VERIFICAR HORÁRIO REAL ATUAL
    console.log('\n🕒 1. VERIFICANDO HORÁRIO REAL ATUAL');
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    console.log('📅 Data UTC:', now.toISOString());
    console.log('📅 Data Brasil:', brazilTime.toLocaleString());
    console.log('📅 Hora Brasil:', brazilTime.getHours() + ':' + brazilTime.getMinutes());
    console.log('📅 Dia da semana (número):', brazilTime.getDay());
    
    // 2. SIMULAR DADOS EXATOS DO BANCO (como mostrado no teste anterior)
    console.log('\n📋 2. SIMULANDO DADOS EXATOS DO BANCO');
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
    
    // 3. TESTAR FUNÇÃO getDayOfWeek
    console.log('\n🔍 3. TESTANDO FUNÇÃO getDayOfWeek');
    const dayNumber = brazilTime.getDay();
    const dayName = LLMOrchestratorService.getDayOfWeek(dayNumber);
    console.log('📅 Dia número:', dayNumber);
    console.log('📅 Dia nome:', dayName);
    console.log('📅 Horário configurado para este dia:', mockClinicContext.workingHours[dayName]);
    
    // 4. VERIFICAR PROBLEMA ESPECÍFICO
    console.log('\n🔍 4. VERIFICANDO PROBLEMA ESPECÍFICO');
    const currentTime = brazilTime.getHours() * 100 + brazilTime.getMinutes();
    const todaySchedule = mockClinicContext.workingHours[dayName];
    
    if (todaySchedule && todaySchedule.abertura && todaySchedule.fechamento) {
      const openingTime = LLMOrchestratorService.parseTime(todaySchedule.abertura);
      const closingTime = LLMOrchestratorService.parseTime(todaySchedule.fechamento);
      
      console.log('📊 Análise detalhada para horário atual:');
      console.log('   - Dia atual:', dayName);
      console.log('   - Horário atual (HHMM):', currentTime);
      console.log('   - Horário abertura (HHMM):', openingTime);
      console.log('   - Horário fechamento (HHMM):', closingTime);
      console.log('   - Está dentro?', currentTime >= openingTime && currentTime <= closingTime);
      console.log('   - Comparação:', `${currentTime} >= ${openingTime} && ${currentTime} <= ${closingTime}`);
      
      // Verificar se há problema com a lógica
      console.log('\n🔍 Verificação da lógica:');
      console.log('   -', currentTime, '>=', openingTime, '?', currentTime >= openingTime);
      console.log('   -', currentTime, '<=', closingTime, '?', currentTime <= closingTime);
      console.log('   - Ambos verdadeiros?', (currentTime >= openingTime) && (currentTime <= closingTime));
    }
    
    // 5. TESTAR FUNÇÃO checkWorkingHours DIRETAMENTE
    console.log('\n🧪 5. TESTANDO FUNÇÃO checkWorkingHours DIRETAMENTE');
    const checkResult = LLMOrchestratorService.checkWorkingHours(mockClinicContext.workingHours);
    console.log('✅ Resultado checkWorkingHours:', checkResult);
    
    // 6. TESTAR FUNÇÃO isWithinBusinessHours
    console.log('\n🧪 6. TESTANDO FUNÇÃO isWithinBusinessHours');
    const isWithinBusinessHours = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
    console.log('✅ Resultado isWithinBusinessHours:', isWithinBusinessHours);
    
    // 7. VERIFICAR SE HÁ PROBLEMA NA ORDEM DOS DIAS
    console.log('\n🔍 7. VERIFICANDO ORDEM DOS DIAS DA SEMANA');
    console.log('📅 Array de dias:', ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']);
    console.log('📅 Dia atual (número):', dayNumber);
    console.log('📅 Dia atual (nome):', dayName);
    
    // 8. TESTAR TODOS OS DIAS
    console.log('\n🔍 8. TESTANDO TODOS OS DIAS');
    for (let i = 0; i < 7; i++) {
      const testDayName = LLMOrchestratorService.getDayOfWeek(i);
      const testDaySchedule = mockClinicContext.workingHours[testDayName];
      console.log(`📅 Dia ${i} (${testDayName}):`, testDaySchedule);
    }
    
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
    
    console.log('\n📊 RESUMO DO TESTE');
    console.log('==================');
    console.log('✅ Horário atual verificado');
    console.log('✅ Dados do banco simulados');
    console.log('✅ Funções testadas individualmente');
    console.log('✅ Ordem dos dias verificada');
    
    if (!isWithinBusinessHours) {
      console.log('\n🎯 BUG IDENTIFICADO:');
      console.log('O sistema está detectando que está FORA do horário mesmo com 23:00 configurado');
      console.log('Isso indica um bug na lógica de verificação de horário');
      
      console.log('\n🔍 POSSÍVEIS CAUSAS:');
      console.log('1. Ordem incorreta dos dias da semana');
      console.log('2. Problema na função getDayOfWeek');
      console.log('3. Dados não estão sendo passados corretamente');
      console.log('4. Bug na função parseTime');
    } else {
      console.log('\n✅ SISTEMA FUNCIONANDO CORRETAMENTE');
      console.log('O sistema detecta que está DENTRO do horário de funcionamento');
      console.log('Se você ainda está recebendo mensagem "fora do horário", o problema está em outro lugar');
    }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

// Executar teste
testHorarioAtual();

