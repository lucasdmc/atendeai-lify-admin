// Script para executar correção SQL via API
// Execute: node scripts/execute-sql-fix.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
  console.log('❌ Credenciais do Supabase não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFix() {
  console.log('🔧 Executando correção SQL...\n');

  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('scripts/complete-database-fix.sql', 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 Executando ${commands.length} comandos SQL...\n`);

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.trim().length === 0) continue;
      
      console.log(`🔄 Executando comando ${i + 1}/${commands.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          console.log('📋 Comando:', command.substring(0, 100) + '...');
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (execError) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`, execError.message);
      }
      
      // Aguardar um pouco entre comandos
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎉 Correção SQL concluída!');
    
    // Verificar resultado
    console.log('\n📊 Verificando resultado...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Erro ao verificar perfis:', profilesError.message);
    } else {
      console.log(`✅ Total de perfis: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role})`);
      });
    }

    const { data: permissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('*');

    if (permissionsError) {
      console.error('❌ Erro ao verificar permissões:', permissionsError.message);
    } else {
      console.log(`✅ Total de permissões: ${permissions.length}`);
    }

  } catch (error) {
    console.error('❌ Erro durante execução:', error);
  }
}

executeSQLFix(); 