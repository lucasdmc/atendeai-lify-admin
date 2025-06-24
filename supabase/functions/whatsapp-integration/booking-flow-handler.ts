
import { BookingSessionManager } from './booking-session-manager.ts';
import { AvailabilityManager } from './availability-manager.ts';
import { detectBookingCommand, detectBookingResponse } from './booking-command-detector.ts';
import { format, addDays, parseISO } from 'https://esm.sh/date-fns@3.6.0';
import { ptBR } from 'https://esm.sh/date-fns@3.6.0/locale';

export class BookingFlowHandler {
  private sessionManager: BookingSessionManager;
  private availabilityManager: AvailabilityManager;

  constructor(private supabase: any) {
    this.sessionManager = new BookingSessionManager(supabase);
    this.availabilityManager = new AvailabilityManager(supabase);
  }

  async handleMessage(
    conversationId: string,
    phoneNumber: string,
    message: string
  ): Promise<string | null> {
    console.log('🗓️ Verificando fluxo de agendamento...');

    // Verificar se é comando de agendamento
    if (detectBookingCommand(message)) {
      console.log('📅 Comando de agendamento detectado');
      return await this.startBookingFlow(conversationId, phoneNumber);
    }

    // Verificar se há sessão ativa
    const activeSession = await this.sessionManager.getActiveSession(conversationId);
    if (!activeSession) {
      return null; // Não é uma interação de agendamento
    }

    console.log(`📝 Sessão ativa encontrada - Estado: ${activeSession.session_state}`);

    // Processar resposta baseada no estado da sessão
    const response = detectBookingResponse(message, activeSession.session_state);
    
    if (response.responseType === 'cancel') {
      await this.sessionManager.cancelSession(conversationId);
      return `❌ **Agendamento cancelado**

Não há problema! Se precisar agendar uma consulta, digite */agendar* a qualquer momento.

Posso ajudá-lo com mais alguma coisa?`;
    }

    if (!response.isResponse) {
      return await this.handleInvalidResponse(activeSession);
    }

    // Processar cada tipo de resposta
    switch (response.responseType) {
      case 'date':
        return await this.handleDateSelection(activeSession, response.value!);
      case 'time':
        return await this.handleTimeSelection(activeSession, response.value!);
      case 'confirmation':
        return await this.handleConfirmation(activeSession, response.value!);
      default:
        return null;
    }
  }

  private async startBookingFlow(conversationId: string, phoneNumber: string): Promise<string> {
    const session = await this.sessionManager.createSession(conversationId, phoneNumber);
    if (!session) {
      return `❌ **Erro no sistema**

Desculpe, não foi possível iniciar o agendamento. Tente novamente em alguns minutos.`;
    }

    // Buscar datas disponíveis
    const availableDates = await this.availabilityManager.getAvailableDates(21);
    
    if (availableDates.length === 0) {
      await this.sessionManager.cancelSession(conversationId);
      return `😔 **Sem disponibilidade**

Infelizmente não há horários disponíveis nos próximos dias. 

Entre em contato pelo telefone **(47) 99967-2901** para verificar outras opções.`;
    }

    // Gerar calendário interativo
    let message = `📅 **Agendamento de Consulta**

Selecione uma data disponível (próximos 21 dias):

`;

    // Mostrar primeiras 10 datas disponíveis
    availableDates.slice(0, 10).forEach((day, index) => {
      const dayNumber = day.date.split('-')[2];
      message += `**${index + 1}.** ${dayNumber} - ${day.displayDate}\n`;
    });

    message += `\n💡 **Como usar:**
• Digite o número da opção (ex: *1*, *2*, *3*)
• Ou digite */cancelar* para sair

⏰ Esta sessão expira em 30 minutos.`;

    return message;
  }

  private async handleDateSelection(session: any, value: string): Promise<string> {
    try {
      // Buscar datas disponíveis novamente
      const availableDates = await this.availabilityManager.getAvailableDates(21);
      
      // Interpretar a seleção
      let selectedDate: string | null = null;
      
      // Se é um número (índice da lista)
      const optionNumber = parseInt(value);
      if (!isNaN(optionNumber) && optionNumber >= 1 && optionNumber <= availableDates.length) {
        selectedDate = availableDates[optionNumber - 1].date;
      }
      // Se é formato DD/MM
      else if (value.includes('/')) {
        const [day, month] = value.split('/');
        const year = new Date().getFullYear();
        selectedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Se é apenas o dia
      else if (value.length <= 2) {
        const day = parseInt(value);
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        selectedDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }

      if (!selectedDate || !availableDates.find(d => d.date === selectedDate)) {
        return `❌ **Data inválida**

Por favor, selecione uma das opções disponíveis digitando o número correspondente (ex: *1*, *2*, *3*).

Ou digite */cancelar* para sair do agendamento.`;
      }

      // Buscar horários disponíveis para a data
      const availableSlots = await this.availabilityManager.getAvailableTimesForDate(selectedDate);
      const freeSlots = availableSlots.filter(slot => slot.available);

      if (freeSlots.length === 0) {
        return `😔 **Sem horários disponíveis**

Infelizmente não há horários livres para esta data. 

Por favor, escolha outra data ou digite */cancelar* para sair.`;
      }

      // Atualizar sessão
      const selectedDateFormatted = format(parseISO(selectedDate), "dd 'de' MMMM", { locale: ptBR });
      await this.sessionManager.updateSession(session.id, {
        selected_date: selectedDate,
        session_state: 'awaiting_time',
        session_data: { ...session.session_data, available_slots: freeSlots }
      });

      // Mostrar horários disponíveis
      let message = `✅ **Data selecionada:** ${selectedDateFormatted}

🕐 **Horários disponíveis:**

`;

      freeSlots.forEach((slot, index) => {
        message += `**${index + 1}.** ${slot.displayTime}\n`;
      });

      message += `\n💡 **Como usar:**
• Digite o número do horário (ex: *1*, *2*, *3*)
• Ou digite */cancelar* para sair

⏰ Esta sessão expira em 30 minutos.`;

      return message;
    } catch (error) {
      console.error('❌ Erro ao processar seleção de data:', error);
      return `❌ **Erro no sistema**

Ocorreu um erro ao processar sua seleção. Tente novamente ou digite */cancelar*.`;
    }
  }

  private async handleTimeSelection(session: any, value: string): Promise<string> {
    try {
      const availableSlots = session.session_data?.available_slots || [];
      
      // Interpretar seleção de horário
      let selectedSlot = null;
      
      // Se é um número (índice da lista)
      const optionNumber = parseInt(value);
      if (!isNaN(optionNumber) && optionNumber >= 1 && optionNumber <= availableSlots.length) {
        selectedSlot = availableSlots[optionNumber - 1];
      }
      // Se é formato HH:MM
      else if (value.includes(':')) {
        selectedSlot = availableSlots.find(slot => slot.time === value);
      }

      if (!selectedSlot) {
        return `❌ **Horário inválido**

Por favor, selecione um dos horários disponíveis digitando o número correspondente (ex: *1*, *2*, *3*).

Ou digite */cancelar* para sair do agendamento.`;
      }

      // Atualizar sessão
      await this.sessionManager.updateSession(session.id, {
        selected_time: selectedSlot.time,
        session_state: 'awaiting_confirmation'
      });

      // Formatar data e hora para confirmação
      const selectedDate = format(parseISO(session.selected_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const weekday = format(parseISO(session.selected_date), 'EEEE', { locale: ptBR });

      return `✅ **Resumo do agendamento:**

📅 **Data:** ${weekday}, ${selectedDate}
🕐 **Horário:** ${selectedSlot.displayTime}
👨‍⚕️ **Tipo:** Consulta médica
📍 **Local:** Clínica

⚠️ **Importante:**
• Chegue 15 minutos antes do horário
• Traga documento de identidade
• Em caso de cancelamento, avise com 24h de antecedência

**Digite *CONFIRMAR* para finalizar o agendamento**
**Digite *CANCELAR* para cancelar**`;
    } catch (error) {
      console.error('❌ Erro ao processar seleção de horário:', error);
      return `❌ **Erro no sistema**

Ocorreu um erro ao processar sua seleção. Tente novamente ou digite */cancelar*.`;
    }
  }

  private async handleConfirmation(session: any, value: string): Promise<string> {
    if (value === 'no') {
      await this.sessionManager.cancelSession(session.conversation_id);
      return `❌ **Agendamento cancelado**

Não há problema! Se precisar agendar uma consulta, digite */agendar* a qualquer momento.`;
    }

    try {
      // Criar agendamento no sistema
      const appointmentDateTime = `${session.selected_date}T${session.selected_time}:00`;
      const endDateTime = new Date(new Date(appointmentDateTime).getTime() + 30 * 60000).toISOString();

      const { data, error } = await this.supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'create',
          appointmentData: {
            title: 'Consulta médica - WhatsApp',
            description: `Agendamento via WhatsApp - ${session.phone_number}`,
            date: session.selected_date,
            startTime: session.selected_time,
            endTime: session.selected_time, // Será ajustado pelo sistema
            location: 'Clínica',
            patientEmail: session.customer_email || null
          }
        }
      });

      if (error || !data?.success) {
        console.error('❌ Erro ao criar agendamento:', error);
        return `❌ **Erro ao confirmar agendamento**

Houve um problema ao salvar seu agendamento. Por favor, tente novamente ou entre em contato pelo telefone **(47) 99967-2901**.`;
      }

      // Completar sessão
      await this.sessionManager.completeSession(session.id);

      // Confirmação final
      const selectedDate = format(parseISO(session.selected_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const weekday = format(parseISO(session.selected_date), 'EEEE', { locale: ptBR });

      return `✅ **Agendamento confirmado!**

**Detalhes da sua consulta:**
📅 **Data:** ${weekday}, ${selectedDate}
🕐 **Horário:** ${session.selected_time}
📍 **Local:** Clínica
📱 **Telefone:** (47) 99967-2901

**Código do agendamento:** ${data.eventId?.substring(0, 8) || 'N/A'}

📝 **Instruções importantes:**
• Chegue 15 minutos antes do horário
• Traga documento de identidade
• Para reagendar ou cancelar, ligue para (47) 99967-2901

**Obrigado por escolher nossa clínica!** 👨‍⚕️`;

    } catch (error) {
      console.error('❌ Erro ao confirmar agendamento:', error);
      return `❌ **Erro no sistema**

Houve um problema ao confirmar seu agendamento. Por favor, entre em contato pelo telefone **(47) 99967-2901** para finalizar o processo.`;
    }
  }

  private async handleInvalidResponse(session: any): Promise<string> {
    const stateMessages = {
      awaiting_date: `❓ **Resposta não reconhecida**

Por favor, selecione uma data digitando o **número** da opção (ex: *1*, *2*, *3*).

Ou digite */cancelar* para sair do agendamento.`,

      awaiting_time: `❓ **Resposta não reconhecida**

Por favor, selecione um horário digitando o **número** da opção (ex: *1*, *2*, *3*).

Ou digite */cancelar* para sair do agendamento.`,

      awaiting_confirmation: `❓ **Resposta não reconhecida**

Por favor, digite:
• **CONFIRMAR** para finalizar o agendamento
• **CANCELAR** para cancelar

Ou digite */cancelar* para sair.`
    };

    return stateMessages[session.session_state] || `❓ **Comando não reconhecido**

Digite */cancelar* para sair do agendamento.`;
  }
}
