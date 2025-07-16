#!/usr/bin/env node

/**
 * Script para verificar e corrigir problemas na tabela user_profiles
 * Resolve erro 500 na tela de QR Code
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://niakqdolcdwxtrkbqmdi.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
  console.log('💡 Adicione a chave service_role do Supabase no arquivo .env:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixUserProfiles() {
  console.log('🔍 Verificando tabela user_profiles...');

  try {
    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando existência da tabela...');
    const { data: tableExists, error: tableError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      console.log('⚠️ Tabela user_profiles não existe, criando...');
      await createUserProfilesTable();
    } else if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
      return;
    } else {
      console.log('✅ Tabela user_profiles existe');
    }

    // 2. Verificar políticas RLS
    console.log('2️⃣ Verificando políticas RLS...');
    await checkAndFixRLSPolicies();

    // 3. Verificar usuários sem perfil
    console.log('3️⃣ Verificando usuários sem perfil...');
    await createMissingProfiles();

    // 4. Teste final
    console.log('4️⃣ Teste final...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    if (testError) {
      console.error('❌ Erro no teste final:', testError);
    } else {
      console.log('✅ Teste final bem-sucedido!');
      console.log(`📊 Total de perfis: ${testData?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function createUserProfilesTable() {
  console.log('📝 Criando tabela user_profiles...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status BOOLEAN DEFAULT true,
      clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
      timezone TEXT DEFAULT 'America/Sao_Paulo',
      language TEXT DEFAULT 'pt-BR',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(user_id)
    );
    
    -- Índices
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
  
  if (error) {
    console.error('❌ Erro ao criar tabela:', error);
    throw error;
  }
  
  console.log('✅ Tabela user_profiles criada com sucesso');
}

async function checkAndFixRLSPolicies() {
  console.log('🔧 Verificando e corrigindo políticas RLS...');
  
  // Desabilitar RLS temporariamente
  const { error: disableError } = await supabase.rpc('exec_sql', {
    sql_query: 'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;'
  });

  if (disableError) {
    console.log('⚠️ Erro ao desabilitar RLS (pode ser normal):', disableError.message);
  }

  // Remover políticas existentes
  const policiesToDrop = [
    'Users can view own profile',
    'Users can update own profile',
    'Users can insert own profile',
    'Enable read access for authenticated users',
    'Enable insert for authenticated users',
    'Enable update for users based on user_id',
    'Enable delete for users based on user_id',
    'Enable all access for authenticated users',
    'Admin Lify can manage all profiles',
    'user_profiles_simple_policy',
    'user_profiles_policy'
  ];

  for (const policy of policiesToDrop) {
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql_query: `DROP POLICY IF EXISTS "${policy}" ON public.user_profiles;`
    });
    
    if (dropError) {
      console.log(`⚠️ Erro ao remover política ${policy}:`, dropError.message);
    }
  }

  // Criar novas políticas
  const newPolicies = [
    {
      name: 'user_profiles_read_policy',
      sql: 'CREATE POLICY "user_profiles_read_policy" ON public.user_profiles FOR SELECT USING (auth.role() = \'authenticated\');'
    },
    {
      name: 'user_profiles_insert_policy',
      sql: 'CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles FOR INSERT WITH CHECK (auth.role() = \'authenticated\');'
    },
    {
      name: 'user_profiles_update_policy',
      sql: 'CREATE POLICY "user_profiles_update_policy" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);'
    },
    {
      name: 'user_profiles_delete_policy',
      sql: 'CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);'
    }
  ];

  for (const policy of newPolicies) {
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: policy.sql
    });
    
    if (createError) {
      console.log(`⚠️ Erro ao criar política ${policy.name}:`, createError.message);
    } else {
      console.log(`✅ Política ${policy.name} criada`);
    }
  }

  // Reabilitar RLS
  const { error: enableError } = await supabase.rpc('exec_sql', {
    sql_query: 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;'
  });

  if (enableError) {
    console.log('⚠️ Erro ao reabilitar RLS:', enableError.message);
  } else {
    console.log('✅ RLS reabilitado');
  }
}

async function createMissingProfiles() {
  console.log('👥 Criando perfis para usuários existentes...');
  
  // Buscar usuários sem perfil
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError);
    return;
  }

  const confirmedUsers = users.users.filter(user => user.email_confirmed_at);
  console.log(`📊 Usuários confirmados encontrados: ${confirmedUsers.length}`);

  for (const user of confirmedUsers) {
    try {
      // Verificar se já tem perfil
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Determinar role baseado no email
        let role = 'user';
        if (user.email === 'lucasdmc@lify.com' || user.email === 'paulo@lify.com') {
          role = 'admin_lify';
        } else if (user.email === 'atende1@lify.com') {
          role = 'atendente';
        }

        // Criar perfil
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            role: role,
            status: true
          });

        if (createError) {
          console.error(`❌ Erro ao criar perfil para ${user.email}:`, createError);
        } else {
          console.log(`✅ Perfil criado para ${user.email} (${role})`);
        }
      } else {
        console.log(`✅ Perfil já existe para ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar usuário ${user.email}:`, error);
    }
  }
}

// Executar o script
checkAndFixUserProfiles()
  .then(() => {
    console.log('🎉 Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  }); 