import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseAuth() {
  console.log('🔍 Testando autenticação do Supabase...\n');

  try {
    // Teste 1: Verificar se o cliente está funcionando
    console.log('1️⃣ Testando conexão com Supabase...');
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
    } else {
      console.log('✅ Conexão com Supabase OK');
    }

    // Teste 2: Verificar sessão atual
    console.log('\n2️⃣ Verificando sessão atual...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao verificar sessão:', sessionError.message);
    } else if (session) {
      console.log('✅ Sessão ativa encontrada');
      console.log('   User ID:', session.user.id);
      console.log('   Email:', session.user.email);
    } else {
      console.log('⚠️ Nenhuma sessão ativa');
    }

    // Teste 3: Verificar se há token expirado
    console.log('\n3️⃣ Verificando tokens...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Erro ao verificar usuário:', userError.message);
    } else if (user) {
      console.log('✅ Usuário autenticado:', user.email);
    } else {
      console.log('⚠️ Nenhum usuário autenticado');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testSupabaseAuth(); 