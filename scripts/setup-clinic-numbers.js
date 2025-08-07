import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupClinicNumbers() {
  console.log('🔧 CONFIGURANDO NÚMEROS DAS CLÍNICAS');
  console.log('======================================');

  try {
    // 1. Buscar clínicas existentes
    console.log('\n1️⃣ Buscando clínicas...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Encontradas ${clinics?.length || 0} clínicas`);

    // 2. Configurar números manualmente
    console.log('\n2️⃣ Configurando números...');
    
    const clinicNumbers = [
      {
        clinic_id: '4a73f615-b636-4134-8937-c20b5db5acac', // CardioPrime
        whatsapp_number: '554730915628',
        is_active: true
      }
      // Removido número de simulação 5547999999999
    ];

    for (const clinicNumber of clinicNumbers) {
      console.log(`\n📱 Configurando número ${clinicNumber.whatsapp_number} para clínica ${clinicNumber.clinic_id}...`);
      
      const { error: insertError } = await supabase
        .from('clinic_whatsapp_numbers')
        .upsert({
          clinic_id: clinicNumber.clinic_id,
          whatsapp_number: clinicNumber.whatsapp_number,
          is_active: clinicNumber.is_active,
          activated_at: new Date().toISOString()
        }, {
          onConflict: 'clinic_id,whatsapp_number'
        });

      if (insertError) {
        console.error(`❌ Erro ao inserir número ${clinicNumber.whatsapp_number}:`, insertError);
      } else {
        console.log(`✅ Número ${clinicNumber.whatsapp_number} configurado com sucesso`);
      }
    }

    // 3. Verificar números configurados
    console.log('\n3️⃣ Verificando números configurados...');
    const { data: configuredNumbers, error: checkError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('*');

    if (checkError) {
      console.error('❌ Erro ao verificar números:', checkError);
    } else {
      console.log(`✅ Números configurados: ${configuredNumbers?.length || 0}`);
      configuredNumbers?.forEach(number => {
        console.log(`   - Clínica: ${number.clinic_id} | Número: ${number.whatsapp_number} | Ativo: ${number.is_active}`);
      });
    }

    console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA!');
    console.log('============================');

  } catch (error) {
    console.error('❌ Erro durante configuração:', error);
  }
}

setupClinicNumbers(); 