// ========================================
// DIAGNÓSTICO ESPECÍFICO PARA RAILWAY
// ========================================

import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testRailwayDiagnostic() {
  console.log('🔍 DIAGNÓSTICO ESPECÍFICO PARA RAILWAY');
  console.log('==========================================');
  
  try {
    // 1. SIMULAR AMBIENTE RAILWAY (UTC)
    console.log('\n📅 1. SIMULANDO AMBIENTE RAILWAY (UTC)');
    const originalTZ = process.env.TZ;
    process.env.TZ = 'UTC';
    
    console.log('📅 Timezone configurado:', process.env.TZ);
    console.log('📅 Data UTC:', new Date().toISOString());
    console.log('📅 Data local:', new Date().toLocaleString());
    
    // 2. SIMULAR DADOS EXATOS DO SUPABASE
    console.log('\n📋 2. SIMULANDO DADOS DO SUPABASE');
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
    
    console.log('📋 Estrutura workingHours:', JSON.stringify(mockClinicContext.workingHours, null, 2));
    
    // 3. TESTAR FUNÇÃO DIRETAMENTE
    console.log('\n🧪 3. TESTANDO FUNÇÃO isWithinBusinessHours');
    
    // Verificar se a função existe
    if (typeof LLMOrchestratorService.isWithinBusinessHours !== 'function') {
      console.error('❌ ERRO: Função isWithinBusinessHours não existe!');
      return;
    }
    
    console.log('✅ Função isWithinBusinessHours encontrada');
    
    // Testar com try/catch detalhado
    try {
      const result = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
      console.log('✅ Resultado da função:', result);
      console.log('✅ Tipo do resultado:', typeof result);
      
      if (result === undefined) {
        console.error('❌ PROBLEMA IDENTIFICADO: Resultado é undefined!');
      } else if (result === null) {
        console.error('❌ PROBLEMA IDENTIFICADO: Resultado é null!');
      } else {
        console.log('✅ Resultado parece normal');
      }
      
    } catch (functionError) {
      console.error('❌ ERRO na função isWithinBusinessHours:', functionError);
      console.error('❌ Stack trace:', functionError.stack);
    }
    
    // 4. TESTAR FUNÇÕES AUXILIARES
    console.log('\n🔧 4. TESTANDO FUNÇÕES AUXILIARES');
    
    const now = new Date();
    console.log('📅 Data atual:', now.toISOString());
    console.log('📅 Dia da semana (número):', now.getDay());
    
    const currentDay = LLMOrchestratorService.getDayOfWeek(now.getDay());
    console.log('📅 Dia da semana (string):', currentDay);
    
    const currentTime = now.getHours() * 100 + now.getMinutes();
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
    
    // 5. TESTAR PROCESSAMENTO COMPLETO
    console.log('\n🤖 5. TESTANDO PROCESSAMENTO COMPLETO');
    
    const request = {
      phoneNumber: '554730915628',
      message: 'oi',
      conversationId: 'test-railway-diagnostic-123',
      userId: '554730915628'
    };
    
    console.log('📤 Requisição:', request);
    
    try {
      const result = await LLMOrchestratorService.processMessage(request);
      
      console.log('📥 Resultado completo:', {
        response: result.response?.substring(0, 100) + '...',
        intent: result.intent?.name,
        isWithinBusinessHours: result.metadata?.conversationContext?.isWithinBusinessHours,
        metadata: result.metadata
      });
      
      // Verificar especificamente o isWithinBusinessHours
      const isWithinBusinessHours = result.metadata?.conversationContext?.isWithinBusinessHours;
      console.log('🔍 isWithinBusinessHours no metadata:', isWithinBusinessHours);
      console.log('🔍 Tipo do isWithinBusinessHours:', typeof isWithinBusinessHours);
      
      if (isWithinBusinessHours === undefined) {
        console.error('❌ PROBLEMA CONFIRMADO: isWithinBusinessHours é undefined no metadata!');
      } else {
        console.log('✅ isWithinBusinessHours parece normal no metadata');
      }
      
    } catch (processError) {
      console.error('❌ ERRO no processamento completo:', processError);
      console.error('❌ Stack trace:', processError.stack);
    }
    
    // 6. RESTAURAR TIMEZONE
    console.log('\n🔄 6. RESTAURANDO TIMEZONE');
    process.env.TZ = originalTZ;
    console.log('📅 Timezone restaurado:', process.env.TZ);
    
    // 7. COMPARAR COM BRASIL
    console.log('\n🇧🇷 7. COMPARANDO COM BRASIL');
    console.log('📅 Data Brasil:', new Date().toLocaleString());
    
    const resultBR = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
    console.log('✅ Resultado (Brasil):', resultBR);
    
    console.log('\n📊 RESUMO DO DIAGNÓSTICO');
    console.log('==========================');
    console.log('✅ Função isWithinBusinessHours existe');
    console.log('✅ Dados do Supabase simulados corretamente');
    console.log('✅ Timezone UTC configurado');
    console.log('✅ Processamento completo testado');
    
  } catch (error) {
    console.error('💥 ERRO GERAL NO DIAGNÓSTICO:', error);
    console.error('💥 Stack trace:', error.stack);
  }
}

// Executar diagnóstico
testRailwayDiagnostic().catch(console.error);
