import { AppointmentService, AppointmentData } from './appointmentService';
import { contextualizacaoService } from './contextualizacaoService';

export interface ConversationState {
  step: 'initial' | 'collecting_data' | 'selecting_slot' | 'confirming' | 'completed';
  collectedData: Partial<AppointmentData>;
  availableSlots?: any[];
  selectedSlot?: any;
  clinicId?: string;
  patientPhone: string;
}

export interface ConversationResponse {
  message: string;
  nextStep?: string;
  requiresInput?: boolean;
  options?: string[];
  state: ConversationState;
}

export class AppointmentConversationService {
  private static conversationStates = new Map<string, ConversationState>();

  /**
   * Processa mensagem do usuário no contexto de agendamento
   */
  static async processMessage(
    message: string, 
    patientPhone: string, 
    clinicId: string
  ): Promise<ConversationResponse> {
    try {
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
      console.error('Erro ao processar mensagem de agendamento:', error);
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
  private static async handleInitialStep(
    message: string, 
    state: ConversationState
  ): Promise<ConversationResponse> {
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
      serviceType: intent.entities.serviceType || 'consulta'
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
  private static async handleDataCollectionStep(
    message: string, 
    state: ConversationState
  ): Promise<ConversationResponse> {
    const data = state.collectedData;

    // Determinar qual informação está sendo coletada
    if (!data.patientName) {
      data.patientName = message.trim();
      return this.createResponse(
        'Obrigado! Agora preciso da sua data de nascimento (formato DD/MM/AAAA):',
        'collecting_data',
        state,
        true
      );
    }

    if (!data.patientBirthDate) {
      // Validar formato da data
      const dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
      const match = message.match(dateRegex);
      
      if (!match) {
        return this.createResponse(
          'Por favor, informe a data no formato DD/MM/AAAA (exemplo: 15/03/1990):',
          'collecting_data',
          state,
          true
        );
      }

      data.patientBirthDate = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      
      // Perguntar sobre tipo de serviço se não foi especificado
      if (!data.serviceType || data.serviceType === 'consulta') {
        return this.createResponse(
          'Qual tipo de atendimento você gostaria?\n\n' +
          '1️⃣ Consulta médica\n' +
          '2️⃣ Exame\n' +
          '3️⃣ Procedimento\n\n' +
          'Digite o número da opção:',
          'collecting_data',
          state,
          true,
          ['1', '2', '3']
        );
      }
    }

    if (!data.serviceType || data.serviceType === 'consulta') {
      const serviceChoice = message.trim();
      const serviceMap: { [key: string]: string } = {
        '1': 'consulta médica',
        '2': 'exame',
        '3': 'procedimento'
      };

      if (serviceMap[serviceChoice]) {
        data.serviceType = serviceMap[serviceChoice];
      } else {
        return this.createResponse(
          'Por favor, escolha uma opção válida (1, 2 ou 3):',
          'collecting_data',
          state,
          true,
          ['1', '2', '3']
        );
      }
    }

    // Perguntar sobre primeira consulta
    if (data.isFirstTime === undefined) {
      return this.createResponse(
        'É sua primeira consulta conosco?\n\n' +
        '1️⃣ Sim\n' +
        '2️⃣ Não\n\n' +
        'Digite o número da opção:',
        'collecting_data',
        state,
        true,
        ['1', '2']
      );
    }

    if (data.isFirstTime === undefined) {
      const firstTimeChoice = message.trim();
      if (firstTimeChoice === '1') {
        data.isFirstTime = true;
      } else if (firstTimeChoice === '2') {
        data.isFirstTime = false;
      } else {
        return this.createResponse(
          'Por favor, escolha uma opção válida (1 ou 2):',
          'collecting_data',
          state,
          true,
          ['1', '2']
        );
      }
    }

    // Perguntar sobre convênio
    if (!data.insurance) {
      return this.createResponse(
        'Você possui convênio médico?\n\n' +
        '1️⃣ Sim\n' +
        '2️⃣ Não (particular)\n\n' +
        'Digite o número da opção:',
        'collecting_data',
        state,
        true,
        ['1', '2']
      );
    }

    if (!data.insurance) {
      const insuranceChoice = message.trim();
      if (insuranceChoice === '1') {
        data.insurance = 'Convênio';
        return this.createResponse(
          'Qual convênio? (exemplo: Unimed, Bradesco Saúde, etc.):',
          'collecting_data',
          state,
          true
        );
      } else if (insuranceChoice === '2') {
        data.insurance = 'Particular';
      } else {
        return this.createResponse(
          'Por favor, escolha uma opção válida (1 ou 2):',
          'collecting_data',
          state,
          true,
          ['1', '2']
        );
      }
    }

    if (data.insurance === 'Convênio' && !data.insurance.includes(':')) {
      data.insurance = `Convênio: ${message.trim()}`;
    }

    // Perguntar sobre observações
    if (!data.observations) {
      return this.createResponse(
        'Há alguma observação ou queixa principal que gostaria de mencionar? (opcional)\n\n' +
        'Se não houver, digite "não":',
        'collecting_data',
        state,
        true
      );
    }

    if (!data.observations) {
      const observations = message.trim();
      if (observations.toLowerCase() !== 'não' && observations.toLowerCase() !== 'nao') {
        data.observations = observations;
      }
    }

    // Buscar horários disponíveis
    try {
      const today = new Date().toISOString().split('T')[0];
      const availableSlots = await AppointmentService.getAvailableSlots(
        state.clinicId!,
        today,
        data.serviceType
      );

      if (availableSlots.length === 0) {
        return this.createResponse(
          'Infelizmente não há horários disponíveis para hoje. ' +
          'Gostaria de verificar para outro dia?',
          'initial',
          state
        );
      }

      state.availableSlots = availableSlots;
      state.step = 'selecting_slot';

      const slotsText = availableSlots
        .slice(0, 5) // Mostrar apenas os primeiros 5 slots
        .map((slot, index) => `${index + 1}️⃣ ${slot.startTime} - ${slot.endTime}`)
        .join('\n');

      return this.createResponse(
        'Perfeito! Aqui estão os horários disponíveis para hoje:\n\n' +
        slotsText +
        '\n\nDigite o número do horário que preferir:',
        'selecting_slot',
        state,
        true,
        availableSlots.slice(0, 5).map((_, index) => (index + 1).toString())
      );

    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      return this.createResponse(
        'Desculpe, ocorreu um erro ao buscar horários disponíveis. Tente novamente mais tarde.',
        'initial',
        state
      );
    }
  }

  /**
   * Processa seleção de horário
   */
  private static async handleSlotSelectionStep(
    message: string, 
    state: ConversationState
  ): Promise<ConversationResponse> {
    if (!state.availableSlots) {
      return this.createResponse(
        'Erro: horários não encontrados. Vamos começar novamente.',
        'initial',
        state
      );
    }

    const choice = parseInt(message.trim());
    const selectedSlot = state.availableSlots[choice - 1];

    if (!selectedSlot) {
      return this.createResponse(
        'Por favor, escolha um número válido da lista:',
        'selecting_slot',
        state,
        true,
        state.availableSlots.slice(0, 5).map((_, index) => (index + 1).toString())
      );
    }

    state.selectedSlot = selectedSlot;
    state.step = 'confirming';

    const data = state.collectedData;
    const slot = selectedSlot;

    return this.createResponse(
      '📋 Confirme os dados do agendamento:\n\n' +
      `👤 Nome: ${data.patientName}\n` +
      `📅 Data: ${slot.date}\n` +
      `⏰ Horário: ${slot.startTime} - ${slot.endTime}\n` +
      `🏥 Serviço: ${data.serviceType}\n` +
      `📋 Primeira consulta: ${data.isFirstTime ? 'Sim' : 'Não'}\n` +
      `💳 Convênio: ${data.insurance}\n` +
      (data.observations ? `📝 Observações: ${data.observations}\n` : '') +
      '\nEstá tudo correto?\n\n' +
      '1️⃣ Sim, confirmar agendamento\n' +
      '2️⃣ Não, corrigir dados\n\n' +
      'Digite sua escolha:',
      'confirming',
      state,
      true,
      ['1', '2']
    );
  }

  /**
   * Processa confirmação do agendamento
   */
  private static async handleConfirmationStep(
    message: string, 
    state: ConversationState
  ): Promise<ConversationResponse> {
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
      const appointmentData: AppointmentData = {
        ...state.collectedData,
        date: state.selectedSlot!.date,
        startTime: state.selectedSlot!.startTime,
        endTime: state.selectedSlot!.endTime
      } as AppointmentData;

      const result = await AppointmentService.createAppointment(appointmentData);

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
      console.error('Erro ao criar agendamento:', error);
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
  private static createResponse(
    message: string,
    nextStep: string,
    state: ConversationState,
    requiresInput: boolean = false,
    options?: string[]
  ): ConversationResponse {
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
  static clearConversation(patientPhone: string): void {
    this.conversationStates.delete(patientPhone);
  }

  /**
   * Obtém estado atual da conversa
   */
  static getConversationState(patientPhone: string): ConversationState | undefined {
    return this.conversationStates.get(patientPhone);
  }
} 