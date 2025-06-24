
import { BookingSessionManager, BookingSession } from './booking-session.ts';

export class BookingConfirmationHandler {
  static async handleConfirmation(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();
    const session = BookingSessionManager.getSession(phoneNumber);

    if (lowerMessage.includes('sim') || lowerMessage.includes('confirmo') || lowerMessage.includes('ok')) {
      // Criar agendamento
      const result = await this.createAppointment(session, supabase);
      BookingSessionManager.clearSession(phoneNumber);
      return result;
    } else if (lowerMessage.includes('não') || lowerMessage.includes('nao') || lowerMessage.includes('alterar')) {
      BookingSessionManager.updateSession(phoneNumber, { currentStep: 'service' });
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
}
