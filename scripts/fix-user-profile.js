import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserProfile() {
  console.log('🔧 Verificando e corrigindo perfil do usuário...\n');

  try {
    // 1. Buscar usuário no Auth
    console.log('1️⃣ Buscando usuário no Auth...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError);
      return;
    }

    const user = users.find(u => u.email === 'lucasdmc@lify.com');
    if (!user) {
      console.error('❌ Usuário lucasdmc@lify.com não encontrado no Auth');
      return;
    }

    console.log('✅ Usuário encontrado no Auth:', user.id);

    // 2. Verificar se existe perfil
    console.log('\n2️⃣ Verificando perfil na tabela user_profiles...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar perfil:', profileError);
      return;
    }

    if (profile) {
      console.log('✅ Perfil já existe:', profile);
      return;
    }

    // 3. Criar perfil
    console.log('\n3️⃣ Criando perfil...');
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'Lucas DMC',
        role: 'admin_lify',
        status: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar perfil:', createError);
      return;
    }

    console.log('✅ Perfil criado com sucesso:', newProfile);

    // 4. Verificar se a tabela user_profiles existe
    console.log('\n4️⃣ Verificando estrutura da tabela user_profiles...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela user_profiles:', tableError);
      console.log('📋 Criando tabela user_profiles...');
      
      // Tentar criar a tabela
      const { error: createTableError } = await supabase.rpc('create_user_profiles_table');
      if (createTableError) {
        console.error('❌ Erro ao criar tabela:', createTableError);
      } else {
        console.log('✅ Tabela user_profiles criada');
      }
    } else {
      console.log('✅ Tabela user_profiles existe e está acessível');
    }

    console.log('\n🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixUserProfile(); 