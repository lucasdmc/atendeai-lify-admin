// ========================================
// TESTE DE SALVAMENTO DE CLÍNICAS
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClinicSave() {
  try {
    console.log('🚀 Testando salvamento de clínica...');

    // Dados de teste
    const testClinic = {
      name: 'Clínica Teste Simulação',
      whatsapp_phone: '554730915628',
      contextualization_json: {
        clinica: {
          informacoes_basicas: {
            nome: 'Clínica Teste',
            especialidade_principal: 'Cardiologia'
          }
        }
      },
      has_contextualization: true,
      simulation_mode: true
    };

    console.log('📝 Dados de teste:', testClinic);

    // Tentar criar clínica
    const { data, error } = await supabase
      .from('clinics')
      .insert([testClinic])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar clínica:', error);
      
      // Verificar estrutura da tabela
      console.log('🔍 Verificando estrutura da tabela clinics...');
      
      const { data: structureData, error: structureError } = await supabase
        .from('clinics')
        .select('*')
        .limit(1);

      if (structureError) {
        console.error('❌ Erro ao verificar estrutura:', structureError);
      } else {
        console.log('✅ Estrutura da tabela:', Object.keys(structureData[0] || {}));
      }
      
      return;
    }

    console.log('✅ Clínica criada com sucesso!');
    console.log('📊 Dados salvos:', data);

    // Verificar se os campos foram salvos corretamente
    console.log('🔍 Verificando campos salvos:');
    console.log('- name:', data.name);
    console.log('- whatsapp_phone:', data.whatsapp_phone);
    console.log('- contextualization_json:', data.contextualization_json);
    console.log('- has_contextualization:', data.has_contextualization);
    console.log('- simulation_mode:', data.simulation_mode);

    // Limpar dados de teste
    const { error: deleteError } = await supabase
      .from('clinics')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.error('⚠️  Erro ao limpar dados de teste:', deleteError);
    } else {
      console.log('🧹 Dados de teste removidos');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testClinicSave(); 