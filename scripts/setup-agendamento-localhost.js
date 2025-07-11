import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
  console.log('💡 Execute: export SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key');
  console.log('📋 Você pode encontrar a service role key em:');
  console.log('   Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAgendamentoLocalhost() {
  console.log('🚀 Configurando sistema de agendamento para localhost...\n');

  try {
    // 1. Ler o arquivo SQL
    console.log('1️⃣ Lendo arquivo SQL...');
    const sqlPath = path.join(__dirname, 'setup-agendamento-tables.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Arquivo setup-agendamento-tables.sql não encontrado');
      return;
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('   ✅ Arquivo SQL lido com sucesso');

    // 2. Executar o SQL
    console.log('\n2️⃣ Executando SQL...');
    
    // Dividir o SQL em comandos separados
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`   📝 Executando comando ${i + 1}/${commands.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: command });
          
          if (error) {
            console.log(`   ⚠️  Comando ${i + 1} (pode ser ignorado): ${error.message}`);
          } else {
            console.log(`   ✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (err) {
          console.log(`   ⚠️  Comando ${i + 1} (pode ser ignorado): ${err.message}`);
        }
      }
    }

    // 3. Verificar se as tabelas foram criadas
    console.log('\n3️⃣ Verificando tabelas criadas...');
    
    const tables = [
      'appointment_sessions',
      'appointment_steps', 
      'appointments',
      'services',
      'professionals'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ Tabela ${table}: ${err.message}`);
      }
    }

    // 4. Inserir dados de exemplo
    console.log('\n4️⃣ Inserindo dados de exemplo...');
    
    // Inserir serviços
    const services = [
      { name: 'Consulta Médica', duration: 30, price: 150.00 },
      { name: 'Exame de Sangue', duration: 15, price: 80.00 },
      { name: 'Fisioterapia', duration: 60, price: 120.00 }
    ];

    for (const service of services) {
      try {
        const { error } = await supabase
          .from('services')
          .insert(service);
        
        if (error) {
          console.log(`   ⚠️  Serviço ${service.name}: ${error.message}`);
        } else {
          console.log(`   ✅ Serviço ${service.name} inserido`);
        }
      } catch (err) {
        console.log(`   ⚠️  Serviço ${service.name}: ${err.message}`);
      }
    }

    // Inserir profissionais
    const professionals = [
      { name: 'Dr. João Silva', specialty: 'Clínico Geral', phone: '5511999999999' },
      { name: 'Dra. Maria Santos', specialty: 'Cardiologia', phone: '5511888888888' },
      { name: 'Dr. Pedro Costa', specialty: 'Fisioterapia', phone: '5511777777777' }
    ];

    for (const professional of professionals) {
      try {
        const { error } = await supabase
          .from('professionals')
          .insert(professional);
        
        if (error) {
          console.log(`   ⚠️  Profissional ${professional.name}: ${error.message}`);
        } else {
          console.log(`   ✅ Profissional ${professional.name} inserido`);
        }
      } catch (err) {
        console.log(`   ⚠️  Profissional ${professional.name}: ${err.message}`);
      }
    }

    console.log('\n🎉 Configuração concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Abra http://localhost:8080 no navegador');
    console.log('2. Faça login com Google');
    console.log('3. Vá para Agendamentos > Conectar WhatsApp');
    console.log('4. Escaneie o QR Code');
    console.log('5. Envie mensagens para testar o agendamento');
    console.log('\n💡 Para testar o sistema:');
    console.log('   node scripts/test-agendamento-localhost.js');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  }
}

// Executar a configuração
setupAgendamentoLocalhost(); 