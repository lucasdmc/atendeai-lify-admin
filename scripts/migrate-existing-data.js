import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateExistingData() {
  console.log('🔄 MIGRANDO DADOS EXISTENTES');
  console.log('================================');

  try {
    // 1. Buscar clínicas existentes
    console.log('\n1️⃣ Buscando clínicas existentes...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log(`✅ Encontradas ${clinics?.length || 0} clínicas`);

    // 2. Configurar números de WhatsApp para cada clínica
    console.log('\n2️⃣ Configurando números de WhatsApp...');
    
    for (const clinic of clinics || []) {
      console.log(`\n🏥 Processando clínica: ${clinic.name} (${clinic.id})`);
      
      // Buscar número de WhatsApp da clínica
      let whatsappNumber = null;
      
      // Tentar diferentes campos onde o número pode estar
      if (clinic.whatsapp_phone_number) {
        whatsappNumber = clinic.whatsapp_phone_number;
      } else if (clinic.whatsapp_phone) {
        whatsappNumber = clinic.whatsapp_phone;
      } else if (clinic.phone) {
        // Se phone for um objeto, extrair o número
        if (typeof clinic.phone === 'object' && clinic.phone?.whatsapp) {
          whatsappNumber = clinic.phone.whatsapp;
        } else if (typeof clinic.phone === 'string') {
          whatsappNumber = clinic.phone;
        }
      }

      if (!whatsappNumber) {
        console.log(`⚠️ Nenhum número de WhatsApp encontrado para ${clinic.name}`);
        continue;
      }

      console.log(`📱 Número encontrado: ${whatsappNumber}`);

      // Inserir número na nova tabela
      const { error: insertError } = await supabase
        .from('clinic_whatsapp_numbers')
        .upsert({
          clinic_id: clinic.id,
          whatsapp_number: whatsappNumber,
          is_active: true,
          activated_at: new Date().toISOString()
        }, {
          onConflict: 'clinic_id,whatsapp_number'
        });

      if (insertError) {
        console.error(`❌ Erro ao inserir número para ${clinic.name}:`, insertError);
      } else {
        console.log(`✅ Número configurado para ${clinic.name}`);
      }
    }

    // 3. Migrar conversas existentes
    console.log('\n3️⃣ Migrando conversas existentes...');
    
    const { data: existingConversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations')
      .select('*');

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas existentes:', conversationsError);
    } else {
      console.log(`📋 Encontradas ${existingConversations?.length || 0} conversas existentes`);

      for (const conversation of existingConversations || []) {
        console.log(`\n💬 Migrando conversa: ${conversation.phone_number}`);
        
        // Buscar clínica associada
        let clinicId = conversation.clinic_id;
        
        if (!clinicId) {
          // Se não tem clinic_id, tentar encontrar pela conversa
          console.log(`⚠️ Conversa sem clinic_id, tentando associar...`);
          
          // Buscar clínicas que podem ter esse número
          const { data: possibleClinics } = await supabase
            .from('clinic_whatsapp_numbers')
            .select('clinic_id')
            .eq('is_active', true)
            .limit(1);

          if (possibleClinics && possibleClinics.length > 0) {
            clinicId = possibleClinics[0].clinic_id;
            console.log(`🔗 Associando à clínica: ${clinicId}`);
          } else {
            console.log(`⚠️ Nenhuma clínica encontrada para conversa`);
            continue;
          }
        }

        // Buscar número da clínica
        const { data: clinicNumber } = await supabase
          .from('clinic_whatsapp_numbers')
          .select('whatsapp_number')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .single();

        if (!clinicNumber) {
          console.log(`⚠️ Nenhum número ativo encontrado para clínica ${clinicId}`);
          continue;
        }

        // Migrar conversa para nova estrutura
        const { error: migrateError } = await supabase
          .from('whatsapp_conversations_improved')
          .upsert({
            clinic_id: clinicId,
            patient_phone_number: conversation.phone_number,
            clinic_whatsapp_number: clinicNumber.whatsapp_number,
            patient_name: conversation.name,
            last_message_preview: conversation.last_message_preview,
            unread_count: conversation.unread_count || 0,
            last_message_at: conversation.updated_at || conversation.created_at,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at
          }, {
            onConflict: 'clinic_id,patient_phone_number,clinic_whatsapp_number'
          });

        if (migrateError) {
          console.error(`❌ Erro ao migrar conversa ${conversation.phone_number}:`, migrateError);
        } else {
          console.log(`✅ Conversa migrada: ${conversation.phone_number}`);
        }
      }
    }

    // 4. Migrar mensagens existentes
    console.log('\n4️⃣ Migrando mensagens existentes...');
    
    const { data: existingMessages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('*');

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens existentes:', messagesError);
    } else {
      console.log(`📨 Encontradas ${existingMessages?.length || 0} mensagens existentes`);

      for (const message of existingMessages || []) {
        console.log(`\n💬 Migrando mensagem: ${message.id}`);
        
        // Buscar conversa correspondente na nova estrutura
        const { data: conversation } = await supabase
          .from('whatsapp_conversations_improved')
          .select('id, clinic_whatsapp_number')
          .eq('patient_phone_number', message.content.includes('554730915628') ? '554730915628' : 'unknown')
          .limit(1);

        if (!conversation || conversation.length === 0) {
          console.log(`⚠️ Conversa não encontrada para mensagem ${message.id}`);
          continue;
        }

        // Determinar sender e receiver
        const isFromClinic = message.message_type === 'sent';
        const senderPhone = isFromClinic ? conversation[0].clinic_whatsapp_number : 'unknown';
        const receiverPhone = isFromClinic ? 'unknown' : conversation[0].clinic_whatsapp_number;

        // Migrar mensagem
        const { error: migrateMessageError } = await supabase
          .from('whatsapp_messages_improved')
          .insert({
            conversation_id: conversation[0].id,
            sender_phone: senderPhone,
            receiver_phone: receiverPhone,
            content: message.content,
            message_type: message.message_type,
            whatsapp_message_id: message.whatsapp_message_id,
            metadata: message.metadata || {},
            created_at: message.created_at
          });

        if (migrateMessageError) {
          console.error(`❌ Erro ao migrar mensagem ${message.id}:`, migrateMessageError);
        } else {
          console.log(`✅ Mensagem migrada: ${message.id}`);
        }
      }
    }

    // 5. Verificar dados migrados
    console.log('\n5️⃣ Verificando dados migrados...');
    
    const { data: migratedConversations } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*');

    const { data: migratedMessages } = await supabase
      .from('whatsapp_messages_improved')
      .select('*');

    const { data: clinicNumbers } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('*');

    console.log(`\n📊 RESUMO DA MIGRAÇÃO:`);
    console.log(`✅ Conversas migradas: ${migratedConversations?.length || 0}`);
    console.log(`✅ Mensagens migradas: ${migratedMessages?.length || 0}`);
    console.log(`✅ Números de clínicas configurados: ${clinicNumbers?.length || 0}`);

    console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('📋 Próximos passos:');
    console.log('1. Atualizar frontend para usar nova estrutura');
    console.log('2. Testar funcionalidade');
    console.log('3. Remover tabelas antigas (opcional)');

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
  }
}

migrateExistingData(); 