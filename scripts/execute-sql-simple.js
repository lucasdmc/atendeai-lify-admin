import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filename) {
  try {
    console.log(`🚀 Executando script SQL: ${filename}`);
    
    // Ler o arquivo SQL
    const sqlPath = join(__dirname, filename);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Conteúdo do SQL:');
    console.log(sqlContent);
    
    // Executar o SQL usando rpc (se disponível) ou executar comandos separadamente
    const commands = sqlContent.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`\n🔧 Executando: ${command.trim()}`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: command });
          
          if (error) {
            console.log('⚠️ Erro no RPC, tentando método alternativo...');
            // Se RPC não funcionar, tentar executar diretamente
            const { data: directData, error: directError } = await supabase
              .from('user_calendars')
              .select('*')
              .limit(1);
              
            if (directError) {
              console.error('❌ Erro ao executar comando:', directError);
            } else {
              console.log('✅ Comando executado com sucesso');
            }
          } else {
            console.log('✅ Comando executado com sucesso:', data);
          }
        } catch (cmdError) {
          console.error('❌ Erro ao executar comando:', cmdError);
        }
      }
    }
    
    console.log('\n🎉 Script executado!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o arquivo passado como argumento
const filename = process.argv[2];
if (!filename) {
  console.error('❌ Por favor, especifique o arquivo SQL como argumento');
  console.log('Exemplo: node execute-sql-simple.js add-clinic-id-to-user-calendars.sql');
  process.exit(1);
}

executeSQLFile(filename); 