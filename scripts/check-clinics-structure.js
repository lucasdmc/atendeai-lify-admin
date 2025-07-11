#!/usr/bin/env node

/**
 * Script para verificar a estrutura real da tabela clinics
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

console.log('🔍 VERIFICANDO ESTRUTURA REAL DA TABELA CLINICS\n');

async function checkClinicsStructure() {
  try {
    // 1. Buscar uma clínica para ver a estrutura
    console.log('1️⃣ Buscando estrutura da tabela clinics...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .limit(1);

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`📊 Total de clínicas: ${clinics?.length || 0}`);

    if (clinics && clinics.length > 0) {
      const clinic = clinics[0];
      console.log('\n📋 ESTRUTURA DA TABELA CLINICS:');
      console.log('Campos disponíveis:');
      Object.keys(clinic).forEach(key => {
        const value = clinic[key];
        const type = typeof value;
        console.log(`   - ${key}: ${type} = ${value}`);
      });
    }

    // 2. Tentar buscar todas as clínicas
    console.log('\n2️⃣ Buscando todas as clínicas...');
    const { data: allClinics, error: allError } = await supabase
      .from('clinics')
      .select('*');

    if (allError) {
      console.error('❌ Erro ao buscar todas as clínicas:', allError);
    } else {
      console.log(`📊 Total de clínicas no banco: ${allClinics?.length || 0}`);
      
      if (allClinics && allClinics.length > 0) {
        console.log('\n📋 TODAS AS CLÍNICAS:');
        allClinics.forEach((clinic, index) => {
          console.log(`${index + 1}. ${clinic.name || 'Sem nome'} (ID: ${clinic.id})`);
          console.log(`   - Campos: ${Object.keys(clinic).join(', ')}`);
          console.log('');
        });
      }
    }

    // 3. Verificar se há algum campo de status
    console.log('3️⃣ Verificando campos de status...');
    const possibleStatusFields = ['is_active', 'active', 'status', 'enabled', 'disabled'];
    
    for (const field of possibleStatusFields) {
      try {
        const { data, error } = await supabase
          .from('clinics')
          .select(field)
          .limit(1);
        
        if (error) {
          console.log(`❌ Campo '${field}' não existe`);
        } else {
          console.log(`✅ Campo '${field}' existe`);
        }
      } catch (err) {
        console.log(`❌ Campo '${field}' não existe`);
      }
    }

    console.log('\n📋 CONCLUSÃO:');
    if (clinics && clinics.length > 0) {
      console.log('✅ A tabela clinics existe e tem dados');
      console.log('✅ O problema pode ser que não há campo is_active');
      console.log('💡 As clínicas podem estar ativas por padrão');
      console.log('💡 Recarregue a página do frontend para testar');
    } else {
      console.log('❌ A tabela clinics está vazia');
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkClinicsStructure(); 