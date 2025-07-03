import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeConstraint() {
  try {
    console.log('🔧 Removendo foreign key constraint...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;'
    });

    if (error) {
      console.error('❌ Erro ao remover constraint:', error);
      return;
    }

    console.log('✅ Foreign key constraint removida com sucesso!');
    console.log('🔄 Agora você pode criar usuários diretamente na tabela user_profiles');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

removeConstraint(); 