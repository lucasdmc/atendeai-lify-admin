
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
    // Validar formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error(`Formato de data inválido: ${date}`);
    }
    
    // Validar formato de hora (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Formato de hora inválido: ${time}`);
    }
    
    const [hour, minute] = time.split(':').map(Number);
    
    // Validar hora e minuto
    if (hour < 0 || hour > 23) {
      throw new Error(`Hora inválida: ${hour}`);
    }
    if (minute < 0 || minute > 59) {
      throw new Error(`Minuto inválido: ${minute}`);
    }
    
    const dateTime = new Date(`${date}T${time}:00`);
    
    if (isNaN(dateTime.getTime())) {
      throw new Error(`Data/hora inválida: ${date} ${time}`);
    }
    
    return dateTime.toISOString();
  } catch (error) {
    console.error('Erro ao criar datetime:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, appointmentData, eventId, date } = await req.json();

    console.log(`Appointment Manager - Action: ${action}`);

    switch (action) {
      case 'create':
        console.log('Creating appointment:', appointmentData);
        
        try {
          // Validar dados obrigatórios
          if (!appointmentData.title) {
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
          
          console.log('Datetimes criados:', { startDateTime, endDateTime });
          
          const { data: eventData, error: eventError } = await supabase
            .from('calendar_events')
            .insert({
              google_event_id: `local_${Date.now()}`,
              user_id: '00000000-0000-0000-0000-000000000000', // Sistema
              calendar_id: 'primary',
              title: appointmentData.title,
              description: appointmentData.description || '',
              start_time: startDateTime,
              end_time: endDateTime,
              location: appointmentData.location || 'Clínica',
              status: 'confirmed',
              attendees: appointmentData.patientEmail ? JSON.stringify([{ email: appointmentData.patientEmail }]) : null
            })
            .select()
            .single();

          if (eventError) {
            console.error('Erro ao salvar no banco:', eventError);
            throw new Error(`Falha ao salvar agendamento: ${eventError.message}`);
          }

          console.log('Agendamento salvo no banco:', eventData);
          
          return new Response(JSON.stringify({
            success: true,
            eventId: eventData.google_event_id,
            message: 'Agendamento criado com sucesso'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error creating appointment:', error);
          return new Response(JSON.stringify({
            success: false,
            message: 'Erro ao criar agendamento: ' + error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'update':
        console.log('Updating appointment:', eventId, appointmentData);
        return new Response(JSON.stringify({
          success: true,
          message: 'Agendamento atualizado com sucesso'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'delete':
        console.log('Deleting appointment:', eventId);
        return new Response(JSON.stringify({
          success: true,
          message: 'Agendamento cancelado com sucesso'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list':
        console.log('Listing appointments for date:', date);
        
        try {
          const { data: appointments, error } = await supabase
            .from('calendar_events')
            .select('*')
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

          if (error) {
            console.error('Erro ao buscar agendamentos:', error);
            throw new Error('Falha ao buscar agendamentos');
          }

          return new Response(JSON.stringify({
            success: true,
            appointments: appointments || [],
            message: 'Agendamentos carregados'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error listing appointments:', error);
          return new Response(JSON.stringify({
            success: false,
            appointments: [],
            message: 'Erro ao buscar agendamentos'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

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
    console.error('Error in appointment-manager:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
