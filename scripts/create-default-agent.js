import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createDefaultAgent() {
  try {
    console.log('🔄 Criando agente padrão...')
    
    // Verificar se a tabela agents existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'agents')
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabela agents:', tablesError)
      return
    }
    
    if (!tables || tables.length === 0) {
      console.log('📋 Criando tabela agents...')
      
      // Criar tabela agents se não existir
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.agents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            whatsapp_number TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Habilitar RLS
          ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
          
          -- Política para permitir acesso a todos os usuários autenticados
          CREATE POLICY IF NOT EXISTS "Users can view all agents" ON public.agents
            FOR SELECT USING (auth.role() = 'authenticated');
            
          CREATE POLICY IF NOT EXISTS "Users can insert agents" ON public.agents
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
            
          CREATE POLICY IF NOT EXISTS "Users can update agents" ON public.agents
            FOR UPDATE USING (auth.role() = 'authenticated');
        `
      })
      
      if (createTableError) {
        console.error('❌ Erro ao criar tabela agents:', createTableError)
        return
      }
      
      console.log('✅ Tabela agents criada com sucesso')
    }
    
    // Verificar se o agente padrão já existe
    const { data: existingAgent, error: checkError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', 'default-agent')
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar agente existente:', checkError)
      return
    }
    
    if (existingAgent) {
      console.log('✅ Agente padrão já existe')
      return
    }
    
    // Criar agente padrão
    const { data: newAgent, error: insertError } = await supabase
      .from('agents')
      .insert({
        id: 'default-agent',
        name: 'Agente Padrão',
        description: 'Agente WhatsApp padrão do sistema',
        whatsapp_number: '5511999999999',
        is_active: true
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Erro ao criar agente padrão:', insertError)
      return
    }
    
    console.log('✅ Agente padrão criado com sucesso:', newAgent)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

createDefaultAgent() 