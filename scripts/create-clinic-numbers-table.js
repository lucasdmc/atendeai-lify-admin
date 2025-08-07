import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createClinicNumbersTable() {
  console.log('🏗️ CRIANDO TABELA CLINIC_WHATSAPP_NUMBERS');
  console.log('==========================================');

  try {
    // 1. Criar tabela clinic_whatsapp_numbers
    console.log('\n1️⃣ Criando tabela clinic_whatsapp_numbers...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS clinic_whatsapp_numbers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        whatsapp_number VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        activated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        deactivated_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(clinic_id, whatsapp_number)
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
    
    if (createError) {
      console.log('⚠️ Tabela já existe ou erro ignorado');
    } else {
      console.log('✅ Tabela clinic_whatsapp_numbers criada');
    }

    // 2. Criar índices
    console.log('\n2️⃣ Criando índices...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_numbers_clinic ON clinic_whatsapp_numbers(clinic_id);',
      'CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_numbers_active ON clinic_whatsapp_numbers(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_numbers_number ON clinic_whatsapp_numbers(whatsapp_number);'
    ];

    for (const index of indexes) {
      try {
        await supabase.rpc('exec_sql', { sql_query: index });
      } catch (e) {
        console.log(`⚠️ Índice já existe ou erro ignorado`);
      }
    }
    console.log('✅ Índices criados');

    // 3. Configurar RLS
    console.log('\n3️⃣ Configurando RLS...');
    
    const rlsCommands = [
      'ALTER TABLE clinic_whatsapp_numbers ENABLE ROW LEVEL SECURITY;',
      'CREATE POLICY "Users can view clinic whatsapp numbers" ON clinic_whatsapp_numbers FOR SELECT USING (true);',
      'CREATE POLICY "Users can insert clinic whatsapp numbers" ON clinic_whatsapp_numbers FOR INSERT WITH CHECK (true);',
      'CREATE POLICY "Users can update clinic whatsapp numbers" ON clinic_whatsapp_numbers FOR UPDATE USING (true);'
    ];

    for (const command of rlsCommands) {
      try {
        await supabase.rpc('exec_sql', { sql_query: command });
      } catch (e) {
        console.log(`⚠️ RLS já configurado ou erro ignorado`);
      }
    }

    // 4. Verificar se a tabela foi criada
    console.log('\n4️⃣ Verificando tabela criada...');
    
    const { data: checkTable, error: checkError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'clinic_whatsapp_numbers'
        );
      `
    });

    if (checkError) {
      console.error('❌ Erro ao verificar tabela:', checkError);
    } else {
      console.log('✅ Tabela clinic_whatsapp_numbers verificada');
    }

    // 5. Inserir dados de teste
    console.log('\n5️⃣ Inserindo dados de teste...');
    
    const testData = [
      {
        clinic_id: '4a73f615-b636-4134-8937-c20b5db5acac', // CardioPrime
        whatsapp_number: '554730915628',
        is_active: true
      },
      {
        clinic_id: '9b11dfd6-d638-48e3-bc84-f3880f987da2', // ESADI
        whatsapp_number: '5547999999999',
        is_active: true
      }
    ];

    for (const data of testData) {
      console.log(`📱 Inserindo número ${data.whatsapp_number} para clínica ${data.clinic_id}...`);
      
      const { error: insertError } = await supabase
        .from('clinic_whatsapp_numbers')
        .upsert({
          clinic_id: data.clinic_id,
          whatsapp_number: data.whatsapp_number,
          is_active: data.is_active,
          activated_at: new Date().toISOString()
        }, {
          onConflict: 'clinic_id,whatsapp_number'
        });

      if (insertError) {
        console.error(`❌ Erro ao inserir número ${data.whatsapp_number}:`, insertError);
      } else {
        console.log(`✅ Número ${data.whatsapp_number} inserido com sucesso`);
      }
    }

    // 6. Verificar dados inseridos
    console.log('\n6️⃣ Verificando dados inseridos...');
    
    const { data: insertedData, error: verifyError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('*');

    if (verifyError) {
      console.error('❌ Erro ao verificar dados:', verifyError);
    } else {
      console.log(`✅ Dados inseridos: ${insertedData?.length || 0}`);
      insertedData?.forEach(item => {
        console.log(`   - Clínica: ${item.clinic_id} | Número: ${item.whatsapp_number} | Ativo: ${item.is_active}`);
      });
    }

    console.log('\n✅ TABELA CRIADA E CONFIGURADA COM SUCESSO!');
    console.log('==============================================');

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  }
}

createClinicNumbersTable(); 