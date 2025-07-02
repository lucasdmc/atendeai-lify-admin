// Script para testar criação de usuário
// Execute: node scripts/test-user-creation.js

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

async function testUserCreation() {
  console.log('🧪 Testando criação de usuário...\n');

  try {
    // 1. Verificar estrutura da tabela user_profiles
    console.log('1️⃣ Verificando estrutura da tabela user_profiles...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela user_profiles:', tableError.message);
      return;
    }

    console.log('✅ Tabela user_profiles acessível');
    console.log('📊 Estrutura da tabela:', Object.keys(tableInfo[0] || {}));

    // 2. Verificar se há policies RLS
    console.log('\n2️⃣ Verificando policies RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'user_profiles' });

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar policies RLS:', policiesError.message);
    } else {
      console.log('✅ Policies RLS encontradas:', policies);
    }

    // 3. Testar criação de usuário no Auth
    console.log('\n3️⃣ Testando criação de usuário no Auth...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = '123456';
    const testName = 'Usuário Teste';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName
        }
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ Usuário não foi criado no Auth');
      return;
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id);

    // 4. Aguardar e verificar se o perfil foi criado
    console.log('\n4️⃣ Aguardando criação do perfil...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
      
      // 5. Tentar criar perfil manualmente
      console.log('\n5️⃣ Tentando criar perfil manualmente...');
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          email: testEmail,
          name: testName,
          role: 'atendente',
          status: true
        });

      if (insertError) {
        console.error('❌ Erro ao inserir perfil manualmente:', insertError.message);
        console.log('📋 Detalhes do erro:', insertError);
      } else {
        console.log('✅ Perfil criado manualmente com sucesso');
      }
    } else {
      console.log('✅ Perfil criado automaticamente:', profile);
    }

    // 6. Limpar dados de teste
    console.log('\n6️⃣ Limpando dados de teste...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
    
    if (deleteError) {
      console.log('⚠️ Não foi possível deletar usuário de teste:', deleteError.message);
    } else {
      console.log('✅ Usuário de teste deletado');
    }

    console.log('\n🎉 Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testUserCreation(); 