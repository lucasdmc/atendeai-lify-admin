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
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar perfis:', error.message);
    return;
  }

  data.forEach((profile, idx) => {
    console.log(`${idx + 1}. ID: ${profile.id} | Nome: ${profile.name} | Role: ${profile.role}`);
  });

  console.log('\nCopie o ID correspondente ao seu usuário para usarmos na correção.');
}

listUserProfiles(); 