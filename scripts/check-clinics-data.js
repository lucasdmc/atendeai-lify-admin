#!/usr/bin/env node

/**
 * Script para verificar dados de clínicas no banco
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 VERIFICANDO DADOS DE CLÍNICAS NO BANCO\n');

async function checkClinicsData() {
  try {
    // 1. Verificar se a tabela clinics existe
    console.log('1️⃣ Verificando tabela clinics...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .limit(5);

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Tabela clinics existe`);
    console.log(`📊 Total de clínicas encontradas: ${clinics?.length || 0}`);

    if (clinics && clinics.length > 0) {
      console.log('\n📋 Clínicas encontradas:');
      clinics.forEach((clinic, index) => {
        console.log(`${index + 1}. ${clinic.name} (ID: ${clinic.id})`);
        console.log(`   - Ativa: ${clinic.is_active ? 'Sim' : 'Não'}`);
        console.log(`   - Email: ${clinic.email || 'Não informado'}`);
        console.log(`   - Telefone: ${clinic.phone || 'Não informado'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ Nenhuma clínica encontrada no banco');
      console.log('💡 Você precisa criar pelo menos uma clínica para usar o sistema');
    }

    // 2. Verificar tabela clinic_users
    console.log('2️⃣ Verificando tabela clinic_users...');
    const { data: clinicUsers, error: clinicUsersError } = await supabase
      .from('clinic_users')
      .select('*')
      .limit(5);

    if (clinicUsersError) {
      console.error('❌ Erro ao buscar clinic_users:', clinicUsersError);
    } else {
      console.log(`📊 Total de associações clinic_users: ${clinicUsers?.length || 0}`);
    }

    // 3. Verificar tabela users
    console.log('3️⃣ Verificando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro ao buscar users:', usersError);
    } else {
      console.log(`📊 Total de usuários: ${users?.length || 0}`);
    }

    // 4. Verificar tabela agents
    console.log('4️⃣ Verificando tabela agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(5);

    if (agentsError) {
      console.error('❌ Erro ao buscar agents:', agentsError);
    } else {
      console.log(`📊 Total de agentes: ${agents?.length || 0}`);
    }

    // 5. Verificar tabela whatsapp_connections
    console.log('5️⃣ Verificando tabela whatsapp_connections...');
    const { data: whatsappConnections, error: whatsappError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .limit(5);

    if (whatsappError) {
      console.error('❌ Erro ao buscar whatsapp_connections:', whatsappError);
    } else {
      console.log(`📊 Total de conexões WhatsApp: ${whatsappConnections?.length || 0}`);
    }

    console.log('\n📋 RESUMO:');
    console.log(`✅ Tabela clinics: ${clinics?.length || 0} registros`);
    console.log(`✅ Tabela clinic_users: ${clinicUsers?.length || 0} registros`);
    console.log(`✅ Tabela users: ${users?.length || 0} registros`);
    console.log(`✅ Tabela agents: ${agents?.length || 0} registros`);
    console.log(`✅ Tabela whatsapp_connections: ${whatsappConnections?.length || 0} registros`);

    if (!clinics || clinics.length === 0) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO:');
      console.log('Não há clínicas cadastradas no banco de dados.');
      console.log('Isso está causando o erro 400 ao carregar clínicas.');
      console.log('\n💡 SOLUÇÃO:');
      console.log('1. Acesse a seção "Clínicas" no sistema');
      console.log('2. Clique em "Nova Clínica"');
      console.log('3. Crie pelo menos uma clínica');
      console.log('4. Ou execute o script de criação de clínica padrão');
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkClinicsData(); 