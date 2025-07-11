#!/usr/bin/env node

/**
 * Script para debugar permissões de clínicas
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

console.log('🔍 DEBUGANDO PERMISSÕES DE CLÍNICAS\n');

async function debugClinicPermissions() {
  try {
    // 1. Verificar se há clínicas no banco
    console.log('1️⃣ Verificando clínicas no banco...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Total de clínicas no banco: ${clinics?.length || 0}`);
    
    if (clinics && clinics.length > 0) {
      console.log('\n📋 Clínicas encontradas:');
      clinics.forEach((clinic, index) => {
        console.log(`${index + 1}. ${clinic.name} (ID: ${clinic.id})`);
        console.log(`   - Ativa: ${clinic.is_active ? 'Sim' : 'Não'}`);
        console.log(`   - Criada em: ${clinic.created_at}`);
        console.log('');
      });
    }

    // 2. Verificar se o usuário atual pode ver clínicas
    console.log('2️⃣ Verificando permissões do usuário atual...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    if (user) {
      console.log(`✅ Usuário logado: ${user.email} (ID: ${user.id})`);
      
      // 3. Verificar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
      } else {
        console.log(`✅ Perfil encontrado: ${profile.role}`);
        console.log(`✅ Permissões: ${profile.permissions?.join(', ') || 'Nenhuma'}`);
      }
    } else {
      console.log('❌ Nenhum usuário logado');
    }

    // 4. Tentar buscar clínicas com diferentes filtros
    console.log('\n3️⃣ Testando diferentes consultas de clínicas...');
    
    // Teste 1: Buscar todas as clínicas
    const { data: allClinics, error: allError } = await supabase
      .from('clinics')
      .select('*');
    
    console.log(`📊 Busca sem filtro: ${allClinics?.length || 0} clínicas`);
    if (allError) console.log(`❌ Erro: ${allError.message}`);

    // Teste 2: Buscar apenas clínicas ativas
    const { data: activeClinics, error: activeError } = await supabase
      .from('clinics')
      .select('*')
      .eq('is_active', true);
    
    console.log(`📊 Busca clínicas ativas: ${activeClinics?.length || 0} clínicas`);
    if (activeError) console.log(`❌ Erro: ${activeError.message}`);

    // Teste 3: Buscar apenas o nome das clínicas
    const { data: clinicNames, error: namesError } = await supabase
      .from('clinics')
      .select('name');
    
    console.log(`📊 Busca apenas nomes: ${clinicNames?.length || 0} clínicas`);
    if (namesError) console.log(`❌ Erro: ${namesError.message}`);

    // 5. Verificar se há problemas de RLS
    console.log('\n4️⃣ Verificando políticas RLS...');
    console.log('💡 Se houver erro 400, pode ser problema de RLS ou permissões');
    console.log('💡 Verifique as políticas da tabela clinics no painel do Supabase');

    console.log('\n📋 RESUMO:');
    console.log(`✅ Clínicas no banco: ${clinics?.length || 0}`);
    console.log(`✅ Usuário logado: ${user ? 'Sim' : 'Não'}`);
    console.log(`✅ Pode ver clínicas: ${allClinics ? 'Sim' : 'Não'}`);
    
    if (clinics && clinics.length > 0) {
      console.log('\n🎉 PROBLEMA RESOLVIDO!');
      console.log('Há clínicas no banco. O erro 400 pode ser temporário ou de cache.');
      console.log('Tente recarregar a página do frontend.');
    } else {
      console.log('\n🚨 PROBLEMA PERSISTE:');
      console.log('Não há clínicas no banco ou não consegue acessá-las.');
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

// Executar debug
debugClinicPermissions(); 