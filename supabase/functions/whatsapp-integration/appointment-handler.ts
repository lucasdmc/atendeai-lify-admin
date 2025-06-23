
import { extractAppointmentData } from './appointment-utils.ts';

export async function handleAppointmentRequest(message: string, phoneNumber: string, supabase: any): Promise<string | null> {
  console.log('🏥 Processando solicitação de agendamento...');
  console.log('📝 Mensagem:', message);
  
  const lowerMessage = message.toLowerCase();

  // Tentar extrair informações de agendamento da mensagem
  const appointmentData = extractAppointmentData(message);
  console.log('📋 Dados extraídos:', appointmentData);

  // Se temos informações suficientes, criar o agendamento
  if (appointmentData.hasRequiredData) {
    console.log('✅ Dados suficientes encontrados, criando agendamento...');
    
    try {
      // Chamar a função de agendamento
      const { data, error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'create',
          appointmentData: {
            title: appointmentData.title,
            description: appointmentData.description || `Agendamento via WhatsApp - ${phoneNumber}`,
            date: appointmentData.date,
            startTime: appointmentData.startTime,
            endTime: appointmentData.endTime,
            patientEmail: appointmentData.email,
            location: appointmentData.location
          }
        }
      });

      console.log('📞 Resposta da API de agendamento:', { data, error });

      if (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        return `Desculpe, houve um erro ao criar seu agendamento. Por favor, tente novamente mais tarde.`;
      }

      if (data && data.success) {
        console.log('✅ Agendamento criado com sucesso!');
        return `✅ **Agendamento confirmado!**

📅 **Data:** ${appointmentData.displayDate}
🕐 **Horário:** ${appointmentData.startTime} às ${appointmentData.endTime}
👨‍⚕️ **Consulta:** ${appointmentData.title}
${appointmentData.email ? `📧 **Email:** ${appointmentData.email}` : ''}
📍 **Local:** ${appointmentData.location}

Seu agendamento foi criado com sucesso! ${appointmentData.email ? 'Você receberá uma confirmação por email em breve.' : ''}

Se precisar cancelar ou reagendar, me avise!`;
      } else {
        console.error('❌ Resposta inesperada da API:', data);
        return `Houve um problema ao confirmar seu agendamento. Tente novamente em alguns instantes.`;
      }

    } catch (error) {
      console.error('❌ Erro ao processar agendamento:', error);
      return `Desculpe, houve um erro técnico. Tente novamente em alguns minutos.`;
    }
  }

  // Se não temos dados suficientes, solicitar mais informações
  if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar') || lowerMessage.includes('consulta')) {
    const missingInfo = [];
    if (!appointmentData.date) missingInfo.push('📅 **Data** (ex: 25/12/2024 ou 25/12)');
    if (!appointmentData.startTime) missingInfo.push('🕐 **Horário** (ex: 14:00 ou 14h)');
    if (!appointmentData.email) missingInfo.push('📧 **Email** (para confirmação)');

    if (missingInfo.length > 0) {
      return `Para agendar sua consulta, ainda preciso das seguintes informações:

${missingInfo.join('\n')}

${appointmentData.title !== 'Consulta Médica' ? '' : '👨‍⚕️ **Tipo de consulta** (ex: Consulta Geral, Cardiologia, etc.)'}

Por favor, me informe esses dados e eu criarei seu agendamento!

*Exemplo: "Quero agendar cardiologia para 26/12/2024 às 15:00, email: teste@email.com"*`;
    }
  }

  // Listar agendamentos
  if (lowerMessage.includes('listar') || (lowerMessage.includes('ver') && lowerMessage.includes('agendamento'))) {
    try {
      const { data, error } = await supabase.functions.invoke('appointment-manager', {
        body: {
          action: 'list'
        }
      });

      if (error || !data.success) {
        return `Desculpe, não consegui acessar seus agendamentos no momento. Tente novamente mais tarde.`;
      }

      const appointments = data.appointments || [];
      if (appointments.length === 0) {
        return `📋 Você não possui agendamentos marcados no momento.

Gostaria de agendar uma consulta? Posso ajudá-lo com isso!`;
      }

      let response = '📋 **Seus próximos agendamentos:**\n\n';
      appointments.slice(0, 5).forEach((apt, index) => {
        const date = new Date(apt.start_time);
        const dateStr = date.toLocaleDateString('pt-BR');
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        response += `${index + 1}. **${apt.title}**\n`;
        response += `📅 ${dateStr} às ${timeStr}\n`;
        if (apt.location) response += `📍 ${apt.location}\n`;
        response += '\n';
      });
      
      return response + 'Precisa alterar algum agendamento?';
    } catch (error) {
      console.error('❌ Erro ao listar agendamentos:', error);
      return `Desculpe, houve um erro ao buscar seus agendamentos. Tente novamente mais tarde.`;
    }
  }

  // Reagendar ou cancelar
  if (lowerMessage.includes('cancelar') || lowerMessage.includes('desmarcar')) {
    return `Para cancelar seu agendamento, preciso que me informe:

📅 **Data da consulta** que deseja cancelar
🕐 **Horário** da consulta

Com essas informações, posso localizar e cancelar seu agendamento.`;
  }

  if (lowerMessage.includes('reagendar') || lowerMessage.includes('alterar')) {
    return `Para reagendar sua consulta, preciso saber:

📅 **Data atual** da consulta
🕐 **Horário atual** da consulta
📅 **Nova data** desejada
🕐 **Novo horário** desejado

Com essas informações, posso alterar seu agendamento.`;
  }

  return null;
}
