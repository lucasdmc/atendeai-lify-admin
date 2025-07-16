import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncClinicsToTable() {
  try {
    console.log('🔄 Sincronizando clínicas com a tabela clinics...');
    
    // 1. Buscar todas as clínicas existentes na tabela clinics
    console.log('\n1️⃣ Buscando clínicas existentes na tabela clinics...');
    const { data: existingClinics, error: existingError } = await supabase
      .from('clinics')
      .select('id, name, address, phone, email, created_by, created_at, updated_at, timezone, language');

    if (existingError) {
      console.error('❌ Erro ao buscar clínicas existentes:', existingError);
      return;
    }

    console.log(`✅ Encontradas ${existingClinics.length} clínicas na tabela:`);
    existingClinics.forEach(clinic => {
      console.log(`   - ${clinic.name} (${clinic.id})`);
    });

    // 2. Buscar usuários para associar às clínicas
    console.log('\n2️⃣ Buscando usuários disponíveis...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role');

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuários:`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.role})`);
    });

    // 3. Verificar se há clínicas duplicadas ou com problemas
    console.log('\n3️⃣ Verificando integridade dos dados...');
    
    const clinicsByName = {};
    const duplicateNames = [];
    
    existingClinics.forEach(clinic => {
      if (clinicsByName[clinic.name]) {
        duplicateNames.push(clinic.name);
      } else {
        clinicsByName[clinic.name] = clinic;
      }
    });

    if (duplicateNames.length > 0) {
      console.log('⚠️  Clínicas com nomes duplicados encontradas:');
      duplicateNames.forEach(name => {
        const duplicates = existingClinics.filter(c => c.name === name);
        console.log(`   - "${name}" (${duplicates.length} ocorrências):`);
        duplicates.forEach(clinic => {
          console.log(`     * ${clinic.id} - criado em ${clinic.created_at}`);
        });
      });
    } else {
      console.log('✅ Nenhuma clínica duplicada encontrada');
    }

    // 4. Verificar clínicas sem usuário criador
    const clinicsWithoutCreator = existingClinics.filter(clinic => !clinic.created_by);
    if (clinicsWithoutCreator.length > 0) {
      console.log('\n⚠️  Clínicas sem usuário criador:');
      clinicsWithoutCreator.forEach(clinic => {
        console.log(`   - ${clinic.name} (${clinic.id})`);
      });
    } else {
      console.log('\n✅ Todas as clínicas têm usuário criador');
    }

    // 5. Verificar clínicas sem timezone ou language
    const clinicsWithoutTimezone = existingClinics.filter(clinic => !clinic.timezone);
    const clinicsWithoutLanguage = existingClinics.filter(clinic => !clinic.language);
    
    if (clinicsWithoutTimezone.length > 0) {
      console.log('\n⚠️  Clínicas sem timezone:');
      clinicsWithoutTimezone.forEach(clinic => {
        console.log(`   - ${clinic.name} (${clinic.id})`);
      });
    }
    
    if (clinicsWithoutLanguage.length > 0) {
      console.log('\n⚠️  Clínicas sem language:');
      clinicsWithoutLanguage.forEach(clinic => {
        console.log(`   - ${clinic.name} (${clinic.id})`);
      });
    }

    // 6. Sugerir melhorias
    console.log('\n4️⃣ Sugestões de melhorias:');
    
    if (existingClinics.length === 0) {
      console.log('   - Criar pelo menos uma clínica padrão');
    }
    
    if (clinicsWithoutCreator.length > 0 && users.length > 0) {
      console.log('   - Associar clínicas sem criador a um usuário padrão');
    }
    
    if (duplicateNames.length > 0) {
      console.log('   - Resolver nomes duplicados de clínicas');
    }

    // 7. Criar clínica padrão se não existir nenhuma
    if (existingClinics.length === 0) {
      console.log('\n5️⃣ Criando clínica padrão...');
      
      const defaultUserId = users.length > 0 ? users[0].id : '00000000-0000-0000-0000-000000000000';
      
      const { data: newClinic, error: createError } = await supabase
        .from('clinics')
        .insert({
          name: 'Clínica Padrão',
          address: {
            street: 'Endereço padrão',
            city: 'São Paulo',
            state: 'SP',
            country: 'Brasil',
            zipCode: '00000-000'
          },
          phone: {
            value: '(00) 0000-0000',
            type: 'principal'
          },
          email: {
            value: 'contato@clinica.com',
            type: 'principal'
          },
          created_by: defaultUserId,
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          working_hours: {
            monday: { open: '08:00', close: '18:00' },
            tuesday: { open: '08:00', close: '18:00' },
            wednesday: { open: '08:00', close: '18:00' },
            thursday: { open: '08:00', close: '18:00' },
            friday: { open: '08:00', close: '18:00' },
            saturday: { open: '08:00', close: '12:00' },
            sunday: { open: null, close: null }
          },
          specialties: ['Clínica Geral'],
          payment_methods: ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'],
          insurance_accepted: [],
          emergency_contact: {
            phone: '(00) 0000-0000',
            available: true
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar clínica padrão:', createError);
      } else {
        console.log('✅ Clínica padrão criada com sucesso:', newClinic.name);
      }
    }

    // 8. Associar agentes sem clínica à clínica padrão
    console.log('\n6️⃣ Associando agentes sem clínica...');
    
    const { data: agentsWithoutClinic, error: agentsError } = await supabase
      .from('agents')
      .select('id, name')
      .is('clinic_id', null);

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes sem clínica:', agentsError);
    } else if (agentsWithoutClinic.length > 0) {
      console.log(`⚠️  Encontrados ${agentsWithoutClinic.length} agentes sem clínica:`);
      agentsWithoutClinic.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.id})`);
      });

      // Buscar clínica padrão ou primeira clínica disponível
      const defaultClinic = existingClinics.find(c => c.name === 'Clínica Padrão') || existingClinics[0];
      
      if (defaultClinic) {
        console.log(`🔄 Associando agentes à clínica: ${defaultClinic.name}`);
        
        for (const agent of agentsWithoutClinic) {
          const { error: updateError } = await supabase
            .from('agents')
            .update({ clinic_id: defaultClinic.id })
            .eq('id', agent.id);
          
          if (updateError) {
            console.error(`❌ Erro ao associar ${agent.name}:`, updateError);
          } else {
            console.log(`✅ ${agent.name} associado com sucesso`);
          }
        }
      }
    } else {
      console.log('✅ Todos os agentes já têm clínica associada');
    }

    // 9. Resumo final
    console.log('\n📊 RESUMO DA SINCRONIZAÇÃO:');
    console.log(`   - Total de clínicas: ${existingClinics.length}`);
    console.log(`   - Clínicas com endereço: ${existingClinics.filter(c => c.address).length}`);
    console.log(`   - Clínicas com telefone: ${existingClinics.filter(c => c.phone).length}`);
    console.log(`   - Clínicas com email: ${existingClinics.filter(c => c.email).length}`);
    console.log(`   - Clínicas sem criador: ${clinicsWithoutCreator.length}`);
    console.log(`   - Nomes duplicados: ${duplicateNames.length}`);
    console.log(`   - Agentes sem clínica: ${agentsWithoutClinic?.length || 0}`);

    console.log('\n✅ Sincronização concluída!');

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  }
}

// Executar sincronização
syncClinicsToTable(); 