import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Ausente');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurado' : '❌ Ausente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalFixes() {
  console.log('🔧 Testando correções finais...\n');

  try {
    // 1. Testar carregamento de clínicas
    console.log('1️⃣ Testando carregamento de clínicas...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .order('name');

    if (clinicsError) {
      console.error('❌ Erro ao carregar clínicas:', clinicsError.message);
    } else {
      console.log(`✅ Clínicas carregadas: ${clinics?.length || 0}`);
      if (clinics && clinics.length > 0) {
        console.log('   Primeira clínica:', clinics[0].name);
      }
    }

    // 2. Testar estrutura da tabela clinics
    console.log('\n2️⃣ Testando estrutura da tabela clinics...');
    if (clinics && clinics.length > 0) {
      const clinic = clinics[0];
      console.log('   Campos disponíveis:', Object.keys(clinic));
      
      // Verificar campos obrigatórios
      const requiredFields = ['id', 'name', 'created_by', 'created_at', 'updated_at'];
      const missingFields = requiredFields.filter(field => !(field in clinic));
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️  Campos ausentes: ${missingFields.join(', ')}`);
      } else {
        console.log('   ✅ Todos os campos obrigatórios presentes');
      }
    }

    // 3. Testar tabela whatsapp_connections
    console.log('\n3️⃣ Testando tabela whatsapp_connections...');
    const { data: connections, error: connectionsError } = await supabase
      .from('whatsapp_connections')
      .select('*');

    if (connectionsError) {
      console.log('   ⚠️  Tabela whatsapp_connections não existe ou erro:', connectionsError.message);
    } else {
      console.log(`   ✅ Conexões WhatsApp: ${connections?.length || 0}`);
    }

    // 4. Testar tabela agents
    console.log('\n4️⃣ Testando tabela agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*');

    if (agentsError) {
      console.log('   ⚠️  Tabela agents não existe ou erro:', agentsError.message);
    } else {
      console.log(`   ✅ Agentes: ${agents?.length || 0}`);
      if (agents && agents.length > 0) {
        console.log('   Campos do agente:', Object.keys(agents[0]));
      }
    }

    // 5. Testar tabela clinic_users
    console.log('\n5️⃣ Testando tabela clinic_users...');
    const { data: clinicUsers, error: clinicUsersError } = await supabase
      .from('clinic_users')
      .select('*');

    if (clinicUsersError) {
      console.log('   ⚠️  Tabela clinic_users não existe ou erro:', clinicUsersError.message);
    } else {
      console.log(`   ✅ Associações usuário-clínica: ${clinicUsers?.length || 0}`);
    }

    // 6. Verificar migrations aplicadas
    console.log('\n6️⃣ Verificando migrations...');
    const { data: migrations, error: migrationsError } = await supabase
      .from('schema_migrations')
      .select('*')
      .order('version', { ascending: false })
      .limit(10);

    if (migrationsError) {
      console.log('   ⚠️  Não foi possível verificar migrations:', migrationsError.message);
    } else {
      console.log('   Últimas migrations aplicadas:');
      migrations?.forEach(migration => {
        console.log(`   - ${migration.version}`);
      });
    }

    console.log('\n✅ Teste finalizado!');
    console.log('\n📋 Resumo das correções implementadas:');
    console.log('   ✅ Interface Clinic centralizada');
    console.log('   ✅ Hook WhatsApp corrigido para tratar ausência de conexão');
    console.log('   ✅ QRCodeDisplay atualizado com novo estado');
    console.log('   ✅ ClinicContext corrigido');
    console.log('   ✅ ClinicSelector atualizado');
    console.log('   ✅ Página de clínicas corrigida');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testFinalFixes(); 