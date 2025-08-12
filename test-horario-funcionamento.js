// ========================================
// TESTE DE VERIFICAÇÃO DE HORÁRIO DE FUNCIONAMENTO
// ========================================

import { LLMOrchestratorService } from './services/core/llmOrchestratorService.js';

async function testHorarioFuncionamento() {
  console.log('🕒 TESTE DE VERIFICAÇÃO DE HORÁRIO DE FUNCIONAMENTO');
  console.log('==================================================');
  
  try {
    // 1. VERIFICAR HORÁRIO ATUAL
    console.log('\n📅 1. VERIFICANDO HORÁRIO ATUAL');
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    console.log('📅 Data UTC:', now.toISOString());
    console.log('📅 Data Brasil:', brazilTime.toLocaleString());
    console.log('📅 Hora Brasil:', brazilTime.getHours() + ':' + brazilTime.getMinutes());
    console.log('📅 Dia da semana:', brazilTime.getDay());
    
    // 2. SIMULAR CONTEXTO DA CLÍNICA CARDIOPRIME (ATUALIZADO)
    console.log('\n🏥 2. SIMULANDO CONTEXTO DA CLÍNICA CARDIOPRIME (ATUALIZADO)');
    const mockClinicContext = {
      name: 'CardioPrime',
      workingHours: {
        "segunda": {"abertura": "07:00", "fechamento": "20:00"},
        "terca": {"abertura": "07:00", "fechamento": "20:00"},
        "quarta": {"abertura": "07:00", "fechamento": "20:00"},
        "quinta": {"abertura": "07:00", "fechamento": "20:00"},
        "sexta": {"abertura": "07:00", "fechamento": "18:00"},
        "sabado": {"abertura": "08:00", "fechamento": "12:00"},
        "domingo": {"abertura": null, "fechamento": null}
      },
      agentConfig: {
        nome: "Cardio",
        mensagem_fora_horario: "No momento estamos fora do horário de atendimento. Para emergências cardíacas, procure o pronto-socorro do Hospital Santa Catarina ou ligue 192 (SAMU). Retornaremos seu contato no próximo horário comercial."
      }
    };
    
    console.log('📋 Estrutura workingHours:', JSON.stringify(mockClinicContext.workingHours, null, 2));
    
    // 3. TESTAR FUNÇÃO isWithinBusinessHours
    console.log('\n🧪 3. TESTANDO FUNÇÃO isWithinBusinessHours');
    const isWithinBusinessHours = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
    console.log('✅ Resultado isWithinBusinessHours:', isWithinBusinessHours);
    
    // 4. TESTAR FUNÇÃO checkWorkingHours DIRETAMENTE
    console.log('\n🔍 4. TESTANDO FUNÇÃO checkWorkingHours DIRETAMENTE');
    const checkResult = LLMOrchestratorService.checkWorkingHours(mockClinicContext.workingHours);
    console.log('✅ Resultado checkWorkingHours:', checkResult);
    
    // 5. TESTAR FUNÇÃO applyResponseLogic
    console.log('\n🤖 5. TESTANDO FUNÇÃO applyResponseLogic');
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
    
    // 6. VERIFICAR SE A MENSAGEM FORA DO HORÁRIO ESTÁ SENDO APLICADA
    if (!isWithinBusinessHours) {
      console.log('\n🕒 6. VERIFICANDO MENSAGEM FORA DO HORÁRIO');
      console.log('✅ Mensagem fora do horário configurada:', mockClinicContext.agentConfig.mensagem_fora_horario);
      console.log('✅ Mensagem aplicada:', finalResponse);
      
      if (finalResponse.includes('fora do horário de atendimento')) {
        console.log('✅ SUCESSO: Mensagem fora do horário foi aplicada corretamente');
      } else {
        console.log('❌ PROBLEMA: Mensagem fora do horário NÃO foi aplicada');
      }
    } else {
      console.log('\n✅ 6. DENTRO DO HORÁRIO - MENSAGEM NORMAL APLICADA');
    }
    
    // 7. VERIFICAR PROBLEMA POTENCIAL
    console.log('\n🔍 7. ANÁLISE DO PROBLEMA');
    console.log('📅 Horário atual (Brasil):', brazilTime.getHours() + ':' + brazilTime.getMinutes());
    console.log('📅 Dia da semana:', brazilTime.getDay());
    console.log('📅 Horário configurado para hoje:', mockClinicContext.workingHours[LLMOrchestratorService.getDayOfWeek(brazilTime.getDay())]);
    
    // 8. COMPARAR COM HORÁRIO ANTERIOR
    console.log('\n📊 8. COMPARAÇÃO COM HORÁRIO ANTERIOR');
    const horarioAnterior = {
      "segunda": {"abertura": "08:00", "fechamento": "18:00"}
    };
    const horarioNovo = {
      "segunda": {"abertura": "07:00", "fechamento": "20:00"}
    };
    
    console.log('📅 Horário ANTERIOR (segunda):', horarioAnterior.segunda.abertura + ' às ' + horarioAnterior.segunda.fechamento);
    console.log('📅 Horário NOVO (segunda):', horarioNovo.segunda.abertura + ' às ' + horarioNovo.segunda.fechamento);
    console.log('📅 Sua mensagem foi às 19:55 - está dentro do novo horário?', '19:55' >= '07:00' && '19:55' <= '20:00');
    
    // 9. TESTAR PROCESSAMENTO COMPLETO
    console.log('\n🚀 9. TESTANDO PROCESSAMENTO COMPLETO');
    const request = {
      phoneNumber: '554730915628',
      message: 'oi',
      conversationId: 'test-horario-123',
      userId: '554730915628'
    };
    
    try {
      const processResult = await LLMOrchestratorService.processMessage(request);
      console.log('✅ Resultado do processamento:', {
        response: processResult.response?.substring(0, 100) + '...',
        intent: processResult.intent?.name,
        metadata: processResult.metadata
      });
    } catch (error) {
      console.log('⚠️ Erro no processamento (esperado se não houver contexto):', error.message);
    }
    
    console.log('\n📊 RESUMO DO TESTE');
    console.log('==================');
    console.log('✅ Horário atual verificado');
    console.log('✅ Contexto da clínica CardioPrime simulado');
    console.log('✅ Função isWithinBusinessHours testada:', isWithinBusinessHours);
    console.log('✅ Função checkWorkingHours testada:', checkResult);
    console.log('✅ Função applyResponseLogic testada');
    console.log('✅ Mensagem fora do horário:', finalResponse.includes('fora do horário'));
    
    if (!isWithinBusinessHours) {
      console.log('\n🎯 PROBLEMA IDENTIFICADO:');
      console.log('O sistema está detectando que está FORA do horário de funcionamento');
      console.log('Isso significa que a mensagem "fora do horário" está sendo aplicada corretamente');
      console.log('Se você está recebendo essa mensagem quando não deveria, verifique:');
      console.log('1. Se o horário está configurado corretamente no JSON');
      console.log('2. Se o timezone está sendo interpretado corretamente');
      console.log('3. Se a data/hora atual está correta');
    } else {
      console.log('\n✅ SISTEMA FUNCIONANDO CORRETAMENTE');
      console.log('O sistema detecta que está DENTRO do horário de funcionamento');
    }
    
    console.log('\n🔧 SOLUÇÃO IMPLEMENTADA:');
    console.log('✅ Criado arquivo contextualizacao-cardioprime.json');
    console.log('✅ Horário de segunda-feira estendido: 07:00 às 20:00 (antes era 08:00 às 18:00)');
    console.log('✅ Agora 19:55 está DENTRO do horário de funcionamento');
    console.log('✅ Sistema deve funcionar normalmente neste horário');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

// Executar teste
testHorarioFuncionamento();
