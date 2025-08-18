/**
 * Google Calendar Service - AtendeAI Lify
 * Arquivo: services/googleCalendarService.js
 * 
 * Serviço completo para integração com Google Calendar API
 * - Autenticação OAuth2 por clínica (sem Service Account)
 * - Consulta de disponibilidade
 * - Criação de eventos
 * - Atualização e cancelamento
 * - Gestão de múltiplos calendários por clínica
 */

import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import GoogleTokenStore from './googleTokenStore.js';
import logger from '../utils/logger.js';

export default class GoogleCalendarService {
  constructor() {
    this.calendar = null;
    this.auth = null;
    this.credentials = null;
    this.tokens = new Map(); // Cache de tokens por clínica
    this.tokenStore = new GoogleTokenStore();
  }

  /**
   * Inicializa o serviço com credenciais
   * @param {string} credentialsPath - Caminho para o arquivo de credenciais
   */
  async initialize(credentialsPath = './config/google-credentials.json') {
    try {
      logger.info('Inicializando Google Calendar Service...');
      const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
      this.credentials = JSON.parse(credentialsContent);
      logger.info('Google Calendar Service inicializado com sucesso');
      return true;
    } catch (error) {
      logger.error('Erro ao inicializar Google Calendar Service', { message: error.message });
      throw new Error(`Falha na inicialização: ${error.message}`);
    }
  }

  /**
   * Autentica com Google Calendar para uma clínica específica (somente OAuth2)
   * @param {string} clinicId - ID da clínica
   */
  async authenticateForClinic(clinicId) {
    try {
      logger.info('Autenticando Google Calendar para clínica', { clinicId });

      // Verificar cache
      if (this.tokens.has(clinicId)) {
        const cachedAuth = this.tokens.get(clinicId);
        if (await this.isTokenValid(cachedAuth)) {
          this.auth = cachedAuth;
          this.calendar = google.calendar({ version: 'v3', auth: this.auth });
          logger.info('Usando token em cache', { clinicId });
          return true;
        }
      }

      // OAuth2 com tokens armazenados no Supabase
      const { client_secret, client_id, redirect_uris } = this.credentials.web || this.credentials.installed || {};
      if (!client_secret || !client_id || !redirect_uris?.[0]) {
        throw new Error('Credenciais OAuth2 não configuradas corretamente');
      }
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      // Carregar token salvo via tokenStore
      const savedTokens = await this.tokenStore.getToken(clinicId);
      if (savedTokens) {
        oAuth2Client.setCredentials(savedTokens);
        if (await this.isTokenValid(oAuth2Client)) {
          this.auth = oAuth2Client;
          this.calendar = google.calendar({ version: 'v3', auth: this.auth });
          this.tokens.set(clinicId, oAuth2Client);
          logger.info('Token OAuth2 carregado via tokenStore', { clinicId });
          return true;
        }
      }

      // Sem Service Account — apenas OAuth é permitido
      throw new Error(`Token OAuth2 inválido para clínica ${clinicId}. Execute o processo de autenticação.`);
    } catch (error) {
      logger.error('Erro na autenticação do Google Calendar', { clinicId, message: error.message });
      throw error;
    }
  }

  /**
   * Verifica se o token ainda é válido
   * @param {Object} auth - Objeto de autenticação
   */
  async isTokenValid(auth) {
    try {
      await auth.getAccessToken();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gera URL de autenticação para uma clínica
   * @param {string} clinicId - ID da clínica
   */
  generateAuthUrl(clinicId) {
    const { client_secret, client_id, redirect_uris } = this.credentials.web || this.credentials.installed || {};
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: clinicId // Para identificar a clínica no callback
    });

    logger.info('URL de autenticação gerada', { clinicId, authUrl });
    return authUrl;
  }

  /**
   * Processa código de autorização e salva token
   * @param {string} code - Código de autorização
   * @param {string} clinicId - ID da clínica
   */
  async processAuthCode(code, clinicId) {
    try {
      const { client_secret, client_id, redirect_uris } = this.credentials.web || this.credentials.installed || {};
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);

      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      await this.tokenStore.setToken(clinicId, tokens);
      this.tokens.set(clinicId, oAuth2Client);
      this.auth = oAuth2Client;
      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      logger.info('Token salvo com sucesso para clínica', { clinicId });
      return true;
    } catch (error) {
      logger.error('Erro ao processar código de autorização', { clinicId, message: error.message });
      throw error;
    }
  }

  /**
   * Busca horários disponíveis baseado nas configurações da clínica
   * @param {string} clinicId - ID da clínica
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} serviceConfig - Configuração do serviço selecionado
   * @param {number} daysAhead - Quantos dias à frente buscar (padrão: 14)
   */
  async getAvailableSlots(clinicId, clinicContext, serviceConfig, daysAhead = 14) {
    try {
      logger.info('Buscando horários disponíveis para', { clinicId });
      
      // ✅ MODO DE TESTE: Se as credenciais são de desenvolvimento, usar slots simulados
      if (this.credentials.private_key === '-----BEGIN PRIVATE KEY-----\nDEVELOPMENT_MODE\n-----END PRIVATE KEY-----\n') {
        logger.info('MODO DE TESTE: Usando slots simulados (credenciais de desenvolvimento)');
        return this.generateTestSlots(clinicContext, serviceConfig);
      }
      
      // Garantir autenticação
      await this.authenticateForClinic(clinicId);
      
      const calendarId = this.resolveCalendarId(clinicContext, {
        serviceId: serviceConfig?.id,
        professionalId: serviceConfig?.professionalId
      });
      const businessHours = clinicContext.businessHours || {};
      const appointmentRules = clinicContext.appointmentRules || {};
      
      // Calcular período de busca
      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      
      // Aplicar antecedência mínima
      const minimumAdvanceHours = appointmentRules.minimumAdvanceHours || 24;
      startDate.setHours(startDate.getHours() + minimumAdvanceHours);
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + daysAhead);
      
      // Buscar eventos existentes
      const existingEvents = await this.getExistingEvents(calendarId, startDate, endDate);
      
      // Gerar slots disponíveis
      const availableSlots = this.generateAvailableSlots(
        startDate,
        endDate,
        businessHours,
        serviceConfig,
        existingEvents,
        appointmentRules
      );
      
      // Limitar a 4 slots conforme solicitado
      const limitedSlots = availableSlots.slice(0, 4);
      logger.info('Encontrados horários disponíveis', { clinicId, count: limitedSlots.length });
      return limitedSlots;
      
    } catch (error) {
      logger.error('Erro ao buscar horários disponíveis', { clinicId, message: error.message });
      throw error;
    }
  }

  /**
   * Busca eventos existentes no calendário
   * @param {string} calendarId - ID do calendário
   * @param {Date} startDate - Data de início
   * @param {Date} endDate - Data de fim
   */
  async getExistingEvents(calendarId, startDate, endDate) {
    try {
      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
      
    } catch (error) {
      logger.error('Erro ao buscar eventos existentes', { calendarId, startDate, endDate, message: error.message });
      throw error;
    }
  }

  /**
   * Gera slots disponíveis baseado nas regras de negócio
   * @param {Date} startDate - Data de início
   * @param {Date} endDate - Data de fim
   * @param {Object} businessHours - Horários de funcionamento
   * @param {Object} serviceConfig - Configuração do serviço
   * @param {Array} existingEvents - Eventos já agendados
   * @param {Object} appointmentRules - Regras de agendamento
   */
  generateAvailableSlots(startDate, endDate, businessHours, serviceConfig, existingEvents, appointmentRules) {
    const slots = [];
    const serviceDuration = serviceConfig.duration || 30; // minutos
    const intervalBetween = appointmentRules.intervalBetweenAppointments || 5; // minutos
    const totalSlotTime = serviceDuration + intervalBetween;
    
    // Dias da semana em português para inglês
    const dayMap = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };

    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      const dayOfWeek = currentDate.getDay();
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
      
      // Verificar se a clínica funciona neste dia
      const dayConfig = businessHours[dayName];
      if (!dayConfig || dayConfig === 'closed') {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
        continue;
      }

      // Gerar slots para o dia
      const daySlots = this.generateDaySlots(
        currentDate,
        dayConfig,
        serviceDuration,
        totalSlotTime,
        existingEvents,
        appointmentRules
      );
      
      slots.push(...daySlots);
      
      // Próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    // Limitar número de slots retornados
    const maxSlots = appointmentRules.maxSlotsToShow || 20;
    return slots.slice(0, maxSlots);
  }

  /**
   * Gera slots para um dia específico
   * @param {Date} date - Data do dia
   * @param {Object} dayConfig - Configuração do dia
   * @param {number} serviceDuration - Duração do serviço
   * @param {number} totalSlotTime - Tempo total do slot
   * @param {Array} existingEvents - Eventos existentes
   * @param {Object} appointmentRules - Regras de agendamento
   */
  generateDaySlots(date, dayConfig, serviceDuration, totalSlotTime, existingEvents, appointmentRules) {
    const slots = [];
    
    // Horários de funcionamento
    const startTime = this.parseTime(dayConfig.start);
    const endTime = this.parseTime(dayConfig.end);
    
    // Horário de almoço (se houver)
    let lunchStart = null;
    let lunchEnd = null;
    if (dayConfig.lunch) {
      lunchStart = this.parseTime(dayConfig.lunch.start);
      lunchEnd = this.parseTime(dayConfig.lunch.end);
    }

    // Horários preferenciais (se definidos)
    const preferredSlots = appointmentRules.preferredTimeSlots || [];
    
    // Gerar slots de manhã
    const morningEnd = lunchStart || endTime;
    this.generateTimeSlots(
      date, startTime, morningEnd, serviceDuration, totalSlotTime,
      existingEvents, preferredSlots, slots
    );
    
    // Gerar slots de tarde (se houver horário de almoço)
    if (lunchEnd) {
      this.generateTimeSlots(
        date, lunchEnd, endTime, serviceDuration, totalSlotTime,
        existingEvents, preferredSlots, slots
      );
    }

    return slots;
  }

  /**
   * Gera slots de tempo para um período específico
   */
  generateTimeSlots(date, startTime, endTime, serviceDuration, totalSlotTime, existingEvents, preferredSlots, slots) {
    const currentSlot = new Date(date);
    currentSlot.setHours(startTime.hours, startTime.minutes, 0, 0);
    
    const endDateTime = new Date(date);
    endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);
    
    while (currentSlot.getTime() + (serviceDuration * 60000) <= endDateTime.getTime()) {
      // Verificar se não conflita com eventos existentes
      if (!this.hasConflict(currentSlot, serviceDuration, existingEvents)) {
        const slotTime = this.formatTimeForDisplay(currentSlot);
        
        // Verificar se é horário preferencial
        const isPreferred = preferredSlots.length === 0 || 
          preferredSlots.includes(slotTime);
        
        if (isPreferred) {
          slots.push({
            datetime: new Date(currentSlot),
            displayDate: this.formatDateForDisplay(currentSlot),
            displayTime: slotTime,
            available: true,
            duration: serviceDuration
          });
        }
      }
      
      // Próximo slot
      currentSlot.setMinutes(currentSlot.getMinutes() + totalSlotTime);
    }
  }

  /**
   * Verifica se há conflito com eventos existentes
   * @param {Date} slotStart - Início do slot
   * @param {number} duration - Duração em minutos
   * @param {Array} existingEvents - Eventos existentes
   */
  hasConflict(slotStart, duration, existingEvents) {
    const slotEnd = new Date(slotStart.getTime() + (duration * 60000));
    
    return existingEvents.some(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);
      
      // Verificar sobreposição
      return (slotStart < eventEnd && slotEnd > eventStart);
    });
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
   * Cria evento no Google Calendar
   * @param {string} clinicId - ID da clínica
   * @param {Object} appointmentData - Dados do agendamento
   * @param {Object} clinicContext - Contexto da clínica
   */
  async createAppointment(clinicId, appointmentData, clinicContext) {
    try {
      logger.info('Criando agendamento no Google Calendar', { clinicId });
      
      // Garantir autenticação
      await this.authenticateForClinic(clinicId);
      
      const calendarId = this.resolveCalendarId(clinicContext, {
        serviceId: appointmentData?.selectedService?.id,
        professionalId: appointmentData?.selectedProfessional?.id
      });
      const { selectedService, selectedSlot, userProfile } = appointmentData;
      
      // Calcular horários
      const startTime = new Date(selectedSlot.datetime);
      const endTime = new Date(startTime.getTime() + (selectedService.duration * 60000));

      // Idempotência: usar chave externa baseado em clinicId + startTime + phone
      const dedupKey = `${clinicId}|${startTime.toISOString()}|${userProfile?.phone || ''}`;

      // Verificar double-booking rápido (buscar eventos no período)
      const existingEvents = await this.getExistingEvents(calendarId, startTime, endTime);
      const conflict = existingEvents.find(e => {
        const eStart = new Date(e.start.dateTime || e.start.date);
        const eEnd = new Date(e.end.dateTime || e.end.date);
        return (startTime < eEnd && endTime > eStart);
      });
      if (conflict) {
        logger.warn('Conflito de agendamento detectado, retornando existente', { clinicId, eventId: conflict.id });
        return { success: true, eventId: conflict.id, eventLink: conflict.htmlLink, startTime, endTime, calendarId };
      }

      // Preparar dados do evento
      const eventData = {
        summary: `${selectedService.name} - ${userProfile?.name || 'Paciente'}`,
        description: this.buildEventDescription(appointmentData, clinicContext),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: clinicContext.timezone || 'America/Sao_Paulo',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: clinicContext.timezone || 'America/Sao_Paulo',
        },
        attendees: this.buildAttendees(appointmentData, clinicContext),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 60 }, // 1 hora antes
          ],
        },
        colorId: this.getEventColor(selectedService.type),
        extendedProperties: { private: { dedupKey } },
      };

      // Criar evento
      const response = await this.calendar.events.insert({
         calendarId: calendarId,
        resource: eventData,
        sendUpdates: 'all', // Enviar notificações
      });

      const eventId = response.data.id;
      const eventLink = response.data.htmlLink;
      logger.info('Agendamento criado com sucesso', { clinicId, eventId });
      
      return {
        success: true,
        eventId: eventId,
        eventLink: eventLink,
        startTime: startTime,
        endTime: endTime,
        calendarId: calendarId
      };
      
    } catch (error) {
      logger.error('Erro ao criar agendamento', { clinicId, message: error.message });
      throw error;
    }
  }

  /**
   * Constrói descrição do evento
   * @param {Object} appointmentData - Dados do agendamento
   * @param {Object} clinicContext - Contexto da clínica
   */
  buildEventDescription(appointmentData, clinicContext) {
    const { selectedService, userProfile, additionalInfo } = appointmentData;
    
    let description = `Agendamento via AtendeAI Lify\n\n`;
    description += `Serviço: ${selectedService.name}\n`;
    description += `Duração: ${selectedService.duration} minutos\n`;
    
    if (selectedService.price) {
      description += `Valor: R$ ${selectedService.price.toFixed(2).replace('.', ',')}\n`;
    }
    
    description += `\nPaciente: ${userProfile?.name || 'Não informado'}\n`;
    
    if (userProfile?.phone) {
      description += `Telefone: ${userProfile.phone}\n`;
    }
    
    if (additionalInfo?.symptoms) {
      description += `\nSintomas/Observações: ${additionalInfo.symptoms}\n`;
    }
    
    description += `\nClínica: ${clinicContext.name}\n`;
    
    if (clinicContext.phone) {
      description += `Telefone da clínica: ${clinicContext.phone}\n`;
    }
    
    if (clinicContext.address) {
      description += `Endereço: ${clinicContext.address}\n`;
    }
    
    description += `\nAgendado em: ${new Date().toLocaleString('pt-BR')}`;
    
    return description;
  }

  /**
   * Constrói lista de participantes
   * @param {Object} appointmentData - Dados do agendamento
   * @param {Object} clinicContext - Contexto da clínica
   */
  buildAttendees(appointmentData, clinicContext) {
    const attendees = [];
    
    // Adicionar email do paciente se disponível
    if (appointmentData.userProfile?.email) {
      attendees.push({
        email: appointmentData.userProfile.email,
        displayName: appointmentData.userProfile.name,
        responseStatus: 'accepted'
      });
    }
    
    // Adicionar email da clínica se disponível
    if (clinicContext.email) {
      attendees.push({
        email: clinicContext.email,
        displayName: clinicContext.name,
        responseStatus: 'accepted'
      });
    }
    
    return attendees;
  }

  /**
   * Determina cor do evento baseado no tipo de serviço
   * @param {string} serviceType - Tipo do serviço
   */
  getEventColor(serviceType) {
    const colorMap = {
      'consulta': '1', // Azul
      'exame': '2', // Verde
      'procedimento': '3', // Roxo
      'retorno': '4', // Vermelho
      'emergencia': '11', // Vermelho escuro
      'checkup': '5', // Amarelo
    };
    
    return colorMap[serviceType?.toLowerCase()] || '1';
  }

  /**
   * Atualiza evento existente
   * @param {string} clinicId - ID da clínica
   * @param {string} eventId - ID do evento
   * @param {Object} updateData - Dados para atualização
   * @param {Object} clinicContext - Contexto da clínica
   */
  async updateAppointment(clinicId, eventId, updateData, clinicContext) {
    try {
      logger.info('Atualizando agendamento', { clinicId, eventId });
      
      // Garantir autenticação
      await this.authenticateForClinic(clinicId);
      
      const calendarId = this.resolveCalendarId(clinicContext, updateData?.contextSelection || {});
      
      // Buscar evento atual
      const currentEvent = await this.calendar.events.get({
        calendarId: calendarId,
        eventId: eventId,
      });
      
      // Aplicar atualizações
      const updatedEvent = {
        ...currentEvent.data,
        ...updateData
      };
      
      // Atualizar evento
      const response = await this.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: updatedEvent,
        sendUpdates: 'all',
      });
      logger.info('Agendamento atualizado com sucesso', { clinicId, eventId });
      return response.data;
      
    } catch (error) {
      logger.error('Erro ao atualizar agendamento', { clinicId, eventId, message: error.message });
      throw error;
    }
  }

  /**
   * Cancela evento
   * @param {string} clinicId - ID da clínica
   * @param {string} eventId - ID do evento
   * @param {Object} clinicContext - Contexto da clínica
   * @param {string} reason - Motivo do cancelamento
   */
  async cancelAppointment(clinicId, eventId, clinicContext, reason = '') {
    try {
      logger.info('Cancelando agendamento', { clinicId, eventId });
      
      // Garantir autenticação
      await this.authenticateForClinic(clinicId);
      
      const calendarId = this.resolveCalendarId(clinicContext, {});
      
      // Buscar evento para obter detalhes
      const event = await this.calendar.events.get({
        calendarId: calendarId,
        eventId: eventId,
      });
      
      // Atualizar descrição com motivo do cancelamento
      const updatedDescription = event.data.description + 
        `\n\n❌ CANCELADO em ${new Date().toLocaleString('pt-BR')}` +
        (reason ? `\nMotivo: ${reason}` : '');
      
      // Marcar como cancelado ao invés de deletar
      await this.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: {
          ...event.data,
          summary: `[CANCELADO] ${event.data.summary}`,
          description: updatedDescription,
          colorId: '8', // Cinza para cancelados
        },
        sendUpdates: 'all',
      });
      logger.info('Agendamento cancelado com sucesso', { clinicId, eventId });
      return true;
      
    } catch (error) {
      logger.error('Erro ao cancelar agendamento', { clinicId, eventId, message: error.message });
      throw error;
    }
  }

  /**
   * Resolve o calendarId com base no serviço/profissional
   * Prioridade: professional > service > default
   */
  resolveCalendarId(clinicContext, { serviceId = null, professionalId = null } = {}) {
    const defaultId = clinicContext.googleCalendar?.calendarId || 'primary';
    const byService = clinicContext.googleCalendar?.calendarsByService || {};
    const byProfessional = clinicContext.googleCalendar?.calendarsByProfessional || {};

    if (professionalId && byProfessional[professionalId]) {
      return byProfessional[professionalId];
    }
    if (serviceId && byService[serviceId]) {
      return byService[serviceId];
    }
    return defaultId;
  }

  /**
   * Lista agendamentos de um período
   * @param {string} clinicId - ID da clínica
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Date} startDate - Data de início
   * @param {Date} endDate - Data de fim
   */
  async listAppointments(clinicId, clinicContext, startDate, endDate) {
    try {
      logger.info('Listando agendamentos para', { clinicId });
      
      // Garantir autenticação
      await this.authenticateForClinic(clinicId);
      
      const calendarId = clinicContext.googleCalendar?.calendarId || 'primary';
      
      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        q: 'AtendeAI Lify', // Filtrar apenas eventos criados pelo sistema
      });
      
      const appointments = response.data.items.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        status: event.status,
        attendees: event.attendees || [],
        link: event.htmlLink
      }));
      logger.info('Encontrados agendamentos', { clinicId, count: appointments.length });
      return appointments;
      
    } catch (error) {
      logger.error('Erro ao listar agendamentos', { clinicId, message: error.message });
      throw error;
    }
  }

  /**
   * Verifica status de conectividade com Google Calendar
   * @param {string} clinicId - ID da clínica
   */
  async checkConnection(clinicId) {
    try {
      if (!this.tokens.has(clinicId)) {
        return { connected: false, reason: 'Token não encontrado' };
      }
      
      const auth = this.tokens.get(clinicId);
      if (!await this.isTokenValid(auth)) {
        return { connected: false, reason: 'Token expirado' };
      }
      
      // Testar acesso ao calendário
      this.auth = auth;
      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      await this.calendar.calendarList.list();
      
      return { connected: true, reason: 'Conectado com sucesso' };
      
    } catch (error) {
      return { connected: false, reason: error.message };
    }
  }

  /**
   * Obtém informações dos calendários disponíveis
   * @param {string} clinicId - ID da clínica
   */
  async getAvailableCalendars(clinicId) {
    try {
      const auth = this.tokens.get(clinicId);
      if (!auth) {
        throw new Error('Clínica não autenticada');
      }
      
      this.auth = auth;
      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      const response = await this.calendar.calendarList.list();
      
      return response.data.items.map(calendar => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        primary: calendar.primary,
        accessRole: calendar.accessRole
      }));
      
    } catch (error) {
      logger.error('Erro ao obter calendários', { clinicId, message: error.message });
      throw error;
    }
  }

  /**
   * Gera slots de teste para modo de desenvolvimento
   * @param {Object} clinicContext - Contexto da clínica
   * @param {Object} serviceConfig - Configuração do serviço
   */
  generateTestSlots(clinicContext, serviceConfig) {
    logger.info('Gerando slots de teste para modo de desenvolvimento...');
    
    const slots = [];
    const now = new Date();
    const serviceDuration = serviceConfig.duration || 30;
    
    // Gerar próximos 4 dias úteis com horários reais
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      
      // Pular fins de semana
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Gerar horários baseados no horário de funcionamento da clínica
      const workingHours = clinicContext.horario_funcionamento || {};
      const dayName = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][date.getDay()];
      const dayConfig = workingHours[dayName];
      
      if (dayConfig && dayConfig.abertura && dayConfig.fechamento) {
        const startHour = parseInt(dayConfig.abertura.split(':')[0]);
        const endHour = parseInt(dayConfig.fechamento.split(':')[0]);
        
        // Gerar 1 horário por dia (total de 4)
        if (slots.length < 4) {
          const slotTime = new Date(date);
          slotTime.setHours(startHour + 2, 0, 0, 0); // 2 horas após abertura
          
          slots.push({
            datetime: slotTime,
            displayDate: this.formatDateForDisplay(slotTime),
            displayTime: this.formatTimeForDisplay(slotTime),
            available: true,
            duration: serviceDuration
          });
        }
      }
      
      if (slots.length >= 4) break;
    }
    
    logger.info('Slots de teste gerados', { count: slots.length });
    return slots;
  }

  /**
   * Limpa cache de tokens (útil para logout)
   * @param {string} clinicId - ID da clínica (opcional, se não fornecido limpa todos)
   */
  clearTokenCache(clinicId = null) {
    if (clinicId) {
      this.tokens.delete(clinicId);
      logger.info('Cache de token limpo para', { clinicId });
    } else {
      this.tokens.clear();
      logger.info('Cache de tokens limpo completamente');
    }
  }
}

// Export padrão para ES modules

