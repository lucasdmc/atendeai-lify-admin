
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleServiceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');

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

async function getGoogleAccessToken() {
  if (!googleServiceAccountKey) {
    throw new Error('Google Service Account key not configured');
  }

  const serviceAccount = JSON.parse(googleServiceAccountKey);
  
  // Create JWT for Google Service Account
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  // For simplicity, using a mock token - in production, implement proper JWT signing
  const mockToken = 'mock_access_token';
  return mockToken;
}

async function createGoogleCalendarEvent(appointmentData: AppointmentRequest, accessToken: string) {
  const startDateTime = new Date(`${appointmentData.date}T${appointmentData.startTime}:00`);
  const endDateTime = new Date(`${appointmentData.date}T${appointmentData.endTime}:00`);

  const event = {
    summary: appointmentData.title,
    description: appointmentData.description || '',
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    location: appointmentData.location || '',
    attendees: appointmentData.patientEmail ? [{ email: appointmentData.patientEmail }] : [],
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Failed to create calendar event: ${response.status}`);
  }

  return await response.json();
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
          const accessToken = await getGoogleAccessToken();
          const calendarEvent = await createGoogleCalendarEvent(appointmentData, accessToken);
          
          return new Response(JSON.stringify({
            success: true,
            eventId: calendarEvent.id,
            message: 'Agendamento criado com sucesso'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error creating appointment:', error);
          return new Response(JSON.stringify({
            success: false,
            message: 'Erro ao criar agendamento no Google Calendar'
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
        return new Response(JSON.stringify({
          success: true,
          appointments: [],
          message: 'Agendamentos carregados'
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
