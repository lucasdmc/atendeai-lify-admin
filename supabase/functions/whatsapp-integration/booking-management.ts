
export class BookingManagementHandler {
  static async handleCancellationRequest(
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

  static async handleRescheduleRequest(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    return `🔄 **Reagendamento de consulta**

Para reagendar sua consulta, preciso saber:

📅 **Data atual** da consulta
🕐 **Horário atual** da consulta
📅 **Nova data** desejada (ou me deixe sugerir horários)

Me informe esses dados e eu te mostrarei os horários disponíveis para a nova data! 😊`;
  }
}
