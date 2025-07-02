import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY5NzI5MCwiZXhwIjoyMDUxMjc0ODkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCalendarDisconnect() {
  console.log('🧪 Testando desconexão de calendários...');

  try {
    // Vamos tentar uma abordagem direta
    console.log('🔄 Tentando desconexão direta...');
    
    const userId = '5cd566ec-0064-4c9f-946b-182deaf204d4';
    
    // Primeiro buscar os IDs dos calendários
    console.log('🔍 Buscando IDs dos calendários...');
    const { data: calendarIds, error: fetchError } = await supabase
      .from('user_calendars')
      .select('id')
      .eq('user_id', userId);

    if (fetchError) {
      console.log('❌ Erro ao buscar calendários:', fetchError);
      return;
    }

    if (!calendarIds || calendarIds.length === 0) {
      console.log('ℹ️ Nenhum calendário encontrado para deletar');
      return;
    }

    const ids = calendarIds.map(c => c.id);
    console.log('📋 IDs dos calendários:', ids);

    // Primeiro deletar os logs de sincronização
    console.log('📝 Deletando logs de sincronização...');
    const { error: logsError } = await supabase
      .from('calendar_sync_logs')
      .delete()
      .in('user_calendar_id', ids);

    if (logsError) {
      console.log('❌ Erro ao deletar logs:', logsError);
    } else {
      console.log('✅ Logs deletados com sucesso');
      
      // Depois deletar os calendários
      console.log('📅 Deletando calendários...');
      const { error: calendarsError } = await supabase
        .from('user_calendars')
        .delete()
        .eq('user_id', userId);

      if (calendarsError) {
        console.log('❌ Erro ao deletar calendários:', calendarsError);
      } else {
        console.log('✅ Calendários deletados com sucesso');
        
        // Por fim deletar os tokens
        console.log('🔑 Deletando tokens...');
        const { error: tokensError } = await supabase
          .from('google_calendar_tokens')
          .delete()
          .eq('user_id', userId);

        if (tokensError) {
          console.log('❌ Erro ao deletar tokens:', tokensError);
        } else {
          console.log('✅ Tokens deletados com sucesso');
          console.log('🎉 Desconexão completa realizada com sucesso!');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCalendarDisconnect(); 