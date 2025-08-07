import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClinicsStructure() {
  console.log('🔍 Verificando estrutura da tabela clinics...\n');

  try {
    // 1. Buscar todas as clínicas
    console.log('1️⃣ Buscando clínicas...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .limit(5);

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Clínicas encontradas: ${clinics?.length || 0}`);
    
    if (clinics && clinics.length > 0) {
      console.log('\n📋 Estrutura da primeira clínica:');
      const firstClinic = clinics[0];
      Object.keys(firstClinic).forEach(key => {
        console.log(`   - ${key}: ${typeof firstClinic[key]} = ${firstClinic[key]}`);
      });
    }

    // 2. Verificar campos específicos
    console.log('\n2️⃣ Verificando campos específicos...');
    
    const fieldsToCheck = [
      'whatsapp_phone_number',
      'whatsapp_phone',
      'phone',
      'phone_number',
      'whatsapp_number'
    ];

    for (const field of fieldsToCheck) {
      try {
        const { data, error } = await supabase
          .from('clinics')
          .select(field)
          .limit(1);
        
        if (error) {
          console.log(`❌ Campo '${field}' não existe`);
        } else {
          console.log(`✅ Campo '${field}' existe`);
        }
      } catch (e) {
        console.log(`❌ Campo '${field}' não existe`);
      }
    }

    // 3. Buscar conversas para ver se há dados
    console.log('\n3️⃣ Verificando conversas...');
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .limit(10);

    if (convError) {
      console.error('❌ Erro ao buscar conversas:', convError);
    } else {
      console.log(`✅ Conversas encontradas: ${conversations?.length || 0}`);
      if (conversations && conversations.length > 0) {
        console.log('\n📋 Estrutura da primeira conversa:');
        const firstConv = conversations[0];
        Object.keys(firstConv).forEach(key => {
          console.log(`   - ${key}: ${typeof firstConv[key]} = ${firstConv[key]}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
checkClinicsStructure(); 