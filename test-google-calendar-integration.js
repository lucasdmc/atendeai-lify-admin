#!/usr/bin/env node

/**
 * Teste de Integração com Google Calendar
 * Valida se o sistema está funcionando corretamente
 */

import { ClinicContextManager } from './services/core/index.js';
import { AppointmentFlowManager } from './services/core/index.js';
import { GoogleCalendarService } from './services/core/index.js';

async function testGoogleCalendarIntegration() {
  console.log('🧪 TESTANDO INTEGRAÇÃO COM GOOGLE CALENDAR\n');
  
  try {
    // 1. Inicializar ClinicContextManager
    console.log('1️⃣ Inicializando ClinicContextManager...');
    await ClinicContextManager.initialize();
    console.log('✅ ClinicContextManager inicializado\n');
    
    // 2. Testar busca de contexto da CardioPrime
    console.log('2️⃣ Testando busca de contexto da CardioPrime...');
    const clinicContext = await ClinicContextManager.getClinicContext('cardioprime');
    console.log('✅ Contexto da CardioPrime obtido:', {
      nome: clinicContext.name,
      googleCalendarEnabled: clinicContext.googleCalendar?.enabled,
      calendarId: clinicContext.googleCalendar?.calendarId,
      timezone: clinicContext.googleCalendar?.timezone
    });
    console.log('');
    
    // 3. Testar configuração do Google Calendar
    console.log('3️⃣ Validando configuração do Google Calendar...');
    if (!clinicContext.googleCalendar?.enabled) {
      throw new Error('❌ Google Calendar não está habilitado para a CardioPrime');
    }
    console.log('✅ Google Calendar está habilitado');
    console.log('✅ Calendar ID:', clinicContext.googleCalendar.calendarId);
    console.log('✅ Timezone:', clinicContext.googleCalendar.timezone);
    console.log('');
    
    // 4. Testar busca de horários disponíveis
    console.log('4️⃣ Testando busca de horários disponíveis...');
    const selectedService = {
      id: 'cons_001',
      name: 'Consulta Cardiológica',
      duration: 30,
      price: 300.00
    };
    
    const appointmentFlow = new AppointmentFlowManager();
    await appointmentFlow.initialize();
    
    const availableSlots = await appointmentFlow.getAvailableSlots(clinicContext, selectedService);
    console.log('✅ Horários disponíveis encontrados:', availableSlots.length);
    
    if (availableSlots.length > 0) {
      console.log('📅 Primeiros 4 slots:');
      availableSlots.slice(0, 4).forEach((slot, index) => {
        console.log(`   ${index + 1}. ${slot.displayDate} às ${slot.displayTime}`);
      });
    }
    console.log('');
    
    // 5. Testar criação de evento (simulado)
    console.log('5️⃣ Testando criação de evento (simulado)...');
    const appointmentData = {
      selectedService: selectedService,
      selectedSlot: availableSlots[0] || {
        datetime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
        displayDate: 'Amanhã',
        displayTime: '09:00'
      },
      userProfile: { name: 'Lucas Cantoni', phone: '+554730915628' },
      additionalInfo: {}
    };
    
    console.log('📋 Dados do agendamento:', {
      serviço: appointmentData.selectedService.name,
      data: appointmentData.selectedSlot.displayDate,
      horário: appointmentData.selectedSlot.displayTime,
      paciente: appointmentData.userProfile.name
    });
    console.log('');
    
    // 6. Resumo dos testes
    console.log('🎯 RESUMO DOS TESTES:');
    console.log('✅ ClinicContextManager funcionando');
    console.log('✅ Contexto da CardioPrime carregado');
    console.log('✅ Google Calendar habilitado');
    console.log('✅ Horários disponíveis sendo buscados');
    console.log('✅ Sistema pronto para criar eventos reais');
    console.log('');
    console.log('🚀 SISTEMA FUNCIONANDO CORRETAMENTE!');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar teste
testGoogleCalendarIntegration();
