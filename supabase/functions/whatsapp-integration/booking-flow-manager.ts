
export interface BookingSession {
  phoneNumber: string;
  currentStep: 'service' | 'slots' | 'confirmation' | 'contact_info' | 'completed';
  selectedService?: string;
  selectedSlot?: { date: string; time: string };
  customerName?: string;
  customerEmail?: string;
  appointmentType?: 'new' | 'reschedule' | 'cancel';
  originalAppointmentId?: string;
}

export class BookingFlowManager {
  private static sessions = new Map<string, BookingSession>();

  static getSession(phoneNumber: string): BookingSession {
    if (!this.sessions.has(phoneNumber)) {
      this.sessions.set(phoneNumber, {
        phoneNumber,
        currentStep: 'service'
      });
    }
    return this.sessions.get(phoneNumber)!;
  }

  static updateSession(phoneNumber: string, updates: Partial<BookingSession>): void {
    const session = this.getSession(phoneNumber);
    Object.assign(session, updates);
    this.sessions.set(phoneNumber, session);
  }

  static clearSession(phoneNumber: string): void {
    this.sessions.delete(phoneNumber);
  }

  static async handleBookingMessage(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    console.log(`📋 Processando mensagem de agendamento de ${phoneNumber}: ${message}`);
    
    const session = this.getSession(phoneNumber);
    const lowerMessage = message.toLowerCase().trim();

    // Detectar intenção de cancelamento
    if (lowerMessage.includes('cancelar') || lowerMessage.includes('desmarcar')) {
      return await this.handleCancellationRequest(phoneNumber, message, supabase);
    }

    // Detectar intenção de reagendamento
    if (lowerMessage.includes('reagendar') || lowerMessage.includes('alterar') || lowerMessage.includes('mudar')) {
      return await this.handleRescheduleRequest(phoneNumber, message, supabase);
    }

    // Fluxo principal de agendamento
    switch (session.currentStep) {
      case 'service':
        return await this.handleServiceSelection(phoneNumber, message, supabase);
      
      case 'slots':
        return await this.handleSlotSelection(phoneNumber, message, supabase);
      
      case 'contact_info':
        return await this.handleContactInfo(phoneNumber, message, supabase);
      
      case 'confirmation':
        return await this.handleConfirmation(phoneNumber, message, supabase);
      
      default:
        return await this.startBookingFlow(phoneNumber, supabase);
    }
  }

  private static async startBookingFlow(phoneNumber: string, supabase: any): Promise<string> {
    this.updateSession(phoneNumber, { 
      currentStep: 'service',
      appointmentType: 'new'
    });

    return `🏥 **Vamos agendar sua consulta!**

Qual tipo de consulta você precisa?

1️⃣ Consulta Geral / Clínico Geral
2️⃣ Cardiologia
3️⃣ Dermatologia  
4️⃣ Ginecologia
5️⃣ Ortopedia
6️⃣ Pediatria
7️⃣ Outro (me diga qual)

Responda com o número ou o nome da especialidade! 😊`;
  }

  private static async handleServiceSelection(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();
    let selectedService = '';

    // Mapear seleção numérica ou por nome
    if (lowerMessage.includes('1') || lowerMessage.includes('geral') || lowerMessage.includes('clínico')) {
      selectedService = 'Consulta Geral';
    } else if (lowerMessage.includes('2') || lowerMessage.includes('cardio')) {
      selectedService = 'Cardiologia';
    } else if (lowerMessage.includes('3') || lowerMessage.includes('derma')) {
      selectedService = 'Dermatologia';
    } else if (lowerMessage.includes('4') || lowerMessage.includes('gineco')) {
      selectedService = 'Ginecologia';
    } else if (lowerMessage.includes('5') || lowerMessage.includes('orto')) {
      selectedService = 'Ortopedia';
    } else if (lowerMessage.includes('6') || lowerMessage.includes('ped')) {
      selectedService = 'Pediatria';
    } else if (lowerMessage.includes('7') || lowerMessage.includes('outro')) {
      selectedService = message.replace(/7|outro/gi, '').trim() || 'Especialidade Específica';
    } else {
      // Tentar extrair especialidade do texto
      selectedService = message.charAt(0).toUpperCase() + message.slice(1);
    }

    if (!selectedService) {
      return `Por favor, escolha uma das opções numeradas ou me diga o nome da especialidade que você precisa! 😊`;
    }

    this.updateSession(phoneNumber, {
      selectedService,
      currentStep: 'slots'
    });

    // Buscar horários disponíveis
    const { AvailabilityManager } = await import('./availability-manager.ts');
    const availableSlots = await AvailabilityManager.getAvailableSlots(supabase, {
      serviceType: selectedService,
      duration: 60
    });

    if (availableSlots.length === 0) {
      return `😔 No momento não temos horários disponíveis para **${selectedService}**.

Nossa agenda está cheia, mas posso te colocar em uma lista de espera ou você pode tentar:
- Escolher outra especialidade
- Me avisar se quiser ser notificado quando houver cancelamentos

O que prefere?`;
    }

    let response = `✅ Perfeito! **${selectedService}** selecionada.

📅 **Horários disponíveis:**

`;

    availableSlots.forEach((slot, index) => {
      response += AvailabilityManager.formatSlotForDisplay(slot, index) + '\n';
    });

    response += `\nResponda com o *número* do horário que prefere! 😊`;

    return response;
  }

  private static async handleSlotSelection(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    const selectedIndex = parseInt(message.trim()) - 1;
    
    if (isNaN(selectedIndex)) {
      return `Por favor, responda com o *número* do horário que você quer (1, 2, 3, etc.) 😊`;
    }

    // Buscar slots novamente para garantir que ainda estão disponíveis
    const { AvailabilityManager } = await import('./availability-manager.ts');
    const session = this.getSession(phoneNumber);
    const availableSlots = await AvailabilityManager.getAvailableSlots(supabase, {
      serviceType: session.selectedService,
      duration: 60
    });

    if (selectedIndex < 0 || selectedIndex >= availableSlots.length) {
      return `Número inválido! Por favor escolha um número entre 1 e ${availableSlots.length} 😊`;
    }

    const selectedSlot = availableSlots[selectedIndex];
    
    this.updateSession(phoneNumber, {
      selectedSlot: { date: selectedSlot.date, time: selectedSlot.time },
      currentStep: 'contact_info'
    });

    const date = new Date(selectedSlot.date);
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('pt-BR');

    return `🎯 **Horário selecionado:**
📅 ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} (${dateStr}) às ${selectedSlot.time}
👨‍⚕️ ${session.selectedService}

Para finalizar, preciso do seu:
📧 **Email** (para confirmação)
👤 **Nome completo**

Pode me enviar no formato:
*Nome: Seu Nome Completo*
*Email: seuemail@exemplo.com*`;
  }

  private static async handleContactInfo(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    const session = this.getSession(phoneNumber);
    
    // Extrair nome e email da mensagem
    const emailMatch = message.match(/(?:email?:?\s*)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    const nameMatch = message.match(/(?:nome?:?\s*)([a-zA-ZÀ-ÿ\s]+?)(?:\s*email|$)/i);
    
    let customerEmail = emailMatch ? emailMatch[1] : '';
    let customerName = nameMatch ? nameMatch[1].trim() : '';
    
    // Se não conseguiu extrair, tentar formatos alternativos
    if (!customerEmail || !customerName) {
      const lines = message.split('\n');
      for (const line of lines) {
        if (!customerEmail && line.includes('@')) {
          const email = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (email) customerEmail = email[1];
        }
        if (!customerName && !line.includes('@') && line.length > 2) {
          customerName = line.replace(/nome?:?/i, '').trim();
        }
      }
    }

    if (!customerEmail || !customerName) {
      return `Por favor, me informe seu nome e email no formato:

*Nome: Seu Nome Completo*
*Email: seuemail@exemplo.com*

Ou pode enviar em linhas separadas! 😊`;
    }

    this.updateSession(phoneNumber, {
      customerName,
      customerEmail,
      currentStep: 'confirmation'
    });

    const date = new Date(session.selectedSlot!.date);
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('pt-BR');

    return `📋 **Confirme os dados do seu agendamento:**

👤 **Nome:** ${customerName}
📧 **Email:** ${customerEmail}
📅 **Data:** ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} (${dateStr})
🕐 **Horário:** ${session.selectedSlot!.time}
👨‍⚕️ **Consulta:** ${session.selectedService}
📍 **Local:** Clínica

Está tudo correto? Responda:
✅ **SIM** - para confirmar
❌ **NÃO** - para alterar alguma informação`;
  }

  private static async handleConfirmation(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();
    const session = this.getSession(phoneNumber);

    if (lowerMessage.includes('sim') || lowerMessage.includes('confirmo') || lowerMessage.includes('ok')) {
      // Criar agendamento
      const result = await this.createAppointment(session, supabase);
      this.clearSession(phoneNumber);
      return result;
    } else if (lowerMessage.includes('não') || lowerMessage.includes('nao') || lowerMessage.includes('alterar')) {
      this.updateSession(phoneNumber, { currentStep: 'service' });
      return `Sem problemas! Vamos começar novamente.

Qual informação você gostaria de alterar? Ou prefere começar do início?`;
    } else {
      return `Por favor, responda *SIM* para confirmar o agendamento ou *NÃO* para alterar! 😊`;
    }
  }

  private static async createAppointment(session: BookingSession, supabase: any): Promise<string> {
    try {
      console.log('📅 Criando agendamento:', session);

      const appointmentData = {
        title: session.selectedService!,
        description: `Agendamento via WhatsApp - ${session.customerName}`,
        date: session.selectedSlot!.date,
        startTime: session.selectedSlot!.time,
        endTime: this.calculateEndTime(session.selectedSlot!.time, 60),
        patientEmail: session.customerEmail!,
        location: 'Clínica'
      };

      const { data, error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'create',
          appointmentData
        }
      });

      if (error || !data?.success) {
        console.error('❌ Erro ao criar agendamento:', error);
        return `😔 Houve um problema ao confirmar seu agendamento. Nossa equipe foi notificada.

Por favor, tente novamente em alguns minutos ou entre em contato por telefone.`;
      }

      // Marcar slot como ocupado
      const { AvailabilityManager } = await import('./availability-manager.ts');
      await AvailabilityManager.markSlotAsBooked(
        supabase, 
        session.selectedSlot!.date, 
        session.selectedSlot!.time
      );

      const date = new Date(session.selectedSlot!.date);
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      const dateStr = date.toLocaleDateString('pt-BR');

      return `✅ **Agendamento confirmado com sucesso!**

📅 **${dayName.charAt(0).toUpperCase() + dayName.slice(1)}** (${dateStr}) às ${session.selectedSlot!.time}
👨‍⚕️ **${session.selectedService}**
👤 **${session.customerName}**
📧 **${session.customerEmail}**
📍 **Clínica**

🎉 Você receberá uma confirmação por email em breve!

**Lembrete importante:**
• Chegue 15 minutos antes da consulta
• Traga documento com foto
• Traga carteirinha do convênio (se houver)

Precisa de mais alguma coisa? 😊`;

    } catch (error) {
      console.error('❌ Erro crítico no agendamento:', error);
      return `😔 Houve um erro técnico. Nossa equipe foi notificada e resolverá em breve.

Por favor, tente novamente mais tarde ou entre em contato por telefone.`;
    }
  }

  private static calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  private static async handleCancellationRequest(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    // Buscar agendamentos do usuário
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    if (convError) {
      return `Para cancelar um agendamento, preciso que me informe:

📅 **Data da consulta**
🕐 **Horário da consulta**
👨‍⚕️ **Tipo de consulta**

Com essas informações posso localizar e processar o cancelamento.`;
    }

    // Buscar agendamentos futuros
    const { data: futureAppointments, error: apptError } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .order('start_time');

    if (apptError || !futureAppointments?.length) {
      return `😔 Não encontrei agendamentos futuros no seu nome.

Verifique se:
• Você tem algum agendamento marcado
• O agendamento foi feito com este número de WhatsApp

Se tiver certeza que há agendamentos, me informe os dados da consulta que deseja cancelar.`;
    }

    let response = `📋 **Seus próximos agendamentos:**\n\n`;
    
    futureAppointments.slice(0, 5).forEach((apt, index) => {
      const date = new Date(apt.start_time);
      const dateStr = date.toLocaleDateString('pt-BR');
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      response += `${index + 1}. **${apt.title}**\n`;
      response += `📅 ${dateStr} às ${timeStr}\n`;
      if (apt.location) response += `📍 ${apt.location}\n`;
      response += '\n';
    });

    response += `❌ **Para cancelar:** responda com o número da consulta que deseja cancelar.

⚠️ **Importante:** O cancelamento será enviado para aprovação da nossa equipe.`;

    return response;
  }

  private static async handleRescheduleRequest(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    // Similar ao cancelamento, mas para reagendamento
    return `🔄 **Reagendamento de consulta**

Para reagendar sua consulta, preciso saber:

📅 **Data atual** da consulta
🕐 **Horário atual** da consulta
📅 **Nova data** desejada (ou me deixe sugerir horários)

Me informe esses dados e eu te mostrarei os horários disponíveis para a nova data! 😊`;
  }
}
