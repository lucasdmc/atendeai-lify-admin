import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLViaRPC() {
  console.log('🔧 Tentando executar SQL via RPC...\n');

  try {
    // Tentar executar SQL via RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE public.whatsapp_conversations 
        ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
      `
    });

    if (error) {
      console.log('❌ RPC não disponível ou não autorizado');
      console.log('💡 Execute o SQL manualmente no Supabase Dashboard:');
      console.log('');
      console.log('ALTER TABLE public.whatsapp_conversations');
      console.log('ADD COLUMN clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;');
      console.log('');
      console.log('CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic_id');
      console.log('ON public.whatsapp_conversations(clinic_id);');
      console.log('');
      console.log('🔗 Link: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi/sql');
      return;
    }

    console.log('✅ SQL executado com sucesso via RPC!');
    console.log('Data:', data);

  } catch (error) {
    console.error('❌ Erro ao executar SQL via RPC:', error);
    console.log('💡 Execute o SQL manualmente no Supabase Dashboard');
  }
}

executeSQLViaRPC(); 