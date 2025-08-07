// ========================================
// TESTE DE SUBMISSÃO DO FORMULÁRIO
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

async function testFormSubmission() {
  try {
    console.log('🚀 Testando submissão do formulário...');

    // Simular dados do formulário
    const formData = {
      name: 'Clínica Teste Formulário',
      whatsapp_phone: '554730915628',
      contextualization_json: {
        clinica: {
          informacoes_basicas: {
            nome: 'Clínica Teste Formulário',
            especialidade_principal: 'Cardiologia'
          }
        }
      },
      has_contextualization: true,
      simulation_mode: true
    };

    console.log('📝 Dados do formulário:', formData);

    // Testar criação
    console.log('🔄 Testando criação...');
    const { data: createData, error: createError } = await supabase
      .from('clinics')
      .insert([formData])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro na criação:', createError);
      return;
    }

    console.log('✅ Clínica criada:', createData.id);

    // Testar atualização
    console.log('🔄 Testando atualização...');
    const updateData = {
      ...formData,
      name: 'Clínica Teste Atualizada',
      simulation_mode: false
    };

    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update(updateData)
      .eq('id', createData.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro na atualização:', updateError);
    } else {
      console.log('✅ Clínica atualizada:', updateResult.name);
      console.log('✅ simulation_mode:', updateResult.simulation_mode);
    }

    // Verificar se todos os campos foram salvos
    console.log('🔍 Verificando campos salvos:');
    console.log('- name:', updateResult.name);
    console.log('- whatsapp_phone:', updateResult.whatsapp_phone);
    console.log('- contextualization_json:', updateResult.contextualization_json);
    console.log('- has_contextualization:', updateResult.has_contextualization);
    console.log('- simulation_mode:', updateResult.simulation_mode);

    // Limpar dados de teste
    const { error: deleteError } = await supabase
      .from('clinics')
      .delete()
      .eq('id', createData.id);

    if (deleteError) {
      console.error('⚠️  Erro ao limpar dados de teste:', deleteError);
    } else {
      console.log('🧹 Dados de teste removidos');
    }

    console.log('✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testFormSubmission(); 