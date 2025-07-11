#!/usr/bin/env node

/**
 * Script para verificar estrutura da tabela clinics
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

console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA CLINICS\n');

async function checkClinicsSchema() {
  try {
    // 1. Tentar buscar uma clínica para ver a estrutura
    console.log('1️⃣ Verificando estrutura da tabela clinics...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .limit(1);

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      
      // 2. Tentar criar uma clínica com apenas o campo name
      console.log('\n2️⃣ Tentando criar clínica apenas com nome...');
      const { data: newClinic, error: createError } = await supabase
        .from('clinics')
        .insert([{ name: 'Clínica Padrão' }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar clínica mínima:', createError);
        
        // 3. Verificar se a tabela existe
        console.log('\n3️⃣ Verificando se a tabela clinics existe...');
        const { data: tableCheck, error: tableError } = await supabase
          .rpc('get_table_info', { table_name: 'clinics' });

        if (tableError) {
          console.error('❌ Erro ao verificar tabela:', tableError);
          console.log('\n💡 A tabela clinics pode não existir ou ter problemas de permissão');
        }
      } else {
        console.log('✅ Clínica criada com sucesso!');
        console.log(`📋 Nome: ${newClinic.name}`);
        console.log(`🆔 ID: ${newClinic.id}`);
      }
    } else {
      console.log('✅ Tabela clinics existe e está acessível');
      console.log(`📊 Total de clínicas: ${clinics?.length || 0}`);
      
      if (clinics && clinics.length > 0) {
        console.log('\n📋 Estrutura da primeira clínica:');
        const clinic = clinics[0];
        Object.keys(clinic).forEach(key => {
          console.log(`   - ${key}: ${typeof clinic[key]} = ${clinic[key]}`);
        });
      }
    }

    // 4. Verificar outras tabelas relacionadas
    console.log('\n4️⃣ Verificando outras tabelas...');
    
    const tables = ['agents', 'whatsapp_connections', 'users'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: ${data?.length || 0} registros`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: Erro ao verificar`);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkClinicsSchema(); 