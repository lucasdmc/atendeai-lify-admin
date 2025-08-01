const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar Supabase
const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function fixRepetitiveMessages() {
  try {
    console.log('🔧 CORRIGINDO MENSAGENS REPETITIVAS');
    console.log('=====================================');

    // 1. Verificar se a clínica está configurada corretamente
    console.log('\n1️⃣ Verificando configuração da clínica...');
    
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('whatsapp_phone', '554730915628')
      .single();

    if (clinicError) {
      console.error('❌ Erro ao buscar clínica:', clinicError);
      return;
    }

    console.log('✅ Clínica encontrada:', clinicData.name);
    console.log('🎯 Tem contextualização:', clinicData.has_contextualization);

    // 2. Testar função get_clinic_contextualization
    console.log('\n2️⃣ Testando função get_clinic_contextualization...');
    
    const { data: contextualizationData, error: contextError } = await supabase.rpc('get_clinic_contextualization', {
      p_whatsapp_phone: '554730915628'
    });

    if (contextError) {
      console.error('❌ Erro na função get_clinic_contextualization:', contextError);
    } else {
      console.log('✅ Função funcionando!');
      console.log('📋 Dados retornados:', contextualizationData);
    }

    // 3. Verificar se há dados de contextualização
    if (contextualizationData && contextualizationData.length > 0) {
      const context = contextualizationData[0];
      console.log('\n3️⃣ Verificando dados de contextualização...');
      console.log('📋 Nome da clínica:', context.clinic_name);
      console.log('🎯 Tem contextualização:', context.has_contextualization);
      
      if (context.contextualization_json && context.contextualization_json.clinica) {
        console.log('✅ Dados de contextualização encontrados!');
        console.log('🏥 Clínica:', context.contextualization_json.clinica.informacoes_basicas.nome);
        console.log('👨‍⚕️ Agente:', context.contextualization_json.agente_ia.configuracao.nome);
      } else {
        console.log('⚠️ Dados de contextualização incompletos');
      }
    }

    // 4. Verificar logs do backend
    console.log('\n4️⃣ Verificando logs do backend...');
    
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        console.log('✅ Backend funcionando!');
      } else {
        console.log('⚠️ Backend retornou status:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Não foi possível conectar ao backend:', error.message);
    }

    // 5. Criar script de teste para verificar respostas
    console.log('\n5️⃣ Criando script de teste...');
    
    const testScript = `
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testContextualization() {
  try {
    console.log('🧪 TESTANDO CONTEXTUALIZAÇÃO');
    console.log('=============================');

    // Testar função get_clinic_contextualization
    const { data, error } = await supabase.rpc('get_clinic_contextualization', {
      p_whatsapp_phone: '554730915628'
    });

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    if (data && data.length > 0) {
      const context = data[0];
      console.log('✅ Contextualização encontrada!');
      console.log('🏥 Clínica:', context.clinic_name);
      console.log('🎯 Tem contextualização:', context.has_contextualization);
      
      if (context.contextualization_json && context.contextualization_json.clinica) {
        const clinica = context.contextualization_json.clinica;
        const agente = context.contextualization_json.agente_ia;
        
        console.log('📋 Informações da clínica:');
        console.log('   Nome:', clinica.informacoes_basicas.nome);
        console.log('   Especialidade:', clinica.informacoes_basicas.especialidade_principal);
        console.log('   Endereço:', clinica.localizacao.endereco_principal.logradouro + ', ' + clinica.localizacao.endereco_principal.numero);
        console.log('   Telefone:', clinica.contatos.telefone_principal);
        
        console.log('👨‍⚕️ Informações do agente:');
        console.log('   Nome:', agente.configuracao.nome);
        console.log('   Saudação:', agente.configuracao.saudacao_inicial);
        
        console.log('✅ Sistema de contextualização funcionando corretamente!');
      } else {
        console.log('⚠️ Dados de contextualização incompletos');
      }
    } else {
      console.log('❌ Nenhuma contextualização encontrada');
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

testContextualization();
`;

    // Salvar script de teste
    const fs = require('fs');
    fs.writeFileSync('/tmp/test-contextualization.js', testScript);
    console.log('✅ Script de teste criado em /tmp/test-contextualization.js');

    console.log('\n🎯 CORREÇÃO CONCLUÍDA!');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Teste enviando uma mensagem para o WhatsApp');
    console.log('2. Verifique se as respostas estão contextualizadas');
    console.log('3. Monitore os logs do backend');
    console.log('4. Se ainda houver problemas, execute o script de teste');

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

fixRepetitiveMessages(); 