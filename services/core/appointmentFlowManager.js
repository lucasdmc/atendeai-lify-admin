/**
 * Appointment Flow Manager - AtendeAI Lify
 * Arquivo: services/appointmentFlowManager.js
 * 
 * Gerenciador completo de fluxo de agendamento conversacional
 * - Integração real com Google Calendar
 * - Uso de dados reais do JSON de contextualização
 * - Fluxo conversacional inteligente
 * - Tratamento de erros robusto
 * - Sistema de métricas integrado
 */

import GoogleCalendarService from './googleCalendarService.js';
import HumanizationHelpers from './humanizationHelpers.js';

export default class AppointmentFlowManager {
  constructor(llmOrchestrator) {
    this.llmOrchestrator = llmOrchestrator;
    this.googleCalendar = new GoogleCalendarService();
    this.activeFlows = new Map(); // Fluxos ativos por usuário
    this.metrics = new Map(); // Métricas por clínica
    this.initialized = false;
  }

  /**
   * Inicializa o serviço
   */
  async initialize() {
    try {
      console.log('🔧 Inicializando AppointmentFlowManager...');
      
      // Inicializar Google Calendar Service
      await this.googleCalendar.initialize();
      
      this.initialized = true;
      console.log('✅ AppointmentFlowManager inicializado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar AppointmentFlowManager:', error);
      throw error;
    }
  }

  /**
   * Processa intenção de agendamento
   * @param {string} phoneNumber - Número do telefone do usuário
   * @param {string} message - Mensagem do usuário
   * @param {Object} intent - Intenção detectada
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} memory - Memória da conversa
   */
  async handleAppointmentIntent(phoneNumber, message, intent, clinicContext, memory) {
    try {
      console.log('📅 Processando intenção de agendamento:', {
        phoneNumber,
        intent: intent.name,
        clinic: clinicContext.name
      });

      // Verificar se o serviço foi inicializado
      if (!this.initialized) {
        await this.initialize();
      }

      // Obter ou criar estado do fluxo
      let flowState = this.activeFlows.get(phoneNumber) || this.createNewFlowState(clinicContext);
      
      // Registrar início do fluxo se for novo
      if (flowState.step === 'initial') {
        this.trackFlowStart(phoneNumber, clinicContext.id);
      }

      // Processar baseado na intenção específica
      let result;
      switch (intent.name) {
        case 'APPOINTMENT_CREATE':
        case 'APPOINTMENT_SCHEDULE':
          result = await this.handleAppointmentCreation(
            phoneNumber, message, clinicContext, memory, flowState
          );
          break;
          
        case 'APPOINTMENT_RESCHEDULE':
          result = await this.handleAppointmentReschedule(
            phoneNumber, message, clinicContext, memory, flowState
          );
          break;
          
        case 'APPOINTMENT_CANCEL':
          result = await this.handleAppointmentCancellation(
            phoneNumber, message, clinicContext, memory, flowState
          );
          break;
          
        case 'APPOINTMENT_LIST':
        case 'APPOINTMENT_CHECK':
          result = await this.handleAppointmentList(
            phoneNumber, message, clinicContext, memory
          );
          break;
          
        default:
          console.warn('⚠️ Intenção de agendamento não reconhecida:', intent.name);
          result = await this.handleUnknownAppointmentIntent(phoneNumber, message, clinicContext);
      }

      // Atualizar estado do fluxo
      if (result && result.metadata?.flowStep) {
        flowState.step = result.metadata.flowStep;
        flowState.lastUpdate = new Date();
        this.activeFlows.set(phoneNumber, flowState);
      }

      // Registrar métricas
      this.trackFlowStep(phoneNumber, clinicContext.id, result.metadata?.flowStep, true);

      return result;
      
    } catch (error) {
      console.error('❌ Erro no fluxo de agendamento:', error);
      
      // Registrar erro nas métricas
      this.trackFlowStep(phoneNumber, clinicContext.id, 'error', false);
      
      return this.generateErrorResponse(error, phoneNumber, clinicContext);
    }
  }

  /**
   * Cria novo estado de fluxo
   * @param {Object} clinicContext - Contexto da clínica
   */
  createNewFlowState(clinicContext) {
    return {
      step: 'initial',
      data: {
        clinicId: clinicContext.id,
        clinicName: clinicContext.name
      },
      startTime: new Date(),
      lastUpdate: new Date(),
      attempts: 0,
      errors: []
    };
  }

  /**
   * Gerencia criação de novo agendamento
   * @param {string} phoneNumber - Número do telefone
   * @param {string} message - Mensagem do usuário
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} memory - Memória da conversa
   * @param {Object} flowState - Estado do fluxo
   */
  async handleAppointmentCreation(phoneNumber, message, clinicContext, memory, flowState) {
    console.log('🆕 Processando criação de agendamento:', {
      currentStep: flowState.step,
      hasUserData: !!memory.userProfile?.name
    });

    switch (flowState.step) {
      case 'initial':
        return await this.startAppointmentCreation(phoneNumber, clinicContext, memory, flowState);
        
      case 'service_selection':
        return await this.processServiceSelection(phoneNumber, message, clinicContext, flowState);
        
      case 'date_time_selection':
        return await this.processDateTimeSelection(phoneNumber, message, clinicContext, flowState);
        
      case 'confirmation':
        return await this.processAppointmentConfirmation(phoneNumber, message, clinicContext, flowState, memory);
        
      default:
        console.warn('⚠️ Estado de fluxo desconhecido:', flowState.step);
        return await this.resetFlow(phoneNumber, clinicContext, memory);
    }
  }

  /**
   * Inicia processo de criação de agendamento
   * @param {string} phoneNumber - Número do telefone
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} memory - Memória da conversa
   * @param {Object} flowState - Estado do fluxo
   */
  async startAppointmentCreation(phoneNumber, clinicContext, memory, flowState) {
    try {
      const userName = memory.userProfile?.name || 'você';
      
      console.log('🔍 [AppointmentFlowManager] Iniciando criação de agendamento:', {
        userName,
        clinicName: clinicContext.name,
        hasServices: !!clinicContext.services,
        hasServicesDetails: !!clinicContext.servicesDetails
      });
      
      // Extrair serviços do JSON de contextualização
      const availableServices = this.extractServicesFromContext(clinicContext);
      
      if (!availableServices || availableServices.length === 0) {
        console.warn('⚠️ [AppointmentFlowManager] Nenhum serviço disponível para agendamento');
        return {
          response: `Desculpe, ${userName}! No momento não consegui carregar os serviços disponíveis para agendamento online. 😔\n\nEntre em contato conosco pelo telefone ${clinicContext.contacts?.telefone || clinicContext.contacts?.whatsapp || 'da clínica'} para mais informações.`,
          intent: { name: 'APPOINTMENT_ERROR', confidence: 1.0 },
          toolsUsed: ['appointment_flow'],
          metadata: { flowStep: 'error', error: 'no_services_available' }
        };
      }

      console.log('✅ [AppointmentFlowManager] Serviços carregados com sucesso:', availableServices.length);

      // Atualizar estado do fluxo
      flowState.step = 'service_selection';
      flowState.data.availableServices = availableServices;

      // Gerar resposta personalizada
      const response = this.generateServiceSelectionResponse(userName, clinicContext, availableServices);

      return {
        response: response,
        intent: { name: 'APPOINTMENT_CREATE', confidence: 0.9 },
        toolsUsed: ['appointment_flow', 'service_listing'],
        metadata: {
          flowStep: 'service_selection',
          availableServices: availableServices.length,
          userProfile: memory.userProfile
        }
      };
      
    } catch (error) {
      console.error('❌ Erro ao iniciar criação de agendamento:', error);
      throw error;
    }
  }

  /**
   * Extrai serviços do contexto da clínica
   * @param {Object} clinicContext - Contexto da clínica
   */
  extractServicesFromContext(clinicContext) {
    try {
      console.log('🔍 [AppointmentFlowManager] Extraindo serviços do contexto:', {
        hasServices: !!clinicContext.services,
        hasServicesDetails: !!clinicContext.servicesDetails,
        servicesType: typeof clinicContext.services,
        servicesDetailsType: typeof clinicContext.servicesDetails
      });
      
      // 🔧 CORREÇÃO: Usar a estrutura correta retornada pelo ClinicContextManager
      let availableServices = [];
      
      // Tentar diferentes estruturas possíveis
      if (clinicContext.servicesDetails && clinicContext.servicesDetails.consultas) {
        // Estrutura do JSON de contextualização
        const consultas = clinicContext.servicesDetails.consultas || [];
        const exames = clinicContext.servicesDetails.exames || [];
        const procedimentos = clinicContext.servicesDetails.procedimentos || [];
        
        // Converter para formato padrão
        availableServices = [
          ...consultas.map(s => ({
            id: s.id || s.nome?.toLowerCase().replace(/\s+/g, '_'),
            name: s.nome || 'Consulta sem nome',
            type: 'consulta',
            duration: parseInt(s.duracao) || 30,
            price: parseFloat(s.preco_particular) || 0,
            description: s.descricao || '',
            category: s.categoria || 'consulta',
            available: true
          })),
          ...exames.map(s => ({
            id: s.id || s.nome?.toLowerCase().replace(/\s+/g, '_'),
            name: s.nome || 'Exame sem nome',
            type: 'exame',
            duration: parseInt(s.duracao) || 60,
            price: parseFloat(s.preco_particular) || 0,
            description: s.descricao || '',
            category: s.categoria || 'exame',
            available: true
          })),
          ...procedimentos.map(s => ({
            id: s.id || s.nome?.toLowerCase().replace(/\s+/g, '_'),
            name: s.nome || 'Procedimento sem nome',
            type: 'procedimento',
            duration: parseInt(s.duracao) || 45,
            price: parseFloat(s.preco_particular) || 0,
            description: s.descricao || '',
            category: s.categoria || 'procedimento',
            available: true
          }))
        ];
      } else if (clinicContext.services && Array.isArray(clinicContext.services)) {
        // Estrutura alternativa
        availableServices = clinicContext.services.filter(service => 
          service.available !== false && service.enabled !== false
        ).map(service => ({
          id: service.id || service.name?.toLowerCase().replace(/\s+/g, '_'),
          name: service.name || 'Serviço sem nome',
          type: service.type || 'consulta',
          duration: parseInt(service.duration) || 30,
          price: parseFloat(service.price) || 0,
          description: service.description || '',
          category: service.category || 'geral',
          available: true
        }));
      }
      
      console.log('✅ [AppointmentFlowManager] Serviços extraídos:', {
        total: availableServices.length,
        services: availableServices.map(s => ({ name: s.name, type: s.type, duration: s.duration }))
      });
      
      return availableServices;
      
    } catch (error) {
      console.error('❌ Erro ao extrair serviços do contexto:', error);
      return [];
    }
  }

  /**
   * Gera resposta para seleção de serviço
   * @param {string} userName - Nome do usuário
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Array} availableServices - Serviços disponíveis
   */
  generateServiceSelectionResponse(userName, clinicContext, availableServices) {
    const greeting = userName !== 'você' ? `Ótimo, ${userName}!` : 'Perfeito!';
    
    let response = `${greeting} Vou te ajudar a agendar sua consulta na ${clinicContext.name}. 😊\n\n`;
    
    // 🔧 CORREÇÃO: Verificar se há serviços disponíveis
    if (!availableServices || availableServices.length === 0) {
      response += `Infelizmente não consegui carregar os serviços disponíveis no momento. 😔\n\n`;
      response += `Por favor, entre em contato conosco pelo telefone ${clinicContext.contacts?.telefone || clinicContext.contacts?.whatsapp || 'da clínica'} para agendar sua consulta.`;
      return response;
    }
    
    response += `Para isso, preciso saber que tipo de consulta você precisa:\n\n`;
    
    // Mostrar até 5 serviços principais
    availableServices.slice(0, 5).forEach((service, index) => {
      const emoji = this.getServiceEmoji(service.type);
      response += `${index + 1}️⃣ ${emoji} **${service.name}**`;
      
      if (service.duration) {
        response += ` (${service.duration}min)`;
      }
      
      if (service.price && service.price > 0) {
        response += ` - R$ ${service.price.toFixed(2).replace('.', ',')}`;
      }
      
      if (service.description) {
        response += `\n   _${service.description}_`;
      }
      
      response += '\n\n';
    });

    if (availableServices.length > 5) {
      response += `💬 E temos mais ${availableServices.length - 5} opções disponíveis!\n\n`;
    }

    response += `Me diga o **número** da consulta que você precisa ou escreva o **nome** do serviço! 👆`;

    return response;
  }

  /**
   * Obtém emoji apropriado para tipo de serviço
   * @param {string} serviceType - Tipo do serviço
   */
  getServiceEmoji(serviceType) {
    const emojiMap = {
      'consulta': '👨‍⚕️',
      'exame': '🔬',
      'cardiologia': '❤️',
      'checkup': '🩺',
      'retorno': '🔄',
      'emergencia': '🚨',
      'preventivo': '🛡️',
      'procedimento': '⚕️',
      'cirurgia': '🏥',
      'terapia': '🧘‍♀️'
    };

    const type = serviceType?.toLowerCase() || '';
    return emojiMap[type] || '🏥';
  }

  /**
   * Processa seleção de serviço pelo usuário
   * @param {string} phoneNumber - Número do telefone
   * @param {string} message - Mensagem do usuário
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} flowState - Estado do fluxo
   */
  async processServiceSelection(phoneNumber, message, clinicContext, flowState) {
    try {
      const availableServices = flowState.data.availableServices;
      const selectedService = this.parseServiceSelection(message, availableServices);

      if (!selectedService) {
        flowState.attempts = (flowState.attempts || 0) + 1;
        
        if (flowState.attempts >= 3) {
          return await this.escalateToHuman(phoneNumber, clinicContext, 'service_selection_failed');
        }

        return {
          response: `Não consegui identificar qual consulta você quer agendar. 🤔\n\nPode me dizer o **número** da opção (1, 2, 3...) ou escrever o **nome** da consulta?\n\nPor exemplo: "1" ou "consulta cardiológica"`,
          intent: { name: 'APPOINTMENT_CREATE', confidence: 0.8 },
          toolsUsed: ['appointment_flow', 'clarification'],
          metadata: { flowStep: 'service_selection', attempts: flowState.attempts }
        };
      }

      // Serviço selecionado com sucesso
      flowState.step = 'date_time_selection';
      flowState.data.selectedService = selectedService;
      flowState.attempts = 0;

      // Buscar horários disponíveis
      return await this.processDateTimeSelection(phoneNumber, message, clinicContext, flowState);
      
    } catch (error) {
      console.error('❌ Erro ao processar seleção de serviço:', error);
      throw error;
    }
  }

  /**
   * Analisa mensagem do usuário para identificar serviço selecionado
   * @param {string} message - Mensagem do usuário
   * @param {Array} availableServices - Serviços disponíveis
   */
  parseServiceSelection(message, availableServices) {
    const cleanMessage = message.toLowerCase().trim();

    // Tentar identificar por número
    const numberMatch = cleanMessage.match(/^(\d+)$/);
    if (numberMatch) {
      const index = parseInt(numberMatch[1]) - 1;
      if (index >= 0 && index < availableServices.length) {
        return availableServices[index];
      }
    }

    // Tentar identificar por nome/palavras-chave
    for (const service of availableServices) {
      const serviceName = service.name.toLowerCase();
      const serviceKeywords = serviceName.split(' ').filter(word => word.length > 2);

      // Correspondência exata
      if (cleanMessage.includes(serviceName)) {
        return service;
      }

      // Correspondência por palavras-chave
      const matchingKeywords = serviceKeywords.filter(keyword => 
        cleanMessage.includes(keyword)
      );

      if (matchingKeywords.length >= Math.ceil(serviceKeywords.length / 2)) {
        return service;
      }

      // Correspondência por tipo
      if (service.type && cleanMessage.includes(service.type.toLowerCase())) {
        return service;
      }
    }

    return null;
  }

  /**
   * Processa seleção de data e horário
   * @param {string} phoneNumber - Número do telefone
   * @param {string} message - Mensagem do usuário
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} flowState - Estado do fluxo
   */
  async processDateTimeSelection(phoneNumber, message, clinicContext, flowState) {
    try {
      console.log('📅 Processando seleção de data e horário...');

      // Se é a primeira vez neste passo, buscar horários disponíveis
      if (!flowState.data.availableSlots) {
        const availableSlots = await this.getAvailableSlots(
          clinicContext,
          flowState.data.selectedService
        );

        if (!availableSlots || availableSlots.length === 0) {
          return {
            response: `Desculpe! No momento não temos horários disponíveis para **${flowState.data.selectedService.name}**.\n\nEntre em contato conosco pelo telefone ${clinicContext.phone || 'da clínica'} para verificar outras opções ou agendar para datas mais distantes.`,
            intent: { name: 'APPOINTMENT_ERROR', confidence: 1.0 },
            toolsUsed: ['appointment_flow', 'calendar_check'],
            metadata: { flowStep: 'no_availability' }
          };
        }

        flowState.data.availableSlots = availableSlots;

        // Primeira exibição dos horários
        const response = this.generateTimeSelectionResponse(
          availableSlots,
          flowState.data.selectedService
        );

        return {
          response: response,
          intent: { name: 'APPOINTMENT_CREATE', confidence: 0.9 },
          toolsUsed: ['appointment_flow', 'calendar_integration'],
          metadata: {
            flowStep: 'date_time_selection',
            availableSlots: availableSlots.length
          }
        };
      }

      // Processar seleção do usuário
      const selectedSlot = this.parseTimeSelection(message, flowState.data.availableSlots);

      if (!selectedSlot) {
        flowState.attempts = (flowState.attempts || 0) + 1;
        
        if (flowState.attempts >= 3) {
          return await this.escalateToHuman(phoneNumber, clinicContext, 'time_selection_failed');
        }

        return {
          response: `Não consegui identificar qual horário você quer. 🤔\n\nPode me dizer o **número** da opção (1, 2, 3...)?\n\nPor exemplo: "2"`,
          intent: { name: 'APPOINTMENT_CREATE', confidence: 0.8 },
          toolsUsed: ['appointment_flow', 'clarification'],
          metadata: { flowStep: 'date_time_selection', attempts: flowState.attempts }
        };
      }

      // Horário selecionado com sucesso
      flowState.step = 'confirmation';
      flowState.data.selectedSlot = selectedSlot;
      flowState.attempts = 0;

      const response = this.generateConfirmationResponse(flowState.data);

      return {
        response: response,
        intent: { name: 'APPOINTMENT_CREATE', confidence: 0.9 },
        toolsUsed: ['appointment_flow', 'confirmation'],
        metadata: {
          flowStep: 'confirmation',
          selectedSlot: {
            date: selectedSlot.displayDate,
            time: selectedSlot.displayTime
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro ao processar seleção de data/horário:', error);
      throw error;
    }
  }

  /**
   * Busca horários disponíveis usando Google Calendar
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} selectedService - Serviço selecionado
   */
  async getAvailableSlots(clinicContext, selectedService) {
    try {
      console.log('🔍 Buscando horários disponíveis no Google Calendar...');
      
      // Verificar se a clínica tem configuração do Google Calendar
      if (!clinicContext.googleCalendar?.enabled) {
        console.warn('⚠️ Google Calendar não configurado para esta clínica');
        return this.generateMockSlots(clinicContext, selectedService); // Fallback temporário
      }

      // Buscar slots reais no Google Calendar
      const slots = await this.googleCalendar.getAvailableSlots(
        clinicContext.id,
        clinicContext,
        selectedService,
        14 // 14 dias à frente
      );

      return slots;
      
    } catch (error) {
      console.error('❌ Erro ao buscar horários no Google Calendar:', error);
      
      // Fallback para slots baseados nas regras da clínica
      return this.generateSlotsFromBusinessHours(clinicContext, selectedService);
    }
  }

  /**
   * Gera slots baseados nos horários de funcionamento da clínica
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} selectedService - Serviço selecionado
   */
  generateSlotsFromBusinessHours(clinicContext, selectedService) {
    try {
      console.log('📋 Gerando slots baseados nos horários de funcionamento...');
      
      const slots = [];
      const businessHours = clinicContext.businessHours || {};
      const appointmentRules = clinicContext.appointmentRules || {};
      
      const serviceDuration = selectedService.duration || 30;
      const minimumAdvanceHours = appointmentRules.minimumAdvanceHours || 24;
      const maxDaysAhead = appointmentRules.maximumAdvanceDays || 14;
      
      const now = new Date();
      const startDate = new Date(now.getTime() + (minimumAdvanceHours * 60 * 60 * 1000));
      
      // Dias da semana
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      for (let dayOffset = 0; dayOffset < maxDaysAhead; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + dayOffset);
        
        const dayName = dayNames[currentDate.getDay()];
        const dayConfig = businessHours[dayName];
        
        if (!dayConfig || dayConfig === 'closed') {
          continue;
        }
        
        // Gerar slots para o dia
        const daySlots = this.generateDaySlots(currentDate, dayConfig, serviceDuration);
        slots.push(...daySlots);
        
        // Limitar a 15 slots para não sobrecarregar
        if (slots.length >= 15) {
          break;
        }
      }
      
      return slots.slice(0, 15);
      
    } catch (error) {
      console.error('❌ Erro ao gerar slots dos horários de funcionamento:', error);
      return [];
    }
  }

  /**
   * Gera slots para um dia específico
   * @param {Date} date - Data do dia
   * @param {Object} dayConfig - Configuração do dia
   * @param {number} serviceDuration - Duração do serviço
   */
  generateDaySlots(date, dayConfig, serviceDuration) {
    const slots = [];
    
    try {
      const startTime = this.parseTime(dayConfig.start || '08:00');
      const endTime = this.parseTime(dayConfig.end || '18:00');
      
      let currentTime = new Date(date);
      currentTime.setHours(startTime.hours, startTime.minutes, 0, 0);
      
      const endDateTime = new Date(date);
      endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);
      
      // Horário de almoço
      let lunchStart = null;
      let lunchEnd = null;
      if (dayConfig.lunch) {
        lunchStart = this.parseTime(dayConfig.lunch.start || '12:00');
        lunchEnd = this.parseTime(dayConfig.lunch.end || '13:00');
      }
      
      while (currentTime.getTime() + (serviceDuration * 60000) <= endDateTime.getTime()) {
        // Verificar se não está no horário de almoço
        if (lunchStart && lunchEnd) {
          const currentHour = currentTime.getHours();
          const currentMinute = currentTime.getMinutes();
          const currentTimeMinutes = currentHour * 60 + currentMinute;
          const lunchStartMinutes = lunchStart.hours * 60 + lunchStart.minutes;
          const lunchEndMinutes = lunchEnd.hours * 60 + lunchEnd.minutes;
          
          if (currentTimeMinutes >= lunchStartMinutes && currentTimeMinutes < lunchEndMinutes) {
            currentTime.setHours(lunchEnd.hours, lunchEnd.minutes, 0, 0);
            continue;
          }
        }
        
        slots.push({
          datetime: new Date(currentTime),
          displayDate: this.formatDateForDisplay(currentTime),
          displayTime: this.formatTimeForDisplay(currentTime),
          available: true,
          duration: serviceDuration
        });
        
        // Próximo slot (intervalo de 30 minutos)
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar slots do dia:', error);
    }
    
    return slots;
  }

  /**
   * Converte string de tempo para objeto
   * @param {string} timeStr - String no formato "HH:MM"
   */
  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * Formata data para exibição
   * @param {Date} date - Data a ser formatada
   */
  formatDateForDisplay(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (this.isSameDay(date, today)) {
      return 'Hoje';
    } else if (this.isSameDay(date, tomorrow)) {
      return 'Amanhã';
    } else {
      return date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
  }

  /**
   * Formata horário para exibição
   * @param {Date} date - Data com horário
   */
  formatTimeForDisplay(date) {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Verifica se duas datas são do mesmo dia
   */
  isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  /**
   * Gera resposta para seleção de horário
   * @param {Array} availableSlots - Slots disponíveis
   * @param {Object} selectedService - Serviço selecionado
   */
  generateTimeSelectionResponse(availableSlots, selectedService) {
    let response = `Perfeito! ✅ Você escolheu: **${selectedService.name}**\n\n`;
    
    response += `📅 **Horários disponíveis:**\n\n`;

    // Agrupar por data
    const groupedSlots = this.groupSlotsByDate(availableSlots);
    let optionNumber = 1;

    Object.entries(groupedSlots).forEach(([date, dateSlots]) => {
      response += `**${date}:**\n`;
      
      dateSlots.slice(0, 4).forEach(slot => {
        response += `${optionNumber}️⃣ 🕒 ${slot.displayTime}\n`;
        optionNumber++;
      });
      
      response += '\n';
    });

    response += `Qual horário funciona melhor para você? Me diga o **número** da opção! 👆`;

    return response;
  }

  /**
   * Agrupa slots por data
   * @param {Array} slots - Slots disponíveis
   */
  groupSlotsByDate(slots) {
    const grouped = {};
    
    slots.forEach(slot => {
      const dateKey = slot.displayDate;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });

    return grouped;
  }

  /**
   * Analisa seleção de horário
   * @param {string} message - Mensagem do usuário
   * @param {Array} availableSlots - Slots disponíveis
   */
  parseTimeSelection(message, availableSlots) {
    const cleanMessage = message.toLowerCase().trim();

    const numberMatch = cleanMessage.match(/^(\d+)$/);
    if (numberMatch) {
      const index = parseInt(numberMatch[1]) - 1;
      if (index >= 0 && index < availableSlots.length) {
        return availableSlots[index];
      }
    }

    return null;
  }

  /**
   * Gera resposta de confirmação
   * @param {Object} appointmentData - Dados do agendamento
   */
  generateConfirmationResponse(appointmentData) {
    const { selectedService, selectedSlot } = appointmentData;
    
    let response = `Perfeito! ✅ Vou confirmar seu agendamento:\n\n`;
    
    response += `📋 **Resumo do Agendamento:**\n`;
    response += `• **Serviço:** ${selectedService.name}\n`;
    response += `• **Data:** ${selectedSlot.displayDate}\n`;
    response += `• **Horário:** ${selectedSlot.displayTime}\n`;
    
    if (selectedService.duration) {
      response += `• **Duração:** ${selectedService.duration} minutos\n`;
    }
    
    if (selectedService.price && selectedService.price > 0) {
      response += `• **Valor:** R$ ${selectedService.price.toFixed(2).replace('.', ',')}\n`;
    }
    
    response += `\n🤝 **Confirma este agendamento?**\n\n`;
    response += `Responda:\n`;
    response += `✅ **"Sim"** para confirmar\n`;
    response += `❌ **"Não"** para cancelar`;

    return response;
  }

  /**
   * Processa confirmação final
   * @param {string} phoneNumber - Número do telefone
   * @param {string} message - Mensagem do usuário
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} flowState - Estado do fluxo
   * @param {Object} memory - Memória da conversa
   */
  async processAppointmentConfirmation(phoneNumber, message, clinicContext, flowState, memory) {
    try {
      const confirmationResponse = this.parseConfirmationResponse(message);
      
      if (confirmationResponse === 'confirm') {
        return await this.finalizeAppointment(phoneNumber, clinicContext, flowState, memory);
      } else if (confirmationResponse === 'cancel') {
        return await this.cancelAppointmentFlow(phoneNumber, flowState);
      } else {
        return {
          response: `Não entendi sua resposta. 🤔\n\nPara confirmar o agendamento, responda:\n✅ **"Sim"** para confirmar\n❌ **"Não"** para cancelar`,
          intent: { name: 'APPOINTMENT_CREATE', confidence: 0.8 },
          toolsUsed: ['appointment_flow', 'clarification'],
          metadata: { flowStep: 'confirmation', needsClarification: true }
        };
      }

    } catch (error) {
      console.error('❌ Erro ao processar confirmação:', error);
      throw error;
    }
  }

  /**
   * Analisa resposta de confirmação
   * @param {string} message - Mensagem do usuário
   */
  parseConfirmationResponse(message) {
    const cleanMessage = message.toLowerCase().trim();
    
    const confirmKeywords = ['sim', 'confirmar', 'confirmo', 'ok', 'perfeito', 'pode ser', 'tá bom', 'beleza'];
    if (confirmKeywords.some(keyword => cleanMessage.includes(keyword))) {
      return 'confirm';
    }
    
    const cancelKeywords = ['não', 'nao', 'cancelar', 'cancelo', 'desistir', 'não quero'];
    if (cancelKeywords.some(keyword => cleanMessage.includes(keyword))) {
      return 'cancel';
    }
    
    return 'unclear';
  }

  /**
   * Finaliza o agendamento criando evento no Google Calendar
   * @param {string} phoneNumber - Número do telefone
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} flowState - Estado do fluxo
   * @param {Object} memory - Memória da conversa
   */
  async finalizeAppointment(phoneNumber, clinicContext, flowState, memory) {
    try {
      console.log('🎯 Finalizando agendamento...');

      const appointmentData = {
        selectedService: flowState.data.selectedService,
        selectedSlot: flowState.data.selectedSlot,
        userProfile: memory.userProfile || { name: 'Paciente', phone: phoneNumber },
        additionalInfo: flowState.data.additionalInfo || {}
      };

      let eventResult = null;
      
      // Tentar criar evento no Google Calendar
      try {
        if (clinicContext.googleCalendar?.enabled) {
          eventResult = await this.googleCalendar.createAppointment(
            clinicContext.id,
            appointmentData,
            clinicContext
          );
          console.log('✅ Evento criado no Google Calendar:', eventResult.eventId);
        }
      } catch (calendarError) {
        console.error('⚠️ Erro ao criar evento no Google Calendar:', calendarError);
        // Continuar mesmo se o Google Calendar falhar
      }

      // Limpar estado do fluxo
      this.activeFlows.delete(phoneNumber);

      // Registrar sucesso nas métricas
      this.trackFlowCompletion(phoneNumber, clinicContext.id, true);

      const response = this.generateSuccessResponse(appointmentData, clinicContext, eventResult);

      return {
        response: response,
        intent: { name: 'APPOINTMENT_CONFIRMED', confidence: 1.0 },
        toolsUsed: ['appointment_flow', 'calendar_integration', 'confirmation'],
        metadata: {
          flowStep: 'completed',
          appointmentId: eventResult?.eventId || `local_${Date.now()}`,
          eventId: eventResult?.eventId,
          success: true,
          calendarIntegration: !!eventResult
        }
      };

    } catch (error) {
      console.error('❌ Erro ao finalizar agendamento:', error);
      
      // Registrar falha nas métricas
      this.trackFlowCompletion(phoneNumber, clinicContext.id, false);
      
      return {
        response: `Ops! Tive um problema ao confirmar seu agendamento. 😔\n\nPor favor, entre em contato conosco pelo telefone ${clinicContext.phone || 'da clínica'} para finalizar o agendamento.\n\nPeço desculpas pelo inconveniente!`,
        intent: { name: 'APPOINTMENT_ERROR', confidence: 1.0 },
        toolsUsed: ['appointment_flow', 'error_handling'],
        metadata: {
          flowStep: 'error',
          error: error.message,
          requiresHumanIntervention: true
        }
      };
    }
  }

  /**
   * Gera resposta de sucesso
   * @param {Object} appointmentData - Dados do agendamento
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} eventResult - Resultado da criação do evento
   */
  generateSuccessResponse(appointmentData, clinicContext, eventResult) {
    const { selectedService, selectedSlot } = appointmentData;
    
    let response = `🎉 **Agendamento Confirmado com Sucesso!**\n\n`;
    
    response += `✅ Seu agendamento foi criado:\n\n`;
    response += `🏥 **Serviço:** ${selectedService.name}\n`;
    response += `📅 **Data:** ${selectedSlot.displayDate}\n`;
    response += `🕒 **Horário:** ${selectedSlot.displayTime}\n`;
    
    if (selectedService.duration) {
      response += `⏱️ **Duração:** ${selectedService.duration} minutos\n`;
    }
    
    if (eventResult?.eventId) {
      response += `📋 **Código:** ${eventResult.eventId.substring(0, 8)}\n`;
    }
    
    response += `\n📱 **Lembretes importantes:**\n`;
    response += `• Chegue 15 minutos antes do horário\n`;
    response += `• Traga um documento com foto\n`;
    response += `• Em caso de imprevisto, entre em contato conosco\n`;
    
    if (clinicContext.address) {
      response += `\n📍 **Endereço:** ${clinicContext.address}\n`;
    }
    
    if (clinicContext.phone) {
      response += `📞 **Contato:** ${clinicContext.phone}\n`;
    }
    
    if (eventResult?.eventLink) {
      response += `\n🔗 **Link do evento:** ${eventResult.eventLink}\n`;
    }
    
    response += `\n🤝 Obrigado por escolher a ${clinicContext.name}!\n`;
    response += `Estamos ansiosos para cuidar da sua saúde! ❤️`;

    return response;
  }

  /**
   * Cancela fluxo de agendamento
   * @param {string} phoneNumber - Número do telefone
   * @param {Object} flowState - Estado do fluxo
   */
  async cancelAppointmentFlow(phoneNumber, flowState) {
    this.activeFlows.delete(phoneNumber);
    
    // Registrar cancelamento nas métricas
    this.trackFlowCompletion(phoneNumber, flowState.data.clinicId, false, 'user_cancelled');
    
    return {
      response: `Tudo bem! Cancelei o agendamento. 👍\n\nSe mudar de ideia, é só me chamar novamente!\n\nEm que mais posso ajudar?`,
      intent: { name: 'APPOINTMENT_CANCELLED', confidence: 1.0 },
      toolsUsed: ['appointment_flow', 'cancellation'],
      metadata: { flowStep: 'cancelled' }
    };
  }

  /**
   * Escalação para atendimento humano
   * @param {string} phoneNumber - Número do telefone
   * @param {Object} clinicContext - Contexto da clínica
   * @param {string} reason - Motivo da escalação
   */
  async escalateToHuman(phoneNumber, clinicContext, reason) {
    this.activeFlows.delete(phoneNumber);
    
    // Registrar escalação nas métricas
    this.trackFlowCompletion(phoneNumber, clinicContext.id, false, 'escalated_to_human');
    
    return {
      response: `Vou transferir você para nossa equipe! 👥\n\nUm de nossos atendentes vai te ajudar com o agendamento.\n\nAguarde um momento...`,
      intent: { name: 'HUMAN_HANDOFF', confidence: 1.0 },
      toolsUsed: ['appointment_flow', 'escalation'],
      metadata: { 
        flowStep: 'escalation', 
        reason: reason,
        requiresHumanIntervention: true 
      }
    };
  }

  /**
   * Reseta fluxo de agendamento
   * @param {string} phoneNumber - Número do telefone
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} memory - Memória da conversa
   */
  async resetFlow(phoneNumber, clinicContext, memory) {
    this.activeFlows.delete(phoneNumber);
    
    return {
      response: `Vamos começar novamente! 🔄\n\nEm que posso ajudar você hoje?`,
      intent: { name: 'APPOINTMENT_RESET', confidence: 1.0 },
      toolsUsed: ['appointment_flow', 'reset'],
      metadata: { flowStep: 'reset' }
    };
  }

  /**
   * Gera resposta de erro
   * @param {Error} error - Erro ocorrido
   * @param {string} phoneNumber - Número do telefone
   * @param {Object} clinicContext - Contexto da clínica
   */
  generateErrorResponse(error, phoneNumber, clinicContext) {
    console.error('❌ Erro no fluxo de agendamento:', error);
    
    // Limpar estado em caso de erro
    this.activeFlows.delete(phoneNumber);
    
    // Usar HumanizationHelpers para gerar resposta de erro humanizada
    const humanizedError = HumanizationHelpers.generateHumanizedErrorResponse(error);
    
    return {
      response: `${humanizedError}\n\nSe o problema persistir, entre em contato conosco pelo telefone ${clinicContext.phone || 'da clínica'}.`,
      intent: { name: 'APPOINTMENT_ERROR', confidence: 1.0 },
      toolsUsed: ['appointment_flow', 'error_handling'],
      metadata: {
        flowStep: 'error',
        error: error.message
      }
    };
  }

  // Métodos placeholder para outras funcionalidades
  async handleAppointmentReschedule(phoneNumber, message, clinicContext, memory, flowState) {
    return {
      response: `Funcionalidade de reagendamento em desenvolvimento! 🚧\n\nPor favor, entre em contato conosco pelo telefone ${clinicContext.phone || 'da clínica'}.`,
      intent: { name: 'APPOINTMENT_RESCHEDULE', confidence: 1.0 },
      toolsUsed: ['appointment_flow'],
      metadata: { flowStep: 'not_implemented' }
    };
  }

  async handleAppointmentCancellation(phoneNumber, message, clinicContext, memory, flowState) {
    return {
      response: `Funcionalidade de cancelamento em desenvolvimento! 🚧\n\nPor favor, entre em contato conosco pelo telefone ${clinicContext.phone || 'da clínica'}.`,
      intent: { name: 'APPOINTMENT_CANCEL', confidence: 1.0 },
      toolsUsed: ['appointment_flow'],
      metadata: { flowStep: 'not_implemented' }
    };
  }

  async handleAppointmentList(phoneNumber, message, clinicContext, memory) {
    return {
      response: `Funcionalidade de listagem de agendamentos em desenvolvimento! 🚧\n\nPor favor, entre em contato conosco pelo telefone ${clinicContext.phone || 'da clínica'}.`,
      intent: { name: 'APPOINTMENT_LIST', confidence: 1.0 },
      toolsUsed: ['appointment_flow'],
      metadata: { flowStep: 'not_implemented' }
    };
  }

  async handleUnknownAppointmentIntent(phoneNumber, message, clinicContext) {
    return {
      response: `Não entendi exatamente o que você quer fazer com agendamentos. 🤔\n\nPosso ajudar você a:\n• Agendar uma nova consulta\n• Verificar seus agendamentos\n\nO que você gostaria de fazer?`,
      intent: { name: 'APPOINTMENT_CLARIFICATION', confidence: 0.8 },
      toolsUsed: ['appointment_flow', 'clarification'],
      metadata: { flowStep: 'clarification' }
    };
  }

  // Métodos de métricas
  trackFlowStart(phoneNumber, clinicId) {
    const key = `${clinicId}_${new Date().toDateString()}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        clinicId,
        date: new Date().toDateString(),
        started: 0,
        completed: 0,
        abandoned: 0,
        escalated: 0,
        errors: 0
      });
    }
    this.metrics.get(key).started++;
  }

  trackFlowStep(phoneNumber, clinicId, step, success) {
    // Implementação básica - pode ser expandida
    console.log(`📊 Métricas: ${clinicId} - ${step} - ${success ? 'sucesso' : 'falha'}`);
  }

  trackFlowCompletion(phoneNumber, clinicId, success, reason = '') {
    const key = `${clinicId}_${new Date().toDateString()}`;
    if (this.metrics.has(key)) {
      const metric = this.metrics.get(key);
      if (success) {
        metric.completed++;
      } else if (reason === 'user_cancelled') {
        metric.abandoned++;
      } else if (reason === 'escalated_to_human') {
        metric.escalated++;
      } else {
        metric.errors++;
      }
    }
  }

  /**
   * Gera slots mock temporários (fallback)
   */
  generateMockSlots(clinicContext, selectedService) {
    console.log('⚠️ Usando slots mock como fallback');
    
    const slots = [];
    const now = new Date();
    
    // Gerar próximos 7 dias úteis
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      
      // Pular fins de semana
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Gerar 3 horários por dia
      const times = ['09:00', '14:00', '16:00'];
      times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotTime = new Date(date);
        slotTime.setHours(hours, minutes, 0, 0);
        
        slots.push({
          datetime: slotTime,
          displayDate: this.formatDateForDisplay(slotTime),
          displayTime: this.formatTimeForDisplay(slotTime),
          available: true,
          duration: selectedService.duration || 30
        });
      });
    }
    
    return slots.slice(0, 10);
  }
}

// Export padrão para ES modules

