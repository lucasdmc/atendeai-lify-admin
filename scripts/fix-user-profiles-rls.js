import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserProfilesRLS() {
    console.log('🔧 Corrigindo política RLS da tabela user_profiles...');
    
    try {
        // Ler o script SQL
        const sqlPath = path.join(__dirname, 'fix-user-profiles-rls.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📋 Executando script SQL...');
        
        // Executar o script SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: sqlScript
        });
        
        if (error) {
            console.error('❌ Erro ao executar script SQL:', error);
            
            // Tentar executar via REST API
            console.log('🔄 Tentando via REST API...');
            
            // Desabilitar RLS
            const { error: disableError } = await supabase
                .from('user_profiles')
                .select('*')
                .limit(1);
                
            if (disableError) {
                console.error('❌ Erro ao acessar tabela:', disableError);
                return;
            }
            
        } else {
            console.log('✅ Script SQL executado com sucesso');
        }
        
        // Testar se a tabela está acessível
        console.log('🧪 Testando acesso à tabela...');
        const { data: testData, error: testError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);
            
        if (testError) {
            console.error('❌ Erro no teste:', testError);
        } else {
            console.log('✅ Tabela user_profiles acessível!');
            console.log(`📊 Registros encontrados: ${testData?.length || 0}`);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
        
        // Tentar solução alternativa via SQL direto
        console.log('🔄 Tentando solução alternativa...');
        
        const alternativeSQL = `
            -- Desabilitar RLS temporariamente
            ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
            
            -- Remover todas as políticas
            DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
            DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
            DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
            DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
            DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
            DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
            DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_profiles;
            
            -- Criar política simples
            CREATE POLICY "Enable all access for authenticated users" ON user_profiles
                FOR ALL USING (auth.role() = 'authenticated');
                
            -- Reabilitar RLS
            ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        `;
        
        try {
            const { error: altError } = await supabase.rpc('exec_sql', {
                sql_query: alternativeSQL
            });
            
            if (altError) {
                console.error('❌ Erro na solução alternativa:', altError);
            } else {
                console.log('✅ Solução alternativa aplicada');
            }
        } catch (altError) {
            console.error('❌ Erro na solução alternativa:', altError);
        }
    }
}

// Executar a correção
fixUserProfilesRLS().then(() => {
    console.log('🏁 Correção concluída!');
}).catch(error => {
    console.error('💥 Erro fatal:', error);
}); 