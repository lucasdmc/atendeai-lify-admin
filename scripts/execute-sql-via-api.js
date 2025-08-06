import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLViaAPI() {
  console.log('🔧 Executando SQL via API do Supabase...\n');

  try {
    // 1. Primeiro, vamos verificar se o campo clinic_id já existe
    console.log('1️⃣ Verificando se o campo clinic_id já existe...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('whatsapp_conversations')
        .select('clinic_id')
        .limit(1);

      if (testError && testError.code === '42703') {
        console.log('❌ Campo clinic_id não existe - precisa ser criado');
        console.log('💡 Infelizmente, não é possível adicionar colunas via API REST');
        console.log('✅ Execute o SQL manualmente no Supabase Dashboard:');
        console.log('');
        console.log('ALTER TABLE public.whatsapp_conversations');
        console.log('ADD COLUMN clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;');
        console.log('');
        console.log('CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic_id');
        console.log('ON public.whatsapp_conversations(clinic_id);');
        console.log('');
        console.log('🔗 Link: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi/sql');
        return;
      } else if (testError) {
        console.error('❌ Erro ao verificar campo:', testError);
        return;
      } else {
        console.log('✅ Campo clinic_id já existe!');
      }
    } catch (error) {
      console.log('❌ Campo clinic_id não existe');
      console.log('💡 Execute o SQL manualmente no Supabase Dashboard');
      return;
    }

    // 2. Verificar conversas existentes
    console.log('\n2️⃣ Verificando conversas existentes...');
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id, phone_number, name, clinic_id')
      .limit(10);

    if (convError) {
      console.error('❌ Erro ao buscar conversas:', convError);
      return;
    }

    console.log(`✅ Conversas encontradas: ${conversations?.length || 0}`);
    conversations?.forEach(conv => {
      console.log(`   - ${conv.phone_number} (${conv.name}) - Clínica: ${conv.clinic_id || 'Nenhuma'}`);
    });

    // 3. Verificar clínicas disponíveis
    console.log('\n3️⃣ Verificando clínicas disponíveis...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Clínicas encontradas: ${clinics?.length || 0}`);
    clinics?.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.id})`);
    });

    console.log('\n✅ Campo clinic_id está pronto para uso!');
    console.log('💡 Execute o script associate-conversations-to-clinics.js para associar conversas');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

executeSQLViaAPI(); 