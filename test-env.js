import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔍 [TESTE] Verificando variáveis de ambiente...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
console.log('SUPABASE_SERVICE_ROLE_KEY (primeiros 20 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

// Testar se a chave é válida
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ Chave de serviço encontrada');
} else {
  console.log('❌ Chave de serviço não encontrada');
}
