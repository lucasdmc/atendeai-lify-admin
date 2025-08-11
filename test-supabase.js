import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabaseConnection() {
  try {
    console.log('🧪 [TESTE] Testando conexão com Supabase...');
    console.log('🔑 URL:', process.env.SUPABASE_URL);
    console.log('🔑 Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
    
    // Teste simples de conexão
    const { data, error } = await supabase
      .from('clinics')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ [TESTE] Erro na conexão:', error);
    } else {
      console.log('✅ [TESTE] Conexão com Supabase funcionando!');
      console.log('📊 Dados recebidos:', data);
    }
    
  } catch (error) {
    console.error('💥 [TESTE] Erro durante o teste:', error);
  }
}

// Executar teste
testSupabaseConnection();
