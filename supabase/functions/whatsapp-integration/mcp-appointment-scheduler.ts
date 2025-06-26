
// Appointment scheduling utilities for MCP tools
export class MCPAppointmentScheduler {
  static async scheduleAppointment(parameters: any, supabase: any): Promise<string> {
    try {
      console.log('📅 Criando agendamento real...');
      console.log('📋 Dados do agendamento:', JSON.stringify(parameters, null, 2));
      
      const { specialty, date, time, customerName, customerEmail } = parameters;
      
      // Validar dados obrigatórios
      if (!specialty || !date || !time) {
        console.log('❌ Dados insuficientes para agendamento');
        return `Para finalizar o agendamento, ainda preciso:
${!specialty ? '👨‍⚕️ Especialidade' : ''}
${!date ? '📅 Data' : ''}
${!time ? '🕐 Horário' : ''}

Me informe esses dados para confirmar! 💙`;
      }
      
      // Converter data para formato correto
      const formattedDate = this.convertToISODate(date);
      const endTime = this.calculateEndTime(time);
      
      console.log(`📅 Data formatada: ${formattedDate}`);
      console.log(`🕐 Horário: ${time} - ${endTime}`);
      
      // Chamar o sistema real de agendamentos
      const appointmentData = {
        action: 'create',
        appointmentData: {
          title: `${specialty} - ${customerName || 'Paciente via WhatsApp'}`,
          description: `Agendamento realizado via WhatsApp AI
Paciente: ${customerName || 'Não informado'}
Email: ${customerEmail || 'Não informado'}
Telefone: WhatsApp`,
          date: formattedDate,
          startTime: time,
          endTime: endTime,
          patientEmail: customerEmail,
          location: 'Clínica',
          label: 'consulta'
        }
      };

      console.log('🚀 Enviando para appointment-manager:', JSON.stringify(appointmentData, null, 2));

      const { data, error } = await supabase.functions.invoke('appointment-manager', {
        body: appointmentData
      });

      console.log('📥 Resposta do appointment-manager:', JSON.stringify({ data, error }, null, 2));

      if (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        return `Ops! Tive uma dificuldade para confirmar o agendamento. 😔
Nossa equipe vai entrar em contato para finalizar!

📋 **Dados do agendamento:**
👨‍⚕️ **${specialty}**
📅 **${date}**
🕐 **${time}**
${customerName ? `👤 **${customerName}**` : ''}

Você receberá uma confirmação em breve! 💙`;
      }

      if (data && data.success) {
        console.log('✅ Agendamento criado com sucesso!');
        return `✅ **Agendamento confirmado!**

👨‍⚕️ **${specialty}**
📅 **${date}**
🕐 **${time}**
${customerName ? `👤 **${customerName}**` : ''}
${customerEmail ? `📧 **${customerEmail}**` : ''}
📍 **Clínica**

Seu agendamento foi criado com sucesso! ${customerEmail ? 'Você receberá uma confirmação por email.' : 'Nossa equipe entrará em contato para confirmação.'}

Se precisar reagendar ou cancelar, é só me avisar! 😊💙`;
      }

      console.log('⚠️ Resposta inesperada do sistema');
      return `Agendamento processado! 😊
Nossa equipe vai confirmar todos os detalhes:

📋 **${specialty}** - **${date}** às **${time}**

Aguarde nosso contato para confirmação! 💙`;
    } catch (error) {
      console.error('❌ Erro crítico ao agendar:', error);
      return `Anotei sua solicitação de agendamento! 😊

📋 **${parameters.specialty || 'Consulta'}** - **${parameters.date}** às **${parameters.time}**

Nossa equipe vai entrar em contato para confirmar todos os detalhes! 💙`;
    }
  }

  static convertToISODate(dateString: string): string {
    try {
      console.log(`🔄 Convertendo data: ${dateString}`);
      
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          let year = parts[2];
          
          if (year.length === 2) {
            year = '20' + year;
          }
          
          const isoDate = `${year}-${month}-${day}`;
          console.log(`✅ Data convertida para: ${isoDate}`);
          return isoDate;
        }
      }
      
      // Se já está em formato ISO ou outro formato válido
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split('T')[0];
        console.log(`✅ Data convertida para: ${isoDate}`);
        return isoDate;
      }
      
      // Fallback para amanhã (próximo dia útil)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = tomorrow.toISOString().split('T')[0];
      console.log(`⚠️ Usando data padrão (amanhã): ${isoDate}`);
      return isoDate;
    } catch (error) {
      console.error('❌ Erro ao converter data:', error);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = tomorrow.toISOString().split('T')[0];
      console.log(`⚠️ Usando data padrão (amanhã): ${isoDate}`);
      return isoDate;
    }
  }

  static calculateEndTime(startTime: string): string {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHours = hours + 1; // Consulta de 1 hora por padrão
      return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch {
      return '15:00'; // Fallback
    }
  }
}
