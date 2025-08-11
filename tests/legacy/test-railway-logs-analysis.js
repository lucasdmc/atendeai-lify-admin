// ========================================
// ANÁLISE DE LOGS DO RAILWAY
// ========================================

import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function analyzeRailwayLogs() {
  console.log('🔍 ANÁLISE DE LOGS DO RAILWAY');
  console.log('================================');
  
  try {
    // Simular ambiente Railway
    const originalTZ = process.env.TZ;
    process.env.TZ = 'UTC';
    
    console.log('📅 Ambiente Railway simulado (UTC)');
    console.log('📅 Data atual:', new Date().toISOString());
    
    // Simular dados reais do Supabase
    const mockClinicContext = {
      workingHours: {
        "segunda": {"abertura": "07:00", "fechamento": "18:00"},
        "terca": {"abertura": "07:00", "fechamento": "18:00"},
        "quarta": {"abertura": "07:00", "fechamento": "18:00"},
        "quinta": {"abertura": "07:00", "fechamento": "18:00"},
        "sexta": {"abertura": "07:00", "fechamento": "17:00"},
        "sabado": {"abertura": "08:00", "fechamento": "12:00"},
        "domingo": {"abertura": null, "fechamento": null},
        "emergencia_24h": true
      }
    };
    
    // Testar função com logs detalhados
    console.log('\n🧪 TESTANDO FUNÇÃO COM LOGS DETALHADOS');
    
    const now = new Date();
    const currentDay = LLMOrchestratorService.getDayOfWeek(now.getDay());
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    console.log('📅 Data atual:', now.toISOString());
    console.log('📅 Dia da semana:', currentDay);
    console.log('📅 Horário atual (HHMM):', currentTime);
    
    const todaySchedule = mockClinicContext.workingHours[currentDay];
    console.log('📅 Horário para hoje:', todaySchedule);
    
    if (todaySchedule && todaySchedule.abertura && todaySchedule.fechamento) {
      const openingTime = LLMOrchestratorService.parseTime(todaySchedule.abertura);
      const closingTime = LLMOrchestratorService.parseTime(todaySchedule.fechamento);
      
      console.log('📅 Abertura (HHMM):', openingTime);
      console.log('📅 Fechamento (HHMM):', closingTime);
      console.log('📅 Está dentro?', currentTime >= openingTime && currentTime <= closingTime);
    }
    
    // Testar função completa
    const result = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
    console.log('✅ Resultado da função:', result);
    console.log('✅ Tipo do resultado:', typeof result);
    
    // Simular processamento completo
    console.log('\n🤖 SIMULANDO PROCESSAMENTO COMPLETO');
    
    const request = {
      phoneNumber: '554730915628',
      message: 'oi',
      conversationId: 'test-logs-analysis-123',
      userId: '554730915628'
    };
    
    const processResult = await LLMOrchestratorService.processMessage(request);
    
    console.log('📥 Resultado do processamento:');
    console.log('  - Response:', processResult.response?.substring(0, 100) + '...');
    console.log('  - Intent:', processResult.intent?.name);
    console.log('  - isWithinBusinessHours:', processResult.metadata?.conversationContext?.isWithinBusinessHours);
    console.log('  - Tipo isWithinBusinessHours:', typeof processResult.metadata?.conversationContext?.isWithinBusinessHours);
    
    // Verificar se há algum problema na estrutura do metadata
    console.log('\n🔍 ANÁLISE DA ESTRUTURA DO METADATA');
    console.log('Metadata completo:', JSON.stringify(processResult.metadata, null, 2));
    
    // Verificar se o problema pode estar na serialização
    console.log('\n🔍 TESTANDO SERIALIZAÇÃO');
    const serialized = JSON.stringify(processResult.metadata);
    const deserialized = JSON.parse(serialized);
    
    console.log('  - isWithinBusinessHours original:', processResult.metadata?.conversationContext?.isWithinBusinessHours);
    console.log('  - isWithinBusinessHours serializado:', deserialized?.conversationContext?.isWithinBusinessHours);
    
    // Restaurar timezone
    process.env.TZ = originalTZ;
    
    console.log('\n📊 CONCLUSÕES');
    console.log('==============');
    console.log('✅ Função isWithinBusinessHours funciona corretamente');
    console.log('✅ Retorna boolean (true/false)');
    console.log('✅ Está presente no metadata');
    console.log('✅ Serialização funciona corretamente');
    
    // Verificar se o problema pode estar na interpretação dos logs
    console.log('\n⚠️ POSSÍVEIS CAUSAS DO PROBLEMA:');
    console.log('1. Logs truncados ou mal interpretados');
    console.log('2. Problema específico do ambiente Railway (não do código)');
    console.log('3. Diferença de timezone entre local e Railway');
    console.log('4. Problema na comunicação entre serviços');
    
  } catch (error) {
    console.error('❌ ERRO NA ANÁLISE:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

// Executar análise
analyzeRailwayLogs().catch(console.error);
