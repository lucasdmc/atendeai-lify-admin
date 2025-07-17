import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Configuração de Variáveis de Ambiente');
console.log('=====================================\n');

// Verificar se o arquivo .env já existe
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('⚠️  Arquivo .env já existe!');
  console.log('📝 Verifique se as seguintes variáveis estão configuradas:\n');
} else {
  console.log('📝 Criando arquivo .env...\n');
}

console.log('🔑 Variáveis necessárias para o sistema de IA:\n');

console.log('1. OPENAI_API_KEY');
console.log('   - Obtenha em: https://platform.openai.com/api-keys');
console.log('   - Exemplo: sk-...\n');

console.log('2. VITE_SUPABASE_URL');
console.log('   - URL do seu projeto Supabase');
console.log('   - Exemplo: https://niakqdolcdwxtrkbqmdi.supabase.co\n');

console.log('3. VITE_SUPABASE_ANON_KEY');
console.log('   - Chave anônima do Supabase');
console.log('   - Encontre em: Dashboard > Settings > API\n');

console.log('4. VITE_GOOGLE_CLIENT_ID (opcional)');
console.log('   - Para integração com Google Calendar\n');

console.log('5. VITE_GOOGLE_PLACES_API_KEY (opcional)');
console.log('   - Para busca de endereços\n');

console.log('📋 Exemplo de arquivo .env:\n');
console.log(`# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Supabase Configuration
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Google APIs (opcional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GOOGLE_PLACES_API_KEY=your-google-places-api-key-here

# Environment
NODE_ENV=development`);

console.log('\n🚀 Próximos passos:');
console.log('1. Copie o exemplo acima');
console.log('2. Crie um arquivo .env na raiz do projeto');
console.log('3. Cole o conteúdo e substitua pelos seus valores');
console.log('4. Execute: npm run test:ai-system');

// Criar arquivo .env se não existir
if (!envExists) {
  const envContent = `# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google APIs (opcional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Environment
NODE_ENV=development`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Arquivo .env criado!');
  console.log('📝 Edite o arquivo com suas credenciais reais.');
} 