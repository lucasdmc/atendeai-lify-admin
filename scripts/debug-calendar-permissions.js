import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2OTcyOTAsImV4cCI6MjA1MTI3NDg5MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugCalendarPermissions() {
  console.log('🔍 Debugando permissões do calendário problemático...');

  try {
    // 1. Verificar se há algum problema com o calendário no banco
    const calendarId = 'fb2b1dfb1e6c600594b05785de5cf04fb38bd0376bd3f5e5d1c08c60d4c894df@group.calendar.google.com';
    
    console.log('📋 Verificando calendário no banco:', calendarId);
    
    const { data: calendars, error: calendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('google_calendar_id', calendarId);

    if (calendarsError) {
      console.log('❌ Erro ao buscar calendários:', calendarsError);
      return;
    }

    console.log('📊 Calendários encontrados:', calendars?.length || 0);
    
    if (calendars && calendars.length > 0) {
      calendars.forEach((cal, index) => {
        console.log(`📅 Calendário ${index + 1}:`, {
          id: cal.id,
          user_id: cal.user_id,
          calendar_name: cal.calendar_name,
          google_calendar_id: cal.google_calendar_id,
          expires_at: cal.expires_at,
          access_token_length: cal.access_token?.length || 0,
          created_at: cal.created_at
        });
      });
    } else {
      console.log('ℹ️ Nenhum calendário encontrado com esse ID');
    }

    // 2. Verificar se há logs de sincronização para este calendário
    console.log('📝 Verificando logs de sincronização...');
    
    const { data: syncLogs, error: syncError } = await supabase
      .from('calendar_sync_logs')
      .select('*')
      .in('user_calendar_id', calendars?.map(c => c.id) || []);

    if (syncError) {
      console.log('❌ Erro ao buscar logs de sincronização:', syncError);
    } else {
      console.log('📊 Logs de sincronização encontrados:', syncLogs?.length || 0);
      
      if (syncLogs && syncLogs.length > 0) {
        syncLogs.forEach((log, index) => {
          console.log(`📋 Log ${index + 1}:`, {
            id: log.id,
            user_calendar_id: log.user_calendar_id,
            sync_type: log.sync_type,
            event_id: log.event_id,
            status: log.status,
            created_at: log.created_at
          });
        });
      }
    }

    // 3. Verificar se há tokens para este usuário
    console.log('🔑 Verificando tokens...');
    
    const { data: tokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*');

    if (tokensError) {
      console.log('❌ Erro ao buscar tokens:', tokensError);
    } else {
      console.log('📊 Tokens encontrados:', tokens?.length || 0);
      
      if (tokens && tokens.length > 0) {
        tokens.forEach((token, index) => {
          console.log(`🔑 Token ${index + 1}:`, {
            id: token.id,
            user_id: token.user_id,
            expires_at: token.expires_at,
            scope: token.scope,
            created_at: token.created_at
          });
        });
      }
    }

    // 4. Verificar se o calendário é um calendário de grupo
    if (calendarId.includes('@group.calendar.google.com')) {
      console.log('⚠️ ATENÇÃO: Este é um calendário de grupo!');
      console.log('📋 Calendários de grupo podem ter restrições de permissão específicas.');
      console.log('💡 Sugestões:');
      console.log('   - Verifique se você tem permissão de "Ver eventos" no calendário');
      console.log('   - Tente reconectar o calendário');
      console.log('   - Considere usar um calendário pessoal em vez de um de grupo');
    }

    // 5. Verificar se há problemas de timezone
    console.log('🌍 Verificando configurações de timezone...');
    
    const now = new Date();
    console.log('🕐 Hora atual (local):', now.toISOString());
    console.log('🕐 Hora atual (UTC):', now.toUTCString());
    console.log('🕐 Timezone offset:', now.getTimezoneOffset());

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugCalendarPermissions(); 