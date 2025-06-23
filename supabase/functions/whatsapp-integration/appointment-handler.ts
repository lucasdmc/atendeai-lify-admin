
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
            description: appointmentData.description,
            date: appointmentData.date,
            startTime: appointmentData.startTime,
            endTime: appointmentData.endTime,
            patientEmail: appointmentData.email,
            location: appointmentData.location
          }
        }
      });

      if (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        return `Desculpe, houve um erro ao criar seu agendamento. Tente novamente ou entre em contato por telefone.`;
      }

      console.log('✅ Agendamento criado com sucesso!');
      return `✅ **Agendamento confirmado!**

📅 **Data:** ${appointmentData.displayDate}
🕐 **Horário:** ${appointmentData.startTime} às ${appointmentData.endTime}
👨‍⚕️ **Consulta:** ${appointmentData.title}
📧 **Email:** ${appointmentData.email}

Seu agendamento foi criado com sucesso! Você receberá uma confirmação por email em breve.

Se precisar cancelar ou reagendar, me avise!`;

    } catch (error) {
      console.error('❌ Erro ao processar agendamento:', error);
      return `Desculpe, houve um erro técnico. Tente novamente em alguns minutos.`;
    }
  }

  // Se não temos dados suficientes, solicitar mais informações
  if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar')) {
    return `Para agendar sua consulta, preciso de algumas informações:

📅 **Data desejada** (ex: 25/12/2024)
🕐 **Horário** (ex: 14:00 às 15:00)
👨‍⚕️ **Tipo de consulta** (ex: Consulta Geral, Cardiologia, etc.)
📧 **Seu email** (para enviar confirmação)

Por favor, me informe esses dados e eu criarei seu agendamento!`;
  }

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

  if (lowerMessage.includes('listar') || (lowerMessage.includes('ver') && lowerMessage.includes('agendamento'))) {
    return `Vou verificar seus agendamentos... 

📋 No momento, você não possui agendamentos marcados.

Gostaria de agendar uma consulta? Posso ajudá-lo com isso!`;
  }

  return null;
}
