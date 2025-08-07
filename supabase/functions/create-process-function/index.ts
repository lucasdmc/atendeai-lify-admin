import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔧 Criando função process_incoming_message...')

    // SQL para criar a função
    const sql = `
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
    `

    // Executar o SQL
    const { error } = await supabaseClient.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Erro ao criar função:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Função criada com sucesso!')

    return new Response(
      JSON.stringify({ success: true, message: 'Função criada com sucesso' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 