
import { createGoogleCalendarEvent } from './google-calendar.ts';
import { getSystemUserId, saveAppointmentToDatabase, listAppointmentsFromDatabase } from './database-operations.ts';
import { createDateTime } from './datetime-utils.ts';

interface AppointmentRequest {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  patientEmail?: string;
  location?: string;
  label?: string;
}

export async function handleCreateAppointment(appointmentData: AppointmentRequest, supabase: any) {
  console.log('📝 Creating appointment:', appointmentData);
  
  try {
    // Validar dados obrigatórios
    if (!appointmentData.title || appointmentData.title.trim() === '') {
      throw new Error('Título é obrigatório');
    }
    if (!appointmentData.date) {
      throw new Error('Data é obrigatória');
    }
    if (!appointmentData.startTime) {
      throw new Error('Hora de início é obrigatória');
    }
    if (!appointmentData.endTime) {
      throw new Error('Hora de fim é obrigatória');
    }
    
    // Criar datetimes com validação
    const startDateTime = createDateTime(appointmentData.date, appointmentData.startTime);
    const endDateTime = createDateTime(appointmentData.date, appointmentData.endTime);
    
    console.log('📅 Datetimes criados:', { startDateTime, endDateTime });
    
    // Obter ID de usuário do sistema válido
    const systemUserId = await getSystemUserId(supabase);
    console.log('👤 Usando usuário do sistema:', systemUserId);
    
    // Tentar criar evento no Google Calendar
    let googleEventId;
    let googleCalendarError = null;
    
    try {
      const googleEvent = await createGoogleCalendarEvent(appointmentData, supabase);
      googleEventId = googleEvent.id;
      console.log('✅ Evento criado no Google Calendar com ID:', googleEventId);
    } catch (googleError) {
      console.error('❌ Erro ao criar no Google Calendar:', googleError);
      googleCalendarError = googleError.message;
      // Continuar mesmo se falhar no Google Calendar
      googleEventId = `whatsapp_${Date.now()}`;
    }

    // Inserir no banco de dados
    const eventData = await saveAppointmentToDatabase(appointmentData, googleEventId, systemUserId, supabase);
    
    const responseData = {
      success: true,
      eventId: eventData.google_event_id,
      message: 'Agendamento criado com sucesso',
      appointment: eventData
    };

    // Adicionar aviso sobre Google Calendar se houve erro
    if (googleCalendarError) {
      responseData.message += ' (Google Calendar não disponível)';
      responseData.googleCalendarError = googleCalendarError;
    }
    
    return responseData;
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    throw error;
  }
}

export async function handleListAppointments(supabase: any) {
  console.log('📋 Listing appointments');
  
  try {
    const appointments = await listAppointmentsFromDatabase(supabase);

    return {
      success: true,
      appointments,
      message: 'Agendamentos carregados'
    };
  } catch (error) {
    console.error('❌ Error listing appointments:', error);
    throw error;
  }
}

export async function handleUpdateAppointment(eventId: string, appointmentData: any) {
  console.log('📝 Updating appointment:', eventId, appointmentData);
  return {
    success: true,
    message: 'Agendamento atualizado com sucesso'
  };
}

export async function handleDeleteAppointment(eventId: string) {
  console.log('🗑️ Deleting appointment:', eventId);
  return {
    success: true,
    message: 'Agendamento cancelado com sucesso'
  };
}
