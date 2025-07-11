#!/usr/bin/env node

/**
 * Script para criar clínica simples
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

console.log('🏥 CRIANDO CLÍNICA SIMPLES\n');

async function createSimpleClinic() {
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

    // 2. Criar clínica simples (apenas campos básicos)
    console.log('2️⃣ Criando clínica simples...');
    const simpleClinic = {
      name: 'Clínica Padrão',
      cnpj: '00.000.000/0001-00',
      email: 'contato@clinicapadrao.com',
      phone: '(11) 99999-9999',
      address: 'Rua das Clínicas, 123',
      city: 'São Paulo',
      state: 'SP',
      website: 'https://clinicapadrao.com',
      is_active: true
    };

    const { data: newClinic, error: createError } = await supabase
      .from('clinics')
      .insert([simpleClinic])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar clínica:', createError);
      return;
    }

    console.log('✅ Clínica simples criada com sucesso!');
    console.log(`📋 Nome: ${newClinic.name}`);
    console.log(`🆔 ID: ${newClinic.id}`);

    // 3. Criar agente padrão para a clínica
    console.log('3️⃣ Criando agente padrão...');
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

    // 4. Criar conexão WhatsApp padrão
    console.log('4️⃣ Criando conexão WhatsApp padrão...');
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

    console.log('\n🎉 CONFIGURAÇÃO SIMPLES CONCLUÍDA!');
    console.log('\n📋 RESUMO DO QUE FOI CRIADO:');
    console.log(`✅ Clínica: ${newClinic.name} (ID: ${newClinic.id})`);
    console.log(`✅ Agente: ${newAgent?.name || 'Erro ao criar'}`);
    console.log(`✅ WhatsApp: ${newWhatsAppConnection?.phone_number || 'Erro ao criar'}`);
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Recarregue a página do sistema');
    console.log('2. O erro 400 deve ser resolvido');
    console.log('3. O QR Code deve funcionar normalmente');
    console.log('4. Execute: supabase db push para aplicar migrations pendentes');

  } catch (error) {
    console.error('❌ Erro durante configuração:', error);
  }
}

// Executar configuração
createSimpleClinic(); 