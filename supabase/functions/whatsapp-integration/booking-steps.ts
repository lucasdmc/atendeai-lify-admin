
import { BookingSessionManager } from './booking-session.ts';

export class BookingStepHandlers {
  static async handleServiceSelection(
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

    BookingSessionManager.updateSession(phoneNumber, {
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

  static async handleSlotSelection(
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
    const session = BookingSessionManager.getSession(phoneNumber);
    const availableSlots = await AvailabilityManager.getAvailableSlots(supabase, {
      serviceType: session.selectedService,
      duration: 60
    });

    if (selectedIndex < 0 || selectedIndex >= availableSlots.length) {
      return `Número inválido! Por favor escolha um número entre 1 e ${availableSlots.length} 😊`;
    }

    const selectedSlot = availableSlots[selectedIndex];
    
    BookingSessionManager.updateSession(phoneNumber, {
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

  static async handleContactInfo(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    const session = BookingSessionManager.getSession(phoneNumber);
    
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

    BookingSessionManager.updateSession(phoneNumber, {
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

  static generateServiceMenu(): string {
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
}
