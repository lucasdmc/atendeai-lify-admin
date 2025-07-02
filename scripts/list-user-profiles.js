// Script para listar todos os perfis de usuário
// Execute: node scripts/list-user-profiles.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
  console.log('❌ Credenciais do Supabase não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUserProfiles() {
  console.log('🔍 Listando todos os perfis de usuário...\n');
  
  // Primeiro, vamos verificar se a tabela existe e sua estrutura
  const { data: tableInfo, error: tableError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ Erro ao acessar tabela user_profiles:', tableError.message);
    console.log('💡 A tabela pode não existir. Execute o script create-user-profiles-table.sql primeiro.');
    return;
  }

  // Agora buscar todos os perfis
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, user_id, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar perfis:', error.message);
    return;
  }

  if (data.length === 0) {
    console.log('📭 Nenhum perfil encontrado na tabela user_profiles.');
    console.log('💡 Execute o script create-user-profiles-table.sql para criar o perfil admin.');
    return;
  }

  console.log(`📊 Encontrados ${data.length} perfil(s):\n`);
  
  data.forEach((profile, idx) => {
    console.log(`${idx + 1}. ID: ${profile.id}`);
    console.log(`   User ID: ${profile.user_id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Criado em: ${profile.created_at}`);
    console.log('');
  });

  console.log('💡 Copie o ID correspondente ao seu usuário para usarmos na correção.');
}

listUserProfiles(); 