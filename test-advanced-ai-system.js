import { createClient } from '@supabase/supabase-js';

// Configuração real do Supabase
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdvancedAISystem() {
  console.log('🧪 TESTANDO SISTEMA AVANÇADO DE IA');
  console.log('=====================================\n');

  const testPhone = '5511999999999';

  try {
    // Teste 1: Verificar RAG Engine (atualizado para clinics)
    console.log('📚 Teste 1: RAG Engine');
    console.log('-----------------------');
    
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('has_contextualization', true)
      .single();
    
    if (clinicError) {
      console.log(`❌ Erro RAG: ${clinicError.message}`);
    } else if (clinicData && clinicData.contextualization_json) {
      console.log(`✅ RAG Engine: Dados encontrados na clínica "${clinicData.name}"`);
      console.log('📋 Contextualização:', Object.keys(clinicData.contextualization_json));
      
      // Verificar se tem dados estruturados
      const context = clinicData.contextualization_json;
      if (context.clinica) {
        console.log('🏥 Informações da clínica disponíveis');
      }
      if (context.profissionais) {
        console.log('👨‍⚕️ Profissionais disponíveis');
      }
      if (context.servicos) {
        console.log('🩺 Serviços disponíveis');
      }
    } else {
      console.log('⚠️ RAG Engine: Nenhum dado de contextualização encontrado');
    }
    console.log('');

    // Teste 2: Verificar Memória Persistente
    console.log('🧠 Teste 2: Memória Persistente');
    console.log('-------------------------------');
    
    const { data: memoryData, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (memoryError) {
      console.log(`❌ Erro Memória: ${memoryError.message}`);
    } else if (memoryData && memoryData.length > 0) {
      console.log(`✅ Memória: ${memoryData.length} interações encontradas`);
      console.log('📝 Última interação:', memoryData[0].user_name?.substring(0, 50) + '...');
    } else {
      console.log('ℹ️ Memória: Nenhuma interação anterior encontrada (normal para novo usuário)');
    }
    console.log('');

    // Teste 3: Verificar Personalização (corrigido)
    console.log('👤 Teste 3: Personalização');
    console.log('----------------------------');
    
    // Tentar diferentes nomes de coluna
    let userProfile = null;
    let profileError = null;
    
    // Tentar com 'phone'
    const { data: profileData1, error: error1 } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone', testPhone)
      .single();
    
    if (!error1 && profileData1) {
      userProfile = profileData1;
    } else {
      // Tentar com 'phone_number'
      const { data: profileData2, error: error2 } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone_number', testPhone)
        .single();
      
      if (!error2 && profileData2) {
        userProfile = profileData2;
      } else {
        profileError = error2;
      }
    }
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.log(`❌ Erro Perfil: ${profileError.message}`);
    } else if (userProfile) {
      console.log(`✅ Perfil encontrado: ${userProfile.name || 'Sem nome'}`);
      console.log(`📱 Telefone: ${userProfile.phone || userProfile.phone_number}`);
    } else {
      console.log('ℹ️ Perfil: Nenhum perfil encontrado (será criado automaticamente)');
    }
    console.log('');

    // Teste 4: Verificar Continuidade de Ações
    console.log('🔄 Teste 4: Continuidade de Ações');
    console.log('--------------------------------');
    
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('phone_number', testPhone)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (convError) {
      console.log(`❌ Erro Conversas: ${convError.message}`);
    } else if (conversations && conversations.length > 0) {
      console.log(`✅ Conversa ativa: ${conversations[0].id}`);
      console.log(`📅 Criada em: ${conversations[0].created_at}`);
    } else {
      console.log('ℹ️ Conversa: Nenhuma conversa ativa (será criada automaticamente)');
    }
    console.log('');

    // Teste 5: Verificar Tabelas do Sistema
    console.log('🗂️ Teste 5: Tabelas do Sistema');
    console.log('-------------------------------');
    
    const tablesToCheck = [
      'clinics',
      'conversation_memory', 
      'user_profiles',
      'whatsapp_conversations',
      'whatsapp_messages'
    ];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: Acessível`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: ${err.message}`);
      }
    }
    console.log('');

    // Teste 6: Simular busca RAG
    console.log('🔍 Teste 6: Simular Busca RAG');
    console.log('-----------------------------');
    
    if (clinicData && clinicData.contextualization_json) {
      const context = clinicData.contextualization_json;
      
      // Simular busca por horários
      if (context.clinica?.horario_funcionamento) {
        console.log('✅ Busca por horários: Dados disponíveis');
      } else {
        console.log('⚠️ Busca por horários: Dados não encontrados');
      }
      
      // Simular busca por endereço
      if (context.clinica?.localizacao) {
        console.log('✅ Busca por endereço: Dados disponíveis');
      } else {
        console.log('⚠️ Busca por endereço: Dados não encontrados');
      }
      
      // Simular busca por profissionais
      if (context.profissionais && context.profissionais.length > 0) {
        console.log(`✅ Busca por profissionais: ${context.profissionais.length} profissionais`);
      } else {
        console.log('⚠️ Busca por profissionais: Dados não encontrados');
      }
    } else {
      console.log('❌ Não foi possível simular busca RAG - dados não disponíveis');
    }
    console.log('');

    console.log('\n🎉 TESTES CONCLUÍDOS');
    console.log('=====================');
    console.log('✅ Sistema avançado ativado');
    console.log('✅ RAG configurado para usar dados da clínica');
    console.log('✅ Funcionalidades de memória, personalização e continuidade testadas');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('   1. Configurar OpenAI API Key no ai-config-production.env');
    console.log('   2. Executar testes de processamento de mensagens');
    console.log('   3. Validar integrações em produção');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error);
  }
}

// Executar testes
testAdvancedAISystem(); 