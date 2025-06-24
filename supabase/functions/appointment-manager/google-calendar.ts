
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

export async function createGoogleCalendarEvent(appointmentData: AppointmentRequest, supabase: any) {
  try {
    console.log('🗓️ Criando evento no Google Calendar...');
    
    // Chamar a função Google Service Auth para obter token
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('google-service-auth', {
      body: { action: 'get-access-token' }
    });

    if (tokenError || !tokenData.access_token) {
      throw new Error('Falha ao obter token do Google Calendar');
    }

    const startDateTime = createDateTime(appointmentData.date, appointmentData.startTime);
    const endDateTime = createDateTime(appointmentData.date, appointmentData.endTime);

    // Criar evento no Google Calendar SEM attendees para evitar erro 403
    const eventData = {
      summary: appointmentData.title,
      description: appointmentData.description || `Agendamento via WhatsApp`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      location: appointmentData.location || 'Clínica'
      // Removido attendees para evitar erro 403
    };

    console.log('📅 Dados do evento:', eventData);

    const calendarId = 'fb2b1dfb1e6c600594b05785de5cf04fb38bd0376bd3f5e5d1c08c60d4c894df@group.calendar.google.com';

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro na API do Google Calendar:', errorData);
      throw new Error(`Falha ao criar evento no Google Calendar: ${response.status}`);
    }

    const createdEvent = await response.json();
    console.log('✅ Evento criado no Google Calendar:', createdEvent.id);
    
    return createdEvent;
  } catch (error) {
    console.error('❌ Erro ao criar evento no Google Calendar:', error);
    throw error;
  }
}
