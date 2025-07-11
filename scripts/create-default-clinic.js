#!/usr/bin/env node

/**
 * Script para criar clínica padrão e resolver problemas
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

console.log('🏥 CRIANDO CLÍNICA PADRÃO E RESOLVENDO PROBLEMAS\n');

async function createDefaultClinic() {
  try {
    // 1. Verificar se já existe alguma clínica
    console.log('1️⃣ Verificando clínicas existentes...');
    const { data: existingClinics, error: checkError } = await supabase
      .from('clinics')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar clínicas:', checkError);
      return;
    }

    if (existingClinics && existingClinics.length > 0) {
      console.log('✅ Já existe pelo menos uma clínica no sistema');
      console.log(`📋 Clínica encontrada: ${existingClinics[0].name}`);
      return;
    }

    // 2. Criar clínica padrão
    console.log('2️⃣ Criando clínica padrão...');
    const defaultClinic = {
      name: 'Clínica Padrão',
      cnpj: '00.000.000/0001-00',
      email: 'contato@clinicapadrao.com',
      phone: '(11) 99999-9999',
      address: 'Rua das Clínicas, 123',
      city: 'São Paulo',
      state: 'SP',
      website: 'https://clinicapadrao.com',
      is_active: true,
      business_hours: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '08:00', end: '12:00' },
        sunday: { start: null, end: null }
      },
      specialties: ['Clínica Geral', 'Pediatria', 'Ginecologia'],
      payment_methods: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'],
      emergency_contacts: {
        phone: '(11) 99999-8888',
        email: 'emergencia@clinicapadrao.com'
      },
      admin_notes: 'Clínica padrão criada automaticamente pelo sistema',
      brand_color: '#FF6B35',
      language: 'pt-BR'
    };

    const { data: newClinic, error: createError } = await supabase
      .from('clinics')
      .insert([defaultClinic])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar clínica:', createError);
      return;
    }

    console.log('✅ Clínica padrão criada com sucesso!');
    console.log(`📋 Nome: ${newClinic.name}`);
    console.log(`🆔 ID: ${newClinic.id}`);

    // 3. Verificar se a tabela clinic_users existe
    console.log('3️⃣ Verificando tabela clinic_users...');
    const { data: clinicUsersTest, error: clinicUsersError } = await supabase
      .from('clinic_users')
      .select('*')
      .limit(1);

    if (clinicUsersError && clinicUsersError.code === '42P01') {
      console.log('⚠️ Tabela clinic_users não existe - criando...');
      
      // Criar migration para clinic_users
      const migrationContent = `
-- Criar tabela clinic_users para associação usuário-clínica
CREATE TABLE IF NOT EXISTS clinic_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, clinic_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_clinic_users_user_id ON clinic_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic_id ON clinic_users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_is_active ON clinic_users(is_active);

-- Adicionar comentários
COMMENT ON TABLE clinic_users IS 'Associação entre usuários e clínicas';
COMMENT ON COLUMN clinic_users.role IS 'Papel do usuário na clínica: admin, gestor, atendente, user';
      `;

      console.log('📝 Migration criada para clinic_users');
      console.log('💡 Execute: supabase db push para aplicar a migration');
    } else {
      console.log('✅ Tabela clinic_users existe');
    }

    // 4. Criar agente padrão para a clínica
    console.log('4️⃣ Criando agente padrão...');
    const defaultAgent = {
      name: 'Assistente Virtual',
      description: 'Assistente virtual padrão da clínica',
      personality: 'profissional e acolhedor',
      temperature: 0.7,
      clinic_id: newClinic.id,
      is_active: true,
      context_json: JSON.stringify({
        servicos: ['consulta', 'exame'],
        horarios: '8h-18h',
        especialidades: ['clínica geral', 'pediatria'],
        informacoes: {
          nome: 'Clínica Padrão',
          telefone: '(11) 99999-9999',
          endereco: 'Rua das Clínicas, 123 - São Paulo/SP'
        }
      }, null, 2),
      whatsapp_number: null,
      is_whatsapp_connected: false
    };

    const { data: newAgent, error: agentError } = await supabase
      .from('agents')
      .insert([defaultAgent])
      .select()
      .single();

    if (agentError) {
      console.error('❌ Erro ao criar agente:', agentError);
    } else {
      console.log('✅ Agente padrão criado com sucesso!');
      console.log(`🤖 Nome: ${newAgent.name}`);
    }

    // 5. Criar conexão WhatsApp padrão
    console.log('5️⃣ Criando conexão WhatsApp padrão...');
    const defaultWhatsAppConnection = {
      clinic_id: newClinic.id,
      phone_number: '+5511999999999',
      is_active: true,
      qr_code_scanned_at: new Date().toISOString()
    };

    const { data: newWhatsAppConnection, error: whatsappError } = await supabase
      .from('whatsapp_connections')
      .insert([defaultWhatsAppConnection])
      .select()
      .single();

    if (whatsappError) {
      console.error('❌ Erro ao criar conexão WhatsApp:', whatsappError);
    } else {
      console.log('✅ Conexão WhatsApp padrão criada!');
      console.log(`📱 Número: ${newWhatsAppConnection.phone_number}`);
    }

    console.log('\n🎉 CONFIGURAÇÃO PADRÃO CONCLUÍDA!');
    console.log('\n📋 RESUMO DO QUE FOI CRIADO:');
    console.log(`✅ Clínica: ${newClinic.name} (ID: ${newClinic.id})`);
    console.log(`✅ Agente: ${newAgent?.name || 'Erro ao criar'}`);
    console.log(`✅ WhatsApp: ${newWhatsAppConnection?.phone_number || 'Erro ao criar'}`);
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Execute: supabase db push (se a tabela clinic_users não existir)');
    console.log('2. Recarregue a página do sistema');
    console.log('3. O erro 400 deve ser resolvido');
    console.log('4. O QR Code deve funcionar normalmente');

  } catch (error) {
    console.error('❌ Erro durante configuração:', error);
  }
}

// Executar configuração
createDefaultClinic(); 