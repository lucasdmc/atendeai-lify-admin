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
    console.log('🔧 Chamando Edge Function para remover constraint...');
    
    const { data, error } = await supabase.functions.invoke('remove-constraint');

    if (error) {
      console.error('❌ Erro ao chamar Edge Function:', error);
      return;
    }

    console.log('✅ Resposta da Edge Function:', data);
    
    if (data.success) {
      console.log('🎉 Foreign key constraint removida com sucesso!');
      console.log('🔄 Agora você pode criar usuários diretamente na tabela user_profiles');
    } else {
      console.error('❌ Falha ao remover constraint:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

removeConstraint(); 