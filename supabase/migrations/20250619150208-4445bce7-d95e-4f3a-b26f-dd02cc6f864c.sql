
-- Primeiro, vamos remover o constraint existente (se existir)
ALTER TABLE whatsapp_messages 
DROP CONSTRAINT IF EXISTS whatsapp_messages_message_type_check;

-- Agora vamos adicionar um constraint correto que aceita os valores que estamos usando
ALTER TABLE whatsapp_messages 
ADD CONSTRAINT whatsapp_messages_message_type_check 
CHECK (message_type IN ('sent', 'received'));
