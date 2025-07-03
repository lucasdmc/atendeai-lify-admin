import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
  try {
    console.log('🔧 Desabilitando RLS para user_profiles...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'disable-rls-user-profiles.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar via rpc (função personalizada)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Tentar executar comandos individuais
      console.log('🔄 Tentando executar comandos individuais...');
      
      // Desabilitar RLS
      const { error: disableError } = await supabase.rpc('exec_sql', { 
        sql_query: 'ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;' 
      });
      
      if (disableError) {
        console.error('❌ Erro ao desabilitar RLS:', disableError);
      } else {
        console.log('✅ RLS desabilitado com sucesso');
      }
      
      // Remover políticas
      const policies = [
        'Enable read access for all users',
        'Enable insert for authenticated users only', 
        'Enable update for users based on id',
        'Enable delete for users based on id',
        'Enable all operations for admin_lify',
        'Enable read for all authenticated users',
        'Enable insert for admin_lify',
        'Enable update for admin_lify',
        'Enable delete for admin_lify'
      ];
      
      for (const policy of policies) {
        const { error: dropError } = await supabase.rpc('exec_sql', {
          sql_query: `DROP POLICY IF EXISTS "${policy}" ON user_profiles;`
        });
        
        if (dropError) {
          console.error(`❌ Erro ao remover política ${policy}:`, dropError);
        } else {
          console.log(`✅ Política ${policy} removida`);
        }
      }
      
    } else {
      console.log('✅ RLS desabilitado e políticas removidas com sucesso');
    }
    
    // Verificar status
    console.log('\n📊 Verificando status atual...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
    } else {
      console.log('✅ Tabela user_profiles acessível');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
disableRLS(); 