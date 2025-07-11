import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuth() {
  console.log('🔍 Testando autenticação...\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const { data: { user }, error: loginError } = await supabaseAuth.auth.signInWithPassword({
      email: 'lucasdmc@lify.com',
      password: 'lify@1234'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      return;
    }

    console.log('✅ Login realizado:', user.id);

    // 2. Obter token
    const { data: { session } } = await supabaseAuth.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      console.error('❌ Token não encontrado');
      return;
    }

    console.log('✅ Token obtido');

    // 3. Verificar token com Anon Key
    console.log('\n2️⃣ Verificando token com Anon Key...');
    const { data: { user: verifiedUser }, error: verifyError } = await supabaseAuth.auth.getUser(token);
    
    if (verifyError) {
      console.error('❌ Erro ao verificar token:', verifyError);
      return;
    }

    console.log('✅ Token verificado:', verifiedUser.id);

    // 4. Buscar perfil com Service Key
    console.log('\n3️⃣ Buscando perfil com Service Key...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', verifiedUser.id)
      .single();

    console.log('🔍 Buscando perfil para user_id:', verifiedUser.id);
    console.log('🔍 Resultado:', { profile, profileError });

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }

    if (!profile) {
      console.error('❌ Perfil não encontrado');
      return;
    }

    console.log('✅ Perfil encontrado:', profile);

    // 5. Verificar permissões
    const allowedRoles = ['admin_lify', 'suporte_lify'];
    if (!allowedRoles.includes(profile.role)) {
      console.error('❌ Role não permitido:', profile.role);
      return;
    }

    console.log('✅ Role permitido:', profile.role);

    console.log('\n🎉 Autenticação funcionando corretamente!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAuth(); 