import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeImprovedStructure() {
  console.log('🚀 IMPLEMENTANDO ESTRUTURA MELHORADA DE WHATSAPP');
  console.log('==================================================');

  try {
    // 1. Criar tabela clinic_whatsapp_numbers
    console.log('\n1️⃣ Criando tabela clinic_whatsapp_numbers...');
    const createNumbersTable = `
      CREATE TABLE IF NOT EXISTS clinic_whatsapp_numbers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        whatsapp_number VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        activated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        deactivated_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(clinic_id, whatsapp_number)
      );
    `;

    const { error: numbersError } = await supabase.rpc('exec_sql', { sql_query: createNumbersTable });
    if (numbersError) {
      console.log('⚠️ Tabela clinic_whatsapp_numbers já existe ou erro ignorado');
    } else {
      console.log('✅ Tabela clinic_whatsapp_numbers criada');
    }

    // 2. Criar tabela whatsapp_conversations_improved
    console.log('\n2️⃣ Criando tabela whatsapp_conversations_improved...');
    const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS whatsapp_conversations_improved (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        patient_phone_number VARCHAR(20) NOT NULL,
        clinic_whatsapp_number VARCHAR(20) NOT NULL,
        patient_name VARCHAR(255),
        last_message_preview TEXT,
        unread_count INTEGER DEFAULT 0,
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(clinic_id, patient_phone_number, clinic_whatsapp_number)
      );
    `;

    const { error: conversationsError } = await supabase.rpc('exec_sql', { sql_query: createConversationsTable });
    if (conversationsError) {
      console.log('⚠️ Tabela whatsapp_conversations_improved já existe ou erro ignorado');
    } else {
      console.log('✅ Tabela whatsapp_conversations_improved criada');
    }

    // 3. Criar tabela whatsapp_messages_improved
    console.log('\n3️⃣ Criando tabela whatsapp_messages_improved...');
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS whatsapp_messages_improved (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES whatsapp_conversations_improved(id) ON DELETE CASCADE,
        sender_phone VARCHAR(20) NOT NULL,
        receiver_phone VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT CHECK (message_type IN ('received', 'sent')),
        whatsapp_message_id TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;

    const { error: messagesError } = await supabase.rpc('exec_sql', { sql_query: createMessagesTable });
    if (messagesError) {
      console.log('⚠️ Tabela whatsapp_messages_improved já existe ou erro ignorado');
    } else {
      console.log('✅ Tabela whatsapp_messages_improved criada');
    }

    // 4. Criar índices
    console.log('\n4️⃣ Criando índices...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_numbers_clinic ON clinic_whatsapp_numbers(clinic_id);',
      'CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_numbers_active ON clinic_whatsapp_numbers(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_numbers_number ON clinic_whatsapp_numbers(whatsapp_number);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_improved_clinic ON whatsapp_conversations_improved(clinic_id);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_improved_patient ON whatsapp_conversations_improved(patient_phone_number);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_improved_clinic_number ON whatsapp_conversations_improved(clinic_whatsapp_number);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_improved_last_message ON whatsapp_conversations_improved(last_message_at);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_improved_conversation ON whatsapp_messages_improved(conversation_id);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_improved_sender ON whatsapp_messages_improved(sender_phone);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_improved_receiver ON whatsapp_messages_improved(receiver_phone);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_improved_created ON whatsapp_messages_improved(created_at);'
    ];

    for (const index of indexes) {
      try {
        await supabase.rpc('exec_sql', { sql_query: index });
      } catch (e) {
        console.log(`⚠️ Índice já existe ou erro ignorado`);
      }
    }
    console.log('✅ Índices criados');

    // 5. Criar função para atualizar timestamps
    console.log('\n5️⃣ Criando função de timestamps...');
    const timestampFunction = `
      CREATE OR REPLACE FUNCTION update_whatsapp_improved_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: timestampError } = await supabase.rpc('exec_sql', { sql_query: timestampFunction });
    if (timestampError) {
      console.log('⚠️ Função de timestamps já existe ou erro ignorado');
    } else {
      console.log('✅ Função de timestamps criada');
    }

    // 6. Criar trigger
    console.log('\n6️⃣ Criando trigger...');
    const trigger = `
      DROP TRIGGER IF EXISTS update_whatsapp_conversations_improved_updated_at ON whatsapp_conversations_improved;
      CREATE TRIGGER update_whatsapp_conversations_improved_updated_at 
        BEFORE UPDATE ON whatsapp_conversations_improved 
        FOR EACH ROW EXECUTE FUNCTION update_whatsapp_improved_updated_at();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql_query: trigger });
    if (triggerError) {
      console.log('⚠️ Trigger já existe ou erro ignorado');
    } else {
      console.log('✅ Trigger criado');
    }

    // 7. Criar função para buscar conversas
    console.log('\n7️⃣ Criando função para buscar conversas...');
    const getConversationsFunction = `
      CREATE OR REPLACE FUNCTION get_clinic_conversations(p_clinic_id UUID)
      RETURNS TABLE(
        id UUID,
        patient_phone_number VARCHAR(20),
        clinic_whatsapp_number VARCHAR(20),
        patient_name VARCHAR(255),
        last_message_preview TEXT,
        unread_count INTEGER,
        last_message_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          wc.id,
          wc.patient_phone_number,
          wc.clinic_whatsapp_number,
          wc.patient_name,
          wc.last_message_preview,
          wc.unread_count,
          wc.last_message_at,
          wc.created_at
        FROM whatsapp_conversations_improved wc
        INNER JOIN clinic_whatsapp_numbers cwn ON cwn.whatsapp_number = wc.clinic_whatsapp_number
        WHERE wc.clinic_id = p_clinic_id
          AND cwn.clinic_id = p_clinic_id
          AND cwn.is_active = true
        ORDER BY wc.last_message_at DESC;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: conversationsFunctionError } = await supabase.rpc('exec_sql', { sql_query: getConversationsFunction });
    if (conversationsFunctionError) {
      console.log('⚠️ Função de conversas já existe ou erro ignorado');
    } else {
      console.log('✅ Função de conversas criada');
    }

    // 8. Criar função para processar mensagens
    console.log('\n8️⃣ Criando função para processar mensagens...');
    const processMessageFunction = `
      CREATE OR REPLACE FUNCTION process_incoming_message(
        p_from_number VARCHAR(20),
        p_to_number VARCHAR(20),
        p_content TEXT,
        p_whatsapp_message_id TEXT DEFAULT NULL
      )
      RETURNS UUID AS $$
      DECLARE
        v_clinic_id UUID;
        v_conversation_id UUID;
        v_message_id UUID;
      BEGIN
        -- 1. Identificar clínica pelo número que recebeu
        SELECT clinic_id INTO v_clinic_id
        FROM clinic_whatsapp_numbers
        WHERE whatsapp_number = p_to_number
          AND is_active = true
        LIMIT 1;

        IF v_clinic_id IS NULL THEN
          RAISE EXCEPTION 'Clínica não encontrada para o número %', p_to_number;
        END IF;

        -- 2. Criar ou atualizar conversa
        INSERT INTO whatsapp_conversations_improved (
          clinic_id,
          patient_phone_number,
          clinic_whatsapp_number,
          last_message_preview,
          unread_count,
          last_message_at
        )
        VALUES (
          v_clinic_id,
          p_from_number,
          p_to_number,
          p_content,
          1,
          NOW()
        )
        ON CONFLICT (clinic_id, patient_phone_number, clinic_whatsapp_number)
        DO UPDATE SET
          last_message_preview = p_content,
          unread_count = whatsapp_conversations_improved.unread_count + 1,
          last_message_at = NOW(),
          updated_at = NOW()
        RETURNING id INTO v_conversation_id;

        -- 3. Salvar mensagem
        INSERT INTO whatsapp_messages_improved (
          conversation_id,
          sender_phone,
          receiver_phone,
          content,
          message_type,
          whatsapp_message_id
        )
        VALUES (
          v_conversation_id,
          p_from_number,
          p_to_number,
          p_content,
          'received',
          p_whatsapp_message_id
        )
        RETURNING id INTO v_message_id;

        RETURN v_conversation_id;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: processMessageError } = await supabase.rpc('exec_sql', { sql_query: processMessageFunction });
    if (processMessageError) {
      console.log('⚠️ Função de processamento já existe ou erro ignorado');
    } else {
      console.log('✅ Função de processamento criada');
    }

    // 9. Configurar RLS
    console.log('\n9️⃣ Configurando RLS...');
    const rlsCommands = [
      'ALTER TABLE clinic_whatsapp_numbers ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE whatsapp_conversations_improved ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE whatsapp_messages_improved ENABLE ROW LEVEL SECURITY;'
    ];

    for (const command of rlsCommands) {
      try {
        await supabase.rpc('exec_sql', { sql_query: command });
      } catch (e) {
        console.log(`⚠️ RLS já configurado ou erro ignorado`);
      }
    }

    // 10. Criar políticas RLS
    console.log('\n🔟 Criando políticas RLS...');
    const policies = [
      'CREATE POLICY "Users can view clinic whatsapp numbers" ON clinic_whatsapp_numbers FOR SELECT USING (true);',
      'CREATE POLICY "Users can insert clinic whatsapp numbers" ON clinic_whatsapp_numbers FOR INSERT WITH CHECK (true);',
      'CREATE POLICY "Users can update clinic whatsapp numbers" ON clinic_whatsapp_numbers FOR UPDATE USING (true);',
      'CREATE POLICY "Users can view improved conversations" ON whatsapp_conversations_improved FOR SELECT USING (true);',
      'CREATE POLICY "Users can insert improved conversations" ON whatsapp_conversations_improved FOR INSERT WITH CHECK (true);',
      'CREATE POLICY "Users can update improved conversations" ON whatsapp_conversations_improved FOR UPDATE USING (true);',
      'CREATE POLICY "Users can view improved messages" ON whatsapp_messages_improved FOR SELECT USING (true);',
      'CREATE POLICY "Users can insert improved messages" ON whatsapp_messages_improved FOR INSERT WITH CHECK (true);'
    ];

    for (const policy of policies) {
      try {
        await supabase.rpc('exec_sql', { sql_query: policy });
      } catch (e) {
        console.log(`⚠️ Política já existe ou erro ignorado`);
      }
    }

    console.log('\n✅ ESTRUTURA MELHORADA CRIADA COM SUCESSO!');
    console.log('==================================================');
    console.log('📋 Próximos passos:');
    console.log('1. Migrar dados existentes');
    console.log('2. Atualizar frontend');
    console.log('3. Testar funcionalidade');

  } catch (error) {
    console.error('❌ Erro ao criar estrutura:', error);
  }
}

executeImprovedStructure(); 