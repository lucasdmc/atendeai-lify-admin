const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Salva uma mensagem recebida no banco (tabela whatsapp_messages)
 * @param {Object} param0
 * @param {string} conversationId
 * @param {string} from
 * @param {string} messageText
 * @param {string} messageId
 * @param {number} timestamp
 */
async function saveReceivedMessage({ conversationId, from, messageText, messageId, timestamp }) {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .insert({
      conversation_id: conversationId,
      phone_number: from,
      content: messageText,
      message_type: 'received',
      timestamp: new Date(timestamp).toISOString(),
      whatsapp_message_id: messageId
    });
  if (error) {
    console.error('[Supabase] Erro ao salvar mensagem recebida:', error);
    throw error;
  }
  return data;
}

module.exports = {
  supabase,
  saveReceivedMessage
}; 