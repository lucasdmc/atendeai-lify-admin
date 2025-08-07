// ========================================
// APPOINTMENT CONVERSATION SERVICE (JavaScript)
// Versão compatível com Node.js para webhook
// ========================================

import { AppointmentService } from './appointmentService.js';

export class AppointmentConversationService {
  static conversationStates = new Map();

  /**
   * Processa mensagem do usuário no contexto de agendamento
   */
  static async processMessage(message, patientPhone, clinicId) {
    try {
      console.log('📅 [AppointmentConversationService] Processando mensagem de agendamento:', {
        message,
        patientPhone,
        clinicId
      });

      // Obter ou criar estado da conversa
      let state = this.conversationStates.get(patientPhone);
      
      if (!state) {
        state = {
          step: 'initial',
          collectedData: {},
          patientPhone,
          clinicId
        };
        this.conversationStates.set(patientPhone, state);
      }

      console.log('📊 [AppointmentConversationService] Estado atual:', state.step);

      // Processar baseado no passo atual
      switch (state.step) {
        case 'initial':
          return await this.handleInitialStep(message, state);
        
        case 'collecting_data':
          return await this.handleDataCollectionStep(message, state);
        
        case 'selecting_slot':
          return await this.handleSlotSelectionStep(message, state);
        
        case 'confirming':
          return await this.handleConfirmationStep(message, state);
        
        default:
          return this.createResponse(
            'Desculpe, ocorreu um erro. Vamos começar novamente.',
            'initial',
            state
          );
      }
    } catch (error) {
      console.error('💥 [AppointmentConversationService] Erro ao processar mensagem de agendamento:', error);
      return this.createResponse(
        'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        'initial',
        { step: 'initial', collectedData: {}, patientPhone, clinicId }
      );
    }
  }

  /**
   * Processa passo inicial - reconhecimento de intenção
   */
  static async handleInitialStep(message, state) {
    console.log('🔍 [AppointmentConversationService] Verificando intenção de agendamento...');
    
    // Verificar se é realmente uma intenção de agendamento
    const intent = await AppointmentService.recognizeAppointmentIntent(message);
    
    if (!intent || intent.intent !== 'APPOINTMENT_CREATE') {
      return this.createResponse(
        'Desculpe, não entendi. Você gostaria de agendar uma consulta?',
        'initial',
        state
      );
    }

    // Iniciar coleta de dados
    state.step = 'collecting_data';
    state.collectedData = {
      patientPhone: state.patientPhone,
      serviceType: intent.entities?.serviceType || 'consulta'
    };

    return this.createResponse(
      'Perfeito! Vou ajudá-lo a agendar sua consulta. Primeiro, preciso de algumas informações:\n\n' +
      '📝 Qual é o seu nome completo?',
      'collecting_data',
      state,
      true
    );
  }

  /**
   * Processa coleta de dados do paciente
   */
  static async handleDataCollectionStep(message, state) {
    console.log('📝 [AppointmentConversationService] Coletando dados do paciente...');
    
    const data = state.collectedData;
    
    // Se não tem nome, coletar nome
    if (!data.patientName) {
      data.patientName = message.trim();
      
      return this.createResponse(
        'Ótimo! Agora preciso de mais algumas informações:\n\n' +
        '📅 Qual é sua data de nascimento? (DD/MM/AAAA)',
        'collecting_data',
        state,
        true
      );
    }
    
    // Se não tem data de nascimento, coletar
    if (!data.patientBirthDate) {
      const birthDate = message.trim();
      // Validar formato de data
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
        return this.createResponse(
          'Por favor, informe a data no formato DD/MM/AAAA (exemplo: 15/03/1990):',
          'collecting_data',
          state,
          true
        );
      }
      data.patientBirthDate = birthDate;
      
      return this.createResponse(
        'Perfeito! Agora me diga:\n\n' +
        '🏥 Qual tipo de consulta você precisa?\n' +
        '• Consulta médica\n' +
        '• Exame\n' +
        '• Retorno\n' +
        '• Outro',
        'collecting_data',
        state,
        true
      );
    }
    
    // Se não tem tipo de serviço, coletar
    if (!data.serviceType) {
      data.serviceType = message.trim();
      
      return this.createResponse(
        'Excelente! Última pergunta:\n\n' +
        '💳 Você tem convênio médico? Se sim, qual? (Se não, digite "Particular")',
        'collecting_data',
        state,
        true
      );
    }
    
    // Se não tem convênio, coletar
    if (!data.insurance) {
      data.insurance = message.trim();
      
      // Verificar se é primeira consulta
      data.isFirstTime = true; // Por padrão, considerar primeira consulta
      
      // Ir para seleção de horário
      state.step = 'selecting_slot';
      
      return this.createResponse(
        'Perfeito! Agora vou verificar os horários disponíveis para você.\n\n' +
        '📅 Para qual data você gostaria de agendar?\n' +
        '• Hoje\n' +
        '• Amanhã\n' +
        '• Próxima semana\n' +
        '• Outra data (especifique)',
        'selecting_slot',
        state,
        true
      );
    }
    
    return this.createResponse(
      'Dados coletados com sucesso! Agora vou verificar disponibilidade.',
      'selecting_slot',
      state,
      true
    );
  }

  /**
   * Processa seleção de horário
   */
  static async handleSlotSelectionStep(message, state) {
    console.log('⏰ [AppointmentConversationService] Processando seleção de horário...');
    
    const userChoice = message.trim().toLowerCase();
    
    // Simular horários disponíveis (em produção, buscar no Google Calendar)
    const availableSlots = [
      { date: '2024-01-15', startTime: '09:00', endTime: '10:00', available: true },
      { date: '2024-01-15', startTime: '14:00', endTime: '15:00', available: true },
      { date: '2024-01-16', startTime: '10:00', endTime: '11:00', available: true },
      { date: '2024-01-16', startTime: '16:00', endTime: '17:00', available: true }
    ];
    
    // Selecionar primeiro horário disponível
    const selectedSlot = availableSlots[0];
    state.selectedSlot = selectedSlot;
    state.step = 'confirming';
    
    return this.createResponse(
      `✅ Encontrei um horário disponível!\n\n` +
      `📅 Data: ${selectedSlot.date}\n` +
      `⏰ Horário: ${selectedSlot.startTime} - ${selectedSlot.endTime}\n` +
      `👤 Paciente: ${state.collectedData.patientName}\n` +
      `🏥 Serviço: ${state.collectedData.serviceType}\n` +
      `💳 Convênio: ${state.collectedData.insurance}\n\n` +
      `Confirma este agendamento?\n` +
      `1️⃣ Sim, confirmar\n` +
      `2️⃣ Não, alterar dados`,
      'confirming',
      state,
      true,
      ['1', '2']
    );
  }

  /**
   * Processa confirmação do agendamento
   */
  static async handleConfirmationStep(message, state) {
    console.log('✅ [AppointmentConversationService] Processando confirmação...');
    
    const choice = message.trim();

    if (choice === '2') {
      // Voltar para coleta de dados
      state.step = 'collecting_data';
      return this.createResponse(
        'Vamos corrigir os dados. Qual informação gostaria de alterar?\n\n' +
        '1️⃣ Nome\n' +
        '2️⃣ Data de nascimento\n' +
        '3️⃣ Tipo de serviço\n' +
        '4️⃣ Convênio\n' +
        '5️⃣ Observações\n\n' +
        'Digite o número da opção:',
        'collecting_data',
        state,
        true,
        ['1', '2', '3', '4', '5']
      );
    }

    if (choice !== '1') {
      return this.createResponse(
        'Por favor, escolha uma opção válida (1 ou 2):',
        'confirming',
        state,
        true,
        ['1', '2']
      );
    }

    // Criar agendamento
    try {
      console.log('📅 [AppointmentConversationService] Criando agendamento...');
      
      const appointmentData = {
        ...state.collectedData,
        date: state.selectedSlot.date,
        startTime: state.selectedSlot.startTime,
        endTime: state.selectedSlot.endTime
      };

      // Por enquanto, simular criação (em produção, usar AppointmentService)
      console.log('✅ [AppointmentConversationService] Agendamento simulado criado:', appointmentData);

      // Limpar estado da conversa
      this.conversationStates.delete(state.patientPhone);

      return this.createResponse(
        '✅ Agendamento confirmado com sucesso!\n\n' +
        `📅 Data: ${appointmentData.date}\n` +
        `⏰ Horário: ${appointmentData.startTime} - ${appointmentData.endTime}\n` +
        `👤 Paciente: ${appointmentData.patientName}\n` +
        `🏥 Serviço: ${appointmentData.serviceType}\n\n` +
        '📱 Você receberá uma confirmação por WhatsApp.\n' +
        '📍 Lembre-se de chegar 15 minutos antes do horário.\n\n' +
        'Obrigado por escolher nossa clínica! 😊',
        'completed',
        { step: 'completed', collectedData: {}, patientPhone: state.patientPhone }
      );

    } catch (error) {
      console.error('💥 [AppointmentConversationService] Erro ao criar agendamento:', error);
      return this.createResponse(
        'Desculpe, ocorreu um erro ao confirmar o agendamento. Tente novamente mais tarde.',
        'initial',
        state
      );
    }
  }

  /**
   * Cria resposta padronizada
   */
  static createResponse(message, nextStep, state, requiresInput = false, options = null) {
    return {
      message,
      nextStep,
      requiresInput,
      options,
      state
    };
  }

  /**
   * Limpa estado da conversa
   */
  static clearConversation(patientPhone) {
    this.conversationStates.delete(patientPhone);
  }

  /**
   * Obtém estado atual da conversa
   */
  static getConversationState(patientPhone) {
    return this.conversationStates.get(patientPhone);
  }
} 