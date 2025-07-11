#!/usr/bin/env node

/**
 * Script rápido para verificar estrutura de tabelas
 * Use: node scripts/quick-schema-check.js clinics agents users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableSchema(tableName) {
  try {
    console.log(`🔍 Verificando estrutura da tabela: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Erro ao acessar tabela ${tableName}:`, error);
      return { exists: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.log(`⚠️ Tabela ${tableName} existe mas está vazia`);
      return { 
        exists: true, 
        isEmpty: true, 
        fields: [],
        message: 'Tabela vazia - não é possível determinar estrutura'
      };
    }

    const record = data[0];
    const fields = Object.keys(record).map(key => ({
      name: key,
      type: typeof record[key],
      value: record[key],
      isNull: record[key] === null
    }));

    console.log(`✅ Tabela ${tableName} - ${fields.length} campos encontrados:`);
    fields.forEach(field => {
      console.log(`   - ${field.name}: ${field.type}${field.isNull ? ' (null)' : ''}`);
    });

    return {
      exists: true,
      isEmpty: false,
      fields,
      sampleRecord: record
    };

  } catch (error) {
    console.error(`❌ Erro ao verificar tabela ${tableName}:`, error);
    return { exists: false, error: error.message };
  }
}

async function checkMultipleTables(tableNames) {
  console.log('🔍 VERIFICANDO ESTRUTURA DE MÚLTIPLAS TABELAS\n');
  
  const results = {};
  
  for (const tableName of tableNames) {
    results[tableName] = await checkTableSchema(tableName);
    console.log(''); // Linha em branco entre tabelas
  }

  return results;
}

const tablesToCheck = process.argv.slice(2);

if (tablesToCheck.length === 0) {
  console.log('❌ Especifique as tabelas para verificar:');
  console.log('   node scripts/quick-schema-check.js clinics agents users');
  process.exit(1);
}

console.log(`🔍 Verificando tabelas: ${tablesToCheck.join(', ')}\n`);

checkMultipleTables(tablesToCheck).then(results => {
  console.log('\n📋 RESUMO:');
  Object.entries(results).forEach(([tableName, result]) => {
    if (result.exists) {
      console.log(`✅ ${tableName}: ${result.fields?.length || 0} campos`);
    } else {
      console.log(`❌ ${tableName}: ${result.error || 'Não existe'}`);
    }
  });
}); 