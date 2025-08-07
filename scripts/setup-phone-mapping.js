import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPhoneMapping() {
  console.log('🔧 CONFIGURANDO MAPEAMENTO PHONE NUMBER ID');
  console.log('==========================================');

  try {
    // 1. Criar tabela via SQL direto
    console.log('\n1️⃣ Criando tabela whatsapp_phone_mappings...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS whatsapp_phone_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number_id VARCHAR(50) NOT NULL UNIQUE,
        whatsapp_number VARCHAR(20) NOT NULL,
        display_phone_number VARCHAR(20),
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;

    // Como não temos exec_sql, vamos tentar inserir diretamente
    console.log('📝 Tentando inserir mapeamento...');
    
    const { error: insertError } = await supabase
      .from('whatsapp_phone_mappings')
      .upsert({
        phone_number_id: '698766983327246',
        whatsapp_number: '554730915628',
        display_phone_number: '554730915628',
        clinic_id: '4a73f615-b636-4134-8937-c20b5db5acac',
        is_active: true
      }, {
        onConflict: 'phone_number_id'
      });

    if (insertError) {
      console.log('⚠️ Erro ao inserir (tabela pode não existir):', insertError.message);
      
      // Tentar criar a tabela primeiro
      console.log('🔧 Tentando criar tabela via RPC...');
      const { error: rpcError } = await supabase.rpc('create_whatsapp_phone_mappings_table');
      
      if (rpcError) {
        console.log('⚠️ RPC não disponível, tentando inserção direta...');
        
        // Última tentativa: inserir na tabela clinic_whatsapp_numbers com o número real
        console.log('🔄 Configurando número real na tabela clinic_whatsapp_numbers...');
        
        const { error: clinicError } = await supabase
          .from('clinic_whatsapp_numbers')
          .upsert({
            clinic_id: '4a73f615-b636-4134-8937-c20b5db5acac',
            whatsapp_number: '554730915628',
            is_active: true,
            activated_at: new Date().toISOString()
          }, {
            onConflict: 'clinic_id,whatsapp_number'
          });

        if (clinicError) {
          console.error('❌ Erro ao configurar número da clínica:', clinicError);
        } else {
          console.log('✅ Número configurado na tabela clinic_whatsapp_numbers');
        }
      }
    } else {
      console.log('✅ Mapeamento criado com sucesso');
    }

    // 2. Verificar configuração atual
    console.log('\n2️⃣ Verificando configuração atual...');
    
    // Verificar se existe algum mapeamento
    const { data: mappings, error: mappingsError } = await supabase
      .from('whatsapp_phone_mappings')
      .select('*');

    if (mappingsError) {
      console.log('⚠️ Tabela whatsapp_phone_mappings não existe ainda');
    } else {
      console.log(`✅ Mapeamentos encontrados: ${mappings?.length || 0}`);
      mappings?.forEach(mapping => {
        console.log(`   - Phone ID: ${mapping.phone_number_id} -> Número: ${mapping.whatsapp_number}`);
      });
    }

    // Verificar clinic_whatsapp_numbers
    const { data: clinicNumbers, error: clinicNumbersError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('*');

    if (clinicNumbersError) {
      console.error('❌ Erro ao verificar clinic_whatsapp_numbers:', clinicNumbersError);
    } else {
      console.log(`✅ Números de clínica configurados: ${clinicNumbers?.length || 0}`);
      clinicNumbers?.forEach(number => {
        console.log(`   - Clínica: ${number.clinic_id} | Número: ${number.whatsapp_number} | Ativo: ${number.is_active}`);
      });
    }

    console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA!');
    console.log('============================');

  } catch (error) {
    console.error('❌ Erro durante configuração:', error);
  }
}

setupPhoneMapping(); 