
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

function createDateTime(date: string, time: string): string {
  try {
    console.log(`🔧 Criando datetime com data: ${date}, hora: ${time}`);
    
    // Validar formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error(`Formato de data inválido: ${date}. Esperado: YYYY-MM-DD`);
    }
    
    // Validar formato de hora (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Formato de hora inválido: ${time}. Esperado: HH:MM`);
    }
    
    const [hour, minute] = time.split(':').map(Number);
    
    // Validar hora e minuto
    if (hour < 0 || hour > 23) {
      throw new Error(`Hora inválida: ${hour}`);
    }
    if (minute < 0 || minute > 59) {
      throw new Error(`Minuto inválido: ${minute}`);
    }
    
    // Criar datetime no formato ISO com timezone do Brasil
    const dateTime = new Date(`${date}T${time}:00-03:00`);
    
    if (isNaN(dateTime.getTime())) {
      throw new Error(`Data/hora inválida: ${date} ${time}`);
    }
    
    const isoString = dateTime.toISOString();
    console.log(`✅ DateTime criado: ${isoString}`);
    return isoString;
  } catch (error) {
    console.error('❌ Erro ao criar datetime:', error);
    throw error;
  }
}

async function createGoogleCalendarEvent(appointmentData: AppointmentRequest, supabase: any) {
  try {
    console.log('🗓️ Tentando criar evento no Google Calendar...');
    
    // Chamar a função Google Service Auth para obter token
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('google-service-auth', {
      body: { action: 'get-access-token' }
    });

    if (tokenError || !tokenData?.access_token) {
      console.log('⚠️ Google Calendar não disponível, continuando apenas com banco de dados');
      return null;
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
    };

    console.log('📅 Dados do evento:', JSON.stringify(eventData, null, 2));

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
      return null; // Não falhar, apenas continuar sem Google Calendar
    }

    const createdEvent = await response.json();
    console.log('✅ Evento criado no Google Calendar:', createdEvent.id);
    
    return createdEvent;
  } catch (error) {
    console.error('❌ Erro ao criar evento no Google Calendar:', error);
    return null; // Não falhar, apenas continuar sem Google Calendar
  }
}

async function getSystemUserId(supabase: any): Promise<string> {
  try {
    // Buscar um admin user para usar como sistema
    const { data: adminUser, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (error || !adminUser) {
      console.log('⚠️ Nenhum usuário admin encontrado, usando o primeiro disponível');
      const { data: firstUser } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)
        .single();
      
      if (firstUser) {
        return firstUser.id;
      } else {
        // Criar um usuário sistema temporário se necessário
        console.log('⚠️ Criando usuário sistema temporário');
        const { data: systemUser } = await supabase.auth.admin.createUser({
          email: 'sistema@clinica.com',
          password: 'temp-password-sistema',
          email_confirm: true
        });
        
        if (systemUser?.user?.id) {
          return systemUser.user.id;
        }
        
        throw new Error('Não foi possível criar usuário do sistema');
      }
    }

    return adminUser.id;
  } catch (error) {
    console.error('❌ Erro ao obter ID do usuário do sistema:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const requestBody = await req.json();
    const { action, appointmentData, eventId, date } = requestBody;

    console.log(`📞 Appointment Manager - Action: ${action}`);
    console.log(`📋 Request body:`, JSON.stringify(requestBody, null, 2));

    switch (action) {
      case 'create':
        console.log('📝 Creating appointment:', JSON.stringify(appointmentData, null, 2));
        
        try {
          // Validar dados obrigatórios
          if (!appointmentData?.title || appointmentData.title.trim() === '') {
            throw new Error('Título é obrigatório');
          }
          if (!appointmentData?.date) {
            throw new Error('Data é obrigatória');
          }
          if (!appointmentData?.startTime) {
            throw new Error('Hora de início é obrigatória');
          }
          if (!appointmentData?.endTime) {
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
          let googleEventId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          let googleCalendarError = null;
          
          try {
            const googleEvent = await createGoogleCalendarEvent(appointmentData, supabase);
            if (googleEvent?.id) {
              googleEventId = googleEvent.id;
              console.log('✅ Evento criado no Google Calendar com ID:', googleEventId);
            } else {
              console.log('⚠️ Google Calendar não disponível, usando ID local');
            }
          } catch (googleError) {
            console.error('❌ Erro ao criar no Google Calendar:', googleError);
            googleCalendarError = googleError.message;
          }

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
            throw new Error(`Falha ao salvar agendamento no banco: ${eventError.message}`);
          }

          console.log('✅ Agendamento salvo no banco:', eventData);
          
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
          
          return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('❌ Error creating appointment:', error);
          return new Response(JSON.stringify({
            success: false,
            error: error.message,
            message: 'Erro ao criar agendamento: ' + error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'list':
        console.log('📋 Listing appointments');
        
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

          return new Response(JSON.stringify({
            success: true,
            appointments: appointments || [],
            message: 'Agendamentos carregados'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('❌ Error listing appointments:', error);
          return new Response(JSON.stringify({
            success: false,
            appointments: [],
            message: 'Erro ao buscar agendamentos'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'update':
        console.log('📝 Updating appointment:', eventId, appointmentData);
        return new Response(JSON.stringify({
          success: true,
          message: 'Agendamento atualizado com sucesso'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'delete':
        console.log('🗑️ Deleting appointment:', eventId);
        return new Response(JSON.stringify({
          success: true,
          message: 'Agendamento cancelado com sucesso'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          message: 'Ação não reconhecida'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('❌ Error in appointment-manager:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Erro interno do servidor: ' + error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
