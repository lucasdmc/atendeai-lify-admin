import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2OTcyOTAsImV4cCI6MjA1MTI3NDg5MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCalendarError() {
  console.log('🧪 Testando erro do calendário problemático...');

  try {
    // 1. Primeiro, vamos verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Usuário não autenticado:', authError);
      return;
    }

    console.log('✅ Usuário autenticado:', user.id);

    // 2. Verificar se o calendário existe no banco
    const calendarId = 'fb2b1dfb1e6c600594b05785de5cf04fb38bd0376bd3f5e5d1c08c60d4c894df@group.calendar.google.com';
    
    console.log('🔍 Verificando calendário no banco:', calendarId);
    
    const { data: userCalendar, error: calendarError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', user.id)
      .eq('google_calendar_id', calendarId)
      .single();

    if (calendarError) {
      console.log('❌ Erro ao buscar calendário:', calendarError);
      return;
    }

    if (!userCalendar) {
      console.log('❌ Calendário não encontrado no banco');
      return;
    }

    console.log('✅ Calendário encontrado:', {
      id: userCalendar.id,
      name: userCalendar.calendar_name,
      expires_at: userCalendar.expires_at,
      access_token_length: userCalendar.access_token?.length || 0
    });

    // 3. Verificar se o token não expirou
    const now = new Date();
    const expiresAt = new Date(userCalendar.expires_at);
    
    if (expiresAt <= now) {
      console.log('❌ Token expirado:', {
        now: now.toISOString(),
        expires_at: expiresAt.toISOString()
      });
      return;
    }

    console.log('✅ Token válido');

    // 4. Testar a Edge Function diretamente
    console.log('🚀 Testando Edge Function...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch('https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/calendar-manager', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        action: 'list-events',
        calendarId: calendarId,
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias à frente
        forceRefresh: true
      })
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📊 Corpo da resposta:', responseText);

    if (!response.ok) {
      console.log('❌ Edge Function retornou erro:', response.status, response.statusText);
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('❌ Detalhes do erro:', errorData);
      } catch (parseError) {
        console.log('❌ Erro não é JSON válido');
      }
    } else {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Edge Function funcionou:', {
          success: data.success,
          eventsCount: data.events?.length || 0
        });
      } catch (parseError) {
        console.log('❌ Resposta não é JSON válido');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCalendarError(); 