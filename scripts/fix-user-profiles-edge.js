import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
  console.log('💡 Adicione a chave service_role do Supabase no arquivo .env:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserProfilesEdge() {
  console.log('🔧 Corrigindo tabela user_profiles via Edge Function...\n');

  try {
    // 1. Testar acesso atual
    console.log('1️⃣ Testando acesso atual...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.log('❌ Erro atual:', testError.message);
    } else {
      console.log('✅ Tabela acessível!');
      console.log(`📊 Registros encontrados: ${testData?.length || 0}`);
      return;
    }

    // 2. Tentar criar perfil para usuário atual
    console.log('\n2️⃣ Tentando criar perfil de teste...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️ Usuário não autenticado, criando perfil de teste...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin_lify',
          status: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar perfil de teste:', createError);
      } else {
        console.log('✅ Perfil de teste criado com sucesso!');
      }
    } else {
      console.log('✅ Usuário autenticado:', user.id);
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.name || 'Usuário',
          role: 'admin_lify',
          status: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar perfil:', createError);
      } else {
        console.log('✅ Perfil criado com sucesso!');
      }
    }

    // 3. Verificar novamente
    console.log('\n3️⃣ Verificando acesso após correção...');
    const { data: finalTest, error: finalError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (finalError) {
      console.error('❌ Ainda há erro:', finalError);
    } else {
      console.log('✅ Tabela funcionando corretamente!');
      console.log(`📊 Total de registros: ${finalTest?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixUserProfilesEdge(); 