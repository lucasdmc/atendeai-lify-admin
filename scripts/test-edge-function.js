import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateUser() {
  console.log('🧪 Testando Edge Function create-user...');
  
  try {
    const testUser = {
      name: 'Teste Edge Function',
      email: 'teste-edge@lify.com',
      password: 'teste123456',
      role: 'atendente'
    };

    console.log('📤 Enviando dados:', testUser);

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: testUser
    });

    console.log('📡 Resposta completa:', { data, error });

    if (error) {
      console.error('❌ Erro:', error);
      console.error('❌ Mensagem:', error.message);
      
      // Tentar extrair o corpo da resposta
      if (error.context && error.context.body) {
        try {
          const responseText = await error.context.body.text();
          console.error('❌ Corpo da resposta:', responseText);
        } catch (e) {
          console.error('❌ Não foi possível ler o corpo da resposta');
        }
      }
    } else {
      console.log('✅ Sucesso:', data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCreateUser(); 