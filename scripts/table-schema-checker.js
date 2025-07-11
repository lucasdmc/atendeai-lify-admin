#!/usr/bin/env node

/**
 * Utilitário para verificar estrutura real das tabelas
 * SEMPRE use este script antes de gerar código que acessa o banco
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

/**
 * Verifica a estrutura real de uma tabela
 * @param {string} tableName - Nome da tabela
 * @returns {Promise<Object>} Estrutura da tabela
 */
export async function checkTableSchema(tableName) {
  try {
    console.log(`🔍 Verificando estrutura da tabela: ${tableName}`);
    
    // Buscar um registro para ver a estrutura
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

/**
 * Verifica múltiplas tabelas de uma vez
 * @param {string[]} tableNames - Array com nomes das tabelas
 * @returns {Promise<Object>} Estrutura de todas as tabelas
 */
export async function checkMultipleTables(tableNames) {
  console.log('🔍 VERIFICANDO ESTRUTURA DE MÚLTIPLAS TABELAS\n');
  
  const results = {};
  
  for (const tableName of tableNames) {
    results[tableName] = await checkTableSchema(tableName);
    console.log(''); // Linha em branco entre tabelas
  }

  return results;
}

/**
 * Gera código TypeScript baseado na estrutura real
 * @param {string} tableName - Nome da tabela
 * @param {Object} schema - Estrutura da tabela
 * @returns {string} Interface TypeScript
 */
export function generateTypeScriptInterface(tableName, schema) {
  if (!schema.exists || schema.isEmpty) {
    return `// Tabela ${tableName} não existe ou está vazia`;
  }

  const className = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  let interfaceCode = `interface ${className} {\n`;

  schema.fields.forEach(field => {
    const tsType = getTypeScriptType(field.type, field.value);
    interfaceCode += `  ${field.name}${field.isNull ? '?' : ''}: ${tsType};\n`;
  });

  interfaceCode += '}';
  return interfaceCode;
}

/**
 * Converte tipos JavaScript para TypeScript
 */
function getTypeScriptType(jsType, value) {
  switch (jsType) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'any[]';
      return 'object';
    default:
      return 'any';
  }
}

// Exemplo de uso
if (require.main === module) {
  const tablesToCheck = ['clinics', 'agents', 'users', 'whatsapp_connections'];
  checkMultipleTables(tablesToCheck).then(results => {
    console.log('\n📋 RESUMO:');
    Object.entries(results).forEach(([tableName, result]) => {
      console.log(`${tableName}: ${result.exists ? '✅ Existe' : '❌ Não existe'}`);
    });
  });
}

export default { checkTableSchema, checkMultipleTables, generateTypeScriptInterface }; 