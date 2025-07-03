import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  console.log('💡 Execute: export SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeWhatsAppSetup() {
  try {
    console.log('🚀 Iniciando setup das tabelas do WhatsApp...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'setup-whatsapp-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executando SQL...');
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Se não conseguir executar via RPC, tentar executar as queries separadamente
      console.log('🔄 Tentando executar queries separadamente...');
      await executeQueriesSeparately();
    } else {
      console.log('✅ Setup concluído com sucesso!');
      console.log('📊 Resultado:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro no setup:', error);
    await executeQueriesSeparately();
  }
}

async function executeQueriesSeparately() {
  console.log('🔧 Executando queries separadamente...');
  
  const queries = [
    // 1. Tabela de conversas
    `CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      phone_number TEXT NOT NULL UNIQUE,
      formatted_phone_number TEXT,
      country_code TEXT,
      name TEXT,
      email TEXT,
      last_message_preview TEXT,
      unread_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // 2. Tabela de mensagens
    `CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT NOT NULL CHECK (message_type IN ('received', 'sent')),
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
      whatsapp_message_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // 3. Tabela de memória
    `CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_memory (
      id BIGSERIAL PRIMARY KEY,
      phone_number TEXT UNIQUE NOT NULL,
      memory_data JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // 4. Tabela de conhecimento
    `CREATE TABLE IF NOT EXISTS public.clinic_knowledge_base (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      tags TEXT[],
      importance INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // 5. Tabela de interações IA
    `CREATE TABLE IF NOT EXISTS public.ai_interactions (
      id BIGSERIAL PRIMARY KEY,
      phone_number TEXT,
      messages JSONB,
      response TEXT,
      model TEXT,
      tokens_used INTEGER,
      intent TEXT,
      confidence DECIMAL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // 6. Tabela de perfis
    `CREATE TABLE IF NOT EXISTS public.user_personalization_profiles (
      id BIGSERIAL PRIMARY KEY,
      phone_number TEXT UNIQUE NOT NULL,
      profile_data JSONB NOT NULL DEFAULT '{}',
      preferences JSONB DEFAULT '{}',
      behavior_patterns JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // 7. Tabela de ferramentas
    `CREATE TABLE IF NOT EXISTS public.ai_tools (
      id BIGSERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      parameters JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // 8. Tabela de escalação
    `CREATE TABLE IF NOT EXISTS public.escalation_logs (
      id BIGSERIAL PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      phone_number TEXT,
      reason TEXT,
      intent TEXT,
      frustration_level DECIMAL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`
  ];
  
  for (let i = 0; i < queries.length; i++) {
    try {
      console.log(`📝 Executando query ${i + 1}/${queries.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: queries[i] });
      
      if (error) {
        console.error(`❌ Erro na query ${i + 1}:`, error);
      } else {
        console.log(`✅ Query ${i + 1} executada com sucesso`);
      }
    } catch (error) {
      console.error(`❌ Erro na query ${i + 1}:`, error);
    }
  }
  
  // Criar índices
  console.log('🔍 Criando índices...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number)',
    'CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_updated ON public.whatsapp_conversations(updated_at)',
    'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id)',
    'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type ON public.whatsapp_messages(message_type)',
    'CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON public.whatsapp_conversation_memory(phone_number)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.clinic_knowledge_base(category)',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON public.clinic_knowledge_base USING GIN(tags)',
    'CREATE INDEX IF NOT EXISTS idx_ai_interactions_phone ON public.ai_interactions(phone_number)',
    'CREATE INDEX IF NOT EXISTS idx_ai_interactions_created ON public.ai_interactions(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_personalization_phone ON public.user_personalization_profiles(phone_number)',
    'CREATE INDEX IF NOT EXISTS idx_escalation_conversation ON public.escalation_logs(conversation_id)'
  ];
  
  for (const indexQuery of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: indexQuery });
      if (error) {
        console.error('❌ Erro ao criar índice:', error);
      }
    } catch (error) {
      console.error('❌ Erro ao criar índice:', error);
    }
  }
  
  // Configurar RLS
  console.log('🔒 Configurando RLS...');
  const rlsQueries = [
    'ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.whatsapp_conversation_memory ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.clinic_knowledge_base ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.user_personalization_profiles ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.escalation_logs ENABLE ROW LEVEL SECURITY'
  ];
  
  for (const rlsQuery of rlsQueries) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: rlsQuery });
      if (error) {
        console.error('❌ Erro ao configurar RLS:', error);
      }
    } catch (error) {
      console.error('❌ Erro ao configurar RLS:', error);
    }
  }
  
  // Inserir dados iniciais
  console.log('📝 Inserindo dados iniciais...');
  await insertInitialData();
  
  console.log('✅ Setup das tabelas do WhatsApp concluído!');
}

async function insertInitialData() {
  try {
    // Inserir base de conhecimento
    const knowledgeData = [
      {
        title: 'Horário de Funcionamento',
        content: 'Nossa clínica funciona de segunda a sexta das 8h às 18h, e aos sábados das 8h às 12h.',
        category: 'horarios',
        tags: ['horario', 'funcionamento', 'atendimento'],
        importance: 5
      },
      {
        title: 'Política de Cancelamento',
        content: 'Agendamentos podem ser cancelados até 24 horas antes da consulta sem custo adicional.',
        category: 'politicas',
        tags: ['cancelamento', 'politica', 'agendamento'],
        importance: 4
      },
      {
        title: 'Formas de Pagamento',
        content: 'Aceitamos dinheiro, cartões de crédito e débito, PIX e principais convênios médicos.',
        category: 'pagamento',
        tags: ['pagamento', 'convênio', 'cartão'],
        importance: 3
      },
      {
        title: 'Primeira Consulta',
        content: 'Na primeira consulta, traga documento de identidade e, se possível, exames anteriores.',
        category: 'atendimento',
        tags: ['primeira', 'consulta', 'documentos'],
        importance: 4
      },
      {
        title: 'Reagendamento',
        content: 'Para reagendar uma consulta, entre em contato com pelo menos 24 horas de antecedência.',
        category: 'agendamento',
        tags: ['reagendamento', 'alteração', 'horário'],
        importance: 3
      }
    ];
    
    for (const item of knowledgeData) {
      const { error } = await supabase
        .from('clinic_knowledge_base')
        .upsert(item, { onConflict: 'title' });
      
      if (error) {
        console.error('❌ Erro ao inserir conhecimento:', error);
      }
    }
    
    // Inserir ferramentas
    const toolsData = [
      {
        name: 'create_appointment',
        description: 'Criar novo agendamento',
        parameters: { title: 'string', date: 'string', start_time: 'string', end_time: 'string', email: 'string', location: 'string' }
      },
      {
        name: 'list_appointments',
        description: 'Listar agendamentos do paciente',
        parameters: { phone_number: 'string', date: 'string' }
      },
      {
        name: 'cancel_appointment',
        description: 'Cancelar agendamento existente',
        parameters: { appointment_id: 'string', reason: 'string' }
      },
      {
        name: 'check_availability',
        description: 'Verificar disponibilidade de horários',
        parameters: { date: 'string', specialty: 'string' }
      },
      {
        name: 'escalate_to_human',
        description: 'Transferir para atendente humano',
        parameters: { reason: 'string', urgency: 'string' }
      }
    ];
    
    for (const tool of toolsData) {
      const { error } = await supabase
        .from('ai_tools')
        .upsert(tool, { onConflict: 'name' });
      
      if (error) {
        console.error('❌ Erro ao inserir ferramenta:', error);
      }
    }
    
    console.log('✅ Dados iniciais inseridos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inserir dados iniciais:', error);
  }
}

// Executar o setup
executeWhatsAppSetup().catch(console.error); 