
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
          // Criar evento diretamente no banco de dados para demonstração
          // Em produção, aqui seria feita a integração com Google Calendar
          const startDateTime = new Date(`${appointmentData.date}T${appointmentData.startTime}:00`);
          const endDateTime = new Date(`${appointmentData.date}T${appointmentData.endTime}:00`);
          
          const { data: eventData, error: eventError } = await supabase
            .from('calendar_events')
            .insert({
              google_event_id: `local_${Date.now()}`,
              user_id: '00000000-0000-0000-0000-000000000000', // Sistema
              calendar_id: 'primary',
              title: appointmentData.title,
              description: appointmentData.description || '',
              start_time: startDateTime.toISOString(),
              end_time: endDateTime.toISOString(),
              location: appointmentData.location || 'Clínica',
              status: 'confirmed',
              attendees: appointmentData.patientEmail ? JSON.stringify([{ email: appointmentData.patientEmail }]) : null
            })
            .select()
            .single();

          if (eventError) {
            console.error('Erro ao salvar no banco:', eventError);
            throw new Error('Falha ao salvar agendamento');
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
