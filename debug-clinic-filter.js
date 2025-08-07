import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugClinicFilter() {
  console.log('🔍 DEBUGANDO FILTRO DE CLÍNICA');
  console.log('================================');

  try {
    // 1. Verificar todas as conversas sem filtro
    console.log('🔍 Buscando TODAS as conversas (sem filtro)...');
    const { data: allConversations, error: allError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (allError) {
      console.error('❌ Erro ao buscar todas as conversas:', allError);
      return;
    }

    console.log('✅ Total de conversas (sem filtro):', allConversations.length);
    allConversations.forEach((conv, index) => {
      const date = new Date(conv.last_message_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Clinic ID: ${conv.clinic_id} | Última: ${conv.last_message_preview}`);
    });

    // 2. Verificar clínicas disponíveis (sem whatsapp_number)
    console.log('\n🔍 Buscando clínicas disponíveis...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name')
      .order('name');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log('✅ Clínicas disponíveis:', clinics.length);
    clinics.forEach((clinic, index) => {
      console.log(`   ${index + 1}. ID: ${clinic.id} | Nome: ${clinic.name}`);
    });

    // 3. Verificar números de WhatsApp das clínicas
    console.log('\n🔍 Buscando números de WhatsApp das clínicas...');
    const { data: clinicNumbers, error: numbersError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('clinic_id, whatsapp_number, is_active')
      .order('whatsapp_number');

    if (numbersError) {
      console.error('❌ Erro ao buscar números de WhatsApp:', numbersError);
      return;
    }

    console.log('✅ Números de WhatsApp das clínicas:', clinicNumbers.length);
    clinicNumbers.forEach((number, index) => {
      console.log(`   ${index + 1}. Clinic ID: ${number.clinic_id} | WhatsApp: ${number.whatsapp_number} | Ativo: ${number.is_active}`);
    });

    // 4. Verificar conversas com filtro por clínica específica
    if (clinics.length > 0) {
      const firstClinicId = clinics[0].id;
      console.log(`\n🔍 Buscando conversas da clínica: ${firstClinicId}`);
      
      const { data: filteredConversations, error: filteredError } = await supabase
        .from('whatsapp_conversations_improved')
        .select('*')
        .eq('clinic_id', firstClinicId)
        .order('last_message_at', { ascending: false });

      if (filteredError) {
        console.error('❌ Erro ao buscar conversas filtradas:', filteredError);
        return;
      }

      console.log(`✅ Conversas da clínica ${firstClinicId}:`, filteredConversations.length);
      filteredConversations.forEach((conv, index) => {
        const date = new Date(conv.last_message_at);
        console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview}`);
      });
    }

    // 5. Verificar conversas sem clinic_id
    console.log('\n🔍 Buscando conversas SEM clinic_id...');
    const { data: noClinicConversations, error: noClinicError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .is('clinic_id', null)
      .order('last_message_at', { ascending: false });

    if (noClinicError) {
      console.error('❌ Erro ao buscar conversas sem clínica:', noClinicError);
      return;
    }

    console.log('✅ Conversas sem clinic_id:', noClinicConversations.length);
    noClinicConversations.forEach((conv, index) => {
      const date = new Date(conv.last_message_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview}`);
    });

    // 6. Análise final
    console.log('\n🎯 ANÁLISE FINAL:');
    console.log('==================');
    
    const conversationWithYourNumber = allConversations.find(conv => 
      conv.patient_phone_number === '5547997192447'
    );

    if (conversationWithYourNumber) {
      console.log('✅ Conversa do seu número encontrada');
      console.log('📋 Dados da conversa:', {
        id: conversationWithYourNumber.id,
        patient_phone: conversationWithYourNumber.patient_phone_number,
        clinic_whatsapp: conversationWithYourNumber.clinic_whatsapp_number,
        clinic_id: conversationWithYourNumber.clinic_id,
        last_message: conversationWithYourNumber.last_message_preview
      });

      if (conversationWithYourNumber.clinic_id) {
        console.log('✅ Conversa tem clinic_id:', conversationWithYourNumber.clinic_id);
        
        // Verificar se a clínica existe
        const clinicExists = clinics.find(c => c.id === conversationWithYourNumber.clinic_id);
        if (clinicExists) {
          console.log('✅ Clínica existe:', clinicExists.name);
          
          // Verificar se há conversas filtradas por esta clínica
          const { data: filteredByClinic, error: filterError } = await supabase
            .from('whatsapp_conversations_improved')
            .select('*')
            .eq('clinic_id', conversationWithYourNumber.clinic_id)
            .order('last_message_at', { ascending: false });

          if (filterError) {
            console.error('❌ Erro ao buscar conversas filtradas:', filterError);
            return;
          }

          console.log(`✅ Conversas filtradas por clínica ${conversationWithYourNumber.clinic_id}:`, filteredByClinic.length);
          if (filteredByClinic.length > 0) {
            console.log('✅ A conversa DEVE aparecer na tela');
            console.log('🔧 PROBLEMA: Pode ser na interface ou no contexto');
          } else {
            console.log('❌ Nenhuma conversa encontrada com filtro');
          }
        } else {
          console.log('❌ Clínica NÃO existe para o clinic_id:', conversationWithYourNumber.clinic_id);
        }
      } else {
        console.log('❌ Conversa NÃO tem clinic_id');
        console.log('🔧 POSSÍVEIS CAUSAS:');
        console.log('   1. Webhook não está salvando clinic_id corretamente');
        console.log('   2. Clínica não foi encontrada no webhook');
        console.log('   3. Problema na estrutura de dados');
      }
    } else {
      console.log('❌ Conversa do seu número NÃO encontrada');
    }

  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
}

debugClinicFilter(); 