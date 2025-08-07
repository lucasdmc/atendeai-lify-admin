import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addClinicIdToConversations() {
  console.log('🔧 Adicionando campo clinic_id à tabela whatsapp_conversations...\n');

  try {
    // 1. Adicionar campo clinic_id
    console.log('1️⃣ Adicionando campo clinic_id...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE public.whatsapp_conversations 
        ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
      `
    });

    if (alterError) {
      console.error('❌ Erro ao adicionar campo clinic_id:', alterError);
      return;
    }

    console.log('✅ Campo clinic_id adicionado com sucesso!');

    // 2. Criar índice
    console.log('\n2️⃣ Criando índice...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic_id 
        ON public.whatsapp_conversations(clinic_id);
      `
    });

    if (indexError) {
      console.error('❌ Erro ao criar índice:', indexError);
    } else {
      console.log('✅ Índice criado com sucesso!');
    }

    // 3. Verificar se o campo foi adicionado
    console.log('\n3️⃣ Verificando campo adicionado...');
    const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'whatsapp_conversations' 
          AND column_name = 'clinic_id';
      `
    });

    if (checkError) {
      console.error('❌ Erro ao verificar campo:', checkError);
    } else {
      console.log('✅ Campo clinic_id verificado:', columns);
    }

    // 4. Verificar conversas existentes
    console.log('\n4️⃣ Verificando conversas existentes...');
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id, phone_number, name, clinic_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (convError) {
      console.error('❌ Erro ao verificar conversas:', convError);
    } else {
      console.log(`✅ Conversas encontradas: ${conversations?.length || 0}`);
      conversations?.forEach(conv => {
        console.log(`   - ${conv.phone_number} (${conv.name}) → clinic_id: ${conv.clinic_id || 'NULL'}`);
      });
    }

    console.log('\n🎉 Campo clinic_id adicionado com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
addClinicIdToConversations(); 