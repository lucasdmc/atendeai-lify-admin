import { createClient } from '@supabase/supabase-js';

// Configuração real do Supabase
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertRAGData() {
  console.log('📝 INSERINDO DADOS NO RAG');
  console.log('==========================\n');

  const testData = [
    {
      title: 'Horários de Funcionamento',
      content: 'Segunda a Sexta: 08:00 às 18:00\nSábado: 08:00 às 12:00',
      category: 'horarios',
      tags: ['horário', 'funcionamento']
    },
    {
      title: 'Endereço da Clínica',
      content: 'Rua das Flores, 123 - Centro, São Paulo/SP',
      category: 'localizacao',
      tags: ['endereço', 'localização']
    },
    {
      title: 'Serviços Disponíveis',
      content: 'Consultas médicas, exames laboratoriais, ultrassonografia',
      category: 'servicos',
      tags: ['serviços', 'atendimento']
    },
    {
      title: 'Profissionais',
      content: 'Dr. João Silva - Cardiologia\nDra. Maria Santos - Pediatria\nDr. Carlos Oliveira - Ortopedia',
      category: 'profissionais',
      tags: ['médicos', 'especialistas']
    },
    {
      title: 'Formas de Pagamento',
      content: 'Aceitamos dinheiro, cartão de crédito, cartão de débito e PIX',
      category: 'pagamento',
      tags: ['pagamento', 'financeiro']
    }
  ];

  try {
    // Primeiro, verificar se já existem dados
    const { data: existingData, error: checkError } = await supabase
      .from('contextualization_data')
      .select('count')
      .limit(1);

    if (checkError) {
      console.log(`❌ Erro ao verificar dados existentes: ${checkError.message}`);
      return;
    }

    if (existingData && existingData.length > 0) {
      console.log('ℹ️ Dados já existem no RAG');
      return;
    }

    // Inserir dados
    const { data: insertData, error: insertError } = await supabase
      .from('contextualization_data')
      .insert(testData)
      .select();

    if (insertError) {
      console.log(`❌ Erro ao inserir dados: ${insertError.message}`);
      console.log('🔍 Detalhes do erro:', insertError);
    } else {
      console.log(`✅ Dados inseridos com sucesso: ${insertData?.length || 0} itens`);
      console.log('📋 Itens inseridos:');
      insertData?.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (${item.category})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar inserção
insertRAGData(); 