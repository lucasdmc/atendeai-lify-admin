// ========================================
// SCRIPT PARA EXECUTAR SQL DE SIMULAÇÃO
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSimulationSQL() {
  try {
    console.log('🚀 Verificando estrutura atual da tabela clinics...');

    // Primeiro, vamos verificar se a coluna já existe
    const { data: checkData, error: checkError } = await supabase
      .from('clinics')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar tabela clinics:', checkError);
      return;
    }

    console.log('✅ Tabela clinics existe e está acessível');

    // Verificar se a coluna simulation_mode já existe
    const { data: columnCheck, error: columnError } = await supabase
      .from('clinics')
      .select('simulation_mode')
      .limit(1);

    if (columnError && columnError.message.includes('column "simulation_mode" does not exist')) {
      console.log('📝 Coluna simulation_mode não existe. Criando...');
      
      // Como não podemos executar DDL com chave anônima, vamos informar o usuário
      console.log('⚠️  Para adicionar a coluna simulation_mode, execute o seguinte SQL no Supabase Dashboard:');
      console.log('');
      console.log('ALTER TABLE clinics ADD COLUMN IF NOT EXISTS simulation_mode BOOLEAN DEFAULT FALSE;');
      console.log('COMMENT ON COLUMN clinics.simulation_mode IS \'Controla se o chatbot está em modo simulação (true) ou produção (false)\';');
      console.log('CREATE INDEX IF NOT EXISTS idx_clinics_simulation_mode ON clinics(simulation_mode);');
      console.log('');
      console.log('🔗 Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql/new');
      
    } else if (columnError) {
      console.error('❌ Erro ao verificar coluna simulation_mode:', columnError);
    } else {
      console.log('✅ Coluna simulation_mode já existe!');
      console.log('📊 Estrutura da tabela clinics já está atualizada!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar script
executeSimulationSQL(); 