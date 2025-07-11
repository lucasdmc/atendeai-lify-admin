#!/usr/bin/env node

/**
 * Script para ativar a clínica inativa
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

console.log('🏥 ATIVANDO CLÍNICA INATIVA\n');

async function activateClinic() {
  try {
    // 1. Verificar clínicas inativas
    console.log('1️⃣ Verificando clínicas inativas...');
    const { data: inactiveClinics, error: inactiveError } = await supabase
      .from('clinics')
      .select('*')
      .eq('is_active', false);

    if (inactiveError) {
      console.error('❌ Erro ao buscar clínicas inativas:', inactiveError);
      return;
    }

    console.log(`📊 Clínicas inativas encontradas: ${inactiveClinics?.length || 0}`);

    if (!inactiveClinics || inactiveClinics.length === 0) {
      console.log('✅ Não há clínicas inativas para ativar');
      return;
    }

    // 2. Ativar a primeira clínica inativa
    const clinicToActivate = inactiveClinics[0];
    console.log(`2️⃣ Ativando clínica: ${clinicToActivate.name} (ID: ${clinicToActivate.id})`);

    const { data: updatedClinic, error: updateError } = await supabase
      .from('clinics')
      .update({ is_active: true })
      .eq('id', clinicToActivate.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao ativar clínica:', updateError);
      
      // Se der erro de RLS, tentar uma abordagem diferente
      if (updateError.code === '42501') {
        console.log('⚠️ Erro de RLS detectado. Tentando abordagem alternativa...');
        
        // Verificar se há clínicas ativas
        const { data: activeClinics, error: activeError } = await supabase
          .from('clinics')
          .select('*')
          .eq('is_active', true);

        if (activeError) {
          console.error('❌ Erro ao verificar clínicas ativas:', activeError);
        } else {
          console.log(`📊 Clínicas ativas: ${activeClinics?.length || 0}`);
          
          if (activeClinics && activeClinics.length > 0) {
            console.log('✅ Já existe pelo menos uma clínica ativa');
            console.log(`📋 Clínica ativa: ${activeClinics[0].name}`);
          } else {
            console.log('🚨 Nenhuma clínica ativa encontrada');
            console.log('💡 Você precisa ativar manualmente pelo painel do Supabase');
          }
        }
      }
      return;
    }

    console.log('✅ Clínica ativada com sucesso!');
    console.log(`📋 Nome: ${updatedClinic.name}`);
    console.log(`🆔 ID: ${updatedClinic.id}`);
    console.log(`✅ Status: ${updatedClinic.is_active ? 'Ativa' : 'Inativa'}`);

    // 3. Verificar se agora há clínicas ativas
    console.log('\n3️⃣ Verificando clínicas ativas...');
    const { data: activeClinics, error: activeError } = await supabase
      .from('clinics')
      .select('*')
      .eq('is_active', true);

    if (activeError) {
      console.error('❌ Erro ao verificar clínicas ativas:', activeError);
    } else {
      console.log(`📊 Total de clínicas ativas: ${activeClinics?.length || 0}`);
      
      if (activeClinics && activeClinics.length > 0) {
        console.log('\n🎉 SUCESSO!');
        console.log('✅ Agora há clínicas ativas no sistema');
        console.log('💡 Recarregue a página do frontend');
        console.log('💡 O erro 400 deve desaparecer');
        console.log('💡 O QR Code do WhatsApp deve funcionar');
      }
    }

  } catch (error) {
    console.error('❌ Erro durante ativação:', error);
  }
}

// Executar ativação
activateClinic(); 