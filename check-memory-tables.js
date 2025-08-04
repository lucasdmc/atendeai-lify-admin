// Script para verificar tabelas de memória no Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function checkMemoryTables() {
  console.log('🔍 Verificando tabelas de memória no Supabase...\n');

  const tablesToCheck = [
    'whatsapp_conversation_memory',
    'conversation_memory',
    'agent_conversation_memory',
    'ai_interactions'
  ];

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ERRO - ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: EXISTE`);
        if (data && data.length > 0) {
          console.log(`   Estrutura:`, Object.keys(data[0]));
        }
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ERRO - ${error.message}`);
    }
  }

  console.log('\n📋 Verificando estrutura da tabela whatsapp_conversation_memory...');
  try {
    const { data, error } = await supabase
      .from('whatsapp_conversation_memory')
      .select('*')
      .limit(1);

    if (!error && data && data.length > 0) {
      console.log('✅ Estrutura encontrada:', Object.keys(data[0]));
    } else {
      console.log('❌ Tabela vazia ou não existe');
    }
  } catch (error) {
    console.log('❌ Erro ao verificar estrutura:', error.message);
  }
}

checkMemoryTables(); 