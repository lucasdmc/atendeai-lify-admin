
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

export async function getSystemUserId(supabase: any): Promise<string> {
  try {
    // Buscar um admin user para usar como sistema
    const { data: adminUser, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (error || !adminUser) {
      console.log('⚠️ Nenhum usuário admin encontrado, criando entrada do sistema');
      // Se não houver admin, usar o primeiro usuário disponível
      const { data: firstUser } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)
        .single();
      
      if (firstUser) {
        return firstUser.id;
      } else {
        throw new Error('Nenhum usuário encontrado no sistema');
      }
    }

    return adminUser.id;
  } catch (error) {
    console.error('❌ Erro ao obter ID do usuário do sistema:', error);
    throw error;
  }
}

export async function saveAppointmentToDatabase(
  appointmentData: AppointmentRequest,
  googleEventId: string,
  systemUserId: string,
  supabase: any
) {
  try {
    const startDateTime = createDateTime(appointmentData.date, appointmentData.startTime);
    const endDateTime = createDateTime(appointmentData.date, appointmentData.endTime);

    // Inserir no banco de dados
    const { data: eventData, error: eventError } = await supabase
      .from('calendar_events')
      .insert({
        google_event_id: googleEventId,
        user_id: systemUserId,
        calendar_id: 'primary',
        title: appointmentData.title.trim(),
        description: appointmentData.description || 'Agendamento via WhatsApp',
        start_time: startDateTime,
        end_time: endDateTime,
        location: appointmentData.location || 'Clínica',
        status: 'confirmed',
        attendees: appointmentData.patientEmail ? JSON.stringify([{ email: appointmentData.patientEmail }]) : null
      })
      .select()
      .single();

    if (eventError) {
      console.error('❌ Erro ao salvar no banco:', eventError);
      throw new Error(`Falha ao salvar agendamento: ${eventError.message}`);
    }

    console.log('✅ Agendamento salvo no banco:', eventData);
    return eventData;
  } catch (error) {
    console.error('❌ Erro ao salvar agendamento no banco:', error);
    throw error;
  }
}

export async function listAppointmentsFromDatabase(supabase: any) {
  try {
    const { data: appointments, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      throw new Error('Falha ao buscar agendamentos');
    }

    console.log(`✅ ${appointments?.length || 0} agendamentos encontrados`);
    return appointments || [];
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    throw error;
  }
}
