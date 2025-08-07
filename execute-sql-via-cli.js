// ========================================
// EXECUTAR SQL VIA SUPABASE CLI
// ========================================

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function executeSQLViaCLI() {
  try {
    console.log('🚀 Tentando executar SQL via Supabase CLI...');
    
    // SQL para adicionar campo simulation_mode
    const sql = `
      -- Adicionar campo simulation_mode na tabela clinics
      ALTER TABLE clinics 
      ADD COLUMN IF NOT EXISTS simulation_mode BOOLEAN DEFAULT FALSE;

      -- Adicionar comentário para documentação
      COMMENT ON COLUMN clinics.simulation_mode IS 'Controla se o chatbot está em modo simulação (true) ou produção (false)';

      -- Criar índice para busca por modo de simulação
      CREATE INDEX IF NOT EXISTS idx_clinics_simulation_mode ON clinics(simulation_mode);
    `;

    // Salvar SQL em arquivo temporário
    const fs = await import('fs');
    const sqlFile = 'temp_simulation.sql';
    fs.writeFileSync(sqlFile, sql);

    console.log('📝 SQL salvo em arquivo temporário:', sqlFile);
    console.log('');

    // Tentar executar via Supabase CLI
    console.log('🔄 Executando via Supabase CLI...');
    
    try {
      const { stdout, stderr } = await execAsync(`supabase db remote commit --db-url "postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.niakqdolcdwxtrkbqmdi.supabase.co:5432/postgres" --schema public < ${sqlFile}`);
      
      if (stderr) {
        console.error('❌ Erro:', stderr);
      } else {
        console.log('✅ SQL executado com sucesso!');
        console.log('📊 Estrutura da tabela clinics atualizada!');
      }
    } catch (error) {
      console.log('⚠️  Não foi possível executar via CLI. Alternativas:');
      console.log('');
      console.log('🔗 Opção 1: Execute manualmente no Supabase Dashboard');
      console.log('   URL: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi/sql/new');
      console.log('');
      console.log('📝 SQL para copiar e colar:');
      console.log('```sql');
      console.log(sql);
      console.log('```');
      console.log('');
      console.log('🔗 Opção 2: Use o Supabase CLI com credenciais corretas');
      console.log('   Configure SUPABASE_DB_PASSWORD no .env');
      console.log('');
      console.log('🔗 Opção 3: Use o script Node.js com service role key');
      console.log('   Configure SUPABASE_SERVICE_ROLE_KEY no .env');
    }

    // Limpar arquivo temporário
    fs.unlinkSync(sqlFile);
    console.log('🧹 Arquivo temporário removido');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar script
executeSQLViaCLI(); 